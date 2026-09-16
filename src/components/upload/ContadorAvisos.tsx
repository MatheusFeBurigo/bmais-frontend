// Quantos avisos um arquivo tem, para a linha RECOLHIDA.
//
// Com o cartão fechado, as frases inteiras dos avisos empilhadas viravam uma
// parede: num lote em que todos os arquivos têm observação, a tela abria com
// dezenas de linhas de texto e não dava para achar qual arquivo tinha o quê.
//
// Aqui só o NÚMERO, por gravidade: "2" em vermelho é problema, "3" em âmbar é
// conferência. O usuário vê de relance qual arquivo pede mais atenção, abre
// aquele, e só então lê o que de fato aconteceu.
//
// Os dois níveis ficam separados (não somados) porque significam coisas
// diferentes: crítico é possível perda de paciente, atenção é dado incompleto ou
// algo a conferir. Um "5" único esconderia essa diferença justamente na hora de
// escolher por onde começar.

import type { NivelAviso } from '../../lib/avisosCenso'

export const contadorAvisosStyles = `
.up-conta{display:inline-flex;align-items:center;gap:4px;flex-shrink:0}
.up-conta-item{display:inline-flex;align-items:center;gap:3px;padding:1px 7px 1px 5px;border-radius:99px;font-size:var(--t-xs);font-weight:700;line-height:1.5}
.up-conta-item svg{flex-shrink:0}
/* As mesmas cores do componente Alerta: o número fechado e a frase aberta têm de
   ser reconhecíveis como a mesma coisa. */
.up-conta-item.critico{background:var(--danger-bg);color:var(--danger-2)}
.up-conta-item.atencao{background:var(--warning-bg);color:var(--warning-2)}
`

const IcoCritico = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" /><path d="M12 17h.01" />
  </svg>
)

const IcoAtencao = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" />
  </svg>
)

/** Texto que o leitor de tela lê — a cor e o ícone não chegam lá. */
function descrever(n: number, nivel: NivelAviso): string {
  const coisa = n === 1 ? 'aviso' : 'avisos'
  return nivel === 'critico'
    ? `${n} ${coisa} de problema neste arquivo`
    : `${n} ${coisa} a conferir neste arquivo`
}

export function ContadorAvisos({ criticos, atencoes }: {
  criticos: number
  atencoes: number
}) {
  if (!criticos && !atencoes) return null
  return (
    <span className="up-conta">
      {criticos > 0 && (
        <span className="up-conta-item critico" title={descrever(criticos, 'critico')}>
          {IcoCritico}
          {criticos}
          <span className="sr-only"> {descrever(criticos, 'critico')}</span>
        </span>
      )}
      {atencoes > 0 && (
        <span className="up-conta-item atencao" title={descrever(atencoes, 'atencao')}>
          {IcoAtencao}
          {atencoes}
          <span className="sr-only"> {descrever(atencoes, 'atencao')}</span>
        </span>
      )}
    </span>
  )
}
