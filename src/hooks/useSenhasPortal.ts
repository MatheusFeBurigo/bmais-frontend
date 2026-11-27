// Hooks do Módulo 2 > Senhas (senhas do dia cadastradas pela B+, 0070).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, queryRoots } from '../lib/queryKeys'
import {
  cadastrarSenha, decidirContagem, enviarContagem, fetchContagem, fetchSenhasPortal, lembrarSenha, redirecionarSenha, removerSenha, senhaSaiuDoPortal,
} from '../services/senhasPortal.service'
import type { NovaSenha } from '../services/senhasPortal.service'

export function useSenhasPortal() {
  return useQuery({
    queryKey: queryKeys.senhasPortal(),
    queryFn: fetchSenhasPortal,
    staleTime: 30_000,
    // O auditor lança pelo App: a lista se atualiza sozinha para a situação mudar sem recarregar.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
}

function useEscrita<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: queryRoots.senhasPortal }) })
}

export const useCadastrarSenha = () => useEscrita((b: NovaSenha) => cadastrarSenha(b))
export const useRedirecionarSenha = () =>
  useEscrita((v: { id: number; profissional_id: number; motivo: string }) => redirecionarSenha(v.id, { profissional_id: v.profissional_id, motivo: v.motivo }))
export const useLembrarSenha = () => useEscrita((id: number) => lembrarSenha(id))
export const useSaiuDoPortal = () => useEscrita((id: number) => senhaSaiuDoPortal(id))
export const useRemoverSenha = () => useEscrita((v: { id: number; motivo: string }) => removerSenha(v.id, v.motivo))

export function useContagem(comp: string) {
  return useQuery({ queryKey: queryKeys.senhasContagem(comp), queryFn: () => fetchContagem(comp), staleTime: 30_000 })
}
export const useEnviarContagem = () => useEscrita((comp: string) => enviarContagem(comp))
export const useDecidirContagem = () =>
  useEscrita((v: { comp: string; aprovar: boolean; motivo?: string }) => decidirContagem(v.comp, v.aprovar, v.motivo))
