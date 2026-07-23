// Traduz os rótulos crus de pendência (do backend) em texto claro de AÇÃO para o
// analista. O backend grava vocabulários diferentes conforme a origem:
//
//   • Relatório (coluna "Revisão Relatório"): palavras soltas — hospital, paciente,
//     observações, médico, data (relatorios_validador.py). São ambíguas no card:
//     "paciente" não é um campo em branco, é um VÍNCULO faltante (o relatório não
//     casou com nenhuma internação). Este módulo resolve essa ambiguidade.
//
//   • Censo (coluna "Refazer análise"): frases já legíveis, mas com jargão
//     ("chave de identidade"). Passam por uma limpeza leve, com fallback ao texto
//     original quando não reconhecidas (o validador pode gerar variações dinâmicas,
//     ex.: "data ... em formato inválido: '...'").
//
// Renderização é feita em Kanban.tsx; nada aqui altera o backend.

// ── Campos faltantes de RELATÓRIO (palavras soltas) ──────────────────────────
// Rótulo curto (chip) + explicação (tooltip / texto de apoio) + variante de badge.
export interface CampoFaltanteInfo {
  /** Texto curto exibido no chip. */
  label: string
  /** O que de fato faltou e qual a ação esperada — vira title/tooltip. */
  explicacao: string
  variant: 'danger' | 'warning' | 'caution' | 'muted'
}

export const CAMPO_FALTANTE: Record<string, CampoFaltanteInfo> = {
  paciente: {
    label: 'Sem paciente vinculado',
    explicacao:
      'O relatório não foi ligado a nenhuma internação: o nome veio vazio ou não ' +
      'casou com nenhum paciente internado. Escolha a internação à mão para encaixar.',
    variant: 'danger',
  },
  hospital: {
    label: 'Hospital não identificado',
    explicacao:
      'Não reconhecemos de qual hospital é o documento (cabeçalho não identificado).',
    variant: 'danger',
  },
  médico: {
    label: 'Médico não capturado',
    explicacao:
      'O nome do médico auditor não foi lido do cabeçalho do relatório. Preencha à mão.',
    variant: 'caution',
  },
  data: {
    label: 'Data não capturada',
    explicacao:
      'A data do relatório não foi lida do documento. Informe a data da visita.',
    variant: 'caution',
  },
  observações: {
    label: 'Sem observações',
    explicacao:
      'O parecer/observação do paciente veio em branco no documento. Preencha à mão.',
    variant: 'warning',
  },
}

/** Info de um campo faltante de relatório, com fallback para rótulos não mapeados. */
export function campoFaltanteInfo(campo: string): CampoFaltanteInfo {
  return CAMPO_FALTANTE[campo] || { label: campo, explicacao: '', variant: 'muted' }
}

// ── Motivos de CENSO (frases) ────────────────────────────────────────────────
// Motivos fixos → texto sem jargão. Motivos dinâmicos (com valores interpolados)
// não estão aqui; caem no fallback e são exibidos como vieram.
const MOTIVO_CENSO: Record<string, string> = {
  'sem atendimento (chave de identidade)':
    'Nº de atendimento não lido — é o código que identifica a internação. Sem ele não dá para saber de quem é o registro.',
  'sem nome': 'Nome do paciente não foi lido do documento.',
  'sem data de entrada': 'Data de internação não foi lida (obrigatória para internados).',
  'situação ALTA sem data de alta válida':
    'Registro marcado como alta, mas sem uma data de alta legível.',
}

/** Texto claro de um motivo de censo; devolve o próprio motivo se não for mapeado. */
export function motivoCensoTexto(motivo: string): string {
  return MOTIVO_CENSO[motivo] || motivo
}
