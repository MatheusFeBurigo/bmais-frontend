// Hook de VIEW-STATE da tela de Movimentações: aba, período, filtros e
// paginação da trilha, casados com os dados (useAuditoria*). A página só compõe.
import { useEffect, useMemo, useState } from 'react'
import { useAuditoria, useAuditoriaOpcoes, useAuditoriaResumo } from './useAuditoria'
import { inicioPeriodo, labelPeriodo, type Periodo } from '../components/logs/logs.model'
import type { FiltrosTrilha } from '../components/logs/FiltrosAuditoria'

export type AbaLogs = 'atividade' | 'usuarios'

const LIMITE = 50
const FILTROS_VAZIOS: FiltrosTrilha = { usuario: '', entidade: '', acao: '', q: '' }

// Busca livre com debounce: cada tecla não vira uma requisição.
function useDebounce(valor: string, ms: number): string {
  const [v, setV] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setV(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return v
}

export function useLogsView(enabled: boolean) {
  const [aba, setAba] = useState<AbaLogs>('atividade')
  const [periodo, setPeriodo] = useState<Periodo>('7d')
  const [filtros, setFiltros] = useState<FiltrosTrilha>(FILTROS_VAZIOS)
  const [pagina, setPagina] = useState(0)
  const [abertoId, setAbertoId] = useState<number | null>(null)

  const q = useDebounce(filtros.q.trim(), 350)
  // Recalcula o início do período quando o período muda (meia-noite local).
  const de = useMemo(() => inicioPeriodo(periodo), [periodo])

  const trilha = useAuditoria({
    userId: filtros.usuario, entidade: filtros.entidade, acao: filtros.acao,
    de, q, pagina, limite: LIMITE,
  }, enabled)
  const resumo = useAuditoriaResumo(de, enabled)
  const opcoes = useAuditoriaOpcoes(enabled)

  function setFiltro(patch: Partial<FiltrosTrilha>) {
    setFiltros((f) => ({ ...f, ...patch }))
    setPagina(0)
    setAbertoId(null)
  }

  function limparFiltros() {
    setFiltros(FILTROS_VAZIOS)
    setPagina(0)
    setAbertoId(null)
  }

  function mudarPeriodo(p: Periodo) {
    setPeriodo(p)
    setPagina(0)
    setAbertoId(null)
  }

  /** Painel de usuários → trilha só daquele usuário. */
  function verAtividadeDe(userId: string) {
    setFiltro({ usuario: userId })
    setAba('atividade')
  }

  function toggleAberto(id: number) {
    setAbertoId((atual) => (atual === id ? null : id))
  }

  const temFiltro = Boolean(filtros.usuario || filtros.entidade || filtros.acao || q)

  return {
    aba, setAba,
    periodo, mudarPeriodo, periodoLabel: labelPeriodo(periodo), de,
    filtros, setFiltro, limparFiltros, temFiltro,
    pagina, setPagina, limite: LIMITE,
    abertoId, toggleAberto,
    verAtividadeDe,
    trilha, resumo, opcoes,
    refetchTudo: () => { trilha.refetch(); resumo.refetch() },
  }
}
