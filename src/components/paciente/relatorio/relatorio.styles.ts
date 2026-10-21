// Estilos da modal "Registrar relatório" (`rr-*`), num arquivo próprio para a
// réplica da Ajuda (ajuda/exemplosOperacao) desenhar a modal com as mesmas regras.
//
// Alinhamento: todo campo da modal tem 36px de altura. Sem isso o campo de
// data (com o ícone do calendário), a data da visita e o Caráter ficavam
// alguns pixels maiores ou menores que os vizinhos, e as grades alinham pela
// base (`align-items:end`) para que um rótulo mais alto não empurre o campo.
// Nas listas, cada valor adicionado fica na coluna do seu campo, com o texto
// no mesmo recuo do texto do campo (12px = borda + padding do .bm-input).
export const estilosRelatorio = `
/* Textos e campos da modal refeitos em 08/10/2026 ("as informações estão
   amontoadas"). Tudo vale só aqui dentro (.rr-raiz): os mesmos campos em outras
   telas (drawer, ficha) seguem o padrão da casa.
   Hierarquia: título da seção 15px > título de bloco 13,5px > valor do campo
   13,5px > rótulo do campo 11,5px (cinza, sem caixa alta) > resumo/dica 11,5px. */
.rr-raiz{min-width:0}
.rr-raiz .form-lbl{font-size:var(--t-sm);font-weight:500;text-transform:none;letter-spacing:0;color:var(--ink-3);margin-bottom:6px}
.rr-raiz .bm-input{font-size:var(--t-md);color:var(--ink)}
.rr-raiz .bm-input::placeholder{color:var(--muted-2)}
.rr-raiz .bm-input:not(textarea),.rr-raiz .cal-campo{height:38px;padding-top:0;padding-bottom:0;padding-left:12px}
.rr-raiz textarea.bm-input{padding:10px 12px;line-height:1.6}

/* Cabeçalho do paciente: o nome, e os dados numa linha com rótulo próprio. */
.rr-ctx{padding:14px 16px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2)}
.rr-ctx-topo{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.rr-ctx-nome{font-size:var(--t-lg);font-weight:600;letter-spacing:-.01em;color:var(--ink)}
.rr-ctx-linha{font-size:var(--t-sm);color:var(--ink-2);margin-top:2px}
.rr-ctx-fatos{display:flex;flex-wrap:wrap;gap:6px 22px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);font-size:var(--t-sm);color:var(--ink)}
.rr-ctx-fatos span{white-space:nowrap}
.rr-ctx-fatos b{font-weight:400;color:var(--muted);margin-right:6px}

/* Seções: lista com divisórias. Fechada, título e o resumo embaixo. */
.rr-grupos{margin-top:8px}
.rr-grupo{border-bottom:1px solid var(--border)}
.rr-grupo-cab{all:unset;box-sizing:border-box;display:flex;align-items:flex-start;gap:10px;width:100%;padding:16px 2px;cursor:pointer;border-radius:6px}
.rr-grupo-cab:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.rr-grupo-seta{flex-shrink:0;width:16px;height:16px;margin-top:2px;color:var(--muted);transition:transform .15s;transform:rotate(-90deg)}
.rr-grupo.aberto .rr-grupo-seta{transform:none}
.rr-grupo-textos{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.rr-grupo-linha1{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.rr-grupo-tit{font-size:var(--t-lg);font-weight:600;letter-spacing:-.01em;color:var(--ink)}
.rr-grupo-cab:hover .rr-grupo-tit,.rr-grupo-cab:hover .rr-grupo-seta{color:var(--primary)}
.rr-grupo-nota{font-size:var(--t-xs);font-weight:500;color:var(--muted);background:var(--surface-2);border:1px solid var(--border);border-radius:999px;padding:1px 9px}
.rr-grupo-resumo{font-size:var(--t-sm);color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rr-grupo-corpo{padding:2px 2px 24px}
.rr-grupo-ok{display:flex;align-items:center;justify-content:flex-end;gap:12px;margin-top:20px}
.rr-grupo-prox{font-size:var(--t-sm);color:var(--muted)}
.rr-grupo-okbtn{min-width:76px;justify-content:center}
.rr-grupo-concluida{display:inline-flex;align-items:center;gap:4px;font-size:var(--t-xs);font-weight:600;color:var(--success);background:var(--success-bg);border-radius:999px;padding:1px 9px 1px 7px}

/* Grades de campos. */
.rr-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:end}
.rr-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:end}
.rr-g-topo{align-items:start}
.rr-g-evento{display:grid;grid-template-columns:150px minmax(0,1fr);gap:16px;align-items:end}
.rr-pilha{display:grid;gap:18px}
.rr-campo{min-width:0;display:block}
.rr-campo .bm-input{width:100%;min-width:0}
.rr-nota{font-size:var(--t-sm);color:var(--muted);margin-top:8px}
.rr-seg{display:flex;height:38px;border:1px solid var(--border-strong);border-radius:8px;overflow:hidden;width:max-content}
.rr-seg-op{position:relative;display:inline-flex;align-items:center;padding:0 18px;font-size:var(--t-base);color:var(--ink-2);cursor:pointer;background:var(--surface)}
.rr-seg-op+.rr-seg-op{border-left:1px solid var(--border-strong)}
.rr-seg-op input{position:absolute;opacity:0;pointer-events:none}
.rr-seg-op.on{background:var(--primary-soft);color:var(--primary);font-weight:600}
.rr-seg-op:focus-within{outline:2px solid var(--accent);outline-offset:-2px}
.rr-chips{display:flex;flex-wrap:wrap;gap:8px}
.rr-chip{position:relative;display:inline-flex;align-items:center;height:36px;padding:0 14px;border:1px solid var(--border-strong);border-radius:999px;font-size:var(--t-base);color:var(--ink-2);cursor:pointer;background:var(--surface)}
.rr-chip input{position:absolute;opacity:0;pointer-events:none}
.rr-chip.on{background:var(--primary-soft);color:var(--primary);border-color:var(--primary-3);font-weight:600}
.rr-chip:focus-within{outline:2px solid var(--accent);outline-offset:1px}

/* Roteiro do relatório. */
.rr-roteiro{padding:12px 14px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2)}
.rr-roteiro-tit{font-size:var(--t-sm);font-weight:600;color:var(--ink-2)}
.rr-roteiro ol{margin-top:6px;list-style:none;display:flex;flex-wrap:wrap;gap:6px 22px;counter-reset:rot}
.rr-roteiro li{counter-increment:rot;font-size:var(--t-sm);color:var(--ink-2)}
.rr-roteiro li::before{content:counter(rot) ". ";font-weight:600;color:var(--primary)}

/* Blocos que abrem ao marcar, e o painel das acomodações. */
.rr-blocos{display:grid;gap:10px}
.rr-bloco{border:1px solid var(--border);border-radius:10px;background:var(--surface)}
.rr-bloco.on{border-color:var(--border-strong);background:var(--surface-2)}
.rr-bloco-tg{display:flex;align-items:center;gap:10px;padding:12px 16px;font-weight:600;font-size:var(--t-md);color:var(--ink);cursor:pointer}
.rr-bloco-tg input{width:16px;height:16px;accent-color:var(--accent);margin:0;flex-shrink:0}
.rr-bloco.rosa .rr-bloco-tg input{accent-color:var(--rosa)}
.rr-bloco.rosa.on{background:var(--rosa-bg)}
.rr-bloco-fixo{cursor:default}
.rr-bloco-extra{margin-left:auto;font-size:var(--t-sm);font-weight:500;color:var(--muted)}
.rr-bloco-dica{font-size:var(--t-sm);color:var(--muted);margin:-4px 0 14px}
.rr-bloco-corpo{padding:2px 16px 18px}

/* Documento anexado ao pedido de prorrogação. */
.rr-anexo-dica{margin:0 0 8px}
.rr-anexo{display:flex;align-items:center;gap:8px;height:38px;padding:0 4px 0 12px;border:1px solid var(--border-strong);border-radius:8px;background:var(--surface);color:var(--muted)}
.rr-anexo-nome{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--t-md);color:var(--ink)}

/* Listas: linha de entrada, respiro, e os itens nas mesmas colunas. */
.rr-lista-wrap{display:grid;gap:14px}
.rr-lista-entrada{display:grid;gap:14px;align-items:end}
.rr-lista-add{grid-column:-2/-1;height:38px;width:100%;justify-content:center}
.rr-resto{grid-column:2/-1}
.rr-linha{grid-column:1/-1}
.rr-dupla{grid-column:1/3}
.rr-lista{border:1px solid var(--border);border-radius:8px;background:var(--surface);overflow:hidden}
.rr-lista-linha{display:grid;column-gap:14px;row-gap:4px;align-items:center;padding:10px 0;font-size:var(--t-base);color:var(--ink)}
.rr-lista-linha+.rr-lista-linha{border-top:1px solid var(--border)}
.rr-cel{min-width:0;padding:0 12px;overflow-wrap:anywhere}
.rr-cel-nota{margin-left:6px;color:var(--muted)}
.rr-acoes{grid-column:-2/-1;display:flex;justify-content:flex-end;gap:2px;padding-right:8px}
.rr-x{all:unset;display:inline-grid;place-items:center;width:26px;height:26px;border-radius:6px;font-size:11px;color:var(--muted);cursor:pointer;flex-shrink:0}
.rr-x:hover{background:var(--surface-3);color:var(--ink)}
.rr-x:focus-visible{outline:2px solid var(--accent)}
/* Movimentação: cabeçalho das colunas e o Cancelar ao lado do Adicionar. */
.rr-lista-cab{padding:8px 0;background:var(--surface-2);font-size:var(--t-sm);font-weight:500;color:var(--muted)}
.rr-mov-cancelar{grid-column:-3/-2;justify-self:end;height:38px}

.rr-erro{font-size:var(--t-sm);color:var(--danger);margin-right:auto;align-self:center}
@media (max-width:900px){
  .rr-g3{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:620px){
  .rr-g2,.rr-g3,.rr-g-evento{grid-template-columns:minmax(0,1fr)}
  .rr-lista-entrada,.rr-lista-linha{grid-template-columns:minmax(0,1fr) !important}
  .rr-resto,.rr-linha,.rr-dupla,.rr-mov-cancelar{grid-column:auto}
}
`
