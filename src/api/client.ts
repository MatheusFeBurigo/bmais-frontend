// Cliente HTTP central. Prefixa a base da API, injeta o token Bearer e
// normaliza erros. Em dev, VITE_API_URL vazio => usa o proxy /api do Vite.

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const TOKEN_KEY = 'bmais_token'

// Timeout de rede das chamadas. Um timeout NÃO desloga o usuário — ele vira um
// erro de rede (retentável), distinto de um 401 (sessão inválida). Sem um limite
// explícito o fetch fica pendurado no default do navegador (minutos).
const REQUEST_TIMEOUT_MS = 20_000
// Uploads processam vários PDFs em série no backend (parse + escrita no Supabase,
// ~1.3s por arquivo): um lote grande passa fácil dos 20s das leituras. Damos um
// teto bem mais folgado só para o upload, para o navegador não abortar antes de
// o processamento terminar. (Em serverless, confira também o timeout da função.)
const UPLOAD_TIMEOUT_MS = 120_000

// "Manter conectado" define ONDE o token vive:
//  - localStorage  → persiste entre sessões do navegador (fechar e reabrir mantém).
//  - sessionStorage → some ao fechar a aba/navegador (sessão efêmera).
// Ao ler o token buscamos nos dois; ao gravar escolhemos o storage conforme a opção.

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
}

// persist=true (padrão) usa localStorage; persist=false usa sessionStorage.
export function setToken(token: string | null, persist = true) {
  // Sempre limpa ambos para não deixar um token órfão no outro storage.
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  if (token) {
    const store = persist ? localStorage : sessionStorage
    store.setItem(TOKEN_KEY, token)
  }
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Erro de rede/timeout: a requisição não chegou a receber uma resposta HTTP.
// Diferente de ApiError (que carrega um status do servidor, ex.: 401/500).
// Nunca desloga a sessão — a UI trata como falha transitória (retentável).
export class NetworkError extends Error {
  readonly timeout: boolean
  constructor(message: string, timeout = false) {
    super(message)
    this.name = 'NetworkError'
    this.timeout = timeout
  }
}

// fetch com timeout via AbortController. Traduz aborto por timeout e falha de
// rede em NetworkError — assim o chamador nunca confunde timeout com 401.
async function fetchComTimeout(
  url: string, init: RequestInit, timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: ctrl.signal })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new NetworkError('Tempo limite excedido. Verifique sua conexão e tente de novo.', true)
    }
    throw new NetworkError('Falha de conexão com o servidor.')
  } finally {
    clearTimeout(timer)
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
  // Timeout específico (ms). Default REQUEST_TIMEOUT_MS. Use maior em rotas que
  // fazem trabalho pesado no backend (ex.: processar censos: parse + Supabase).
  timeoutMs?: number
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, skipAuthRedirect, timeoutMs } = opts
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  let payload: BodyInit | undefined
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const res = await fetchComTimeout(`${API_BASE}/api${path}`, { method, headers, body: payload }, timeoutMs)

  // Só um 401 real derruba a sessão. Um 503 do middleware significa que o
  // serviço de autenticação não respondeu (timeout/rede) — a sessão pode estar
  // perfeitamente válida, então NÃO deslogamos; tratamos como erro transitório.
  if (res.status === 401 && !skipAuthRedirect) {
    setToken(null)
    onUnauthorized?.()
    throw new ApiError(401, 'Não autenticado')
  }
  if (res.status === 503) {
    throw new NetworkError('Serviço temporariamente indisponível. Tente de novo em instantes.')
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

  const res = await fetchComTimeout(
    `${API_BASE}/api${path}`, { method: 'POST', headers, body: form }, UPLOAD_TIMEOUT_MS,
  )

  if (res.status === 401) {
    setToken(null)
    onUnauthorized?.()
    throw new ApiError(401, 'Não autenticado')
  }
  if (res.status === 503) {
    throw new NetworkError('Serviço temporariamente indisponível. Tente de novo em instantes.')
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
  const res = await fetchComTimeout(`${API_BASE}/api${path}`, { headers })
  if (res.status === 401) {
    setToken(null)
    onUnauthorized?.()
    throw new ApiError(401, 'Não autenticado')
  }
  if (res.status === 503) {
    throw new NetworkError('Serviço temporariamente indisponível. Tente de novo em instantes.')
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
