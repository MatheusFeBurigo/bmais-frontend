// Cliente HTTP central. Prefixa a base da API, injeta o token Bearer e
// normaliza erros. Em dev, VITE_API_URL vazio => usa o proxy /api do Vite.

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const TOKEN_KEY = 'bmais_token'
// Metadados da sessão (refresh_token + prazos), gravados no MESMO storage do token.
const SESSAO_KEY = 'bmais_sessao'

// Duração máxima da sessão: 1 dia após o login o usuário é deslogado e precisa
// entrar de novo — em todos os modos de autenticação. Nos modos HMAC o backend
// também expira o token em 24h (BMAIS_TOKEN_TTL); no modo Supabase o JWT dura
// ~1h e é renovado via refresh_token (POST /api/sessao/renovar) até este teto.
// VITE_SESSAO_MAX_HORAS (build-time) sobrescreve; padrão 24.
const SESSAO_MAX_MS = (Number(import.meta.env.VITE_SESSAO_MAX_HORAS) || 24) * 60 * 60 * 1000
// Renova o token de acesso quando faltar menos que isto para ele vencer.
const RENOVACAO_MARGEM_MS = 60_000

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

// True se o token vive em localStorage (sessão persistente, remember=true); false
// se em sessionStorage ou ausente. Usado para o perfil espelhado acompanhar o
// mesmo storage do token sem precisar repassar `remember` no boot.
export function tokenPersistente(): boolean {
  return !!localStorage.getItem(TOKEN_KEY)
}

// Sessão como o backend devolve no login e na renovação. `expires_in` (s) é a
// validade do token de acesso; `refresh_token` só existe no modo Supabase.
export interface SessaoRecebida {
  token: string
  refresh_token?: string | null
  expires_in?: number | null
}

interface SessaoMeta {
  refresh_token: string | null
  // Epoch ms em que o token de acesso vence; null = desconhecido (não renova
  // proativamente — só reage a um 401).
  token_expira_em: number | null
  // Epoch ms do teto absoluto da sessão (login + SESSAO_MAX_MS). Não é
  // estendido pela renovação: atingido, o usuário é deslogado.
  sessao_expira_em: number
}

function getSessaoMeta(): SessaoMeta | null {
  const raw = localStorage.getItem(SESSAO_KEY) || sessionStorage.getItem(SESSAO_KEY)
  if (!raw) return null
  try {
    const m = JSON.parse(raw) as Partial<SessaoMeta>
    return {
      refresh_token: m.refresh_token ?? null,
      token_expira_em: typeof m.token_expira_em === 'number' ? m.token_expira_em : null,
      sessao_expira_em: Number(m.sessao_expira_em) || 0,
    }
  } catch {
    return null
  }
}

function limparStorageSessao() {
  // Sempre limpa ambos para não deixar um token órfão no outro storage.
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(SESSAO_KEY)
  sessionStorage.removeItem(SESSAO_KEY)
}

// persist=true usa localStorage; persist=false usa sessionStorage.
function gravarSessao(token: string, meta: SessaoMeta, persist: boolean) {
  limparStorageSessao()
  const store = persist ? localStorage : sessionStorage
  store.setItem(TOKEN_KEY, token)
  store.setItem(SESSAO_KEY, JSON.stringify(meta))
}

// Login: grava o token e começa a contar o teto da sessão (1 dia).
export function iniciarSessao(s: SessaoRecebida, persist = true) {
  const agora = Date.now()
  gravarSessao(s.token, {
    refresh_token: s.refresh_token ?? null,
    token_expira_em: s.expires_in ? agora + s.expires_in * 1000 : null,
    sessao_expira_em: agora + SESSAO_MAX_MS,
  }, persist)
}

// Renovação: troca token/refresh_token mas MANTÉM o teto da sessão e o storage.
function atualizarSessao(s: SessaoRecebida) {
  const meta = getSessaoMeta()
  const persist = tokenPersistente()
  gravarSessao(s.token, {
    refresh_token: s.refresh_token ?? meta?.refresh_token ?? null,
    token_expira_em: s.expires_in ? Date.now() + s.expires_in * 1000 : null,
    sessao_expira_em: meta?.sessao_expira_em || Date.now() + SESSAO_MAX_MS,
  }, persist)
}

// Logout / sessão inválida: some com token, metadados e perfil espelhado
// (sem token não pode sobrar perfil — hidrataria uma sessão morta no boot).
export function encerrarSessao() {
  limparStorageSessao()
  setPerfil(null)
}

// Perfil (papel + username) espelhado no storage junto do token. Serve para o
// boot HIDRATAR o AuthContext de forma síncrona — a Sidebar/guards já sabem o
// papel na primeira pintura, sem esperar o /me (que revalida em background).
// Sem isto, role=null no boot esconde os itens gated e eles "surgem" depois.
const PERFIL_KEY = 'bmais_perfil'

export interface PerfilSalvo {
  username: string | null
  role: string | null
}

export function getPerfil(): PerfilSalvo | null {
  const raw = localStorage.getItem(PERFIL_KEY) || sessionStorage.getItem(PERFIL_KEY)
  if (!raw) return null
  try {
    const p = JSON.parse(raw) as PerfilSalvo
    return { username: p.username ?? null, role: p.role ?? null }
  } catch {
    return null
  }
}

export function setPerfil(perfil: PerfilSalvo | null, persist = true) {
  localStorage.removeItem(PERFIL_KEY)
  sessionStorage.removeItem(PERFIL_KEY)
  if (perfil) {
    const store = persist ? localStorage : sessionStorage
    store.setItem(PERFIL_KEY, JSON.stringify(perfil))
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

const MSG_INDISPONIVEL = 'Serviço temporariamente indisponível. Tente de novo em instantes.'

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

// ── Renovação da sessão ──────────────────────────────────────────────────────

let renovacaoEmCurso: Promise<string | null> | null = null

// Troca o refresh_token por um novo token de acesso. Deduplica chamadas
// concorrentes (várias queries disparam juntas ao abrir uma tela) — o
// refresh_token do Supabase é de uso único, então só UMA renovação por vez.
// Resolve com o novo token, ou null se o servidor recusou (sessão encerrada de
// verdade). Falha de rede/5xx lança NetworkError: a sessão pode estar boa e o
// chamador NÃO deve deslogar — trata como transitório.
function renovarToken(): Promise<string | null> {
  if (renovacaoEmCurso) return renovacaoEmCurso
  renovacaoEmCurso = (async () => {
    const meta = getSessaoMeta()
    if (!meta?.refresh_token) return null
    const res = await fetchComTimeout(`${API_BASE}/api/sessao/renovar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: meta.refresh_token }),
    })
    if (res.status >= 500) throw new NetworkError(MSG_INDISPONIVEL)
    if (!res.ok) return null
    const data = (await res.json()) as Partial<SessaoRecebida>
    if (!data?.token) return null
    atualizarSessao(data as SessaoRecebida)
    return data.token
  })().finally(() => {
    renovacaoEmCurso = null
  })
  return renovacaoEmCurso
}

// Devolve o token a enviar, renovando-o antes se estiver vencendo. Aplica o teto
// da sessão: vencido, encerra a sessão e sinaliza 401 sem ir ao servidor.
// `recusado` = o servidor já recusou renovar (refresh_token morto): a chamada
// segue com o token atual, mas um 401 dela não deve tentar renovar de novo.
async function garantirToken(
  skipAuthRedirect?: boolean,
): Promise<{ token: string | null; recusado: boolean }> {
  const token = getToken()
  if (!token) return { token: null, recusado: false }
  const meta = getSessaoMeta()
  // Sessão gravada antes deste mecanismo: sem teto nem renovação (vale até o 401).
  if (!meta) return { token, recusado: false }
  if (Date.now() >= meta.sessao_expira_em) {
    encerrarSessao()
    if (!skipAuthRedirect) onUnauthorized?.()
    throw new ApiError(401, 'Sessão expirada. Entre novamente.')
  }
  const vencendo = meta.token_expira_em !== null
    && Date.now() >= meta.token_expira_em - RENOVACAO_MARGEM_MS
  if (meta.refresh_token && vencendo) {
    // Servidor recusou a renovação (null): segue com o token atual — se estiver
    // mesmo vencido, o 401 da chamada encerra a sessão pelo caminho normal.
    const novo = await renovarToken()
    return { token: novo ?? token, recusado: novo === null }
  }
  return { token, recusado: false }
}

// fetch autenticado: injeta o Bearer (renovado antes, se preciso) e, num 401,
// tenta UMA renovação e repete a chamada — cobre o token vencido/revogado no
// servidor antes do prazo local. Se a renovação não salvar, encerra a sessão
// (salvo skipAuthRedirect: aí só devolve o 401 para o chamador decidir).
async function fetchAutenticado(
  url: string, init: RequestInit, timeoutMs?: number, skipAuthRedirect?: boolean,
): Promise<Response> {
  const { token, recusado } = await garantirToken(skipAuthRedirect)
  const comToken = (t: string | null): RequestInit => ({
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    },
  })

  let res = await fetchComTimeout(url, comToken(token), timeoutMs)

  if (res.status === 401 && token && !recusado && getSessaoMeta()?.refresh_token) {
    // Outra chamada pode já ter renovado (token rotacionado): reaproveita.
    const atual = getToken()
    const novo = atual && atual !== token ? atual : await renovarToken()
    if (novo) res = await fetchComTimeout(url, comToken(novo), timeoutMs)
  }

  // Só um 401 real derruba a sessão. Um 503 do middleware significa que o
  // serviço de autenticação não respondeu (timeout/rede) — a sessão pode estar
  // perfeitamente válida, então NÃO deslogamos; tratamos como erro transitório.
  if (res.status === 401 && !skipAuthRedirect) {
    encerrarSessao()
    onUnauthorized?.()
    throw new ApiError(401, 'Não autenticado')
  }
  if (res.status === 503) {
    throw new NetworkError(MSG_INDISPONIVEL)
  }
  return res
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

  let payload: BodyInit | undefined
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const res = await fetchAutenticado(
    `${API_BASE}/api${path}`, { method, headers, body: payload }, timeoutMs, skipAuthRedirect,
  )

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
  const res = await fetchAutenticado(
    `${API_BASE}/api${path}`, { method: 'POST', body: form }, UPLOAD_TIMEOUT_MS,
  )

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
  const res = await fetchAutenticado(`${API_BASE}/api${path}`, {})
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
