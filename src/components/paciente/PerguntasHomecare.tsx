// As perguntas de home care (as do portal antigo). Desde 13/11/2026 ficam na
// seção "Home care" da modal "Registrar relatório", como a prorrogação; de 08/10
// a 13/11 ficavam na alta com o motivo Homecare (pedido do usuário: "homecare
// não deve virar alta").
//
// Nenhuma é obrigatória (13/11/2026: "os campos do homecare não são todos
// obrigatórios"). Abrem vazias: em branco é "não respondida", e "não" é uma
// escolha, não um padrão esquecido.
import {
  ALIMENTACAO, CONSCIENCIA, MOBILIZACAO, OXIGENIOTERAPIA, SIM_NAO, type RascunhoHomecare,
} from '../../lib/altaHomecare'

const estilos = `
.hc-perg{display:grid;gap:12px}
.hc-grade{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 12px;align-items:end}
.hc-grade .bm-input{width:100%;min-width:0;height:36px;padding-top:0;padding-bottom:0}
.hc-chips{display:flex;flex-wrap:wrap;gap:6px}
.hc-chip{position:relative;display:inline-flex;align-items:center;height:32px;padding:0 12px;border:1px solid var(--border-strong);border-radius:999px;font-size:var(--t-sm);color:var(--ink-2);cursor:pointer;background:var(--surface)}
.hc-chip input{position:absolute;opacity:0;pointer-events:none}
.hc-chip.on{background:var(--primary-soft);color:var(--primary);border-color:var(--primary-3);font-weight:600}
.hc-chip:focus-within{outline:2px solid var(--accent);outline-offset:1px}
@media (max-width:560px){.hc-grade{grid-template-columns:minmax(0,1fr)}}
`

const SIM_NAO_OPCOES = [{ key: 'sim', label: 'Sim' }, { key: 'nao', label: 'Não' }]

export function PerguntasHomecare({ valor, onMudar, desabilitado }: {
  valor: RascunhoHomecare
  onMudar: (v: RascunhoHomecare) => void
  desabilitado?: boolean
}) {
  const mudar = (campo: keyof RascunhoHomecare, v: string) => onMudar({ ...valor, [campo]: v })
  const alimentacao = valor.alimentacao
  const select = (campo: keyof RascunhoHomecare, rotulo: string,
                  opcoes: readonly { key: string; label: string }[]) => (
    <div className="nh-campo" key={campo}>
      <label htmlFor={`hc-${campo}`} className="form-lbl">{rotulo}</label>
      <select id={`hc-${campo}`} className="bm-input bm-select" value={String(valor[campo])}
              disabled={desabilitado} onChange={(e) => mudar(campo, e.target.value)}>
        <option value="">Não informado</option>
        {opcoes.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
    </div>
  )
  return (
    <div className="hc-perg">
      <style>{estilos}</style>
      <div className="hc-grade">
        {select('solicitado', 'Home care solicitado', SIM_NAO_OPCOES)}
        {select('oxigenioterapia', 'Oxigenioterapia', OXIGENIOTERAPIA)}
        {select('mobilizacao', 'Mobilização', MOBILIZACAO)}
        {select('consciencia', 'Nível de consciência', CONSCIENCIA)}
        {SIM_NAO.filter((p) => p.key !== 'solicitado').map((p) => select(p.key, p.label, SIM_NAO_OPCOES))}
      </div>
      <div className="nh-campo">
        <span className="form-lbl">Alimentação</span>
        <div className="hc-chips">
          {ALIMENTACAO.map((a) => (
            <label key={a.key} className={`hc-chip${alimentacao.includes(a.key) ? ' on' : ''}`}>
              <input type="checkbox" checked={alimentacao.includes(a.key)} disabled={desabilitado}
                     onChange={() => onMudar({
                       ...valor,
                       alimentacao: alimentacao.includes(a.key)
                         ? alimentacao.filter((x) => x !== a.key)
                         : [...alimentacao, a.key],
                     })} />
              {a.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
