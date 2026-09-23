// Serviço de dados do painel de Volumetria (carga de trabalho por pessoa).
import { apiFetch } from '../api/client'
import type { VolumetriaParametros, VolumetriaParametrosCorpo, VolumetriaPayload } from '../types/api'

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
