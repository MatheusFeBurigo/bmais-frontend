// Serviço da tela Linha do tempo (GET /api/auditoria/linha-do-tempo): a trilha de
// Movimentações no formato da tela do protótipo do Bloco 2, já contada no servidor.
import { apiFetch } from '../api/client'
import type { LinhaDoTempoPayload, LinhaPeriodo } from '../types/api'

export interface LinhaDoTempoParams {
  periodo: LinhaPeriodo
  /** Ficha de área ('' = Tudo). */
  area?: string
  operadora?: string
  /** Login de quem fez (o `key` de `pessoas`). */
  quem?: string
  q?: string
  /** Coluna do ritmo: hora `HH` hoje, dia `AAAA-MM-DD` em 7 e 14 dias. */
  balde?: string
  limite?: number
}

export function fetchLinhaDoTempo(p: LinhaDoTempoParams): Promise<LinhaDoTempoPayload> {
  const qs = new URLSearchParams({ periodo: p.periodo })
  if (p.area) qs.set('area', p.area)
  if (p.operadora) qs.set('operadora', p.operadora)
  if (p.quem) qs.set('quem', p.quem)
  if (p.q) qs.set('q', p.q)
  if (p.balde) qs.set('balde', p.balde)
  if (p.limite) qs.set('limite', String(p.limite))
  return apiFetch<LinhaDoTempoPayload>(`/auditoria/linha-do-tempo?${qs.toString()}`)
}
