// Catálogos do relatório completo da visita (0054). Espelho de
// `domain/relatorio_detalhes.py` no backend: o banco guarda a CHAVE, a tela
// mostra o rótulo.
import type { DetalhesRelatorio, RelatorioItem } from '../types/api'

export const CARATER = [
  { key: 'U', label: 'Urgência' },
  { key: 'E', label: 'Eletivo' },
] as const

// Clínico ou cirúrgico num campo só: no Márcia o "tipo" (geral, pediátrica,
// neonatal, obstétrica) só existe para a internação clínica.
export const TIPOS_INTERNACAO = [
  { key: 'clinica_geral', label: 'Clínica geral' },
  { key: 'clinica_pediatrica', label: 'Clínica pediátrica' },
  { key: 'clinica_neonatal', label: 'Clínica neonatal' },
  { key: 'clinica_obstetrica', label: 'Clínica obstétrica' },
  { key: 'cirurgica', label: 'Cirúrgica' },
] as const

export const TIPOS_ALTO_CUSTO = [
  { key: 'albumina', label: 'Albumina' },
  { key: 'imunoglobulina', label: 'Imunoglobulina' },
  { key: 'quimioterapicos', label: 'Quimioterápicos' },
  { key: 'antibioticos', label: 'Antibióticos' },
] as const

type Catalogo = readonly { key: string; label: string }[]

/** Rótulo da chave no catálogo; a própria chave se ela não estiver lá. */
export function rotulo(catalogo: Catalogo, key: string | null | undefined): string {
  if (!key) return ''
  return catalogo.find((c) => c.key === key)?.label ?? key
}

/** O último relatório que trouxe a classificação da internação: a modal abre
 *  com ela (no Márcia, caráter e tipo quase nunca mudam de uma visita a outra).
 *  `relatorios` vem do mais recente para o mais antigo. */
export function ultimaClassificacao(relatorios: RelatorioItem[] | undefined): DetalhesRelatorio | null {
  return relatorios?.find((r) => r.detalhes?.carater || r.detalhes?.tipo_internacao
    || r.detalhes?.acomodacoes?.length)?.detalhes ?? null
}
