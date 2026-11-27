// Hooks do Módulo 2 > Auditores (documentos de cada auditor, 0062).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, queryRoots } from '../lib/queryKeys'
import {
  aprovarDocumento, cancelarPedidoDocumento, fetchAuditores, fetchCadastroAuditor, fetchFichaAuditor, inserirDocumento, pedirDocumentos,
  receberDocumento, recusarDocumento, salvarCadastroAuditor, salvarContratoAuditor,
  type NovoCadastro, type NovoContrato,
} from '../services/auditores.service'

const LISTA_MS = 30_000

export function useAuditores() {
  return useQuery({
    queryKey: queryKeys.auditores(),
    queryFn: fetchAuditores,
    staleTime: LISTA_MS,
    refetchOnWindowFocus: true,
  })
}

export function useFichaAuditor(id: number) {
  return useQuery({
    queryKey: queryKeys.auditor(id),
    queryFn: () => fetchFichaAuditor(id),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: LISTA_MS,
    refetchOnWindowFocus: true,
  })
}

// Toda escrita muda a ficha E o resumo da lista: invalida a raiz inteira.
function useEscrita<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryRoots.auditores }),
  })
}

export function usePedirDocumentos(id: number) {
  return useEscrita((v: { tipos: number[]; observacao?: string }) => pedirDocumentos(id, v.tipos, v.observacao))
}

export function useInserirDocumento(id: number) {
  return useEscrita((v: { nome: string; comValidade: boolean; observacao?: string }) =>
    inserirDocumento(id, v.nome, v.comValidade, v.observacao))
}

export function useCancelarPedidoDocumento() {
  return useEscrita((documentoId: number) => cancelarPedidoDocumento(documentoId))
}

/** Aprovar ou recusar o documento que o auditor enviou pelo App (24/11/2026, 0072). */
export function useAprovarDocumento() {
  return useEscrita((documentoId: number) => aprovarDocumento(documentoId))
}

export function useRecusarDocumento() {
  return useEscrita((v: { documentoId: number; motivo: string }) => recusarDocumento(v.documentoId, v.motivo))
}

export function useReceberDocumento(id: number) {
  return useEscrita((v: { tipoId: number; arquivo: File; validade: string }) =>
    receberDocumento(id, v.tipoId, v.arquivo, v.validade))
}

// ── Cadastro e contrato (0065) ───────────────────────────────────────────

export function useCadastroAuditor(id: number) {
  return useQuery({
    queryKey: queryKeys.auditorCadastro(id),
    queryFn: () => fetchCadastroAuditor(id),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: LISTA_MS,
    refetchOnWindowFocus: true,
  })
}

// A resposta já é o cadastro inteiro: entra no cache na hora, sem esperar a releitura.
function useSalvar<V>(id: number, fn: (v: V) => ReturnType<typeof salvarCadastroAuditor>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (dados) => qc.setQueryData(queryKeys.auditorCadastro(id), dados),
  })
}

export function useSalvarCadastroAuditor(id: number) {
  return useSalvar(id, (body: NovoCadastro) => salvarCadastroAuditor(id, body))
}

export function useSalvarContratoAuditor(id: number) {
  return useSalvar(id, (body: NovoContrato) => salvarContratoAuditor(id, body))
}
