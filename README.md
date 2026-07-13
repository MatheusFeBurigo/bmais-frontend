# B+ Auditoria — Frontend

SPA (React + Vite + TypeScript) do sistema de controle de auditoria hospitalar.
Consome a **API** (FastAPI, repositório/pasta `bmais-auditoria`).

## Stack

- **React 19 + Vite + TypeScript**
- **React Router** (navegação, rotas em `lazy()` — code-splitting) e **TanStack Query** (data fetching/cache)
- **Chart.js / react-chartjs-2** (gráficos de Diretoria e Gestor)
- **CSS próprio** (design system portado, sem framework de UI)
- **Autenticação JWT**: login em `POST /api/login`, token JWT no `localStorage`, enviado como `Authorization: Bearer` em cada request.

## Rodando localmente

Suba primeiro a API (`bmais-auditoria`) na porta `8765`:

```bash
# na pasta do backend
BMAIS_AUTH=0 python -m uvicorn app:app --port 8765
```

Depois o frontend:

```bash
npm install
npm run dev
```

O Vite serve o SPA (porta 5173) e faz **proxy de `/api`** para `http://127.0.0.1:8765`,
evitando CORS no desenvolvimento. Credenciais padrão: `bmais` / `auditoria2026`.

Para apontar o proxy para outra URL da API em dev:

```bash
VITE_API_PROXY=http://localhost:9000 npm run dev
```

## Build de produção

```bash
npm run build      # gera dist/
npm run preview    # serve o build localmente
```

Em produção o proxy do Vite não existe — o SPA fala com a API por **CORS**, usando a
URL definida em `VITE_API_URL` (lida em **build-time**):

```bash
# .env (ver .env.example)
VITE_API_URL=https://bmais-api.exemplo.com
```

## Deploy no Vercel

O repositório já traz [`vercel.json`](./vercel.json) (framework Vite, `dist/` como
output, rewrite SPA para o React Router e cache imutável dos assets).

### 1. Importar o projeto
No Vercel: **Add New → Project** e selecione este repositório. Se o frontend não
estiver na raiz do repo, defina **Root Directory** como `bmais-frontend`. O framework
(Vite), build (`npm run build`) e output (`dist`) são detectados via `vercel.json`.

### 2. Variável de ambiente (Project → Settings → Environment Variables)
| Variável | Valor | Ambiente |
|---|---|---|
| `VITE_API_URL` | URL pública do backend, ex. `https://bmais-api.up.railway.app` (sem barra final) | Production (e Preview, se houver API de staging) |

> `VITE_API_URL` é lida em build-time. Após alterá-la, **refaça o deploy**.

### 3. Configurar o backend para aceitar o Vercel
No backend (`bmais-auditoria`), defina as variáveis de ambiente:

| Variável | Valor |
|---|---|
| `BMAIS_AUTH` | `0` — desliga o Basic Auth global (senão bloqueia `/api/login`; a proteção passa a ser o JWT) |
| `BMAIS_CORS_ORIGINS` | a URL do frontend no Vercel, ex. `https://bmais.vercel.app` (várias separadas por vírgula) |
| `BMAIS_JWT_SECRET` | um segredo forte (`openssl rand -hex 32`) — **obrigatório trocar em produção** |

Sem `BMAIS_CORS_ORIGINS` o navegador bloqueia as chamadas do Vercel para a API.

### 4. Deploy
Cada push na branch de produção dispara um deploy. Rotas como `/diretoria` funcionam
com refresh direto graças ao rewrite SPA do `vercel.json`.

## Estrutura

```
src/
├── api/client.ts           # fetch central: base URL, token Bearer, 401, upload/download
├── auth/AuthContext.tsx     # estado de autenticação (login/logout, validação de token)
├── components/              # Sidebar, Layout, ui (KpiCard/Badge/Modal…), charts, PacienteDrawer, Toast
├── pages/                   # Login, Dashboard, Diretoria, Gestor, Equipe, Configuracoes, Upload
├── styles/design-system.css # design system portado do backend Jinja2
└── types/api.ts             # tipos espelhando o JSON da API
```

## Status da migração

✅ Todas as telas migradas para React: **Login, Operacional (Dashboard), Paciente
(drawer), Upload, Diretoria, Gestor, Equipe, Configurações**.

Ver [`MIGRACAO_TELAS.md`](./MIGRACAO_TELAS.md) para o histórico e notas técnicas.
