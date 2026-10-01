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
    descricao: 'Relatórios enviados pelo operacional. O técnico confere e aprova ou devolve',
    cor: 'var(--info)',
    corBg: 'var(--info-bg)',
  },
  {
    key: 'relatorios_devolvidos',
    titulo: 'Devolvidos',
    descricao: 'O técnico pediu correção. Quem escreveu corrige e reenvia',
    cor: 'var(--danger)',
    corBg: 'var(--danger-bg)',
  },
  {
    key: 'em_prorrogacao',
    titulo: 'Em prorrogação',
    descricao: 'Prorrogação aprovada e em curso. Quando termina, o paciente volta para Sem relatório',
    cor: 'var(--caution)',
    corBg: 'var(--caution-bg)',
  },
  // ── Fluxo de censos: um card por hospital, e o card anda sozinho ──────────
  // A coluna vem da data do último censo recebido. Manuais: "Marcar como
  // cobrado" (atrasados → aguardando retorno) e "Marcar como atualizado"
  // (aguardando retorno → atualizados, quando não há censo novo a gerar).
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
]

const CHAVES_CENSO: KanbanColuna[] = [
  'censos_atrasados', 'aguardando_retorno', 'aguardando_censo', 'censos_processados',
]

/** As colunas de paciente (a fila do técnico e a aprovação de relatório, no
 *  mesmo quadro) e as de censo (do administrativo). */
export const COLUNAS_PACIENTE = COLUNAS.filter((c) => !CHAVES_CENSO.includes(c.key))
export const COLUNAS_CENSO = COLUNAS.filter((c) => CHAVES_CENSO.includes(c.key))

export function colunaKanban(key: KanbanColuna): ColunaKanban | undefined {
  return COLUNAS.find((c) => c.key === key)
}
