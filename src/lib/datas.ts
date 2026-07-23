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

/** Timestamp ISO → `dd/mm/aaaa HH:MM` (local). Só data se não houver hora.
 *  Usado para exibir quando um relatório foi anexado. Vazio se inválido. */
export function dataHora(iso: string | null | undefined): string {
  if (!iso) return ''
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return ''
  const dia = String(dt.getDate()).padStart(2, '0')
  const mes = String(dt.getMonth() + 1).padStart(2, '0')
  const ano = dt.getFullYear()
  // Só há hora quando o ISO tem componente de tempo (T/espaço); datas puras
  // (YYYY-MM-DD) exibem apenas o dia.
  const temHora = /[T ]\d{2}:\d{2}/.test(iso)
  if (!temHora) return `${dia}/${mes}/${ano}`
  const hh = String(dt.getHours()).padStart(2, '0')
  const mm = String(dt.getMinutes()).padStart(2, '0')
  return `${dia}/${mes}/${ano} ${hh}:${mm}`
}
