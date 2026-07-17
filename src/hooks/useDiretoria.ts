// Hook de estado de servidor do domínio "diretoria".
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { fetchDiretoria } from '../services/diretoria.service'

export function useDiretoria() {
  return useQuery({
    queryKey: queryKeys.diretoria(),
    queryFn: fetchDiretoria,
  })
}
