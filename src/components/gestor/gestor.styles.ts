// Constantes de estilo e CSS local da tela Gestor.
// Extraído de pages/Gestor.tsx (god component) — cores/fontes dos gráficos Chart.js
// (que não lê CSS vars) e o blob de CSS da barra de filtros/cards de gráfico.

const GRID = '#EFF2F5'
const AXIS = '#8595A6'
// Tom escuro p/ rótulos de categoria (nomes) nos gráficos — Chart.js não lê CSS
// vars, então replicamos o --ink-2 do design system. Fonte um pouco maior p/ nomes.
const INK = '#1F3344'
const NOME_FONT = { family: 'Geist', size: 13, weight: 500 as const }
// Paleta escura e coesa dos gráficos do Gestor (tons profundos, validados p/
// luminosidade/croma/contraste/CVD). Centralizada para todos os gráficos usarem
// os mesmos hex. `Bg` são versões translúcidas para áreas de linha.
const COR = {
  azul: '#1A5DA8', azulBg: 'rgba(26,93,168,.10)',
  verde: '#0E7A53', verdeBg: 'rgba(14,122,83,.30)',
  laranja: '#C25E10', laranjaBg: 'rgba(194,94,16,.30)',
  roxo: '#6B34B8',
  vermelho: '#A01530',
} as const
// Fonte dos eixos/ticks dos gráficos — aumentada (10→12) para leitura mais fácil.
const MONO = { family: 'Geist Mono', size: 12 }
// Fonte dos títulos de eixo e legendas.
const AXIS_TITLE = { size: 12 as const }

export { GRID, AXIS, INK, NOME_FONT, COR, MONO, AXIS_TITLE }

export const localStyles = `
/* Barra de filtro no topo (operadora como pills) */
.gestor-topbar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:12px 16px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);margin-bottom:16px}
.topbar-lbl{font-size:11px;text-transform:uppercase;letter-spacing:.1em;font-weight:700;color:var(--muted);flex-shrink:0}
.op-pills{display:flex;gap:6px;flex-wrap:wrap;flex:1;min-width:0}
.pill-op{display:inline-flex;align-items:center;gap:7px;padding:5px 14px;border-radius:99px;font-size:var(--t-base);font-weight:500;cursor:pointer;border:1px solid var(--border);background:var(--surface);color:var(--ink-2);transition:background .12s,border-color .12s,color .12s;white-space:nowrap}
.pill-op:hover{border-color:var(--border-strong);color:var(--ink)}
/* Ponto colorido da operadora (sempre visível nas pills de operadora) */
.pill-op-dot{width:8px;height:8px;border-radius:50%;background:var(--op-cor);flex-shrink:0}
/* Ativa: pill inteiro na cor da operadora */
.pill-op-cor.active{background:var(--op-cor);border-color:var(--op-cor);color:#fff}
.pill-op-cor.active .pill-op-dot{background:rgba(255,255,255,.85)}
.pill-op-cor.active:hover{filter:brightness(.94)}
/* "Todas" ativa: neutro escuro (não tem cor de operadora) */
.pill-op.active-neutra{background:var(--ink);border-color:var(--ink);color:#fff}
.chart-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:16px 18px}
.chart-title{font-size:var(--t-base);font-weight:600;color:var(--ink);margin-bottom:2px}
.chart-hint{font-size:var(--t-sm);color:var(--muted-2);margin-bottom:12px}
.pill-faixa{display:inline-flex;align-items:center;gap:6px;padding:5px 13px;border-radius:99px;font-size:var(--t-base);font-weight:500;cursor:pointer;border:1px solid var(--border);background:var(--surface);color:var(--ink-2);transition:all .12s}
.pill-faixa.active{background:var(--ink);color:#fff;border-color:var(--ink)}
.tbl-gestor tbody tr{cursor:pointer}
.tbl-gestor tbody tr:hover td{background:var(--surface-3)}
.faixa-dot{width:8px;height:8px;border-radius:50%;display:inline-block;flex-shrink:0}
/* Barra de filtros ativos (chips removíveis + limpar tudo) */
.filtros-ativos{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.filtros-ativos-lbl{font-size:11px;text-transform:uppercase;letter-spacing:.1em;font-weight:700;color:var(--muted)}
.filtro-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 9px 5px 12px;border-radius:99px;border:1px solid var(--primary-3);background:rgba(21,92,168,.08);color:var(--primary-2);font-size:var(--t-base);font-weight:500;cursor:pointer;transition:background .12s}
.filtro-chip:hover{background:rgba(21,92,168,.16)}
.filtro-chip-tipo{color:var(--muted);font-weight:600}
.filtro-chip svg{opacity:.7}
.filtros-limpar{margin-left:2px}
/* Card do gráfico unificado: título + seletor de data + botão expandir/recolher */
.chart-head-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.chart-head-txt{flex:1;min-width:180px}
.chart-head-sub{font-size:var(--t-sm);color:var(--muted-2);margin-top:2px}
/* Título + dica na MESMA linha (dica ao lado do título) */
.chart-head-inline{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.chart-head-inline .chart-head-sub{margin-top:0;padding-left:10px;border-left:1px solid var(--border)}
/* Seletor de janela (30d/90d/6m/1a) — grupo segmentado compacto */
.janela-pills{display:inline-flex;gap:2px;padding:2px;background:var(--surface-2);border:1px solid var(--border);border-radius:99px;flex-shrink:0}
.pill-janela{padding:4px 14px;border-radius:99px;font-size:var(--t-sm);font-weight:600;cursor:pointer;border:0;background:transparent;color:var(--muted);transition:background .12s,color .12s;white-space:nowrap}
.pill-janela:hover{color:var(--ink-2)}
.pill-janela.active{background:var(--primary-3);color:#fff}
.sub-chart-lbl{font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:var(--muted)}
.sub-chart-sep{height:1px;background:var(--border);margin:26px 0 22px}
.chart-date{width:auto;flex-shrink:0}
.chart-toggle{display:inline-flex;align-items:center;gap:6px;flex-shrink:0}
.chart-chevron{flex-shrink:0;transition:transform .18s ease}
.chart-chevron.aberto{transform:rotate(180deg)}
/* Barra full-width de expandir (estado colapsado): vai de ponta a ponta */
.chart-expand-bar{display:flex;align-items:center;justify-content:space-between;gap:16px;width:100%;padding:14px 18px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);cursor:pointer;text-align:left;color:inherit;transition:background .12s,border-color .12s}
.chart-expand-bar:hover{background:var(--surface-2);border-color:var(--border-strong)}
.chart-expand-txt{display:flex;flex-direction:column;gap:2px;min-width:0}
.chart-expand-txt b{font-size:var(--t-base);font-weight:600;color:var(--ink)}
.chart-expand-txt span{font-size:var(--t-sm);color:var(--muted-2)}
.chart-expand-cta{display:inline-flex;align-items:center;gap:8px;flex-shrink:0;font-size:var(--t-base);font-weight:600;color:var(--primary-3)}
.chart-expand-bar:hover .chart-expand-cta{color:var(--primary-2)}
/* Chip da data selecionada — deixa o dia analisado bem evidente */
.dia-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border-radius:99px;background:var(--primary-3);color:#fff;font-family:var(--font-mono);font-size:var(--t-base);font-weight:600;letter-spacing:.01em;flex-shrink:0}
.dia-chip.com-remover{padding-right:5px}
.dia-chip-x{display:inline-flex;align-items:center;justify-content:center;margin-left:2px;padding:2px;border:0;border-radius:99px;background:rgba(255,255,255,.18);color:#fff;cursor:pointer;opacity:.85;transition:background .12s,opacity .12s}
.dia-chip-x:hover{background:rgba(255,255,255,.32);opacity:1}
.dia-chip svg{opacity:.85}
/* Data selecionada exibida ABAIXO da barra do gráfico recolhido */
.dia-abaixo{display:flex;align-items:center;gap:10px;margin-top:10px}
.dia-abaixo-lbl{font-size:var(--t-sm);text-transform:uppercase;letter-spacing:.08em;font-weight:600;color:var(--muted)}
/* Refetch (troca de dia/filtro): atenua sem sumir — nada de "recarregando" */
.gestor-conteudo{transition:opacity .2s ease}
.gestor-conteudo.atualizando{opacity:.55}
/* Transição de recolhimento/entrada do card do gráfico e dos dados do dia */
.chart-reveal{animation:chartReveal .28s cubic-bezier(.2,.7,.2,1)}
@keyframes chartReveal{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){.chart-reveal{animation:none}.gestor-conteudo{transition:none}}
`
