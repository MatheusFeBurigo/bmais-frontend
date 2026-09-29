// Código CID-10 na grafia do catálogo. Espelho de `domain/cid.normalizar_codigo`
// no backend: "j189", "J18,9" e "j18 9" viram "J18.9". É o que permite a tela
// reconhecer que o técnico terminou de digitar um código e já mostrar o nome,
// sem ele precisar clicar na sugestão.
const CODIGO = /^([A-Z])(\d{2})(?:[.,\s-]*(\d))?[.\s-]*$/

export function normalizarCid(texto: string | null | undefined): string | null {
  const m = CODIGO.exec((texto ?? '').trim().toUpperCase())
  if (!m) return null
  const [, letra, cat, sub] = m
  return sub ? `${letra}${cat}.${sub}` : `${letra}${cat}`
}

/** Restrição de sexo do CID contra o sexo do paciente, quando os dois são conhecidos. */
export function sexoConflita(restricao: string | null | undefined, sexoPaciente: string | null | undefined): boolean {
  const s = (sexoPaciente ?? '').trim().toUpperCase().charAt(0)
  return !!restricao && (s === 'F' || s === 'M') && s !== restricao
}
