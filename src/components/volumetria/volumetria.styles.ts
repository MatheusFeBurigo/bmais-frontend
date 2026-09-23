// CSS local da tela Volumetria (injetado pela página), no molde de gestor.styles.
//
// Tipografia: só tokens do design system (--t-*), na mesma hierarquia das
// outras telas — micro-rótulos como `.kpi-label` (10px caixa alta), títulos de
// seção como `.sub-chart-lbl` do Gestor (11px caixa alta), números em Geist
// Mono com tabular-nums. Nada de px solto fora desses dois casos.
export const localStyles = `
/* Seletor de grupo (só o admin vê): Técnicos | Administrativos */
.vol-seg{display:inline-flex;gap:2px;padding:2px;background:var(--surface-2);border:1px solid var(--border);border-radius:99px;margin-bottom:16px}
.vol-seg button{padding:5px 16px;border-radius:99px;font-size:var(--t-sm);font-weight:600;cursor:pointer;border:0;background:transparent;color:var(--muted);transition:background .12s,color .12s}
.vol-seg button:hover{color:var(--ink-2)}
.vol-seg button.active{background:var(--primary-3);color:#fff}

/* Bloco "Equipe": barra de busca/ordem + grade de cartões */
.vol-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.vol-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;padding:2px 0}
.vol-av{width:32px;height:32px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-size:var(--t-sm);font-weight:700;letter-spacing:.02em;background:var(--surface-3);color:var(--ink-2);flex-shrink:0}

/* Cartão da pessoa: o bloco. Clicável inteiro (abre o drawer), mesmo hover
   dos cards de Tarefas para dizer "abre". */
.vol-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:14px 16px;display:flex;flex-direction:column;gap:10px;cursor:pointer;text-align:left;color:inherit;font:inherit;transition:border-color .14s,box-shadow .14s,transform .14s}
.vol-card:hover{border-color:var(--primary-3);box-shadow:0 6px 18px rgba(21,92,168,.14);transform:translateY(-2px)}
.vol-card:focus-visible{outline:2px solid var(--primary-3);outline-offset:2px}
.vol-card.sem-area{opacity:.75;border-style:dashed}
.vol-card-head{display:flex;align-items:flex-start;gap:10px}
.vol-card-id{flex:1;min-width:0}
.vol-card-nome{font-weight:600;font-size:var(--t-md);line-height:1.3;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vol-card-sub{font-size:var(--t-sm);color:var(--muted);margin-top:2px;display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.vol-card-carga{display:flex;align-items:baseline;gap:6px;font-size:var(--t-sm);color:var(--muted)}
.vol-card-carga b{font-family:var(--font-mono);font-size:var(--t-2xl);font-weight:600;letter-spacing:-.03em;line-height:1.05;font-variant-numeric:tabular-nums;color:var(--ink)}
.vol-card-bar{display:flex;align-items:center;gap:10px;font-size:var(--t-sm);color:var(--muted);white-space:nowrap}
.vol-card-bar .progress{flex:1}
.vol-card-vazio{font-size:var(--t-sm);color:var(--muted);line-height:1.45;padding:4px 0}
.vol-card-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:10px;border-top:1px solid var(--border-soft);font-size:var(--t-sm);color:var(--muted)}
.vol-card-cta{color:var(--primary-3);font-weight:600;white-space:nowrap}

/* Quebra de demandas: as mesmas linhas das colunas de Tarefas */
.vol-q{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px}
.vol-q li{display:flex;align-items:center;gap:8px;font-size:var(--t-sm);color:var(--ink-2)}
.vol-q i{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.vol-q-label{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.25}
.vol-q-label small{font-size:var(--t-xs);color:var(--muted)}
.vol-q b{font-family:var(--font-mono);font-weight:600;font-variant-numeric:tabular-nums;color:var(--ink)}
.vol-q-vazio{font-size:var(--t-sm);color:var(--muted)}

/* Drawer da pessoa (mesma casca de PacienteDrawer: header / body / footer) */
.vol-drawer-head{padding:18px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:14px;flex-shrink:0}
.vol-drawer-body{flex:1;overflow-y:auto;padding:20px 24px}
.vol-drawer-foot{padding:14px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px;flex-shrink:0}
.vol-drawer-x{margin-left:auto;border:0;background:transparent;cursor:pointer;color:var(--muted);font-size:var(--t-xl);line-height:1;padding:4px 8px;border-radius:6px}
.vol-drawer-x:hover{background:var(--surface-3);color:var(--ink)}

/* Indicadores no cabeçalho do drawer: número em destaque + micro-rótulo,
   a mesma escala do KPI, só menor (é um KPI da pessoa, não da rede) */
.vol-ind{display:flex;gap:22px;flex-wrap:wrap;margin:2px 0 14px}
.vol-ind div{display:flex;flex-direction:column;gap:3px}
.vol-ind b{font-family:var(--font-mono);font-size:var(--t-xl);font-weight:600;letter-spacing:-.02em;line-height:1.05;font-variant-numeric:tabular-nums;color:var(--ink)}
.vol-ind span{font-size:10px;text-transform:uppercase;letter-spacing:.12em;font-weight:600;color:var(--muted)}
/* Capacidade inline (h/dia) */
.vol-cap{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:var(--t-sm);color:var(--muted);margin-bottom:12px}
.vol-cap input{width:72px;text-align:right;font-family:var(--font-mono);font-variant-numeric:tabular-nums}
.vol-add{display:flex;gap:8px;align-items:center;margin:12px 0 14px}
.vol-add .hc-wrap{flex:1;min-width:0}
.vol-nota{padding:10px 12px;border-radius:8px;background:var(--warning-bg);color:var(--warning-2);font-size:var(--t-sm);margin-bottom:12px;line-height:1.45}
.vol-vazio{padding:32px 16px;text-align:center;color:var(--muted);font-size:var(--t-sm);line-height:1.5}

/* Hospital dentro do drawer: nome + quebra, horas, remover */
.vol-hosp{display:grid;grid-template-columns:28px 1fr auto auto;gap:10px;align-items:start;padding:10px 0;border-bottom:1px solid var(--border-soft)}
.vol-hosp:last-child{border-bottom:0}
.vol-hosp-nome{font-size:var(--t-base);line-height:1.3;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.vol-hosp-sub{font-size:var(--t-sm);line-height:1.3;color:var(--muted)}
.vol-hosp .vol-q{margin-top:6px}
.vol-hosp-n{font-family:var(--font-mono);font-weight:600;font-size:var(--t-md);font-variant-numeric:tabular-nums;color:var(--ink);text-align:right;min-width:48px}
.vol-x{border:0;background:transparent;cursor:pointer;color:var(--muted);font-size:var(--t-lg);line-height:1;padding:2px 6px;border-radius:6px}
.vol-x:hover{color:var(--danger);background:var(--danger-bg)}
.vol-x:disabled{opacity:.4;cursor:default}

/* Hospitais sem cobertura */
.vol-sc{display:grid;grid-template-columns:28px 1fr auto minmax(180px,220px);gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-soft)}
.vol-sc:last-child{border-bottom:0}

/* Legenda textual do semáforo (gráfico): a cor nunca vai sozinha */
.vol-legenda{display:flex;gap:16px;flex-wrap:wrap;margin-top:10px;font-size:var(--t-sm);color:var(--muted)}
.vol-legenda span{display:inline-flex;align-items:center;gap:6px}
.vol-legenda i{width:10px;height:10px;border-radius:3px;display:inline-block}

/* Blocos recolhíveis (comparativo, parâmetros) */
.vol-toggle{display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;cursor:pointer;color:var(--primary-3);font-size:var(--t-sm);font-weight:600;padding:4px 0;white-space:nowrap}

/* Formulário de parâmetros de carga */
.vol-param-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px 16px}
.vol-param{display:flex;flex-direction:column;gap:5px}
.vol-param label{font-size:10px;text-transform:uppercase;letter-spacing:.12em;font-weight:600;color:var(--muted)}
.vol-param .bm-input{width:100%;font-family:var(--font-mono);font-variant-numeric:tabular-nums}
.vol-param-sec{font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:var(--muted);margin:18px 0 10px;padding-top:14px;border-top:1px solid var(--border-soft)}
.vol-param-sec.primeira{margin-top:0;padding-top:0;border-top:0}
.vol-param-acoes{display:flex;gap:8px;align-items:center;margin-top:16px;flex-wrap:wrap}
.vol-param-meta{font-size:var(--t-sm);color:var(--muted);margin-left:auto}

/* Regiões no cartão da pessoa: onde a área dela se espalha */
.vol-card-reg{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}
.vol-reg-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:999px;background:var(--surface-2);border:1px solid var(--border-soft);font-size:var(--t-sm);color:var(--muted);line-height:1.4}
.vol-reg-chip b{color:var(--ink);font-family:var(--font-mono);font-variant-numeric:tabular-nums}
.vol-reg-chip.mais{color:var(--muted)}

/* Cabeçalho de região dentro do drawer, com o subtotal daquela região */
.vol-reg-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin:14px 0 2px;padding-bottom:4px;border-bottom:1px solid var(--border-soft);font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:var(--muted)}
.vol-reg-head span:last-child{text-transform:none;letter-spacing:0;font-weight:600;font-size:var(--t-sm)}

/* Bloco "Por região": uma linha por região com os responsáveis */
.vol-reg-lista{display:flex;flex-direction:column}
.vol-reg-linha{display:grid;grid-template-columns:minmax(150px,1fr) auto;gap:4px 12px;align-items:baseline;padding:10px 0;border-bottom:1px solid var(--border-soft)}
.vol-reg-linha:last-child{border-bottom:0}
.vol-reg-nome{display:flex;align-items:center;gap:6px;font-size:var(--t-base);font-weight:600;color:var(--ink);min-width:0}
.vol-reg-nums{display:flex;gap:14px;flex-wrap:wrap;justify-content:flex-end;font-size:var(--t-sm);color:var(--muted)}
.vol-reg-nums b{color:var(--ink);font-family:var(--font-mono);font-variant-numeric:tabular-nums}
.vol-reg-resp{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:4px}
.vol-reg-pessoa{border:1px solid var(--border-soft);background:var(--surface-2);border-radius:999px;padding:2px 9px;font-size:var(--t-sm);color:var(--primary-3);cursor:pointer;line-height:1.5}
.vol-reg-pessoa:hover{background:var(--primary-bg);border-color:var(--primary)}
@media (max-width:640px){
  .vol-reg-linha{grid-template-columns:1fr}
  .vol-reg-nums{justify-content:flex-start}
}
`
