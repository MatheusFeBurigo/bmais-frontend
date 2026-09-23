// Hooks do domínio "progresso" (avanço da construção do produto).
//
// A tela mostra a FUSÃO de duas fontes: o catálogo estático (roadmap: id, nome,
// grupo, datas previstas) e os ajustes gravados no banco. Desde a migration
// 0031 o ajuste que importa é o percentual POR ETAPA — dele saem, por cálculo,
// a situação de cada etapa, o avanço do módulo e o avanço geral do projeto.
//
// É esse encadeamento que torna os números confiáveis para a diretoria: mexer
// numa etapa move o módulo e o total na mesma hora, sem três valores digitados
// à parte que podem se contradizer.
import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import {
  descartarProgressoModulo, fetchProgresso, salvarProgressoModulo,
  type AjustesProgresso, type DataEtapa,
} from '../services/progresso.service'
import { MODULOS, type ModuloProjeto } from '../components/progresso/dados'
import {
  etapasPctDerivadas, faseDoPct, pctDoModulo, pctGeral,
} from '../components/progresso/calculo'

/** Módulo já com o ajuste aplicado, pronto para a tela. */
export interface ModuloResolvido extends ModuloProjeto {
  /** Avanço de cada etapa. É a fonte de `pct` e de `fases`. */
  etapasPct: number[]
  /** True quando o valor exibido veio de um ajuste manual, e não do catálogo. */
  ajustado: boolean
  ajustadoPor?: string | null
  ajustadoEm?: string | null
}

function aplicar(ajustes: AjustesProgresso | undefined): ModuloResolvido[] {
  return MODULOS.map((m) => {
    const a = ajustes?.[m.id]

    // Sem ajuste nenhum: o catálogo manda, e ele já traz as etapas semeadas.
    if (!a) {
      const etapasPct = [...m.etapasPct]
      return {
        ...m, etapasPct, pct: pctDoModulo(etapasPct),
        fases: etapasPct.map(faseDoPct), ajustado: false,
      }
    }

    // Com ajuste: `etapas_pct` é a fonte. Quando falta (ajuste feito antes da
    // 0031), deriva da `etapa_atual` que aquele ajuste gravou — assim o que já
    // foi corrigido não volta a zero.
    const etapasPct = a.etapas_pct ?? etapasPctDerivadas(a.etapa_atual)

    return {
      ...m,
      etapasPct,
      pct: pctDoModulo(etapasPct),
      fases: etapasPct.map(faseDoPct),
      // Datas ajustadas vencem as do catálogo; ausentes, o catálogo segue.
      datas: a.datas ?? m.datas,
      // O ajuste manual É a apuração agora: a etiqueta "etapa estimada" some
      // assim que alguém afirma em que ponto o módulo está.
      inferido: false,
      ajustado: true,
      ajustadoPor: a.ajustado_por,
      ajustadoEm: a.ajustado_em,
    }
  })
}

/** Módulos com os ajustes aplicados e o avanço geral calculado.
 *
 *  Enquanto a resposta não chega, devolve o catálogo — a tela nunca fica vazia,
 *  e os valores só mudam se houver ajuste gravado. */
export function useProgresso() {
  const q = useQuery({
    queryKey: queryKeys.progresso(),
    queryFn: fetchProgresso,
    staleTime: 60_000,
  })
  const modulos = useMemo(() => aplicar(q.data?.modulos), [q.data])
  // O geral sai da média dos módulos em tela: o número do topo passa a ser
  // explicável por quem olha a lista logo abaixo.
  const geral = useMemo(() => pctGeral(modulos), [modulos])
  return { ...q, modulos, geral }
}

export interface SalvarProgressoArgs {
  moduloId: string
  /** Derivado de `etapasPct`, mantido por compatibilidade com a 0029. */
  etapa: number | null
  /** Idem: a média das etapas. */
  pct: number
  datas?: DataEtapa[]
  etapasPct?: number[]
}

export function useSalvarProgresso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ moduloId, etapa, pct, datas, etapasPct }: SalvarProgressoArgs) =>
      salvarProgressoModulo(moduloId, etapa, pct, datas, etapasPct),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.progresso() }),
  })
}

export function useDescartarProgresso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (moduloId: string) => descartarProgressoModulo(moduloId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.progresso() }),
  })
}
