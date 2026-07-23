// Vista 1 — grid geral de operadoras (accordion). Extraída de pages/Configuracoes.tsx.
import { useState } from 'react'
import type { OperadoraCard } from '../../types/api'
import { usePageHeader } from '../PageHeader'
import { Badge, OpAvatar } from '../ui'
import Toast from '../Toast'
import { popularDemo as apiPopularDemo, limparDados as apiLimparDados } from '../../services/admin.service'
import { localStyles } from './configuracoes.styles'
import { ChevronRight } from './shared'
import { NovaOperadoraModal } from './forms'

export default function OverviewView({ operadoras, onNav, onToast, onChanged, toast }: {
  operadoras: OperadoraCard[]
  onNav: (n: Record<string, string>) => void
  onToast: (m: string) => void
  onChanged: () => void
  toast: string | null
}) {
  const [novaOpen, setNovaOpen] = useState(false)
  const [busy, setBusy] = useState<'demo' | 'limpar' | null>(null)
  // Operadoras expandidas no accordion (várias podem ficar abertas ao mesmo tempo).
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set())

  function toggle(key: string) {
    setExpandidas((cur) => {
      const next = new Set(cur)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function popularDemo() {
    if (!confirm('Inserir dados de demonstração (pacientes, relatórios e altas)?')) return
    setBusy('demo')
    try {
      const d = await apiPopularDemo()
      if (d.ok) { onToast(`✓ Demo: ${d.pacientes_inseridos || 0} pacientes e ${d.altas_inseridas || 0} altas`); onChanged() }
      else onToast('Erro ao popular demo')
    } catch (e) { onToast(`Erro: ${(e as Error).message}`) } finally { setBusy(null) }
  }

  async function limparDados() {
    const r = prompt('Isso vai apagar TODAS as internações, relatórios e censos.\nOperadoras, hospitais e equipe serão mantidos.\n\nDigite LIMPAR para confirmar:')
    if (r === null) return
    if (r.trim().toUpperCase() !== 'LIMPAR') { onToast('Confirmação incorreta — nada foi apagado'); return }
    setBusy('limpar')
    try {
      const d = await apiLimparDados()
      if (d.ok) { onToast(`✓ Base limpa: ${d.removidos?.internacoes || 0} internações removidas`); onChanged() }
      else onToast('Erro ao limpar dados')
    } catch (e) { onToast(`Erro: ${(e as Error).message}`) } finally { setBusy(null) }
  }

  const actions = (
    <>
      <button className="btn btn-outline btn-sm" onClick={popularDemo} disabled={busy != null}>{busy === 'demo' ? 'Inserindo…' : 'Dados demo'}</button>
      <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: 'rgba(200,36,60,.35)' }} onClick={limparDados} disabled={busy != null}>{busy === 'limpar' ? 'Limpando…' : 'Limpar dados'}</button>
      <button className="btn btn-primary btn-sm" onClick={() => setNovaOpen(true)}>Nova Operadora</button>
    </>
  )

  usePageHeader({ title: 'Operadoras de Saúde', subtitle: 'Configure as regras de monitoramento de cada operadora', actions })

  return (
    <>
      <style>{localStyles}</style>

      <div className="op-acc">
        {operadoras.map((o) => {
          const ativa = o.regras?.ativo !== false
          const open = expandidas.has(o.key)
          return (
            <div key={o.key} className={`op-acc-item${open ? ' open' : ''}`}>
              <button
                type="button"
                className="op-acc-head"
                onClick={() => toggle(o.key)}
                aria-expanded={open}
              >
                <ChevronRight />
                <OpAvatar opKey={o.key} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="op-acc-name truncate">{o.nome}</div>
                  <div className="op-acc-resp truncate">{o.responsaveis || 'Sem responsável definido'}</div>
                </div>
                <span style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)', marginRight: 4 }}>
                  {o.hospitais_count || 0} hosp.
                </span>
                {ativa
                  ? <Badge variant="success" dot>Ativa</Badge>
                  : <Badge variant="muted">Inativa</Badge>}
              </button>

              {open && (
                <div className="op-acc-body">
                  <div className="op-acc-rules" style={{ borderTop: 'none', paddingTop: 0 }}>
                    <span>Gatilho UTI: <strong className="mono t-ink-2">{o.regras?.dias_uti ?? '—'}d</strong></span>
                    <span>Apartamento: <strong className="mono t-ink-2">{o.regras?.dias_apartamento ?? '—'}d</strong></span>
                    <span>Enfermaria: <strong className="mono t-ink-2">{o.regras?.dias_enfermaria ?? '—'}d</strong></span>
                    <span>Janela relatório: <strong className="mono t-ink-2">{o.regras?.dias_entre_relatorios ?? '—'}d</strong></span>
                    <span>Longa: <strong className="mono t-ink-2">{o.regras?.dias_longa_permanencia ?? '—'}d</strong> / <strong className="mono t-ink-2">{o.regras?.dias_longa_avancada ?? '—'}d</strong></span>
                  </div>

                  <div className="op-acc-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => onNav({ op: o.key })}>Configurar regras</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {novaOpen && <NovaOperadoraModal onClose={() => setNovaOpen(false)} onDone={(key) => { setNovaOpen(false); onToast('✓ Operadora criada'); onNav({ op: key }) }} onError={onToast} />}
      {toast && <Toast message={toast} onDone={() => onToast('')} />}
    </>
  )
}
