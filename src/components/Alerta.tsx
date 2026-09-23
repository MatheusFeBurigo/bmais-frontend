// Vocabulário único de alerta da tela de envio.
//
// Antes, dizer "preste atenção nisto" tinha seis formas diferentes na mesma tela:
// badge no placar, texto corrido no cartão, linha cinza de t-xs com um emoji "⚠",
// faixa amarela, parágrafo dentro do assistente e o toast. Nada indicava qual era
// mais grave — e o mais grave (faltou paciente) era justamente o menor de todos.
//
// Aqui existe UM componente, com três níveis, usados com o mesmo sentido em todo
// lugar: crítico = confira o arquivo agora; atenção = entrou incompleto; nota =
// está tudo certo, só registrando. A cor é reforço, nunca o único sinal: cada
// nível tem ícone próprio e o texto continua dizendo o que houve por escrito.

import type { NivelAviso } from '../../lib/avisosCenso'

export const alertaStyles = `
/* Barra lateral da cor do nível + fundo tingido. A barra é o que faz os alertas
   se lerem como uma COLUNA de ocorrências quando há vários: o olho desce pela
   faixa colorida e vê de imediato quantos são e de que tipo, em vez de medir
   fundos de tom parecido. Padding generoso e gap próprio: empilhados sem
   respiro, três alertas viravam um bloco único de texto. */
.al{display:flex;gap:9px;align-items:flex-start;padding:9px 12px;border-radius:var(--r-sm);font-size:var(--t-sm);line-height:1.5;border:1px solid transparent;border-left-width:3px}
.al-ico{flex-shrink:0;margin-top:1px;display:grid;place-items:center}
.al-txt{flex:1;min-width:0}
/* Espaço ENTRE alertas consecutivos, sem afetar o primeiro nem o que vem depois:
   o próprio elemento reserva a distância do seguinte. */
.al + .al{margin-top:7px}

/* Crítico: perdeu-se dado. Vermelho pleno na barra e no ícone — é o único nível
   que significa "pode faltar paciente no sistema". */
.al.critico{background:var(--danger-bg);border-color:var(--danger-bg-2);border-left-color:var(--danger);color:var(--danger-2)}
.al.critico .al-ico{color:var(--danger)}
.al.critico b,.al.critico strong{color:var(--danger-2)}

/* Atenção: entrou, mas há algo a conferir ou completar. Âmbar — presente, não
   urgente; o texto fica no tom de leitura normal, para a frase não gritar junto
   com a cor. */
.al.atencao{background:var(--warning-bg);border-color:rgba(217,105,12,.22);border-left-color:var(--warning);color:var(--ink-2)}
.al.atencao .al-ico{color:var(--warning-2)}
.al.atencao b,.al.atencao strong{color:var(--warning-2)}

/* Nota: confirmação de que o leitor fez a coisa certa. Cinza e sem fundo — não
   disputa atenção com os dois acima, mas mantém a barra para ficar alinhada na
   mesma coluna. */
.al.nota{background:var(--surface-3);border-color:var(--border-soft);border-left-color:var(--muted-3);color:var(--muted)}
.al.nota .al-ico{color:var(--muted-2)}

/* Ação dentro do alerta (ex.: "Completar agora"): o alerta deixa de ser só texto
   e passa a levar a algum lugar, sem virar uma faixa separada da tela. */
.al-acao{flex-shrink:0;align-self:center;margin-left:4px}
`

const IcoCritico = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" /><path d="M12 17h.01" />
  </svg>
)

const IcoAtencao = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" />
  </svg>
)

const IcoNota = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9" /><path d="M12 16v-5" /><path d="M12 8h.01" />
  </svg>
)

const ICONES: Record<NivelAviso, React.ReactNode> = {
  critico: IcoCritico,
  atencao: IcoAtencao,
  nota: IcoNota,
}

/** Texto que descreve o nível para quem usa leitor de tela — a cor não chega lá. */
const ROTULO: Record<NivelAviso, string> = {
  critico: 'Problema:',
  atencao: 'Atenção:',
  nota: 'Nota:',
}

export function Alerta({ nivel, children, acao }: {
  nivel: NivelAviso
  children: React.ReactNode
  /** Botão à direita, quando o alerta LEVA a algum lugar (ex.: "Completar
   *  agora"). Fica dentro do alerta, e não numa faixa separada, para a ação
   *  nascer colada ao motivo dela. */
  acao?: React.ReactNode
}) {
  return (
    <div className={`al ${nivel}`} role={nivel === 'critico' ? 'alert' : undefined}>
      <span className="al-ico">{ICONES[nivel]}</span>
      <div className="al-txt">
        <span className="sr-only">{ROTULO[nivel]} </span>
        {children}
      </div>
      {acao && <span className="al-acao">{acao}</span>}
    </div>
  )
}
