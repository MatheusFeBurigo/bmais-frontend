// CSS local da tela Kanban.
// Extraído de pages/Kanban.tsx (god component) — mesmo padrão de
// gestor.styles.ts / logs.styles.ts / equipe.styles.ts: o CSS de uma tela
// mora ao lado dos seus componentes, não embutido na página.

export const localStyles = `
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
