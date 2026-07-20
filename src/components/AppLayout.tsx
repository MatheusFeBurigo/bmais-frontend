import { useState, Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../auth/AuthContext'
import { usePageHeaderValue } from './PageHeader'
import { LoadingState } from './ui'

// Layout persistente da área autenticada: Sidebar + topbar montam UMA vez e
// permanecem montados entre navegações. Só o miolo (<Outlet/>) troca por rota,
// então a barra lateral não pisca/reconstrói e o estado dela (scroll, listas
// abertas) sobrevive à troca de tela. O título/ações do topbar vêm do
// PageHeaderContext, alimentado por cada página via usePageHeader().
export default function AppLayout() {
  const { username, logout } = useAuth()
  const { title, subtitle, actions } = usePageHeaderValue()

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
        {/* Suspense restrito à área de conteúdo: o fallback do chunk lazy aparece
            só aqui, não cobrindo a Sidebar/topbar. minHeight sem 100vh para não
            empurrar a tela inteira. */}
        <div className="scope">
          <Suspense fallback={<LoadingState style={{ minHeight: 360 }} />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
