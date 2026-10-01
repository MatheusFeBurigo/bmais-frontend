// CSS local da tela Kanban.
// Extraído de pages/Kanban.tsx (god component) — mesmo padrão de
// gestor.styles.ts / logs.styles.ts / equipe.styles.ts: o CSS de uma tela
// mora ao lado dos seus componentes, não embutido na página.

export const localStyles = `
/* grid-template-columns vem inline (nº de colunas depende do papel/board). */
/* ── Barra de priorização (busca + chips + hospital + ordem) ── */
.kb-filtros{display:flex;flex-direction:column;margin-bottom:14px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);box-shadow:0 1px 2px rgba(6,46,92,.04)}
.kb-filtros-linha{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 12px}
.kb-filtros-conta{font-size:var(--t-sm);color:var(--muted);font-family:var(--font-mono)}
/* Busca: ocupa o espaço livre da linha. */
.kb-busca-wrap{position:relative;display:flex;align-items:center;flex:1 1 280px;min-width:0}
.kb-busca{appearance:none;width:100%;height:34px;padding:0 30px 0 34px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);font-size:var(--t-base);font-family:inherit;color:var(--ink);outline:none;transition:border-color .12s,box-shadow .12s,background .12s}
.kb-busca::placeholder{color:var(--muted-2)}
.kb-busca:hover{border-color:var(--border-strong)}
.kb-busca:focus{background:var(--surface);border-color:var(--primary-3);box-shadow:0 0 0 3px rgba(21,92,168,.1)}
.kb-busca-icon{position:absolute;left:11px;color:var(--muted-2);pointer-events:none}
.kb-busca-clear{position:absolute;right:6px;border:none;background:transparent;color:var(--muted);font-size:12px;line-height:1;padding:5px;border-radius:5px;cursor:pointer}
.kb-busca-clear:hover{background:var(--surface-3);color:var(--ink)}
/* Botão Filtros: vira azul com o número quando há filtro ligado. */
.kb-fbtn-wrap{position:relative}
.kb-fbtn{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 12px;border:1px solid var(--border-strong);border-radius:8px;background:var(--surface);color:var(--ink-2);font-size:var(--t-base);font-weight:600;font-family:inherit;cursor:pointer;transition:border-color .12s,background .12s,color .12s}
.kb-fbtn:hover{background:var(--surface-2)}
.kb-fbtn.aberto{border-color:var(--primary-3);box-shadow:0 0 0 3px rgba(21,92,168,.1)}
.kb-fbtn.ligado{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-2)}
.kb-fbtn-n{min-width:18px;height:18px;padding:0 5px;border-radius:99px;background:var(--accent);color:#fff;font-size:var(--t-xs);font-weight:700;display:inline-flex;align-items:center;justify-content:center}
/* Painel dos filtros. */
.kb-painel{position:absolute;z-index:40;top:calc(100% + 6px);left:0;width:290px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);box-shadow:0 12px 32px rgba(6,46,92,.16);padding:14px;display:flex;flex-direction:column;gap:14px}
.kb-painel-grupo{display:flex;flex-direction:column}
.kb-painel-grupo .kb-sel{max-width:none;width:100%}
.kb-painel-grupo .kb-sel select{flex:1;padding-left:11px}
.kb-painel-rodape{display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-soft);padding-top:12px}
.kb-opcoes{display:flex;flex-direction:column;gap:2px}
.kb-opcao{display:flex;align-items:center;gap:9px;padding:7px 8px;border-radius:7px;font-size:var(--t-base);color:var(--ink-2);cursor:pointer}
.kb-opcao:hover{background:var(--surface-2)}
.kb-opcao.ativo{background:var(--accent-soft);font-weight:600;color:var(--ink)}
.kb-opcao.vazio:not(.ativo){opacity:.5}
.kb-opcao input{margin:0;width:15px;height:15px;accent-color:var(--accent);cursor:pointer}
.kb-opcao-dot{width:8px;height:8px;border-radius:50%;background:var(--kb-chip-cor);flex-shrink:0}
.kb-opcao-n{font-family:var(--font-mono);font-size:var(--t-xs);font-weight:700;color:var(--muted)}
/* Ordem: à direita, separada dos filtros (não esconde nada, só reordena). */
.kb-ordem{margin-left:auto}
.kb-sel{position:relative;display:inline-flex;align-items:center;height:34px;border:1px solid var(--border);border-radius:8px;background:var(--surface);transition:border-color .12s,box-shadow .12s;max-width:260px;cursor:pointer}
.kb-sel:hover{border-color:var(--border-strong)}
.kb-sel:focus-within{border-color:var(--primary-3);box-shadow:0 0 0 3px rgba(21,92,168,.1)}
.kb-sel-ico{display:inline-flex;padding-left:10px;color:var(--muted-2);pointer-events:none}
.kb-sel-pre{padding-left:6px;font-size:var(--t-sm);color:var(--muted);white-space:nowrap;pointer-events:none}
.kb-sel select{appearance:none;border:none;background:transparent;height:100%;padding:0 28px 0 6px;font-size:var(--t-base);font-weight:600;font-family:inherit;color:var(--ink-2);outline:none;cursor:pointer;min-width:0;text-overflow:ellipsis}
.kb-sel-seta{position:absolute;right:10px;color:var(--muted-2);pointer-events:none}
/* Painel do quadro de censos: hospital em cima, operadora e atraso lado a lado. */
.kb-painel.largo{width:min(520px,calc(100vw - 32px));left:auto;right:0}
.kb-painel-colunas{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media (max-width:560px){.kb-painel-colunas{grid-template-columns:1fr}}
.kb-opcao-btn{border:0;background:transparent;font-family:inherit;text-align:left;width:100%}
.kb-opcao-btn.ativo{box-shadow:inset 0 0 0 1px var(--accent)}
/* Filtros ligados, como etiquetas removíveis. */
.kb-ativos{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:8px 12px;border-top:1px solid var(--border-soft);background:var(--surface-2);border-radius:0 0 var(--r-md) var(--r-md)}
.kb-ativos-lbl{font-size:var(--t-sm);color:var(--muted);margin-right:2px}
.kb-ativos-fim{margin-left:auto;display:inline-flex;align-items:center;gap:10px}
.kb-tag{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 4px 0 10px;border:1px solid var(--border-strong);border-radius:99px;background:var(--surface);font-size:var(--t-sm);font-weight:600;color:var(--ink-2)}
.kb-tag-x{all:unset;display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;font-size:10px;color:var(--muted);cursor:pointer}
.kb-tag-x:hover{background:var(--surface-3);color:var(--ink)}
.kb-tag-x:focus-visible{outline:2px solid var(--accent)}
.kb-link{all:unset;font-size:var(--t-sm);font-weight:600;color:var(--accent);cursor:pointer}
.kb-link:hover{text-decoration:underline}
@media (max-width:760px){.kb-ordem{margin-left:0}.kb-painel{width:min(290px,calc(100vw - 48px))}}
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
/* "i" ao lado do título: a descrição da coluna abre num balão, sem ocupar o cabeçalho. */
.kb-info{position:relative;display:inline-flex}
.kb-info-btn{all:unset;display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;color:var(--muted-2);cursor:help}
.kb-info-btn:hover,.kb-info-btn[aria-expanded="true"]{color:var(--kb-cor)}
.kb-info-btn:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
.kb-info-pop{position:absolute;z-index:20;top:calc(100% + 6px);left:50%;transform:translateX(-50%);width:220px;padding:8px 10px;border-radius:8px;background:var(--ink);color:#fff;font-size:var(--t-sm);font-weight:400;line-height:1.4;box-shadow:0 8px 24px rgba(6,46,92,.2);pointer-events:none}
.kb-info-pop::before{content:"";position:absolute;top:-4px;left:50%;width:8px;height:8px;background:var(--ink);transform:translateX(-50%) rotate(45deg)}
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
/* flex-wrap + base de 120px no nome: em coluna estreita (o quadro de pacientes
   tem 6) o selo de dias desce para a linha de baixo em vez de espremer o nome
   letra a letra. */
.kb-card-top{display:flex;align-items:flex-start;gap:5px 7px;flex-wrap:wrap}
.kb-card-nome{font-weight:600;font-size:var(--t-base);color:var(--ink-2);line-height:1.3;flex:1 1 120px;min-width:0}
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
/* Duas ações no card de censo ("Aguardando retorno"): lado a lado não cabem na
   largura da coluna. A que anda o card vai em largura cheia; desfazer fica
   embaixo, discreta. */
.kb-card-actions.empilhadas{flex-direction:column;align-items:stretch;gap:2px;padding-top:8px;border-top:1px dashed var(--border)}
.kb-card-actions.empilhadas .btn{justify-content:center}
/* "Marcar como atualizado" leva o card para "Censos atualizados": a cor é a da coluna. */
.kb-btn-atualizar:not(:disabled){color:var(--success);border-color:var(--success);background:var(--success-bg)}
.kb-btn-atualizar:not(:disabled):hover{background:var(--success);color:#fff;border-color:var(--success)}
.kb-empty{padding:22px 12px;text-align:center;color:var(--muted-2);font-size:var(--t-sm);line-height:1.5}
.kb-dias{font-family:var(--font-mono);font-weight:600}
/* ── Colunas de aprovação (quadro de pacientes) ── */
.ap-rel{margin-top:8px;padding:8px 10px;border-radius:8px;background:var(--surface-2);border:1px solid var(--border-soft);display:grid;gap:4px}
.ap-rel-linha{font-size:var(--t-xs);color:var(--muted);font-weight:600}
.ap-rel-texto{font-size:var(--t-sm);color:var(--ink-2);white-space:pre-wrap;line-height:1.45;word-break:break-word}
.ap-rel-texto.recolhido{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.ap-rel-autor{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:var(--t-xs)}
.ap-motivo{margin-top:8px;padding:7px 10px;border-radius:8px;background:var(--danger-bg);color:var(--danger);font-size:var(--t-sm);white-space:pre-wrap;word-break:break-word}
.ap-acoes{display:flex;justify-content:flex-end;gap:6px;margin-top:8px}
`
