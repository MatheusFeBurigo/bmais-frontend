// Hook de estado de servidor do domínio "configuracoes".
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { fetchConfiguracoes, type ConfiguracoesParams } from '../services/configuracoes.service'

export function useConfiguracoes(params: ConfiguracoesParams) {
  return useQuery({
    queryKey: queryKeys.configuracoes(params.op ?? '', params.hospital ?? ''),
    queryFn: () => fetchConfiguracoes(params),
  })
}
