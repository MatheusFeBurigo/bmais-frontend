// Miolo das listas da modal: períodos da prorrogação, acomodações utilizadas,
// procedimentos (realizados
// e negados), medicação de alto custo, glosa de diárias, medicação negada e
// troca de procedimento. Cada uma é uma linha de entrada + a lista do que já
// foi adicionado, nas mesmas colunas; a linha completa que ficou sem
// "Adicionar" também vai no registro (`useDetalhesRelatorio`).
//
// Larguras comuns a todas: data 150px, quantidade 110px, botão 96px, e as
// datas de início e fim sempre nas duas colunas antes do botão. Assim os campos
// do mesmo tipo caem na mesma vertical de um bloco para o outro.
import type { CSSProperties } from 'react'
import { dataBR, diasNoPeriodo, hojeISO } from '../../../lib/datas'
import { TIPOS_ALTO_CUSTO, rotulo } from '../../../lib/relatorioDetalhes'
import { CampoTuss } from './CampoTuss'
import { ListaItens } from './ListaItens'
import type { PeriodoProrrogacao } from '../../../types/api'
import type {
  DetalhesForm, ItemAcomodacao, ItemAltoCusto, ItemGlosa, ItemMedicacaoNegada, ItemProcedimento,
  ItemTrocaProcedimento, ListaRelatorio,
} from './useDetalhesRelatorio'

const COL_ACOMODACAO = 'minmax(0,1fr) 150px 150px 96px'
const COL_PROCEDIMENTO = 'minmax(0,1fr) 110px 150px 96px'
// Duas linhas: tipo + medicação; dose (nas duas primeiras colunas), início,
// fim e o botão, com as datas na mesma vertical das outras listas.
const COL_ALTO_CUSTO = '160px minmax(0,1fr) 150px 150px 96px'
const COL_GLOSA = 'minmax(0,1fr) 110px 150px 150px 96px'
const COL_MED_NEGADA = 'minmax(0,1fr) 110px 120px 150px 150px 96px'
const COL_TROCA = 'minmax(0,1fr) minmax(0,1fr) 150px 96px'

const soDigitos = (v: string) => v.replace(/\D/g, '').slice(0, 3)
// Célula de data na lista: vazia vira traço, como os outros campos vazios.
const data = (iso: string) => dataBR(iso) || '—'

type Acomodacoes = { id: number; nome: string }[]

function Rotulo({ texto, obrigatorio }: { texto: string; obrigatorio?: boolean }) {
  return <span className="form-lbl">{texto}{obrigatorio && <span className="req">*</span>}</span>
}

function CampoData<T extends object>({ lista, campo, texto, min, max, obrigatorio }: {
  lista: ListaRelatorio<T>
  campo: keyof T
  texto: string
  min?: string
  max?: string
  obrigatorio?: boolean
}) {
  return (
    <label className="rr-campo">
      <Rotulo texto={texto} obrigatorio={obrigatorio} />
      <input type="date" className="bm-input" value={String(lista.rascunho[campo] ?? '')}
             min={min || undefined} max={max || undefined}
             onChange={(e) => lista.mudar(campo, e.target.value as T[keyof T])} />
    </label>
  )
}

function CampoQtde<T extends object>({ lista, campo, texto, obrigatorio }: {
  lista: ListaRelatorio<T>
  campo: keyof T
  texto: string
  obrigatorio?: boolean
}) {
  return (
    <label className="rr-campo">
      <Rotulo texto={texto} obrigatorio={obrigatorio} />
      <input className="bm-input" inputMode="numeric" value={String(lista.rascunho[campo] ?? '')}
             onChange={(e) => lista.mudar(campo, soDigitos(e.target.value) as T[keyof T])} />
    </label>
  )
}

function SelectAcomodacao<T extends object>({ lista, campo, acomodacoes }: {
  lista: ListaRelatorio<T>
  campo: keyof T
  acomodacoes: Acomodacoes
}) {
  return (
    <label className="rr-campo">
      <Rotulo texto="Acomodação" obrigatorio />
      <select className="bm-input bm-select" value={String(lista.rascunho[campo] ?? '')}
              onChange={(e) => lista.mudar(campo, e.target.value as T[keyof T])}>
        <option value="">Escolher</option>
        {acomodacoes.map((a) => <option key={a.id} value={a.nome}>{a.nome}</option>)}
      </select>
    </label>
  )
}

const procedimento = (codigo: string, nome: string) => (
  <><b className="mono">{codigo}</b> {nome}</>
)

/** Períodos da prorrogação: as mesmas colunas das acomodações utilizadas. O
 *  período seguinte já vem na linha de entrada (`useFormRelatorio`). */
export function SecaoPeriodos({ lista, acomodacoes, desabilitado }: {
  lista: ListaRelatorio<PeriodoProrrogacao>
  acomodacoes: Acomodacoes
  desabilitado?: boolean
}) {
  const r = lista.rascunho
  return (
    <ListaItens
      colunas={COL_ACOMODACAO}
      campos={(
        <>
          <SelectAcomodacao lista={lista} campo="acomodacao" acomodacoes={acomodacoes} />
          <CampoData lista={lista} campo="data_inicio" texto="Início" obrigatorio />
          <CampoData lista={lista} campo="data_fim" texto="Fim" min={r.data_inicio} obrigatorio />
        </>
      )}
      onAdicionar={lista.adicionar}
      podeAdicionar={lista.podeAdicionar}
      linhas={lista.itens.map((p) => {
        const dias = diasNoPeriodo(p.data_inicio, p.data_fim)
        return [
          <>{p.acomodacao} <span className="rr-cel-nota">{dias} {dias === 1 ? 'dia' : 'dias'}</span></>,
          data(p.data_inicio), data(p.data_fim),
        ]
      })}
      onRemover={lista.remover}
      onEditar={lista.editar}
      desabilitado={desabilitado}
    />
  )
}

export function SecaoAcomodacoes({ lista, acomodacoes, desabilitado }: {
  lista: ListaRelatorio<ItemAcomodacao>
  acomodacoes: Acomodacoes
  desabilitado?: boolean
}) {
  const r = lista.rascunho
  return (
    <ListaItens
      colunas={COL_ACOMODACAO}
      campos={(
        <>
          <SelectAcomodacao lista={lista} campo="acomodacao" acomodacoes={acomodacoes} />
          <CampoData lista={lista} campo="data_entrada" texto="Entrada" max={hojeISO()} obrigatorio />
          <CampoData lista={lista} campo="data_saida" texto="Saída" min={r.data_entrada} max={hojeISO()} />
        </>
      )}
      onAdicionar={lista.adicionar}
      podeAdicionar={lista.podeAdicionar}
      linhas={lista.itens.map((a) => [
        a.acomodacao, data(a.data_entrada),
        a.data_saida ? data(a.data_saida) : <span className="badge info" key="a">Atual</span>,
      ])}
      onRemover={lista.remover}
      onEditar={lista.editar}
      desabilitado={desabilitado}
    />
  )
}

/** Com o local do paciente conhecido: onde ele está e as trocas desta visita,
 *  uma a uma (pedido de 08/10/2026: "exibir o último local onde ele está
 *  internado" e um botão "Adicionar movimentação"). Mesmas colunas das
 *  acomodações utilizadas, com a data da troca sob a entrada. */
export function SecaoMovimentacao({ mov, acomodacoes, desabilitado }: {
  mov: DetalhesForm['movimentacao']
  acomodacoes: Acomodacoes
  desabilitado?: boolean
}) {
  const grade = { gridTemplateColumns: COL_ACOMODACAO } as CSSProperties
  const r = mov.rascunho
  const atual = mov.atual
  return (
    <div className="rr-lista-wrap">
      <div className="rr-lista">
        <div className="rr-lista-linha rr-lista-cab" style={grade}>
          <span className="rr-cel">Acomodação</span>
          <span className="rr-cel">Entrada</span>
          <span className="rr-cel">Saída</span>
        </div>
        {mov.linhas.map((a, i) => (
          <div className="rr-lista-linha" style={grade} key={i}>
            <span className="rr-cel">{a.acomodacao}</span>
            <span className="rr-cel">{data(a.data_entrada)}</span>
            <span className="rr-cel">
              {a.data_saida ? data(a.data_saida) : <span className="badge info">Atual</span>}
            </span>
            {i === mov.linhas.length - 1 && mov.podeDesfazer && (
              <span className="rr-acoes">
                <button type="button" className="rr-x" aria-label="Remover" title="Remover"
                        disabled={desabilitado} onClick={mov.desfazer}>✕</button>
              </span>
            )}
          </div>
        ))}
      </div>
      {mov.aberta ? (
        <div className="rr-lista-entrada" style={grade}>
          <label className="rr-campo">
            <Rotulo texto="Nova acomodação" obrigatorio />
            <select className="bm-input bm-select" value={r.acomodacao}
                    onChange={(e) => mov.mudar('acomodacao', e.target.value)}>
              <option value="">Escolher</option>
              {acomodacoes.filter((a) => a.nome !== atual?.acomodacao)
                .map((a) => <option key={a.id} value={a.nome}>{a.nome}</option>)}
            </select>
          </label>
          <label className="rr-campo">
            <Rotulo texto="Data" obrigatorio />
            <input type="date" className="bm-input" value={r.data}
                   min={atual?.data_entrada || undefined} max={hojeISO()}
                   onChange={(e) => mov.mudar('data', e.target.value)} />
          </label>
          <button type="button" className="btn btn-ghost btn-sm rr-mov-cancelar"
                  disabled={desabilitado} onClick={mov.cancelar}>
            Cancelar
          </button>
          <button type="button" className="btn btn-outline btn-sm rr-lista-add"
                  disabled={!mov.podeAdicionar || desabilitado} onClick={mov.adicionar}>
            Adicionar
          </button>
        </div>
      ) : (
        <div>
          <button type="button" className="btn btn-outline btn-sm rr-mov-abrir"
                  disabled={desabilitado} onClick={mov.abrir}>
            Adicionar movimentação
          </button>
        </div>
      )}
    </div>
  )
}

export function SecaoProcedimentos({ lista, desabilitado }: {
  lista: ListaRelatorio<ItemProcedimento>
  desabilitado?: boolean
}) {
  const r = lista.rascunho
  return (
    <ListaItens
      colunas={COL_PROCEDIMENTO}
      campos={(
        <>
          <label className="rr-campo">
            <Rotulo texto="Procedimento (TUSS)" obrigatorio />
            <CampoTuss
              valor={{ codigo: r.codigo, nome: r.nome }}
              desabilitado={desabilitado}
              onEscolher={(p) => { lista.mudar('codigo', p?.codigo ?? ''); lista.mudar('nome', p?.nome ?? '') }}
            />
          </label>
          <CampoQtde lista={lista} campo="qtde" texto="Quantidade" obrigatorio />
          <CampoData lista={lista} campo="data" texto="Data" max={hojeISO()} />
        </>
      )}
      onAdicionar={lista.adicionar}
      podeAdicionar={lista.podeAdicionar}
      linhas={lista.itens.map((p) => [procedimento(p.codigo, p.nome), p.qtde, data(p.data)])}
      onRemover={lista.remover}
      onEditar={lista.editar}
      desabilitado={desabilitado}
    />
  )
}

export function SecaoAltoCusto({ lista, desabilitado }: {
  lista: ListaRelatorio<ItemAltoCusto>
  desabilitado?: boolean
}) {
  const r = lista.rascunho
  return (
    <ListaItens
      colunas={COL_ALTO_CUSTO}
      campos={(
        <>
          <label className="rr-campo">
            <Rotulo texto="Tipo" obrigatorio />
            <select className="bm-input bm-select" value={r.tipo} onChange={(e) => lista.mudar('tipo', e.target.value)}>
              <option value="">Escolher</option>
              {TIPOS_ALTO_CUSTO.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </label>
          <label className="rr-campo rr-resto">
            <Rotulo texto="Medicação" />
            <input className="bm-input" maxLength={200} value={r.medicacao}
                   onChange={(e) => lista.mudar('medicacao', e.target.value)} />
          </label>
          <label className="rr-campo rr-dupla">
            <Rotulo texto="Dose por dia" />
            <input className="bm-input" maxLength={200} value={r.dose}
                   onChange={(e) => lista.mudar('dose', e.target.value)} />
          </label>
          <CampoData lista={lista} campo="data_inicio" texto="Início" />
          <CampoData lista={lista} campo="data_fim" texto="Fim" min={r.data_inicio} />
        </>
      )}
      onAdicionar={lista.adicionar}
      podeAdicionar={lista.podeAdicionar}
      linhas={lista.itens.map((a) => [
        <b key="t">{rotulo(TIPOS_ALTO_CUSTO, a.tipo)}</b>,
        { conteudo: a.medicacao || '—', largura: 'resto' as const },
        { conteudo: a.dose || '—', largura: 'dupla' as const }, data(a.data_inicio), data(a.data_fim),
      ])}
      onRemover={lista.remover}
      onEditar={lista.editar}
      desabilitado={desabilitado}
    />
  )
}

export function SecaoGlosa({ lista, acomodacoes, desabilitado }: {
  lista: ListaRelatorio<ItemGlosa>
  acomodacoes: Acomodacoes
  desabilitado?: boolean
}) {
  const r = lista.rascunho
  return (
    <ListaItens
      colunas={COL_GLOSA}
      campos={(
        <>
          <SelectAcomodacao lista={lista} campo="acomodacao" acomodacoes={acomodacoes} />
          <CampoQtde lista={lista} campo="diarias" texto="Diárias" obrigatorio />
          <CampoData lista={lista} campo="data_inicio" texto="Início" />
          <CampoData lista={lista} campo="data_fim" texto="Fim" min={r.data_inicio} />
        </>
      )}
      onAdicionar={lista.adicionar}
      podeAdicionar={lista.podeAdicionar}
      linhas={lista.itens.map((g) => [g.acomodacao, g.diarias, data(g.data_inicio), data(g.data_fim)])}
      onRemover={lista.remover}
      onEditar={lista.editar}
      desabilitado={desabilitado}
    />
  )
}

export function SecaoMedicacaoNegada({ lista, desabilitado }: {
  lista: ListaRelatorio<ItemMedicacaoNegada>
  desabilitado?: boolean
}) {
  const r = lista.rascunho
  return (
    <ListaItens
      colunas={COL_MED_NEGADA}
      campos={(
        <>
          <label className="rr-campo">
            <Rotulo texto="Medicação" obrigatorio />
            <input className="bm-input" maxLength={200} value={r.nome}
                   onChange={(e) => lista.mudar('nome', e.target.value)} />
          </label>
          <CampoQtde lista={lista} campo="qtde" texto="Quantidade" />
          <label className="rr-campo">
            <Rotulo texto="Unidade" />
            <input className="bm-input" maxLength={50} value={r.unidade}
                   onChange={(e) => lista.mudar('unidade', e.target.value)} />
          </label>
          <CampoData lista={lista} campo="data_inicio" texto="Início" />
          <CampoData lista={lista} campo="data_fim" texto="Fim" min={r.data_inicio} />
        </>
      )}
      onAdicionar={lista.adicionar}
      podeAdicionar={lista.podeAdicionar}
      linhas={lista.itens.map((m) => [
        <b key="n">{m.nome}</b>,
        m.qtde || '—', m.unidade || '—', data(m.data_inicio), data(m.data_fim),
      ])}
      onRemover={lista.remover}
      onEditar={lista.editar}
      desabilitado={desabilitado}
    />
  )
}

export function SecaoTrocaProcedimento({ lista, desabilitado }: {
  lista: ListaRelatorio<ItemTrocaProcedimento>
  desabilitado?: boolean
}) {
  const r = lista.rascunho
  return (
    <ListaItens
      colunas={COL_TROCA}
      campos={(
        <>
          <label className="rr-campo">
            <Rotulo texto="Procedimento de" obrigatorio />
            <CampoTuss
              valor={{ codigo: r.codigo_de, nome: r.nome_de }}
              desabilitado={desabilitado}
              onEscolher={(p) => { lista.mudar('codigo_de', p?.codigo ?? ''); lista.mudar('nome_de', p?.nome ?? '') }}
            />
          </label>
          <label className="rr-campo">
            <Rotulo texto="Procedimento para" obrigatorio />
            <CampoTuss
              valor={{ codigo: r.codigo_para, nome: r.nome_para }}
              desabilitado={desabilitado}
              onEscolher={(p) => { lista.mudar('codigo_para', p?.codigo ?? ''); lista.mudar('nome_para', p?.nome ?? '') }}
            />
          </label>
          <CampoData lista={lista} campo="data" texto="Data" max={hojeISO()} />
        </>
      )}
      onAdicionar={lista.adicionar}
      podeAdicionar={lista.podeAdicionar}
      linhas={lista.itens.map((t) => [
        procedimento(t.codigo_de, t.nome_de), procedimento(t.codigo_para, t.nome_para), data(t.data),
      ])}
      onRemover={lista.remover}
      onEditar={lista.editar}
      desabilitado={desabilitado}
    />
  )
}
