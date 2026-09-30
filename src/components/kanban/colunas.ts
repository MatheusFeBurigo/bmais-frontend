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
    descricao: 'Internados sem relatório de auditoria e sem visita marcada',
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
  // ── Fluxo de censos: um card por hospital, e o card anda sozinho ──────────
  // A coluna vem da data do último censo recebido; só "Marcar como cobrado"
  // é manual (atrasados → aguardando retorno).
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
    descricao: 'Já cobrados. Saem daqui quando o censo chegar',
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
    titulo: 'Censos processados',
    descricao: 'Censo de hoje já recebido',
    cor: 'var(--success)',
    corBg: 'var(--success-bg)',
  },
]

const CHAVES_CENSO: KanbanColuna[] = [
  'censos_atrasados', 'aguardando_retorno', 'aguardando_censo', 'censos_processados',
]

/** As colunas de paciente (trabalho do técnico) e as de censo (do administrativo). */
export const COLUNAS_PACIENTE = COLUNAS.filter((c) => !CHAVES_CENSO.includes(c.key))
export const COLUNAS_CENSO = COLUNAS.filter((c) => CHAVES_CENSO.includes(c.key))

export function colunaKanban(key: KanbanColuna): ColunaKanban | undefined {
  return COLUNAS.find((c) => c.key === key)
}
