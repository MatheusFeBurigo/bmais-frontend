import { useState } from 'react'
import { NavLink, useSearchParams, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { sidebarQuery } from '../api/queries'
import { prefetchPorRota } from '../routes'
import { useAuth } from '../auth/AuthContext'
import { podeVer } from '../auth/permissions'

// Aquece o chunk da rota antes do clique (hover/foco), evitando o flash de
// carregamento na navegação. Silencia falhas — é só otimização.
function aquecer(rota: string) {
  prefetchPorRota[rota]?.().catch(() => {})
}
const prefetchProps = (rota: string) => ({
  onMouseEnter: () => aquecer(rota),
  onFocus: () => aquecer(rota),
})

// Seta que gira 90° quando a lista de operadoras está aberta (via classe .open).
const Caret = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
)

const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
)
const IconDiretoria = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></svg>
)
const IconGestor = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 14l4-4 4 4 5-6" /><circle cx="7" cy="14" r="1.2" /><circle cx="11" cy="10" r="1.2" /><circle cx="15" cy="14" r="1.2" /><circle cx="20" cy="8" r="1.2" /></svg>
)
const IconEquipe = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
)
const IconConfig = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.7.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.7.3 1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.7-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.7 1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></svg>
)
const IconUpload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg>
)
// Chevrons duplos: apontam para a esquerda (recolher) ou direita (expandir).
const IconCollapse = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17-5-5 5-5" /><path d="m18 17-5-5 5-5" /></svg>
)

function itemClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'sb-item active' : 'sb-item'
}

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export default function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const { role } = useAuth()
  const { data } = useQuery(sidebarQuery())
  const [params] = useSearchParams()
  const location = useLocation()
  const opAtual = params.get('operadora') || 'sulamerica'
  const noDashboard = location.pathname === '/'

  const sidebarOps = data?.sidebar_ops ?? []
  // Lista de operadoras expansível. Começa SEMPRE aberta e persiste a preferência
  // em localStorage, para não reiniciar fechada entre navegações/reloads.
  const [opsOpen, setOpsOpen] = useState(() => {
    return localStorage.getItem('bmais_ops_open') !== '0'
  })
  function toggleOps() {
    setOpsOpen((v) => {
      const next = !v
      localStorage.setItem('bmais_ops_open', next ? '1' : '0')
      return next
    })
  }

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-brand-mark">B+</div>
        <div className="sb-brand-text" style={{ flex: 1, minWidth: 0 }}>
          <div className="sb-brand-name">B+ Auditoria</div>
          <div className="sb-brand-sub">Censos Control</div>
        </div>
      </div>

      <nav className="sb-nav">
        <div className="sb-section">
          <div className="sb-section-label">Painel</div>
          {/* "Visão Geral" leva ao Dashboard; o chevron aninha a lista de operadoras,
              que é o recorte por foco de operadora DENTRO da própria Visão Geral. */}
          <NavLink to="/" end className={itemClass} {...prefetchProps('/')}>
            <span className="sb-item-icon"><IconGrid /></span>
            <span className="sb-item-label">Visão Geral</span>
            <span className="sb-item-badge">{sidebarOps.length}</span>
            <button
              type="button"
              className={`sb-caret${opsOpen ? ' open' : ''}`}
              aria-label={opsOpen ? 'Recolher operadoras' : 'Expandir operadoras'}
              aria-expanded={opsOpen}
              onClick={(e) => {
                // Não navega ao clicar no chevron — só alterna a lista.
                e.preventDefault()
                e.stopPropagation()
                toggleOps()
              }}
            >
              <Caret />
            </button>
          </NavLink>
          {opsOpen && sidebarOps.length > 0 && (
          <div className="sb-sub">
            {sidebarOps.map((op) => {
              const urgente = Number(op.urgente ?? 0)
              const internados = Number(op.internados ?? 0)
              const isAlert = urgente > 0
              const active = noDashboard && opAtual === op.key
              return (
                <NavLink
                  key={op.key}
                  to={`/?operadora=${op.key}`}
                  title={op.nome}
                  className={
                    'sb-sub-item' + (isAlert ? ' has-alert' : '') + (active ? ' active' : '')
                  }
                  {...prefetchProps('/')}
                >
                  <span className="sb-sub-name">{op.nome}</span>
                  {isAlert ? (
                    <>
                      <span className="sb-dot" />
                      <span className="sb-sub-mark">{urgente}</span>
                    </>
                  ) : internados > 0 ? (
                    <span className="sb-sub-mark">{internados}</span>
                  ) : (
                    <span className="sb-sub-mark">—</span>
                  )}
                </NavLink>
              )
            })}
          </div>
          )}
          {podeVer(role, 'diretoria') && (
            <NavLink to="/diretoria" className={itemClass} {...prefetchProps('/diretoria')}>
              <span className="sb-item-icon"><IconDiretoria /></span>
              <span className="sb-item-label">Diretoria / KPIs</span>
            </NavLink>
          )}
          <NavLink to="/gestor" className={itemClass} {...prefetchProps('/gestor')}>
            <span className="sb-item-icon"><IconGestor /></span>
            <span className="sb-item-label">Gestor / Fluxo</span>
          </NavLink>
        </div>

        <div className="sb-section">
          <div className="sb-section-label">Sistema</div>
          {podeVer(role, 'equipe') && (
            <NavLink to="/equipe" className={itemClass} {...prefetchProps('/equipe')}>
              <span className="sb-item-icon"><IconEquipe /></span>
              <span className="sb-item-label">Equipe</span>
              <span className="sb-item-badge">{data?.sidebar_prof_count ?? 0}</span>
            </NavLink>
          )}
          <NavLink to="/configuracoes" className={itemClass} {...prefetchProps('/configuracoes')}>
            <span className="sb-item-icon"><IconConfig /></span>
            <span className="sb-item-label">Configurações</span>
          </NavLink>
          <NavLink to="/upload" className={itemClass} {...prefetchProps('/upload')}>
            <span className="sb-item-icon"><IconUpload /></span>
            <span className="sb-item-label">Upload Censos</span>
          </NavLink>
        </div>
      </nav>

      <button
        type="button"
        className="sb-collapse"
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        aria-expanded={!collapsed}
        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        onClick={onToggleCollapse}
      >
        <span className="sb-collapse-icon"><IconCollapse /></span>
        <span className="sb-collapse-label">Recolher menu</span>
      </button>

      <div className="sb-foot">
        <div className="sb-foot-avatar">AU</div>
        <div className="sb-foot-info flex-1">
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>B+ Auditoria</div>
          <div className="sb-foot-ref">Ref: {data?.hoje_efetivo ?? '—'}</div>
        </div>
      </div>
    </aside>
  )
}
