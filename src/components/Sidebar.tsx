import { useState } from 'react'
import { NavLink, useSearchParams, useLocation } from 'react-router-dom'
import { useSidebar, usePrefetchDashboard } from '../hooks/useDashboard'
import { prefetchPorRota } from '../routes'
import { useAuth } from '../auth/AuthContext'
import { podeVer, rotaFallback } from '../auth/permissions'
import { ROLE_LABEL as ROTULO_PAPEL } from '../lib/usuarioRoles'
import SidebarAjuda from './ajuda/SidebarAjuda'
import { useAjudaNav } from './ajuda/useAjudaNav'
import { useTrocaPainel } from './ajuda/useTrocaPainel'

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
const IconKanban = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="6" height="14" rx="1" /><rect x="9.5" y="3" width="6" height="9" rx="1" transform="translate(0.5 0)" /><rect x="15" y="3" width="6" height="11" rx="1" /></svg>
)
// Movimentações: lista com marcador de verificação (trilha validada pelo analista).
const IconLogs = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M14 3v5h5" /><path d="M8 13h5" /><path d="M8 17h8" /><path d="m16 5 2 2 4-4" /></svg>
)
// Progresso: trilha com etapas concluídas e uma em curso — a leitura da tela.
const IconProgresso = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16" /><circle cx="5.5" cy="12" r="2.5" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" /><circle cx="18.5" cy="12" r="2.5" /></svg>
)
// Relatório: folha de documento com linhas de texto — a peça da auditoria.
const IconRelatorio = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 12h6" /><path d="M9 16h6" /></svg>
)
// Volumetria: barras de tamanhos diferentes — a carga de trabalho por hospital.
const IconVolumetria = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><rect x="5" y="13" width="4" height="8" /><rect x="11" y="8" width="4" height="13" /><rect x="17" y="4" width="4" height="17" /></svg>
)
// Ajuda: interrogação em círculo, o sinal universal de documentação.
const IconAjuda = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M9.2 9.3a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.4-2.8 4" /><path d="M12 17.3h.01" /></svg>
)
// Chevrons duplos: apontam para a esquerda (recolher) ou direita (expandir).
const IconCollapse = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17-5-5 5-5" /><path d="m18 17-5-5 5-5" /></svg>
)
// Sair (logout): porta com seta apontando para fora.
const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
)

// Rótulo amigável do papel exibido no rodapé (perfil do usuário logado).
// Reusa a fonte única de lib/usuarioRoles para não divergir da lista/formulário
// de usuários quando um papel novo entra.
const ROLE_LABEL = ROTULO_PAPEL as Record<string, string>

// Iniciais para o avatar: pega as 2 primeiras letras significativas do nome/e-mail.
function iniciais(nome: string): string {
  const base = (nome || '').split('@')[0].trim()
  if (!base) return 'B+'
  const partes = base.split(/[\s._-]+/).filter(Boolean)
  const letras = partes.length >= 2 ? partes[0][0] + partes[1][0] : base.slice(0, 2)
  return letras.toUpperCase()
}

function itemClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'sb-item active' : 'sb-item'
}

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export default function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const { username, nome, role, perfilCarregando, logout } = useAuth()
  // Identidade no rodapé é o NOME; o e-mail (username) fica no tooltip.
  const exibicao = nome ?? username
  const { data } = useSidebar()
  const prefetchDashboard = usePrefetchDashboard()
  const [params] = useSearchParams()
  const location = useLocation()
  // Sem ?operadora na URL a Visão Geral está no modo CONSOLIDADO (todas as
  // operadoras): nenhuma sub-item fica ativa — o próprio "Visão Geral" é o ativo.
  const opAtual = params.get('operadora') || ''
  const noDashboard = location.pathname === '/'
  // Na tela de Ajuda a barra deixa de listar as TELAS e passa a listar os
  // MÓDULOS da documentação — mesma barra, mesmos estilos, outro conteúdo.
  // A troca é animada: `naAjuda` é o painel EM CENA (que atrasa o do destino
  // enquanto o atual sai), e `classeTroca` carrega a animação da vez.
  const { ajuda: naAjuda, classe: classeTroca } = useTrocaPainel(location.pathname === '/ajuda')
  const ajuda = useAjudaNav()

  // No boot/login o `role` chega DEPOIS do /me. `podeVer(null, …)` libera tudo,
  // então os itens gated apareceriam e sumiriam ao resolver o papel (flash). Até
  // o perfil resolver, escondemos os itens que dependem de papel — o menu cresce
  // ao completar, em vez de encolher. As operadoras (dado do backend recortado)
  // seguem por `sidebarOps` normalmente. `perfilCarregando` nunca trava.
  const mostrar = (screen: Parameters<typeof podeVer>[1]) => !perfilCarregando && podeVer(role, screen)

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
          <div className="sb-brand-name">BMais</div>
          <div className="sb-brand-sub">Intelligence System</div>
        </div>
      </div>

      {/* Um invólucro por painel, com a classe da animação: é ele que desliza,
          não a barra inteira (marca, rodapé e botão de recolher ficam parados,
          então a troca é do MIOLO, e não da tela). */}
      <div className={`sb-troca${classeTroca ? ` ${classeTroca}` : ''}`}>
      {naAjuda ? (
        <SidebarAjuda nav={ajuda} rotaSaida={rotaFallback(role)} />
      ) : (
      <>
      <nav className="sb-nav">
        <div className="sb-section">
          <div className="sb-section-label">Painel</div>
          {/* "Visão Geral" leva ao Dashboard CONSOLIDADO (todas as operadoras); o
              chevron aninha a lista de operadoras, que é o recorte por foco de
              operadora DENTRO da própria Visão Geral. */}
          {mostrar('operacional') && (
          <NavLink to="/" end className={itemClass} {...prefetchProps('/')}>
            <span className="sb-item-icon"><IconGrid /></span>
            <span className="sb-item-label">Visão Geral</span>
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
          )}
          {mostrar('operacional') && opsOpen && sidebarOps.length > 0 && (
          <div className="sb-sub">
            {sidebarOps.map((op) => {
              // Só PACIENTES NOVOS (sem nenhum relatório) marcam a operadora.
              // Antes vinha o total de internados — um número constante, que não
              // dizia se havia algo a fazer. Sem novos, a linha fica só com o nome.
              const novos = Number(op.novos ?? 0)
              const isAlert = novos > 0
              const active = noDashboard && opAtual === op.key
              return (
                <NavLink
                  key={op.key}
                  to={`/?operadora=${op.key}`}
                  title={isAlert ? `${op.nome}: ${novos} novo${novos > 1 ? 's' : ''}` : op.nome}
                  className={
                    'sb-sub-item' + (isAlert ? ' has-alert' : '') + (active ? ' active' : '')
                  }
                  // Aquece o chunk da página E os dados do dashboard desta
                  // operadora — ao clicar, a tela já vem do cache (sem round-trip).
                  onMouseEnter={() => { aquecer('/'); prefetchDashboard(op.key) }}
                  onFocus={() => { aquecer('/'); prefetchDashboard(op.key) }}
                >
                  <span className="sb-sub-name">{op.nome}</span>
                  {isAlert && (
                    <span className="sb-sub-mark novos"
                      title={`${novos} paciente${novos > 1 ? 's' : ''} novo${novos > 1 ? 's' : ''} sem relatório`}>
                      {novos}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>
          )}
          {mostrar('kanban') && (
            <NavLink to="/kanban" className={itemClass} {...prefetchProps('/kanban')}>
              <span className="sb-item-icon"><IconKanban /></span>
              <span className="sb-item-label">Tarefas</span>
            </NavLink>
          )}
          {mostrar('volumetria') && (
            <NavLink to="/volumetria" className={itemClass} {...prefetchProps('/volumetria')}>
              <span className="sb-item-icon"><IconVolumetria /></span>
              <span className="sb-item-label">Volumetria</span>
            </NavLink>
          )}
          {mostrar('diretoria') && (
            <NavLink to="/diretoria" className={itemClass} {...prefetchProps('/diretoria')}>
              <span className="sb-item-icon"><IconDiretoria /></span>
              <span className="sb-item-label">Diretoria / KPIs</span>
            </NavLink>
          )}
          {mostrar('gestor') && (
            <NavLink to="/gestor" className={itemClass} {...prefetchProps('/gestor')}>
              <span className="sb-item-icon"><IconGestor /></span>
              <span className="sb-item-label">Gestor / Fluxo</span>
            </NavLink>
          )}
        </div>

        <div className="sb-section">
          <div className="sb-section-label">Sistema</div>
          {mostrar('equipe') && (
            <NavLink to="/equipe" className={itemClass} {...prefetchProps('/equipe')}>
              <span className="sb-item-icon"><IconEquipe /></span>
              <span className="sb-item-label">Operações</span>
            </NavLink>
          )}
          {mostrar('configuracoes') && (
            <NavLink to="/configuracoes" className={itemClass} {...prefetchProps('/configuracoes')}>
              <span className="sb-item-icon"><IconConfig /></span>
              <span className="sb-item-label">Configurações</span>
            </NavLink>
          )}
          {mostrar('upload') && (
            <NavLink to="/upload" className={itemClass} {...prefetchProps('/upload')}>
              <span className="sb-item-icon"><IconUpload /></span>
              <span className="sb-item-label">Envio de Censos</span>
            </NavLink>
          )}
          {mostrar('logs') && (
            <NavLink to="/logs" className={itemClass} {...prefetchProps('/logs')}>
              <span className="sb-item-icon"><IconLogs /></span>
              <span className="sb-item-label">Movimentações</span>
            </NavLink>
          )}
          {/* Progresso: avanço da CONSTRUÇÃO do produto, não da operação. Fica
              por último na seção, abaixo das telas de trabalho. */}
          {mostrar('progresso') && (
            <NavLink to="/progresso" className={itemClass} {...prefetchProps('/progresso')}>
              <span className="sb-item-icon"><IconProgresso /></span>
              <span className="sb-item-label">Progresso</span>
            </NavLink>
          )}
          {/* Relatório da auditoria: vizinho do Progresso porque responde à
              mesma pergunta em outra escala — um mostra onde a obra está, o
              outro o plano inteiro de que ela faz parte. */}
          {mostrar('relatorio') && (
            <NavLink to="/relatorio" className={itemClass} {...prefetchProps('/relatorio')}>
              <span className="sb-item-icon"><IconRelatorio /></span>
              <span className="sb-item-label">Relatório</span>
            </NavLink>
          )}
        </div>
      </nav>
      </>
      )}
      </div>

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

      {/* Rodapé = perfil do usuário logado + Sair (movidos da topbar para cá). */}
      <div className="sb-foot">
        <div className="sb-foot-user">
          <div className="sb-foot-avatar" title={username ?? undefined}>{iniciais(exibicao ?? '')}</div>
          <div className="sb-foot-info flex-1">
            <div className="sb-foot-name" title={username ?? undefined}>{exibicao ?? 'Usuário'}</div>
            <div className="sb-foot-role">
              {perfilCarregando ? '…' : (role ? (ROLE_LABEL[role] ?? role) : `Ref: ${data?.hoje_efetivo ?? '—'}`)}
            </div>
          </div>
        </div>
        {/* Sair + Ajuda lado a lado. A Ajuda é atalho, não tela de trabalho:
            fica como ícone no rodapé em vez de disputar espaço com o menu. */}
        <div className="sb-foot-acoes">
          <button
            type="button"
            className="sb-logout"
            onClick={logout}
            aria-label="Sair"
            title="Sair"
          >
            <span className="sb-logout-icon"><IconLogout /></span>
            <span className="sb-logout-label">Sair</span>
          </button>
          <NavLink
            to="/ajuda"
            className={({ isActive }) => (isActive ? 'sb-ajuda active' : 'sb-ajuda')}
            aria-label="Ajuda"
            title="Ajuda: documentação das telas"
            {...prefetchProps('/ajuda')}
          >
            <IconAjuda />
          </NavLink>
        </div>
      </div>
    </aside>
  )
}
