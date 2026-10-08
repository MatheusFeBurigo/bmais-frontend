// Estado e envio do formulário "Registrar relatório", da ficha e do drawer.
// As duas telas mudam só o desenho; validação, envio e mensagem de erro ficam
// aqui para não divergirem.
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRegistrarRelatorio } from '../../hooks/useInternacao'
import { useCatalogosProrrogacao } from '../../hooks/useKanban'
import { queryKeys } from '../../lib/queryKeys'
import { useAuth } from '../../auth/AuthContext'
import { precisaAprovacao } from '../../auth/permissions'
import { hojeISO, somarDias } from '../../lib/datas'
import type { AceiteFolhaRosa, DetalhesRelatorio, PeriodoProrrogacao } from '../../types/api'
import { useDetalhesRelatorio } from './relatorio/useDetalhesRelatorio'
import { useLista } from './relatorio/useLista'

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
  /** A vigente está pausada: o novo pedido já nasce pausado, para não retomar
   *  sem querer (quem pode, retoma no botão do rodapé). */
  pausada?: boolean | null
}

/** Contexto do paciente para sugerir a acomodação "de" da folha rosa. */
export interface ContextoFolhaRosa {
  /** Onde o paciente está: a acomodação da prorrogação vigente, ou o leito. */
  acomodacao?: string | null
}

/** Contexto do relatório completo (modal da ficha "Detalhes"). */
export interface ContextoCompleto {
  /** Classificação do último relatório: a modal abre com ela. */
  ultimo: DetalhesRelatorio | null
  /** Data da internação (ISO): a 1ª acomodação utilizada começa nela. */
  dataEntrada?: string
}

/** A folha rosa enquanto é preenchida (diárias em texto, como no campo). */
export interface RascunhoFolhaRosa {
  de: string
  para: string
  diarias: string
  data_inicio: string
  data_fim: string
  aceite: AceiteFolhaRosa
  obs: string
}

// Período começa hoje e o aceite em "Sim, carimbado", como no protótipo.
const folhaVazia = (): RascunhoFolhaRosa => ({
  de: '', para: '', diarias: '', data_inicio: hojeISO(), data_fim: '', aceite: 'sim', obs: '',
})

export function useFormRelatorio(internacaoId: number, {
  dataInicial,
  onRegistrado,
  prorrogacao: ctxProrrogacao,
  folhaRosa: ctxFolhaRosa,
  completo: ctxCompleto,
}: {
  /** Data com que o formulário abre: a ficha sugere hoje; o drawer abre vazio
   *  para o botão só acender depois que o técnico confirma a data. */
  dataInicial: () => string
  /** `pendente`: o relatório foi para a aprovação do técnico em vez de valer já. */
  onRegistrado: (pendente: boolean) => void
  /** Só a ficha "Detalhes" passa: liga a seção "Pedir prorrogação". O painel
   *  lateral da Visão Geral não tem prorrogação. */
  prorrogacao?: ContextoProrrogacao
  /** Só a ficha "Detalhes" passa: liga a seção "Aplicar folha rosa". */
  folhaRosa?: ContextoFolhaRosa
  /** Só a modal da ficha passa: relatório completo (0054) e texto do
   *  relatório obrigatório. */
  completo?: ContextoCompleto
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
  // Diagnóstico principal (só a modal o separa): vai como 1º CID e, com a
  // 0054, marcado em `detalhes.cid_principal`. Os demais são os secundários.
  const [cidPrincipal, setCidPrincipal] = useState<CidEscolhido | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  // Pedido de prorrogação (DePara 5.3): fechado até ser marcado.
  const [prrAtiva, setPrrAtiva] = useState(false)
  // Períodos no padrão do portal (acomodação, data inicial, data final e
  // "Adicionar"). O período seguinte já vem começando no dia depois do fim do
  // anterior, na mesma acomodação.
  const periodos = useLista<PeriodoProrrogacao>(
    () => ({ acomodacao: '', data_inicio: '', data_fim: '' }),
    (p) => Boolean(p.acomodacao) && Boolean(p.data_inicio) && Boolean(p.data_fim) && p.data_fim >= p.data_inicio,
    (p) => ({ acomodacao: p.acomodacao, data_inicio: somarDias(p.data_fim, 1), data_fim: '' }),
  )
  const [justificativa, setJustificativa] = useState('')
  const [complemento, setComplemento] = useState('')
  // "Pausar prorrogação" do rodapé da modal: vai no pedido e vale com ele.
  const [prrPausada, setPrrPausada] = useState(false)
  // Folha rosa (custo evitado negociado com o hospital): fechada até ser marcada.
  const [frAtiva, setFrAtiva] = useState(false)
  const [folha, setFolha] = useState<RascunhoFolhaRosa>(folhaVazia)
  // Relatório completo: o estado existe sempre (regra dos hooks), mas só a
  // modal o usa. Sem a 0054 os blocos não aparecem e nada vai no pedido.
  const det = useDetalhesRelatorio()
  const detalhesNoBanco = Boolean(useCatalogosProrrogacao(Boolean(ctxCompleto)).data?.detalhes)

  // `deSugerido` é a acomodação do paciente já casada com o catálogo (quem
  // conhece o catálogo é a seção); só preenche se o "de" ainda está vazio.
  function alternarFolhaRosa(ligar: boolean, deSugerido?: string) {
    setFrAtiva(ligar)
    if (ligar && deSugerido) setFolha((f) => (f.de ? f : { ...f, de: deSugerido }))
  }

  function mudarFolha<K extends keyof RascunhoFolhaRosa>(campo: K, valor: RascunhoFolhaRosa[K]) {
    setFolha((f) => ({ ...f, [campo]: valor }))
  }

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
    if (ligar && !periodos.itens.length && !periodos.rascunho.acomodacao) {
      periodos.carregar([], primeiroPeriodo())
      setPrrPausada(Boolean(ctxProrrogacao?.pausada))
    }
  }

  function adicionarCid(c: CidEscolhido) {
    setCids((atual) => atual.some((x) => x.codigo === c.codigo) ? atual : [...atual, c])
  }

  function removerCid(codigo: string) {
    setCids((atual) => atual.filter((c) => c.codigo !== codigo))
  }

  /** Troca o diagnóstico principal; se ele estava nos secundários, sai de lá. */
  function definirCidPrincipal(c: CidEscolhido | null) {
    setCidPrincipal(c)
    if (c) setCids((atual) => atual.filter((x) => x.codigo !== c.codigo))
  }

  function limpar() {
    setDataVisita(dataInicial())
    setMedico('')
    setObs('')
    setCids([])
    setCidPrincipal(null)
    setErro(null)
    setPrrAtiva(false)
    periodos.carregar([])
    setPrrPausada(false)
    setJustificativa('')
    setComplemento('')
    setFrAtiva(false)
    setFolha(folhaVazia())
    det.iniciar(ctxCompleto?.ultimo ?? null, ctxCompleto?.dataEntrada)
  }

  async function salvar() {
    if (!dataVisita) {
      setErro('Informe a data da visita')
      return
    }
    // Na modal o texto do relatório é obrigatório (no Márcia é); no drawer, não.
    if (ctxCompleto && !obs.trim()) {
      setErro('Escreva o relatório da visita.')
      return
    }
    const pedeProrrogacao = Boolean(ctxProrrogacao) && prrAtiva
    if (pedeProrrogacao) {
      // As mensagens do DePara (seção 7); o backend confere de novo.
      if (periodos.pendente) {
        setErro('Complete a acomodação e as datas do período de prorrogação, ou limpe a linha.')
        return
      }
      if (!periodos.finais().length) {
        setErro('Adicione um período de prorrogação.')
        return
      }
      if (!justificativa) {
        setErro('Escolha a justificativa da prorrogação.')
        return
      }
    }
    const aplicaFolha = Boolean(ctxFolhaRosa) && frAtiva
    const diarias = Number(folha.diarias)
    if (aplicaFolha) {
      // Mesmas mensagens de domain/folha_rosa.py; o backend confere de novo.
      if (!folha.de || !folha.para) {
        setErro('Escolha as acomodações de e para da folha rosa.')
        return
      }
      if (folha.de === folha.para) {
        setErro('Na folha rosa, as acomodações de e para precisam ser diferentes.')
        return
      }
      if (!folha.diarias.trim() || !Number.isInteger(diarias) || diarias < 1 || diarias > 999) {
        setErro('Informe as diárias negociadas na folha rosa.')
        return
      }
      if (folha.data_fim && (!folha.data_inicio || folha.data_fim < folha.data_inicio)) {
        setErro('Confira o período da folha rosa.')
        return
      }
    }
    const comDetalhes = Boolean(ctxCompleto) && detalhesNoBanco
    const erroDetalhes = comDetalhes ? det.conferir() : null
    if (erroDetalhes) {
      setErro(erroDetalhes)
      return
    }
    setErro(null)
    // O principal vai primeiro; o relatório do administrativo não leva CID.
    const todosCids = vaiParaAprovacao ? [] : [...(cidPrincipal ? [cidPrincipal] : []), ...cids]
    try {
      await registrar.mutateAsync({
        data_visita: dataVisita, medico, descricao: obs,
        cids: todosCids.map((c) => c.codigo),
        ...(pedeProrrogacao
          ? { prorrogacao: { periodos: periodos.finais(), justificativa, complemento, pausada: prrPausada } }
          : {}),
        ...(aplicaFolha
          ? { folha_rosa: { ...folha, diarias, obs: folha.obs.trim() } }
          : {}),
        ...(comDetalhes
          ? { detalhes: { ...det.pedido(), cid_principal: vaiParaAprovacao ? '' : (cidPrincipal?.codigo ?? '') } }
          : {}),
      })
      // Um CID novo passou a ser do paciente: o card de CIDs da ficha relê.
      if (todosCids.length) qc.invalidateQueries({ queryKey: queryKeys.internacaoCids(internacaoId) })
      setCids([])
      setCidPrincipal(null)
      onRegistrado(vaiParaAprovacao)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao registrar')
    }
  }

  return {
    internacaoId, dataVisita, setDataVisita, medico, setMedico, obs, setObs,
    cids, adicionarCid, removerCid, cidPrincipal, definirCidPrincipal, vaiParaAprovacao,
    prorrogacao: ctxProrrogacao ? {
      ativa: prrAtiva, alternar: alternarProrrogacao,
      periodos, pausada: prrPausada, setPausada: setPrrPausada,
      justificativa, setJustificativa, complemento, setComplemento,
    } : null,
    folhaRosa: ctxFolhaRosa ? {
      ativa: frAtiva, alternar: alternarFolhaRosa, valores: folha, mudar: mudarFolha,
      acomodacaoPaciente: ctxFolhaRosa.acomodacao ?? null,
    } : null,
    // `noBanco` false = sem a 0054: só o texto obrigatório vale.
    completo: ctxCompleto ? { ...det, noBanco: detalhesNoBanco } : null,
    erro, salvando: registrar.isPending, salvar, limpar,
  }
}

export type FormRelatorio = ReturnType<typeof useFormRelatorio>
