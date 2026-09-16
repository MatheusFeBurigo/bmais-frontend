// Peças pequenas compartilhadas pelos componentes da tela de envio.

/** Plural simples: `plural(2,'paciente')` → "pacientes". */
export function plural(n: number, singular: string, pluralForma = `${singular}s`): string {
  return n === 1 ? singular : pluralForma
}

/** ISO `AAAA-MM-DD` → `dd/mm`. O ano fica de fora: o censo é sempre recente, e
 *  no resumo o que se compara é o DIA. */
export function ddmm(iso: string): string {
  const [, mes, dia] = iso.slice(0, 10).split('-')
  return mes && dia ? `${dia}/${mes}` : iso
}

// Ícones do disco do placar. Sem contorno próprio de propósito: o próprio
// `.up-placar-ico` é um círculo preenchido (verde ou laranja) e o glifo desenha
// só a marca por cima — um segundo contorno dentro do disco ficaria duplicado.
// `aria-hidden` porque o texto ao lado já diz o resultado por escrito; anunciar
// "imagem" antes dele só atrapalharia quem usa leitor de tela.
export const IcoCheck = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export const IcoAtencaoPlacar = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 8v5" /><path d="M12 17h.01" />
  </svg>
)

export const IcoChevron = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 9l6 6 6-6" />
  </svg>
)

export const IcoImagem = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
  </svg>
)

const IcoCalendario = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
)

/** Dia a que o censo se refere, lido do cabeçalho do próprio relatório.
 *
 *  É a informação que permite perceber, na conferência, que subiu o censo de
 *  ontem ou o de um dia já enviado — o nome do arquivo não serve de pista,
 *  porque repete todo dia ("INTER PORTO.pdf") ou nem traz data ("Anexo (1).pdf").
 *
 *  Sem data no arquivo não renderiza nada: um "—" ocuparia espaço para dizer que
 *  não há o que dizer, e um palpite seria pior — ninguém confere o que parece
 *  plausível. */
export function DataDoCenso({ iso }: { iso?: string | null }) {
  if (!iso) return null
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  if (!ano || !mes || !dia) return null
  return (
    // "Censo de 30/08" por extenso, não só a data: sozinho, "30/08" ao lado do
    // nome do arquivo era lido como a data do ENVIO — que é outra coisa, e a
    // confusão entre as duas é justamente o que esta etiqueta existe para
    // desfazer (quem manda o censo de sexta na segunda vê as duas diferentes).
    // O ano fica no title: no envio do dia ele é sempre o corrente e só ocuparia
    // espaço; quem precisa conferir passa o mouse.
    <span className="up-data-censo" title={`Censo referente a ${dia}/${mes}/${ano}`}>
      {IcoCalendario}
      <span className="up-data-censo-rot">Censo de</span>
      <b>{dia}/{mes}</b>
    </span>
  )
}
