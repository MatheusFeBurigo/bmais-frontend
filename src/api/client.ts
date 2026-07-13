// Cliente HTTP central. Prefixa a base da API, injeta o token Bearer e
// normaliza erros. Em dev, VITE_API_URL vazio => usa o proxy /api do Vite.

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const TOKEN_KEY = 'bmais_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Disparado quando um 401 indica sessão inválida — a UI reage deslogando.
type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler | null = null
export function setUnauthorizedHandler(fn: UnauthorizedHandler | null) {
  onUnauthorized = fn
}

interface RequestOptions {
  method?: string
  body?: unknown
  // Não redirecionar para login em 401 (ex.: a própria chamada de login).
  skipAuthRedirect?: boolean
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, skipAuthRedirect } = opts
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  let payload: BodyInit | undefined
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const res = await fetch(`${API_BASE}/api${path}`, { method, headers, body: payload })

  if (res.status === 401 && !skipAuthRedirect) {
    setToken(null)
    onUnauthorized?.()
    throw new ApiError(401, 'Não autenticado')
  }

  if (!res.ok) {
    let detail = `Erro ${res.status}`
    try {
      const data = await res.json()
      if (data?.detail) detail = data.detail
    } catch {
      /* resposta sem corpo JSON */
    }
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) return undefined as T
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return (await res.json()) as T
  return (await res.text()) as unknown as T
}

// URL absoluta da API (para referência/depuração).
export function apiUrl(path: string): string {
  return `${API_BASE}/api${path}`
}

// Upload multipart (FormData). Injeta o token Bearer e NÃO define Content-Type
// (o browser preenche o boundary automaticamente). Trata 401 como o apiFetch.
export async function apiUpload<T = unknown>(path: string, form: FormData): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}/api${path}`, { method: 'POST', headers, body: form })

  if (res.status === 401) {
    setToken(null)
    onUnauthorized?.()
    throw new ApiError(401, 'Não autenticado')
  }
  if (!res.ok) {
    let detail = `Erro ${res.status}`
    try {
      const data = await res.json()
      if (data?.detail) detail = data.detail
    } catch {
      /* resposta sem corpo JSON */
    }
    throw new ApiError(res.status, detail)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

// Download autenticado: busca com o token Bearer e dispara o "salvar como".
// Necessário porque <a href> não envia o header Authorization.
export async function apiDownload(path: string, filename: string): Promise<void> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}/api${path}`, { headers })
  if (res.status === 401) {
    setToken(null)
    onUnauthorized?.()
    throw new ApiError(401, 'Não autenticado')
  }
  if (!res.ok) throw new ApiError(res.status, `Falha no download (${res.status})`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
