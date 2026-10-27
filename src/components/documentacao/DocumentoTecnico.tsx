// O corpo da "Documentação técnica": o documento em si, sem o cabeçalho da
// página (que é da tela, em pages/DocumentacaoTecnica.tsx).
//
// Irmão do Relatório da auditoria (components/relatorio): mesma folha
// (relatorio.css, `.rel-doc`), mesma barra de seções e mesma capa, para as duas
// leituras de apoio da Progresso parecerem uma só coisa. A diferença é a
// origem. O relatório é peça fechada e entra como HTML pronto; este documento é
// escrito aqui, em JSX, e a referência de APIs sai do catálogo tipado
// (./endpoints), que é o que se atualiza quando uma rota muda.
//
// O texto descreve o sistema como o código estava em LEVANTADO_EM. Ele
// envelhece: a fonte da verdade continua sendo o backend.
import { useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import { ROLE_LABEL } from '../../lib/usuarioRoles'
import type { UserRole } from '../../types/api'
import { ACESSOS, GRUPOS_API, type Acesso, type Endpoint, type RegraAcesso } from './endpoints'
import '../relatorio/relatorio.css'
import './documentacao.css'

const LEVANTADO_EM = '27 de outubro de 2026'

const SECOES: [id: string, titulo: string][] = [
  ['visao', 'Visão geral'],
  ['autenticacao', 'Autenticação'],
  ['autorizacao', 'Autorização'],
  ['convencoes', 'Convenções'],
  ['fluxos', 'Fluxos'],
  ['endpoints', 'Referência das APIs'],
  ['infra', 'Infraestrutura'],
  ['atencao', 'Pontos de atenção'],
]

const PAPEIS = Object.keys(ROLE_LABEL) as UserRole[]

const TOTAL_ROTAS = GRUPOS_API.reduce((n, g) => n + g.endpoints.length, 0)
const TOTAL_LEGADO = GRUPOS_API.find((g) => g.id === 'api-legado')?.endpoints.length ?? 0

// Quantas rotas cada guard protege, para a tabela de guards dizer o peso de
// cada regra: mexer num guard de 40 rotas não é o mesmo que num de duas.
const ROTAS_POR_ACESSO = GRUPOS_API.flatMap((g) => g.endpoints).reduce((acc, e) => {
  acc.set(e.acesso, (acc.get(e.acesso) ?? 0) + 1)
  return acc
}, new Map<Acesso, number>())

/** Minúsculas e sem acento: "Relatório" casa com "relatorio". */
function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** True se o papel passa pelo guard da rota. Pública e "qualquer sessão" valem
 *  para todos; o cron não é de papel nenhum. */
function alcanca(papel: UserRole, acesso: Acesso): boolean {
  if (acesso === 'cron') return false
  const regra: RegraAcesso = ACESSOS[acesso]
  return regra.papeis.length === 0 || regra.papeis.includes(papel)
}

function Papeis({ papeis }: { papeis: readonly UserRole[] }) {
  return (
    <span className="papeis">
      {papeis.map((p) => <span className="papel" key={p}>{ROLE_LABEL[p]}</span>)}
    </span>
  )
}

function LinhaEndpoint({ e }: { e: Endpoint }) {
  const regra: RegraAcesso = ACESSOS[e.acesso]
  return (
    <tr>
      <td className="c-mt"><span className={`mt ${e.metodo}`}>{e.metodo}</span></td>
      <td className="c-rota">
        <span className="rota">{e.rota}</span>
        {e.query && <span className="det"><b>query</b> {e.query}</span>}
      </td>
      <td className="c-desc">
        {e.descricao}
        {e.corpo && <span className="det"><b>corpo</b> {e.corpo}</span>}
      </td>
      <td className="c-acesso">
        <span className="acesso" title={regra.papeis.map((p) => ROLE_LABEL[p]).join(', ') || regra.nota}>
          {regra.rotulo}
          <small>{regra.guard}</small>
        </span>
      </td>
    </tr>
  )
}

function ReferenciaApis() {
  const [busca, setBusca] = useState('')
  const [papel, setPapel] = useState<UserRole | ''>('')

  const grupos = useMemo(() => {
    const termo = normalizar(busca.trim())
    return GRUPOS_API.map((g) => ({
      ...g,
      endpoints: g.endpoints.filter((e) => {
        if (papel && !alcanca(papel, e.acesso)) return false
        if (!termo) return true
        const alvo = normalizar(
          `${e.metodo} ${e.rota} ${e.descricao} ${e.corpo ?? ''} ${e.query ?? ''} ${ACESSOS[e.acesso].guard} ${g.titulo}`,
        )
        return alvo.includes(termo)
      }),
    })).filter((g) => g.endpoints.length > 0)
  }, [busca, papel])

  const mostradas = grupos.reduce((n, g) => n + g.endpoints.length, 0)

  return (
    <>
      <div className="filtro">
        <label className="f-busca">
          <span className="form-lbl">Buscar rota</span>
          <input className="bm-input" type="search" value={busca} placeholder="caminho, assunto, guard…"
            onChange={(ev) => setBusca(ev.target.value)} />
        </label>
        <label className="f-papel">
          <span className="form-lbl">O que este papel alcança</span>
          <select className="bm-input bm-select" value={papel}
            onChange={(ev) => setPapel(ev.target.value as UserRole | '')}>
            <option value="">Todos os papéis</option>
            {PAPEIS.map((p) => <option key={p} value={p}>{ROLE_LABEL[p]}</option>)}
          </select>
        </label>
        <span className="f-total" aria-live="polite">{mostradas} de {TOTAL_ROTAS} rotas</span>
      </div>

      {grupos.length === 0 && <p className="vazio">Nenhuma rota corresponde ao filtro.</p>}

      {grupos.map((g) => (
        <section className="grupo" id={g.id} key={g.id}>
          <div className="grupo-cab">
            <h3>{g.titulo}</h3>
            <span className="arq">routes/{g.arquivo}</span>
          </div>
          <p className="cap">{g.resumo}</p>
          <div className="tw">
            <table className="ep">
              <thead>
                <tr><th className="c-mt">Método</th><th className="c-rota">Rota</th><th>O que faz</th><th className="c-acesso">Acesso</th></tr>
              </thead>
              <tbody>
                {g.endpoints.map((e) => <LinhaEndpoint e={e} key={`${e.metodo} ${e.rota}`} />)}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  )
}

/** Cabeçalho de seção no padrão do relatório: sobrelinha, título e abertura. */
function Cabecalho({ kick, titulo, children }: { kick: string; titulo: string; children?: ReactNode }) {
  return (
    <div className="sec-h">
      <div className="kick">{kick}</div>
      <h2>{titulo}</h2>
      {children && <p className="lede">{children}</p>}
    </div>
  )
}

function Sub({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="sec-h sub">
      <h3>{titulo}</h3>
      {children && <p className="lede">{children}</p>}
    </div>
  )
}

interface Achado {
  nivel: 'alta' | 'media' | 'baixa'
  titulo: string
  texto: ReactNode
  onde: string
}

// Em ordem de prioridade. Cada um foi conferido no código em LEVANTADO_EM.
const ACHADOS: Achado[] = [
  {
    nivel: 'alta',
    titulo: 'O envio de censo depende do mesmo disco entre duas requisições',
    texto: <><code>/api/upload/stage</code> grava os arquivos em <code>&lt;tmp&gt;/bmais/uploads</code> e <code>/api/upload/processar</code> os lê de lá numa requisição seguinte. Na Vercel, cada requisição pode cair numa instância diferente, e o <code>/tmp</code> não é compartilhado nem durável: a segunda fase responde 404, "Sessão não encontrada (arquivos expiraram?)". A própria rota registra o risco em comentário. Caminho: gravar o staging no Supabase Storage, que já guarda os anexos de relatório.</>,
    onde: 'bmais-backend · interface/routes/censos.py (upload_stage, upload_processar)',
  },
  {
    nivel: 'media',
    titulo: 'A mensagem de erro das rotas de censo não chega ao usuário',
    texto: <>As rotas de envio respondem <code>{'{"erro": "…"}'}</code>, e o cliente do SPA só lê <code>detail</code>. Com isso a tela mostra "Erro 404" em vez do motivo; somado ao ponto anterior, quem envia censo não fica sabendo que precisa reenviar. Unificar em <code>HTTPException(detail=…)</code> ou fazer o <code>apiFetch</code> ler também <code>erro</code>.</>,
    onde: 'interface/routes/censos.py · bmais-frontend/src/api/client.ts',
  },
  {
    nivel: 'media',
    titulo: '/api/_dbcheck responde sem sessão',
    texto: <>Marcada como temporária, devolve a URL completa do projeto Supabase, qual credencial está em uso (service ou anon) e o texto cru da exceção de conexão para qualquer pessoa na internet. Remover, ou pôr sob <code>requer_admin</code> e tirar de <code>PUBLIC_PATHS</code>.</>,
    onde: 'interface/routes/api_dados.py · infrastructure/config.py · db/connection.py (diagnostico)',
  },
  {
    nivel: 'media',
    titulo: 'Confirmar a chave de criptografia em produção',
    texto: <>Sem <code>BMAIS_CRYPTO_KEY</code> o backend grava nome, senha e médico do paciente em claro, sem erro. É deliberado (a falta da env não derruba o sistema), e por isso mesmo o código não diz se produção está cifrando. Vale conferir a env na Vercel e manter cópia da chave em cofre: perdida depois de cifrar, o dado fica ilegível.</>,
    onde: 'infrastructure/cripto.py · Environment Variables da Vercel',
  },
  {
    nivel: 'media',
    titulo: 'A suíte de testes não aponta regressão',
    texto: <>Em {LEVANTADO_EM}: 1.827 testes passam, 714 falham e 92 são ignorados. As falhas são de ambiente, de repositórios falsos que não acompanharam o código (por exemplo, sem <code>listar_operadoras</code>), não de comportamento quebrado. Enquanto o número for esse, uma falha nova se perde entre as antigas.</>,
    onde: 'bmais-backend/tests',
  },
  {
    nivel: 'media',
    titulo: 'A matriz de acessos não roda no FastAPI atual',
    texto: <><code>scripts/matriz_acessos.py</code> lê <code>app.routes</code>, que no FastAPI 0.143 traz os routers como <code>_IncludedRouter</code>: a matriz só enxerga <code>/docs</code> e <code>/redoc</code> (54 falhas em <code>test_matriz_acessos</code>). O mapa <code>GUARDS</code> também não conhece <code>requer_criar_pendencia</code>, então as rotas de pendências apareceriam como "SEM GUARD", embora estejam protegidas. A referência desta página foi levantada lendo cada router direto.</>,
    onde: 'bmais-backend/scripts/matriz_acessos.py',
  },
  {
    nivel: 'media',
    titulo: '/api/reset deixa registros órfãos',
    texto: <>Apaga eventos, relatórios, internações e censos, mas não <code>pendencias_validacao</code> nem <code>cobrancas_censo</code>, que não têm chave estrangeira para internações. O <code>limpar-dados</code> ao lado já trata isso. E <code>/api/refresh?reset=true</code> zera a base mesmo quando a pasta de censos não existe e a rota responde 400.</>,
    onde: 'interface/routes/admin.py · interface/routes/censos.py · db/repositories.py (reset)',
  },
  {
    nivel: 'baixa',
    titulo: 'Cache e métricas valem por instância',
    texto: <>O cache de 30 s e o do perfil vivem na memória de cada processo. Em serverless, a escrita limpa só a instância que a atendeu: as outras podem servir dado anterior por até 30 s, inclusive o papel de uma conta que acabou de ser suspensa ou rebaixada. <code>/api/_metricas</code> mostra apenas a instância que respondeu.</>,
    onde: 'application/cache.py · application/metricas.py · interface/authz.py',
  },
  {
    nivel: 'baixa',
    titulo: 'Operadora padrão implícita',
    texto: <><code>/api/stats</code>, <code>/api/internacoes</code>, <code>/api/export-rvm</code>, <code>/api/upload</code> e <code>/api/refresh</code> assumem <code>operadora=sulamerica</code> quando o parâmetro falta. Um cliente que o esqueça recebe dados de uma operadora específica, sem aviso.</>,
    onde: 'interface/routes/api_dados.py · interface/routes/censos.py',
  },
  {
    nivel: 'baixa',
    titulo: 'Documentação do repositório desatualizada',
    texto: <>O README do backend ainda fala em SQLite, em <code>/api/register</code> e em senha padrão; o <code>migrations/README.md</code> para na 0026 (há 58); <code>docs/POLITICA_PROTECAO_DADOS.md</code> é citado no <code>.env.example</code> mas não existe; e <code>BMAIS_RELATORIOS_LOTE_DIR</code> é documentada sem ser lida por código nenhum.</>,
    onde: 'bmais-backend/README.md · migrations/README.md · .env.example',
  },
  {
    nivel: 'baixa',
    titulo: 'Páginas Jinja2 e Basic Auth legados',
    texto: <>As {TOTAL_LEGADO} páginas HTML do servidor e o Basic Auth do modo HMAC seguem ativos sem uso pelo SPA. Estão sob os mesmos guards, mas ampliam a superfície a manter. Avaliar a remoção.</>,
    onde: 'interface/routes/pages.py · interface/middleware.py · templates/',
  },
]

const NIVEL_ROTULO: Record<Achado['nivel'], string> = { alta: 'Prioridade alta', media: 'Prioridade média', baixa: 'Prioridade baixa' }

export default function DocumentoTecnico() {
  // A barra usa href="#id", que o react-router leria como rota: o clique vira
  // rolagem até a seção, sem mexer na URL da aplicação.
  function irParaSecao(ev: MouseEvent<HTMLElement>) {
    const href = (ev.target as HTMLElement).closest('a')?.getAttribute('href')
    if (!href?.startsWith('#')) return
    ev.preventDefault()
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="rel-doc doc-tec">
      <div className="bar">
        <div className="bar-in">
          <div className="brand">B<span>+</span> Documentação técnica</div>
          <nav onClick={irParaSecao}>
            {SECOES.map(([id, titulo]) => <a key={id} href={`#${id}`}>{titulo}</a>)}
          </nav>
        </div>
      </div>

      <div className="doc" onClick={irParaSecao}>
        <header className="cover">
          <div>
            <div className="kick">BMais Intelligence System</div>
            <h1>Documentação técnica</h1>
            <p className="sub">Arquitetura, segurança e a referência das APIs do backend, levantadas sobre o código.</p>
          </div>
          <div className="ctrl">
            <div className="row">
              <div className="cell"><span className="lbl">Versão</span><span className="v">1</span></div>
              <div className="cell"><span className="lbl">Levantado em</span><span className="v">{LEVANTADO_EM}</span></div>
            </div>
            <div className="row">
              <div className="cell"><span className="lbl">Público</span><span className="v">Equipe técnica e administração</span></div>
              <div className="cell"><span className="lbl">Base</span><span className="v">bmais-backend e bmais-frontend</span></div>
            </div>
            <div className="row one">
              <div className="cell"><span className="lbl">Método</span><span className="v">Leitura do código e extração das rotas registradas em cada router do FastAPI, com o guard efetivo de cada uma</span></div>
            </div>
          </div>
        </header>

        {/* ============ VISÃO GERAL ============ */}
        <section className="sec" id="visao">
          <Cabecalho kick="Visão geral" titulo="Como o sistema é montado">
            O BMais é uma aplicação de página única em React que conversa, por HTTPS e JSON, com uma API em FastAPI. A API não guarda estado próprio: dados, contas e arquivos ficam no Supabase.
          </Cabecalho>

          <div className="tiles">
            <div className="tile"><span className="n">{TOTAL_ROTAS - TOTAL_LEGADO}</span><span className="t">rotas de API em 13 arquivos de rotas, mais {TOTAL_LEGADO} páginas HTML legadas</span></div>
            <div className="tile"><span className="n">10</span><span className="t">papéis de acesso: oito internos, mais médico e enfermeiro, que têm portal próprio</span></div>
            <div className="tile"><span className="n">58</span><span className="t">migrations SQL versionadas e idempotentes, da 0001 à 0058</span></div>
            <div className="tile"><span className="n">91</span><span className="t">hospitais com leitor de censo dedicado, sobre 26 layouts de relatório</span></div>
          </div>

          <Sub titulo="O caminho de uma requisição" />
          <div className="flow">
            <div className="fs">
              <span className="fn">01</span>
              <h4>Navegador</h4>
              <p>SPA em React 19 e Vite, na Vercel. O TanStack Query guarda e revalida os dados; o cliente HTTP (<code>api/client.ts</code>) injeta o token e renova a sessão.</p>
            </div>
            <div className="fs">
              <span className="fn">02</span>
              <h4>Middleware da API</h4>
              <p>CORS, validação do Bearer, bloqueio de conta suspensa e instrumentação. Escrita bem-sucedida esvazia o cache; toda escrita vai para a trilha.</p>
            </div>
            <div className="fs">
              <span className="fn">03</span>
              <h4>Rota e guard</h4>
              <p>O guard de papel (<code>authz.py</code>) decide quem passa e o escopo de hospitais recorta o resultado. A rota chama um use-case de <code>application/</code>.</p>
            </div>
            <div className="fs">
              <span className="fn">04</span>
              <h4>Supabase</h4>
              <p>Postgres via PostgREST, por HTTPS, com a service key; Auth (GoTrue) para o login; Storage privado para os anexos.</p>
            </div>
          </div>

          <div className="two">
            <div className="card">
              <h4>Camadas do backend</h4>
              <p className="cap">Arquitetura limpa: a interface só fala HTTP, a regra mora em <code>application</code> e <code>domain</code>, e o que toca o mundo de fora fica em <code>infrastructure</code>.</p>
              <div className="tw">
                <table>
                  <thead><tr><th>Camada</th><th>O que mora lá</th></tr></thead>
                  <tbody>
                    <tr><td><code>interface</code></td><td>Fábrica do app, middleware, guards (<code>authz.py</code>), schemas Pydantic e os routers</td></tr>
                    <tr><td><code>application</code></td><td>Use-cases por assunto (censos, internações, tarefas, distribuição…), cache, trilha e métricas</td></tr>
                    <tr><td><code>domain</code></td><td>Regras puras: prazos da operadora, situação do relatório, cobertura de censo, duplicidade, CID</td></tr>
                    <tr><td><code>infrastructure</code></td><td>Supabase (dados, Auth, Storage), parsers de censo, criptografia, planilha Excel e PDF da Porto</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card">
              <h4>Tecnologias</h4>
              <div className="tw">
                <table>
                  <thead><tr><th>Parte</th><th>Stack</th></tr></thead>
                  <tbody>
                    <tr><td>Frontend</td><td>React 19, React Router 7, TanStack Query 5, Chart.js 4, TypeScript 6, Vite 8, oxlint</td></tr>
                    <tr><td>Backend</td><td>Python 3, FastAPI e Uvicorn, Pydantic, supabase-py e httpx</td></tr>
                    <tr><td>Documentos</td><td>pdfplumber (leitura de censo), extract-msg (e-mail .msg), openpyxl (planilha), pypdf e reportlab (formulário da Porto)</td></tr>
                    <tr><td>Segurança</td><td>cryptography (AES-256-GCM nos campos do paciente)</td></tr>
                    <tr><td>Hospedagem</td><td>Vercel na região gru1 (São Paulo) para os dois projetos, Vercel Cron e Supabase</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ============ AUTENTICAÇÃO ============ */}
        <section className="sec" id="autenticacao">
          <Cabecalho kick="Autenticação" titulo="Login, token e sessão">
            O login passa pelo backend, que valida a credencial e devolve o token. Toda rota fora da lista pública exige o cabeçalho <code>Authorization: Bearer &lt;token&gt;</code>.
          </Cabecalho>

          <div className="tw">
            <table>
              <thead><tr><th>Modo</th><th>Quando vale</th><th>Token</th><th>Renovação</th></tr></thead>
              <tbody>
                <tr><td><b>Supabase Auth</b> (produção)</td><td><code>SUPABASE_URL</code> e <code>SUPABASE_ANON_KEY</code> válidas</td><td>JWT do Supabase (cerca de 1 h), validado no GoTrue com cache de 60 s</td><td><code>POST /api/sessao/renovar</code> com o <code>refresh_token</code>, até o teto do SPA</td></tr>
                <tr><td><b>HMAC</b> (fallback)</td><td>Supabase Auth não configurado</td><td>HMAC-SHA256 assinado com <code>BMAIS_SECRET</code>; credencial única <code>BMAIS_USER</code>/<code>BMAIS_PASS</code>, sem valor padrão</td><td>Não há: o token já nasce com 1 ou 30 dias</td></tr>
                <tr><td><b>Local</b> (desenvolvimento)</td><td><code>DEV_LOCAL_AUTH=1</code></td><td>HMAC, com contas em <code>dev_users.json</code> (senha em PBKDF2)</td><td>Não há</td></tr>
              </tbody>
            </table>
          </div>

          <div className="two">
            <div className="card">
              <h4>Entrar e conferir a sessão</h4>
              <pre><code>{`POST /api/login
Content-Type: application/json

{"email": "nome@empresa.com.br", "password": "…", "remember": true}

200 {"token": "eyJ…", "refresh_token": "…",
     "username": "nome@empresa.com.br", "expires_in": 3600}

GET /api/me
Authorization: Bearer eyJ…

200 {"username": "nome@empresa.com.br", "role": "tecnico",
     "nome": "Nome Sobrenome", "senha_provisoria": false}`}</code></pre>
            </div>
            <div className="card">
              <h4>A sessão no navegador</h4>
              <ul className="lista">
                <li>Com "Manter conectado", o token vai para o <code>localStorage</code> e a sessão dura até 30 dias; sem ele, vai para o <code>sessionStorage</code> e dura até 24 h.</li>
                <li>O cliente renova o token 60 s antes de vencer e, num 401, tenta uma renovação antes de deslogar. As renovações não correm em paralelo: o <code>refresh_token</code> do Supabase é de uso único.</li>
                <li>Só um 401 encerra a sessão. O 503 do middleware (Auth fora do ar) mantém o usuário dentro, e a chamada pode ser repetida.</li>
                <li>Timeout de 20 s nas leituras e de 120 s nos uploads. Timeout vira erro de rede, nunca 401.</li>
                <li>Não há auto-cadastro: contas nascem em <code>/api/usuarios</code>. A senha definida por outra pessoa fica provisória, e o SPA oferece a troca por <code>/api/me/senha</code>.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ============ AUTORIZAÇÃO ============ */}
        <section className="sec" id="autorizacao">
          <Cabecalho kick="Autorização" titulo="Papéis, guards e escopo">
            Autenticar não basta: cada rota exige um papel, lido da tabela <code>profiles</code>. A interface esconde o que o papel não alcança (<code>auth/permissions.ts</code>), mas quem trava é o servidor (<code>interface/authz.py</code>). Os dois lados precisam mudar juntos.
          </Cabecalho>

          <div className="tw">
            <table>
              <thead><tr><th>Papel</th><th>Na interface</th><th>Em resumo</th></tr></thead>
              <tbody>
                <tr><td><code>admin</code></td><td>{ROLE_LABEL.admin}</td><td>Tudo, inclusive a gestão de contas e as rotas destrutivas.</td></tr>
                <tr><td><code>diretor</code></td><td>{ROLE_LABEL.diretor}</td><td>Diretoria, Gestor e Configurações; lê os dados operacionais.</td></tr>
                <tr><td><code>gestor</code></td><td>{ROLE_LABEL.gestor}</td><td>Gestor e Configurações, com as ações do técnico e do operacional; aprova relatório, pede pendências e divide carga.</td></tr>
                <tr><td><code>administrativo</code></td><td>{ROLE_LABEL.administrativo}</td><td>Visão Geral, Envio de censos e Tarefas. Único papel com escopo por operadora.</td></tr>
                <tr><td><code>tecnico</code></td><td>{ROLE_LABEL.tecnico}</td><td>Análise técnica: aprova e edita relatórios e atribui CID.</td></tr>
                <tr><td><code>analista</code></td><td>{ROLE_LABEL.analista}</td><td>Somente leitura nos dados. Vê Movimentações e mantém cadastro, equipe e contas em Operações.</td></tr>
                <tr><td><code>coordenador_administrativo</code></td><td>{ROLE_LABEL.coordenador_administrativo}</td><td>Distribui a carga dos operacionais; tem as ações do grupo.</td></tr>
                <tr><td><code>coordenador_tecnico</code></td><td>{ROLE_LABEL.coordenador_tecnico}</td><td>Distribui a carga dos técnicos; aprova e edita relatório.</td></tr>
                <tr><td><code>medico</code>, <code>enfermeiro</code></td><td>{ROLE_LABEL.medico}, {ROLE_LABEL.enfermeiro}</td><td>Portal do profissional. Nenhuma rota de dados os aceita.</td></tr>
              </tbody>
            </table>
          </div>

          <div className="two">
            <div className="card">
              <h4>O que vale para toda requisição</h4>
              <ul className="lista">
                <li>Sem registro em <code>profiles</code>, a pessoa autentica, mas toda rota de dados responde 403 "Acesso ainda não liberado".</li>
                <li>Conta suspensa (<code>profiles.ativo = false</code>) é barrada pelo middleware em toda a API, inclusive nas leituras.</li>
                <li>O perfil é lido uma vez por requisição e fica em cache; mudar papel ou suspender vale na requisição seguinte.</li>
                <li>O analista barrado numa escrita recebe a mensagem de perfil somente leitura, e não "acesso negado".</li>
              </ul>
            </div>
            <div className="card">
              <h4>Escopo de hospitais</h4>
              <ul className="lista">
                <li><b>Admin</b> vê tudo.</li>
                <li><b>Operacional</b> vê os hospitais das operadoras atribuídas a ele (0053), refinados pelo par hospital + operadora em pacientes e censos.</li>
                <li><b>Demais papéis</b> veem os hospitais vinculados ao perfil; sem vínculo nenhum, veem tudo.</li>
                <li>A divisão temporária de carga (Distribuição) soma ou tira hospitais durante o período.</li>
                <li>Recurso fora do escopo responde 404, e não 403: a resposta não confirma que ele existe.</li>
              </ul>
            </div>
          </div>

          <Sub titulo="Guards">
            Cada regra de acesso é um guard em <code>authz.py</code>. Quando uma rota tem o guard do router e o da própria rota, vale a interseção. A coluna Rotas diz quantas rotas desta referência dependem de cada um.
          </Sub>
          <div className="tw">
            <table>
              <thead><tr><th>Guard</th><th>Regra</th><th>Papéis aceitos</th><th>Rotas</th></tr></thead>
              <tbody>
                {(Object.keys(ACESSOS) as Acesso[]).filter((a) => ROTAS_POR_ACESSO.has(a)).map((a) => {
                  const regra: RegraAcesso = ACESSOS[a]
                  return (
                    <tr key={a}>
                      <td><code>{regra.guard}</code></td>
                      <td>{regra.rotulo}{regra.nota && <span className="nota">{regra.nota}</span>}</td>
                      <td>{regra.papeis.length ? <Papeis papeis={regra.papeis} /> : '—'}</td>
                      <td className="tn">{ROTAS_POR_ACESSO.get(a)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ============ CONVENÇÕES ============ */}
        <section className="sec" id="convencoes">
          <Cabecalho kick="Convenções" titulo="O que vale para todas as rotas">
            Formato das chamadas, códigos de erro, cache, trilha de auditoria e proteção de dados.
          </Cabecalho>

          <div className="two">
            <div className="card">
              <h4>Formato</h4>
              <ul className="lista">
                <li>Em produção o SPA chama <code>VITE_API_URL</code> + <code>/api/…</code>; em desenvolvimento o Vite repassa <code>/api</code> para <code>127.0.0.1:8765</code>, sem CORS.</li>
                <li>JSON em UTF-8; arquivos em <code>multipart/form-data</code>.</li>
                <li>Os corpos são validados por Pydantic (<code>interface/schemas.py</code>): campo inválido responde 422 com o nome do campo, e campo desconhecido é ignorado, para um cliente mais novo não quebrar.</li>
                <li>Datas em ISO (<code>AAAA-MM-DD</code>); filtros de período com fuso.</li>
                <li>A documentação interativa do FastAPI fica em <code>/docs</code> e <code>/redoc</code>.</li>
              </ul>
            </div>
            <div className="card">
              <h4>Códigos de resposta</h4>
              <div className="tw">
                <table>
                  <thead><tr><th>Código</th><th>Quando</th></tr></thead>
                  <tbody>
                    <tr><td className="tn">400</td><td>A regra de negócio recusou: data inválida, campo vazio, valor fora do catálogo.</td></tr>
                    <tr><td className="tn">401</td><td>Sem token, token inválido ou expirado. É o único que encerra a sessão no SPA.</td></tr>
                    <tr><td className="tn">403</td><td>Papel sem permissão, perfil sem papel ou conta suspensa.</td></tr>
                    <tr><td className="tn">404</td><td>Não existe, ou está fora do escopo do usuário.</td></tr>
                    <tr><td className="tn">409</td><td>Conflito de estado: já tem alta, envio já revertido, CID já vinculado, hospital com histórico.</td></tr>
                    <tr><td className="tn">422</td><td>Corpo fora do schema.</td></tr>
                    <tr><td className="tn">503</td><td>Auth do Supabase fora do ar, <code>CRON_SECRET</code> ausente, ou migration ainda não aplicada.</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="cap">O corpo do erro é <code>{'{"detail": "mensagem"}'}</code>. A exceção são as rotas de envio de censo, que respondem <code>{'{"erro": "…"}'}</code> (ver <a href="#atencao">Pontos de atenção</a>).</p>
            </div>
          </div>

          <div className="two">
            <div className="card">
              <h4>Cache e atualização</h4>
              <ul className="lista">
                <li>As agregações caras (barra lateral, painéis, Diretoria) ficam em memória por <code>CACHE_TTL_SEGUNDOS</code> (30 s).</li>
                <li>Toda escrita 2xx esvazia esse cache no middleware, menos login, renovação e chamados.</li>
                <li>A Visão Geral se revalida a cada <code>VITE_AUTO_REFRESH_MS</code> (30 s) com a aba visível, e o <code>/version.json</code> sem cache avisa quando há deploy novo.</li>
                <li><code>/api/_metricas</code> mostra, por rota, tempo, idas ao Supabase e acertos de cache.</li>
              </ul>
            </div>
            <div className="card">
              <h4>Trilha de auditoria (Movimentações)</h4>
              <ul className="lista">
                <li>Toda escrita na API vira um registro em <code>audit_logs</code>, inclusive as negadas (4xx e 5xx).</li>
                <li>O catálogo de <code>application/auditoria.py</code> traduz método e rota em ação e entidade, então rota nova entra na trilha sem ninguém anotar.</li>
                <li>As rotas enriquecem o registro com <code>anotar()</code>: paciente, arquivo, campos alterados.</li>
                <li>Ficam fora o login, a renovação, o cron e o 401 sem anotação. A gravação não derruba a requisição e roda antes da resposta, por causa do serverless.</li>
              </ul>
            </div>
          </div>

          <div className="card">
            <h4>Proteção de dados (LGPD)</h4>
            <ul className="lista">
              <li>Os campos que identificam o paciente (<code>internacoes.nome</code>, <code>senha</code>, <code>medico</code> e <code>raw_json</code>) são cifrados com AES-256-GCM antes de gravar, quando <code>BMAIS_CRYPTO_KEY</code> existe. O valor cifrado leva o prefixo <code>bmc1:</code>, o que permite conviver com o passivo em claro.</li>
              <li>A busca por nome usa um índice cego (<code>busca_idx</code>, HMAC dos prefixos), para o filtro continuar acontecendo no banco.</li>
              <li>RLS ligado em todas as tabelas (0024). Só a service key lê os dados, e ela nunca sai do servidor; a anon key serve apenas ao login.</li>
              <li>Os anexos ficam no Storage privado (<code>bmais-uploads</code>), e o cliente recebe uma URL assinada que vale 5 minutos.</li>
            </ul>
          </div>
        </section>

        {/* ============ FLUXOS ============ */}
        <section className="sec" id="fluxos">
          <Cabecalho kick="Fluxos" titulo="Os três caminhos que mais chamam a API">
            Envio de censo, relatório de visita e cobrança de censo. Cada passo cita a rota que o executa.
          </Cabecalho>

          <Sub titulo="Envio de censo" />
          <div className="steps">
            <div className="st"><span className="sn">01 · SALVAR</span><h4>A sessão de envio</h4><p><code>POST /api/upload/stage</code> grava os arquivos numa pasta com o carimbo de hora e responde em seguida, sem tocar o banco.</p></div>
            <div className="st"><span className="sn">02 · LER</span><h4>Um arquivo por chamada</h4><p>O SPA chama <code>/api/upload/processar</code> arquivo a arquivo, para medir o progresso. O leitor do hospital escolhido vence a detecção por layout, mas avisa se não ler ninguém ou se o texto citar outro hospital.</p></div>
            <div className="st"><span className="sn">03 · COMPLETAR</span><h4>O que veio pela metade</h4><p>Paciente lido em parte volta como pendência com <code>campos_faltantes</code>: o usuário completa ou descarta. Hospital fora do cadastro volta com <code>precisa_hospital</code> e é relido com o hospital informado.</p></div>
            <div className="st"><span className="sn">04 · CONFERIR</span><h4>Altas e desfazer</h4><p>Quem sumiu do censo recebe alta inferida. <code>/api/upload/envios/{'{sessao}'}/reverter</code> apaga só o que o envio criou, por sessão ou por arquivo.</p></div>
          </div>

          <Sub titulo="Relatório de visita e aprovação" />
          <div className="steps">
            <div className="st"><span className="sn">01 · REGISTRAR</span><h4>Aprovado ou pendente</h4><p><code>relatorio-rapido</code> ou <code>relatorio-com-anexo</code>. Técnico, coordenador técnico, gestor e admin registram já aprovado; os demais, pendente.</p></div>
            <div className="st"><span className="sn">02 · AGUARDAR</span><h4>Pendente não é visita</h4><p>Enquanto espera, o relatório não conta para prazo nem para KPIs, e o paciente aparece como "Aguardando aprovação".</p></div>
            <div className="st"><span className="sn">03 · APROVAR</span><h4>Aprovar ou corrigir</h4><p><code>aprovar</code>, <code>editar</code> (continua pendente) ou <code>editar-aprovar</code>. Não há devolução ao autor desde 21/10/2026.</p></div>
            <div className="st"><span className="sn">04 · VENCER</span><h4>Volta quando vence</h4><p>Aprovado e no prazo, o paciente sai de Tarefas. Vencido o prazo da operadora, ele volta como "Sem relatório".</p></div>
          </div>

          <Sub titulo="Cobrança de censo" />
          <div className="steps">
            <div className="st"><span className="sn">01 · VIRADA DO DIA</span><h4>O cron das 03:00 (Brasília)</h4><p>A Vercel chama <code>/api/cron/cobrancas-censo</code> às 06:00 UTC: abre a cobrança de quem não mandou censo ontem e fecha a de quem mandou. O processamento de upload faz o mesmo.</p></div>
            <div className="st"><span className="sn">02 · COBRAR</span><h4>Por par hospital e operadora</h4><p>O operacional marca cobrado (vai para "Aguardando retorno"), atualizado (não há censo novo) ou só anota a tentativa.</p></div>
            <div className="st"><span className="sn">03 · DESFAZER</span><h4>Com aprovação</h4><p>Desfazer o "atualizado" é direto para gestor, coordenadores e admin; os demais abrem um pedido, que um deles aprova ou recusa.</p></div>
          </div>
        </section>

        {/* ============ REFERÊNCIA ============ */}
        <section className="sec" id="endpoints">
          <Cabecalho kick="Referência" titulo="APIs do backend">
            As {TOTAL_ROTAS - TOTAL_LEGADO} rotas JSON e as {TOTAL_LEGADO} páginas legadas, agrupadas por assunto. Trechos entre chaves, como <code>{'{id}'}</code>, são parâmetros do caminho. O acesso é o guard efetivo da rota; passe o mouse para ver os papéis.
          </Cabecalho>
          <ReferenciaApis />
        </section>

        {/* ============ INFRAESTRUTURA ============ */}
        <section className="sec" id="infra">
          <Cabecalho kick="Infraestrutura" titulo="Publicação, configuração e banco">
            Os dois projetos são publicados na Vercel, na região de São Paulo (gru1). Não há servidor próprio.
          </Cabecalho>

          <div className="two">
            <div className="card">
              <h4>Publicação</h4>
              <ul className="lista">
                <li><b>API:</b> função Python da Vercel a partir de <code>app.py</code>, com todas as rotas apontadas para ela. O disco gravável é só o <code>/tmp</code>, efêmero.</li>
                <li><b>Cron:</b> <code>/api/cron/cobrancas-censo</code>, todo dia às 06:00 UTC, autenticado por <code>CRON_SECRET</code>.</li>
                <li><b>SPA:</b> <code>npm run build</code> (TypeScript + Vite) gera <code>dist/</code>; toda rota que não é asset volta para o <code>index.html</code>. Assets com cache de um ano; <code>version.json</code> sem cache.</li>
              </ul>
            </div>
            <div className="card">
              <h4>Rodar localmente</h4>
              <pre><code>{`# API (porta 8765)
cd bmais-backend
pip install -r requirements.txt
cp .env.example .env    # preencher SUPABASE_*
python app.py           # uvicorn com reload

# SPA (porta 5173, /api via proxy)
cd bmais-frontend
npm install
npm run dev`}</code></pre>
            </div>
          </div>

          <Sub titulo="Variáveis de ambiente da API" />
          <div className="tw">
            <table>
              <thead><tr><th>Variável</th><th>Padrão</th><th>Para quê</th></tr></thead>
              <tbody>
                <tr><td><code>SUPABASE_URL</code></td><td>—</td><td>Projeto do Supabase. Sem ela as rotas de dados falham.</td></tr>
                <tr><td><code>SUPABASE_ANON_KEY</code></td><td>—</td><td>Chave pública, usada só pelo login.</td></tr>
                <tr><td><code>SUPABASE_SERVICE_KEY</code></td><td>—</td><td>Chave de dados (ignora RLS). Secreta; sem ela as consultas voltam vazias.</td></tr>
                <tr><td><code>BMAIS_CRYPTO_KEY</code></td><td>—</td><td>Chave AES de 32 bytes dos campos do paciente. Gerar com <code>python -m src.infrastructure.cripto --gerar-chave</code>.</td></tr>
                <tr><td><code>CRON_SECRET</code></td><td>—</td><td>Senha do Vercel Cron. Sem ela o cron responde 503.</td></tr>
                <tr><td><code>BMAIS_CORS_ORIGINS</code></td><td>localhost:5173 e bmais-frontend.vercel.app</td><td>Origens do SPA, separadas por vírgula.</td></tr>
                <tr><td><code>BMAIS_CORS_ORIGIN_REGEX</code></td><td>previews bmais-frontend*.vercel.app</td><td>Origens de preview da Vercel.</td></tr>
                <tr><td><code>BMAIS_STORAGE_BUCKET</code></td><td><code>bmais-uploads</code></td><td>Bucket privado dos anexos.</td></tr>
                <tr><td><code>CACHE_TTL_SEGUNDOS</code></td><td>30</td><td>Vida do cache de agregações.</td></tr>
                <tr><td><code>SUPABASE_TOKEN_CACHE_TTL</code></td><td>60</td><td>Cache da validação do JWT, em segundos.</td></tr>
                <tr><td><code>BMAIS_METRICAS</code>, <code>BMAIS_METRICAS_AMOSTRAS</code></td><td>1, 50</td><td>Liga a instrumentação e define quantas amostras guardar por rota.</td></tr>
                <tr><td><code>BMAIS_AUTH</code></td><td>1</td><td><code>0</code> desliga toda a autenticação. Só para desenvolvimento.</td></tr>
                <tr><td><code>BMAIS_USER</code>, <code>BMAIS_PASS</code>, <code>BMAIS_SECRET</code></td><td>—</td><td>Modo HMAC: credencial única e segredo dos tokens. Sem o segredo, os tokens caem a cada reinício.</td></tr>
                <tr><td><code>BMAIS_TOKEN_TTL</code>, <code>BMAIS_TOKEN_TTL_LEMBRADO</code></td><td>86400, 2592000</td><td>Duração do token HMAC sem e com "Manter conectado".</td></tr>
                <tr><td><code>DEV_LOCAL_AUTH</code>, <code>DEV_LOCAL_AUTH_STORE</code></td><td>0, <code>dev_users.json</code></td><td>Login local de desenvolvimento.</td></tr>
                <tr><td><code>BMAIS_CENSOS_DIR</code>, <code>BMAIS_HOSPITAIS_PDF</code></td><td>—</td><td>Pasta do <code>/api/refresh</code> e PDF do <code>/api/importar-hospitais</code>.</td></tr>
                <tr><td><code>DATABASE_URL</code></td><td>—</td><td>Só o runner de migrations, que fala Postgres direto.</td></tr>
              </tbody>
            </table>
          </div>

          <Sub titulo="Variáveis de ambiente do SPA (lidas no build)" />
          <div className="tw">
            <table>
              <thead><tr><th>Variável</th><th>Padrão</th><th>Para quê</th></tr></thead>
              <tbody>
                <tr><td><code>VITE_API_URL</code></td><td>vazio</td><td>URL pública da API, sem barra final. Vazio usa o proxy do Vite.</td></tr>
                <tr><td><code>VITE_API_PROXY</code></td><td><code>http://127.0.0.1:8765</code></td><td>Destino do proxy <code>/api</code> no desenvolvimento.</td></tr>
                <tr><td><code>VITE_AUTO_REFRESH_MS</code></td><td>30000</td><td>Intervalo de revalidação da Visão Geral; 0 desliga.</td></tr>
                <tr><td><code>VITE_SESSAO_MAX_HORAS</code>, <code>VITE_SESSAO_LEMBRADA_DIAS</code></td><td>24, 30</td><td>Teto da sessão sem e com "Manter conectado".</td></tr>
              </tbody>
            </table>
          </div>

          <div className="two">
            <div className="card">
              <h4>Banco e migrations</h4>
              <ul className="lista">
                <li>O esquema vive em 58 arquivos SQL em <code>bmais-backend/migrations</code>, idempotentes e aplicados em ordem.</li>
                <li><code>python -m migrations.run</code> aplica os pendentes e registra em <code>schema_migrations</code>; <code>--status</code> lista o que falta. Ou aplicar cada arquivo pelo SQL Editor do Supabase.</li>
                <li>O runner usa <code>DATABASE_URL</code> e conexão Postgres direta, e o host direto do Supabase só responde por IPv6: use a string do pooler.</li>
                <li>Código que depende de tabela nova responde 503 até a migration ser aplicada, em vez de quebrar.</li>
              </ul>
            </div>
            <div className="card">
              <h4>Verificação</h4>
              <ul className="lista">
                <li><b>API:</b> pytest em <code>bmais-backend/tests</code>, com repositórios falsos no lugar do Supabase: <code>.venv/bin/python -m pytest -q tests</code>.</li>
                <li><b>SPA:</b> sem suíte de testes; a checagem é <code>npm run build</code> (inclui o <code>tsc -b</code>) e <code>npm run lint</code> (oxlint).</li>
                <li><b>Acessos:</b> <code>python -m scripts.matriz_acessos --md</code> gera a matriz papel × rota a partir do código (hoje com defeito, ver <a href="#atencao">Pontos de atenção</a>).</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ============ PONTOS DE ATENÇÃO ============ */}
        <section className="sec" id="atencao">
          <Cabecalho kick="Análise" titulo="Pontos de atenção">
            O que a leitura do código encontrou e pede decisão, em ordem de prioridade. Nenhum item impede o uso do sistema hoje.
          </Cabecalho>
          {ACHADOS.map((a) => (
            <div className={`card ${a.nivel}`} key={a.titulo}>
              <span className={`tag ${a.nivel}`}>{NIVEL_ROTULO[a.nivel]}</span>
              <h4>{a.titulo}</h4>
              <p>{a.texto}</p>
              <span className="onde">{a.onde}</span>
            </div>
          ))}
        </section>

        <p className="foot">
          Levantado sobre o código em {LEVANTADO_EM}. A fonte da verdade de quem alcança cada rota é o backend (<code>interface/authz.py</code>); ao criar ou mudar uma rota, atualize o catálogo em <code>components/documentacao/endpoints.ts</code>.
        </p>
      </div>
    </div>
  )
}
