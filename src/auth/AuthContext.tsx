import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { apiFetch, getToken, setToken, setUnauthorizedHandler } from '../api/client'
import type { LoginResponse } from '../types/api'

interface AuthState {
  username: string | null
  authenticated: boolean
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    setToken(null)
    setUsername(null)
  }, [])

  // Ao carregar, se houver token guardado, valida com /api/me.
  useEffect(() => {
    let cancelled = false
    async function check() {
      if (!getToken()) {
        setLoading(false)
        return
      }
      try {
        const me = await apiFetch<{ username: string }>('/me', { skipAuthRedirect: true })
        if (!cancelled) setUsername(me.username)
      } catch {
        if (!cancelled) {
          setToken(null)
          setUsername(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [])

  // Qualquer 401 em chamadas subsequentes derruba a sessão.
  useEffect(() => {
    setUnauthorizedHandler(() => setUsername(null))
    return () => setUnauthorizedHandler(null)
  }, [])

  const login = useCallback(async (u: string, p: string) => {
    const res = await apiFetch<LoginResponse>('/login', {
      method: 'POST',
      body: { username: u, password: p },
      skipAuthRedirect: true,
    })
    setToken(res.token)
    setUsername(res.username)
  }, [])

  const value = useMemo<AuthState>(
    () => ({ username, authenticated: !!username, loading, login, logout }),
    [username, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
