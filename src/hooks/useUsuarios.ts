// Hook de estado de servidor do domínio "usuarios".
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { fetchUsuarios } from '../services/usuarios.service'

export function useUsuarios(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.usuarios(),
    queryFn: fetchUsuarios,
    enabled,
  })
}
