// Seção "Pedir prorrogação" da modal "Registrar relatório" (ficha "Detalhes").
//
// Vem no topo da modal: pedir prorrogação é o motivo de ser da maioria dos
// relatórios (65% no Márcia), e o resto da modal é o que sustenta o pedido.
// Fechada até ser marcada; os períodos seguem o padrão do portal (acomodação,
// data inicial, data final e "Adicionar"), como as outras listas da modal;
// justificativa escolhida numa lista (os motivos do Márcia) e complemento
// livre. A prorrogação só vale com o relatório aprovado, e não muda o prazo do
// próximo relatório.
//
// Pausar e retomar ficam fora daqui (08/10/2026: "o pausar prorrogação só deve
// aparecer quando eu registrar o relatório"): no topo da ficha, depois que a
// prorrogação vale (`AcaoPausarProrrogacao`), e no card da coluna "Em
// prorrogação" de Tarefas. Admin e operacional.
import { useCatalogosProrrogacao } from '../../hooks/useKanban'
import { dataBR, diasNoPeriodo } from '../../lib/datas'
import type { PedidoProrrogacao } from '../../types/api'
import { BlocoOpcional } from './relatorio/BlocoOpcional'
import { SecaoPeriodos } from './relatorio/SecoesListas'
import type { FormRelatorio } from './useFormRelatorio'

export function SecaoProrrogacao({ form }: { form: FormRelatorio }) {
  const prr = form.prorrogacao
  const catalogos = useCatalogosProrrogacao(Boolean(prr))
  // Sem a migration os catálogos vêm vazios: a seção não aparece.
  if (!prr || !catalogos.data?.acomodacoes.length) return null
  const { acomodacoes, justificativas } = catalogos.data
  const total = prr.periodos.finais().reduce((n, p) => n + diasNoPeriodo(p.data_inicio, p.data_fim), 0)

  return (
    <BlocoOpcional titulo="Pedir prorrogação" marcado={prr.ativa} onMarcar={prr.alternar}
                   desabilitado={form.salvando}
                   extra={total > 0 ? `${total} ${total === 1 ? 'dia' : 'dias'}` : ''}>
      <div className="rr-pilha">
        <SecaoPeriodos lista={prr.periodos} acomodacoes={acomodacoes} desabilitado={form.salvando} />
        <label className="rr-campo">
          <span className="form-lbl">Justificativa<span className="req">*</span></span>
          <select className="bm-input bm-select" value={prr.justificativa}
                  onChange={(e) => prr.setJustificativa(e.target.value)}>
            <option value="">Escolher o motivo clínico</option>
            {justificativas.map((j) => <option key={j.codigo} value={j.codigo}>{j.descricao}</option>)}
          </select>
        </label>
        <label className="rr-campo">
          <span className="form-lbl">Complemento</span>
          <input className="bm-input" maxLength={1000} value={prr.complemento}
                 onChange={(e) => prr.setComplemento(e.target.value)} />
        </label>
      </div>
    </BlocoOpcional>
  )
}

/** O pedido de prorrogação gravado num relatório: períodos e justificativa. */
export function ResumoProrrogacao({ p, compacto = false }: { p: PedidoProrrogacao; compacto?: boolean }) {
  const total = p.periodos.reduce((s, x) => s + diasNoPeriodo(x.data_inicio, x.data_fim), 0)
  return (
    <div style={{
      marginTop: 6, padding: '6px 10px', borderRadius: 8, background: 'var(--info-bg)',
      fontSize: 'var(--t-sm)', color: 'var(--ink-2)', display: 'grid', gap: 2,
    }}>
      <b style={{ color: 'var(--info)' }}>
        Prorrogação: {total} {total === 1 ? 'dia' : 'dias'}{p.pausada ? ' (pausada)' : ''}
      </b>
      {p.periodos.map((x, i) => (
        <span key={i}>{x.acomodacao}: {dataBR(x.data_inicio)} a {dataBR(x.data_fim)}</span>
      ))}
      {!compacto && p.justificativa_desc && <span>{p.justificativa_desc}{p.complemento ? `. ${p.complemento}` : ''}</span>}
    </div>
  )
}
