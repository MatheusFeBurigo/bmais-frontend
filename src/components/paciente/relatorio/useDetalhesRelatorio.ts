// Estado do relatório completo (0054) dentro da modal "Registrar relatório":
// classificação da internação, as acomodações utilizadas, os blocos marcados e
// as listas com linha de entrada. Quem envia é `useFormRelatorio`; aqui ficam o
// estado, a conferência e a montagem do pedido.
import { useState } from 'react'
import { hojeISO } from '../../../lib/datas'
import type { PedidoDetalhes } from '../../../services/internacao.service'
import type { DetalhesRelatorio } from '../../../types/api'
import { useLista } from './useLista'

export interface ItemAcomodacao { acomodacao: string; data_entrada: string; data_saida: string }
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
const procedimentoVazio = (): ItemProcedimento => ({ codigo: '', nome: '', qtde: '1', data: '' })
const altoCustoVazio = (): ItemAltoCusto => ({ tipo: '', medicacao: '', dose: '', data_inicio: '', data_fim: '' })
const glosaVazia = (): ItemGlosa => ({ acomodacao: '', diarias: '', data_inicio: '', data_fim: '' })
const medNegadaVazia = (): ItemMedicacaoNegada => ({ nome: '', qtde: '', unidade: '', data_inicio: '', data_fim: '' })
const trocaVazia = (): ItemTrocaProcedimento => ({ codigo_de: '', nome_de: '', codigo_para: '', nome_para: '', data: '' })

export type { ListaRelatorio } from './useLista'

export function useDetalhesRelatorio() {
  const [carater, setCarater] = useState('')
  const [tipoInternacao, setTipoInternacao] = useState('')
  // A classificação veio do último relatório (a tela avisa).
  const [doUltimo, setDoUltimo] = useState(false)
  const [enfermeiro, setEnfermeiro] = useState('')
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

  function marcar(bloco: Bloco, ligar: boolean) {
    setMarcados((atual) => {
      const novo = new Set(atual)
      if (ligar) novo.add(bloco)
      else novo.delete(bloco)
      return novo
    })
  }

  /** Abre a modal limpa, com a classificação e as acomodações do último
   *  relatório. Sem acomodações anteriores, a linha de entrada já vem com a
   *  data da internação (a acomodação a seção sugere quando tem o catálogo). */
  function iniciar(ultimo: DetalhesRelatorio | null, dataEntrada?: string) {
    setCarater(ultimo?.carater ?? '')
    setTipoInternacao(ultimo?.tipo_internacao ?? '')
    setDoUltimo(Boolean(ultimo))
    const anteriores = (ultimo?.acomodacoes ?? []).map((a) => ({
      acomodacao: a.acomodacao, data_entrada: a.data_entrada, data_saida: a.data_saida ?? '',
    }))
    acomodacoes.carregar(anteriores,
      anteriores.length ? undefined : { ...acomodacaoVazia(), data_entrada: dataEntrada ?? '' })
    setEnfermeiro('')
    setMarcados(new Set())
    setEvento({ data: hojeISO(), descricao: '' })
    for (const l of [procedimentos, negados, altoCusto, glosas, medNegadas, trocas]) l.carregar([])
  }

  /** A acomodação em que a ficha diz que o paciente está (prorrogação vigente
   *  ou leito) entra nas acomodações utilizadas (pedido de 08/10/2026: "deve
   *  puxar a que o paciente está atualmente"):
   *  - sem acomodação anterior, vira a linha "Atual", desde a internação;
   *  - se a atual do último relatório é outra, a linha de entrada já vem com a
   *    da ficha (a data de entrada quem sabe é o usuário). */
  function sugerirAcomodacao(nome: string) {
    const itens = acomodacoes.itens
    if (!itens.length) {
      const entrada = acomodacoes.rascunho.data_entrada
      if (acomodacoes.rascunho.acomodacao) return
      if (entrada) acomodacoes.carregar([{ acomodacao: nome, data_entrada: entrada, data_saida: '' }])
      else acomodacoes.sugerir({ acomodacao: nome, data_entrada: '', data_saida: '' })
      return
    }
    const atual = [...itens].reverse().find((a) => !a.data_saida)
    if (atual?.acomodacao === nome) return
    acomodacoes.sugerir({ acomodacao: nome, data_entrada: '', data_saida: '' })
  }

  const ligado = (b: Bloco) => marcados.has(b)

  /** A primeira coisa que impede o registro, ou null. Mesmas regras de
   *  domain/relatorio_detalhes.py, que confere de novo. */
  function conferir(): string | null {
    if (acomodacoes.pendente) return 'Termine a linha das acomodações utilizadas ou limpe os campos.'
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
      acomodacoes: acomodacoes.finais(),
      enfermeiro: enfermeiro.trim(),
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
    acomodacoes, sugerirAcomodacao,
    enfermeiro, setEnfermeiro,
    ligado, marcar,
    procedimentos, negados, altoCusto, glosas, medNegadas, trocas,
    evento, setEvento,
    iniciar, conferir, pedido,
  }
}

export type DetalhesForm = ReturnType<typeof useDetalhesRelatorio>
