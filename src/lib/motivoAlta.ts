// Motivo da alta. Espelho de `domain/motivo_alta.py` no backend: o banco guarda
// a CHAVE, a tela mostra o rótulo. A ordem é a da modal de alta.
//
// O homecare é um motivo de alta desde 08/10/2026 (antes era um tipo de leito):
// nas planilhas da operação ele é alta hospitalar e precisa ser contado.
export const MOTIVOS_ALTA = [
  { key: 'alta_medica', label: 'Alta médica' },
  { key: 'homecare', label: 'Homecare' },
  { key: 'transferencia', label: 'Transferência' },
  { key: 'obito', label: 'Óbito' },
  { key: 'a_pedido', label: 'A pedido' },
  { key: 'evasao', label: 'Evasão' },
  { key: 'administrativa', label: 'Administrativa' },
  { key: 'outro', label: 'Outro' },
] as const

export type MotivoAlta = (typeof MOTIVOS_ALTA)[number]['key']

/** Rótulo da chave. Alta sem motivo (a do censo, a inferida e as anteriores a
 *  08/10/2026) não tem rótulo: quem exibe decide o que mostrar no lugar. */
export function rotuloMotivoAlta(key: string | null | undefined): string | null {
  return MOTIVOS_ALTA.find((m) => m.key === key)?.label ?? null
}
