import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { KanbanTarefa } from '../types/api'
import { usePageHeader } from '../components/PageHeader'
import { useAuth } from '../auth/AuthContext'
import { ehSomenteLeitura, podeVer } from '../auth/permissions'
import { LoadingState } from '../components/ui'
import PacienteDrawer from '../components/PacienteDrawer'
import HospitalDetalhesModal from '../components/HospitalDetalhesModal'
import Toast from '../components/Toast'
import Tabs from '../components/Tabs'
import { useDesfazerCobranca, useKanban, useMarcarCobrado } from '../hooks/useKanban'
import { usePrefetchInternacao } from '../hooks/useInternacao'
import { localStyles } from '../components/kanban/kanban.styles'
import { KanbanCard } from '../components/kanban/KanbanCard'
import { KanbanFiltros } from '../components/kanban/KanbanFiltros'
import { ColunaInfo } from '../components/kanban/ColunaInfo'
import { contarChips, recortarColuna, type Recorte } from '../components/kanban/prioridade'
// Definição de cada coluna (rótulo, cor, descrição) vive em components/kanban/
// colunas.ts: a Volumetria reusa os mesmos textos para a quebra de demandas.
import { COLUNAS_CENSO, COLUNAS_PACIENTE, type ColunaKanban } from '../components/kanban/colunas'

// Colunas por PAPEL, seguindo quem faz o trabalho: o administrativo persegue o
// censo que não chegou; o técnico cuida dos pacientes (a fila, o que agendou e a
// análise). Quem supervisiona os dois (admin, analista, gestor) alterna entre os
// dois quadros por abas: lado a lado seriam 7 colunas, e nenhuma teria largura
// para ser lida. O backend monta o payload com as mesmas regras; aqui é só a
// ordem de exibição.
type Quadro = 'pacientes' | 'censos'

// Colunas de censo que não são tarefa: o hospital está em dia. Ficam no quadro
// (é o retrato de quem mandou), mas não entram no "N tarefas pendentes".
const SEM_ACAO = new Set(['aguardando_censo', 'censos_processados'])

// Um card de censo = hospital + operadora: é a chave da trava de clique.
const chaveCenso = (t: KanbanTarefa) => `${t.hospital_key}|${t.operadora_key ?? ''}`

const VAZIO: Record<string, string> = {
  aguardando_visita: 'Nenhuma visita marcada. Abra um paciente para agendar.',
  visitas_atrasadas: 'Nenhuma visita atrasada. Tudo dentro do prazo.',
  censos_atrasados: 'Nenhum hospital atrasado.',
  aguardando_retorno: 'Nenhuma cobrança esperando resposta.',
  aguardando_censo: 'Nenhum hospital aguardando o censo de hoje.',
  censos_processados: 'Nenhum censo de hoje recebido ainda.',
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
  const navigate = useNavigate()
  // Hospitais com ação em andamento. Por CARD, não `isPending` da mutação: um
  // estado só para o quadro trocava o botão de todos os atrasados para
  // "Registrando…" a cada clique, e parecia que vários tinham sido cobrados.
  const [ocupados, setOcupados] = useState<ReadonlySet<string>>(new Set())
  // Espelho em ref para a trava: ler o estado dentro do callback mudaria a
  // identidade dele a cada clique, e o memo de TODOS os cards cairia.
  const ocupadosRef = useRef(new Set<string>())
  const [hospitalFicha, setHospitalFicha] = useState<{ key: string; nome: string } | null>(null)
  // Perfil de observação (analista interno): vê o quadro, mas não age nele.
  const { role } = useAuth()
  const somenteLeitura = ehSomenteLeitura(role)
  const prefetch = usePrefetchInternacao()
  const [drawerId, setDrawerId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  // Recorte da tela: busca + chips de prioridade + hospital + ordenação. Tudo é
  // aplicado no cliente sobre o payload que já veio (o quadro inteiro está em
  // memória), então trocar de filtro não custa uma ida ao servidor.
  const [recorte, setRecorte] = useState<Recorte>({
    busca: '', chips: [], hospital: '', ordem: 'prioridade', operadora: '',
  })
  const [quadroEscolhido, setQuadro] = useState<Quadro>('pacientes')

  const ehTecnico = data?.papel === 'tecnico'
  const ehAdmin = data?.papel === 'admin'
  // Técnico só tem pacientes; administrativo só censos; os demais escolhem.
  const quadro: Quadro = ehTecnico ? 'pacientes' : ehAdmin ? quadroEscolhido : 'censos'
  const colunas: ColunaKanban[] = quadro === 'censos' ? COLUNAS_CENSO : COLUNAS_PACIENTE
  // Os chips clínicos não se aplicam a card de hospital: um chip ligado no
  // quadro de pacientes esvaziaria o de censos ao trocar de aba.
  // A operadora é o inverso: só existe no de censos.
  const recorteEfetivo = useMemo(
    () => (quadro === 'censos' ? { ...recorte, chips: [] } : { ...recorte, operadora: '' }),
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

  // Ação de censo com trava por hospital: um segundo clique no mesmo card
  // enquanto o primeiro está no ar é ignorado.
  const acaoCenso = useCallback((
    t: KanbanTarefa, mutate: typeof cobrar.mutate, sucesso: string,
  ) => {
    if (!t.hospital_key) return
    const hk = chaveCenso(t)
    if (ocupadosRef.current.has(hk)) return
    ocupadosRef.current.add(hk)
    setOcupados(new Set(ocupadosRef.current))
    mutate({ hospitalKey: t.hospital_key, operadoraKey: t.operadora_key ?? '' }, {
      onSuccess: () => setToast(sucesso),
      onError: (e) => setToast(`Erro: ${(e as Error).message}`),
      onSettled: () => {
        ocupadosRef.current.delete(hk)
        setOcupados(new Set(ocupadosRef.current))
      },
    })
  }, [])

  const onCobrar = useCallback((t: KanbanTarefa) => acaoCenso(
    t, cobrar.mutate,
    `${t.hospital_nome || 'Hospital'}${t.operadora_nome ? ` (${t.operadora_nome})` : ''} cobrado. Aguardando retorno`,
  ), [acaoCenso, cobrar.mutate])

  const onDesfazer = useCallback((t: KanbanTarefa) => acaoCenso(
    t, desfazer.mutate, `Cobrança de ${t.hospital_nome || 'hospital'} desfeita`,
  ), [acaoCenso, desfazer.mutate])

  const abrirHospital = useCallback((t: KanbanTarefa) => {
    if (t.hospital_key) setHospitalFicha({ key: t.hospital_key, nome: t.hospital_nome || t.titulo })
  }, [])

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

      {tarefasRaw && ehAdmin && (
        <div style={{ marginBottom: 12 }}>
          <Tabs
            tabs={[
              { key: 'pacientes', label: 'Pacientes', count: contarQuadro(COLUNAS_PACIENTE) },
              { key: 'censos', label: 'Censos', count: contarQuadro(COLUNAS_CENSO) },
            ]}
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
            onClick={() => setRecorte({ ...recorte, busca: '', chips: [], hospital: '', operadora: '' })}
          >
            Limpar filtros
          </button>
        </div>
      )}

      {tarefas && (
        <div
          className={`kb-board${atualizando ? ' atualizando' : ''}`}
          // minmax(260px, 1fr): as colunas dividem a largura por igual e param
          // de encolher em 260px. Sem o mínimo elas ficariam ilegíveis; sem o
          // 1fr, sobraria espaço vazio à direita em telas largas.
          style={{ gridTemplateColumns: `repeat(${colunas.length}, minmax(260px, 1fr))` }}
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
                      onAbrirHospital={abrirHospital}
                      cobrando={ocupados.has(chaveCenso(t))}
                      somenteLeitura={somenteLeitura}
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

      {hospitalFicha && (
        <HospitalDetalhesModal
          hospital={hospitalFicha}
          onClose={() => setHospitalFicha(null)}
          onAbrirCadastro={
            podeVer(role, 'configuracoes')
              ? (key) => { setHospitalFicha(null); navigate(`/configuracoes?hospital=${encodeURIComponent(key)}`) }
              : undefined
          }
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
