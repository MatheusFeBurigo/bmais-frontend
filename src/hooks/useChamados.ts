// Hooks do domínio "chamados" (dúvidas ao suporte).
//
// O backend é serverless e não mantém conexão aberta, então a conversa chega
// por revalidação periódica (mesma saída de lib/autoRefresh). Os intervalos
// são próprios porque o ritmo é outro: numa conversa aberta, esperar 30s pela
// resposta de quem está do outro lado pareceria travamento.
import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invalidarPorEvento } from '../lib/invalidation'
import { queryKeys } from '../lib/queryKeys'
import {
  abrirChamado, cancelarChamado, encerrarChamado, fetchChamados, fetchChamadosNaoLidos,
  fetchConversa, reabrirChamado, responderChamado,
  type ListaChamados,
} from '../services/chamados.service'

const CONVERSA_MS = 10_000
const LISTA_MS = 30_000
// O aviso do menu é consultado de toda tela: o mais espaçado dos três.
const AVISO_MS = 60_000

export function useChamados() {
  return useQuery({
    queryKey: queryKeys.chamados(),
    queryFn: fetchChamados,
    refetchInterval: LISTA_MS,
    refetchOnWindowFocus: true,
    staleTime: CONVERSA_MS,
  })
}

/** Quantos chamados têm mensagem nova para quem está logado. */
export function useChamadosNaoLidos(ativo = true) {
  const q = useQuery({
    queryKey: queryKeys.chamadosNaoLidos(),
    queryFn: fetchChamadosNaoLidos,
    enabled: ativo,
    refetchInterval: AVISO_MS,
    refetchOnWindowFocus: true,
    staleTime: LISTA_MS,
    // O aviso é acessório: se a consulta falhar, o menu segue sem ele, e
    // repetir a tentativa só multiplicaria o erro em toda tela.
    retry: false,
  })
  return q.data?.nao_lidos ?? 0
}

export function useConversa(id: number | null) {
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: queryKeys.chamado(id ?? 0),
    queryFn: () => fetchConversa(id as number),
    enabled: id != null,
    refetchInterval: CONVERSA_MS,
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  // Buscar a conversa já a marcou como lida no servidor. A lista em cache ainda
  // diz o contrário até a próxima revalidação: acerta aqui, para o ponto de
  // "não lido" sumir no clique e não meio minuto depois.
  const { dataUpdatedAt } = q
  useEffect(() => {
    if (id == null || !dataUpdatedAt) return
    const lista = qc.getQueryData<ListaChamados>(queryKeys.chamados())
    if (!lista?.chamados.some((c) => c.id === id && c.nao_lido)) return
    qc.setQueryData<ListaChamados>(queryKeys.chamados(), {
      ...lista,
      chamados: lista.chamados.map((c) => (c.id === id ? { ...c, nao_lido: false } : c)),
    })
    void qc.invalidateQueries({ queryKey: queryKeys.chamadosNaoLidos() })
  }, [id, dataUpdatedAt, qc])

  return q
}

export function useAbrirChamado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ assunto, mensagem }: { assunto: string; mensagem: string }) =>
      abrirChamado(assunto, mensagem),
    onSuccess: () => invalidarPorEvento(qc, 'chamadoAlterado'),
  })
}

export function useResponderChamado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, texto }: { id: number; texto: string }) => responderChamado(id, texto),
    onSuccess: () => invalidarPorEvento(qc, 'chamadoAlterado'),
  })
}

export function useEncerrarChamado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => encerrarChamado(id),
    onSuccess: () => invalidarPorEvento(qc, 'chamadoAlterado'),
  })
}

export function useCancelarChamado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => cancelarChamado(id),
    onSuccess: () => invalidarPorEvento(qc, 'chamadoAlterado'),
  })
}

export function useReabrirChamado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => reabrirChamado(id),
    onSuccess: () => invalidarPorEvento(qc, 'chamadoAlterado'),
  })
}
