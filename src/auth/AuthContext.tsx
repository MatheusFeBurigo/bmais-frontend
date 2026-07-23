import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError, apiFetch, getToken, setToken, getPerfil, setPerfil, tokenPersistente, setUnauthorizedHandler } from '../api/client'
import { clearSidebarCache } from '../services/dashboard.service'
import type { LoginResponse, MeResponse, RegisterResponse, UserRole } from '../types/api'

interface AuthState {
  username: string | null
  role: UserRole | null
  authenticated: boolean
  loading: boolean
  // True enquanto o papel (/me) ainda está sendo resolvido — no boot com token
  // salvo E logo após o login. Guards/Sidebar aguardam isto para não renderizar
  // itens/telas com role=null (que liberaria tudo) e depois recolher (flash).
  perfilCarregando: boolean
  // remember=true (padrão) mantém a sessão entre reinícios do navegador.
  login: (username: string, password: string, remember?: boolean) => Promise<void>
  // Devolve o resultado do registro: se exigir confirmação de e-mail, a UI mostra
  // o aviso; senão a sessão já é aplicada e o app redireciona automaticamente.
  register: (
    email: string,
    password: string,
    role: UserRole,
    remember?: boolean,
  ) => Promise<RegisterResponse>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  // Hidrata username/role do storage no boot: se o usuário já logou antes (token
  // salvo), o papel está disponível SÍNCRONO na 1ª pintura — a Sidebar/guards já
  // renderizam o menu correto, sem esperar o /me. O /me revalida em background.
  const perfilSalvo = getPerfil()
  const [username, setUsername] = useState<string | null>(perfilSalvo?.username ?? null)
  const [role, setRole] = useState<UserRole | null>((perfilSalvo?.role as UserRole | null) ?? null)
  const [loading, setLoading] = useState(true)
  // Perfil (/me) em resolução. Só BLOQUEIA a UI quando há token MAS ainda não
  // sabemos o papel (sem perfil salvo). Com perfil salvo, o papel já está
  // hidratado → não trava a Sidebar/guards; o /me apenas revalida em background.
  const [perfilCarregando, setPerfilCarregando] = useState(() => !!getToken() && !getPerfil()?.role)
  // Boot otimista: se HÁ token salvo, já consideramos a sessão válida e renderizamos
  // o app enquanto /me valida em background — evita a tela branca a cada refresh.
  // Vira false se /me falhar (401): aí cai no Login.
  const [tokenValido, setTokenValido] = useState(() => !!getToken())

  const logout = useCallback(() => {
    setToken(null)
    setPerfil(null)
    clearSidebarCache()  // não vazar o recorte de operadoras ao próximo usuário
    setUsername(null)
    setRole(null)
    setTokenValido(false)
    // Zera TODO o cache de dados: as respostas são recortadas ao escopo do usuário
    // (overview/sidebar/dashboard). Sem limpar, o próximo login reusaria dados do
    // usuário anterior (ex.: admin veria o recorte do administrativo). Segurança + UX.
    qc.clear()
  }, [qc])

  // Ao carregar, se houver token guardado, valida com /api/me.
  useEffect(() => {
    let cancelled = false
    async function check() {
      if (!getToken()) {
        setLoading(false)
        return
      }
      try {
        const me = await apiFetch<MeResponse>('/me', { skipAuthRedirect: true })
        if (!cancelled) {
          setUsername(me.username)
          setRole(me.role ?? null)
          // Atualiza o espelho para o próximo boot já hidratar o papel certo
          // (o /me é a fonte de verdade; o papel pode ter mudado no servidor).
          setPerfil({ username: me.username, role: me.role ?? null }, tokenPersistente())
        }
      } catch (e) {
        // Só derruba a sessão se o /me disser explicitamente que o token é
        // inválido (401). Timeout/rede/503 (NetworkError) NÃO deslogam: mantém o
        // boot otimista (tokenValido) e o app segue com o token salvo.
        if (!cancelled && e instanceof ApiError && e.status === 401) {
          setToken(null)
          setPerfil(null)
          clearSidebarCache()
          setUsername(null)
          setRole(null)
          setTokenValido(false)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setPerfilCarregando(false)  // /me resolveu (ou falhou): não travar guards
        }
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [])

  // Qualquer 401 em chamadas subsequentes derruba a sessão.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setPerfil(null)  // não hidratar uma sessão morta no próximo boot
      clearSidebarCache()
      setUsername(null)
      setRole(null)
      setTokenValido(false)
      qc.clear()  // não deixa o cache recortado sobreviver à queda de sessão
    })
    return () => setUnauthorizedHandler(null)
  }, [qc])

  const login = useCallback(async (u: string, p: string, remember = true) => {
    const res = await apiFetch<LoginResponse>('/login', {
      method: 'POST',
      body: { email: u, username: u, password: p },
      skipAuthRedirect: true,
    })
    // Base limpa antes de carregar os dados do novo usuário — não herda o cache
    // (recortado ao escopo) de quem estava logado antes nesta aba.
    qc.clear()
    clearSidebarCache()  // idem para o snapshot persistente da Sidebar
    setToken(res.token, remember)
    setTokenValido(true)
    setUsername(res.username)
    // O login não devolve o papel; resolve-o via /me para o app já ter o role.
    // Enquanto isso, perfilCarregando segura os guards/Sidebar (evita o flash de
    // itens gated com role=null).
    setPerfilCarregando(true)
    try {
      const me = await apiFetch<MeResponse>('/me', { skipAuthRedirect: true })
      setRole(me.role ?? null)
      // Espelha o perfil no MESMO storage do token (remember) para o próximo
      // boot hidratar o papel de forma síncrona — sem flash de menu na Sidebar.
      setPerfil({ username: res.username, role: me.role ?? null }, remember)
    } catch {
      setRole(null)
    } finally {
      setPerfilCarregando(false)
    }
  }, [qc])

  const register = useCallback(
    async (email: string, password: string, role: UserRole, remember = true) => {
      const res = await apiFetch<RegisterResponse>('/register', {
        method: 'POST',
        body: { email, password, role },
        skipAuthRedirect: true,
      })
      // Sessão imediata (sem confirmação de e-mail): já entra no app.
      if (!res.confirmacao_necessaria && res.token && res.username) {
        setToken(res.token, remember)
        setTokenValido(true)
        setUsername(res.username)
        setRole(res.role ?? null)
        setPerfil({ username: res.username, role: res.role ?? null }, remember)
      }
      return res
    },
    [],
  )

  // Autenticado se já temos username OU se há token tido como válido (boot otimista,
  // antes do /me resolver). O 401 do /me zera tokenValido e derruba a sessão.
  const authenticated = !!username || tokenValido

  const value = useMemo<AuthState>(
    () => ({ username, role, authenticated, loading, perfilCarregando, login, register, logout }),
    [username, role, authenticated, loading, perfilCarregando, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
