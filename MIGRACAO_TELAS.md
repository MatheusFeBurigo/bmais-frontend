# Plano de Migração de Telas — Jinja → React

> Origem: `bmais-auditoria/templates/*.html` (FastAPI + Jinja2)
> Destino: `bmais-frontend/src/pages/*.tsx` (React 19 + Vite + TanStack Query)

## Contexto

O `bmais-frontend` já migrou o esqueleto e 2 telas de conteúdo. As 5 telas restantes
hoje são placeholders `EmBreve`. Padrão de migração estabelecido:

- 1 template Jinja → 1 página React que consome a API via `apiFetch`.
- Reusa `Layout` + `Sidebar` + `design-system.css` (tokens `--*` já portados).
- Estado de filtro via query params (`useSearchParams`), dados via `useQuery`.

### ⚠️ Dependência crítica de backend

As rotas atuais de diretoria/gestor/equipe/configurações renderizam **HTML**, montando
os dados no contexto do template — **não há endpoint JSON** para elas. Cada tarefa de
front depende de **expor um endpoint JSON equivalente** no `app.py`. As tarefas de
backend (B*) são pré-requisito das de frontend (F*).

---

## Status atual

| Tela            | Template                  | Rota React        | Estado        |
|-----------------|---------------------------|-------------------|---------------|
| Login           | index.html                | `/` (Login.tsx)   | ✅ Migrada    |
| Operacional     | dashboard.html            | `/` (Dashboard)   | ✅ Migrada    |
| Paciente        | paciente.html             | Drawer            | ✅ Migrada    |
| Diretoria/KPIs  | diretoria.html (463)      | `/diretoria`      | ✅ Migrada    |
| Gestor/Fluxo    | gestor.html (445)         | `/gestor`         | ✅ Migrada    |
| Equipe          | equipe.html (607)         | `/equipe`         | ✅ Migrada    |
| Configurações   | configuracoes.html (789)  | `/configuracoes`  | ✅ Migrada    |
| Upload Censos   | upload.html (290)         | `/upload`         | ✅ Migrada    |

---

## Fase 0 — Fundação compartilhada (pré-requisito de todas)

- **T0.1 — Componentes compartilhados.** Extrair de Dashboard/base os blocos que
  todas as telas reusam: `KpiCard`, `Badge`, `OpAvatar`, `ProgressBar`, `Modal`,
  `Tabs`, `StatMini`. Hoje só existem `StatusBadge`, `LeitoTag`, `Toast`.
- **T0.2 — Biblioteca de gráficos.** ✅ **Decidido: `react-chartjs-2` + `chart.js`**
  (migração ~1:1 dos charts atuais). Instalar e criar wrappers (`DonutChart`,
  `LineChart`, `BarChart`).
- **T0.3 — Tipos de API.** Ampliar `src/types/api.ts` com os payloads novos
  (`DiretoriaPayload`, `GestorMetrics`, `Profissional`, `Escala`, `OperadoraConfig`,
  resultados de upload).

## Fase 1 — Upload Censos ✅ CONCLUÍDA

- **T1.1 (F)** ✅ — Página `Upload.tsx`: 2 tabs (Censos / Relatórios), drop-zone com
  drag&drop, `FormData` multipart (novo helper `apiUpload` em `client.ts`), render
  de resultados (2 formatos). Endpoints já existiam. Sem dependência de backend.
  Auth via token (substituiu o `fetch` sem auth do template).

## Fase 2 — Diretoria / KPIs ✅ CONCLUÍDA

- **T2.1 (B)** ✅ — Exposto `GET /api/diretoria` em JSON. Refatorado `app.py`:
  extraída `_build_kpis_diretoria()`, reusada pela rota HTML e pelo novo endpoint.
- **T2.2 (F)** ✅ — Página `Diretoria.tsx`: 4 KPI cards, tabela resumo por operadora
  com SLA bars, 4 gráficos via `react-chartjs-2` (wrappers em `components/charts.tsx`:
  `DonutChart`, `LineChart`, `BarChart`), card de intel. Ações: Atualizar, Seed Demo
  (`POST /api/seed-demo`), Exportar (`apiDownload /api/export-rvm`).
- ⚠️ **Dívida técnica:** o bundle passou de 500 kB (Chart.js). Considerar
  code-splitting (`import()` dinâmico dos gráficos) antes de encerrar a migração.

## Fase 3 — Gestor / Fluxo ✅ CONCLUÍDA

- **T3.1 (B)** ✅ — Expostos `GET /api/gestor` (metrics) e `GET /api/gestor/filtros`.
- **T3.2 (F)** ✅ — Página `Gestor.tsx`: filtros via query params (substituem o
  `location.href` do template); 5 KPI clicáveis; 3 cards de médias; **5 gráficos
  interativos** com `onClick` do Chart.js (fluxo 30d muda o dia; donut de faixas e
  KPIs filtram a tabela client-side; barras de operadora/hospital/região aplicam
  filtro por query param); tabela "pacientes do dia" com pills. A navegação por
  linha abre o `PacienteDrawer` (equivalente React ao `/paciente/{id}` do template).
- Gráficos especializados (eixos duplos, onClick) usam `react-chartjs-2` direto
  (re-exportado por `charts.tsx` p/ garantir o register); os wrappers genéricos
  ficam para os casos simples.
- Complexidade: **ALTA** — concluída.

## Fase 4 — Equipe ✅ CONCLUÍDA

- **T4.1 (B)** ✅ — Exposto `GET /api/equipe` (listagem inicial: listas por tipo +
  contagens + operadoras). Demais endpoints REST já existiam.
- **T4.2 (F)** ✅ — Página `Equipe.tsx`: master-detail, tabs por tipo, toggle
  inativos, painel de detalhe com edição inline (nome/tipo), ativar/desativar,
  gestão de escala (selects encadeados operadora→hospital→serviço via
  `GET /api/hospitais?op=`), modal "Adicionar" (reusa `Modal`), mutations com
  `invalidateQueries` (substituem os `location.reload()` do template).
- ✅ **Segurança:** o Basic Auth hardcoded (`bmais:auditoria2026`) do template foi
  substituído pelo token do `AuthContext` via `apiFetch` em todas as chamadas.
- Complexidade: **ALTA** — concluída.

## Fase 5 — Configurações ✅ CONCLUÍDA

- **T5.1 (B)** ✅ — Refatorado `app.py`: extraída `_build_configuracoes(op, hospital)`
  (que já montava grid + op_selected + hospital_selected, incluindo as agregações
  antes feitas no template) e exposto `GET /api/configuracoes` que a retorna em JSON.
  A rota HTML passou a consumir a mesma função. Escrita já existia.
- **T5.2 (F)** ✅ — Página `Configuracoes.tsx` com 3 vistas por query param
  (`op`/`hospital`): grid geral (roll-up + op-cards + modal nova operadora + demo/limpar)
  · config de regras (form controlado com dirty-tracking + `beforeunload` + toggle ativo
  + chips de responsáveis + save) · detalhe de hospital (stat-mini + pacientes + escala).
- Complexidade: **ALTA** — concluída.

---

## 🏁 Migração completa

Todas as 8 telas migradas. `EmBreve.tsx` removido (não há mais placeholders).
Rotas em `App.tsx` apontam 100% para páginas React.

### Dívida técnica remanescente (não bloqueante)
- **Bundle > 500 kB** (Chart.js). Fazer code-splitting: `lazy()` + `import()` nas
  páginas com gráfico (Diretoria, Gestor) para tirar o Chart.js do chunk inicial.

---

## ✅ Verificação end-to-end (backend + frontend)

Subido o backend FastAPI (`uvicorn app:app`, porta 8765) + o dev server do Vite
(proxy `/api` → backend) e exercitados os fluxos via HTTP com `seed-demo`.

### Correções necessárias descobertas na verificação (já aplicadas em `app.py`)
O frontend foi escrito esperando endpoints JSON que o backend Jinja **nunca expôs** —
sem eles, nem as telas migradas antes desta sessão (Dashboard/Login) funcionavam:

1. **Caminhos absolutos macOS quebravam o boot no Windows** — `RELATORIOS_LOTE_DIR.mkdir()`
   com `/Users/artursaraiva/...` no import. Agora configurável por env
   (`BMAIS_CENSOS_DIR` / `BMAIS_RELATORIOS_DIR`), fallback para pastas locais do projeto.
2. **Endpoints ausentes adicionados:** `POST /api/login`, `GET /api/me` (auth por token
   Bearer em memória — dev/verificação, não produção), `GET /api/sidebar`, `GET /api/dashboard`.

### Resultado dos testes (com seed: 60 pacientes, 8 operadoras, 10 hospitais)
| Fluxo | Resultado |
|---|---|
| Login → /me → sidebar | ✅ token emitido e validado |
| Dashboard (`/api/dashboard`) | ✅ stats + 20 internações + hospitais |
| Diretoria (`/api/diretoria`) | ✅ SLA, 8 operadoras, trend 8sem, top 8 hospitais |
| Gestor (`/api/gestor` + filtros) | ✅ série 30d, 60 pacientes/dia, breakdowns |
| Equipe (CRUD completo) | ✅ criar → detalhe → +escala → listar → remover |
| Configurações (3 vistas) | ✅ grid / edit / hospital + salvar regras |
| Proxy Vite `/api` → backend | ✅ HTTP 200 com dados reais |

### Como rodar localmente (Windows)
```powershell
# backend (porta 8765; BMAIS_AUTH=0 desliga o Basic Auth global p/ dev)
$env:BMAIS_AUTH="0"; python -m uvicorn app:app --port 8765 --app-dir <path>/bmais-auditoria
# frontend (proxy /api já aponta p/ 8765)
npm run dev --prefix <path>/bmais-frontend    # http://localhost:5173
```

### Dívida técnica — ✅ RESOLVIDA

**1. Code-splitting (Chart.js).** ✅ Rotas em `App.tsx` agora usam `React.lazy()` +
`<Suspense>`. Cada página é um chunk separado e o Chart.js saiu do bundle inicial:
- Bundle inicial: **571 kB → 265 kB** (gzip 176 → 84 kB); aviso de >500 kB eliminado.
- `charts` (Chart.js, 191 kB) é chunk próprio, só carrega ao abrir Diretoria/Gestor.

**2. Auth de produção (JWT).** ✅ Substituído o token em memória por **JWT HS256
assinado** (stdlib, sem PyJWT) + **usuários no banco**:
- `db.py`: tabela `usuarios`, senha com **PBKDF2-SHA256** (200k iterações, salt por
  usuário); `autenticar_usuario`, `criar_usuario`; admin inicial seedado das env.
- `app.py`: `_jwt_encode/_jwt_decode` (HMAC-SHA256), `POST /api/login` valida contra o
  banco e emite JWT com `exp`; `GET /api/me` valida assinatura + expiração.
- Segredo via `BMAIS_JWT_SECRET` (ver `bmais-auditoria/.env.example`).
- Testado: senha errada / token adulterado / sem token / **token forjado com outro
  segredo** → todos 401. Senha nunca em claro no banco. Stateless (sobrevive a restart).

> ⚠️ Deploy: **trocar `BMAIS_JWT_SECRET`** (o default é público/inseguro).

---

## Ordem recomendada

```
Fase 0 (T0.1–T0.3)  →  Fase 1 (Upload)  →  Fase 2 (Diretoria)
        →  Fase 3 (Gestor)  →  Fase 4 (Equipe)  →  Fase 5 (Configurações)
```

Racional: fundação primeiro; depois a tela mais simples e sem backend (Upload) para
validar o pipeline; depois as read-only (Diretoria) antes das interativas/CRUD
(Gestor, Equipe, Configurações), que são as de maior risco.

## Riscos / pontos de atenção

- **Backend acopla dados à view.** O maior esforço oculto é extrair as agregações
  que hoje vivem nos templates (`|sum`, `selectattr`, dedupe de hospitais) para
  endpoints JSON. Sem isso, o front não tem como consumir.
- **Chart.js → React.** Decidir a lib de gráficos cedo (T0.2) — afeta Diretoria e Gestor.
- **Basic Auth hardcoded** em equipe/configuracoes deve ser substituído pelo token.
- **Caminhos absolutos no backend** (`/Users/artursaraiva/...` em `app.py`) quebram no
  Windows/produção — relevante para Upload (refresh de pasta local).
