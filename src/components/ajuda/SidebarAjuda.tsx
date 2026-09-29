// A Sidebar do app no modo Ajuda: os mesmos itens escuros do menu, listando os
// módulos da documentação em vez das telas.
//
// Por que trocar o conteúdo da barra em vez de pôr um índice dentro da página:
// a documentação tem 14 módulos, e uma segunda coluna de navegação ao lado do
// menu daria duas barras competindo na mesma tela. Aqui o usuário navega no
// lugar em que já navega, com as classes `sb-*` do design-system — a Ajuda não
// inventa um menu próprio, ela ocupa o existente enquanto está aberta.
//
// Este painel lista SÓ os capítulos. Os Chamados não entram aqui (29/09/2026, a
// pedido do usuário): não são um capítulo, e o atalho deles é o ícone do rodapé
// da barra, que vira o de conversa enquanto a Ajuda está aberta (Sidebar.tsx).
import { useLocation, useNavigate } from 'react-router-dom'
import { ROTA_CHAMADOS, SECOES } from './tipos'
import type { AjudaNav } from './useAjudaNav'

// Voltar: seta para a esquerda. O modo Ajuda substitui o menu, então precisa de
// uma saída explícita de volta para as telas.
const IconVoltar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
)

interface Props {
  nav: AjudaNav
  /** Rota para onde o "Voltar" leva (a 1ª tela do papel). */
  rotaSaida: string
}

export default function SidebarAjuda({ nav, rotaSaida }: Props) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { modulos, atual } = nav
  // Nos Chamados a barra segue no modo Ajuda, mas nenhum módulo está aberto: o
  // `atual` do hook cairia no 1º módulo e o marcaria como ativo.
  const nosChamados = pathname.startsWith(ROTA_CHAMADOS)

  function abrirModulo(id: string) {
    // `irPara` troca só o ?modulo= da rota atual. Fora da página da Ajuda isso
    // poria o parâmetro na tela de Chamados, sem sair dela.
    if (nosChamados) navigate(`/ajuda?modulo=${encodeURIComponent(id)}`)
    else nav.irPara(id)
  }

  return (
    <nav className="sb-nav">
      <button type="button" className="sb-item sb-voltar" onClick={() => navigate(rotaSaida)}>
        <span className="sb-item-icon"><IconVoltar /></span>
        <span className="sb-item-label">Voltar ao sistema</span>
      </button>

      {SECOES.map((secao) => {
        const daSecao = modulos.filter((m) => m.secao === secao)
        if (daSecao.length === 0) return null
        return (
          <div className="sb-section" key={secao}>
            <div className="sb-section-label">{secao}</div>
            {daSecao.map((m) => {
              const ativo = !nosChamados && m.id === atual?.id
              const Icone = m.icone
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`sb-item${ativo ? ' active' : ''}`}
                  title={m.titulo}
                  aria-current={ativo ? 'true' : undefined}
                  onClick={() => abrirModulo(m.id)}
                >
                  <span className="sb-item-icon"><Icone /></span>
                  <span className="sb-item-label">{m.titulo}</span>
                </button>
              )
            })}
          </div>
        )
      })}
    </nav>
  )
}
