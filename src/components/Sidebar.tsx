import { NavLink, useSearchParams, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/client'
import type { SidebarData } from '../types/api'

const IconOperacional = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-7 9 7" /><path d="M5 9.5V20h14V9.5" /><path d="M9 20v-6h6v6" /></svg>
)
const IconDiretoria = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></svg>
)
const IconGestor = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 14l4-4 4 4 5-6" /><circle cx="7" cy="14" r="1.2" /><circle cx="11" cy="10" r="1.2" /><circle cx="15" cy="14" r="1.2" /><circle cx="20" cy="8" r="1.2" /></svg>
)
const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
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

function itemClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'sb-item active' : 'sb-item'
}

export default function Sidebar() {
  const { data } = useQuery({
    queryKey: ['sidebar'],
    queryFn: () => apiFetch<SidebarData>('/sidebar'),
    staleTime: 30_000,
  })
  const [params] = useSearchParams()
  const location = useLocation()
  const opAtual = params.get('operadora') || 'sulamerica'
  const noDashboard = location.pathname === '/'

  const sidebarOps = data?.sidebar_ops ?? []

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
          <NavLink to="/" end className={itemClass}>
            <span className="sb-item-icon"><IconOperacional /></span>
            <span className="sb-item-label">Operacional</span>
          </NavLink>
          <NavLink to="/diretoria" className={itemClass}>
            <span className="sb-item-icon"><IconDiretoria /></span>
            <span className="sb-item-label">Diretoria / KPIs</span>
          </NavLink>
          <NavLink to="/gestor" className={itemClass}>
            <span className="sb-item-icon"><IconGestor /></span>
            <span className="sb-item-label">Gestor / Fluxo</span>
          </NavLink>
        </div>

        <div className="sb-section">
          <div className="sb-section-label">Operadoras</div>
          <NavLink to="/configuracoes" end className={itemClass}>
            <span className="sb-item-icon"><IconGrid /></span>
            <span className="sb-item-label">Visão Geral</span>
            <span className="sb-item-badge">{sidebarOps.length}</span>
          </NavLink>
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
        </div>

        <div className="sb-section">
          <div className="sb-section-label">Sistema</div>
          <NavLink to="/equipe" className={itemClass}>
            <span className="sb-item-icon"><IconEquipe /></span>
            <span className="sb-item-label">Equipe</span>
            <span className="sb-item-badge">{data?.sidebar_prof_count ?? 0}</span>
          </NavLink>
          <NavLink to="/configuracoes" className={itemClass}>
            <span className="sb-item-icon"><IconConfig /></span>
            <span className="sb-item-label">Configurações</span>
          </NavLink>
          <NavLink to="/upload" className={itemClass}>
            <span className="sb-item-icon"><IconUpload /></span>
            <span className="sb-item-label">Upload Censos</span>
          </NavLink>
        </div>
      </nav>

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
