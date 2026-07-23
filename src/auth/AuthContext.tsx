import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError, apiFetch, getToken, setToken, setUnauthorizedHandler } from '../api/client'
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
  const [username, setUsername] = useState<string | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  // Perfil (/me) em resolução. Inicia true SE há token salvo (o boot vai buscar
  // /me); sem token, não há o que resolver. Vira false quando /me responde
  // (com role ou com falha) — nunca fica preso, mesmo se o /me falhar.
  const [perfilCarregando, setPerfilCarregando] = useState(() => !!getToken())
  // Boot otimista: se HÁ token salvo, já consideramos a sessão válida e renderizamos
  // o app enquanto /me valida em background — evita a tela branca a cada refresh.
  // Vira false se /me falhar (401): aí cai no Login.
  const [tokenValido, setTokenValido] = useState(() => !!getToken())

  const logout = useCallback(() => {
    setToken(null)
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
        }
      } catch (e) {
        // Só derruba a sessão se o /me disser explicitamente que o token é
        // inválido (401). Timeout/rede/503 (NetworkError) NÃO deslogam: mantém o
        // boot otimista (tokenValido) e o app segue com o token salvo.
        if (!cancelled && e instanceof ApiError && e.status === 401) {
          setToken(null)
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
