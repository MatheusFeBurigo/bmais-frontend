# B+ Auditoria — Frontend

SPA (React + Vite + TypeScript) do sistema de controle de auditoria hospitalar. Consome a **API** (FastAPI), que vive em um repositório separado (`bmais-auditoria-api`).

## Stack

- **React 19 + Vite + TypeScript**
- **React Router** (navegação) e **TanStack Query** (data fetching/cache)
- **CSS próprio** (design system portado, sem framework de UI)
- **Autenticação por token**: login em `POST /api/login`, token guardado no `localStorage`, enviado como `Authorization: Bearer` em cada request.

## Rodando localmente

Suba primeiro a API (repositório `bmais-auditoria-api`) na porta `8765`. Depois:

```bash
npm install
npm run dev
```

O Vite serve o SPA (porta 5173 por padrão) e faz proxy de `/api` para `http://127.0.0.1:8765`, evitando CORS no desenvolvimento. Credenciais padrão da API: `bmais` / `auditoria2026`.

Para apontar o proxy para outra URL da API em dev:

```bash
VITE_API_PROXY=http://localhost:9000 npm run dev
```

## Build de produção

```bash
npm run build      # gera dist/
npm run preview    # serve o build localmente
```

Em produção, o frontend fala com a API por CORS. Configure a URL da API via variável de ambiente de build:

```bash
# .env (ver .env.example)
VITE_API_URL=https://bmais-api.exemplo.com
```

E no backend, inclua a origem do frontend em `BMAIS_CORS_ORIGINS`.

## Estrutura

```
src/
├── api/client.ts          # fetch central: base URL, token, 401, download autenticado
├── auth/AuthContext.tsx    # estado de autenticação (login/logout, validação de token)
├── components/             # Sidebar, Layout, tabela/badges, PacienteDrawer, Toast
├── hooks/                  # (data fetching futuro)
├── pages/                  # Login, Dashboard (migrado), EmBreve (telas pendentes)
├── styles/design-system.css # design system portado do backend Jinja2
└── types/api.ts            # tipos espelhando o JSON da API
```

## Status da migração

- ✅ **Login** e **Dashboard** (painel operacional) migrados e funcionais.
- 🚧 Diretoria, Gestor, Configurações, Equipe e Upload: pendentes (placeholder "em migração").
