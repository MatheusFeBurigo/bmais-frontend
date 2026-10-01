// Seção "Pedir prorrogação" do formulário de relatório, só na ficha "Detalhes".
//
// Desenho do DePara (seção 5.3): fechada até ser marcada; um ou mais períodos
// por acomodação; justificativa escolhida numa lista (os motivos do Márcia) e
// complemento livre. A prorrogação só vale com o relatório aprovado, e não muda
// o prazo do próximo relatório.
//
// Sem "Pausar" aqui (pedido do usuário, 01/10/2026): o pedido já tem data
// final. Pausar e retomar ficam no card da coluna "Em prorrogação" em Tarefas.
//
// Cada período empilha acomodação e, abaixo, De e Até lado a lado: o card de
// Relatórios da ficha é estreito, e os campos numa linha só se sobrepunham.
import { useCatalogosProrrogacao } from '../../hooks/useKanban'
import { dataBR, diasNoPeriodo } from '../../lib/datas'
import type { PedidoProrrogacao } from '../../types/api'
import type { FormRelatorio } from './useFormRelatorio'

export function SecaoProrrogacao({ form }: { form: FormRelatorio }) {
  const prr = form.prorrogacao
  const catalogos = useCatalogosProrrogacao(Boolean(prr))
  // Sem a migration os catálogos vêm vazios: a seção não aparece.
  if (!prr || !catalogos.data?.acomodacoes.length) return null
  const { acomodacoes, justificativas } = catalogos.data

  return (
    <div className="prr-sec">
      <style>{`
        .prr-sec{border:1px solid var(--border);border-radius:10px;padding:10px 12px;background:var(--surface-2)}
        .prr-tg{display:flex;align-items:center;gap:8px;font-weight:600;font-size:var(--t-base);cursor:pointer}
        .prr-tg input{width:15px;height:15px;accent-color:var(--accent);margin:0}
        .prr-corpo{display:grid;gap:10px;margin-top:10px}
        .prr-per{display:grid;gap:8px;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--surface)}
        .prr-per-topo{display:flex;align-items:center;justify-content:space-between;gap:8px}
        .prr-datas{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}
        .prr-datas .bm-input{min-width:0;width:100%}
        .prr-dias{font-size:var(--t-sm);color:var(--muted)}
        .prr-x{border:none;background:transparent;color:var(--muted);cursor:pointer;font-size:var(--t-sm);padding:2px 6px;border-radius:6px}
        .prr-x:hover{background:var(--surface-3);color:var(--danger)}
      `}</style>
      <label className="prr-tg">
        <input type="checkbox" checked={prr.ativa} onChange={(e) => prr.alternar(e.target.checked)} />
        Pedir prorrogação
      </label>
      {prr.ativa && (
        <div className="prr-corpo">
          {prr.periodos.map((p, i) => (
            <div className="prr-per" key={i}>
              <label>
                <span className="prr-per-topo">
                  <span className="form-lbl">Acomodação<span className="req">*</span></span>
                  {prr.periodos.length > 1 && (
                    <button type="button" className="prr-x" onClick={() => prr.removerPeriodo(i)}>Remover</button>
                  )}
                </span>
                <select className="bm-input" value={p.acomodacao}
                        onChange={(e) => prr.mudarPeriodo(i, 'acomodacao', e.target.value)}>
                  <option value="">Escolher</option>
                  {acomodacoes.map((a) => <option key={a.id} value={a.nome}>{a.nome}</option>)}
                </select>
              </label>
              <div className="prr-datas">
                <label>
                  <span className="form-lbl">De<span className="req">*</span></span>
                  <input type="date" className="bm-input" value={p.data_inicio}
                         onChange={(e) => prr.mudarPeriodo(i, 'data_inicio', e.target.value)} />
                </label>
                <label>
                  <span className="form-lbl">Até<span className="req">*</span></span>
                  <input type="date" className="bm-input" value={p.data_fim} min={p.data_inicio || undefined}
                         onChange={(e) => prr.mudarPeriodo(i, 'data_fim', e.target.value)} />
                </label>
              </div>
              {diasNoPeriodo(p.data_inicio, p.data_fim) > 0 && (
                <span className="prr-dias">{diasNoPeriodo(p.data_inicio, p.data_fim)} dias</span>
              )}
            </div>
          ))}
          <div>
            <button type="button" className="btn btn-outline btn-sm" onClick={prr.maisPeriodo}>Mais um período</button>
          </div>
          <label>
            <span className="form-lbl">Justificativa<span className="req">*</span></span>
            <select className="bm-input" value={prr.justificativa}
                    onChange={(e) => prr.setJustificativa(e.target.value)}>
              <option value="">Escolher o motivo clínico</option>
              {justificativas.map((j) => <option key={j.codigo} value={j.codigo}>{j.descricao}</option>)}
            </select>
          </label>
          <label>
            <span className="form-lbl">Complemento</span>
            <input className="bm-input" maxLength={1000} value={prr.complemento}
                   onChange={(e) => prr.setComplemento(e.target.value)} />
          </label>
        </div>
      )}
    </div>
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
