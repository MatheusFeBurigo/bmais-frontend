// Serviço de dados do domínio "progresso" (avanço da construção do produto).
//
// O CATÁLOGO dos módulos (id, nome, grupo, datas) é estático e vive em
// components/progresso/dados.ts, porque é o roadmap. O backend guarda só o que
// foi AJUSTADO pela tela: etapa atual e percentual, por módulo.
import { apiFetch } from '../api/client'

/** Prazos de uma etapa. Texto livre: "27/08", "desde 15/09", "out/26". */
export interface DataEtapa {
  inicio?: string | null
  previsto?: string | null
}

export interface AjusteModulo {
  modulo_id: string
  /** 1 a 6, ou null quando o módulo não foi iniciado. */
  etapa_atual: number | null
  pct: number
  /** Datas por etapa, na ordem do catálogo. Ausente = usa as do catálogo. */
  datas?: DataEtapa[] | null
  /** Avanço de CADA etapa: [100, 100, 70, 0, 0, 0]. Fonte da verdade desde a
   *  migration 0031 — o `pct` do módulo é a média disto. */
  etapas_pct?: number[] | null
  ajustado_por?: string | null
  ajustado_em?: string | null
}

/** {modulo_id: ajuste}. Módulo ausente = nunca ajustado (vale o catálogo). */
export type AjustesProgresso = Record<string, AjusteModulo>

export function fetchProgresso(): Promise<{ modulos: AjustesProgresso }> {
  return apiFetch<{ modulos: AjustesProgresso }>('/progresso')
}

/** Grava o ajuste de um módulo. `etapa` null = não iniciado.
 *
 *  `datas` undefined não desce no corpo: o backend entende como "não mexeu" e
 *  mantém as do catálogo. Uma lista vazia é diferente — zera os prazos. */
export function salvarProgressoModulo(
  moduloId: string, etapa: number | null, pct: number,
  datas?: DataEtapa[], etapasPct?: number[],
): Promise<{ ok: boolean; modulo: AjusteModulo }> {
  return apiFetch(`/progresso/${encodeURIComponent(moduloId)}`, {
    method: 'PUT',
    // `etapa_atual` e `pct` continuam no corpo por compatibilidade: são
    // derivados de `etapas_pct`, e um servidor anterior à 0031 ainda os lê.
    body: {
      etapa_atual: etapa, pct,
      ...(datas ? { datas } : {}),
      ...(etapasPct ? { etapas_pct: etapasPct } : {}),
    },
  })
}

/** Descarta o ajuste: o módulo volta ao valor do catálogo. */
export function descartarProgressoModulo(moduloId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/progresso/${encodeURIComponent(moduloId)}`, { method: 'DELETE' })
}
