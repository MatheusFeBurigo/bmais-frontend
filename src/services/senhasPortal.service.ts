// Módulo 2 > Senhas (23/11/2026, migration 0070): as senhas do dia que a B+ copia à mão do portal
// da operadora (não existe arquivo), para o auditor lançar no App. Só o admin, por ora.
// Backend: routes/senhas_portal.py.
import { apiFetch } from '../api/client'

/** saiu = saiu do portal sem o lançamento dele; perto = vence em até 4 horas. */
export type SituacaoSenha = 'saiu' | 'vencida' | 'perto' | 'pendente' | 'lancada'

export interface SenhaPortal {
  id: number
  senha: string
  operadora_key: string
  operadora_nome: string
  hospital_key: string
  hospital_nome: string
  paciente: string | null
  idade: number | null
  origem: string | null
  solicitada_em: string | null
  prazo_em: string | null
  responsavel: { id: number | null; nome: string | null }
  cadastrada_em: string | null
  cadastrada_por: string | null
  redirecionamentos: { em: string | null; de_nome: string | null; para_nome: string | null; por_nome: string | null; motivo: string | null }[]
  lembretes: { em: string | null; por_nome: string | null }[]
  pedido_em: string | null
  saiu_do_portal_em: string | null
  situacao: SituacaoSenha
  lancamento: { situacao: string; motivo: string | null; em: string | null; por_nome: string | null; via: string; no_prazo: boolean } | null
}

export interface PostoSenha {
  hospital_key: string
  hospital_nome: string
  operadora_key: string
  operadora_nome: string
  auditores: { id: number; nome: string }[]
  /** O titular do posto hoje, que recebe a senha quando ninguém é escolhido. */
  sugerido: number | null
}

export interface ListaSenhasPortal {
  /** Falso enquanto a migration 0070 não estiver no banco. */
  disponivel: boolean
  pode_gerir: boolean
  agora: string
  prazo_horas: number
  senhas: SenhaPortal[]
  opcoes: {
    postos: PostoSenha[]
    operadoras: { key: string; nome: string; formato_texto: string }[]
    auditores: { id: number; nome: string; tipo: string }[]
    origens: string[]
  }
}

export interface NovaSenha {
  hospital_key: string
  operadora_key: string
  senha: string
  paciente?: string | null
  idade?: number | null
  solicitada_em?: string | null
  profissional_id?: number | null
  origem?: string | null
}

export const fetchSenhasPortal = (): Promise<ListaSenhasPortal> => apiFetch('/senhas-portal')
export const cadastrarSenha = (body: NovaSenha): Promise<{ senha: SenhaPortal }> =>
  apiFetch('/senhas-portal', { method: 'POST', body })
export const redirecionarSenha = (id: number, body: { profissional_id: number; motivo: string }): Promise<{ senha: SenhaPortal }> =>
  apiFetch(`/senhas-portal/${id}/redirecionar`, { method: 'POST', body })
export const lembrarSenha = (id: number): Promise<{ senha: SenhaPortal }> =>
  apiFetch(`/senhas-portal/${id}/lembrete`, { method: 'POST', body: {} })
export const senhaSaiuDoPortal = (id: number): Promise<{ senha: SenhaPortal }> =>
  apiFetch(`/senhas-portal/${id}/saiu`, { method: 'POST', body: {} })
export const removerSenha = (id: number, motivo: string): Promise<{ ok: boolean }> =>
  apiFetch(`/senhas-portal/${id}/remover`, { method: 'POST', body: { motivo } })

// ── Contagem do mês (0071): sem a planilha do Bradesco, a conferência é manual ──

export interface LinhaContagem {
  profissional_id: number
  nome: string
  validadas_util: number
  validadas_fds: number
  canceladas: number
  /** Lançadas depois do prazo (só nas senhas cadastradas pela B+, que têm a hora da solicitação). */
  tardias: number
}

export interface ContagemMes {
  disponivel: boolean
  pode_gerir: boolean
  competencia: string
  /** O mês já terminou (só então dá para enviar). */
  fechado: boolean
  /** Enviada ou aprovada: as linhas são o retrato do envio (o passado não recalcula). */
  retrato: boolean
  contagem: {
    estado: 'enviada' | 'aprovada' | 'devolvida'
    estado_nome: string
    enviada_em: string | null
    enviada_por: string | null
    decidida_em: string | null
    decidida_por: string | null
    motivo: string | null
  } | null
  linhas: LinhaContagem[]
}

export const fetchContagem = (comp: string): Promise<ContagemMes> =>
  apiFetch(`/senhas-contagem${comp ? `?comp=${comp}` : ''}`)
export const enviarContagem = (comp: string): Promise<ContagemMes> =>
  apiFetch(`/senhas-contagem/${comp}/enviar`, { method: 'POST', body: {} })
export const decidirContagem = (comp: string, aprovar: boolean, motivo?: string): Promise<ContagemMes> =>
  apiFetch(`/senhas-contagem/${comp}/decidir`, { method: 'POST', body: { aprovar, ...(motivo ? { motivo } : {}) } })
