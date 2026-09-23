import { useCallback, useMemo, useState } from 'react'
import type { KanbanTarefa } from '../types/api'
import { usePageHeader } from '../components/PageHeader'
import { useAuth } from '../auth/AuthContext'
import { ehSomenteLeitura } from '../auth/permissions'
import { LoadingState } from '../components/ui'
import PacienteDrawer from '../components/PacienteDrawer'
import Toast from '../components/Toast'
import { useKanban, useMarcarCobrado } from '../hooks/useKanban'
import { usePrefetchInternacao } from '../hooks/useInternacao'
import { localStyles } from '../components/kanban/kanban.styles'
import { KanbanCard } from '../components/kanban/KanbanCard'
import { KanbanFiltros } from '../components/kanban/KanbanFiltros'
import { contarChips, recortarColuna, type Recorte } from '../components/kanban/prioridade'
// Definição de cada coluna (rótulo, cor, descrição) vive em components/kanban/
// colunas.ts: a Volumetria reusa os mesmos textos para a quebra de demandas.
import { COLUNAS } from '../components/kanban/colunas'

// Colunas por PAPEL, seguindo quem faz o trabalho: o administrativo persegue o
// censo que não chegou; o técnico cuida dos pacientes (a fila, o que agendou e a
// análise); o admin supervisiona os dois fluxos num só quadro. O backend monta o
// payload com as mesmas regras — aqui é só a ordem de exibição.
const COLUNAS_TECNICO = COLUNAS.filter((c) => c.key !== 'cobrancas')
const COLUNAS_OPERACIONAL = COLUNAS.filter((c) => c.key === 'cobrancas')
const COLUNAS_ADMIN = COLUNAS


export default function Kanban() {
  // O quadro já vem recortado ao escopo de hospitais/operadoras do analista pelo
  // backend (get_hospitais_permitidos) — sem filtro manual na tela.
  const { data, isLoading, isError, isFetching } = useKanban()
  // Refetch com dados anteriores em tela (staleTime venceu, ou pós-mutação): atenua
  // o quadro em vez de piscar loading — mesmo padrão do Gestor (.atualizando).
  const atualizando = isFetching && !isLoading
  const cobrar = useMarcarCobrado()
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
    busca: '', chips: [], hospital: '', ordem: 'prioridade',
  })

  const tarefasRaw = data?.tarefas
  // Aplica o recorte a cada coluna, preservando a estrutura por coluna do payload.
  const tarefas = useMemo(() => {
    if (!tarefasRaw) return tarefasRaw
    const filtrado = {} as NonNullable<typeof tarefasRaw>
    for (const key of Object.keys(tarefasRaw) as Array<keyof typeof tarefasRaw>) {
      filtrado[key] = recortarColuna(tarefasRaw[key] ?? [], recorte)
    }
    return filtrado
  }, [tarefasRaw, recorte])

  // Contagem dos chips sobre o quadro INTEIRO (sem os demais filtros): o número
  // ao lado do chip precisa dizer quantos casos existem, não quantos sobraram do
  // recorte atual — senão marcar um chip zeraria os outros e esconderia o resto.
  const contagens = useMemo(() => {
    const todos = tarefasRaw
      ? (Object.values(tarefasRaw).flat().filter(Boolean) as KanbanTarefa[])
      : []
    return contarChips(todos)
  }, [tarefasRaw])
  const ehTecnico = data?.papel === 'tecnico'
  const ehAdmin = data?.papel === 'admin'
  // Admin vê o quadro completo; técnico só a análise; demais, as operacionais.
  const colunas = ehTecnico ? COLUNAS_TECNICO : ehAdmin ? COLUNAS_ADMIN : COLUNAS_OPERACIONAL

  const total = tarefas
    ? colunas.reduce((s, c) => s + (tarefas[c.key]?.length ?? 0), 0)
    : 0
  // Total sem recorte: o contador "X de Y" da barra precisa do universo, para o
  // usuário perceber o quanto o filtro está escondendo.
  const totalGeral = tarefasRaw
    ? colunas.reduce((s, c) => s + (tarefasRaw[c.key]?.length ?? 0), 0)
    : 0

  usePageHeader({
    title: 'Tarefas',
    subtitle: !total ? undefined
      : `${total} tarefa${total > 1 ? 's' : ''} pendente${total > 1 ? 's' : ''}`,
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

  const onCobrar = useCallback((t: KanbanTarefa) => {
    if (t.cobranca_id == null) return
    cobrar.mutate(t.cobranca_id, {
      onSuccess: () => setToast(`Cobrança de ${t.hospital_nome || 'hospital'} registrada`),
      onError: (e) => setToast(`Erro: ${(e as Error).message}`),
    })
  }, [cobrar])

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

      {/* Barra de priorização: busca, chips de urgência, hospital e ordenação. */}
      {tarefasRaw && (
        <KanbanFiltros
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
            onClick={() => setRecorte({ ...recorte, busca: '', chips: [], hospital: '' })}
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
                    <span className="kb-col-count">{itens.length}</span>
                  </div>
                  <div className="kb-col-desc">{col.descricao}</div>
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
                      cobrando={cobrar.isPending}
                      somenteLeitura={somenteLeitura}
                    />
                  ))}
                  {itens.length === 0 && (
                    <div className="kb-empty">
                      {col.key === 'aguardando_visita'
                        ? 'Nenhuma visita marcada. Abra um paciente para agendar.'
                        : col.key === 'visitas_atrasadas'
                          ? 'Nenhuma visita atrasada. Tudo dentro do prazo.'
                          : 'Nenhuma tarefa aqui'}
                    </div>
                  )}
                </div>
              </section>
            )
          })}
        </div>
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
