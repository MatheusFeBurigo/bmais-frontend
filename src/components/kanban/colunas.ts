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
  {
    key: 'cobrancas',
    titulo: 'Cobrar censo',
    descricao: 'Hospitais que não enviaram o censo do dia anterior',
    cor: 'var(--primary)',
    corBg: 'var(--primary-soft)',
  },
]

export function colunaKanban(key: KanbanColuna): ColunaKanban | undefined {
  return COLUNAS.find((c) => c.key === key)
}
