import { useCallback, useMemo, useState } from 'react'
import type { KanbanColuna, KanbanTarefa } from '../types/api'
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
import { AnaliseModal } from '../components/kanban/AnaliseModal'

// Definição de cada coluna: chave do payload, rótulo, cor de destaque e descrição.
// Colunas são CATEGORIAS de tarefa (não estágios de progresso).
const COLUNAS: Array<{
  key: KanbanColuna
  titulo: string
  descricao: string
  cor: string
  corBg: string
}> = [
  {
    key: 'sem_relatorio',
    titulo: 'Sem relatório',
    descricao: 'Internados que ainda não têm relatório de auditoria',
    cor: 'var(--warning)',
    corBg: 'var(--warning-bg)',
  },
  {
    key: 'cobrancas',
    titulo: 'Cobrar censo',
    descricao: 'Hospitais que não enviaram o censo do dia anterior',
    cor: 'var(--primary)',
    corBg: 'var(--primary-soft)',
  },
  {
    key: 'analise_tecnica',
    titulo: 'Análise técnica',
    descricao: 'Relatórios do auditor externo aguardando parecer do técnico interno',
    cor: 'var(--info)',
    corBg: 'var(--info-bg)',
  },
]

// Colunas por PAPEL: o técnico vê só a análise técnica; o administrativo, as
// operacionais; o admin vê todas (as operacionais + a análise técnica, supervisão).
const COLUNAS_TECNICO = COLUNAS.filter((c) => c.key === 'analise_tecnica')
const COLUNAS_OPERACIONAL = COLUNAS.filter((c) => c.key !== 'analise_tecnica')
const COLUNAS_ADMIN = COLUNAS


// Normaliza para busca: minúsculas e sem acentos, para "joao" casar com "João".
function normalizarBusca(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

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
  // Análise aberta na modal de parecer (card de "Análise técnica", board do técnico).
  const [analiseAberta, setAnaliseAberta] = useState<KanbanTarefa | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  // Busca de card: filtra por nome do paciente (titulo), atendimento e hospital,
  // em todas as colunas de uma vez. Sem acento e minúsculo para casar "joao"↔"João".
  const [busca, setBusca] = useState('')

  const tarefasRaw = data?.tarefas
  // Aplica a busca a cada coluna, preservando a estrutura por coluna do payload.
  const tarefas = useMemo(() => {
    if (!tarefasRaw) return tarefasRaw
    const q = normalizarBusca(busca)
    if (!q) return tarefasRaw
    const filtrado = {} as NonNullable<typeof tarefasRaw>
    for (const key of Object.keys(tarefasRaw) as Array<keyof typeof tarefasRaw>) {
      filtrado[key] = (tarefasRaw[key] ?? []).filter((t) =>
        normalizarBusca(
          `${t.titulo ?? ''} ${t.atendimento ?? ''} ${t.hospital_nome ?? ''}`,
        ).includes(q),
      )
    }
    return filtrado
  }, [tarefasRaw, busca])
  const ehTecnico = data?.papel === 'tecnico'
  const ehAdmin = data?.papel === 'admin'
  // Admin vê o quadro completo; técnico só a análise; demais, as operacionais.
  const colunas = ehTecnico ? COLUNAS_TECNICO : ehAdmin ? COLUNAS_ADMIN : COLUNAS_OPERACIONAL

  const total = tarefas
    ? colunas.reduce((s, c) => s + (tarefas[c.key]?.length ?? 0), 0)
    : 0

  usePageHeader({
    title: 'Tarefas / Kanban',
    subtitle: !total ? undefined
      : ehTecnico
        ? `${total} relatório${total > 1 ? 's' : ''} para analisar`
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

      {/* Busca de card: filtra todas as colunas por paciente/atendimento/hospital. */}
      {tarefasRaw && (
        <div className="kb-busca-row">
          <div className="kb-busca-wrap">
            <svg className="kb-busca-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <input
              type="text"
              className="bm-input"
              style={{ paddingLeft: 32, width: 300 }}
              placeholder="Buscar card por paciente, atendimento, hospital…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            {busca && (
              <button className="kb-busca-clear" onClick={() => setBusca('')} aria-label="Limpar busca" title="Limpar">✕</button>
            )}
          </div>
          {busca && (
            <span style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
              {total} resultado{total !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {tarefas && busca && total === 0 && (
        <div className="empty-state">Nenhum card encontrado para “{busca}”.</div>
      )}

      {tarefas && (
        <div
          className={`kb-board${atualizando ? ' atualizando' : ''}`}
          style={{
            gridTemplateColumns: `repeat(${colunas.length}, 1fr)`,
            // Board do técnico tem 1 coluna só; limita a largura para uma coluna de
            // leitura confortável em vez de esticar por toda a tela.
            ...(ehTecnico ? { maxWidth: 560 } : null),
          }}
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
                {/* Guia de uso no topo da coluna de análise técnica: explica o passo a passo. */}
                {col.key === 'analise_tecnica' && itens.length > 0 && (
                  <div className="kb-col-guia">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                    <span>Clique num relatório para lê-lo, escrever seu parecer e <strong>aprovar</strong> ou <strong>rejeitar</strong>.</span>
                  </div>
                )}
                <div className="kb-col-body">
                  {itens.map((t) => (
                    <KanbanCard
                      key={t.id}
                      tarefa={t}
                      corBg={col.corBg}
                      onAbrir={abrirPaciente}
                      onAbrirAnalise={setAnaliseAberta}
                      onPrefetch={prefetch}
                      onCobrar={onCobrar}
                      cobrando={cobrar.isPending}
                      somenteLeitura={somenteLeitura}
                    />
                  ))}
                  {itens.length === 0 && (
                    <div className="kb-empty">
                      {col.key === 'analise_tecnica'
                        ? 'Tudo em dia. Nenhum relatório do auditor aguardando seu parecer.'
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
      {analiseAberta && (
        <AnaliseModal
          tarefa={analiseAberta}
          onClose={() => setAnaliseAberta(null)}
          onToast={setToast}
          onDone={() => setAnaliseAberta(null)}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  )
}
