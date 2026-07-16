import { useState } from 'react'
import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import { useAuth } from '../auth/AuthContext'

interface LayoutProps {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
}

export default function Layout({ title, subtitle, actions, children }: LayoutProps) {
  const { username, logout } = useAuth()
  // Estado de recolhimento da sidebar, persistido para não reiniciar a cada navegação.
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('bmais_sidebar_collapsed') === '1'
  })
  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v
      localStorage.setItem('bmais_sidebar_collapsed', next ? '1' : '0')
      return next
    })
  }
  return (
    <div className={'app' + (collapsed ? ' is-collapsed' : '')}>
      <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      <main className="main">
        <div className="topbar">
          <div className="tb-title">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="tb-spacer" />
          {actions}
          <span className="tb-pill">
            <span className="tb-dot" />
            {username}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={logout} title="Sair">
            Sair
          </button>
        </div>
        <div className="scope">{children}</div>
      </main>
    </div>
  )
}
