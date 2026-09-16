// Utilitários de formatação de texto para exibição.

// Preposições/artigos que, em nomes próprios PT-BR, ficam em minúsculo quando no
// meio do nome (ex.: "Maria da Silva", "João dos Santos"). No início do nome
// sempre capitaliza (não começa nome com "de").
const MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])

/**
 * Converte um nome para "Maiúsculo/minúsculo" (Title Case) próprio para nomes
 * PT-BR. Os censos chegam em CAIXA ALTA ("TERESA VIEIRA SOUZA") — aqui vira
 * "Teresa Vieira Souza". Preposições no meio ficam minúsculas ("Maria da Silva").
 * Preserva hífen ("Ana-Clara") e apóstrofo ("D'Ávila") capitalizando cada parte.
 * Entrada vazia/nula retorna string vazia.
 */
export function nomeProprio(valor?: string | null): string {
  if (!valor) return ''
  const capitalizarToken = (t: string): string =>
    // Recapitaliza cada segmento separado por hífen ou apóstrofo.
    t
      .split(/([-'])/)
      .map((parte) =>
        parte === '-' || parte === "'"
          ? parte
          : parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase(),
      )
      .join('')

  const palavras = valor.trim().toLowerCase().split(/\s+/)
  return palavras
    .map((palavra, i) =>
      i > 0 && MINUSCULAS.has(palavra) ? palavra : capitalizarToken(palavra),
    )
    .join(' ')
}

/**
 * Como identificar um paciente na tela quando o censo não traz o nome.
 *
 * O "Relatório Personalizado" do SOULMV (Clínica São Gonçalo, São Gonçalo,
 * Icaraí — 71 pacientes) não tem coluna de paciente: o hospital identifica a
 * internação pela SENHA de autorização do convênio. O campo `nome` fica vazio de
 * propósito — inventar um nome com a senha ("KKEGN82") engana quem confere o
 * censo contra o PDF e some de qualquer busca por nome.
 *
 * A ordem é a da confiabilidade da identificação: nome, senha, atendimento. O
 * prefixo ("senha", "atend.") é o que impede a leitura errada — sem ele, um
 * código solto na coluna Paciente é lido como se fosse um nome.
 *
 * Nunca devolve vazio: uma linha em branco na coluna do paciente é indistinguível
 * de um erro de carregamento.
 */
export function identificacaoPaciente(p?: {
  nome?: string | null
  senha?: string | null
  atendimento?: string | null
} | null): string {
  const nome = nomeProprio(p?.nome)
  if (nome) return nome
  const senha = (p?.senha || '').trim()
  if (senha) return `senha ${senha}`
  const atendimento = (p?.atendimento || '').trim()
  if (atendimento) return `atend. ${atendimento}`
  return 'sem identificação'
}
