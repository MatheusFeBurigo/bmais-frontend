// CSS local da tela de Logs. Reaproveita os tokens do design-system.css.
export const localStyles = `
.logs-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.logs-periodos{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:0}
.logs-periodos .tab-sec-btn{padding:5px 12px}
.logs-filtros{display:grid;grid-template-columns:minmax(200px,1.6fr) repeat(4,minmax(140px,1fr)) auto;gap:8px;align-items:center;padding:10px 12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);margin-bottom:10px}
@media (max-width:1100px){.logs-filtros{grid-template-columns:repeat(3,minmax(140px,1fr))}}
.logs-filtros .bm-input,.logs-filtros .bm-select{font-size:var(--t-sm);padding:6px 10px}
.logs-filtros .bm-select{padding-right:26px}
.logs-busca{position:relative}
.logs-busca svg{position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--muted-2);pointer-events:none}
.logs-busca .bm-input{padding-left:28px}
.logs-limpar{justify-self:end;white-space:nowrap}
.logs-atualizando{opacity:.6;transition:opacity .15s}
.logs-table tbody tr.logs-row{cursor:pointer}
.logs-table tbody tr.logs-row.aberta td{background:var(--surface-3)}
.logs-table tbody tr.logs-row.erro td:first-child{box-shadow:inset 3px 0 0 var(--danger)}
.logs-quando{white-space:nowrap;color:var(--ink-2)}
.logs-quando small{display:block;color:var(--muted-2);font-size:var(--t-xs);font-family:var(--font-mono)}
.logs-user{display:flex;align-items:center;gap:8px;min-width:0}
.logs-avatar{width:26px;height:26px;border-radius:7px;display:grid;place-items:center;font-weight:700;font-size:10px;color:#fff;flex-shrink:0;font-family:var(--font-mono);background:linear-gradient(135deg,var(--primary-3),var(--primary))}
.logs-avatar.removido{background:linear-gradient(135deg,#8595A6,#5F7384)}
.logs-user-txt{min-width:0;display:flex;flex-direction:column;gap:1px}
.logs-user-nome{display:block;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:190px;line-height:1.25}
.logs-user-email{display:block;font-size:var(--t-xs);color:var(--muted-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:190px;line-height:1.2}
.logs-user-btn{background:none;border:0;padding:0;text-align:left;cursor:pointer;font:inherit;color:inherit}
.logs-user-btn:hover .logs-user-nome{color:var(--primary-3);text-decoration:underline}
.logs-acao{display:flex;align-items:center;gap:8px;min-width:0}
.logs-resumo{color:var(--ink-2);line-height:1.35}
.logs-alvo-neg{display:block;font-weight:600;color:var(--ink);font-size:var(--t-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:420px}
.logs-detalhe td{background:var(--surface-2)!important;padding:10px 14px 14px 52px!important}
.logs-detalhe-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px 18px}
.logs-dk{font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:600;color:var(--muted);margin-bottom:2px}
.logs-dv{font-size:var(--t-sm);color:var(--ink-2);word-break:break-word}
.logs-dv pre{margin:0;font-family:var(--font-mono);font-size:10.5px;line-height:1.4;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:6px 8px;max-height:220px;overflow:auto;white-space:pre-wrap}
.logs-dv-lista{display:flex;flex-wrap:wrap;gap:4px}
.logs-dv-lista span{background:var(--surface);border:1px solid var(--border);border-radius:99px;padding:1px 8px;font-size:var(--t-xs)}
.logs-pager{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-top:1px solid var(--border);font-size:var(--t-sm);color:var(--muted)}
.logs-pager-btns{display:flex;gap:6px}
.logs-vazio{padding:40px 16px;text-align:center;color:var(--muted);font-size:var(--t-sm)}
.logs-num{font-family:var(--font-mono);font-variant-numeric:tabular-nums;text-align:right}
.logs-num.zero{color:var(--muted-3)}
.logs-num small{color:var(--danger);font-size:var(--t-xs);margin-left:4px}
.logs-atividade{display:flex;flex-direction:column;gap:1px;max-width:230px}
.logs-atividade-quando{color:var(--ink-2);font-size:var(--t-sm);white-space:nowrap}
.logs-atividade-oque{color:var(--muted);font-size:var(--t-xs);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.logs-acoes{display:flex;gap:5px;justify-content:flex-end;flex-wrap:nowrap}
.logs-acoes .btn{white-space:nowrap;padding:4px 9px}
/* Menu de ações por linha (details/summary, sem estado no React). */
.logs-menu{position:relative;display:inline-block}
.logs-menu>summary{list-style:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:4px 7px}
.logs-menu>summary::-webkit-details-marker{display:none}
.logs-menu-pop{position:absolute;right:0;top:calc(100% + 4px);z-index:20;min-width:186px;background:var(--surface);border:1px solid var(--border-strong);border-radius:var(--r-md);box-shadow:var(--shadow-lg);padding:4px;display:flex;flex-direction:column}
.logs-menu-pop button{display:flex;align-items:center;gap:7px;width:100%;padding:7px 10px;border:0;background:none;text-align:left;font:inherit;font-size:var(--t-sm);color:var(--ink-2);border-radius:var(--r-sm);cursor:pointer;white-space:nowrap}
.logs-menu-pop button:hover:not(:disabled){background:var(--surface-3)}
.logs-menu-pop button:disabled{opacity:.5;cursor:default}
.logs-menu-pop button.aviso{color:var(--warning-2)}
.logs-menu-pop button.perigo{color:var(--danger)}
.logs-menu-pop button.ok{color:var(--success-2)}
.logs-suspenso td{opacity:.72}
.logs-suspenso td:first-child{box-shadow:inset 3px 0 0 var(--warning)}
.logs-removido td{opacity:.6}
.logs-mini{display:inline-flex;gap:4px;flex-wrap:wrap}
.logs-mini span{font-family:var(--font-mono);font-size:10px;padding:1px 6px;border-radius:99px;background:var(--surface-3);border:1px solid var(--border);color:var(--muted)}
.logs-legenda{font-size:var(--t-xs);color:var(--muted-2);margin-top:8px}
`
