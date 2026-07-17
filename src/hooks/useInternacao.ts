// Hook de estado de servidor do domínio "internação".
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { fetchInternacaoDados } from '../services/internacao.service'

export function useInternacaoDados(id: number) {
  return useQuery({
    queryKey: queryKeys.internacaoDados(id),
    queryFn: () => fetchInternacaoDados(id),
  })
}
