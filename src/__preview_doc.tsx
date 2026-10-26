import { createRoot } from 'react-dom/client'
import './styles/design-system.css'
import DocumentoTecnico from './components/documentacao/DocumentoTecnico'

createRoot(document.getElementById('root')!).render(
  <div className="app">
    <aside className="sidebar" />
    <main className="main">
      <div className="topbar">
        <div className="tb-title"><h1>Progresso</h1><p>Avanço dos módulos do projeto</p></div>
        <div className="tb-spacer" />
        <a className="btn btn-outline btn-sm">Documentação técnica</a>
        <a className="btn btn-outline btn-sm">Relatório da auditoria</a>
      </div>
      <div className="scope"><DocumentoTecnico /></div>
    </main>
  </div>,
)

document.getElementById("root")!.style.transform = `translateY(-${Number(new URLSearchParams(location.search).get("y") || 0)}px)`
setTimeout(() => {
  if (new URLSearchParams(location.search).get('bare')) (document.querySelector('.app') as HTMLElement).style.gridTemplateColumns = '0 1fr'; if (new URLSearchParams(location.search).get('bare')) document.body.style.width = '390px'
  const sec = new URLSearchParams(location.search).get('sec')
  const el = sec ? document.getElementById(sec) : null
  if (el) document.getElementById('root')!.style.transform = `translateY(-${el.getBoundingClientRect().top + window.scrollY - 120}px)`
}, 300)
