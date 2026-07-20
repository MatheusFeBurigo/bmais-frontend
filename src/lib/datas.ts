// Helpers de data no fuso local (sem depender de UTC).

/** Data local de hoje em ISO `YYYY-MM-DD`. */
export function hojeISO(): string {
  const d = new Date()
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 10)
}

/** `true` se a data ISO informada é o dia atual (local). */
export function ehHoje(isoDate: string | null | undefined): boolean {
  return !!isoDate && isoDate.slice(0, 10) === hojeISO()
}

/** ISO `YYYY-MM-DD` → `dd/mm` (curto, para rótulos). Vazio se inválido. */
export function labelCurto(isoDate: string | null | undefined): string {
  if (!isoDate) return ''
  const [y, mth, d] = isoDate.slice(0, 10).split('-')
  return y && mth && d ? `${d}/${mth}` : ''
}
