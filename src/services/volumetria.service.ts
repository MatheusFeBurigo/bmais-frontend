// Serviço de dados do painel de Volumetria (carga de trabalho por pessoa).
import { apiFetch } from '../api/client'
import type {
  AtividadeGrupo, AtividadeResposta, VolumetriaCompartilharCorpo, VolumetriaDividirCorpo,
  VolumetriaParametros, VolumetriaParametrosCorpo, VolumetriaPayload,
} from '../types/api'

export function fetchVolumetria(): Promise<VolumetriaPayload> {
  return apiFetch<VolumetriaPayload>('/volumetria')
}

/** Vincula uma pessoa (do grupo do coordenador logado) a um hospital. */
export function vincularPessoa(hospitalKey: string, userId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/volumetria/hospital/${encodeURIComponent(hospitalKey)}/pessoas`, {
    method: 'POST',
    body: { user_id: userId },
  })
}

/** Desvincula uma pessoa de um hospital. */
export function desvincularPessoa(hospitalKey: string, userId: string): Promise<{ ok: boolean }> {
  return apiFetch(
    `/volumetria/hospital/${encodeURIComponent(hospitalKey)}/pessoas/${encodeURIComponent(userId)}`,
    { method: 'DELETE' },
  )
}

/** Dá uma operadora a um operacional (a área dele é por operadora). */
export function vincularOperadora(operadoraKey: string, userId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/volumetria/operadora/${encodeURIComponent(operadoraKey)}/pessoas`, {
    method: 'POST',
    body: { user_id: userId },
  })
}

/** Tira uma operadora de um operacional. */
export function desvincularOperadora(operadoraKey: string, userId: string): Promise<{ ok: boolean }> {
  return apiFetch(
    `/volumetria/operadora/${encodeURIComponent(operadoraKey)}/pessoas/${encodeURIComponent(userId)}`,
    { method: 'DELETE' },
  )
}

/** Divide a carga de uma pessoa entre colegas do grupo por um período. */
export function dividirCarga(corpo: VolumetriaDividirCorpo): Promise<{ ok: boolean; lote: string }> {
  return apiFetch('/volumetria/divisoes', { method: 'POST', body: corpo })
}

/** Cancela uma divisão: os hospitais voltam para quem os cedeu. Encerra também
 *  os hospitais dados por um período (saem de quem os recebeu). */
export function cancelarDivisao(lote: string): Promise<{ ok: boolean }> {
  return apiFetch(`/volumetria/divisoes/${encodeURIComponent(lote)}`, { method: 'DELETE' })
}

/** Dá hospitais a uma pessoa por um período, sem tirá-los de quem os tem. */
export function compartilharHospitais(corpo: VolumetriaCompartilharCorpo): Promise<{ ok: boolean; lote: string }> {
  return apiFetch('/volumetria/compartilhamentos', { method: 'POST', body: corpo })
}

export interface FiltrosAtividade {
  /** Ausente: o backend abre no grupo do coordenador (gestor e admin, em todos). */
  grupo?: AtividadeGrupo
  usuario?: string
  q?: string
}

/** Uma página da aba "Acontecendo agora", mais recentes primeiro. */
export function fetchAtividade(filtros: FiltrosAtividade, antesDe?: number): Promise<AtividadeResposta> {
  const p = new URLSearchParams()
  if (filtros.grupo) p.set('grupo', filtros.grupo)
  if (filtros.usuario) p.set('usuario', filtros.usuario)
  if (filtros.q) p.set('q', filtros.q)
  if (antesDe) p.set('antes_de', String(antesDe))
  const qs = p.toString()
  return apiFetch<AtividadeResposta>(`/volumetria/atividade${qs ? `?${qs}` : ''}`)
}

export type GrupoVolumetria = 'tecnico' | 'administrativo'

/** PUT parcial dos parâmetros de carga do grupo. Devolve os parâmetros efetivos. */
export function salvarParametros(
  grupo: GrupoVolumetria, corpo: VolumetriaParametrosCorpo,
): Promise<{ ok: boolean; parametros: VolumetriaParametros }> {
  return apiFetch(`/volumetria/parametros/${grupo}`, { method: 'PUT', body: corpo })
}

/** Apaga a calibração: o grupo volta aos padrões. */
export function restaurarParametros(
  grupo: GrupoVolumetria,
): Promise<{ ok: boolean; parametros: VolumetriaParametros }> {
  return apiFetch(`/volumetria/parametros/${grupo}`, { method: 'DELETE' })
}
