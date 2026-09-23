// Cidade de um hospital, derivada da região gravada.
//
// POR QUE DERIVAR E NÃO LER `hospitais.cidade`: a coluna existe (migration
// 0015) e está 100% vazia — nenhum hospital jamais a preencheu. Quem carrega o
// dado geográfico hoje é `hospitais.regiao`, e ela já é quase toda CIDADE:
// Campinas, Guarulhos, Osasco, Sorocaba, Jundiaí, Curitiba. Derivar dá a cidade
// de 402 linhas hoje; preencher `cidade` à mão daria a de zero até alguém
// terminar o trabalho.
//
// Duas famílias de região NÃO são cidade, e cada uma tem um destino:
//
//  1. As 5 zonas da capital ("SP - Zona Sul"…) COLAPSAM em "São Paulo". Elas
//     foram criadas para quebrar uma lista de 107 hospitais na escolha de
//     escopo do usuário; aqui a pergunta é outra ("em que cidade este auditor
//     atua?"), e quem responde pensa na cidade, não na zona.
//
//  2. Os estados ("Pernambuco", "Bahia", "Espírito Santo") NÃO viram cidade
//     chutada. Eles caem num grupo à parte, com esse nome na tela. Inventar
//     "Recife" para um hospital que só diz "Pernambuco" põe o hospital numa
//     cidade que ninguém conferiu, e o erro fica invisível — exatamente o que
//     o script de zonas evitou ao não chutar bairro.
import { SEM_REGIAO } from './regioes'

/** Zonas da capital → a cidade que elas dividem. */
const ZONAS_DA_CAPITAL: Record<string, string> = {
  'SP - Centro': 'São Paulo',
  'SP - Zona Sul': 'São Paulo',
  'SP - Zona Oeste': 'São Paulo',
  'SP - Zona Norte': 'São Paulo',
  'SP - Zona Leste': 'São Paulo',
  // Valor anterior à quebra em zonas: hospital que o script não classificou
  // continuou como "São Paulo" e já é a cidade certa.
  'São Paulo': 'São Paulo',
}

/** Regiões que são ESTADO, não cidade. Ficam identificadas como pendência de
 *  cadastro em vez de virarem uma cidade inventada. */
const ESTADOS = new Set(['Pernambuco', 'Bahia', 'Espírito Santo'])

/** Rótulo do grupo onde caem os hospitais cuja região é um estado. */
export const CIDADE_A_DEFINIR = 'A definir a cidade'

/** Rótulo de quem não tem região gravada. Não é cidade: é pendência. */
export const SEM_CIDADE = 'Sem cidade'

/** Cidade de um hospital a partir da região gravada nele. */
export function cidadeDaRegiao(regiao: string | null | undefined): string {
  const r = (regiao || '').trim()
  if (!r || r === SEM_REGIAO) return SEM_CIDADE
  if (ZONAS_DA_CAPITAL[r]) return ZONAS_DA_CAPITAL[r]
  if (ESTADOS.has(r)) return CIDADE_A_DEFINIR
  // O resto do catálogo já é cidade (Campinas, Guarulhos, Osasco…), e uma
  // região fora do catálogo passa adiante com o nome que tem: some da tela é
  // pior que aparecer com um nome estranho.
  return r
}

/** Ordena cidades em ordem alfabética, com as duas pendências no fim —
 *  elas não são lugares e não devem disputar espaço com quem é. */
export function ordenarCidades(a: string, b: string): number {
  const peso = (c: string) => (c === SEM_CIDADE ? 2 : c === CIDADE_A_DEFINIR ? 1 : 0)
  return peso(a) - peso(b) || a.localeCompare(b, 'pt-BR')
}
