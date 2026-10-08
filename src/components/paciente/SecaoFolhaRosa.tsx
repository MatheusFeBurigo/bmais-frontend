// Seção "Aplicar folha rosa" do formulário de relatório, só na ficha "Detalhes".
//
// A folha rosa é o acordo com o hospital que gera custo evitado: o paciente
// segue numa acomodação (De) e o hospital aceita cobrar outra (Para) por um
// número de diárias negociado. Desenho do protótipo do Márcia: fechada até ser
// marcada; acomodações, diárias, aceite do hospital, período e observação. Vale
// com o relatório aprovado, como a prorrogação. A foto da folha fica para depois.
//
// Campos dois a dois (desenho do tempo do card estreito da ficha; desde 08/10
// fica num bloco da modal "Registrar relatório", `BlocoOpcional`). É a "troca
// de acomodação" da negociação direta do portal antigo.
import { useCatalogosProrrogacao } from '../../hooks/useKanban'
import { dataBR } from '../../lib/datas'
import type { AceiteFolhaRosa, FolhaRosa } from '../../types/api'
import { BlocoOpcional } from './relatorio/BlocoOpcional'
import type { FormRelatorio } from './useFormRelatorio'

/** Rótulos do aceite (espelho de domain/folha_rosa.ACEITES). */
const ACEITES_FOLHA_ROSA: Record<AceiteFolhaRosa, string> = {
  sim: 'Sim, carimbado',
  nao: 'Não',
  aguardando: 'Aguardando',
}

// O leito vem em caixa alta ("APARTAMENTO") e o catálogo em nome próprio.
const chave = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()

export function SecaoFolhaRosa({ form }: { form: FormRelatorio }) {
  const fr = form.folhaRosa
  const catalogos = useCatalogosProrrogacao(Boolean(fr))
  // Sem a 0052 (ou sem os catálogos da 0047) a seção não aparece.
  if (!fr || !catalogos.data?.folha_rosa || !catalogos.data.acomodacoes.length) return null
  const { acomodacoes } = catalogos.data
  const v = fr.valores
  const doPaciente = fr.acomodacaoPaciente
  const sugerida = doPaciente
    ? acomodacoes.find((a) => chave(a.nome) === chave(doPaciente))?.nome
    : undefined

  const opcoes = (
    <>
      <option value="">Escolher</option>
      {acomodacoes.map((a) => <option key={a.id} value={a.nome}>{a.nome}</option>)}
    </>
  )

  return (
    <BlocoOpcional titulo="Folha rosa" tom="rosa" marcado={fr.ativa}
                   onMarcar={(ligar) => fr.alternar(ligar, sugerida)}
                   extra={fr.ativa && v.diarias ? `${v.diarias} ${v.diarias === '1' ? 'diária' : 'diárias'}` : ''}>
      <style>{`
        .fr-corpo{display:grid;gap:10px}
        .fr-par{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}
        .fr-par .bm-input{min-width:0;width:100%}
      `}</style>
      <div className="fr-corpo">
        <div className="fr-par">
          <label>
            <span className="form-lbl">De<span className="req">*</span></span>
            <select className="bm-input bm-select" value={v.de} onChange={(e) => fr.mudar('de', e.target.value)}>
              {opcoes}
            </select>
          </label>
          <label>
            <span className="form-lbl">Para<span className="req">*</span></span>
            <select className="bm-input bm-select" value={v.para} onChange={(e) => fr.mudar('para', e.target.value)}>
              {opcoes}
            </select>
          </label>
        </div>
        <div className="fr-par">
          <label>
            <span className="form-lbl">Diárias negociadas<span className="req">*</span></span>
            <input className="bm-input" inputMode="numeric" maxLength={3} value={v.diarias}
                   onChange={(e) => fr.mudar('diarias', e.target.value.replace(/\D/g, ''))} />
          </label>
          <label>
            <span className="form-lbl">Aceite do hospital<span className="req">*</span></span>
            <select className="bm-input bm-select" value={v.aceite}
                    onChange={(e) => fr.mudar('aceite', e.target.value as AceiteFolhaRosa)}>
              {(Object.keys(ACEITES_FOLHA_ROSA) as AceiteFolhaRosa[]).map((k) => (
                <option key={k} value={k}>{ACEITES_FOLHA_ROSA[k]}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="fr-par">
          <label>
            <span className="form-lbl">Início</span>
            <input type="date" className="bm-input" value={v.data_inicio}
                   onChange={(e) => fr.mudar('data_inicio', e.target.value)} />
          </label>
          <label>
            <span className="form-lbl">Fim</span>
            <input type="date" className="bm-input" value={v.data_fim} min={v.data_inicio || undefined}
                   onChange={(e) => fr.mudar('data_fim', e.target.value)} />
          </label>
        </div>
        <label>
          <span className="form-lbl">Observação</span>
          <textarea className="bm-input" rows={2} maxLength={1000} value={v.obs}
                    onChange={(e) => fr.mudar('obs', e.target.value)} />
        </label>
      </div>
    </BlocoOpcional>
  )
}

/** A folha rosa gravada num relatório: acordo, período, aceite e observação. */
export function ResumoFolhaRosa({ f }: { f: FolhaRosa }) {
  const periodo = f.data_inicio
    ? (f.data_fim ? `${dataBR(f.data_inicio)} a ${dataBR(f.data_fim)}` : `a partir de ${dataBR(f.data_inicio)}`)
    : ''
  return (
    <div style={{
      marginTop: 6, padding: '6px 10px', borderRadius: 8, background: 'var(--rosa-bg)',
      fontSize: 'var(--t-sm)', color: 'var(--ink-2)', display: 'grid', gap: 2, overflowWrap: 'anywhere',
    }}>
      <b style={{ color: 'var(--rosa)' }}>
        Folha rosa: {f.diarias} {f.diarias === 1 ? 'diária' : 'diárias'}
      </b>
      <span>{f.de} para {f.para}{periodo ? `, ${periodo}` : ''}</span>
      <span>Aceite do hospital: {ACEITES_FOLHA_ROSA[f.aceite] ?? f.aceite}</span>
      {f.obs && <span style={{ whiteSpace: 'pre-wrap' }}>{f.obs}</span>}
    </div>
  )
}
