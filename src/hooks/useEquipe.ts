// Hooks de estado de servidor do domínio "equipe".
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { fetchEquipe, fetchProfissional, fetchHospitais, fetchTodosHospitais } from '../services/equipe.service'

export function useEquipe() {
  return useQuery({
    queryKey: queryKeys.equipe(),
    queryFn: fetchEquipe,
  })
}

export function useProfissional(id: number | null) {
  return useQuery({
    queryKey: queryKeys.profissional(id),
    queryFn: () => fetchProfissional(id as number),
    enabled: id != null,
  })
}

export function useHospitais(operadora: string) {
  return useQuery({
    queryKey: queryKeys.hospitais(operadora),
    queryFn: () => fetchHospitais(operadora),
    enabled: Boolean(operadora),
    staleTime: 60_000,
  })
}

/** TODOS os hospitais (sem operadora) — para o multi-select de acesso do usuário. */
export function useTodosHospitais(enabled = true) {
  return useQuery({
    queryKey: queryKeys.hospitais('__todos__'),
    queryFn: fetchTodosHospitais,
    enabled,
    staleTime: 60_000,
  })
}
