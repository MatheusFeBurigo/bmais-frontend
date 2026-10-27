// Estilos das pendências avulsas (aba Pendências de Tarefas, Distribuição e a modal).
// O card tem o desenho do `.kb-card` do quadro (a pendência é uma demanda como
// as outras), mas os estilos são próprios: a Distribuição não carrega os do quadro.
export const estilosPendencias = `
.pd-painel{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:12px 14px;margin-bottom:14px}
.pd-cab{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.pd-cab-tit{font-size:var(--t-base);font-weight:600;color:var(--ink)}
.pd-cab-n{font-family:var(--font-mono);font-size:var(--t-sm);font-weight:600;color:var(--muted)}
.pd-cab .btn{margin-left:auto}
.pd-grupo{margin-top:10px}
.pd-grupo-tit{font-size:var(--t-xs);font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);margin-bottom:6px}
.pd-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px}
.pd-lista{display:grid;gap:8px}
.pd-vazio{font-size:var(--t-sm);color:var(--muted);margin-top:6px}
.pd-card{background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--info);border-radius:var(--r-sm);padding:9px 11px}
.pd-card.pd-aguardando{border-left-color:var(--warning)}
.pd-card.pd-resolvida{border-left-color:var(--success);background:var(--surface-2)}
.pd-card.pd-resolvida .pd-titulo{color:var(--ink-3)}
.pd-card.pd-vencida{border-left-color:var(--danger)}
.pd-titulo{font-weight:600;font-size:var(--t-base);color:var(--ink-2);line-height:1.3;overflow-wrap:anywhere}
.pd-desc{font-size:var(--t-sm);color:var(--ink-2);margin-top:5px;white-space:pre-wrap;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.pd-meta{font-size:var(--t-sm);color:var(--muted);margin-top:5px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.pd-com strong{color:var(--ink-2);font-weight:600}
.pd-tag{font-size:var(--t-xs);font-weight:600;border-radius:99px;padding:2px 8px;line-height:1.5;white-space:nowrap}
.pd-tag-vencida{color:var(--danger);background:var(--danger-bg)}
.pd-tag-hoje{color:var(--caution);background:var(--caution-bg)}
.pd-tag-prazo{color:var(--muted);background:var(--surface-3)}
.pd-acoes{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap;margin-top:8px}
.pd-erro{font-size:var(--t-sm);margin-right:auto}
.pd-concluir:not(:disabled){color:var(--success);border-color:var(--success)}
.pd-aguardar:not(:disabled){color:var(--warning-2);border-color:var(--warning)}
/* Aba Pendências de Tarefas: a barra de cima e as três colunas. */
.pd-barra{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.pd-barra .btn{margin-left:auto}
.pd-quadro{display:grid;grid-template-columns:repeat(3,minmax(240px,1fr));gap:12px;align-items:start}
.pd-rodape-col{font-size:var(--t-xs);color:var(--muted);padding:0 10px 10px}
@media (max-width:900px){.pd-quadro{grid-template-columns:1fr}}
.pd-campo{display:grid;gap:4px}
.pd-par{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}
@media (max-width:640px){.pd-par{grid-template-columns:1fr}}
`
