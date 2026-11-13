// Colunas do quadro de Tarefas: chave do payload, rótulo, cor e descrição.
// Colunas são CATEGORIAS de tarefa (não estágios de progresso).
//
// Extraído de pages/Kanban.tsx para a Volumetria quebrar as demandas de cada
// pessoa com EXATAMENTE os mesmos nomes e cores que ela vê no próprio quadro —
// uma fonte só, em vez de dois textos que divergem.
import type { KanbanColuna } from '../../types/api'

export interface ColunaKanban {
  key: KanbanColuna
  titulo: string
  descricao: string
  cor: string
  corBg: string
}

export const COLUNAS: ColunaKanban[] = [
  {
    key: 'sem_relatorio',
    titulo: 'Sem relatório',
    descricao: 'Internados sem relatório, com o relatório vencido ou com a prorrogação terminada, e sem visita marcada',
    cor: 'var(--warning)',
    corBg: 'var(--warning-bg)',
  },
  {
    key: 'aguardando_visita',
    titulo: 'Aguardando visita',
    descricao: 'Pacientes com visita marcada, ainda dentro do prazo',
    cor: 'var(--info)',
    corBg: 'var(--info-bg)',
  },
  {
    key: 'visitas_atrasadas',
    titulo: 'Visitas atrasadas',
    descricao: 'O horário combinado já passou — o auditor precisa ser cobrado',
    cor: 'var(--danger)',
    corBg: 'var(--danger-bg)',
  },
  // ── Aprovação de paciente: o relatório do administrativo espera o técnico ─
  {
    key: 'aguardando_aprovacao',
    titulo: 'Aguardando aprovação',
    descricao: 'Relatórios enviados pelo operacional. Quem aprova confere, edita se precisar e libera',
    cor: 'var(--info)',
    corBg: 'var(--info-bg)',
  },
  // ── Fluxo de censos: um card por hospital, e o card anda sozinho ──────────
  // A coluna vem da data do último censo recebido. Manuais: "Marcar como
  // cobrado" (atrasados → aguardando retorno) e "Marcar como atualizado"
  // (aguardando retorno ou aguardando censo → atualizados, quando não há censo
  // novo a gerar).
  {
    key: 'censos_atrasados',
    titulo: 'Censos atrasados',
    descricao: 'Falta o censo de ontem ou de antes. Cobre o hospital',
    cor: 'var(--danger)',
    corBg: 'var(--danger-bg)',
  },
  {
    key: 'aguardando_retorno',
    titulo: 'Aguardando retorno',
    descricao: 'Cobrados hoje. Se o dia virar sem censo, voltam para atrasados',
    cor: 'var(--warning)',
    corBg: 'var(--warning-bg)',
  },
  {
    key: 'aguardando_censo',
    titulo: 'Aguardando censo',
    descricao: 'Censo de ontem recebido, o de hoje ainda não',
    cor: 'var(--info)',
    corBg: 'var(--info-bg)',
  },
  {
    key: 'censos_processados',
    titulo: 'Censos atualizados',
    descricao: 'Censo de hoje recebido, ou hospital sem censo novo',
    cor: 'var(--success)',
    corBg: 'var(--success-bg)',
  },
  // ── Acompanhamento (13/11/2026): aba própria, não é pendência ─────────────
  // O paciente em dia também aparece aqui, e o que está sem relatório segue
  // também na fila; por isso não fica ao lado de "Sem relatório".
  {
    key: 'prorrogados',
    titulo: 'Prorrogados',
    descricao: 'Internados com prorrogação em curso, terminando hoje ou pausada. A que termina antes vem primeiro',
    cor: 'var(--indigo)',
    corBg: 'var(--indigo-bg)',
  },
  {
    key: 'negociacao',
    titulo: 'Negociação',
    descricao: 'Internados com negociação (folha rosa) num relatório aprovado, já com a resposta do hospital ou sem aceite informado',
    cor: 'var(--rosa)',
    corBg: 'var(--rosa-bg)',
  },
  {
    key: 'aguardando_aceite',
    titulo: 'Aguardando aceite',
    descricao: 'A negociação mais recente ainda espera o aceite do hospital. A que espera há mais tempo vem primeiro',
    cor: 'var(--warning)',
    corBg: 'var(--warning-bg)',
  },
  {
    // 13/11/2026: o home care saiu da alta e é registrado no relatório.
    key: 'homecare',
    titulo: 'Home care',
    descricao: 'Internados com home care registrado num relatório aprovado. O registro mais recente vem primeiro',
    cor: 'var(--success)',
    corBg: 'var(--success-bg)',
  },
]

const CHAVES_CENSO: KanbanColuna[] = [
  'censos_atrasados', 'aguardando_retorno', 'aguardando_censo', 'censos_processados',
]
const CHAVES_ACOMPANHAMENTO: KanbanColuna[] = ['prorrogados', 'negociacao', 'aguardando_aceite', 'homecare']

/** As colunas de paciente (a fila do técnico e a aprovação de relatório, no
 *  mesmo quadro), as de censo (do administrativo) e as de acompanhamento. */
export const COLUNAS_PACIENTE = COLUNAS.filter(
  (c) => !CHAVES_CENSO.includes(c.key) && !CHAVES_ACOMPANHAMENTO.includes(c.key))
export const COLUNAS_CENSO = COLUNAS.filter((c) => CHAVES_CENSO.includes(c.key))
export const COLUNAS_ACOMPANHAMENTO = COLUNAS.filter((c) => CHAVES_ACOMPANHAMENTO.includes(c.key))

/** Coluna de acompanhamento: a ordem é a do servidor (data da prorrogação ou
 *  do aceite), não a prioridade do relatório. */
export function ehColunaAcompanhamento(key: KanbanColuna | undefined): boolean {
  return key != null && CHAVES_ACOMPANHAMENTO.includes(key)
}

export function colunaKanban(key: KanbanColuna): ColunaKanban | undefined {
  return COLUNAS.find((c) => c.key === key)
}
