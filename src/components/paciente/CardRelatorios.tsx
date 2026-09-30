// Card "Relatórios" da ficha: lista dos relatórios e o formulário inline de um
// novo. O formulário só existe para quem pode registrar (perfil técnico; admin
// supervisiona); os demais veem o card somente-leitura.
import { useState } from 'react'
import { AutorChip, roleVisual } from '../StatusBadge'
import { LoadingState } from '../ui'
import { dataBR, dataHora, hojeISO } from '../../lib/datas'
import type { RelatorioItem } from '../../types/api'
import { CamposRelatorio } from './CamposRelatorio'
import { useFormRelatorio } from './useFormRelatorio'

// Um relatório: quando/quem registrou + a observação escrita, com a borda na cor
// do papel de quem registrou.
function RelatorioCard({ r }: { r: RelatorioItem }) {
  return (
    <div
      style={{
        border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px',
        borderLeft: `3px solid ${roleVisual(r.autor_role).color}`, background: 'var(--surface)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--t-sm)', fontWeight: 600, color: 'var(--ink)' }}>
          {dataHora(r.criado_em) || dataBR(r.data_visita) || '—'}
        </span>
        {r.autor && <AutorChip role={r.autor_role} autor={r.autor} />}
      </div>
      {r.data_visita && (
        <div style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)', marginTop: 2 }}>
          Visita: {dataBR(r.data_visita)}{r.medico ? ` · ${r.medico}` : ''}
        </div>
      )}
      {r.cids && r.cids.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {r.cids.map((c) => (
            <span
              key={c.codigo} className="badge muted"
              style={{ textTransform: 'none', letterSpacing: 0, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={c.descricao ? `${c.codigo} ${c.descricao}` : c.codigo}
            >
              <b className="mono">{c.codigo}</b>{c.descricao ? ` ${c.descricao}` : ''}
            </span>
          ))}
        </div>
      )}
      {r.descricao && (
        <div className="tl-desc" style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>
          {r.descricao}
        </div>
      )}
    </div>
  )
}

export function CardRelatorios({ internacaoId, relatorios, carregando, erro, podeRegistrar, medicos, onRegistrado }: {
  internacaoId: number
  relatorios: RelatorioItem[] | undefined
  carregando: boolean
  erro: boolean
  podeRegistrar: boolean
  medicos: string[]
  onRegistrado: () => void
}) {
  const [registrando, setRegistrando] = useState(false)
  const form = useFormRelatorio(internacaoId, {
    dataInicial: hojeISO,
    onRegistrado: () => { setRegistrando(false); onRegistrado() },
  })

  function abrir() {
    form.limpar()
    setRegistrando(true)
  }

  return (
    // `overflow: visible`: a lista do campo CID passa da borda do card.
    <div className="card" style={{ flexShrink: 0, overflow: 'visible' }}>
      <div className="card-header">
        <div className="card-title">Relatórios</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge muted">{relatorios?.length ?? 0}</span>
          {podeRegistrar && !registrando && (
            <button className="btn btn-primary btn-sm" style={{ gap: 6 }} onClick={abrir}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
              Registrar
            </button>
          )}
        </div>
      </div>
      <div className="card-body">
        {podeRegistrar && registrando && (
          <div
            style={{
              border: '1px solid var(--border-strong)', borderRadius: 10,
              padding: '14px', marginBottom: 14, background: 'var(--surface)',
              display: 'grid', gap: 10,
            }}
          >
            <div className="section-label" style={{ margin: 0 }}>Novo relatório</div>
            <CamposRelatorio form={form} medicos={medicos} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setRegistrando(false)} disabled={form.salvando}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={form.salvar} disabled={form.salvando}>
                {form.salvando ? 'Registrando…' : 'Registrar relatório'}
              </button>
            </div>
          </div>
        )}
        {carregando && <LoadingState label="Carregando relatórios…" size={22} style={{ padding: '24px 8px' }} />}
        {erro && (
          <div className="t-muted" style={{ fontSize: 'var(--t-sm)' }}>Não foi possível carregar os relatórios.</div>
        )}
        {relatorios && relatorios.length === 0 && !registrando && (
          <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--muted-2)' }}>
            <div style={{ fontWeight: 600, color: 'var(--muted)' }}>Nenhum relatório</div>
            <div style={{ fontSize: 'var(--t-sm)', marginTop: 4 }}>
              {podeRegistrar ? 'Use “Registrar” para adicionar o primeiro.' : 'Nenhum registro ainda.'}
            </div>
          </div>
        )}
        {relatorios && relatorios.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {relatorios.map((r) => <RelatorioCard key={r.id} r={r} />)}
          </div>
        )}
      </div>
    </div>
  )
}
