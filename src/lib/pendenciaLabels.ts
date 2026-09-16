// Traduz os motivos crus de pendência de CENSO (do backend) no texto que o
// usuário lê na tela de upload.
//
// Regra deste arquivo: o texto fala com QUEM ENVIA O CENSO, não com quem
// programou. Diz o que está faltando e o que fazer — nunca por que o sistema não
// conseguiu ("não reconhecido", "formato inválido", "chave de identidade").
//
// O validador do backend gera duas famílias de motivo:
//   - FIXOS      → mapeados um a um em MOTIVO_CENSO;
//   - DINÂMICOS  → trazem valores interpolados (e `repr()` do Python, com aspas
//                  simples). Reescritos por PADRÕES abaixo; sem isso vazariam
//                  crus para a tela, do jeito que o Python os formatou.
// Nada aqui altera o backend.

const MOTIVO_CENSO: Record<string, string> = {
  'sem atendimento (chave de identidade)':
    'O número de atendimento não veio no censo. É ele que identifica a internação. Informe para continuar.',
  'sem nome': 'O nome do paciente não veio no censo.',
  'sem data de entrada': 'A data de internação não veio no censo.',
  'situação ALTA sem data de alta válida':
    'O paciente consta como alta, mas a data da alta não veio no censo.',
}

/** Tira o repr() do Python: "'05/04/26'" → "05/04/26". */
function semAspas(v: string): string {
  return v.trim().replace(/^['"]|['"]$/g, '')
}

// Motivos com valor interpolado. Cada padrão devolve a frase já pronta.
const PADROES: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [
    /^data de entrada em formato inválido: (.+)$/,
    (m) => `A data de internação veio como “${semAspas(m[1])}”, que não é uma data. Informe a data correta.`,
  ],
  [
    /^data de alta em formato inválido: (.+)$/,
    (m) => `A data de alta veio como “${semAspas(m[1])}”, que não é uma data. Informe a data correta.`,
  ],
  [
    /^data de alta \((.+?)\) anterior à entrada \((.+?)\)$/,
    (m) => `A alta (${semAspas(m[1])}) está antes da internação (${semAspas(m[2])}). Corrija uma das duas datas.`,
  ],
]

/** Texto que o usuário lê para um motivo de pendência de censo. */
export function motivoCensoTexto(motivo: string): string {
  const fixo = MOTIVO_CENSO[motivo]
  if (fixo) return fixo
  for (const [re, formatar] of PADROES) {
    const m = motivo.match(re)
    if (m) return formatar(m)
  }
  // Motivo novo que o backend passou a gerar e ainda não foi traduzido aqui.
  // Mostrar a frase crua é melhor do que esconder o problema, mas ela tende a
  // soar técnica — ao adicionar motivos no validador, mapeie-os acima.
  return motivo
}

// ── Tipo do censo ────────────────────────────────────────────────────────────
// O backend usa chaves internas ("misto", "altas", "internados"); na tela elas
// viram o nome que quem trabalha com o censo reconhece.
const TIPO_CENSO: Record<string, string> = {
  misto: 'Internados e altas',
  altas: 'Altas',
  internados: 'Internados',
}

/** Nome do tipo de censo para a tela; null quando o tipo não veio. */
export function tipoCensoTexto(tipo?: string | null): string | null {
  if (!tipo) return null
  return TIPO_CENSO[tipo] ?? tipo
}
