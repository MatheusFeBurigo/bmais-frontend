// Estado e envio do formulário "Registrar relatório", da ficha e do drawer.
// As duas telas mudam só o desenho; validação, envio e mensagem de erro ficam
// aqui para não divergirem.
//
// O mesmo formulário corrige o relatório pendente (20/10/2026): quem aprova abre
// a modal já preenchida (`carregarRelatorio`) e "Salvar e aprovar" grava a
// correção e aprova no mesmo passo.
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRegistrarRelatorio } from '../../hooks/useInternacao'
import { useCatalogosProrrogacao, useEditarAprovarRelatorio } from '../../hooks/useKanban'
import { queryKeys } from '../../lib/queryKeys'
import { useAuth } from '../../auth/AuthContext'
import { precisaAprovacao } from '../../auth/permissions'
import { hojeISO, paraISO, somarDias } from '../../lib/datas'
import type { RelatorioRapido } from '../../services/internacao.service'
import type {
  AceiteFolhaRosa, AcomodacaoUtilizada, DetalhesRelatorio, PeriodoProrrogacao, RelatorioItem,
} from '../../types/api'
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
  /** Acomodações utilizadas como o censo as capturou (timeline): vêm antes
   *  das do último relatório. */
  censo?: AcomodacaoUtilizada[]
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

/** As seções da modal, na ordem dela. O "OK" de cada uma confere só a sua. */
export type SecaoRelatorio = 'visita' | 'internacao' | 'quadro' | 'periodo' | 'prorrogacao' | 'negociacao'

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
  const { role } = useAuth()
  const registrar = useRegistrarRelatorio(internacaoId)
  const editarAprovar = useEditarAprovarRelatorio()
  // O relatório pendente em correção (null = registro novo).
  const [editandoId, setEditandoId] = useState<number | null>(null)
  // Relatório do administrativo espera o técnico, e não leva CID (o CID é dele).
  // Quem corrige é quem aprova: o relatório vale ao salvar.
  const vaiParaAprovacao = editandoId == null && precisaAprovacao(role)
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
  // A pausa que o pedido corrigido já trazia (a modal não pausa; ver a ficha).
  const [prrPausada, setPrrPausada] = useState(false)
  // Documento do pedido (20/10/2026: a Porto Seguro pede o formulário dela).
  // `anexoAtual` é o nome do que o relatório em correção já tem.
  const [anexo, setAnexo] = useState<File | null>(null)
  const [anexoAtual, setAnexoAtual] = useState<string | null>(null)
  const [removerAnexo, setRemoverAnexo] = useState(false)
  // Folha rosa (custo evitado negociado com o hospital): fechada até ser marcada.
  const [frAtiva, setFrAtiva] = useState(false)
  const [folha, setFolha] = useState<RascunhoFolhaRosa>(folhaVazia)
  // Relatório completo: o estado existe sempre (regra dos hooks), mas só a
  // modal o usa. Sem a 0054 os blocos não aparecem e nada vai no pedido.
  const det = useDetalhesRelatorio()
  const detalhesNoBanco = Boolean(useCatalogosProrrogacao(Boolean(ctxCompleto)).data?.detalhes)

  const pedeProrrogacao = Boolean(ctxProrrogacao) && prrAtiva
  const aplicaFolha = Boolean(ctxFolhaRosa) && frAtiva
  const comDetalhes = Boolean(ctxCompleto) && detalhesNoBanco

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
    setEditandoId(null)
    setDataVisita(dataInicial())
    setMedico('')
    setObs('')
    setCids([])
    setCidPrincipal(null)
    setErro(null)
    setPrrAtiva(false)
    periodos.carregar([])
    setJustificativa('')
    setComplemento('')
    setPrrPausada(false)
    setAnexo(null)
    setAnexoAtual(null)
    setRemoverAnexo(false)
    setFrAtiva(false)
    setFolha(folhaVazia())
    det.iniciar(ctxCompleto?.ultimo ?? null, ctxCompleto?.dataEntrada, ctxCompleto?.censo)
  }

  /** Correção de quem aprova: o formulário abre com o relatório pendente como
   *  foi gravado, e o envio passa a ser "Salvar e aprovar". */
  function carregarRelatorio(rel: RelatorioItem) {
    setEditandoId(rel.id)
    setDataVisita(paraISO(rel.data_visita) || '')
    setMedico(rel.medico ?? '')
    setObs(rel.descricao ?? '')
    const doRelatorio = (rel.cids ?? []).map((c) => ({ codigo: c.codigo, descricao: c.descricao ?? '' }))
    const principal = doRelatorio.find((c) => c.codigo === rel.detalhes?.cid_principal) ?? null
    setCidPrincipal(principal)
    setCids(doRelatorio.filter((c) => c !== principal))
    setErro(null)
    const prr = rel.prorrogacao
    setPrrAtiva(Boolean(prr))
    periodos.carregar((prr?.periodos ?? []).map((p) => ({
      acomodacao: p.acomodacao, data_inicio: paraISO(p.data_inicio), data_fim: paraISO(p.data_fim),
    })))
    setJustificativa(prr?.justificativa ?? '')
    setComplemento(prr?.complemento ?? '')
    setPrrPausada(Boolean(prr?.pausada))
    setAnexo(null)
    setAnexoAtual(rel.tem_anexo ? (rel.anexo_nome || 'Documento anexado') : null)
    setRemoverAnexo(false)
    const fr = rel.folha_rosa
    setFrAtiva(Boolean(fr))
    setFolha(fr
      ? {
          de: fr.de, para: fr.para, diarias: String(fr.diarias), data_inicio: paraISO(fr.data_inicio),
          data_fim: paraISO(fr.data_fim), aceite: fr.aceite, obs: fr.obs ?? '',
        }
      : folhaVazia())
    det.carregar(rel.detalhes ?? null)
  }

  // As mensagens do DePara (seção 7); o backend confere de novo.
  function erroProrrogacao(): string | null {
    if (!pedeProrrogacao) return null
    if (periodos.pendente) return 'Complete a acomodação e as datas do período de prorrogação, ou limpe a linha.'
    if (!periodos.finais().length) return 'Adicione um período de prorrogação.'
    if (!justificativa) return 'Escolha a justificativa da prorrogação.'
    return null
  }

  // Mesmas mensagens de domain/folha_rosa.py; o backend confere de novo.
  function erroFolhaRosa(): string | null {
    if (!aplicaFolha) return null
    const diarias = Number(folha.diarias)
    if (!folha.de || !folha.para) return 'Escolha as acomodações de e para da folha rosa.'
    if (folha.de === folha.para) return 'Na folha rosa, as acomodações de e para precisam ser diferentes.'
    if (!folha.diarias.trim() || !Number.isInteger(diarias) || diarias < 1 || diarias > 999) {
      return 'Informe as diárias negociadas na folha rosa.'
    }
    if (folha.data_fim && (!folha.data_inicio || folha.data_fim < folha.data_inicio)) {
      return 'Confira o período da folha rosa.'
    }
    return null
  }

  /** A primeira coisa que impede a seção de seguir, ou null. */
  function conferirSecao(s: SecaoRelatorio): string | null {
    switch (s) {
      case 'visita':
        if (!dataVisita) return 'Informe a data da visita'
        // Quem fez a visita (20/10/2026): o médico, o enfermeiro ou os dois,
        // nunca nenhum. Sem a 0054 não há campo de enfermeiro: o médico vale só.
        if (medico.trim() || det.enfermeiro.trim()) return null
        return comDetalhes ? 'Informe o médico auditor ou o enfermeiro auditor.' : 'Informe o médico auditor.'
      // Na modal o texto do relatório é obrigatório (no Márcia é); no drawer, não.
      case 'quadro': return ctxCompleto && !obs.trim() ? 'Escreva o relatório da visita.' : null
      case 'prorrogacao': return erroProrrogacao()
      case 'internacao': return comDetalhes ? det.conferir('internacao') : null
      case 'periodo': return (comDetalhes ? det.conferir('periodo') : null) ?? erroFolhaRosa()
      case 'negociacao': return comDetalhes ? det.conferir('negociacao') : null
    }
  }

  /** O "OK" da seção (20/10/2026): confere só ela. Com erro, a mensagem vai ao
   *  rodapé e a seção fica aberta. */
  function concluirSecao(s: SecaoRelatorio): boolean {
    const e = conferirSecao(s)
    setErro(e)
    return !e
  }

  async function salvar() {
    const erroAntes = conferirSecao('visita') ?? conferirSecao('quadro') ?? erroProrrogacao()
      ?? erroFolhaRosa() ?? (comDetalhes ? det.conferir() : null)
    if (erroAntes) {
      setErro(erroAntes)
      return
    }
    setErro(null)
    // O principal vai primeiro; o relatório do administrativo não leva CID.
    const todosCids = vaiParaAprovacao ? [] : [...(cidPrincipal ? [cidPrincipal] : []), ...cids]
    const pedido: RelatorioRapido = {
      data_visita: dataVisita, medico, descricao: obs,
      cids: todosCids.map((c) => c.codigo),
      ...(pedeProrrogacao
        ? { prorrogacao: {
            periodos: periodos.finais(), justificativa, complemento, ...(prrPausada ? { pausada: true } : {}),
          } }
        : {}),
      ...(aplicaFolha
        ? { folha_rosa: { ...folha, diarias: Number(folha.diarias), obs: folha.obs.trim() } }
        : {}),
      ...(comDetalhes
        ? { detalhes: { ...det.pedido(), cid_principal: vaiParaAprovacao ? '' : (cidPrincipal?.codigo ?? '') } }
        : {}),
    }
    // O documento é do pedido de prorrogação: sem ele marcado, não vai.
    const arquivo = pedeProrrogacao ? anexo : null
    try {
      if (editandoId != null) {
        await editarAprovar.mutateAsync({
          relatorioId: editandoId, internacaoId, arquivo,
          rel: { ...pedido, remover_anexo: removerAnexo && !arquivo },
        })
      } else {
        await registrar.mutateAsync({ ...pedido, arquivo })
      }
      // Um CID novo passou a ser do paciente: o card de CIDs da ficha relê.
      if (todosCids.length) qc.invalidateQueries({ queryKey: queryKeys.internacaoCids(internacaoId) })
      setCids([])
      setCidPrincipal(null)
      setAnexo(null)
      onRegistrado(vaiParaAprovacao)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao registrar')
    }
  }

  return {
    internacaoId, dataVisita, setDataVisita, medico, setMedico, obs, setObs,
    cids, adicionarCid, removerCid, cidPrincipal, definirCidPrincipal, vaiParaAprovacao,
    /** Correção do relatório pendente por quem aprova ("Salvar e aprovar"). */
    editando: editandoId != null,
    carregarRelatorio,
    prorrogacao: ctxProrrogacao ? {
      ativa: prrAtiva, alternar: alternarProrrogacao,
      periodos,
      justificativa, setJustificativa, complemento, setComplemento,
      anexo, setAnexo, anexoAtual, removerAnexo, setRemoverAnexo,
    } : null,
    folhaRosa: ctxFolhaRosa ? {
      ativa: frAtiva, alternar: alternarFolhaRosa, valores: folha, mudar: mudarFolha,
      acomodacaoPaciente: ctxFolhaRosa.acomodacao ?? null,
    } : null,
    // `noBanco` false = sem a 0054: só o texto obrigatório vale.
    completo: ctxCompleto ? { ...det, noBanco: detalhesNoBanco } : null,
    erro, salvando: registrar.isPending || editarAprovar.isPending, salvar, limpar,
    conferirSecao, concluirSecao,
  }
}

export type FormRelatorio = ReturnType<typeof useFormRelatorio>
