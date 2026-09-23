// Catálogo de regiões dos hospitais — uma lista FECHADA.
//
// A coluna `hospitais.regiao` existe desde o schema inicial e já alimentava o
// agrupamento do Gestor, mas era digitada à mão na ficha. Texto livre produziu
// o que produz sempre: a mesma região escrita de formas diferentes, e 95 das
// 402 linhas em branco. Agora a ficha escolhe de um seletor, e esta é a lista.
//
// São Paulo (capital) aparece quebrada em ZONAS. Ela sozinha tem ~107 hospitais
// distintos: como uma região só, a lista de escolha do escopo ficaria tão longa
// quanto a de operadora que ela veio substituir.
//
// Os grupos abaixo servem à apresentação (o seletor e a tela de acesso mostram
// as regiões agrupadas); o VALOR gravado no banco é sempre a string da região.

export interface GrupoRegioes {
  /** Rótulo do grupo no seletor (optgroup) e na tela de escopo. */
  titulo: string
  regioes: string[]
}

export const GRUPOS_REGIOES: GrupoRegioes[] = [
  {
    titulo: 'São Paulo (capital)',
    regioes: [
      'SP - Centro',
      'SP - Zona Sul',
      'SP - Zona Oeste',
      'SP - Zona Norte',
      'SP - Zona Leste',
    ],
  },
  {
    titulo: 'Grande São Paulo',
    regioes: [
      'Grande ABC',
      'Guarulhos',
      'Osasco',
      'Caieiras',
      'Itapevi',
      'Mogi das Cruzes',
      'Suzano',
      'Taboão da Serra',
      'Arujá',
    ],
  },
  {
    titulo: 'Interior de São Paulo',
    regioes: [
      'Campinas',
      'Vale do Paraíba',
      'Sorocaba',
      'Jundiaí',
      'Americana',
      'Rio Claro',
      'Bragança Paulista',
    ],
  },
  {
    titulo: 'Litoral',
    regioes: ['Litoral'],
  },
  {
    titulo: 'Rio de Janeiro',
    regioes: ['Rio de Janeiro', 'Niterói', 'Barra Mansa'],
  },
  {
    titulo: 'Sul',
    regioes: ['Curitiba', 'Florianópolis', 'Joinville', 'Porto Alegre'],
  },
  {
    titulo: 'Nordeste',
    regioes: ['Pernambuco', 'Bahia'],
  },
  {
    titulo: 'Outros',
    regioes: ['Espírito Santo', 'Campo Grande'],
  },
]

/** Todas as regiões do catálogo, sem agrupamento. */
export const REGIOES: string[] = GRUPOS_REGIOES.flatMap((g) => g.regioes)

/** Rótulo usado quando o hospital não tem região gravada. Não é um valor do
 *  catálogo: nunca é gravado, só exibido. */
export const SEM_REGIAO = 'Sem região'

/** Grupo a que uma região pertence (para a tela de escopo agrupar). Região
 *  fora do catálogo (gravada antes desta lista existir) cai em "Outros" em vez
 *  de sumir da tela. */
export function grupoDaRegiao(regiao: string | null | undefined): string {
  if (!regiao) return SEM_REGIAO
  const g = GRUPOS_REGIOES.find((x) => x.regioes.includes(regiao))
  return g?.titulo ?? 'Outros'
}
