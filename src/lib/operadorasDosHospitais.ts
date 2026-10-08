// Operadoras do cadastro, tiradas da lista de hospitais (`useTodosHospitais`):
// é dela que vem quantos hospitais cada operadora tem. Serve à área do
// operacional (SeletorOperadoras) e aos nomes na lista de usuários.
//
// O hospital repetido no cadastro (uma linha por operadora, AACD = aacd_br,
// aacd_po...) conta uma vez, pelo nome, como em MultiSelectHospitais.
import type { Hospital } from '../types/api'

export interface OperadoraDaArea {
  key: string
  nome: string
  /** Nomes normalizados dos hospitais que ela atende (distintos). */
  hospitais: Set<string>
}

export function normalizarNome(s: string): string {
  return (s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/** Operadoras do cadastro, cada uma com os hospitais dela, em ordem alfabética. */
export function operadorasDosHospitais(hospitais: Hospital[]): OperadoraDaArea[] {
  const mapa = new Map<string, OperadoraDaArea>()
  for (const h of hospitais) {
    const ops = h.operadoras_nomes?.length
      ? h.operadoras_nomes
      : (h.operadoras?.length ? h.operadoras : [h.operadora_key]).filter((k): k is string => !!k)
          .map((k) => ({ key: k, nome: k === h.operadora_key && h.operadora_nome ? h.operadora_nome : k }))
    for (const op of ops) {
      const item = mapa.get(op.key) ?? { key: op.key, nome: op.nome, hospitais: new Set<string>() }
      item.hospitais.add(normalizarNome(h.nome))
      mapa.set(op.key, item)
    }
  }
  return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}
