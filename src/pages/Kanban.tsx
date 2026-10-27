import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { KanbanTarefa } from '../types/api'
import type { CensoAlvo } from '../services/kanban.service'
import { usePageHeader } from '../components/PageHeader'
import { useAuth } from '../auth/AuthContext'
import { ehSomenteLeitura, podeExecutar, podeVer, podeVerFichaPaciente } from '../auth/permissions'
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
import { localStyles } from '../components/kanban/kanban.styles'
import { KanbanCard } from '../components/kanban/KanbanCard'
import { QuadroPendencias } from '../components/pendencias/QuadroPendencias'
import { useMinhasPendencias } from '../hooks/usePendencias'
import { KanbanFiltros } from '../components/kanban/KanbanFiltros'
import { ColunaInfo } from '../components/kanban/ColunaInfo'
import CensoDrawer from '../components/kanban/CensoDrawer'
import { AnotacaoCensoModal } from '../components/kanban/AnotacaoCensoModal'
import {
  ACOES_CENSO, desfazerAtualizadoSucesso, type AcaoCenso, type ExecutarCenso,
} from '../components/kanban/acoesCenso'
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
// A coluna "Em prorrogação" (01/10/2026) SAIU em 12/10/2026, a pedido do
// usuário: quem está prorrogado se acha pelo chip do Painel Operacional, e
// pausar/retomar ficou na ficha do paciente.
//
// A aba Pendências (27/10/2026) é a terceira: as pendências avulsas que o
// gestor e os coordenadores pedem, num quadro próprio (QuadroPendencias). Ela
// não vem do payload do quadro e não usa a barra de filtros dele.
type Quadro = 'pacientes' | 'censos' | 'pendencias'
const QUADROS: readonly Quadro[] = ['pacientes', 'censos', 'pendencias']

// Colunas de censo que não são tarefa: o hospital está em dia. Ficam no quadro
// (é o retrato de quem mandou), mas não entram no "N tarefas pendentes".
const SEM_ACAO = new Set(['aguardando_censo', 'censos_processados'])

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
  const { role } = useAuth()
  const somenteLeitura = ehSomenteLeitura(role)
  const prefetch = usePrefetchInternacao()
  const [drawerId, setDrawerId] = useState<number | null>(null)
  // Quem aprovou na ficha do paciente volta para cá com o aviso
  // (`state.aviso`, ver pages/Paciente).
  const location = useLocation()
  const avisoDaVolta = (location.state as { aviso?: string } | null)?.aviso
  const [toast, setToast] = useState<string | null>(avisoDaVolta ?? null)
  useEffect(() => {
    // Some do histórico: um F5 não repete o aviso.
    if (avisoDaVolta) navigate(location.pathname + location.search, { replace: true, state: null })
  }, [avisoDaVolta, location.pathname, location.search, navigate])
  // Recorte da tela: busca + chips de prioridade + hospital + ordenação. Tudo é
  // aplicado no cliente sobre o payload que já veio (o quadro inteiro está em
  // memória), então trocar de filtro não custa uma ida ao servidor.
  const [recorte, setRecorte] = useState<Recorte>({
    busca: '', chips: [], hospital: '', ordem: 'prioridade', operadora: '', atraso: '', ordemCenso: 'padrao',
  })
  // A aba pode vir no endereço (`?aba=pendencias`, do aviso de pendência nova).
  // `location.key` muda a cada navegação: o mesmo link, clicado de novo já em
  // Tarefas, volta a escolher a aba.
  const abaUrl = new URLSearchParams(location.search).get('aba') as Quadro | null
  const [quadroEscolhido, setQuadro] = useState<Quadro | null>(
    abaUrl && QUADROS.includes(abaUrl) ? abaUrl : null)
  useEffect(() => {
    if (abaUrl && QUADROS.includes(abaUrl)) setQuadro(abaUrl)
  }, [abaUrl, location.key])
  function escolherQuadro(q: Quadro) {
    setQuadro(q)
    // O endereço acompanha a aba: um F5 continua nela, e o aviso de pendência
    // nova sabe quando a aba Pendências está aberta.
    navigate(q === 'pendencias' ? '/tarefas?aba=pendencias' : '/tarefas', { replace: true })
  }

  const pendenciasAvulsas = useMinhasPendencias()
  const avulsas = pendenciasAvulsas.data
  const abertasAvulsas = (avulsas?.para_mim.length ?? 0) + (avulsas?.pedidas.length ?? 0)
  // A aba Pendências aparece para quem pode pedir e para quem tem alguma.
  const mostrarPendencias = podeExecutar(role, 'criarPendencia')
    || abertasAvulsas > 0 || (avulsas?.resolvidas?.length ?? 0) > 0

  const ehTecnico = data?.papel === 'tecnico'
  const ehAdmin = data?.papel === 'admin'
  // As abas de cada papel: técnico só pacientes; administrativo, censos e os
  // pacientes da aprovação; os demais, os dois. Pendências por último, para
  // quem a tem.
  const quadros: Quadro[] = [
    ...(ehTecnico ? ['pacientes'] as const : ehAdmin ? ['pacientes', 'censos'] as const : ['censos', 'pacientes'] as const),
    ...(mostrarPendencias ? ['pendencias'] as const : []),
  ]
  const quadro: Quadro = quadro_(quadroEscolhido, quadros)
  const naPendencias = quadro === 'pendencias'
  const colunas: ColunaKanban[] = naPendencias ? []
    : (quadro === 'censos' ? COLUNAS_CENSO : COLUNAS_PACIENTE)
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

  // Card de aprovação (13/10/2026): a análise é na ficha do paciente, com o
  // relatório aberto e Editar/Aprovar no rodapé dele. Quem não abre a ficha
  // (analista) vê o painel lateral, só leitura.
  const abrirAprovacao = useCallback((t: KanbanTarefa) => {
    if (!t.internacao_id || !t.relatorio) return
    if (!podeVerFichaPaciente(role)) {
      abrirPaciente(t)
      return
    }
    navigate(`/paciente/${t.internacao_id}?relatorio=${t.relatorio.id}&origem=tarefas`)
  }, [role, abrirPaciente, navigate])

  // Ação de censo com trava por card: um segundo pedido no mesmo card enquanto
  // o primeiro está no ar é ignorado.
  const mutacoes = {
    cobrar: cobrar.mutateAsync, desfazer: desfazer.mutateAsync, atualizar: atualizar.mutateAsync,
    anotar: anotarCenso.mutateAsync, desfazerAtualizado: desfazerAtualizado.mutateAsync,
  }
  const mutacoesRef = useRef(mutacoes)
  mutacoesRef.current = mutacoes
  const comTrava = useCallback(async (t: KanbanTarefa, fn: (alvo: CensoAlvo) => Promise<void>) => {
    if (!t.hospital_key) return
    const hk = chaveCenso(t)
    if (ocupadosRef.current.has(hk)) return
    ocupadosRef.current.add(hk)
    setOcupados(new Set(ocupadosRef.current))
    try {
      await fn({ hospitalKey: t.hospital_key, operadoraKey: t.operadora_key ?? '' })
    } finally {
      ocupadosRef.current.delete(hk)
      setOcupados(new Set(ocupadosRef.current))
    }
  }, [])
  // Já com a anotação. O erro sobe para a modal da anotação, que o mostra sem fechar.
  const executarCenso = useCallback<ExecutarCenso>((t, acao, anotacao) => comTrava(t, async (alvo) => {
    await mutacoesRef.current[acao]({ ...alvo, anotacao })
    setToast(ACOES_CENSO[acao].sucesso(t))
  }), [comTrava])
  // Desfazer a atualização vai direto, sem anotação (12/10/2026): quem aprova
  // desfaz, os demais abrem o pedido e o card fica com o aviso.
  const desfazerAtualizadoCenso = useCallback((t: KanbanTarefa) => comTrava(t, async (alvo) => {
    try {
      const res = await mutacoesRef.current.desfazerAtualizado(alvo)
      setToast(desfazerAtualizadoSucesso(t, res.solicitado))
    } catch (e) {
      setToast((e as Error).message || 'Não foi possível desfazer. Tente de novo.')
    }
  }), [comTrava])

  // Os botões do card não movem direto: a movimentação pede a anotação.
  const onCobrar = useCallback((t: KanbanTarefa) => setMovimento({ tarefa: t, acao: 'cobrar' }), [])
  const onDesfazer = useCallback((t: KanbanTarefa) => setMovimento({ tarefa: t, acao: 'desfazer' }), [])
  const onAtualizar = useCallback((t: KanbanTarefa) => setMovimento({ tarefa: t, acao: 'atualizar' }), [])

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
              : q === 'censos'
                ? { key: q, label: 'Censos', count: contarQuadro(COLUNAS_CENSO) }
                // As abertas (pendentes e aguardando), recebidas e pedidas.
                : { key: q, label: 'Pendências', count: abertasAvulsas }))}
            active={quadro}
            onChange={(k) => escolherQuadro(k as Quadro)}
          />
        </div>
      )}

      {/* Pendências avulsas (27/10/2026): aba própria, com as três situações. */}
      {data && naPendencias && <QuadroPendencias onAviso={setToast} />}

      {/* Barra de priorização: busca, chips de urgência, hospital e ordenação. */}
      {tarefasRaw && !naPendencias && (
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

      {tarefas && !naPendencias && total === 0 && totalGeral > 0 && (
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

      {tarefas && !naPendencias && (
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
                      onDesfazerAtualizado={desfazerAtualizadoCenso}
                      onAbrirCenso={abrirCenso}
                      cobrando={ocupados.has(chaveCenso(t))}
                      somenteLeitura={somenteLeitura}
                      onAbrirAprovacao={abrirAprovacao}
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
          onDesfazerAtualizado={desfazerAtualizadoCenso}
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
