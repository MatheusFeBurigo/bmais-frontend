// Módulo 2 > Fechamentos (16/11/2026, migration 0063): a agenda de fechamentos de
// contas. A coordenação lança a data que o hospital mandou, com o médico e o
// enfermeiro que vão; o trio confirma no App. Aqui também se troca quem vai e se
// cancela. Backend: routes/fechamentos.py.
import { apiFetch } from '../api/client'

/** Situação de cada papel no fechamento. */
export type SituacaoPapel = 'vazio' | 'aguardando' | 'confirmado' | 'troca'
export type Papel = 'medico' | 'enfermeiro'

export interface PessoaNoFechamento {
  id: number | null
  nome: string | null
  situacao: SituacaoPapel
  confirmado_em: string | null
  /** Pedido de troca feito pelo prestador no App. */
  troca_motivo: string | null
  troca_em: string | null
}

export interface Nomeacao {
  em: string
  papel: Papel
  de_nome: string | null
  para_nome: string | null
  por_nome: string | null
  motivo: string | null
}

export interface Fechamento {
  id: number
  hospital_key: string
  hospital_nome: string
  cidade: string
  uf: string
  operadora_key: string
  operadora_nome: string
  data: string
  hora: string
  medico: PessoaNoFechamento
  enfermeiro: PessoaNoFechamento
  contas: { total: number; fechadas: number }
  cancelado: boolean
  cancelado_em: string | null
  cancelado_motivo: string | null
  cancelado_por: string | null
  lancado_por: string | null
  lancado_em: string | null
  nomeacoes: Nomeacao[]
}

/** Par hospital + operadora da escala P, com o médico e o enfermeiro sugeridos. */
export interface ParFechamento {
  hospital_key: string
  hospital_nome: string
  cidade: string
  uf: string
  operadora_key: string
  operadora_nome: string
  medico_id: number | null
  enfermeiro_id: number | null
}

export interface ProfissionalOpcao { id: number; nome: string }

export interface ListaFechamentos {
  /** Falso enquanto a migration 0063 não estiver no banco. */
  disponivel: boolean
  pode_gerir: boolean
  hoje: string
  de: string
  ate: string
  fechamentos: Fechamento[]
  opcoes: {
    pares: ParFechamento[]
    medicos: ProfissionalOpcao[]
    enfermeiros: ProfissionalOpcao[]
  }
}

export interface NovoFechamento {
  hospital_key: string
  operadora_key: string
  data: string
  hora: string
  medico_id: number | null
  enfermeiro_id: number | null
}

export function fetchFechamentos(de: string, ate: string): Promise<ListaFechamentos> {
  return apiFetch(`/fechamentos?de=${encodeURIComponent(de)}&ate=${encodeURIComponent(ate)}`)
}

export function lancarFechamento(body: NovoFechamento): Promise<{ fechamento: Fechamento }> {
  return apiFetch('/fechamentos', { method: 'POST', body })
}

export function nomearNoFechamento(id: number, body: { papel: Papel; profissional_id: number | null; motivo: string | null }):
  Promise<{ fechamento: Fechamento }> {
  return apiFetch(`/fechamentos/${id}/nomear`, { method: 'POST', body })
}

export function cancelarFechamento(id: number, motivo: string | null): Promise<{ fechamento: Fechamento }> {
  return apiFetch(`/fechamentos/${id}/cancelar`, { method: 'POST', body: { motivo } })
}
