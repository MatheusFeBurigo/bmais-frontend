import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { KanbanTarefa } from '../types/api'
import { usePageHeader } from '../components/PageHeader'
import { useAuth } from '../auth/AuthContext'
import { ehSomenteLeitura, podeExecutar, podeVer } from '../auth/permissions'
import { ACOES_NO_PAINEL } from '../lib/recursos'
import { LoadingState } from '../components/ui'
import PacienteDrawer from '../components/PacienteDrawer'
import Toast from '../components/Toast'
import Tabs from '../components/Tabs'
import {
  useAnotarCenso, useDesfazerAtualizado, useDesfazerCobranca, useKanban, useMarcarAtualizado,
  useMarcarCobrado,
} from '../hooks/useKanban'
import { usePrefetchInternacao } from '../hooks/useInternacao'
import { useEquipe } from '../hooks/useEquipe'
import { localStyles } from '../components/kanban/kanban.styles'
import { KanbanCard } from '../components/kanban/KanbanCard'
import { KanbanFiltros } from '../components/kanban/KanbanFiltros'
import { ColunaInfo } from '../components/kanban/ColunaInfo'
import CensoDrawer from '../components/kanban/CensoDrawer'
import { AnotacaoCensoModal } from '../components/kanban/AnotacaoCensoModal'
import { ACOES_CENSO, type AcaoCenso, type ExecutarCenso } from '../components/kanban/acoesCenso'
import { contarCensos, contarChips, recortarColuna, type Recorte } from '../components/kanban/prioridade'
// Definição de cada coluna (rótulo, cor, descrição) vive em components/kanban/
// colunas.ts: a Volumetria reusa os mesmos textos para a quebra de demandas.
import {
  COLUNAS_CENSO, COLUNAS_PACIENTE, type ColunaKanban,
} from '../components/kanban/colunas'

// Colunas por PAPEL, seguindo quem faz o trabalho: o administrativo persegue o
// censo que não chegou; o técnico cuida dos pacientes (a fila, o que agendou e a
// análise). Quem supervisiona os dois (admin, analista, gestor) alterna entre os
// dois quadros por abas: lado a lado seriam 7 colunas, e nenhuma teria largura
// para ser lida. O backend monta o payload com as mesmas regras; aqui é só a
// ordem de exibição.
//
// A aprovação de relatório (01/10/2026) mora no MESMO quadro de pacientes, em
// colunas à direita da fila: o técnico aprova o que o administrativo enviou, e o
// administrativo (que só recebe essas colunas de paciente) acompanha o que mandou
// e corrige o que voltou. O quadro mostra só as colunas que o payload trouxe.
//
// A prorrogação (01/10/2026) também: coluna "Em prorrogação" no quadro de
// pacientes, e não aba à parte (pedido do usuário). Quem administra pausa e
// retoma no próprio card.
type Quadro = 'pacientes' | 'censos'

// Colunas de censo que não são tarefa: o hospital está em dia. Ficam no quadro
// (é o retrato de quem mandou), mas não entram no "N tarefas pendentes".
// "Em prorrogação" também: é acompanhamento, e o card que pede ação (terminou)
// já vem no topo da coluna e em vermelho.
const SEM_ACAO = new Set(['aguardando_censo', 'censos_processados', 'em_prorrogacao'])

// Um card de censo = hospital + operadora: é a chave da trava de clique.
const chaveCenso = (t: KanbanTarefa) => `${t.hospital_key}|${t.operadora_key ?? ''}`

const VAZIO: Record<string, string> = {
  aguardando_visita: ACOES_NO_PAINEL ? 'Nenhuma visita marcada. Abra um paciente para agendar.' : 'Nenhuma visita marcada.',
  visitas_atrasadas: 'Nenhuma visita atrasada. Tudo dentro do prazo.',
  censos_atrasados: 'Nenhum hospital atrasado.',
  aguardando_retorno: 'Nenhuma cobrança esperando resposta.',
  aguardando_censo: 'Nenhum hospital aguardando o censo de hoje.',
  censos_processados: 'Nenhum censo atualizado hoje ainda.',
  aguardando_aprovacao: 'Nenhum relatório aguardando aprovação.',
  relatorios_devolvidos: 'Nenhum relatório devolvido.',
  em_prorrogacao: 'Nenhum paciente em prorrogação.',
}


// A aba escolhida, se o papel a tem; senão a primeira do papel.
function quadro_(escolhido: Quadro | null, quadros: Quadro[]): Quadro {
  return escolhido && quadros.includes(escolhido) ? escolhido : quadros[0]
}

export default function Kanban() {
  // O quadro já vem recortado ao escopo de hospitais/operadoras do analista pelo
  // backend (get_hospitais_permitidos) — sem filtro manual na tela.
  const { data, isLoading, isError, isFetching } = useKanban()
  // Refetch com dados anteriores em tela (staleTime venceu, ou pós-mutação): atenua
  // o quadro em vez de piscar loading — mesmo padrão do Gestor (.atualizando).
  const atualizando = isFetching && !isLoading
  const cobrar = useMarcarCobrado()
  const desfazer = useDesfazerCobranca()
  const atualizar = useMarcarAtualizado()
  const desfazerAtualizado = useDesfazerAtualizado()
  const anotarCenso = useAnotarCenso()
  const navigate = useNavigate()
  // Hospitais com ação em andamento. Por CARD, não `isPending` da mutação: um
  // estado só para o quadro trocava o botão de todos os atrasados para
  // "Registrando…" a cada clique, e parecia que vários tinham sido cobrados.
  const [ocupados, setOcupados] = useState<ReadonlySet<string>>(new Set())
  // Espelho em ref para a trava: ler o estado dentro do callback mudaria a
  // identidade dele a cada clique, e o memo de TODOS os cards cairia.
  const ocupadosRef = useRef(new Set<string>())
  // Card de censo aberto no drawer. O drawer recebe o card vivo, relido do
  // quadro pela chave (hospital|operadora), para seguir a coluna nova depois
  // de um movimento; este retrato fica de reserva se o card sumir.
  const [censoAberto, setCensoAberto] = useState<KanbanTarefa | null>(null)
  // Movimento pedido pelos botões do próprio card: abre a modal da anotação.
  const [movimento, setMovimento] = useState<{ tarefa: KanbanTarefa; acao: AcaoCenso } | null>(null)
  // Perfil de observação (analista interno): vê o quadro, mas não age nele.
  const { role, username } = useAuth()
  const somenteLeitura = ehSomenteLeitura(role)
  const podeAprovar = podeExecutar(role, 'aprovarRelatorio')
  const podeControlarProrrogacao = podeExecutar(role, 'controlarProrrogacao')
  const { data: equipe } = useEquipe()
  const medicos = useMemo(
    () => (equipe?.medicos ?? []).filter((m) => Boolean(m.ativo)).map((m) => m.nome),
    [equipe],
  )
  const prefetch = usePrefetchInternacao()
  const [drawerId, setDrawerId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  // Recorte da tela: busca + chips de prioridade + hospital + ordenação. Tudo é
  // aplicado no cliente sobre o payload que já veio (o quadro inteiro está em
  // memória), então trocar de filtro não custa uma ida ao servidor.
  const [recorte, setRecorte] = useState<Recorte>({
    busca: '', chips: [], hospital: '', ordem: 'prioridade', operadora: '', atraso: '', ordemCenso: 'padrao',
  })
  const [quadroEscolhido, setQuadro] = useState<Quadro | null>(null)

  const ehTecnico = data?.papel === 'tecnico'
  const ehAdmin = data?.papel === 'admin'
  // As abas de cada papel: técnico só pacientes; administrativo, censos e os
  // pacientes da aprovação; os demais, os dois.
  const quadros: Quadro[] = ehTecnico ? ['pacientes']
    : ehAdmin ? ['pacientes', 'censos'] : ['censos', 'pacientes']
  const quadro: Quadro = quadro_(quadroEscolhido, quadros)
  const colunas: ColunaKanban[] = (quadro === 'censos' ? COLUNAS_CENSO : COLUNAS_PACIENTE)
    .filter((c) => !data?.tarefas || c.key in data.tarefas)
  // Os chips clínicos não se aplicam a card de hospital: um chip ligado no
  // quadro de pacientes esvaziaria o de censos ao trocar de aba.
  // Operadora e atraso são o inverso: só existem no de censos.
  const recorteEfetivo = useMemo(
    () => (quadro === 'censos' ? { ...recorte, chips: [] } : { ...recorte, operadora: '', atraso: '' as const }),
    [quadro, recorte])

  const tarefasRaw = data?.tarefas
  // Opções do filtro de operadora tiradas dos próprios cards de censo: é
  // exatamente o que dá para filtrar, já no escopo do usuário.
  const operadorasCenso = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of COLUNAS_CENSO) {
      for (const t of tarefasRaw?.[c.key] ?? []) {
        if (t.operadora_key) m.set(t.operadora_key, t.operadora_nome || t.operadora_key)
      }
    }
    return [...m].map(([key, nome]) => ({ key, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [tarefasRaw])
  // Aplica o recorte a cada coluna, preservando a estrutura por coluna do payload.
  const tarefas = useMemo(() => {
    if (!tarefasRaw) return tarefasRaw
    const filtrado = {} as NonNullable<typeof tarefasRaw>
    for (const key of Object.keys(tarefasRaw) as Array<keyof typeof tarefasRaw>) {
      filtrado[key] = recortarColuna(tarefasRaw[key] ?? [], recorteEfetivo)
    }
    return filtrado
  }, [tarefasRaw, recorteEfetivo])

  // Contagem dos chips sobre o quadro INTEIRO (sem os demais filtros): o número
  // ao lado do chip precisa dizer quantos casos existem, não quantos sobraram do
  // recorte atual — senão marcar um chip zeraria os outros e esconderia o resto.
  const contagens = useMemo(() => {
    const todos = tarefasRaw
      ? (Object.values(tarefasRaw).flat().filter(Boolean) as KanbanTarefa[])
      : []
    return contarChips(todos)
  }, [tarefasRaw])
  // Mesma ideia para o quadro de censos: por operadora e por faixa de atraso.
  const contagensCenso = useMemo(
    () => contarCensos(COLUNAS_CENSO.flatMap((c) => tarefasRaw?.[c.key] ?? [])),
    [tarefasRaw])
  const total = tarefas
    ? colunas.reduce((s, c) => s + (tarefas[c.key]?.length ?? 0), 0)
    : 0
  // Total sem recorte: o contador "X de Y" da barra precisa do universo, para o
  // usuário perceber o quanto o filtro está escondendo.
  const totalGeral = tarefasRaw
    ? colunas.reduce((s, c) => s + (tarefasRaw[c.key]?.length ?? 0), 0)
    : 0

  const pendentes = tarefas
    ? colunas.filter((c) => !SEM_ACAO.has(c.key))
      .reduce((s, c) => s + (tarefas[c.key]?.length ?? 0), 0)
    : 0
  // Tamanho de cada quadro nas abas, sem recorte e só com o que é tarefa.
  const contarQuadro = (cols: ColunaKanban[]) => (tarefasRaw
    ? cols.filter((c) => !SEM_ACAO.has(c.key))
      .reduce((s, c) => s + (tarefasRaw[c.key]?.length ?? 0), 0)
    : 0)

  usePageHeader({
    title: 'Tarefas',
    subtitle: !pendentes ? undefined
      : `${pendentes} tarefa${pendentes > 1 ? 's' : ''} pendente${pendentes > 1 ? 's' : ''}`,
  })

  // Handlers estáveis (useCallback): identidade constante entre renders para que o
  // React.memo do KanbanCard evite re-renderizar todos os cards a cada setState
  // (abrir modal, mutação otimista). prefetch/cobrar e os setters de
  // useState já são estáveis, então as deps não mudam entre renders.
  const abrirPaciente = useCallback((t: KanbanTarefa) => {
    if (t.internacao_id) {
      prefetch(t.internacao_id)
      setDrawerId(t.internacao_id)
    }
  }, [prefetch])

  // Ação de censo, já com a anotação, com trava por card: um segundo pedido no
  // mesmo card enquanto o primeiro está no ar é ignorado. O erro sobe para a
  // modal da anotação, que o mostra sem fechar.
  const mutacoes = {
    cobrar: cobrar.mutateAsync, desfazer: desfazer.mutateAsync, atualizar: atualizar.mutateAsync,
    desfazerAtualizado: desfazerAtualizado.mutateAsync, anotar: anotarCenso.mutateAsync,
  }
  const mutacoesRef = useRef(mutacoes)
  mutacoesRef.current = mutacoes
  const executarCenso = useCallback<ExecutarCenso>(async (t, acao, anotacao) => {
    if (!t.hospital_key) return
    const hk = chaveCenso(t)
    if (ocupadosRef.current.has(hk)) return
    ocupadosRef.current.add(hk)
    setOcupados(new Set(ocupadosRef.current))
    try {
      await mutacoesRef.current[acao]({
        hospitalKey: t.hospital_key, operadoraKey: t.operadora_key ?? '', anotacao,
      })
      setToast(ACOES_CENSO[acao].sucesso(t))
    } finally {
      ocupadosRef.current.delete(hk)
      setOcupados(new Set(ocupadosRef.current))
    }
  }, [])

  // Os botões do card não movem direto: toda movimentação pede a anotação.
  const onCobrar = useCallback((t: KanbanTarefa) => setMovimento({ tarefa: t, acao: 'cobrar' }), [])
  const onDesfazer = useCallback((t: KanbanTarefa) => setMovimento({ tarefa: t, acao: 'desfazer' }), [])
  const onAtualizar = useCallback((t: KanbanTarefa) => setMovimento({ tarefa: t, acao: 'atualizar' }), [])
  const onDesfazerAtualizado = useCallback(
    (t: KanbanTarefa) => setMovimento({ tarefa: t, acao: 'desfazerAtualizado' }), [])

  const abrirCenso = useCallback((t: KanbanTarefa) => {
    if (t.hospital_key) setCensoAberto(t)
  }, [])
  // O card aberto, relido do quadro (vivo); o retrato se ele saiu do payload.
  const censoVivo = useMemo(() => {
    if (!censoAberto) return null
    const chave = chaveCenso(censoAberto)
    for (const c of COLUNAS_CENSO) {
      const achado = tarefasRaw?.[c.key]?.find((t) => chaveCenso(t) === chave)
      if (achado) return achado
    }
    return censoAberto
  }, [censoAberto, tarefasRaw])

  return (
    <>
      <style>{localStyles}</style>

      {isLoading && <LoadingState label="Carregando tarefas…" />}
      {isError && <div className="empty-state t-danger">Erro ao carregar o quadro.</div>}

      {/* Defesa contra descompasso backend/frontend: se o payload chegou mas SEM
          a chave `tarefas` (backend numa versão anterior, ainda não reiniciado),
          não quebra a tela — avisa em vez de renderizar branco. */}
      {data && !tarefas && (
        <div className="empty-state">
          Não foi possível montar o quadro (o serviço pode estar sendo atualizado).
          Recarregue em instantes.
        </div>
      )}

      {tarefasRaw && quadros.length > 1 && (
        <div style={{ marginBottom: 12 }}>
          <Tabs
            tabs={quadros.map((q) => (q === 'pacientes'
              ? { key: q, label: 'Pacientes', count: contarQuadro(COLUNAS_PACIENTE) }
              : { key: q, label: 'Censos', count: contarQuadro(COLUNAS_CENSO) }))}
            active={quadro}
            onChange={(k) => setQuadro(k as Quadro)}
          />
        </div>
      )}

      {/* Barra de priorização: busca, chips de urgência, hospital e ordenação. */}
      {tarefasRaw && (
        <KanbanFiltros
          censos={quadro === 'censos'}
          operadoras={operadorasCenso}
          recorte={recorte}
          onChange={setRecorte}
          contagens={contagens}
          contagensCenso={contagensCenso}
          hospitais={data?.filtros?.hospitais ?? []}
          totalVisivel={total}
          totalGeral={totalGeral}
        />
      )}

      {tarefas && total === 0 && totalGeral > 0 && (
        <div className="empty-state">
          Nenhum card corresponde aos filtros atuais.{' '}
          <button
            type="button"
            className="link-cell"
            onClick={() => setRecorte({ ...recorte, busca: '', chips: [], hospital: '', operadora: '', atraso: '' })}
          >
            Limpar filtros
          </button>
        </div>
      )}

      {tarefas && (
        <div
          className={`kb-board${atualizando ? ' atualizando' : ''}`}
          // minmax(N, 1fr): as colunas dividem a largura por igual e param de
          // encolher no mínimo. Sem o mínimo ficariam ilegíveis; sem o 1fr,
          // sobraria espaço vazio à direita em telas largas. O quadro de
          // pacientes tem 7 colunas (a fila, a aprovação e a prorrogação): com
          // o mínimo de 260px as últimas saíam da tela num monitor comum, então
          // ali ele é menor.
          style={{ gridTemplateColumns: `repeat(${colunas.length}, minmax(${colunas.length > 6 ? 170 : colunas.length > 4 ? 200 : 260}px, 1fr))` }}
        >
          {colunas.map((col) => {
            const itens = tarefas[col.key] ?? []
            return (
              <section className="kb-col" key={col.key} style={{ ['--kb-cor' as string]: col.cor }}>
                <header className="kb-col-head">
                  <div className="kb-col-title-row">
                    <span className="kb-col-title">{col.titulo}</span>
                    <ColunaInfo texto={col.descricao} />
                    <span className="kb-col-count">{itens.length}</span>
                  </div>
                </header>
                <div className="kb-col-body">
                  {itens.map((t) => (
                    <KanbanCard
                      key={t.id}
                      tarefa={t}
                      corBg={col.corBg}
                      onAbrir={abrirPaciente}
                      onPrefetch={prefetch}
                      onCobrar={onCobrar}
                      onDesfazer={onDesfazer}
                      onAtualizar={onAtualizar}
                      onDesfazerAtualizado={onDesfazerAtualizado}
                      onAbrirCenso={abrirCenso}
                      cobrando={ocupados.has(chaveCenso(t))}
                      somenteLeitura={somenteLeitura}
                      podeAprovar={podeAprovar}
                      podeControlarProrrogacao={podeControlarProrrogacao}
                      usuario={username}
                      medicos={medicos}
                      onAviso={setToast}
                    />
                  ))}
                  {itens.length === 0 && (
                    <div className="kb-empty">{VAZIO[col.key] ?? 'Nenhuma tarefa aqui'}</div>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {censoVivo && (
        <CensoDrawer
          tarefa={censoVivo}
          podeEscrever={!somenteLeitura}
          ocupado={ocupados.has(chaveCenso(censoVivo))}
          onExecutar={executarCenso}
          onClose={() => setCensoAberto(null)}
          onAbrirCadastro={
            podeVer(role, 'configuracoes')
              ? (key) => { setCensoAberto(null); navigate(`/configuracoes?hospital=${encodeURIComponent(key)}`) }
              : undefined
          }
        />
      )}

      {movimento && (
        <AnotacaoCensoModal
          tarefa={movimento.tarefa}
          acao={movimento.acao}
          onConfirmar={(texto) => executarCenso(movimento.tarefa, movimento.acao, texto)}
          onClose={() => setMovimento(null)}
        />
      )}

      {drawerId != null && (
        <PacienteDrawer
          internacaoId={drawerId}
          onClose={() => setDrawerId(null)}
          onSaved={(msg) => { setDrawerId(null); setToast(msg) }}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  )
}
