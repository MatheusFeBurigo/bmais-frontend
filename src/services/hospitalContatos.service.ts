// Contatos por área, censo e avisos do App na ficha do hospital (23/11/2026,
// migration 0068). Só o administrador, por ora. Backend: routes/hospital_contatos.py.
// O App do auditor lê o mesmo cadastro (GET /api/me/hospitais) na página do hospital.
import { apiFetch } from '../api/client'

export interface ContatoHospital {
  id: number
  area: string
  nome: string
  cargo: string | null
  telefone: string | null
  email: string | null
  desde: string | null
  /** Preenchido quando a pessoa saiu da ficha (nada se apaga). */
  ate: string | null
  motivo_saida: string | null
}

export interface AvisoContatoApp {
  id: number
  hospital_key: string
  /** Só na lista de pendentes de todos os hospitais. */
  hospital_nome?: string
  texto: string
  em: string | null
  profissional_nome: string
  profissional_tipo: string | null
  tratado: { em: string | null; por_nome: string | null } | null
}

export interface FichaContatos {
  /** Falso enquanto a migration 0068 não estiver no banco. */
  disponivel: boolean
  areas: string[]
  essenciais: string[]
  faltam_essenciais: string[]
  bairro: string | null
  censo: { via: string | null; hora: string | null }
  contatos: ContatoHospital[]
  saidas: ContatoHospital[]
  avisos: AvisoContatoApp[]
}

export interface DadosContato {
  area?: string
  nome: string
  cargo?: string | null
  telefone?: string | null
  email?: string | null
}

export const fetchContatosHospital = (key: string): Promise<FichaContatos> =>
  apiFetch(`/hospital/${encodeURIComponent(key)}/contatos`)

export const incluirContato = (key: string, body: DadosContato): Promise<{ contato: ContatoHospital }> =>
  apiFetch(`/hospital/${encodeURIComponent(key)}/contatos`, { method: 'POST', body })

export const corrigirContato = (id: number, body: DadosContato): Promise<{ contato: ContatoHospital }> =>
  apiFetch(`/hospital-contatos/${id}`, { method: 'PATCH', body })

export const trocarContato = (id: number, body: DadosContato & { motivo: string }):
  Promise<{ saiu: ContatoHospital; contato: ContatoHospital }> =>
  apiFetch(`/hospital-contatos/${id}/trocar`, { method: 'POST', body })

export const tirarContato = (id: number, motivo: string): Promise<{ saiu: ContatoHospital }> =>
  apiFetch(`/hospital-contatos/${id}/tirar`, { method: 'POST', body: { motivo } })

export const salvarCensoHospital = (key: string, body: { via: string | null; hora: string | null; bairro: string | null }) =>
  apiFetch<{ censo: { via: string | null; hora: string | null }; bairro: string | null }>(
    `/hospital/${encodeURIComponent(key)}/censo`, { method: 'PUT', body })

export const fetchAvisosPendentes = (): Promise<{ avisos: AvisoContatoApp[] }> => apiFetch('/hospital-avisos')

export const tratarAviso = (id: number): Promise<{ aviso: AvisoContatoApp }> =>
  apiFetch(`/hospital-avisos/${id}/tratar`, { method: 'POST', body: {} })
