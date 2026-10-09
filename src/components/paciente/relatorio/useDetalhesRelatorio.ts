// Estado do relatório completo (0054) dentro da modal "Registrar relatório":
// classificação da internação, as acomodações utilizadas, os blocos marcados e
// as listas com linha de entrada. Quem envia é `useFormRelatorio`; aqui ficam o
// estado, a conferência e a montagem do pedido.
import { useState } from 'react'
import { hojeISO } from '../../../lib/datas'
import type { PedidoDetalhes } from '../../../services/internacao.service'
import type { AcomodacaoUtilizada, DetalhesRelatorio } from '../../../types/api'
import { useLista } from './useLista'

export interface ItemAcomodacao { acomodacao: string; data_entrada: string; data_saida: string }
/** Troca de acomodação lançada na modal: para onde foi e em que dia. */
export interface Movimentacao { acomodacao: string; data: string }
export interface ItemProcedimento { codigo: string; nome: string; qtde: string; data: string }
export interface ItemAltoCusto { tipo: string; medicacao: string; dose: string; data_inicio: string; data_fim: string }
export interface ItemGlosa { acomodacao: string; diarias: string; data_inicio: string; data_fim: string }
export interface ItemMedicacaoNegada { nome: string; qtde: string; unidade: string; data_inicio: string; data_fim: string }
export interface ItemTrocaProcedimento {
  codigo_de: string; nome_de: string; codigo_para: string; nome_para: string; data: string
}

/** Blocos que abrem quando marcados. Prorrogação e folha rosa têm estado
 *  próprio em `useFormRelatorio`. */
export type Bloco = 'procedimentos' | 'altoCusto' | 'evento' | 'glosas'
  | 'medNegadas' | 'negados' | 'trocas'

const qtdeValida = (q: string) => /^\d{1,3}$/.test(q.trim()) && Number(q) >= 1
const periodoValido = (ini: string, fim: string) => !fim || (Boolean(ini) && fim >= ini)

const acomodacaoVazia = (): ItemAcomodacao => ({ acomodacao: '', data_entrada: '', data_saida: '' })
const movimentacaoVazia = (): Movimentacao => ({ acomodacao: '', data: '' })
const procedimentoVazio = (): ItemProcedimento => ({ codigo: '', nome: '', qtde: '1', data: '' })
const altoCustoVazio = (): ItemAltoCusto => ({ tipo: '', medicacao: '', dose: '', data_inicio: '', data_fim: '' })
const glosaVazia = (): ItemGlosa => ({ acomodacao: '', diarias: '', data_inicio: '', data_fim: '' })
const medNegadaVazia = (): ItemMedicacaoNegada => ({ nome: '', qtde: '', unidade: '', data_inicio: '', data_fim: '' })
const trocaVazia = (): ItemTrocaProcedimento => ({ codigo_de: '', nome_de: '', codigo_para: '', nome_para: '', data: '' })

export type { ListaRelatorio } from './useLista'

/** A troca fecha o local atual no dia dela e abre o novo. */
function mover(itens: ItemAcomodacao[], m: Movimentacao): ItemAcomodacao[] {
  const ultimo = itens[itens.length - 1]
  if (!ultimo) return itens
  return [...itens.slice(0, -1), { ...ultimo, data_saida: ultimo.data_saida || m.data },
          { acomodacao: m.acomodacao, data_entrada: m.data, data_saida: '' }]
}

export function useDetalhesRelatorio() {
  const [carater, setCarater] = useState('')
  const [tipoInternacao, setTipoInternacao] = useState('')
  // A classificação veio do último relatório (a tela avisa).
  const [doUltimo, setDoUltimo] = useState(false)
  const [enfermeiro, setEnfermeiro] = useState('')
  const [analise, setAnalise] = useState('')
  const [marcados, setMarcados] = useState<Set<Bloco>>(new Set())
  const [evento, setEvento] = useState({ data: hojeISO(), descricao: '' })

  const acomodacoes = useLista(acomodacaoVazia,
    (a) => Boolean(a.acomodacao) && Boolean(a.data_entrada) && (!a.data_saida || a.data_saida >= a.data_entrada))
  const procedimentos = useLista(procedimentoVazio, (p) => Boolean(p.codigo) && qtdeValida(p.qtde))
  const negados = useLista(procedimentoVazio, (p) => Boolean(p.codigo) && qtdeValida(p.qtde))
  const altoCusto = useLista(altoCustoVazio, (a) => Boolean(a.tipo))
  const glosas = useLista(glosaVazia, (g) => Boolean(g.acomodacao) && qtdeValida(g.diarias))
  const medNegadas = useLista(medNegadaVazia,
    (m) => Boolean(m.nome.trim()) && (!m.qtde || qtdeValida(m.qtde)))
  const trocas = useLista(trocaVazia,
    (t) => Boolean(t.codigo_de) && Boolean(t.codigo_para) && t.codigo_de !== t.codigo_para)

  // Com o local do paciente conhecido (censo, último relatório ou ficha), a
  // tela mostra onde ele está e as trocas entram uma a uma por "Adicionar
  // movimentação" (pedido de 08/10/2026). Sem local conhecido, fica a lista com
  // linha de entrada. As acomodações de antes ficam em `acomodacoes.itens`, sem
  // mexer; as trocas desta visita, em `movimentos`.
  const [comLocal, setComLocal] = useState(false)
  const [movimentos, setMovimentos] = useState<Movimentacao[]>([])
  const [movendo, setMovendo] = useState(false)
  const [movimento, setMovimento] = useState(movimentacaoVazia)
  // A troca já sugerida pela ficha: intocada, não conta como pela metade.
  const [movimentoBase, setMovimentoBase] = useState(movimentacaoVazia)

  const comMovimentos = movimentos.reduce(mover, acomodacoes.itens)
  const localAtual = comMovimentos[comMovimentos.length - 1]
  const movimentoValido = (m: Movimentacao) => Boolean(localAtual) && Boolean(m.acomodacao)
    && m.acomodacao !== localAtual.acomodacao && Boolean(m.data)
    && m.data >= localAtual.data_entrada && m.data <= hojeISO()
  const movimentoPendente = movendo && Boolean(movimento.acomodacao || movimento.data)
    && JSON.stringify(movimento) !== JSON.stringify(movimentoBase) && !movimentoValido(movimento)

  const movimentacao = {
    /** Há local conhecido: a tela de movimentação no lugar da lista. */
    ativa: comLocal,
    atual: localAtual,
    /** Do local em que o paciente estava ao abrir a modal em diante. */
    linhas: comMovimentos.slice(Math.max(acomodacoes.itens.length - 1, 0)),
    podeDesfazer: movimentos.length > 0,
    /** Tira a última troca lançada; o local anterior volta a ser o atual. */
    desfazer() { setMovimentos((ms) => ms.slice(0, -1)) },
    aberta: movendo,
    abrir() { setMovendo(true) },
    cancelar() {
      setMovendo(false)
      setMovimento(movimentoBase)
    },
    rascunho: movimento,
    mudar<K extends keyof Movimentacao>(campo: K, valor: Movimentacao[K]) {
      setMovimento((m) => ({ ...m, [campo]: valor }))
    },
    podeAdicionar: movimentoValido(movimento),
    adicionar() {
      if (!movimentoValido(movimento)) return
      setMovimentos((ms) => [...ms, movimento])
      setMovendo(false)
      setMovimento(movimentacaoVazia())
      setMovimentoBase(movimentacaoVazia())
    },
  }

  /** As acomodações utilizadas que vão no registro. A troca completa que
   *  ficou sem "Adicionar" também vai, como nas listas. */
  function acomodacoesFinais(): ItemAcomodacao[] {
    if (!comLocal) return acomodacoes.finais()
    return movendo && movimentoValido(movimento) ? mover(comMovimentos, movimento) : comMovimentos
  }

  function marcar(bloco: Bloco, ligar: boolean) {
    setMarcados((atual) => {
      const novo = new Set(atual)
      if (ligar) novo.add(bloco)
      else novo.delete(bloco)
      return novo
    })
  }

  /** Abre a modal limpa, com a classificação do último relatório. As
   *  acomodações utilizadas vêm do censo (`censo`, montadas da timeline:
   *  "já deve vir nativamente quando capturado pelo censo"); sem censo, as do
   *  último relatório; sem nenhuma, a linha de entrada já vem com a data da
   *  internação (a acomodação a seção sugere pela ficha). */
  function iniciar(ultimo: DetalhesRelatorio | null, dataEntrada?: string,
                   censo?: AcomodacaoUtilizada[]) {
    setCarater(ultimo?.carater ?? '')
    setTipoInternacao(ultimo?.tipo_internacao ?? '')
    setDoUltimo(Boolean(ultimo))
    const base = censo?.length ? censo : (ultimo?.acomodacoes ?? [])
    const anteriores = base.map((a) => ({
      acomodacao: a.acomodacao, data_entrada: a.data_entrada, data_saida: a.data_saida ?? '',
    }))
    acomodacoes.carregar(anteriores,
      anteriores.length ? undefined : { ...acomodacaoVazia(), data_entrada: dataEntrada ?? '' })
    setComLocal(anteriores.length > 0)
    setMovimentos([])
    setMovendo(false)
    setMovimento(movimentacaoVazia())
    setMovimentoBase(movimentacaoVazia())
    setEnfermeiro('')
    setAnalise('')
    setMarcados(new Set())
    setEvento({ data: hojeISO(), descricao: '' })
    for (const l of [procedimentos, negados, altoCusto, glosas, medNegadas, trocas]) l.carregar([])
  }

  /** A acomodação em que a ficha diz que o paciente está (prorrogação vigente
   *  ou leito) entra nas acomodações utilizadas (pedido de 08/10/2026: "deve
   *  puxar a que o paciente está atualmente"):
   *  - sem acomodação anterior, vira o local atual, desde a internação (sem a
   *    data da internação, só a linha de entrada já vem com ela);
   *  - se o local atual é outro, a troca já vem com a da ficha (a data quem
   *    sabe é o usuário). */
  function sugerirAcomodacao(nome: string) {
    if (!comLocal) {
      if (acomodacoes.itens.length || acomodacoes.rascunho.acomodacao) return
      const entrada = acomodacoes.rascunho.data_entrada
      if (entrada) {
        acomodacoes.carregar([{ acomodacao: nome, data_entrada: entrada, data_saida: '' }])
        setComLocal(true)
      } else acomodacoes.sugerir({ acomodacao: nome, data_entrada: '', data_saida: '' })
      return
    }
    if (localAtual?.acomodacao === nome) return
    setMovimento({ acomodacao: nome, data: '' })
    setMovimentoBase({ acomodacao: nome, data: '' })
  }

  const ligado = (b: Bloco) => marcados.has(b)

  /** A primeira coisa que impede o registro, ou null. Mesmas regras de
   *  domain/relatorio_detalhes.py, que confere de novo. */
  function conferir(): string | null {
    if (comLocal && movimentoPendente) return 'Termine a movimentação ou cancele.'
    if (!comLocal && acomodacoes.pendente) return 'Termine a linha das acomodações utilizadas ou limpe os campos.'
    if (ligado('procedimentos')) {
      if (procedimentos.pendente) return 'Termine a linha do procedimento realizado ou limpe os campos.'
      if (!procedimentos.finais().length) return 'Adicione um procedimento realizado ou desmarque o bloco.'
    }
    if (ligado('altoCusto')) {
      if (altoCusto.pendente) return 'Escolha o tipo da medicação de alto custo.'
      if (!altoCusto.finais().length) return 'Adicione uma medicação de alto custo ou desmarque o bloco.'
      if (altoCusto.finais().some((a) => !periodoValido(a.data_inicio, a.data_fim))) {
        return 'Confira o período de cada medicação de alto custo.'
      }
    }
    if (ligado('evento') && (!evento.data || !evento.descricao.trim())) {
      return 'Informe a data e o que aconteceu no evento adverso.'
    }
    if (ligado('glosas')) {
      if (glosas.pendente) return 'Termine a linha da glosa ou limpe os campos.'
      if (!glosas.finais().length) return 'Adicione uma glosa ou desmarque o bloco.'
      if (glosas.finais().some((g) => !periodoValido(g.data_inicio, g.data_fim))) {
        return 'Confira o período de cada glosa.'
      }
    }
    if (ligado('medNegadas')) {
      if (medNegadas.pendente) return 'Termine a linha da medicação negada ou limpe os campos.'
      if (!medNegadas.finais().length) return 'Adicione uma medicação negada ou desmarque o bloco.'
      if (medNegadas.finais().some((m) => !periodoValido(m.data_inicio, m.data_fim))) {
        return 'Confira o período de cada medicação negada.'
      }
    }
    if (ligado('negados')) {
      if (negados.pendente) return 'Termine a linha do procedimento negado ou limpe os campos.'
      if (!negados.finais().length) return 'Adicione um procedimento negado ou desmarque o bloco.'
    }
    if (ligado('trocas')) {
      if (trocas.pendente) return 'Escolha procedimentos de e para diferentes na troca de procedimento.'
      if (!trocas.finais().length) return 'Adicione uma troca de procedimento ou desmarque o bloco.'
    }
    return null
  }

  const proc = (p: ItemProcedimento) => ({ codigo: p.codigo, qtde: p.qtde.trim(), data: p.data })

  /** O pedido do relatório completo (só os blocos marcados). O diagnóstico
   *  principal quem põe é `useFormRelatorio`, que guarda os CIDs. */
  function pedido(): PedidoDetalhes {
    return {
      carater,
      tipo_internacao: tipoInternacao,
      acomodacoes: acomodacoesFinais(),
      enfermeiro: enfermeiro.trim(),
      analise: analise.trim(),
      cid_principal: '',
      procedimentos: ligado('procedimentos') ? procedimentos.finais().map(proc) : [],
      alto_custo: ligado('altoCusto')
        ? altoCusto.finais().map((a) => ({ ...a, medicacao: a.medicacao.trim(), dose: a.dose.trim() }))
        : [],
      evento_adverso: ligado('evento') ? { data: evento.data, descricao: evento.descricao.trim() } : null,
      glosas: ligado('glosas') ? glosas.finais().map((g) => ({ ...g, diarias: g.diarias.trim() })) : [],
      medicacoes_negadas: ligado('medNegadas')
        ? medNegadas.finais().map((m) => ({ ...m, nome: m.nome.trim(), qtde: m.qtde.trim(), unidade: m.unidade.trim() }))
        : [],
      procedimentos_negados: ligado('negados') ? negados.finais().map(proc) : [],
      trocas_procedimento: ligado('trocas')
        ? trocas.finais().map((t) => ({ codigo_de: t.codigo_de, codigo_para: t.codigo_para, data: t.data }))
        : [],
    }
  }

  return {
    carater, setCarater, tipoInternacao, setTipoInternacao, doUltimo,
    acomodacoes, sugerirAcomodacao, movimentacao, acomodacoesFinais,
    enfermeiro, setEnfermeiro, analise, setAnalise,
    ligado, marcar,
    procedimentos, negados, altoCusto, glosas, medNegadas, trocas,
    evento, setEvento,
    iniciar, conferir, pedido,
  }
}

export type DetalhesForm = ReturnType<typeof useDetalhesRelatorio>
