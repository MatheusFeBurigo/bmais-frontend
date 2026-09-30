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
.vol-toolbar{display:flex;gap:8px;align-items:center;flex-shrink:0}
.vol-toolbar .bm-select{font-size:var(--t-sm)}

/* Busca colapsada: só a lupa até o clique, e o campo cresce à esquerda dela
   para o seletor de ordem ao lado não dançar quando abre. */
.vol-busca{display:flex;align-items:center;border:1px solid transparent;border-radius:var(--r-sm);background:transparent;transition:border-color .16s,background-color .16s}
.vol-busca.aberta{border-color:var(--border);background:var(--surface)}
.vol-busca-btn{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;flex-shrink:0;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--muted);cursor:pointer;transition:color .14s,border-color .14s,background-color .14s}
.vol-busca-btn:hover{color:var(--ink);border-color:var(--border-strong)}
.vol-busca.aberta .vol-busca-btn{border-color:transparent;background:transparent;color:var(--primary-3)}
.vol-busca input{width:0;padding:0;border:0;background:transparent;font-size:var(--t-sm);opacity:0;transition:width .16s ease,opacity .16s ease,padding .16s ease}
.vol-busca.aberta input{width:170px;padding:5px 2px 5px 9px;opacity:1}
.vol-busca input:focus{outline:none;box-shadow:none}
@media (prefers-reduced-motion:reduce){
  .vol-busca,.vol-busca input,.vol-busca-btn{transition:none}
}
.vol-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;padding:2px 0}
.vol-av{width:32px;height:32px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-size:var(--t-sm);font-weight:700;letter-spacing:.02em;background:var(--surface-3);color:var(--ink-2);flex-shrink:0}

/* Cartão da pessoa: o bloco. Clicável inteiro (abre o drawer), mesmo hover
   dos cards de Tarefas para dizer "abre". */
.vol-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:14px 16px;display:flex;flex-direction:column;gap:10px;cursor:pointer;text-align:left;color:inherit;font:inherit;transition:border-color .14s,box-shadow .14s,transform .14s}
.vol-card:hover{border-color:var(--primary-3);box-shadow:0 6px 18px rgba(21,92,168,.14);transform:translateY(-2px)}
.vol-card:focus-visible{outline:2px solid var(--primary-3);outline-offset:2px}
.vol-card.sem-area{opacity:.75;border-style:dashed}
/* Casca do cartão: segura o ⋮ por cima do canto, fora do <button>. */
.vol-card-wrap{position:relative;display:flex;flex-direction:column}
.vol-card-wrap>.vol-card{flex:1}
.vol-card-wrap .vol-card-head{padding-right:26px}
.vol-menu{position:absolute;top:10px;right:6px}
.vol-menu-btn{width:26px;height:26px;display:grid;place-items:center;border:0;border-radius:6px;background:transparent;color:var(--muted);cursor:pointer}
.vol-menu-btn:hover,.vol-menu-btn[aria-expanded="true"]{background:var(--surface-3);color:var(--ink)}
.vol-menu-btn:focus-visible{outline:2px solid var(--primary-3);outline-offset:1px}
.vol-menu-lista{position:absolute;right:0;top:30px;z-index:5;min-width:170px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm);box-shadow:0 8px 24px rgba(11,26,38,.14);padding:4px}
.vol-menu-lista button{display:block;width:100%;text-align:left;border:0;background:transparent;padding:7px 10px;border-radius:6px;font:inherit;font-size:var(--t-sm);color:var(--ink);cursor:pointer}
.vol-menu-lista button:hover:not(:disabled){background:var(--surface-2)}
.vol-menu-lista button:disabled{color:var(--muted);cursor:default}
.vol-card-div{font-size:var(--t-sm);color:var(--primary-3);background:var(--primary-bg);border-radius:var(--r-sm);padding:4px 8px;align-self:flex-start}
.vol-card-head{display:flex;align-items:flex-start;gap:10px}
.vol-card-id{flex:1;min-width:0}
/* Nome inteiro: quebra em até duas linhas antes de cortar. */
.vol-card-nome{font-weight:600;font-size:var(--t-md);line-height:1.3;color:var(--ink);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow-wrap:anywhere}
.vol-card-sub{font-size:var(--t-sm);color:var(--muted);margin-top:2px;display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.vol-card-carga{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.vol-card-carga>div{display:flex;align-items:baseline;gap:6px;font-size:var(--t-sm);color:var(--muted)}
.vol-card-carga b{font-family:var(--font-mono);font-size:var(--t-2xl);font-weight:600;letter-spacing:-.03em;line-height:1.05;font-variant-numeric:tabular-nums;color:var(--ink)}
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
/* Quebra do hospital em linha ("● Sem relatório 32"): o número colado ao
   rótulo. Em coluna, ele ia para a borda do nome e flutuava ao lado das horas,
   lendo como uma segunda coluna de valores. */
.vol-hosp .vol-q{margin-top:6px;flex-direction:row;flex-wrap:wrap;gap:4px 14px}
.vol-hosp .vol-q li{gap:6px}
.vol-hosp .vol-q-label{flex:none}
.vol-hosp .vol-q-vazio{margin-top:4px}
.vol-hosp-n.zero{color:var(--muted);font-weight:500}
.vol-hosp-n{font-family:var(--font-mono);font-weight:600;font-size:var(--t-md);font-variant-numeric:tabular-nums;color:var(--ink);text-align:right;min-width:48px}
.vol-x{border:0;background:transparent;cursor:pointer;color:var(--muted);font-size:var(--t-lg);line-height:1;padding:2px 6px;border-radius:6px}
.vol-x:hover{color:var(--danger);background:var(--danger-bg)}
.vol-x:disabled{opacity:.4;cursor:default}

/* Hospitais sem cobertura */
.vol-sc{display:grid;grid-template-columns:28px 1fr minmax(180px,220px);gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-soft)}
.vol-sc:last-child{border-bottom:0}

/* Produtividade e distribuição */
.vol-prod{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}
@media (max-width:900px){.vol-prod{grid-template-columns:1fr}}
.vol-sub{font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:var(--muted);margin-bottom:10px}
.vol-prod-nota{margin-top:10px;font-size:var(--t-sm);color:var(--muted);line-height:1.45}
/* Demandas x distribuição: barra = parcela das demandas, traço = dos hospitais */
.vol-dxd{display:flex;flex-direction:column}
.vol-dxd-row{display:grid;grid-template-columns:minmax(140px,220px) minmax(0,1fr) 88px 88px;gap:16px;align-items:center;padding:10px 8px;border:0;border-bottom:1px solid var(--border-soft);background:transparent;font:inherit;color:inherit;text-align:left;width:100%}
button.vol-dxd-row{cursor:pointer;border-radius:6px}
button.vol-dxd-row:hover{background:var(--surface-2)}
button.vol-dxd-row:focus-visible{outline:2px solid var(--primary-3);outline-offset:-2px}
.vol-dxd-row b{font-family:var(--font-mono);font-weight:600;font-size:var(--t-sm);font-variant-numeric:tabular-nums;color:var(--ink);text-align:right}
.vol-dxd-cab{padding-top:0;padding-bottom:8px;cursor:default}
.vol-dxd-row:last-child{border-bottom:0}
.vol-dxd-row b.vazio{font-family:inherit;font-weight:400;color:var(--muted)}
.vol-dxd-cab span{font-size:10px;text-transform:uppercase;letter-spacing:.12em;font-weight:600;color:var(--muted)}
.vol-dxd-cab span:nth-child(n+3){text-align:right}
.vol-dxd-nome{font-size:var(--t-sm);color:var(--ink-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vol-dxd-row.sem .vol-dxd-nome{color:var(--danger);font-weight:600}
.vol-dxd-trilha{position:relative;height:10px;background:var(--surface-3);border-radius:4px}
.vol-dxd-barra{position:absolute;left:0;top:0;bottom:0;border-radius:4px;min-width:2px}
.vol-dxd-traco{position:absolute;top:-5px;bottom:-5px;width:2px;margin-left:-1px;background:var(--ink);border-radius:1px;box-shadow:0 0 0 1px var(--surface)}
/* Legenda alinhada com o texto das linhas (que têm 8px de respiro) */
.vol-dxd+.vol-legenda{padding:0 8px}
.vol-legenda i.vol-dxd-traco-leg{width:2px;height:12px;border-radius:1px;background:var(--ink)}

/* Legenda textual do semáforo (gráfico): a cor nunca vai sozinha */
.vol-legenda{display:flex;gap:8px 16px;flex-wrap:wrap;margin-top:12px;font-size:var(--t-sm);color:var(--muted)}
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
.vol-card-reg{display:flex;flex-wrap:wrap;gap:4px}
.vol-reg-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:999px;background:var(--surface-2);border:1px solid var(--border-soft);font-size:var(--t-sm);color:var(--muted);line-height:1.4}
.vol-reg-chip b{color:var(--ink);font-family:var(--font-mono);font-variant-numeric:tabular-nums}
.vol-reg-chip.mais{color:var(--muted)}

/* Cabeçalho de região dentro do drawer, com o subtotal daquela região */
.vol-reg-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin:14px 0 2px;padding-bottom:4px;border-bottom:1px solid var(--border-soft);font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:var(--muted)}
.vol-reg-head span:last-child{text-transform:none;letter-spacing:0;font-weight:600;font-size:var(--t-sm)}

/* Bloco "Por região": uma linha por região com os responsáveis */
.vol-reg-lista{display:flex;flex-direction:column;padding:0 18px 6px}
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

/* "Onde o tempo está indo": barra empilhada de 100% + legenda.
   O gap entre fatias é a PRÓPRIA superfície aparecendo (2px), nunca uma borda
   desenhada em volta do segmento. */
.vol-tpt{display:flex;flex-direction:column;gap:10px}
.vol-tpt-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:var(--muted)}
.vol-tpt-total{text-transform:none;letter-spacing:0;font-weight:600;font-size:var(--t-sm);color:var(--ink-2);font-family:var(--font-mono);font-variant-numeric:tabular-nums}
.vol-tpt-barra{display:flex;gap:2px;height:26px;border-radius:var(--r-sm);overflow:hidden;background:var(--surface)}
.vol-tpt.compacto .vol-tpt-barra{height:14px}
.vol-tpt-fatia{display:flex;align-items:center;justify-content:center;min-width:2px;transition:filter .12s}
.vol-tpt-fatia:hover{filter:brightness(1.08)}
.vol-tpt-fatia b{font-family:var(--font-mono);font-variant-numeric:tabular-nums;font-size:var(--t-sm);font-weight:700;color:#fff;letter-spacing:.01em}
.vol-tpt.compacto .vol-tpt-fatia b{display:none}
/* auto-fit (não auto-fill): com uma ou duas categorias as colunas vazias
   colapsam e a linha ocupa a largura toda, então o valor encosta na direita,
   alinhado com o "no total" do cabeçalho e com a quebra de cima. */
.vol-tpt-legenda{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:4px 16px}
.vol-tpt.compacto .vol-tpt-legenda{display:flex;flex-wrap:wrap;gap:4px 12px}
.vol-tpt-legenda li{display:flex;align-items:center;gap:7px;font-size:var(--t-sm);color:var(--muted);min-width:0}
.vol-tpt-legenda i{width:9px;height:9px;border-radius:3px;flex-shrink:0}
.vol-tpt-lbl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.vol-tpt-val{margin-left:auto;font-family:var(--font-mono);font-variant-numeric:tabular-nums;color:var(--ink);font-weight:600;flex-shrink:0}
.vol-tpt.compacto .vol-tpt-val{margin-left:0}
.vol-tpt-pct{font-family:var(--font-mono);font-variant-numeric:tabular-nums;flex-shrink:0;min-width:32px;text-align:right}
.vol-tpt.compacto .vol-tpt-pct{display:none}
@media (prefers-reduced-motion:reduce){
  .vol-tpt-fatia{transition:none}
}
`

// Modal "Dividir a carga". Separado do CSS da tela porque só o modal (e a
// réplica dele na Ajuda) o usa.
export const dividirStyles = `
.dv-sec{margin-bottom:18px}
.dv-sec:last-child{margin-bottom:0}
.dv-lbl{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:8px;font-size:var(--t-sm);font-weight:600;color:var(--ink)}
.dv-lbl span{font-weight:400;color:var(--muted)}
.dv-lista{border:1px solid var(--border);border-radius:var(--r-sm);overflow:hidden}
.dv-colega{display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;border:0;border-bottom:1px solid var(--border-soft);background:var(--surface);cursor:pointer;text-align:left;font:inherit;font-size:var(--t-sm);color:var(--ink)}
.dv-colega:last-child{border-bottom:0}
.dv-colega:hover{background:var(--surface-2)}
.dv-colega[aria-pressed="true"]{background:var(--primary-bg)}
.dv-colega input{margin:0;accent-color:var(--primary);flex-shrink:0}
.dv-colega-nome{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
.dv-colega-nivel{font-size:var(--t-xs);font-weight:600;white-space:nowrap}
.dv-colega-fila{font-size:var(--t-xs);color:var(--muted);white-space:nowrap;font-variant-numeric:tabular-nums}
.dv-periodo{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.dv-chip{border:1px solid var(--border);background:var(--surface);border-radius:999px;padding:4px 11px;font:inherit;font-size:var(--t-sm);color:var(--ink-2);cursor:pointer}
.dv-chip:hover{border-color:var(--primary-3)}
.dv-chip[aria-pressed="true"]{border-color:var(--primary);background:var(--primary-bg);color:var(--primary-3);font-weight:600}
.dv-datas{display:flex;gap:6px;align-items:center;font-size:var(--t-sm);color:var(--muted);margin-top:8px}
.dv-datas .bm-input{width:150px}
.dv-prev{border:1px solid var(--border);border-radius:var(--r-sm);overflow:hidden}
.dv-prev-item{display:flex;align-items:center;gap:12px;padding:8px 12px;border-bottom:1px solid var(--border-soft);font-size:var(--t-sm)}
.dv-prev-item:last-child{border-bottom:0}
.dv-prev-nome{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
.dv-prev-num{color:var(--muted);white-space:nowrap;font-variant-numeric:tabular-nums}
.dv-prev-num b{font-weight:600}
.dv-and{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--border-soft);border-radius:var(--r-sm);background:var(--surface-2);font-size:var(--t-sm);margin-bottom:6px}
.dv-and span{flex:1;min-width:0}
.dv-vazio{font-size:var(--t-sm);color:var(--muted);line-height:1.5}
`
