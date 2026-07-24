import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { KanbanColuna, KanbanTarefa, RelatorioRevisaoItem, HospitalCriacao, InternacaoBusca } from '../types/api'
import { usePageHeader } from '../components/PageHeader'
import { Badge, OpAvatar, LoadingState } from '../components/ui'
import PacienteDrawer from '../components/PacienteDrawer'
import Toast from '../components/Toast'
import { useKanban, useResolverPendencia, useMarcarCobrado, useConcluirAnalise } from '../hooks/useKanban'
import { useConfirmarEncaixe, useCriarEncaixe, useDescartarRevisao } from '../hooks/useEncaixeRelatorio'
import { urlPdfPendencia, urlArquivoRelatorio, buscarInternacoes } from '../services/kanban.service'
import { apiUrl } from '../api/client'
import { usePrefetchInternacao } from '../hooks/useInternacao'
import { campoFaltanteInfo, motivoCensoTexto } from '../lib/pendenciaLabels'
import { labelCurto } from '../lib/datas'
import { nomeProprio } from '../lib/texto'

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
    key: 'refazer_analise',
    titulo: 'Analisar censo',
    descricao: 'A plataforma não extraiu os dados. Validar à mão.',
    cor: 'var(--danger)',
    corBg: 'var(--danger-bg)',
  },
  {
    key: 'revisao_relatorio',
    titulo: 'Revisão Relatório',
    descricao: 'Relatórios enviados aguardando encaixe numa internação.',
    cor: 'var(--accent)',
    corBg: 'var(--accent-soft)',
  },
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

// Colunas por PAPEL: o técnico vê só a análise técnica; o administrativo, as 4
// operacionais; o admin vê todas (as operacionais + a análise técnica, supervisão).
const COLUNAS_TECNICO = COLUNAS.filter((c) => c.key === 'analise_tecnica')
const COLUNAS_OPERACIONAL = COLUNAS.filter((c) => c.key !== 'analise_tecnica')
const COLUNAS_ADMIN = COLUNAS

const localStyles = `
/* grid-template-columns vem inline (nº de colunas depende do papel/board). */
.kb-busca-row{display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap}
.kb-busca-wrap{position:relative;display:inline-flex;align-items:center}
.kb-busca-icon{position:absolute;left:10px;color:var(--muted-2);pointer-events:none}
.kb-busca-clear{position:absolute;right:8px;border:none;background:transparent;color:var(--muted);font-size:13px;line-height:1;padding:4px;border-radius:5px;cursor:pointer}
.kb-busca-clear:hover{background:var(--surface-3);color:var(--ink)}
.kb-board{display:grid;gap:12px;align-items:start;transition:opacity .2s ease}
/* Refetch em andamento com dados anteriores em tela: esmaece o quadro (não bloqueia
   cliques), sinalizando "atualizando" sem piscar o loading — igual ao Gestor. */
.kb-board.atualizando{opacity:.55}
@media (prefers-reduced-motion:reduce){.kb-board{transition:none}}
@media (max-width:1400px){.kb-board{grid-template-columns:repeat(2,1fr)!important}}
@media (max-width:760px){.kb-board{grid-template-columns:1fr!important}}
.kb-col{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-md);display:flex;flex-direction:column;min-height:200px}
.kb-col-head{padding:11px 13px 9px;border-bottom:1px solid var(--border);border-top:3px solid var(--kb-cor);border-radius:var(--r-md) var(--r-md) 0 0;background:var(--surface)}
.kb-col-title-row{display:flex;align-items:center;gap:8px}
.kb-col-title{font-size:var(--t-md);font-weight:600;color:var(--ink)}
.kb-col-count{margin-left:auto;font-family:var(--font-mono);font-size:var(--t-sm);font-weight:700;color:#fff;background:var(--kb-cor);border-radius:99px;min-width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;padding:0 7px}
.kb-col-desc{font-size:var(--t-sm);color:var(--muted-2);margin-top:3px;line-height:1.4}
/* Faixa de instrução no topo da coluna (board do técnico): diz o que fazer ali. */
.kb-col-guia{margin:10px 12px 0;padding:9px 11px;background:var(--info-bg);border:1px solid var(--info);border-left:3px solid var(--info);border-radius:var(--r-sm);font-size:var(--t-md);color:var(--ink-2);line-height:1.4;display:flex;gap:8px;align-items:flex-start}
.kb-col-guia svg{flex-shrink:0;margin-top:1px;color:var(--info)}
.kb-col-body{padding:9px;display:flex;flex-direction:column;gap:8px;overflow-y:auto;max-height:calc(100vh - 240px)}
.kb-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm);padding:9px 11px;transition:border-color .14s,box-shadow .14s,transform .14s;position:relative}
.kb-card.clicavel{cursor:pointer}
/* Hover evidente: eleva o card, borda na cor primária e sombra mais forte —
   comunica claramente que o card é clicável. */
.kb-card.clicavel:hover{border-color:var(--primary-3);box-shadow:0 6px 18px rgba(21,92,168,.14);transform:translateY(-2px)}
.kb-card.clicavel:active{transform:translateY(0)}
/* Seta que aparece no hover, no canto do card, reforçando "abrir". */
.kb-card-abrir{position:absolute;top:11px;right:11px;opacity:0;color:var(--primary-3);transition:opacity .14s,transform .14s;transform:translateX(-3px)}
.kb-card.clicavel:hover .kb-card-abrir{opacity:1;transform:translateX(0)}
.kb-card-top{display:flex;align-items:flex-start;gap:7px}
.kb-card-nome{font-weight:600;font-size:var(--t-base);color:var(--ink-2);line-height:1.3;flex:1;min-width:0}
.kb-card-meta{font-size:var(--t-sm);color:var(--muted);margin-top:5px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.kb-card-atend{font-family:var(--font-mono)}
.kb-motivos{margin-top:6px;display:flex;flex-direction:column;gap:4px}
.kb-motivo{font-size:var(--t-sm);color:var(--danger);background:var(--danger-bg);border-radius:var(--r-sm);padding:4px 8px;line-height:1.35}
.kb-card-actions{margin-top:8px;display:flex;gap:8px;justify-content:flex-end;align-items:center}
/* Card de relatório: chips suaves de "campo faltante" (não é erro grave como o parsing). */
.kb-falta{margin-top:6px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.kb-falta-lbl{font-size:var(--t-sm);color:var(--muted)}
.kb-falta-chip{font-size:var(--t-xs);color:var(--warning-2);background:var(--warning-bg);border-radius:99px;padding:2px 8px;line-height:1.5}
/* Link "documento" (abre o anexo em nova guia) — discreto, à esquerda do rodapé. */
.kb-card-doc{margin-right:auto;display:inline-flex;align-items:center;gap:5px;font-size:var(--t-md);color:var(--accent);text-decoration:none}
.kb-card-doc:hover{text-decoration:underline}
.kb-empty{padding:22px 12px;text-align:center;color:var(--muted-2);font-size:var(--t-sm);line-height:1.5}
/* ── Card de análise técnica (board do técnico) ── */
/* Selo de status no topo do card: comunica de imediato que aguarda ação. */
.kb-at-status{display:inline-flex;align-items:center;gap:5px;font-size:var(--t-sm);font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--info);background:var(--info-bg);border-radius:99px;padding:3px 9px}
.kb-at-status .kb-at-dot{width:6px;height:6px;border-radius:50%;background:var(--info);flex-shrink:0}
/* Linha rotulada (Auditor / Data / Médico): rótulo esmaecido + valor legível. */
.kb-at-linha{display:flex;gap:6px;font-size:var(--t-sm);line-height:1.5}
.kb-at-linha-lbl{color:var(--muted-2);flex-shrink:0;min-width:52px}
.kb-at-linha-val{color:var(--ink-2)}
/* Bloco do texto do relatório do auditor: fundo suave + 3 linhas + rótulo. */
.kb-at-relbox{margin-top:8px;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-sm);padding:7px 9px}
.kb-at-relbox-lbl{font-size:var(--t-xs);text-transform:uppercase;letter-spacing:.07em;font-weight:700;color:var(--muted);margin-bottom:3px}
.kb-analise-preview{color:var(--ink-2);font-size:var(--t-sm);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;line-height:1.45}
.kb-at-relbox-vazio{color:var(--muted-2);font-size:var(--t-sm);font-style:italic}
/* Call-to-action no rodapé do card: deixa explícita a ação de dar parecer. */
.kb-at-cta{margin-top:8px;display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:8px;border-top:1px dashed var(--border)}
.kb-at-cta-txt{font-size:var(--t-sm);font-weight:600;color:var(--info)}
.kb-at-cta-icon{display:inline-flex;color:var(--info)}
.kb-dias{font-family:var(--font-mono);font-weight:600}
/* Modal de pendência: detalhes + link para o PDF (abre em outra aba) */
.kb-modal-back{position:fixed;inset:0;background:rgba(11,26,38,.45);backdrop-filter:blur(2px);z-index:60;display:flex;align-items:center;justify-content:center;padding:24px;animation:fadein .2s}
.kb-modal{background:var(--surface);border-radius:var(--r-md);width:520px;max-width:96vw;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 64px rgba(11,26,38,.28);animation:kbModalIn .24s cubic-bezier(.2,.7,.2,1)}
@keyframes kbModalIn{from{opacity:0;transform:translateY(10px) scale(.99)}to{opacity:1;transform:none}}
.kb-modal-head{display:flex;align-items:flex-start;gap:12px;padding:16px 18px;border-bottom:1px solid var(--border);flex-shrink:0}
.kb-modal-title{font-size:var(--t-lg);font-weight:600;color:var(--ink);line-height:1.3}
.kb-modal-sub{font-size:var(--t-md);color:var(--muted);margin-top:3px;display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.kb-modal-x{margin-left:auto;flex-shrink:0;display:inline-flex;padding:6px;border:0;background:transparent;color:var(--muted);cursor:pointer;border-radius:7px;transition:background .12s,color .12s}
.kb-modal-x:hover{background:var(--surface-3);color:var(--ink)}
.kb-modal-body{padding:18px;overflow-y:auto;display:flex;flex-direction:column;gap:16px}
.kb-modal-field-lbl{font-size:var(--t-sm);text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:var(--muted);margin-bottom:6px}
.kb-modal-field-val{font-size:var(--t-md);color:var(--ink-2)}
.kb-modal-pdf-link{display:inline-flex;align-items:center;gap:7px}
.kb-modal-foot{padding:14px 18px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;flex-shrink:0}
/* ── Formulário de encaixe de relatório (modal da coluna "Revisão Relatório") ── */
.rr-faltantes{display:flex;gap:6px;flex-wrap:wrap;margin:2px 0 4px}
.rr-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media (max-width:560px){.rr-grid{grid-template-columns:1fr}}
.rr-field label{display:block;font-size:var(--t-xs);color:var(--muted);margin-bottom:3px}
.rr-field input,.rr-field textarea,.rr-field select{width:100%;padding:7px 9px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface-2);font-size:var(--t-sm);font-family:inherit}
.rr-field textarea{min-height:64px;resize:vertical}
.rr-manual input{width:100%;padding:7px 9px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface-2);font-size:var(--t-sm)}
/* Cabeçalho do campo de internação: label + botão "+" para cadastrar paciente. */
.rr-field-head{display:flex;align-items:center;gap:10px;margin-bottom:3px}
.rr-field-head label{margin-bottom:0}
.rr-add-btn{margin-left:auto;display:inline-flex;align-items:center;gap:5px;border:1px solid var(--primary-3);background:var(--primary-soft);color:var(--primary-3);font-size:var(--t-sm);font-weight:600;padding:3px 10px;border-radius:99px;cursor:pointer;transition:background .12s}
.rr-add-btn:hover{background:var(--primary-soft-2,var(--accent-soft))}
/* Formulário de paciente novo — realçado para separar da edição do relatório acima. */
.rr-novo{border:1px dashed var(--border-strong);border-radius:var(--r-sm);padding:12px;background:var(--surface-2)}
.rr-novo-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.rr-novo-head>span{font-size:var(--t-sm);font-weight:700;color:var(--ink)}
.rr-voltar-btn{border:0;background:transparent;color:var(--accent);font-size:var(--t-sm);cursor:pointer;padding:2px}
.rr-voltar-btn:hover{text-decoration:underline}
/* Autocomplete de busca de internação (modo "internação existente"). */
.rr-busca{position:relative}
.rr-busca>input{width:100%;padding:7px 9px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface-2);font-size:var(--t-sm);font-family:inherit}
.rr-busca-lista{margin-top:4px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);max-height:220px;overflow-y:auto;display:flex;flex-direction:column}
.rr-busca-vazio{padding:10px 11px;font-size:var(--t-sm);color:var(--muted-2)}
.rr-busca-item{text-align:left;border:0;border-bottom:1px solid var(--border);background:transparent;padding:8px 11px;cursor:pointer;display:flex;flex-direction:column;gap:2px;transition:background .1s}
.rr-busca-item:last-child{border-bottom:0}
.rr-busca-item:hover{background:var(--surface-2)}
.rr-busca-item-nome{font-size:var(--t-sm);font-weight:600;color:var(--ink-2)}
.rr-busca-item-meta{font-size:var(--t-xs);color:var(--muted)}
/* Resumo do paciente selecionado. */
.rr-sel{display:flex;align-items:center;gap:10px;border:1px solid var(--primary-3);background:var(--primary-soft);border-radius:var(--r-sm);padding:8px 11px}
.rr-sel-info{display:flex;flex-direction:column;gap:2px;min-width:0}
.rr-sel-nome{font-size:var(--t-sm);font-weight:600;color:var(--ink-2)}
.rr-sel-meta{font-size:var(--t-xs);color:var(--muted)}
.rr-sel .rr-voltar-btn{margin-left:auto;flex-shrink:0}
.kb-modal-foot.split{justify-content:space-between}
`

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
  const resolver = useResolverPendencia()
  const cobrar = useMarcarCobrado()
  const prefetch = usePrefetchInternacao()
  const [drawerId, setDrawerId] = useState<number | null>(null)
  // Pendência aberta na modal de PDF (card de "Refazer análise").
  const [pendenciaAberta, setPendenciaAberta] = useState<KanbanTarefa | null>(null)
  // Relatório aberto na modal de encaixe (card de "Revisão Relatório").
  const [encaixeAberto, setEncaixeAberto] = useState<RelatorioRevisaoItem | null>(null)
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
  // Admin vê o quadro completo (5 colunas); técnico só a análise; demais, as 4 operacionais.
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
  // (abrir modal, mutação otimista). prefetch/resolver/cobrar e os setters de
  // useState já são estáveis, então as deps não mudam entre renders.
  const abrirPaciente = useCallback((t: KanbanTarefa) => {
    if (t.internacao_id) {
      prefetch(t.internacao_id)
      setDrawerId(t.internacao_id)
    }
  }, [prefetch])

  const onResolver = useCallback((t: KanbanTarefa) => {
    if (t.pendencia_id == null) return
    resolver.mutate(t.pendencia_id, {
      onSuccess: () => {
        setToast('Pendência resolvida')
        // Se a modal desta pendência estava aberta, fecha (ela saiu do quadro).
        setPendenciaAberta((atual) => (atual?.id === t.id ? null : atual))
      },
      onError: (e) => setToast(`Erro: ${(e as Error).message}`),
    })
  }, [resolver])

  const onCobrar = useCallback((t: KanbanTarefa) => {
    if (t.cobranca_id == null) return
    cobrar.mutate(t.cobranca_id, {
      onSuccess: () => setToast(`Cobrança de ${t.hospital_nome || 'hospital'} registrada`),
      onError: (e) => setToast(`Erro: ${(e as Error).message}`),
    })
  }, [cobrar])

  // Aberturas de modal via setter (estáveis) — encapsuladas para passar ao card
  // como handlers que recebem a própria tarefa, sem arrow inline por render.
  const abrirEncaixe = useCallback((t: KanbanTarefa) => {
    if (t.relatorio) setEncaixeAberto(t.relatorio)
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
                      onAbrirPendencia={setPendenciaAberta}
                      onAbrirEncaixe={abrirEncaixe}
                      onAbrirAnalise={setAnaliseAberta}
                      onPrefetch={prefetch}
                      onResolver={onResolver}
                      onCobrar={onCobrar}
                      resolvendo={resolver.isPending}
                      cobrando={cobrar.isPending}
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
      {pendenciaAberta && (
        <PendenciaModal
          tarefa={pendenciaAberta}
          onClose={() => setPendenciaAberta(null)}
          onResolver={() => onResolver(pendenciaAberta)}
          resolvendo={resolver.isPending}
        />
      )}
      {encaixeAberto && (
        <EncaixeModal
          item={encaixeAberto}
          hospitais={data?.hospitais_criacao ?? []}
          onClose={() => setEncaixeAberto(null)}
          onToast={setToast}
          onDone={() => setEncaixeAberto(null)}
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

// ── Card de tarefa ────────────────────────────────────────────────────────────
// memo: só re-renderiza quando SUA tarefa/props mudam. Os handlers recebem a
// própria tarefa (bind interno), então o pai passa funções ESTÁVEIS (useCallback)
// em vez de arrows inline — sem isso o memo nunca acertaria e todos os cards
// re-renderizariam a cada setState do quadro.
const KanbanCard = memo(function KanbanCard({ tarefa, onAbrir, onAbrirPendencia, onAbrirEncaixe, onAbrirAnalise, onPrefetch, onResolver, onCobrar, resolvendo, cobrando }: {
  tarefa: KanbanTarefa
  corBg: string
  onAbrir: (t: KanbanTarefa) => void
  onAbrirPendencia: (t: KanbanTarefa) => void
  onAbrirEncaixe: (t: KanbanTarefa) => void
  onAbrirAnalise: (t: KanbanTarefa) => void
  onPrefetch: (id: number) => void
  onResolver: (t: KanbanTarefa) => void
  onCobrar: (t: KanbanTarefa) => void
  resolvendo: boolean
  cobrando: boolean
}) {
  // Card de ANÁLISE TÉCNICA (board do técnico) — clica para abrir a modal de parecer.
  if (tarefa.analise_id != null) {
    return <AnaliseCard tarefa={tarefa} onAbrir={() => onAbrirAnalise(tarefa)} />
  }
  // Card de COBRANÇA (coluna "Cobrar censo") — por hospital, não por paciente. Tem
  // layout próprio (sem drawer/modal), então retorna cedo.
  if (tarefa.cobranca_id != null) {
    return <CobrancaCard tarefa={tarefa} onCobrar={() => onCobrar(tarefa)} cobrando={cobrando} />
  }

  // Card de relatório (coluna "Revisão Relatório"): abre a modal de ENCAIXE.
  // Também tem pendencia_id, então precisa ser testado ANTES de ehPendencia.
  const ehRelatorio = tarefa.relatorio != null
  // Pendência de parsing (coluna "Refazer análise"): abre a modal do PDF.
  const ehPendencia = !ehRelatorio && tarefa.pendencia_id != null
  const clicavel = ehRelatorio || ehPendencia || tarefa.internacao_id != null

  function onClickCard() {
    if (ehRelatorio) onAbrirEncaixe(tarefa)
    else if (ehPendencia) onAbrirPendencia(tarefa)
    else if (tarefa.internacao_id != null) onAbrir(tarefa)
  }
  // Prefetch dos dados do drawer no hover/foco (só quando há internação).
  const prefetchAoFocar = tarefa.internacao_id != null
    ? () => onPrefetch(tarefa.internacao_id as number)
    : undefined

  return (
    <article
      className={`kb-card${clicavel ? ' clicavel' : ''}`}
      onClick={clicavel ? onClickCard : undefined}
      onMouseEnter={prefetchAoFocar}
      onFocus={prefetchAoFocar}
    >
      {clicavel && (
        <span className="kb-card-abrir" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M7 7h10v10" /></svg>
        </span>
      )}
      <div className="kb-card-top">
        {tarefa.operadora_key && (
          <span title={tarefa.hospital_nome ?? undefined}>
            <OpAvatar opKey={tarefa.operadora_key} size={20} />
          </span>
        )}
        <span className="kb-card-nome">{nomeProprio(tarefa.titulo)}</span>
        {tarefa.dias_sem_relatorio != null && (
          <Badge variant={tarefa.dias_sem_relatorio > 7 ? 'danger' : 'warning'}>
            <span className="kb-dias">{tarefa.dias_sem_relatorio}d</span>
          </Badge>
        )}
      </div>

      <div className="kb-card-meta">
        {tarefa.hospital_nome && <span>{tarefa.hospital_nome}</span>}
        {tarefa.atendimento && (
          <>
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <span className="kb-card-atend">{tarefa.atendimento}</span>
          </>
        )}
        {/* No card de relatório o nome do arquivo já vira o link "documento" abaixo. */}
        {!ehRelatorio && tarefa.arquivo && (
          <>
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <span className="kb-card-atend">{tarefa.arquivo}</span>
          </>
        )}
      </div>

      {/* Card de RELATÓRIO: só o que falta capturar (chips). Documento e encaixe são
          ações internas do card — ficam na modal, aberta ao clicar. */}
      {ehRelatorio ? (
        tarefa.motivos && tarefa.motivos.length > 0 && (
          <div className="kb-falta">
            <span className="kb-falta-lbl">Falta:</span>
            {tarefa.motivos.map((m, i) => {
              const info = campoFaltanteInfo(m)
              return (
                <span className="kb-falta-chip" key={i} title={info.explicacao || undefined}>
                  {info.label}
                </span>
              )
            })}
          </div>
        )
      ) : (
        /* Motivos da pendência de parsing (censo) — por que a extração falhou. */
        tarefa.motivos && tarefa.motivos.length > 0 && (
          <div className="kb-motivos">
            {tarefa.motivos.map((m, i) => (
              <div className="kb-motivo" key={i}>{motivoCensoTexto(m)}</div>
            ))}
          </div>
        )
      )}

      {ehPendencia && (
        <div className="kb-card-actions">
          {tarefa.tem_pdf && (
            <span className="kb-card-atend" style={{ marginRight: 'auto', color: 'var(--primary-3)' }}>
              Abrir para ver o PDF
            </span>
          )}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={resolvendo}
            onClick={(e) => { e.stopPropagation(); onResolver(tarefa) }}
          >
            {resolvendo ? 'Resolvendo…' : 'Marcar resolvida'}
          </button>
        </div>
      )}
    </article>
  )
})

// ── Card de cobrança de censo (coluna "Cobrar censo") ─────────────────────────
// Um card por HOSPITAL que não enviou o censo do dia anterior. Não abre paciente;
// a única ação é "marcar cobrado" (o analista contatou o hospital).
function CobrancaCard({ tarefa, onCobrar, cobrando }: {
  tarefa: KanbanTarefa
  onCobrar: () => void
  cobrando: boolean
}) {
  return (
    <article className="kb-card">
      <div className="kb-card-top">
        {tarefa.operadora_key && (
          <span title={tarefa.operadora_key}>
            <OpAvatar opKey={tarefa.operadora_key} size={20} />
          </span>
        )}
        <span className="kb-card-nome">{nomeProprio(tarefa.titulo)}</span>
        {tarefa.dias_sem_censo != null && (
          <Badge variant={tarefa.dias_sem_censo > 3 ? 'danger' : 'warning'}>
            <span className="kb-dias">{tarefa.dias_sem_censo}d</span>
          </Badge>
        )}
      </div>

      <div className="kb-card-meta" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
        <span>
          <span style={{ color: 'var(--muted-2)' }}>Censo faltante de </span>
          {labelCurto(tarefa.data_ref) || '-'}
        </span>
        <span>
          <span style={{ color: 'var(--muted-2)' }}>Último censo </span>
          {tarefa.ultimo_censo
            ? `${labelCurto(tarefa.ultimo_censo)}${tarefa.dias_sem_censo != null ? ` (há ${tarefa.dias_sem_censo}d)` : ''}`
            : 'nunca enviou'}
        </span>
      </div>

      <div className="kb-card-actions">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={cobrando}
          onClick={onCobrar}
        >
          {cobrando ? 'Registrando…' : 'Marcar como cobrado'}
        </button>
      </div>
    </article>
  )
}

// ── Card de análise técnica (board do técnico) ────────────────────────────────
// Um card por relatório do auditor externo a analisar. Clica para abrir a modal de
// parecer (comentário + aprovar/rejeitar → gera o 2º relatório, do técnico interno).
function AnaliseCard({ tarefa, onAbrir }: { tarefa: KanbanTarefa; onAbrir: () => void }) {
  const rel = tarefa.relatorio_externo
  return (
    <article className="kb-card clicavel" onClick={onAbrir}>
      {/* Selo de status: comunica de cara que este card aguarda uma ação do técnico. */}
      <span className="kb-at-status">
        <span className="kb-at-dot" aria-hidden />
        Aguardando parecer
      </span>

      {/* Hospital (identificação principal do card). */}
      <div className="kb-card-top" style={{ marginTop: 9 }}>
        {tarefa.operadora_key && (
          <span title={tarefa.hospital_nome ?? undefined}>
            <OpAvatar opKey={tarefa.operadora_key} size={20} />
          </span>
        )}
        <span className="kb-card-nome">{tarefa.hospital_nome || tarefa.titulo}</span>
      </div>

      {/* Metadados do relatório do auditor, rotulados para leitura rápida. */}
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div className="kb-at-linha">
          <span className="kb-at-linha-lbl">Auditor</span>
          <span className="kb-at-linha-val">{rel?.medico || 'não informado'}</span>
        </div>
        <div className="kb-at-linha">
          <span className="kb-at-linha-lbl">Data</span>
          <span className="kb-at-linha-val">{labelCurto(rel?.data_visita) || 'sem data'}</span>
        </div>
      </div>

      {/* Trecho do relatório do auditor — o que o técnico vai avaliar. */}
      <div className="kb-at-relbox">
        <div className="kb-at-relbox-lbl">Relatório do auditor</div>
        {rel?.descricao
          ? <div className="kb-analise-preview">{rel.descricao}</div>
          : <div className="kb-at-relbox-vazio">Sem texto. Baixe o documento anexado ao abrir o card.</div>}
      </div>

      {/* Ação explícita: não deixa dúvida do que fazer com o card. */}
      <div className="kb-at-cta">
        <span className="kb-at-cta-txt">Abrir e dar parecer</span>
        <span className="kb-at-cta-icon" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </div>
    </article>
  )
}

// ── Modal de análise técnica ──────────────────────────────────────────────────
// O técnico lê o relatório do auditor externo, escreve o parecer e Aprova/Rejeita.
// Concluir grava o 2º relatório (Técnico Interno) e tira o card do quadro.
function AnaliseModal({ tarefa, onClose, onToast, onDone }: {
  tarefa: KanbanTarefa
  onClose: () => void
  onToast: (m: string) => void
  onDone: () => void
}) {
  const rel = tarefa.relatorio_externo
  const [comentario, setComentario] = useState('')
  const [baixando, setBaixando] = useState(false)
  const concluir = useConcluirAnalise()
  // Parecer é obrigatório para concluir (aprovar OU rejeitar): trava os botões.
  const semParecer = comentario.trim().length === 0

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Baixa o documento do relatório do auditor. Pede ao backend a signed URL (JSON,
  // autenticado) e baixa DIRETO dela — não do endpoint que redireciona. Seguir o
  // redirect 307 com fetch reenviava o Authorization ao domínio do Storage, que o
  // rejeita, corrompendo o arquivo. A signed URL é pública e não leva header.
  async function baixarDocumento() {
    if (!rel?.relatorio_id) return
    setBaixando(true)
    try {
      const { url, nome: nomeReal } = await urlArquivoRelatorio(rel.relatorio_id)
      if (!url) { onToast('Documento não disponível para este relatório.'); return }
      // Extensão vem do arquivo REAL (.docx/.pdf/…) — nunca fixar. Nome amigável:
      // hospital + data, com a extensão original preservada.
      const ext = nomeReal?.includes('.') ? nomeReal.slice(nomeReal.lastIndexOf('.')) : ''
      const partes = [tarefa.hospital_nome || 'relatorio', labelCurto(rel.data_visita)].filter(Boolean)
      const nome = `relatorio-auditor-${partes.join('-')}${ext}`.replace(/[/\\?%*:|"<>]/g, '-')
      const a = document.createElement('a')
      a.href = url
      a.download = nome
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e) {
      onToast(`Erro ao baixar: ${(e as Error).message}`)
    } finally {
      setBaixando(false)
    }
  }

  async function enviar(veredito: 'APROVADO' | 'REJEITADO') {
    if (tarefa.analise_id == null) return
    if (!comentario.trim()) { onToast('Escreva o comentário da análise antes de concluir.'); return }
    try {
      await concluir.mutateAsync({
        analiseId: tarefa.analise_id,
        payload: { comentario: comentario.trim(), veredito },
      })
      onToast(veredito === 'APROVADO' ? '✓ Relatório aprovado' : 'Relatório rejeitado')
      onDone()
    } catch (e) {
      onToast(`Erro: ${(e as Error).message}`)
    }
  }

  return (
    <div className="kb-modal-back" onClick={onClose}>
      <div className="kb-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="kb-modal-head">
          <div>
            <div className="kb-modal-title">{tarefa.hospital_nome || 'Análise técnica'}</div>
            <div className="kb-modal-sub">
              <span>Relatório do auditor externo</span>
              {rel?.data_visita && (
                <>
                  <span style={{ color: 'var(--border-strong)' }}>·</span>
                  <span>{labelCurto(rel.data_visita)}</span>
                </>
              )}
              {rel?.tem_arquivo && rel.relatorio_id && (
                <>
                  <span style={{ color: 'var(--border-strong)' }}>·</span>
                  {/* Baixa o documento (autenticado). Botão, não <a href>: o endpoint
                      exige o token Bearer, que um link simples não envia. */}
                  <button
                    type="button"
                    onClick={baixarDocumento}
                    disabled={baixando}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: 0, background: 'none', padding: 0, color: 'var(--accent)', cursor: baixando ? 'default' : 'pointer', font: 'inherit' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>
                    {baixando ? 'Baixando…' : 'Baixar documento'}
                  </button>
                </>
              )}
            </div>
          </div>
          <button type="button" className="kb-modal-x" onClick={onClose} aria-label="Fechar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="kb-modal-body">
          <div>
            <div className="kb-modal-field-lbl">Relatório do auditor externo</div>
            <div className="kb-modal-field-val" style={{ whiteSpace: 'pre-wrap' }}>
              {rel?.descricao || 'Sem texto no relatório (confira o documento anexado).'}
            </div>
            {rel?.medico && (
              <div className="kb-modal-field-val" style={{ color: 'var(--muted-2)', marginTop: 4 }}>
                Médico: {rel.medico}
              </div>
            )}
          </div>

          <div className="rr-field">
            <label>Parecer do técnico interno *</label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Descreva o que foi analisado (obrigatório para aprovar ou rejeitar)"
              style={{ minHeight: 96 }}
              autoFocus
            />
            {semParecer && (
              <div style={{ marginTop: 5, fontSize: 'var(--t-sm)', color: 'var(--muted-2)' }}>
                Escreva o parecer para poder concluir a análise.
              </div>
            )}
          </div>
        </div>

        <div className="kb-modal-foot split">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => enviar('REJEITADO')}
            disabled={concluir.isPending || semParecer}
            title={semParecer ? 'Escreva o parecer antes de concluir' : undefined}
          >
            {concluir.isPending ? 'Enviando…' : 'Rejeitar'}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => enviar('APROVADO')}
            disabled={concluir.isPending || semParecer}
            title={semParecer ? 'Escreva o parecer antes de concluir' : undefined}
          >
            {concluir.isPending ? 'Enviando…' : 'Aprovar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal de pendência: detalhes + PDF embutido ───────────────────────────────
// Abre ao clicar num card de "Refazer análise". Mostra o que a extração leu e o
// PDF original lado a lado, para o analista conferir/ajustar os dados.
function PendenciaModal({ tarefa, onClose, onResolver, resolvendo }: {
  tarefa: KanbanTarefa
  onClose: () => void
  onResolver: () => void
  resolvendo: boolean
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [carregandoPdf, setCarregandoPdf] = useState(true)

  // Busca a signed URL ao abrir. Fecha com Esc.
  useEffect(() => {
    let vivo = true
    if (tarefa.pendencia_id == null || !tarefa.tem_pdf) {
      setCarregandoPdf(false)
      return
    }
    urlPdfPendencia(tarefa.pendencia_id)
      .then(({ url }) => { if (vivo) setPdfUrl(url) })
      .finally(() => { if (vivo) setCarregandoPdf(false) })
    return () => { vivo = false }
  }, [tarefa.pendencia_id, tarefa.tem_pdf])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="kb-modal-back" onClick={onClose}>
      <div className="kb-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="kb-modal-head">
          <div>
            <div className="kb-modal-title">{nomeProprio(tarefa.titulo)}</div>
            <div className="kb-modal-sub">
              {tarefa.hospital_nome && <span>{tarefa.hospital_nome}</span>}
              {tarefa.arquivo && (
                <>
                  <span style={{ color: 'var(--border-strong)' }}>·</span>
                  <span className="kb-card-atend">{tarefa.arquivo}</span>
                </>
              )}
            </div>
          </div>
          <button type="button" className="kb-modal-x" onClick={onClose} aria-label="Fechar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="kb-modal-body">
          {tarefa.atendimento && (
            <div>
              <div className="kb-modal-field-lbl">Atendimento</div>
              <div className="kb-modal-field-val kb-card-atend">{tarefa.atendimento}</div>
            </div>
          )}
          {tarefa.motivos && tarefa.motivos.length > 0 && (
            <div>
              <div className="kb-modal-field-lbl">Por que caiu para análise</div>
              <div className="kb-motivos">
                {tarefa.motivos.map((m, i) => <div className="kb-motivo" key={i}>{motivoCensoTexto(m)}</div>)}
              </div>
            </div>
          )}

          {/* Acesso ao PDF original — abre em outra aba (sem visualizador embutido) */}
          <div>
            <div className="kb-modal-field-lbl">Documento de origem</div>
            {carregandoPdf ? (
              <div className="kb-modal-field-val" style={{ color: 'var(--muted-2)' }}>Carregando link…</div>
            ) : pdfUrl ? (
              <a
                className="btn btn-outline btn-sm kb-modal-pdf-link"
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M7 7h10v10" /></svg>
                Abrir PDF em nova aba
              </a>
            ) : (
              <div className="kb-modal-field-val" style={{ color: 'var(--muted-2)' }}>
                PDF de origem não disponível para esta pendência.
              </div>
            )}
          </div>
        </div>

        <div className="kb-modal-foot">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={resolvendo}
            onClick={onResolver}
          >
            {resolvendo ? 'Resolvendo…' : 'Marcar resolvida'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal de encaixe de relatório ─────────────────────────────────────────────
// Abre ao clicar num card da coluna "Revisão Relatório". Porta o formulário da
// antiga tela /relatorios/revisao: o revisor escolhe a internação (sugestão ou ID
// manual), pode editar data/médico/observações e confirma — grava o relatório na
// internação e resolve a pendência (o card sai do quadro). Descartar resolve sem gravar.
// Modo de encaixe: casar num paciente já existente (ID) ou cadastrar um novo.
type ModoEncaixe = 'existente' | 'criar'

function EncaixeModal({ item, hospitais, onClose, onToast, onDone }: {
  item: RelatorioRevisaoItem
  hospitais: HospitalCriacao[]
  onClose: () => void
  onToast: (m: string) => void
  onDone: () => void
}) {
  // "paciente" faltante = o nome não casou com nenhuma internação. Só nesse caso
  // faz sentido oferecer "cadastrar paciente novo" (senão já há internação casada).
  const semPaciente = item.campos_faltantes.includes('paciente')
  const [modo, setModo] = useState<ModoEncaixe>('existente')

  // Internação escolhida para o encaixe. Pré-selecionada com o match automático
  // (quando o nome casou). O analista pode buscar outra pelo nome e trocar.
  const [selecionada, setSelecionada] = useState<InternacaoBusca | null>(
    item.internacao_id != null
      ? { id: item.internacao_id, nome: item.nome_raw ?? '', hospital_nome: item.hospital_nome }
      : null,
  )
  const [descricao, setDescricao] = useState(item.descricao ?? '')
  const [medico, setMedico] = useState(item.medico ?? '')
  const [dataVisita, setDataVisita] = useState(item.data_relatorio ?? '')

  // Formulário de paciente novo (modo 'criar'). Nome vem do documento; hospital do
  // relatório quando veio, senão o analista escolhe no dropdown.
  const [novoNome, setNovoNome] = useState(item.nome_raw ?? '')
  const [novoHospital, setNovoHospital] = useState(item.hospital_key ?? '')
  const [novoAtendimento, setNovoAtendimento] = useState('')
  const [novaDataEntrada, setNovaDataEntrada] = useState('')
  const [novoLeito, setNovoLeito] = useState('')
  const [novaEspecialidade, setNovaEspecialidade] = useState('')

  const confirmar = useConfirmarEncaixe()
  const criar = useCriarEncaixe()
  const descartar = useDescartarRevisao()
  const ocupado = confirmar.isPending || criar.isPending || descartar.isPending

  const idEfetivo = selecionada?.id ?? null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function onConfirmar() {
    if (!idEfetivo) {
      onToast('Selecione o paciente antes de confirmar.')
      return
    }
    try {
      await confirmar.mutateAsync({
        pendenciaId: item.pendencia_id,
        payload: {
          internacao_id: idEfetivo,
          data_visita: dataVisita || null,
          medico: medico || null,
          descricao: descricao || null,
        },
      })
      onToast('✓ Relatório encaixado')
      onDone()
    } catch (e) {
      onToast(`Erro: ${(e as Error).message}`)
    }
  }

  async function onCriarEncaixar() {
    if (!novoHospital.trim()) { onToast('Escolha o hospital do paciente.'); return }
    if (!novoAtendimento.trim()) { onToast('Informe o atendimento do paciente.'); return }
    if (!novoNome.trim()) { onToast('Informe o nome do paciente.'); return }
    if (!novaDataEntrada.trim()) { onToast('Informe a data de entrada do paciente.'); return }
    try {
      const res = await criar.mutateAsync({
        pendenciaId: item.pendencia_id,
        payload: {
          paciente: {
            hospital_key: novoHospital.trim(),
            atendimento: novoAtendimento.trim(),
            nome: novoNome.trim(),
            data_entrada: novaDataEntrada,
            tipo_leito: novoLeito || null,
            especialidade: novaEspecialidade || null,
            medico: medico || null,
          },
          data_visita: dataVisita || null,
          medico: medico || null,
          descricao: descricao || null,
        },
      })
      // Se o (hospital, atendimento) já existia, o backend encaixou no existente
      // em vez de duplicar — avisa para o analista não achar que criou um paciente novo.
      onToast(res.ja_existia
        ? '✓ Paciente já existia. Relatório encaixado nele'
        : '✓ Paciente cadastrado e relatório encaixado')
      onDone()
    } catch (e) {
      onToast(`Erro: ${(e as Error).message}`)
    }
  }

  async function onDescartar() {
    try {
      await descartar.mutateAsync(item.pendencia_id)
      onToast('Entrada descartada')
      onDone()
    } catch (e) {
      onToast(`Erro: ${(e as Error).message}`)
    }
  }

  return (
    <div className="kb-modal-back" onClick={onClose}>
      <div className="kb-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="kb-modal-head">
          <div>
            <div className="kb-modal-title">{item.nome_raw || '(sem nome extraído)'}</div>
            <div className="kb-modal-sub">
              <span>{item.hospital_nome || 'Hospital não identificado'}</span>
              {item.arquivo && (
                <>
                  <span style={{ color: 'var(--border-strong)' }}>·</span>
                  <span className="kb-card-atend">{item.arquivo}</span>
                </>
              )}
              {item.tem_arquivo && (
                <>
                  <span style={{ color: 'var(--border-strong)' }}>·</span>
                  <a
                    href={apiUrl(`/relatorios/revisao/${item.pendencia_id}/arquivo`)}
                    target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}
                  >
                    abrir documento
                  </a>
                </>
              )}
            </div>
          </div>
          <button type="button" className="kb-modal-x" onClick={onClose} aria-label="Fechar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="kb-modal-body">
          {item.campos_faltantes.length > 0 && (
            <div>
              <div className="kb-modal-field-lbl">Não capturado do documento</div>
              <div className="rr-faltantes">
                {item.campos_faltantes.map((c) => {
                  const info = campoFaltanteInfo(c)
                  return (
                    <span key={c} title={info.explicacao || undefined}>
                      <Badge variant={info.variant}>{info.label}</Badge>
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          <div className="rr-grid">
            <div className="rr-field">
              <label>Data da visita</label>
              <input type="date" value={dataVisita || ''} onChange={(e) => setDataVisita(e.target.value)} />
            </div>
            <div className="rr-field">
              <label>Médico</label>
              <input value={medico} onChange={(e) => setMedico(e.target.value)} placeholder="Médico responsável" />
            </div>
          </div>

          <div className="rr-field">
            <label>Observações</label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Observações sobre o paciente" />
          </div>

          <div className="rr-field">
            {/* Cabeçalho do campo. Quando o nome não casou, um botão "+" ao lado
                abre o cadastro de paciente novo (o toggle antigo virou uma ação). */}
            <div className="rr-field-head">
              <label>Internação (paciente)</label>
              {semPaciente && modo === 'existente' && (
                <button
                  type="button" className="rr-add-btn"
                  onClick={() => setModo('criar')}
                  title="Cadastrar um paciente novo e encaixar o relatório nele"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  Cadastrar paciente
                </button>
              )}
            </div>

            {modo === 'existente' ? (
              <BuscaInternacao
                selecionada={selecionada}
                onSelecionar={setSelecionada}
                nomeSugerido={item.nome_raw ?? ''}
              />
            ) : (
              <div className="rr-novo">
                <div className="rr-novo-head">
                  <span>Novo paciente</span>
                  <button type="button" className="rr-voltar-btn" onClick={() => setModo('existente')}>
                    ← usar internação existente
                  </button>
                </div>
                <div className="kb-modal-field-val" style={{ color: 'var(--muted-2)', margin: '2px 0 8px' }}>
                  Cadastra a internação e encaixa o relatório nela num passo. Se este atendimento
                  já existir no hospital, o relatório vai para a internação existente (sem duplicar).
                </div>
                <div className="rr-grid">
                  <div className="rr-field">
                    <label>Nome do paciente *</label>
                    <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome completo" />
                  </div>
                  <div className="rr-field">
                    <label>Hospital *</label>
                    <select value={novoHospital} onChange={(e) => setNovoHospital(e.target.value)}>
                      <option value="">Selecione…</option>
                      {hospitais.map((h) => (
                        <option key={h.key} value={h.key}>{h.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="rr-field">
                    <label>Atendimento *</label>
                    <input
                      value={novoAtendimento}
                      onChange={(e) => setNovoAtendimento(e.target.value)}
                      placeholder="Nº de atendimento"
                    />
                  </div>
                  <div className="rr-field">
                    <label>Data de entrada *</label>
                    <input type="date" value={novaDataEntrada} onChange={(e) => setNovaDataEntrada(e.target.value)} />
                  </div>
                  <div className="rr-field">
                    <label>Leito</label>
                    <input value={novoLeito} onChange={(e) => setNovoLeito(e.target.value)} placeholder="Opcional" />
                  </div>
                  <div className="rr-field">
                    <label>Especialidade</label>
                    <input value={novaEspecialidade} onChange={(e) => setNovaEspecialidade(e.target.value)} placeholder="Opcional" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="kb-modal-foot split">
          <button className="btn btn-outline btn-sm" onClick={onDescartar} disabled={ocupado}>
            {descartar.isPending ? 'Descartando…' : 'Descartar'}
          </button>
          {modo === 'criar' ? (
            <button className="btn btn-primary btn-sm" onClick={onCriarEncaixar} disabled={ocupado}>
              {criar.isPending ? 'Cadastrando…' : 'Cadastrar e encaixar'}
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onConfirmar} disabled={ocupado || !selecionada}>
              {confirmar.isPending ? 'Confirmando…' : 'Confirmar encaixe'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Autocomplete de busca de internação ───────────────────────────────────────
// O analista digita o nome do paciente e escolhe da lista o mais compatível. Quando
// já há um selecionado (match automático ou escolha), mostra um resumo com "trocar".
function BuscaInternacao({ selecionada, onSelecionar, nomeSugerido }: {
  selecionada: InternacaoBusca | null
  onSelecionar: (i: InternacaoBusca | null) => void
  nomeSugerido: string
}) {
  // Termo de busca (semente = nome do documento) + debounce do termo consultado.
  const [termo, setTermo] = useState(nomeSugerido)
  const [termoBusca, setTermoBusca] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setTermoBusca(termo.trim()), 300)
    return () => clearTimeout(t)
  }, [termo])

  const { data, isFetching } = useQuery({
    queryKey: ['internacoes-busca', termoBusca],
    queryFn: () => buscarInternacoes(termoBusca),
    enabled: termoBusca.length >= 2,
    staleTime: 30_000,
  })
  const itens = data?.itens ?? []

  // Com um paciente já selecionado, mostra o resumo (sem a busca aberta).
  if (selecionada) {
    return (
      <div className="rr-sel">
        <div className="rr-sel-info">
          <span className="rr-sel-nome">{nomeProprio(selecionada.nome) || `Internação #${selecionada.id}`}</span>
          <span className="rr-sel-meta">
            {selecionada.hospital_nome && <>{selecionada.hospital_nome} · </>}
            #{selecionada.id}
            {selecionada.status === 'INTERNADO' && ' · internado'}
          </span>
        </div>
        <button type="button" className="rr-voltar-btn" onClick={() => onSelecionar(null)}>
          trocar
        </button>
      </div>
    )
  }

  return (
    <div className="rr-busca">
      <input
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        placeholder="Digite o nome do paciente…"
        autoFocus
      />
      {termoBusca.length >= 2 && (
        <div className="rr-busca-lista">
          {isFetching && <div className="rr-busca-vazio">Buscando…</div>}
          {!isFetching && itens.length === 0 && (
            <div className="rr-busca-vazio">Nenhum paciente encontrado. Use “Cadastrar paciente”.</div>
          )}
          {!isFetching && itens.map((i) => (
            <button type="button" key={i.id} className="rr-busca-item" onClick={() => onSelecionar(i)}>
              <span className="rr-busca-item-nome">{nomeProprio(i.nome) || `Internação #${i.id}`}</span>
              <span className="rr-busca-item-meta">
                {i.hospital_nome && <>{i.hospital_nome} · </>}
                {i.atendimento && <>at. {i.atendimento} · </>}
                {i.status === 'INTERNADO' ? 'internado' : 'alta'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
