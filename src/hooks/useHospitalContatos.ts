// Hooks dos contatos, do censo e dos avisos do App na ficha do hospital (0068).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, queryRoots } from '../lib/queryKeys'
import {
  corrigirContato, fetchAvisosPendentes, fetchContatosHospital, incluirContato, salvarCensoHospital,
  tirarContato, tratarAviso, trocarContato,
} from '../services/hospitalContatos.service'
import type { DadosContato } from '../services/hospitalContatos.service'

export function useContatosHospital(key: string, ligado = true) {
  return useQuery({
    queryKey: queryKeys.hospitalContatos(key),
    queryFn: () => fetchContatosHospital(key),
    enabled: ligado && !!key,
    staleTime: 30_000,
  })
}

export function useAvisosContatoPendentes(ligado = true) {
  return useQuery({
    queryKey: queryKeys.hospitalAvisos(),
    queryFn: fetchAvisosPendentes,
    enabled: ligado,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  })
}

/** Toda gravação recarrega a ficha e a lista de avisos (uma raiz só). */
function useGravar<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryRoots.hospitalContatos }),
  })
}

export const useIncluirContato = (key: string) => useGravar((d: DadosContato) => incluirContato(key, d))
export const useCorrigirContato = () => useGravar((v: { id: number; d: DadosContato }) => corrigirContato(v.id, v.d))
export const useTrocarContato = () =>
  useGravar((v: { id: number; d: DadosContato & { motivo: string } }) => trocarContato(v.id, v.d))
export const useTirarContato = () => useGravar((v: { id: number; motivo: string }) => tirarContato(v.id, v.motivo))
export const useSalvarCenso = (key: string) =>
  useGravar((b: { via: string | null; hora: string | null; bairro: string | null }) => salvarCensoHospital(key, b))
export const useTratarAviso = () => useGravar((id: number) => tratarAviso(id))
