// Hook de estado de servidor da ficha de UM hospital.
// Usado pelo modal de detalhes aberto a partir da coluna "Hospital" das listas:
// a listagem traz só key/nome, a ficha (contatos, endereço, operadoras) vem daqui.
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { fetchHospital, fetchTimelineHospital } from '../services/configuracoes.service'

/** Ficha do hospital. `key` nulo mantém a query parada (modal fechado). */
export function useHospital(key: string | null) {
  return useQuery({
    queryKey: queryKeys.hospital(key ?? ''),
    queryFn: () => fetchHospital(key as string),
    enabled: Boolean(key),
    // Cadastro muda pouco: enquanto a tela estiver aberta, reabrir o mesmo
    // hospital não refaz a chamada.
    staleTime: 5 * 60 * 1000,
  })
}

/** Timeline de censos do hospital (que dias mandou, e quem veio).
 *
 *  Só busca quando `ativo` — a timeline é aberta sob demanda dentro da ficha,
 *  e ela traz os pacientes de até 60 censos: carregar junto com o modal faria
 *  toda consulta de contato pagar por um dado que quase ninguém abre.
 */
export function useTimelineHospital(key: string | null, ativo: boolean) {
  return useQuery({
    queryKey: queryKeys.hospitalTimeline(key ?? ''),
    queryFn: () => fetchTimelineHospital(key as string),
    enabled: Boolean(key) && ativo,
    staleTime: 60 * 1000,
  })
}
