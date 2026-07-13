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
  return (
    <div className="app">
      <Sidebar />
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
