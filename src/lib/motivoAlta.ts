// Motivo da alta. Espelho de `domain/motivo_alta.py` no backend: o banco guarda
// a CHAVE, a tela mostra o rótulo. A ordem é a da modal de alta.
//
// O homecare foi motivo de alta de 08/10 a 13/11/2026 (antes era um tipo de
// leito). Desde 13/11 é registrado no relatório, como a prorrogação (pedido do
// usuário: "homecare não deve virar alta"). A chave fica na lista para o rótulo
// das altas já dadas com ela; a modal de alta usa MOTIVOS_ALTA_NOVA.
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

/** Os motivos que a alta nova oferece (sem o Homecare, desde 13/11/2026). */
export const MOTIVOS_ALTA_NOVA = MOTIVOS_ALTA.filter((m) => m.key !== 'homecare')

/** Rótulo da chave. Alta sem motivo (a do censo, a inferida e as anteriores a
 *  08/10/2026) não tem rótulo: quem exibe decide o que mostrar no lugar. */
export function rotuloMotivoAlta(key: string | null | undefined): string | null {
  return MOTIVOS_ALTA.find((m) => m.key === key)?.label ?? null
}
