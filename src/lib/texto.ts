// Utilitários de formatação de texto para exibição.

// Preposições/artigos que, em nomes próprios PT-BR, ficam em minúsculo quando no
// meio do nome (ex.: "Maria da Silva", "João dos Santos"). No início do nome
// sempre capitaliza (não começa nome com "de").
const MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])

/**
 * Converte um nome para "Maiúsculo/minúsculo" (Title Case) próprio para nomes
 * PT-BR. Os censos chegam em CAIXA ALTA ("TERESA VIEIRA SOUZA") — aqui vira
 * "Teresa Vieira Souza". Preposições no meio ficam minúsculas ("Maria da Silva").
 * Preserva hífen ("Ana-Clara") e apóstrofo ("D'Ávila") capitalizando cada parte.
 * Entrada vazia/nula retorna string vazia.
 */
export function nomeProprio(valor?: string | null): string {
  if (!valor) return ''
  const capitalizarToken = (t: string): string =>
    // Recapitaliza cada segmento separado por hífen ou apóstrofo.
    t
      .split(/([-'])/)
      .map((parte) =>
        parte === '-' || parte === "'"
          ? parte
          : parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase(),
      )
      .join('')

  const palavras = valor.trim().toLowerCase().split(/\s+/)
  return palavras
    .map((palavra, i) =>
      i > 0 && MINUSCULAS.has(palavra) ? palavra : capitalizarToken(palavra),
    )
    .join(' ')
}
