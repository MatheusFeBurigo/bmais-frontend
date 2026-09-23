// CSS local da tela Kanban.
// Extraído de pages/Kanban.tsx (god component) — mesmo padrão de
// gestor.styles.ts / logs.styles.ts / equipe.styles.ts: o CSS de uma tela
// mora ao lado dos seus componentes, não embutido na página.

export const localStyles = `
/* grid-template-columns vem inline (nº de colunas depende do papel/board). */
/* ── Barra de priorização (busca + chips + hospital + ordem) ── */
.kb-filtros{display:flex;flex-direction:column;gap:9px;margin-bottom:14px}
.kb-filtros-linha{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.kb-filtros-conta{font-size:var(--t-sm);color:var(--muted);font-family:var(--font-mono)}
.kb-filtro-select{padding:6px 9px;max-width:230px}
.kb-ordem{display:inline-flex;align-items:center;gap:7px}
.kb-ordem-lbl{font-size:var(--t-sm);color:var(--muted-2);white-space:nowrap}
/* Chip de recorte: apagado quando inativo, pintado na cor do sinal quando ligado.
   O contador ao lado diz o tamanho do recorte ANTES do clique. */
.kb-chips{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.kb-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border);background:var(--surface);color:var(--muted);font-size:var(--t-sm);font-weight:600;padding:4px 10px;border-radius:99px;cursor:pointer;transition:border-color .12s,background .12s,color .12s}
.kb-chip:hover{border-color:var(--kb-chip-cor);color:var(--ink-2)}
.kb-chip .kb-chip-dot{width:7px;height:7px;border-radius:50%;background:var(--kb-chip-cor);flex-shrink:0;opacity:.5;transition:opacity .12s}
.kb-chip.ativo{background:var(--kb-chip-bg);border-color:var(--kb-chip-cor);color:var(--kb-chip-cor)}
.kb-chip.ativo .kb-chip-dot{opacity:1}
.kb-chip-n{font-family:var(--font-mono);font-size:var(--t-xs);opacity:.8}
/* Chip sem nenhum caso: some da disputa visual, mas continua clicável/legível. */
.kb-chip.vazio:not(.ativo){opacity:.45}
.kb-busca-row{display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap}
.kb-busca-wrap{position:relative;display:inline-flex;align-items:center}
.kb-busca-icon{position:absolute;left:10px;color:var(--muted-2);pointer-events:none}
.kb-busca-clear{position:absolute;right:8px;border:none;background:transparent;color:var(--muted);font-size:13px;line-height:1;padding:4px;border-radius:5px;cursor:pointer}
.kb-busca-clear:hover{background:var(--surface-3);color:var(--ink)}
/* As colunas ficam SEMPRE na mesma linha. O quadro é lido lado a lado (o que
   está pendente, o que já tem data marcada), e empurrar uma coluna para baixo
   esconde metade da comparação atrás de um scroll vertical.
   O número de colunas vem inline (depende do papel), com minmax(260px, 1fr):
   elas dividem a largura por igual e param de encolher em 260px — daí o
   overflow-x, que faz o quadro rolar na horizontal em vez de quebrar. */
.kb-board{display:grid;gap:12px;align-items:start;transition:opacity .2s ease;overflow-x:auto}
/* Refetch em andamento com dados anteriores em tela: esmaece o quadro (não bloqueia
   cliques), sinalizando "atualizando" sem piscar o loading — igual ao Gestor. */
.kb-board.atualizando{opacity:.55}
@media (prefers-reduced-motion:reduce){.kb-board{transition:none}}
/* Telas estreitas (celular): aí sim uma embaixo da outra, porque lado a lado
   nenhuma coluna teria largura utilizável. */
@media (max-width:760px){
  .kb-board{grid-template-columns:1fr!important;overflow-x:visible}
}
.kb-col{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-md);display:flex;flex-direction:column;min-height:200px}
.kb-col-head{padding:11px 13px 9px;border-bottom:1px solid var(--border);border-top:3px solid var(--kb-cor);border-radius:var(--r-md) var(--r-md) 0 0;background:var(--surface)}
.kb-col-title-row{display:flex;align-items:center;gap:8px}
.kb-col-title{font-size:var(--t-md);font-weight:600;color:var(--ink)}
.kb-col-count{margin-left:auto;font-family:var(--font-mono);font-size:var(--t-sm);font-weight:700;color:#fff;background:var(--kb-cor);border-radius:99px;min-width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;padding:0 7px}
.kb-col-desc{font-size:var(--t-sm);color:var(--muted-2);margin-top:3px;line-height:1.4}
.kb-col-body{padding:9px;display:flex;flex-direction:column;gap:8px;overflow-y:auto;max-height:calc(100vh - 240px)}
.kb-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm);padding:9px 11px;transition:border-color .14s,box-shadow .14s,transform .14s;position:relative}
.kb-card.clicavel{cursor:pointer}
/* Selo de alerta: card de visita atrasada. Borda vermelha inteira (não só a
   etiqueta) para o card se destacar dentro da coluna de longe, sem precisar ler
   o texto — a mesma lógica de "Sem relatório" já usar cor no badge, aqui
   aplicada ao card inteiro porque é a única coluna cujo alerta é sempre real
   (todo card ali é, por definição, um atraso). */
.kb-card.atrasada{border-color:var(--danger);background:var(--danger-bg)}
.kb-card.atrasada.clicavel:hover{border-color:var(--danger);box-shadow:0 6px 18px rgba(200,36,60,.18)}
/* Faixa fixa no topo do card atrasado: ícone + "Atrasada" + o médico
   responsável, em destaque — não escondido entre outras etiquetas como UTI ou
   Longa permanência. É a primeira coisa lida, porque é a razão de o card
   estar nesta coluna. */
.kb-card-alerta{display:flex;align-items:center;gap:6px;margin:-9px -11px 8px;padding:6px 11px;background:var(--danger);color:#fff;border-radius:var(--r-sm) var(--r-sm) 0 0;font-size:var(--t-sm);font-weight:700}
.kb-card-alerta svg{flex-shrink:0}
.kb-card-alerta-medico{font-weight:400;opacity:.92;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* Hover evidente: eleva o card, borda na cor primária e sombra mais forte —
   comunica claramente que o card é clicável. */
.kb-card.clicavel:hover{border-color:var(--primary-3);box-shadow:0 6px 18px rgba(21,92,168,.14);transform:translateY(-2px)}
.kb-card.clicavel:active{transform:translateY(0)}
/* Seta que aparece no hover, reforçando "abrir". Fica na linha do rodapé (fluxo
   normal, não absoluta): posicionada no canto do card, pousava em cima do badge
   de dias sem relatório. Sem eventos de ponteiro para o clique atravessar até o
   card, já que ela é só um sinal visual. */
.kb-card-abrir{display:inline-flex;opacity:0;color:var(--primary-3);transition:opacity .14s,transform .14s;transform:translateX(-3px);pointer-events:none}
.kb-card.clicavel:hover .kb-card-abrir{opacity:1;transform:translateX(0)}
.kb-card-top{display:flex;align-items:flex-start;gap:7px}
.kb-card-nome{font-weight:600;font-size:var(--t-base);color:var(--ink-2);line-height:1.3;flex:1;min-width:0}
.kb-card-meta{font-size:var(--t-sm);color:var(--muted);margin-top:5px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.kb-card-atend{font-family:var(--font-mono)}
/* Rótulo do dado ("Atend.", "Leito"): apagado para o VALOR continuar sendo o que
   se lê primeiro, mas presente para o número não ficar sem significado. */
.kb-meta-lbl{color:var(--muted-2)}
/* ── Card de paciente: contexto clínico + etiquetas + detalhes ── */
/* Onde o paciente está e há quanto tempo: a linha que evitava abrir o drawer. */
.kb-card-clinico{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px;font-size:var(--t-sm);color:var(--muted)}
.kb-leito-cod{font-family:var(--font-mono);color:var(--ink-2)}
/* Etiquetas de prioridade: os mesmos sinais dos chips da barra de filtro. */
.kb-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}
.kb-tag{font-size:var(--t-xs);font-weight:600;border-radius:99px;padding:2px 8px;line-height:1.5;white-space:nowrap}
/* Rodapé do card: "Mais detalhes" à esquerda, seta de "abrir" à direita. */
.kb-card-rodape{margin-top:7px;display:flex;align-items:center;justify-content:space-between;gap:8px}
/* "Mais detalhes": discreto por padrão, para não competir com o nome do paciente. */
.kb-mais{display:inline-flex;align-items:center;gap:5px;border:0;background:transparent;color:var(--muted);font-size:var(--t-sm);font-family:inherit;padding:2px 0;cursor:pointer}
.kb-mais:hover{color:var(--accent)}
.kb-mais-seta{display:inline-flex;transition:transform .14s}
.kb-mais-seta.aberta{transform:rotate(90deg)}
@media (prefers-reduced-motion:reduce){.kb-mais-seta{transition:none}}
/* Bloco expandido dentro do card (não é modal): some ao recolher. */
.kb-det{margin-top:7px;padding-top:8px;border-top:1px dashed var(--border);display:flex;flex-direction:column;gap:3px}
.kb-det-linha{display:flex;gap:8px;font-size:var(--t-sm);line-height:1.5}
.kb-det-lbl{color:var(--muted-2);flex-shrink:0;min-width:86px}
.kb-det-val{color:var(--ink-2);min-width:0;overflow-wrap:anywhere}
.kb-det-acao{margin-top:5px;font-size:var(--t-xs);color:var(--muted-2);font-style:italic}
/* Agendar visita direto no card (sem abrir a ficha do paciente). */
.kb-card-actions{margin-top:8px;display:flex;gap:8px;justify-content:flex-end;align-items:center}
.kb-empty{padding:22px 12px;text-align:center;color:var(--muted-2);font-size:var(--t-sm);line-height:1.5}
.kb-dias{font-family:var(--font-mono);font-weight:600}
`
