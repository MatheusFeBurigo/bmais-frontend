// Hook de estado de servidor do domínio "gestor".
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { fetchGestor, type GestorParams } from '../services/gestor.service'

export function useGestor(params: GestorParams) {
  return useQuery({
    queryKey: queryKeys.gestor(
      params.data ?? '', params.operadora ?? '', params.hospital ?? '', params.regiao ?? '',
    ),
    queryFn: () => fetchGestor(params),
  })
}
