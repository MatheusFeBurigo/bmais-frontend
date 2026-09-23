// Priorização e recorte dos cards do Kanban.
//
// Lógica PURA (sem React, sem fetch): recebe as tarefas já carregadas e devolve
// a fatia + a ordem que a tela mostra. Fica fora do componente porque é a regra
// que o usuário está de fato usando para decidir o que revisar primeiro, e é o
// que precisa continuar valendo se um dia a tela mudar de formato.
//
// Tudo roda no cliente sobre o payload que já veio: o quadro inteiro está em
// memória (o backend manda as colunas completas), então trocar de chip ou de
// ordenação é instantâneo e não gasta uma ida ao servidor.
import type { KanbanTarefa } from '../../types/api'

// ── Sinais do paciente ───────────────────────────────────────────────────────
// Cada sinal responde a "por que este card merece atenção agora?". São a base
// tanto dos chips de filtro quanto das etiquetas do próprio card, para que o que
// o usuário filtra e o que ele vê no card sejam a mesma coisa.

/** Paciente em leito crítico (UTI): prioridade clínica independente do relatório. */
export function ehUTI(t: KanbanTarefa): boolean {
  return (t.tipo_leito || '').toUpperCase() === 'UTI'
}

/** Nunca recebeu visita: sem nenhum relatório registrado até hoje. */
export function nuncaVisitado(t: KanbanTarefa): boolean {
  return !t.data_ultima_visita
}

/** Longa permanência (limite configurado por operadora). */
export function ehLonga(t: KanbanTarefa): boolean {
  return Boolean(t.longa_10 || t.longa_30)
}

/**
 * Urgente: o relatório já venceu a janela da operadora, ou o paciente está em
 * monitoramento e nunca foi visitado. É o corte de "não pode esperar mais um dia".
 */
export function ehUrgente(t: KanbanTarefa): boolean {
  if (t.status_relatorio === 'VENCIDO') return true
  const dias = t.dias_sem_relatorio ?? 0
  const janela = t.janela_relatorio ?? 0
  if (janela > 0 && dias > janela) return true
  return Boolean(t.em_monitoramento && nuncaVisitado(t))
}

// ── Chips de filtro ──────────────────────────────────────────────────────────
// Um chip por sinal, com o predicado ao lado do rótulo: acrescentar um filtro é
// acrescentar uma linha aqui, e a tela (contador + botão) se ajusta sozinha.
export type ChipKey = 'urgente' | 'uti' | 'longa' | 'nunca_visitado'

export interface ChipDef {
  key: ChipKey
  label: string
  /** Frase do tooltip: por que este recorte existe. */
  titulo: string
  /** Cor do chip quando ativo (variável do design-system). */
  cor: string
  corBg: string
  aplica: (t: KanbanTarefa) => boolean
}

export const CHIPS: ChipDef[] = [
  {
    key: 'urgente',
    label: 'Urgentes',
    titulo: 'Relatório vencido, ou em monitoramento sem nenhuma visita',
    cor: 'var(--danger)',
    corBg: 'var(--danger-bg)',
    aplica: ehUrgente,
  },
  {
    key: 'uti',
    label: 'UTI',
    titulo: 'Pacientes em leito de UTI',
    cor: 'var(--warning-2)',
    corBg: 'var(--warning-bg)',
    aplica: ehUTI,
  },
  {
    key: 'longa',
    label: 'Longa permanência',
    titulo: 'Internação acima do limite de dias da operadora',
    cor: 'var(--caution)',
    corBg: 'var(--caution-bg)',
    aplica: ehLonga,
  },
  {
    key: 'nunca_visitado',
    label: 'Nunca visitados',
    titulo: 'Sem nenhum relatório registrado até hoje',
    cor: 'var(--info)',
    corBg: 'var(--info-bg)',
    aplica: nuncaVisitado,
  },
]

// ── Ordenação ────────────────────────────────────────────────────────────────
export type OrdemKey = 'prioridade' | 'dias_sem_relatorio' | 'dias_internado' | 'nome' | 'hospital'

export const ORDENS: Array<{ key: OrdemKey; label: string }> = [
  { key: 'prioridade', label: 'Prioridade' },
  { key: 'dias_sem_relatorio', label: 'Mais dias sem relatório' },
  { key: 'dias_internado', label: 'Mais dias internado' },
  { key: 'nome', label: 'Nome do paciente' },
  { key: 'hospital', label: 'Hospital' },
]

/**
 * Peso de urgência do card (menor = mais urgente), espelhando o `SR_ORDER` do
 * backend (domain/avaliacao.py). Duplicar a escala aqui é deliberado: o quadro
 * reordena no cliente a cada chip/ordem escolhida, e ir ao servidor só para
 * reordenar uma lista que já está em memória seria uma espera sem motivo.
 * Se a escala mudar lá, muda aqui.
 */
const PESO_STATUS: Record<string, number> = {
  SEM_RELATORIO: 0,
  VENCIDO: 1,
  PROXIMO_VENCER: 2,
  EM_DIA: 3,
  ALTA_SEM_REL: 4,
  ALTA_REL_VENCIDO: 5,
  ALTA_OK: 6,
  ALTA_AUTO: 7,
}

function comparar(a: KanbanTarefa, b: KanbanTarefa, ordem: OrdemKey): number {
  switch (ordem) {
    case 'dias_sem_relatorio':
      return (b.dias_sem_relatorio ?? -1) - (a.dias_sem_relatorio ?? -1)
    case 'dias_internado':
      return (b.dias ?? -1) - (a.dias ?? -1)
    case 'nome':
      return (a.titulo || '').localeCompare(b.titulo || '', 'pt-BR')
    case 'hospital':
      return (a.hospital_nome || '').localeCompare(b.hospital_nome || '', 'pt-BR')
    default: {
      // Prioridade = a ordem do backend: status do relatório, depois mais dias sem
      // relatório, depois mais dias internado. UTI desempata antes dos dias porque
      // é o critério clínico mais forte dentro de um mesmo status.
      const ps = (PESO_STATUS[a.status_relatorio || ''] ?? 9) - (PESO_STATUS[b.status_relatorio || ''] ?? 9)
      if (ps !== 0) return ps
      const uti = Number(ehUTI(b)) - Number(ehUTI(a))
      if (uti !== 0) return uti
      const dsr = (b.dias_sem_relatorio ?? 0) - (a.dias_sem_relatorio ?? 0)
      if (dsr !== 0) return dsr
      return (b.dias ?? 0) - (a.dias ?? 0)
    }
  }
}

/** Normaliza para busca: minúsculas e sem acentos, para "joao" casar com "João". */
export function normalizarBusca(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

export interface Recorte {
  busca: string
  chips: ChipKey[]
  hospital: string
  ordem: OrdemKey
}

/**
 * Aplica busca + chips + hospital a uma coluna e devolve a fatia ordenada.
 *
 * Os chips combinam em E (um card precisa satisfazer todos os ativos): quem marca
 * "UTI" e "Urgentes" está procurando a interseção, os casos que não podem esperar.
 *
 * Cards que não são de paciente (cobrança de censo) não têm os sinais clínicos,
 * então ficam de fora quando há chip ativo: mostrá-los num recorte de "UTI" seria
 * ruído. Sem chip, aparecem normalmente.
 */
export function recortarColuna(itens: KanbanTarefa[], r: Recorte): KanbanTarefa[] {
  const q = normalizarBusca(r.busca)
  const ativos = CHIPS.filter((c) => r.chips.includes(c.key))

  const filtrado = itens.filter((t) => {
    if (r.hospital && t.hospital_key !== r.hospital) return false
    if (q) {
      // A busca alcança o que o card agora mostra (leito, médico, convênio) e a
      // identificação alternativa (senha/carteirinha) dos censos sem nome.
      const alvo = normalizarBusca(
        `${t.titulo ?? ''} ${t.atendimento ?? ''} ${t.hospital_nome ?? ''} ` +
        `${t.senha ?? ''} ${t.carteirinha ?? ''} ${t.leito_codigo ?? ''} ` +
        `${t.medico ?? ''} ${t.convenio ?? ''}`,
      )
      if (!alvo.includes(q)) return false
    }
    if (ativos.length) {
      // Card sem internação não é paciente; os sinais clínicos não se aplicam.
      if (t.internacao_id == null) return false
      if (!ativos.every((c) => c.aplica(t))) return false
    }
    return true
  })

  // Cópia antes de ordenar: a lista vem do cache do React Query e não pode ser
  // mutada no lugar (o `sort` nativo é in place).
  return [...filtrado].sort((a, b) => comparar(a, b, r.ordem))
}

/** Quantos cards de uma lista casam cada chip: alimenta o contador do botão. */
export function contarChips(itens: KanbanTarefa[]): Record<ChipKey, number> {
  const out: Record<ChipKey, number> = {
    urgente: 0, uti: 0, longa: 0, nunca_visitado: 0,
  }
  for (const t of itens) {
    if (t.internacao_id == null) continue
    for (const c of CHIPS) if (c.aplica(t)) out[c.key] += 1
  }
  return out
}
