// Hooks da autorização para relatório de paciente fora da área (0061).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { podeExecutar } from '../auth/permissions'
import { queryKeys, queryRoots } from '../lib/queryKeys'
import {
  cancelarAutorizacao, decidirAutorizacao, fetchAutorizacaoNaFicha, fetchAutorizacoes,
  fetchContagemAutorizacoes, pedirAutorizacao, type QuaisAutorizacoes,
} from '../services/autorizacoes.service'

// A lista da tela Aprovações e o contador do menu: quem decide precisa ver o
// pedido novo sem recarregar, como os chamados.
const LISTA_MS = 30_000
const AVISO_MS = 60_000

/** A situação do pedido na ficha do paciente. `ativo` falso para quem não pede
 *  (a rota responde a qualquer papel da ficha, mas só interessa a quem pede). */
export function useAutorizacaoNaFicha(internacaoId: number, ativo: boolean) {
  return useQuery({
    queryKey: queryKeys.autorizacaoNaFicha(internacaoId),
    queryFn: () => fetchAutorizacaoNaFicha(internacaoId),
    enabled: ativo && Number.isFinite(internacaoId) && internacaoId > 0,
    staleTime: LISTA_MS,
    // Quem pediu fica com a ficha aberta esperando: a aprovação aparece sozinha.
    refetchInterval: (q) => (q.state.data?.autorizacao?.situacao === 'pendente' ? LISTA_MS : false),
    refetchOnWindowFocus: true,
  })
}

/** A autorização na ficha de um paciente de fora da área: `liberado` diz se a
 *  ficha deve oferecer o registro de relatório. Para quem não pede, a consulta
 *  nem é feita. */
export function useLiberacaoRelatorio(internacaoId: number, foraDaArea: boolean) {
  const { role } = useAuth()
  const pede = foraDaArea && podeExecutar(role, 'pedirAutorizacaoRelatorio')
  const q = useAutorizacaoNaFicha(internacaoId, pede)
  return { pede, liberado: pede && Boolean(q.data?.liberado), dados: q.data }
}

export function usePedirAutorizacao(internacaoId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (motivo: string) => pedirAutorizacao(internacaoId, motivo),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryRoots.autorizacoes }),
  })
}

export function useCancelarAutorizacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => cancelarAutorizacao(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryRoots.autorizacoes }),
  })
}

export function useAutorizacoes(quais: QuaisAutorizacoes) {
  return useQuery({
    queryKey: queryKeys.autorizacoes(quais),
    queryFn: () => fetchAutorizacoes(quais),
    staleTime: LISTA_MS,
    refetchInterval: quais === 'pendentes' ? LISTA_MS : false,
    refetchOnWindowFocus: true,
  })
}

/** Quantas pendentes quem está logado pode decidir (o contador do menu). */
export function useContagemAutorizacoes(ativo: boolean) {
  const q = useQuery({
    queryKey: queryKeys.autorizacoesContagem(),
    queryFn: fetchContagemAutorizacoes,
    enabled: ativo,
    refetchInterval: AVISO_MS,
    refetchOnWindowFocus: true,
    staleTime: LISTA_MS,
    // O contador é acessório: se a consulta falhar (ex.: migration ainda não
    // aplicada), o menu segue sem ele.
    retry: false,
  })
  return q.data?.pendentes ?? 0
}

export function useDecidirAutorizacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: number; aprovar: boolean; resposta: string }) =>
      decidirAutorizacao(v.id, v.aprovar, v.resposta),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryRoots.autorizacoes }),
  })
}
