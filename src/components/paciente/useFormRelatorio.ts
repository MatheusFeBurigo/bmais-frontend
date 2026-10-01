// Estado e envio do formulário "Registrar relatório", da ficha e do drawer.
// As duas telas mudam só o desenho; validação, envio e mensagem de erro ficam
// aqui para não divergirem.
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRegistrarRelatorio } from '../../hooks/useInternacao'
import { queryKeys } from '../../lib/queryKeys'
import { useAuth } from '../../auth/AuthContext'
import { precisaAprovacao } from '../../auth/permissions'
import { hojeISO, somarDias } from '../../lib/datas'
import type { PeriodoProrrogacao } from '../../types/api'

/** CID escolhido no formulário. A descrição é só para a etiqueta na tela: o
 *  backend grava a do vínculo/catálogo, nunca a que veio daqui. */
export interface CidEscolhido {
  codigo: string
  descricao: string
}

/** Contexto do paciente para sugerir o 1º período da prorrogação. */
export interface ContextoProrrogacao {
  /** Fim da prorrogação vigente (ISO): o próximo período começa no dia seguinte. */
  ate?: string | null
  /** Acomodação sugerida para o 1º período (a da prorrogação vigente). */
  acomodacao?: string | null
}

export function useFormRelatorio(internacaoId: number, {
  dataInicial,
  onRegistrado,
  prorrogacao: ctxProrrogacao,
}: {
  /** Data com que o formulário abre: a ficha sugere hoje; o drawer abre vazio
   *  para o botão só acender depois que o técnico confirma a data. */
  dataInicial: () => string
  /** `pendente`: o relatório foi para a aprovação do técnico em vez de valer já. */
  onRegistrado: (pendente: boolean) => void
  /** Só a ficha "Detalhes" passa: liga a seção "Pedir prorrogação". O painel
   *  lateral da Visão Geral não tem prorrogação. */
  prorrogacao?: ContextoProrrogacao
}) {
  const qc = useQueryClient()
  // Relatório do administrativo espera o técnico, e não leva CID (o CID é dele).
  const { role } = useAuth()
  const vaiParaAprovacao = precisaAprovacao(role)
  const registrar = useRegistrarRelatorio(internacaoId)
  const [dataVisita, setDataVisita] = useState(dataInicial)
  const [medico, setMedico] = useState('')
  const [obs, setObs] = useState('')
  // CIDs que o relatório trata. Os que o paciente ainda não tem entram nele
  // junto com o relatório (só para quem pode atribuir CID; regra do backend).
  const [cids, setCids] = useState<CidEscolhido[]>([])
  const [erro, setErro] = useState<string | null>(null)
  // Pedido de prorrogação (DePara 5.3): fechado até ser marcado.
  const [prrAtiva, setPrrAtiva] = useState(false)
  const [periodos, setPeriodos] = useState<PeriodoProrrogacao[]>([])
  const [justificativa, setJustificativa] = useState('')
  const [complemento, setComplemento] = useState('')

  // O 1º período começa no dia seguinte ao fim da prorrogação vigente; sem ela
  // (ou já terminada), hoje. Mesma regra de domain/prorrogacao.inicio_sugerido.
  function primeiroPeriodo(): PeriodoProrrogacao {
    const hoje = hojeISO()
    const ate = ctxProrrogacao?.ate?.slice(0, 10)
    return {
      acomodacao: ctxProrrogacao?.acomodacao ?? '',
      data_inicio: ate && ate >= hoje ? somarDias(ate, 1) : hoje,
      data_fim: '',
    }
  }

  function alternarProrrogacao(ligar: boolean) {
    setPrrAtiva(ligar)
    if (ligar && periodos.length === 0) setPeriodos([primeiroPeriodo()])
  }

  // O período seguinte continua de onde o último termina, na mesma acomodação.
  function maisPeriodo() {
    setPeriodos((ps) => {
      const ult = ps[ps.length - 1]
      const inicio = ult?.data_fim ? somarDias(ult.data_fim, 1) : hojeISO()
      return [...ps, { acomodacao: ult?.acomodacao ?? '', data_inicio: inicio, data_fim: '' }]
    })
  }

  function mudarPeriodo(i: number, campo: keyof PeriodoProrrogacao, valor: string) {
    setPeriodos((ps) => ps.map((p, j) => (j === i ? { ...p, [campo]: valor } : p)))
  }

  function removerPeriodo(i: number) {
    setPeriodos((ps) => ps.filter((_, j) => j !== i))
  }

  function adicionarCid(c: CidEscolhido) {
    setCids((atual) => atual.some((x) => x.codigo === c.codigo) ? atual : [...atual, c])
  }

  function removerCid(codigo: string) {
    setCids((atual) => atual.filter((c) => c.codigo !== codigo))
  }

  function limpar() {
    setDataVisita(dataInicial())
    setMedico('')
    setObs('')
    setCids([])
    setErro(null)
    setPrrAtiva(false)
    setPeriodos([])
    setJustificativa('')
    setComplemento('')
  }

  async function salvar() {
    if (!dataVisita) {
      setErro('Informe a data da visita')
      return
    }
    const pedeProrrogacao = Boolean(ctxProrrogacao) && prrAtiva
    if (pedeProrrogacao) {
      // As mensagens do DePara (seção 7); o backend confere de novo.
      if (!periodos.length || periodos.some((p) => !p.acomodacao)) {
        setErro('Escolha a acomodação de cada período de prorrogação.')
        return
      }
      if (periodos.some((p) => !p.data_inicio || !p.data_fim || p.data_fim < p.data_inicio)) {
        setErro('Confira as datas de cada período de prorrogação.')
        return
      }
      if (!justificativa) {
        setErro('Escolha a justificativa da prorrogação.')
        return
      }
    }
    setErro(null)
    try {
      await registrar.mutateAsync({
        data_visita: dataVisita, medico, descricao: obs,
        cids: vaiParaAprovacao ? [] : cids.map((c) => c.codigo),
        ...(pedeProrrogacao
          ? { prorrogacao: { periodos, justificativa, complemento } }
          : {}),
      })
      // Um CID novo passou a ser do paciente: o card de CIDs da ficha relê.
      if (cids.length) qc.invalidateQueries({ queryKey: queryKeys.internacaoCids(internacaoId) })
      setCids([])
      onRegistrado(vaiParaAprovacao)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao registrar')
    }
  }

  return {
    internacaoId, dataVisita, setDataVisita, medico, setMedico, obs, setObs,
    cids, adicionarCid, removerCid, vaiParaAprovacao,
    prorrogacao: ctxProrrogacao ? {
      ativa: prrAtiva, alternar: alternarProrrogacao,
      periodos, maisPeriodo, mudarPeriodo, removerPeriodo,
      justificativa, setJustificativa, complemento, setComplemento,
    } : null,
    erro, salvando: registrar.isPending, salvar, limpar,
  }
}

export type FormRelatorio = ReturnType<typeof useFormRelatorio>
