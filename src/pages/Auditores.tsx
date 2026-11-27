// Módulo 2 > Auditores (16/11/2026, migration 0062). Pedido do usuário: "uma
// aba chamada Auditores, onde posso solicitar documentos a um auditor e ter
// acesso aos documentos de cada auditor; pode deixar como padrão de solicitação
// os mesmos documentos que tínhamos no json de documentos, mas agora eles
// existem como um registro real a ser atribuído".
//
// /auditores              a lista: cada médico e enfermeiro auditor ativo com a
//                          situação dos documentos (como a tela Prestadores do
//                          protótipo do Bloco 2);
// /auditores/:auditor      a ficha, pelo nome do auditor (/auditores/ana-paula-souza;
//                          17/11/2026, no lugar de /modulo-2/auditores/11). Um número
//                          no fim ainda abre pelo id e troca o endereço pelo nome.
//
// A ficha tem duas partes (17/11/2026, pedido do usuário): a documentação padrão,
// com que todo auditor abre pendente desde o cadastro, e os outros documentos,
// que o Operacional insere pelo nome para aquele auditor.
//
// A agenda de serviços do auditor (17/11/2026, pedido do usuário: "então faça
// assim", a ficha do prestador do protótipo do Bloco 2): na lista, a coluna
// Serviços; na ficha, as etiquetas dos serviços, a produção do mês de cada um e o
// cartão "Hospitais e serviços" (uma linha por hospital, só postos vigentes). Os
// postos se lançam em Módulo 2 > Agenda de serviços; aqui só aparecem.
//
// Ausências dentro de Auditores (24/11/2026, pedido do usuário: "unifique as telas de Auditores com Ausências;
// em Auditores são tomadas as decisões e aprovações referentes a ausências e falta de documentações"; depois:
// "no filtro do próprio auditor já pode ter essas duas decisões, não precisa separar em abas"): sem abas. Na
// lista, o quadro "Decisões pendentes" filtra quem tem documento para aprovar ou ausência a decidir, e a coluna
// Decisões diz quantos de cada; na ficha ficam as duas decisões (documentos e a seção Ausências). O antigo
// /modulo-2/ausencias abre a lista já com esse filtro (?filtro=decisoes). Componente em
// components/auditores/Ausencias.tsx.
//
// Solicitar cria um pedido por documento; registrar o recebido anexa o arquivo
// (PDF ou foto) e atende o pedido. Renovar é pedir de novo: o arquivo anterior
// continua disponível no histórico. Quem pede, insere e recebe: coordenador
// operacional, Operacional e admin (ACOES.gerirDocumentosAuditor); os demais da
// tela só consultam.
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { usePageHeader } from '../components/PageHeader'
import { AusenciasADecidir, HistoricoAusencias } from '../components/auditores/Ausencias'
import MenuAcoes, { type ItemMenu } from '../components/MenuAcoes'
import { useAusencias } from '../hooks/useAusencias'
import { useAuth } from '../auth/AuthContext'
import { podeVer } from '../auth/permissions'
import { ConfirmarModal } from '../components/ConfirmarModal'
import Toast from '../components/Toast'
import { Badge, KpiCard, LoadingState, Modal } from '../components/ui'
import {
  useAprovarDocumento, useAuditores, useCadastroAuditor, useCancelarPedidoDocumento, useFichaAuditor, useInserirDocumento,
  usePedirDocumentos, useReceberDocumento, useRecusarDocumento, useSalvarCadastroAuditor, useSalvarContratoAuditor,
} from '../hooks/useAuditores'
import { useAgendaDoAuditor, useServicosDosAuditores } from '../hooks/usePostos'
import { dataBR, dataHora } from '../lib/datas'
import {
  baixarDocumento,
  type Auditor, type AuditorNaLista, type CadastroEContrato, type DocumentoDoAuditor, type FichaAuditor, type RegistroDocumento,
  type ResumoDocumentos, type SituacaoDocumento, type SituacaoGeral, type TipoDocumento,
} from '../services/auditores.service'

const estilos = `
.aud-voltar{display:inline-flex;align-items:center;gap:6px;font-size:var(--t-sm);color:var(--muted);
  text-decoration:none;margin-bottom:12px}
.aud-voltar:hover{color:var(--ink)}
.aud-servs{display:flex;gap:6px;flex-wrap:wrap}
.aud-kpis .kpi-bar{display:none}
.aud-servs-ficha{margin:0 0 12px}
.aud-filtros{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:14px 0 12px}
.aud-busca{flex:1 1 240px;max-width:360px}
.aud-seg{display:inline-flex;border:1px solid var(--border);border-radius:var(--r-sm);overflow:hidden;background:var(--surface)}
.aud-seg button{border:0;background:none;padding:6px 12px;font-size:var(--t-sm);color:var(--ink-2);cursor:pointer}
.aud-seg button+button{border-left:1px solid var(--border)}
.aud-seg button.ativo{background:var(--surface-3);color:var(--ink);font-weight:600}
.aud-linha{cursor:pointer}
.aud-linha:hover td{background:var(--surface-2)}
.aud-nome{font-weight:600;color:var(--ink)}
.aud-sub{font-size:var(--t-sm);color:var(--muted);margin-top:2px}
.aud-vazio{padding:28px 8px;text-align:center;color:var(--muted);font-size:var(--t-sm)}
.aud-aviso{padding:14px 16px;font-size:var(--t-sm);color:var(--ink-2)}
.aud-acoes{display:flex;gap:6px;justify-content:flex-end;align-items:center;flex-wrap:nowrap}
.aud-acoes .btn{white-space:nowrap}
.aud-hist{display:flex;flex-direction:column}
.aud-hist-item{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;padding:10px 0;
  border-top:1px solid var(--border-soft)}
.aud-hist-item:first-child{border-top:0;padding-top:2px}
.aud-grupo{font-size:var(--t-xs);text-transform:uppercase;letter-spacing:.06em;font-weight:700;color:var(--ink-3);
  margin:4px 0 6px}
.aud-grupo+.aud-check{margin-top:0}
.aud-check{display:flex;gap:10px;align-items:flex-start;padding:7px 0;font-size:var(--t-base);color:var(--ink-2);cursor:pointer}
.aud-check input{margin-top:2px}
.aud-check.travado{color:var(--muted);cursor:default}
.aud-campo{margin-bottom:12px}
.aud-nota{font-size:var(--t-sm);color:var(--muted);margin:4px 0 0}
.aud-erro{font-size:var(--t-sm);color:var(--danger);margin:8px 0 0}
.aud-arq{white-space:nowrap}
.aud-obs{font-size:var(--t-xs);color:var(--ink-2);margin-top:3px;overflow-wrap:anywhere}
.aud-decisoes{display:flex;flex-direction:column;align-items:flex-start;gap:4px}
.aud-dec.tem{box-shadow:inset 0 0 0 1px #EDC77A;background:linear-gradient(180deg,#FFF9EA,var(--surface) 140px)}
.aud-dec-item{display:flex;align-items:center;gap:14px;padding:12px 18px;border-top:1px solid var(--line)}
.aud-dec-tipo{flex:none;width:96px}
.aud-dec-txt{flex:1;min-width:0}
.aud-dec-t{font-weight:600;color:var(--ink)}
.aud-dec-s{font-size:var(--t-sm);color:var(--muted);margin-top:2px;overflow-wrap:anywhere}
.aud-dec-item .aus-fech{font-size:var(--t-sm)}
.aud-dec-vazio{padding:14px 18px 18px;font-size:var(--t-sm);color:var(--muted)}
.aud-dec-aviso{margin:0 18px 14px;padding:10px 12px;border-radius:10px;background:#FFF5DC;color:#5A4012;box-shadow:inset 0 0 0 1px #EDC77A;font-size:var(--t-sm)}
.aud-linha-dec td{background:#FFFBEF}
.aud-det{margin-top:0}
.aud-ficha{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:16px;align-items:start}
.aud-col{display:flex;flex-direction:column;gap:14px;min-width:0}
.aud-col>.card{margin:0!important}
@media (max-width:1180px){.aud-ficha{grid-template-columns:minmax(0,1fr)}}
/* Alinhamento (24/11/2026, pedido do usuário: "deixa os componentes mais alinhados"): o texto da primeira e da
   última coluna das tabelas na mesma margem dos títulos dos cartões (18px), e as tabelas da coluna principal com a
   mesma grade fixa (22% e 24%: "Situação" e a 3ª coluna começam no mesmo ponto em Documentação e em Ausências). */
.aud-grade{table-layout:fixed}
.aud-grade td{overflow-wrap:anywhere}
.aud-grade .aud-acoes{flex-wrap:wrap;row-gap:6px}
.aud-ficha .bmais-table th:first-child,.aud-ficha .bmais-table td:first-child{padding-left:18px}
.aud-ficha .bmais-table th:last-child,.aud-ficha .bmais-table td:last-child{padding-right:18px}
.aud-ficha .bmais-table td{vertical-align:middle}
.aud-lado .card-header{padding-bottom:6px}
.aud-lado .aud-cad-topo .btn{margin-right:-10px}
.aud-lado .aud-cad{grid-template-columns:1fr;gap:16px}
.aud-lado .aud-dl{grid-template-columns:1fr 1fr}
.aud-lista{display:flex;flex-direction:column}
.aud-lista-i{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 18px;border-top:1px solid var(--line)}
.aud-prod{display:flex;flex-direction:column;gap:10px}
.aud-prod-l{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding-top:10px;border-top:1px solid var(--line);font-size:var(--t-sm);color:var(--ink-2)}
.aud-prod-l b{font-size:22px;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums}
.aud-det>summary{list-style:none;cursor:pointer;display:flex;flex-direction:column;gap:2px;padding:16px 18px}
.aud-det>summary::-webkit-details-marker{display:none}
.aud-det>summary::after{content:'Mostrar';font-size:var(--t-sm);color:var(--accent,#155CA8);margin-top:4px}
.aud-det[open]>summary::after{content:'Esconder'}
.aud-recusa{font-size:var(--t-xs);color:var(--danger);margin-top:3px;overflow-wrap:anywhere}
.aud-texto{width:100%;min-height:84px;resize:vertical;font-family:inherit}
.aud-perigo{background:var(--danger);color:#fff;border-color:var(--danger)}
.aud-perigo:hover:not(:disabled){background:var(--danger-2);border-color:var(--danger-2)}
.aud-cad{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px 28px}
.aud-cad-topo{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
.aud-cad-topo .aud-grupo{margin:0}
.aud-dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px 18px;margin:0}
.aud-dl dt{font-size:var(--t-xs);text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:600}
.aud-dl dd{margin:2px 0 0;color:var(--ink);font-size:var(--t-base);overflow-wrap:anywhere}
.aud-dl dd.vazio{color:var(--muted)}
.aud-trava{display:flex;gap:8px;align-items:center;font-size:var(--t-sm);color:var(--muted);padding:6px 0}
.aud-dupla{display:grid;grid-template-columns:1fr 1fr;gap:12px}
`

type Variante = 'success' | 'info' | 'danger' | 'muted' | 'warning'

const SITUACAO: Record<SituacaoDocumento, { rotulo: string; variante: Variante }> = {
  nao_pedido: { rotulo: 'Não pedido', variante: 'muted' },
  falta: { rotulo: 'Falta enviar', variante: 'danger' },
  // Enviado pelo auditor no App, esperando a B+ (24/11/2026, 0072).
  em_analise: { rotulo: 'Aguardando aprovação', variante: 'warning' },
  em_dia: { rotulo: 'Em dia', variante: 'success' },
  vence: { rotulo: 'Vence em breve', variante: 'warning' },
  vencido: { rotulo: 'Vencido', variante: 'danger' },
}

const GERAL: Record<SituacaoGeral, { rotulo: string; variante: Variante }> = {
  pendente: { rotulo: 'Com pendência', variante: 'danger' },
  analise: { rotulo: 'Aguardando aprovação', variante: 'warning' },
  vence: { rotulo: 'Vence em breve', variante: 'warning' },
  em_dia: { rotulo: 'Documentos em dia', variante: 'success' },
  sem: { rotulo: 'Nenhum documento', variante: 'muted' },
}

const tipoAuditor = (t: string | null) =>
  t === 'M' ? 'Médico(a) auditor(a)' : t === 'E' ? 'Enfermeiro(a) auditor(a)' : 'Auditor(a)'

const semAcento = (s: string) => s.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu, '')

// O endereço da ficha leva o nome do auditor: /auditores/ana-paula-souza. Dois
// auditores com o mesmo nome levam o id no fim (ana-paula-souza-12).
const slugDoNome = (nome: string) => semAcento(nome).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'auditor'

function enderecosDosAuditores(lista: Auditor[]): Map<number, string> {
  const vezes = new Map<string, number>()
  for (const a of lista) vezes.set(slugDoNome(a.nome), (vezes.get(slugDoNome(a.nome)) ?? 0) + 1)
  return new Map(lista.map((a) => {
    const base = slugDoNome(a.nome)
    return [a.id, (vezes.get(base) ?? 0) > 1 ? `${base}-${a.id}` : base]
  }))
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

function detalheResumo(r: ResumoDocumentos): string {
  return [
    r.falta > 0 && plural(r.falta, 'falta enviar', 'faltam enviar'),
    r.vencido > 0 && plural(r.vencido, 'vencido', 'vencidos'),
    r.vence > 0 && plural(r.vence, 'vence em breve', 'vencem em breve'),
    r.em_dia > 0 && plural(r.em_dia, 'em dia', 'em dia'),
  ].filter(Boolean).join(' · ')
}

function tamanho(bytes: number | null): string {
  if (!bytes) return ''
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function BotaoBaixar({ r, children }: { r: RegistroDocumento; children?: ReactNode }) {
  const [erro, setErro] = useState('')
  const [baixando, setBaixando] = useState(false)
  return (
    <>
      <button type="button" className="btn btn-outline btn-sm" disabled={baixando}
        title={r.arquivo_nome ?? undefined}
        onClick={() => {
          setBaixando(true)
          setErro('')
          baixarDocumento(r.id, r.nome_download || r.arquivo_nome || 'documento')
            .catch((e) => setErro((e as Error).message || 'Não foi possível baixar.'))
            .finally(() => setBaixando(false))
        }}>
        {baixando ? 'Baixando…' : children ?? 'Baixar'}
      </button>
      {erro && <div className="aud-erro">{erro}</div>}
    </>
  )
}

// ── Lista ────────────────────────────────────────────────────────────────

type FiltroTipo = '' | 'M' | 'E'
/** O filtro dos quadros: a situação dos documentos, ou "decisoes" (documento para aprovar ou ausência a decidir). */
type Filtro = SituacaoGeral | 'decisoes' | ''

function ListaDeAuditores() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useAuditores()
  const servicos = useServicosDosAuditores()
  const servicosDe = (id: number) => servicos.data?.servicos[String(id)] ?? []
  const [tipo, setTipo] = useState<FiltroTipo>('')
  // Quadros e filtro (24/11/2026, pedido do usuário: "no filtro do próprio auditor já pode ter essas duas decisões,
  // não precisa separar em abas"): "Decisões pendentes" acha quem tem documento enviado pelo App para aprovar ou
  // ausência para decidir; as duas decisões ficam na ficha dele. O antigo /modulo-2/ausencias chega com
  // ?filtro=decisoes.
  const [params] = useSearchParams()
  const [situacao, setSituacao] = useState<Filtro>(params.get('filtro') === 'decisoes' ? 'decisoes' : '')
  const [busca, setBusca] = useState('')

  usePageHeader(useMemo(() => ({
    title: 'Auditores',
    subtitle: 'Serviços, documentos e ausências de cada médico e enfermeiro auditor',
  }), []))
  const { role } = useAuth()
  const verAus = role != null && podeVer(role, 'ausencias')
  const aus = useAusencias(verAus)
  const ausAbertas = new Map<number, number>()
  for (const p of aus.data?.pedidos ?? []) {
    if (p.estado === 'pendente') ausAbertas.set(p.profissional_id, (ausAbertas.get(p.profissional_id) ?? 0) + 1)
  }

  const auditores = useMemo(() => data?.auditores ?? [], [data])
  const enderecos = useMemo(() => enderecosDosAuditores(auditores), [auditores])
  const fichaDe = (a: AuditorNaLista) => `/auditores/${enderecos.get(a.id) ?? a.id}`
  const docsParaAprovar = (a: AuditorNaLista) => a.resumo.em_analise ?? 0
  const decisoesDe = (a: AuditorNaLista) => docsParaAprovar(a) + (ausAbertas.get(a.id) ?? 0)
  const naSituacao = (a: AuditorNaLista, s: Filtro) => (s === 'decisoes' ? decisoesDe(a) > 0 : a.resumo.geral === s)
  const conta = (s: Filtro) => auditores.filter((a) => naSituacao(a, s)).length
  const termo = semAcento(busca.trim())
  const visiveis = auditores
    .filter((a) => !tipo || a.tipo === tipo)
    .filter((a) => !situacao || naSituacao(a, situacao))
    .filter((a) => !termo || semAcento(a.nome).includes(termo))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  const alterna = (s: Filtro) => setSituacao((v) => (v === s ? '' : s))

  if (isLoading) return <LoadingState />
  if (isError) {
    return <div className="card"><div className="aud-vazio">{(error as Error)?.message || 'Não foi possível carregar os auditores.'}</div></div>
  }

  return (
    <div>
      <style>{estilos}</style>
      {!data?.disponivel && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="aud-aviso">
            Os documentos dos auditores ainda não estão disponíveis.
          </div>
        </div>
      )}
      {/* Sem a faixa colorida à esquerda dos quadros (17/11/2026, pedido do usuário). */}
      <div className="kpi-grid aud-kpis" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <KpiCard label="Auditores" value={auditores.length}
          meta={`${auditores.filter((a) => a.tipo === 'M').length} médicos · ${auditores.filter((a) => a.tipo === 'E').length} enfermeiros`}
          active={situacao === ''} onClick={() => setSituacao('')} />
        <KpiCard label="Com pendência" value={conta('pendente')} variant={conta('pendente') ? 'danger' : 'neutral'}
          meta="documento faltando ou vencido" active={situacao === 'pendente'} onClick={() => alterna('pendente')} />
        <KpiCard label="Decisões pendentes" value={conta('decisoes')} variant={conta('decisoes') ? 'warning' : 'neutral'}
          meta={verAus ? 'documento para aprovar ou ausência a decidir' : 'documento enviado pelo App para aprovar'}
          active={situacao === 'decisoes'} onClick={() => alterna('decisoes')} />
        <KpiCard label={`Vencem em ${data?.vence_em_dias ?? 60} dias`} value={conta('vence')}
          variant={conta('vence') ? 'warning' : 'neutral'} meta="pedir antes de vencer"
          active={situacao === 'vence'} onClick={() => alterna('vence')} />
        <KpiCard label="Sem documento pedido" value={conta('sem')} meta="nada atribuído ainda"
          active={situacao === 'sem'} onClick={() => alterna('sem')} />
      </div>

      <div className="aud-filtros">
        <div className="aud-seg" role="group" aria-label="Filtrar por tipo">
          {([['', 'Todos'], ['M', 'Médicos'], ['E', 'Enfermeiros']] as const).map(([v, rot]) => (
            <button key={v} type="button" className={tipo === v ? 'ativo' : ''} aria-pressed={tipo === v}
              onClick={() => setTipo(v)}>{rot}</button>
          ))}
        </div>
        <input className="bm-input aud-busca" placeholder="Buscar auditor" value={busca}
          onChange={(e) => setBusca(e.target.value)} aria-label="Buscar auditor" />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflow: 'auto' }}>
          <table className="bmais-table" style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th>Auditor</th>
                <th>Serviços</th>
                <th>Documentos</th>
                <th>Decisões</th>
                <th>Último recebido</th>
                <th style={{ width: 1 }}></th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((a: AuditorNaLista) => (
                <tr key={a.id} className="aud-linha" onClick={() => navigate(fichaDe(a))}>
                  <td>
                    <div className="aud-nome">{a.nome}</div>
                    <div className="aud-sub">{tipoAuditor(a.tipo)}</div>
                  </td>
                  <td>
                    {servicosDe(a.id).length ? (
                      <div className="aud-servs">{servicosDe(a.id).map((s) => <Badge key={s} variant="muted">{s}</Badge>)}</div>
                    ) : servicos.isSuccess ? <span style={{ color: 'var(--muted-2)' }}>—</span> : null}
                  </td>
                  <td>
                    <Badge variant={GERAL[a.resumo.geral].variante}>{GERAL[a.resumo.geral].rotulo}</Badge>
                    {a.resumo.total > 0 && <div className="aud-sub">{detalheResumo(a.resumo)}</div>}
                  </td>
                  <td>
                    {decisoesDe(a) ? (
                      <div className="aud-decisoes">
                        {docsParaAprovar(a) > 0 && <Badge variant="warning">{plural(docsParaAprovar(a), 'documento para aprovar', 'documentos para aprovar')}</Badge>}
                        {(ausAbertas.get(a.id) ?? 0) > 0 && <Badge variant="warning">{plural(ausAbertas.get(a.id) ?? 0, 'ausência a decidir', 'ausências a decidir')}</Badge>}
                      </div>
                    ) : <span style={{ color: 'var(--muted-2)' }}>—</span>}
                  </td>
                  <td>{a.ultimo_envio ? dataHora(a.ultimo_envio).slice(0, 10) : <span style={{ color: 'var(--muted-2)' }}>—</span>}</td>
                  <td>
                    <Link to={fichaDe(a)} className="btn btn-outline btn-sm"
                      onClick={(e) => e.stopPropagation()}>Abrir</Link>
                  </td>
                </tr>
              ))}
              {visiveis.length === 0 && (
                <tr>
                  <td colSpan={6} className="aud-vazio">
                    {auditores.length === 0 ? 'Nenhum auditor ativo no cadastro.' : 'Nenhum auditor neste filtro.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Ficha ────────────────────────────────────────────────────────────────

// A observação para o auditor ao pedir um documento (24/11/2026, pedido do usuário: "foi mandado reenviar o
// arquivo mas não exibiu uma justificativa para o auditor, nem pediu uma observação"): obrigatória ao pedir de
// novo o que já tem arquivo; o auditor vê no App (Meus dados, Fazer agora e o aviso).
function CampoObservacao({ id, valor, onChange, obrigatoria, desabilitado }: {
  id: string
  valor: string
  onChange: (v: string) => void
  obrigatoria: boolean
  desabilitado: boolean
}) {
  return (
    <div className="aud-campo">
      <label className="form-lbl" htmlFor={id}>
        Observação para o auditor{!obrigatoria && <span style={{ fontWeight: 400, textTransform: 'none' }}> (se quiser)</span>}
      </label>
      <textarea id={id} className="bm-input aud-texto" value={valor} maxLength={500} disabled={desabilitado}
        placeholder="Por exemplo: a foto saiu cortada, mande o documento inteiro"
        onChange={(e) => onChange(e.target.value)} />
      <p className="aud-nota">
        {obrigatoria ? 'Obrigatória: o auditor vê no App por que precisa mandar de novo.' : 'O auditor vê esta observação no App.'}
      </p>
    </div>
  )
}

/** Pedir um documento ao auditor pela linha da Documentação: de novo (já tem arquivo, observação obrigatória)
 *  ou pela primeira vez (observação opcional). */
function PedirModal({ ficha, doc, onFechar, onFeito }: {
  ficha: FichaAuditor
  doc: DocumentoDoAuditor
  onFechar: () => void
  onFeito: (msg: string) => void
}) {
  const pedir = usePedirDocumentos(ficha.auditor.id)
  const [obs, setObs] = useState('')
  const [erro, setErro] = useState('')
  const deNovo = !!doc.arquivo
  const pronto = (!deNovo || letras(obs) >= 4) && !pedir.isPending
  function enviar() {
    if (!pronto) return
    setErro('')
    pedir.mutate({ tipos: [doc.tipo.id], observacao: obs.trim() || undefined }, {
      onSuccess: () => onFeito(`${doc.tipo.nome} pedido${deNovo ? ' de novo' : ''} a ${ficha.auditor.nome}`),
      onError: (e) => setErro((e as Error).message || 'Não foi possível pedir. Tente de novo.'),
    })
  }
  return (
    <Modal title={deNovo ? 'Pedir de novo' : 'Pedir ao auditor'} onClose={pedir.isPending ? () => {} : onFechar}
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onFechar} disabled={pedir.isPending}>Voltar</button>
          <button type="button" className="btn btn-primary" onClick={enviar} disabled={!pronto}>
            {pedir.isPending ? 'Pedindo…' : deNovo ? 'Pedir de novo' : 'Pedir'}
          </button>
        </>
      )}>
      <p style={{ margin: '0 0 12px', fontSize: 'var(--t-sm)', color: 'var(--ink-2)' }}>
        <strong>{doc.tipo.nome}</strong> de {ficha.auditor.nome}. Fica como &ldquo;falta enviar&rdquo; até o arquivo
        chegar{deNovo ? '; o arquivo atual continua no histórico' : ''}.
      </p>
      <CampoObservacao id="aud-pedir-obs" valor={obs} onChange={setObs} obrigatoria={deNovo} desabilitado={pedir.isPending} />
      {erro && <p className="aud-erro">{erro}</p>}
    </Modal>
  )
}

function SolicitarModal({ ficha, onFechar, onFeito }: {
  ficha: FichaAuditor
  onFechar: () => void
  onFeito: (msg: string) => void
}) {
  const pedir = usePedirDocumentos(ficha.auditor.id)
  const situacao = new Map(ficha.documentos.map((d) => [d.tipo.id, d.situacao]))
  // Padrão: os documentos do catálogo que vêm marcados e que o auditor ainda não
  // tem (nunca pedido ou vencido). O que está em dia fica desmarcado: marcar é
  // pedir a renovação.
  const [marcados, setMarcados] = useState<Set<number>>(() => new Set(ficha.catalogo
    .filter((t) => t.padrao && !t.em_aberto
      && ['nao_pedido', 'vencido'].includes(situacao.get(t.id) ?? 'nao_pedido'))
    .map((t) => t.id)))
  const nota = (t: FichaAuditor['catalogo'][number]) => {
    if (t.em_aberto) return ' · já pedido, falta enviar'
    const s = situacao.get(t.id)
    return s === 'em_dia' ? ' · recebido, em dia' : s === 'vence' ? ' · recebido, vence em breve'
      : s === 'vencido' ? ' · vencido' : ''
  }
  const [erro, setErro] = useState('')
  const [obs, setObs] = useState('')
  // Pedir de novo algum que já tem arquivo exige a observação (24/11/2026).
  const temArquivo = new Set(ficha.documentos.filter((d) => d.arquivo).map((d) => d.tipo.id))
  const exige = [...marcados].some((tid) => temArquivo.has(tid))
  const alterna = (id: number) => setMarcados((s) => {
    const n = new Set(s)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    return n
  })
  const grupo = (filtro: (t: TipoDocumento) => boolean, titulo: string) => {
    const itens = ficha.catalogo.filter(filtro)
    if (!itens.length) return null
    return (
      <>
        <div className="aud-grupo">{titulo}</div>
        {itens.map((t) => (
          <label key={t.id} className={`aud-check${t.em_aberto ? ' travado' : ''}`}>
            <input type="checkbox" checked={!t.em_aberto && marcados.has(t.id)} disabled={t.em_aberto || pedir.isPending}
              onChange={() => alterna(t.id)} />
            <span>{t.nome}<span style={{ color: 'var(--muted)' }}>{nota(t)}</span></span>
          </label>
        ))}
      </>
    )
  }
  const n = marcados.size
  function enviar() {
    setErro('')
    pedir.mutate({ tipos: [...marcados], observacao: obs.trim() || undefined }, {
      onSuccess: (r) => {
        const partes = [`${plural(r.pedidos.length, 'documento pedido', 'documentos pedidos')} a ${ficha.auditor.nome}`]
        if (r.ja_pedidos.length) partes.push(`${r.ja_pedidos.length} já estava${r.ja_pedidos.length > 1 ? 'm' : ''} pedido${r.ja_pedidos.length > 1 ? 's' : ''}`)
        onFeito(partes.join(' · '))
      },
      onError: (e) => setErro((e as Error).message || 'Não foi possível solicitar. Tente de novo.'),
    })
  }
  return (
    <Modal title="Solicitar documentos" onClose={onFechar}
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onFechar} disabled={pedir.isPending}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={enviar}
            disabled={!n || pedir.isPending || (exige && letras(obs) < 4)}>
            {pedir.isPending ? 'Solicitando…' : n ? `Solicitar ${plural(n, 'documento', 'documentos')}` : 'Solicitar'}
          </button>
        </>
      )}>
      <p style={{ margin: '0 0 12px', fontSize: 'var(--t-sm)', color: 'var(--ink-2)' }}>
        Pedido a <strong>{ficha.auditor.nome}</strong>. Cada documento fica como &ldquo;falta enviar&rdquo; até o
        arquivo ser registrado.
      </p>
      {grupo((t) => t.padrao && t.dono === 'auditor', 'Do auditor')}
      {grupo((t) => t.padrao && t.dono === 'empresa', 'Da empresa')}
      {grupo((t) => !t.padrao, 'Outros documentos')}
      {ficha.catalogo.length === 0 && <p className="aud-nota">Nenhum documento no catálogo para este auditor.</p>}
      <div style={{ marginTop: 12 }}>
        <CampoObservacao id="aud-solicitar-obs" valor={obs} onChange={setObs} obrigatoria={exige} desabilitado={pedir.isPending} />
      </div>
      {erro && <p className="aud-erro">{erro}</p>}
    </Modal>
  )
}

// "Outros documentos" (17/11/2026): o Operacional pede ao auditor um documento
// fora da documentação padrão, pelo nome. O nome que já está no catálogo pede
// o mesmo documento, com a regra de validade dele.
function InserirModal({ ficha, onFechar, onFeito }: {
  ficha: FichaAuditor
  onFechar: () => void
  onFeito: (msg: string) => void
}) {
  const inserir = useInserirDocumento(ficha.auditor.id)
  const [nome, setNome] = useState('')
  const [vence, setVence] = useState(false)
  const [erro, setErro] = useState('')
  const [obs, setObs] = useState('')
  const limpo = nome.trim().replace(/\s+/g, ' ')
  const existente = limpo ? ficha.catalogo.find((t) => semAcento(t.nome) === semAcento(limpo)) : undefined
  const pronto = !!limpo && !existente?.em_aberto && !inserir.isPending
  function enviar() {
    if (!pronto) return
    setErro('')
    inserir.mutate({ nome: limpo, comValidade: existente ? existente.com_validade : vence, observacao: obs.trim() || undefined }, {
      onSuccess: (r) => onFeito(r.pedidos.length ? `${r.tipo_nome} pedido a ${ficha.auditor.nome}` : `${r.tipo_nome} já estava pedido`),
      onError: (e) => setErro((e as Error).message || 'Não foi possível pedir. Tente de novo.'),
    })
  }
  return (
    <Modal title="Inserir documento" onClose={inserir.isPending ? () => {} : onFechar}
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onFechar} disabled={inserir.isPending}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={enviar} disabled={!pronto}>
            {inserir.isPending ? 'Pedindo…' : 'Pedir ao auditor'}
          </button>
        </>
      )}>
      <p style={{ margin: '0 0 12px', fontSize: 'var(--t-sm)', color: 'var(--ink-2)' }}>
        Um documento fora da documentação padrão, pedido a <strong>{ficha.auditor.nome}</strong>. Fica como
        &ldquo;falta enviar&rdquo; até o arquivo chegar.
      </p>
      <div className="aud-campo">
        <label className="form-lbl" htmlFor="aud-novo-nome">Nome do documento</label>
        <input id="aud-novo-nome" className="bm-input" value={nome} maxLength={120} autoFocus
          disabled={inserir.isPending} placeholder="Ex.: Comprovante de vacinação"
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); enviar() } }} />
        {existente && (
          <p className="aud-nota">
            {existente.em_aberto
              ? 'Este documento já está pedido a este auditor.'
              : `Já existe ${existente.padrao ? 'na documentação padrão' : 'no catálogo'}: será pedido o mesmo documento.`}
          </p>
        )}
      </div>
      <label className={`aud-check${existente ? ' travado' : ''}`}>
        <input type="checkbox" checked={existente ? existente.com_validade : vence}
          disabled={!!existente || inserir.isPending} onChange={(e) => setVence(e.target.checked)} />
        <span>Este documento vence: pedir a validade ao receber</span>
      </label>
      <p className="aud-nota">O nome fica salvo para pedir a outros auditores em &ldquo;Solicitar documentos&rdquo;.</p>
      <div style={{ marginTop: 12 }}>
        <CampoObservacao id="aud-inserir-obs" valor={obs} onChange={setObs} obrigatoria={false} desabilitado={inserir.isPending} />
      </div>
      {erro && <p className="aud-erro">{erro}</p>}
    </Modal>
  )
}

function ReceberModal({ ficha, doc, onFechar, onFeito }: {
  ficha: FichaAuditor
  doc: DocumentoDoAuditor
  onFechar: () => void
  onFeito: (msg: string) => void
}) {
  const receber = useReceberDocumento(ficha.auditor.id)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [validade, setValidade] = useState('')
  const [erro, setErro] = useState('')
  const exigeValidade = doc.tipo.com_validade
  const pronto = !!arquivo && (!exigeValidade || !!validade)
  function enviar() {
    if (!arquivo) return
    setErro('')
    receber.mutate({ tipoId: doc.tipo.id, arquivo, validade }, {
      onSuccess: () => onFeito(`${doc.tipo.nome} registrado`),
      onError: (e) => setErro((e as Error).message || 'Não foi possível registrar. Tente de novo.'),
    })
  }
  return (
    <Modal title="Registrar documento recebido" onClose={onFechar}
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onFechar} disabled={receber.isPending}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={enviar} disabled={!pronto || receber.isPending}>
            {receber.isPending ? 'Registrando…' : 'Registrar'}
          </button>
        </>
      )}>
      <p style={{ margin: '0 0 12px', fontSize: 'var(--t-sm)', color: 'var(--ink-2)' }}>
        <strong>{doc.tipo.nome}</strong> de {ficha.auditor.nome}.
        {doc.pedido ? ' Atende o pedido em aberto.' : doc.arquivo ? ' O arquivo anterior fica no histórico.' : ''}
      </p>
      <div className="aud-campo">
        <label className="form-lbl" htmlFor="aud-arquivo">Arquivo</label>
        <input id="aud-arquivo" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,image/*"
          disabled={receber.isPending} onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
        <p className="aud-nota">PDF ou foto, até 25 MB.</p>
      </div>
      <div className="aud-campo">
        <label className="form-lbl" htmlFor="aud-validade">
          Validade{!exigeValidade && <span style={{ fontWeight: 400, textTransform: 'none' }}> (se tiver)</span>}
        </label>
        <input id="aud-validade" type="date" className="bm-input" value={validade} disabled={receber.isPending}
          onChange={(e) => setValidade(e.target.value)} style={{ maxWidth: 200 }} />
        {exigeValidade && <p className="aud-nota">Este documento vence: a validade é obrigatória.</p>}
      </div>
      {erro && <p className="aud-erro">{erro}</p>}
    </Modal>
  )
}

const letras = (t: string) => (t.match(/\p{L}/gu) ?? []).length

/** Recusar o documento enviado pelo App (24/11/2026, 0072): o motivo é obrigatório; o documento volta a ser
 *  pedido ao auditor, que vê o motivo no App e manda de novo. */
function RecusarModal({ ficha, doc, onFechar, onFeito }: {
  ficha: FichaAuditor
  doc: DocumentoDoAuditor
  onFechar: () => void
  onFeito: (msg: string) => void
}) {
  const recusar = useRecusarDocumento()
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  const pronto = letras(motivo) >= 4
  function enviar() {
    if (!doc.arquivo || !pronto) return
    setErro('')
    recusar.mutate({ documentoId: doc.arquivo.id, motivo: motivo.trim() }, {
      onSuccess: () => onFeito(`${doc.tipo.nome} recusado: o auditor vê o motivo no App`),
      onError: (e) => setErro((e as Error).message || 'Não foi possível recusar. Tente de novo.'),
    })
  }
  return (
    <Modal title="Recusar documento" onClose={recusar.isPending ? () => {} : onFechar}
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onFechar} disabled={recusar.isPending}>Voltar</button>
          <button type="button" className="btn aud-perigo" onClick={enviar} disabled={!pronto || recusar.isPending}>
            {recusar.isPending ? 'Recusando…' : 'Recusar'}
          </button>
        </>
      )}>
      <p style={{ margin: '0 0 12px', fontSize: 'var(--t-sm)', color: 'var(--ink-2)' }}>
        <strong>{doc.tipo.nome}</strong> de {ficha.auditor.nome}. O documento volta a &ldquo;falta enviar&rdquo; e o
        auditor vê o motivo no App para mandar de novo.
      </p>
      <div className="aud-campo">
        <label className="form-lbl" htmlFor="aud-recusa">Motivo da recusa</label>
        <textarea id="aud-recusa" className="bm-input aud-texto" value={motivo} maxLength={500} autoFocus
          placeholder="Por exemplo: foto ilegível, documento vencido, enviou outro documento"
          disabled={recusar.isPending} onChange={(e) => setMotivo(e.target.value)} />
      </div>
      {erro && <p className="aud-erro">{erro}</p>}
    </Modal>
  )
}

// Uma linha da Documentação (24/11/2026, a ficha é para aprovar): a situação com o que explica (pedido, recusa,
// aguardando); à direita, primeiro o que decide (Conferir, Recusar, Aprovar) e o resto no menu "⋮".
type AcoesDoc = {
  onPedir: (d: DocumentoDoAuditor) => void
  onReceber: (d: DocumentoDoAuditor) => void
  onCancelar: (d: DocumentoDoAuditor) => void
  onAprovar: (d: DocumentoDoAuditor) => void
  onRecusar: (d: DocumentoDoAuditor) => void
}

function LinhaDocumento({ d, gerir, decide, pedindo, acoes }: {
  d: DocumentoDoAuditor
  gerir: boolean
  /** O banco tem a aprovação (0072): dá para aprovar e recusar com motivo. */
  decide: boolean
  pedindo: boolean
  acoes: AcoesDoc
}) {
  const sit = SITUACAO[d.situacao] ?? SITUACAO.em_dia
  const a = d.arquivo
  const aguardando = d.situacao === 'em_analise' && a?.aprovacao === 'pendente'
  const menu: ItemMenu[] = !gerir ? [] : [
    ...(d.pedido ? [] : [{ rotulo: a ? 'Pedir de novo' : 'Pedir ao auditor', onClick: () => acoes.onPedir(d), desabilitado: pedindo }]),
    { rotulo: a ? 'Registrar nova versão recebida' : 'Registrar recebido pela B+', onClick: () => acoes.onReceber(d) },
    ...(d.pedido ? [{ rotulo: 'Cancelar pedido', onClick: () => acoes.onCancelar(d), perigo: true }] : []),
  ]
  return (
    <tr className={aguardando ? 'aud-linha-dec' : undefined}>
      <td>
        <div className="aud-nome" style={{ fontWeight: 550 }}>{d.tipo.nome}</div>
        <div className="aud-sub">{d.tipo.dono === 'empresa' ? 'Da empresa' : 'Do auditor'}{d.tipo.padrao ? '' : ' · fora do padrão'}</div>
      </td>
      <td>
        <Badge variant={sit.variante}>{sit.rotulo}</Badge>
        {d.recusa ? (
          <div className="aud-recusa">
            Recusado em {dataHora(d.recusa.aprovacao_em ?? null).slice(0, 10)}
            {d.recusa.aprovacao_por_nome && ` por ${d.recusa.aprovacao_por_nome}`}: {d.recusa.recusa_motivo}
          </div>
        ) : d.pedido ? (
          <div className="aud-sub">
            pedido em {dataHora(d.pedido.pedido_em).slice(0, 10)}
            {d.pedido.pedido_por_nome && ` por ${d.pedido.pedido_por_nome}`}
            {d.pedido.pedido_observacao && <div className="aud-obs">&ldquo;{d.pedido.pedido_observacao}&rdquo;</div>}
          </div>
        ) : aguardando ? <div className="aud-sub">confira o arquivo e decida</div> : null}
      </td>
      <td>
        {a ? (
          <>
            <div className="aud-arq">{dataHora(a.enviado_em).slice(0, 10)}{a.enviado_via === 'app' ? ' · App' : ''}</div>
            <div className="aud-sub aud-arq">{a.validade ? `até ${dataBR(a.validade)}` : 'sem validade'}</div>
          </>
        ) : <span className="aud-sub">—</span>}
      </td>
      <td>
        <div className="aud-acoes">
          {a?.tem_arquivo && <BotaoBaixar r={a}>{aguardando ? 'Conferir' : 'Ver arquivo'}</BotaoBaixar>}
          {gerir && decide && a && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => acoes.onRecusar(d)}>Recusar</button>
          )}
          {gerir && decide && aguardando && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => acoes.onAprovar(d)}>Aprovar</button>
          )}
          {/* Aguardando aprovação, a linha é só para decidir: sem o "⋮". */}
          {menu.length > 0 && !(aguardando && decide) && <MenuAcoes rotulo={`Mais ações: ${d.tipo.nome}`} itens={menu} />}
        </div>
      </td>
    </tr>
  )
}

function TabelaDocumentos({ docs, gerir, decide, pedindo, acoes }: {
  docs: DocumentoDoAuditor[]
  gerir: boolean
  decide: boolean
  pedindo: boolean
  acoes: AcoesDoc
}) {
  return (
    <div style={{ overflow: 'auto' }}>
      <table className="bmais-table aud-grade" style={{ minWidth: 640 }}>
        <thead>
          <tr>
            <th style={{ width: '22%' }}>Documento</th>
            <th style={{ width: '24%' }}>Situação</th>
            <th style={{ width: '19%' }}>Arquivo</th>
            <th style={{ width: '35%' }}></th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => <LinhaDocumento key={d.tipo.id} d={d} gerir={gerir} decide={decide} pedindo={pedindo} acoes={acoes} />)}
          {docs.length === 0 && (
            <tr><td colSpan={4} className="aud-vazio">Nenhum documento pedido a este auditor.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function ItemHistorico({ r }: { r: RegistroDocumento }) {
  const linhas = [
    r.pedido_em && (r.pedido_padrao
      ? `Pedido automático (documentação padrão) em ${dataHora(r.pedido_em)}`
      : `Pedido em ${dataHora(r.pedido_em)}${r.pedido_por_nome ? ` por ${r.pedido_por_nome}` : ''}`),
    r.pedido_observacao && `Observação para o auditor: ${r.pedido_observacao}`,
    r.enviado_em && `Recebido em ${dataHora(r.enviado_em)}${r.enviado_por_nome ? ` por ${r.enviado_por_nome}` : ''}${r.enviado_via === 'app' ? ' pelo App' : ''}`,
    r.validade && `Validade ${dataBR(r.validade)}`,
    r.aprovacao === 'pendente' && 'Aguardando aprovação da B+',
    r.aprovacao === 'aprovado' && r.aprovacao_em && r.enviado_via === 'app'
      && `Aprovado em ${dataHora(r.aprovacao_em)}${r.aprovacao_por_nome ? ` por ${r.aprovacao_por_nome}` : ''}`,
    r.aprovacao === 'recusado' && r.aprovacao_em
      && `Recusado em ${dataHora(r.aprovacao_em)}${r.aprovacao_por_nome ? ` por ${r.aprovacao_por_nome}` : ''}: ${r.recusa_motivo ?? ''}`,
    r.cancelado_em && `Pedido cancelado em ${dataHora(r.cancelado_em)}${r.cancelado_por_nome ? ` por ${r.cancelado_por_nome}` : ''}`,
  ].filter(Boolean)
  return (
    <div className="aud-hist-item">
      <div style={{ minWidth: 0 }}>
        <div className="aud-nome" style={{ fontWeight: 550 }}>{r.tipo_nome}</div>
        {linhas.map((l) => <div key={l as string} className="aud-sub">{l}</div>)}
        {r.arquivo_nome && <div className="aud-sub">{r.arquivo_nome}{r.arquivo_bytes ? ` · ${tamanho(r.arquivo_bytes)}` : ''}</div>}
      </div>
      {r.tem_arquivo && <div><BotaoBaixar r={r} /></div>}
    </div>
  )
}

// ── Cadastro e contrato (17/11/2026, migration 0065) ─────────────────────
// A empresa e o registro do auditor: quem cuida do cadastro edita (coordenação
// operacional, gestão, diretoria, admin). O contrato e a remuneração: só a
// diretoria vê e edita (o servidor nem manda o contrato aos demais). No App, os
// dois aparecem em Meus dados (a senha de desbloqueio do App saiu em 27/11/2026).

const nulo = (v: string) => v.trim() || null
const soDigitos = (v: string) => v.replace(/\D/g, '')

function Campo({ rotulo, valor }: { rotulo: string; valor: ReactNode }) {
  const vazio = valor === null || valor === undefined || valor === ''
  return (
    <div>
      <dt>{rotulo}</dt>
      <dd className={vazio ? 'vazio' : undefined}>{vazio ? 'não informado' : valor}</dd>
    </div>
  )
}

function Atualizado({ em, por }: { em: string | null; por: string | null }) {
  if (!em) return null
  return <p className="aud-nota">Atualizado{por ? ` por ${por}` : ''} em {dataHora(em)}</p>
}

const rotuloRegistro = (tipo: string | null) => (tipo === 'M' ? 'Registro (CRM)' : tipo === 'E' ? 'Registro (COREN)' : 'Registro')

function CadastroModal({ id, tipo, dados, onFechar, onFeito }: {
  id: number
  tipo: string | null
  dados: CadastroEContrato
  onFechar: () => void
  onFeito: (msg: string) => void
}) {
  const salvar = useSalvarCadastroAuditor(id)
  const c = dados.cadastro
  const [registro, setRegistro] = useState(c.registro ?? '')
  const [uf, setUf] = useState(c.uf ?? '')
  const [razao, setRazao] = useState(c.empresa_razao_social ?? '')
  const [cnpj, setCnpj] = useState(c.empresa_cnpj ?? '')
  const [erro, setErro] = useState('')
  const ufOk = !uf.trim() || /^[A-Za-z]{2}$/.test(uf.trim())
  const cnpjOk = !cnpj.trim() || soDigitos(cnpj).length === 14
  function enviar() {
    if (!ufOk) { setErro('A UF tem 2 letras, por exemplo SP.'); return }
    if (!cnpjOk) { setErro('O CNPJ tem 14 números.'); return }
    setErro('')
    salvar.mutate({
      registro: nulo(registro), uf: nulo(uf.toUpperCase()), empresa_razao_social: nulo(razao),
      empresa_cnpj: cnpj.trim() ? soDigitos(cnpj) : null,
    }, {
      onSuccess: () => onFeito('Cadastro salvo'),
      onError: (e) => setErro((e as Error).message || 'Não foi possível salvar. Tente de novo.'),
    })
  }
  return (
    <Modal title="Editar cadastro" onClose={salvar.isPending ? () => {} : onFechar}
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onFechar} disabled={salvar.isPending}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={enviar} disabled={salvar.isPending}>
            {salvar.isPending ? 'Salvando…' : 'Salvar'}
          </button>
        </>
      )}>
      <div className="aud-dupla aud-campo">
        <div>
          <label className="form-lbl" htmlFor="aud-registro">{rotuloRegistro(tipo)}</label>
          <input id="aud-registro" className="bm-input" value={registro} maxLength={60} disabled={salvar.isPending}
            placeholder={tipo === 'E' ? 'COREN-SP 123456' : 'CRM-SP 123456'} onChange={(e) => setRegistro(e.target.value)} />
        </div>
        <div>
          <label className="form-lbl" htmlFor="aud-uf">UF</label>
          <input id="aud-uf" className="bm-input" value={uf} maxLength={2} disabled={salvar.isPending}
            placeholder="SP" style={{ maxWidth: 90, textTransform: 'uppercase' }} onChange={(e) => setUf(e.target.value)} />
        </div>
      </div>
      <div className="aud-campo">
        <label className="form-lbl" htmlFor="aud-razao">Razão social da empresa</label>
        <input id="aud-razao" className="bm-input" value={razao} maxLength={200} disabled={salvar.isPending}
          onChange={(e) => setRazao(e.target.value)} />
      </div>
      <div className="aud-campo">
        <label className="form-lbl" htmlFor="aud-cnpj">CNPJ da empresa</label>
        <input id="aud-cnpj" className="bm-input" value={cnpj} maxLength={20} inputMode="numeric" disabled={salvar.isPending}
          placeholder="00.000.000/0000-00" style={{ maxWidth: 240 }} onChange={(e) => setCnpj(e.target.value)} />
      </div>
      <p className="aud-nota">Todos os campos são opcionais. O auditor vê no App, em Meus dados.</p>
      {erro && <p className="aud-erro">{erro}</p>}
    </Modal>
  )
}

function ContratoModal({ id, dados, onFechar, onFeito }: {
  id: number
  dados: CadastroEContrato
  onFechar: () => void
  onFeito: (msg: string) => void
}) {
  const salvar = useSalvarContratoAuditor(id)
  const c = dados.contrato
  const [numero, setNumero] = useState(c?.numero ?? '')
  const [modelo, setModelo] = useState(c?.modelo ?? '')
  const [desde, setDesde] = useState(c?.desde ?? '')
  const [aditivo, setAditivo] = useState(c?.aditivo ?? '')
  const [termo, setTermo] = useState(c?.termo_bradesco ?? '')
  const [erro, setErro] = useState('')
  // Um modelo gravado que saiu da lista continua na opção, para não sumir ao abrir.
  const modelos = modelo && !dados.modelos.includes(modelo) ? [...dados.modelos, modelo] : dados.modelos
  function enviar() {
    setErro('')
    salvar.mutate({
      numero: nulo(numero), modelo: modelo || null, desde: desde || null, aditivo: aditivo || null,
      termo_bradesco: termo || null,
    }, {
      onSuccess: () => onFeito('Contrato salvo'),
      onError: (e) => setErro((e as Error).message || 'Não foi possível salvar. Tente de novo.'),
    })
  }
  return (
    <Modal title="Editar contrato" onClose={salvar.isPending ? () => {} : onFechar}
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onFechar} disabled={salvar.isPending}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={enviar} disabled={salvar.isPending}>
            {salvar.isPending ? 'Salvando…' : 'Salvar'}
          </button>
        </>
      )}>
      <div className="aud-dupla aud-campo">
        <div>
          <label className="form-lbl" htmlFor="aud-numero">Número do contrato</label>
          <input id="aud-numero" className="bm-input" value={numero} maxLength={60} disabled={salvar.isPending}
            placeholder="CT-2019-0101" onChange={(e) => setNumero(e.target.value)} />
        </div>
        <div>
          <label className="form-lbl" htmlFor="aud-modelo">Modelo de remuneração</label>
          <select id="aud-modelo" className="bm-input bm-select" value={modelo} disabled={salvar.isPending}
            onChange={(e) => setModelo(e.target.value)}>
            <option value="">Não informado</option>
            {modelos.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div className="aud-dupla aud-campo">
        <div>
          <label className="form-lbl" htmlFor="aud-desde">Desde</label>
          <input id="aud-desde" type="date" className="bm-input" value={desde} disabled={salvar.isPending}
            onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div>
          <label className="form-lbl" htmlFor="aud-aditivo">Último aditivo</label>
          <input id="aud-aditivo" type="date" className="bm-input" value={aditivo} disabled={salvar.isPending}
            onChange={(e) => setAditivo(e.target.value)} />
        </div>
      </div>
      <div className="aud-campo">
        <label className="form-lbl" htmlFor="aud-termo">Termo Bradesco assinado em</label>
        <input id="aud-termo" type="date" className="bm-input" value={termo} disabled={salvar.isPending}
          style={{ maxWidth: 200 }} onChange={(e) => setTermo(e.target.value)} />
        <p className="aud-nota">Deixe em branco se ainda não assinou ou se não atende Bradesco.</p>
      </div>
      {erro && <p className="aud-erro">{erro}</p>}
    </Modal>
  )
}

function CadastroEContratoCard({ id, tipo, onAviso }: {
  id: number
  tipo: string | null
  onAviso: (msg: string) => void
}) {
  const { data, isLoading, isError, error } = useCadastroAuditor(id)
  const [editando, setEditando] = useState<'cadastro' | 'contrato' | null>(null)
  const cabecalho = (
    <div className="card-header">
      <div>
        <div className="card-title">Cadastro e contrato</div>
        <p className="card-sub">A empresa e o registro do auditor; o contrato só a diretoria vê.</p>
      </div>
    </div>
  )
  if (isLoading) return <div className="card" style={{ marginBottom: 14 }}>{cabecalho}<LoadingState /></div>
  if (isError || !data) {
    return (
      <div className="card" style={{ marginBottom: 14 }}>
        {cabecalho}
        <div className="aud-vazio">{(error as Error)?.message || 'Não foi possível carregar o cadastro.'}</div>
      </div>
    )
  }
  const c = data.cadastro
  const k = data.contrato
  const feito = (m: string) => { setEditando(null); onAviso(m) }
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      {cabecalho}
      <div className="card-body">
        {!data.disponivel && (
          <p className="aud-nota" style={{ margin: '0 0 12px' }}>
            O cadastro e o contrato ainda não estão disponíveis.
          </p>
        )}
        <div className="aud-cad">
          <div>
            <div className="aud-cad-topo">
              <div className="aud-grupo">Cadastro</div>
              {data.pode_editar_cadastro && data.disponivel && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditando('cadastro')}>Editar</button>
              )}
            </div>
            <dl className="aud-dl">
              <Campo rotulo={rotuloRegistro(tipo)} valor={c.registro} />
              <Campo rotulo="UF" valor={c.uf} />
              <Campo rotulo="Empresa" valor={c.empresa_razao_social} />
              <Campo rotulo="CNPJ" valor={c.empresa_cnpj} />
            </dl>
            <Atualizado em={c.atualizado_em} por={c.atualizado_por_nome} />
          </div>
          <div>
            <div className="aud-cad-topo">
              <div className="aud-grupo">Contrato</div>
              {data.pode_ver_contrato && data.pode_editar_contrato && data.disponivel && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditando('contrato')}>Editar</button>
              )}
            </div>
            {data.pode_ver_contrato && k ? (
              <>
                <dl className="aud-dl">
                  <Campo rotulo="Número" valor={k.numero} />
                  <Campo rotulo="Remuneração" valor={k.modelo} />
                  <Campo rotulo="Desde" valor={k.desde ? dataBR(k.desde) : null} />
                  <Campo rotulo="Último aditivo" valor={k.aditivo ? dataBR(k.aditivo) : null} />
                  <Campo rotulo="Termo Bradesco" valor={k.termo_bradesco ? dataBR(k.termo_bradesco) : null} />
                </dl>
                <Atualizado em={k.atualizado_em} por={k.atualizado_por_nome} />
              </>
            ) : (
              <div className="aud-trava">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                Contrato e remuneração: só a diretoria vê.
              </div>
            )}
          </div>
        </div>
      </div>
      {editando === 'cadastro' && (
        <CadastroModal id={id} tipo={tipo} dados={data} onFechar={() => setEditando(null)} onFeito={feito} />
      )}
      {editando === 'contrato' && (
        <ContratoModal id={id} dados={data} onFechar={() => setEditando(null)} onFeito={feito} />
      )}
    </div>
  )
}

// Serviços e produção do mês (coluna da direita da ficha, 24/11/2026): os serviços que ele faz e, de cada um, o que
// produziu no mês (como os quadros da ficha do prestador do protótipo).
function ServicosEProducao({ servicos, prod }: {
  servicos: string[]
  prod: { mes: string; senhas?: number | null; contas?: number | null; pacientes?: number | null } | undefined
}) {
  const linhas = [
    prod?.pacientes != null && ['Pacientes visitados', prod.pacientes] as const,
    prod?.senhas != null && ['Senhas lançadas', prod.senhas] as const,
    prod?.contas != null && ['Contas finalizadas', prod.contas] as const,
  ].filter(Boolean) as (readonly [string, number])[]
  return (
    <div className="card">
      <div className="card-header"><div><div className="card-title">Serviços{prod ? ` e produção em ${prod.mes}` : ''}</div></div></div>
      <div className="card-body aud-prod">
        {servicos.length
          ? <div className="aud-servs">{servicos.map((s) => <Badge key={s} variant="info">{s}</Badge>)}</div>
          : <div className="aud-sub">Nenhum serviço na agenda de serviços.</div>}
        {linhas.map(([rot, n]) => (
          <div key={rot} className="aud-prod-l"><span>{rot}</span><b>{n}</b></div>
        ))}
      </div>
    </div>
  )
}

// "Hospitais e serviços" da ficha do prestador do protótipo: uma linha por
// hospital, as operadoras e os serviços dos postos vigentes.
function HospitaisEServicos({ id }: { id: number }) {
  const { data, isLoading, isError, error } = useAgendaDoAuditor(id)
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-header"><div><div className="card-title">Hospitais e serviços</div></div></div>
      {isLoading ? <LoadingState /> : isError || !data ? (
        <div className="aud-vazio">{(error as Error)?.message || 'Não foi possível carregar os postos.'}</div>
      ) : (
        // Uma linha por hospital (lista, na coluna da direita da ficha).
        <div className="aud-lista">
          {data.hospitais.map((h) => (
            <div key={h.hospital_key} className="aud-lista-i">
              <div style={{ minWidth: 0 }}>
                <div className="aud-nome">{h.hospital_nome}</div>
                <div className="aud-sub">{[[h.cidade, h.uf].filter(Boolean).join(', '), h.operadoras.join(', ')].filter(Boolean).join(' · ')}</div>
              </div>
              <div className="aud-servs">{h.servicos.map((s) => <Badge key={s} variant="info">{s}</Badge>)}</div>
            </div>
          ))}
          {data.hospitais.length === 0 && <div className="aud-vazio">Sem posto vigente.</div>}
        </div>
      )}
    </div>
  )
}

function FichaDoAuditor({ id }: { id: number }) {
  const { data, isLoading, isError, error } = useFichaAuditor(id)
  // As ausências dele na ficha (24/11/2026): a decisão fica junto dos documentos.
  const { role } = useAuth()
  const verAus = role != null && podeVer(role, 'ausencias')
  const aus = useAusencias(verAus)
  const agenda = useAgendaDoAuditor(id)
  const prod = agenda.data?.producao
  const pedir = usePedirDocumentos(id)
  const cancelar = useCancelarPedidoDocumento()
  const aprovar = useAprovarDocumento()
  const [aprovando, setAprovando] = useState<DocumentoDoAuditor | null>(null)
  const [recusando, setRecusando] = useState<DocumentoDoAuditor | null>(null)
  const [solicitando, setSolicitando] = useState(false)
  const [inserindo, setInserindo] = useState(false)
  const [recebendo, setRecebendo] = useState<DocumentoDoAuditor | null>(null)
  const [cancelando, setCancelando] = useState<DocumentoDoAuditor | null>(null)
  const [aviso, setAviso] = useState('')
  const gerir = !!data?.pode_gerir && !!data?.disponivel

  const nome = data?.auditor.nome
  const tipo = data?.auditor.tipo ?? null
  const acoes = useMemo(() => (gerir ? (
    <button type="button" className="btn btn-primary btn-sm" onClick={() => setSolicitando(true)}>
      Solicitar documentos
    </button>
  ) : undefined), [gerir])
  usePageHeader(useMemo(() => ({
    title: nome || 'Auditor',
    subtitle: nome ? `${tipoAuditor(tipo)} · documentos e ausências` : 'Documentos e ausências do auditor',
    actions: acoes,
  }), [nome, tipo, acoes]))

  // Pedir pela linha abre a janela com a observação para o auditor (24/11/2026).
  const [pedindoDoc, setPedindoDoc] = useState<DocumentoDoAuditor | null>(null)
  const pedirUm = (d: DocumentoDoAuditor) => setPedindoDoc(d)
  function confirmarCancelamento() {
    const p = cancelando?.pedido
    if (!p) return
    cancelar.mutate(p.id, {
      onSuccess: () => { setCancelando(null); setAviso('Pedido cancelado') },
      onError: (e) => { setCancelando(null); setAviso((e as Error).message || 'Não foi possível cancelar.') },
    })
  }

  function confirmarAprovacao() {
    const a = aprovando?.arquivo
    if (!a) return
    aprovar.mutate(a.id, {
      onSuccess: () => { setAprovando(null); setAviso(`${aprovando?.tipo.nome} aprovado`) },
      onError: (e) => { setAprovando(null); setAviso((e as Error).message || 'Não foi possível aprovar.') },
    })
  }

  const voltar = <Link to="/auditores" className="aud-voltar">← Todos os auditores</Link>
  if (isLoading) return <LoadingState />
  if (isError || !data) {
    return (
      <div>
        <style>{estilos}</style>
        {voltar}
        <div className="card"><div className="aud-vazio">{(error as Error)?.message || 'Não foi possível carregar o auditor.'}</div></div>
      </div>
    )
  }
  const r = data.resumo
  const decide = gerir && !!data.aprovacao_disponivel
  const acoesDoc: AcoesDoc = {
    onPedir: pedirUm, onReceber: setRecebendo, onCancelar: setCancelando, onAprovar: setAprovando, onRecusar: setRecusando,
  }
  // "Para decidir" (24/11/2026, pedido do usuário: "essa tela precisa ser mais no sentido de aprovar a
  // documentação"): os documentos que o auditor mandou pelo App e esperam a B+, e as ausências a decidir.
  const docsADecidir = data.documentos.filter((d) => d.situacao === 'em_analise' && d.arquivo?.aprovacao === 'pendente')
  const pedidosAus = (aus.data?.pedidos ?? []).filter((p) => p.profissional_id === id)
  const ausADecidir = pedidosAus.filter((p) => p.estado === 'pendente')
  const nDecidir = docsADecidir.length + ausADecidir.length
  const resumoDocs = [
    r.em_dia > 0 && plural(r.em_dia, 'em dia', 'em dia'),
    (r.em_analise ?? 0) > 0 && plural(r.em_analise ?? 0, 'aguardando aprovação', 'aguardando aprovação'),
    r.vence > 0 && plural(r.vence, 'vence em breve', 'vencem em breve'),
    r.vencido > 0 && plural(r.vencido, 'vencido', 'vencidos'),
    r.falta > 0 && plural(r.falta, 'falta enviar', 'faltam enviar'),
  ].filter(Boolean).join(' · ')
  return (
    <div>
      <style>{estilos}</style>
      {voltar}
      {!data.disponivel && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="aud-aviso">
            Os documentos dos auditores ainda não estão disponíveis.
          </div>
        </div>
      )}
      {/* Duas colunas (24/11/2026, pedido do usuário: "melhore a divisão dos componentes na tela do auditor"): à
          esquerda o que se decide e acompanha (Para decidir, Documentação, Ausências, Histórico); à direita quem é o
          auditor (serviços e produção do mês, hospitais, cadastro e contrato). Em tela estreita, uma coluna só. */}
      <div className="aud-ficha">
        <div className="aud-col">
      <div className={`card aud-dec${nDecidir ? ' tem' : ''}`} style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Para decidir{nDecidir ? ` · ${nDecidir}` : ''}</div>
            <p className="card-sub">
              Confira o arquivo e aprove, ou recuse dizendo o porquê: o auditor vê o motivo no App e manda de novo.
            </p>
          </div>
        </div>
        {gerir && !data.aprovacao_disponivel && (
          <div className="aud-dec-aviso">
            A aprovação de documentos ainda não está disponível. Por enquanto, o que o auditor envia pelo App entra
            aprovado e não dá para recusar com motivo.
          </div>
        )}
        {docsADecidir.map((d) => (
          <div key={d.tipo.id} className="aud-dec-item">
            <div className="aud-dec-tipo"><Badge variant="warning">Documento</Badge></div>
            <div className="aud-dec-txt">
              <div className="aud-dec-t">{d.tipo.nome}</div>
              <div className="aud-dec-s">
                {[d.arquivo && `enviado pelo App em ${dataHora(d.arquivo.enviado_em)}`,
                  d.arquivo?.validade ? `validade ${dataBR(d.arquivo.validade)}` : d.tipo.com_validade ? null : 'sem validade',
                  d.arquivo?.arquivo_nome && `${d.arquivo.arquivo_nome}${d.arquivo.arquivo_bytes ? ` (${tamanho(d.arquivo.arquivo_bytes)})` : ''}`]
                  .filter(Boolean).join(' · ')}
              </div>
            </div>
            <div className="aud-acoes">
              {d.arquivo?.tem_arquivo && <BotaoBaixar r={d.arquivo}>Conferir</BotaoBaixar>}
              {decide && <button type="button" className="btn btn-outline btn-sm" onClick={() => setRecusando(d)}>Recusar</button>}
              {decide && <button type="button" className="btn btn-primary btn-sm" onClick={() => setAprovando(d)}>Aprovar</button>}
            </div>
          </div>
        ))}
        {verAus && <AusenciasADecidir pedidos={ausADecidir} decide={!!aus.data?.pode_decidir && !!aus.data?.disponivel} />}
        {nDecidir === 0 && <div className="aud-dec-vazio">Nada para decidir agora.</div>}
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Documentação</div>
            <p className="card-sub">{resumoDocs || 'Nenhum documento pedido ainda.'}</p>
          </div>
          {gerir && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setInserindo(true)}>
              Pedir outro documento
            </button>
          )}
        </div>
        <TabelaDocumentos docs={data.documentos} gerir={gerir} decide={decide} pedindo={pedir.isPending} acoes={acoesDoc} />
      </div>

      {verAus && (
        <HistoricoAusencias pedidos={pedidosAus.filter((p) => p.estado !== 'pendente')} disponivel={!!aus.data?.disponivel} />
      )}

      <details className="card aud-det">
        <summary>
          <span className="card-title">Histórico dos documentos</span>
          <span className="card-sub">{plural(data.historico.length, 'registro', 'registros')}: cada pedido e cada arquivo recebido</span>
        </summary>
        <div className="card-body">
          {data.historico.length === 0
            ? <div className="aud-vazio">Nenhum documento pedido ou recebido ainda.</div>
            : <div className="aud-hist">{data.historico.map((h) => <ItemHistorico key={h.id} r={h} />)}</div>}
        </div>
      </details>

        </div>

        <aside className="aud-col aud-lado" aria-label="Sobre o auditor">
          <ServicosEProducao servicos={agenda.data?.servicos ?? []} prod={prod} />
          <HospitaisEServicos id={id} />
          <CadastroEContratoCard id={id} tipo={data.auditor.tipo} onAviso={setAviso} />
        </aside>
      </div>

      {solicitando && (
        <SolicitarModal ficha={data} onFechar={() => setSolicitando(false)}
          onFeito={(m) => { setSolicitando(false); setAviso(m) }} />
      )}
      {pedindoDoc && (
        <PedirModal ficha={data} doc={pedindoDoc} onFechar={() => setPedindoDoc(null)}
          onFeito={(m) => { setPedindoDoc(null); setAviso(m) }} />
      )}
      {inserindo && (
        <InserirModal ficha={data} onFechar={() => setInserindo(false)}
          onFeito={(m) => { setInserindo(false); setAviso(m) }} />
      )}
      {recebendo && (
        <ReceberModal ficha={data} doc={recebendo} onFechar={() => setRecebendo(null)}
          onFeito={(m) => { setRecebendo(null); setAviso(m) }} />
      )}
      {cancelando && (
        <ConfirmarModal titulo="Cancelar pedido" confirmar="Cancelar pedido" cancelar="Voltar"
          ocupado={cancelar.isPending} onConfirmar={confirmarCancelamento} onCancelar={() => setCancelando(null)}>
          O pedido de <strong>{cancelando.tipo.nome}</strong> a {data.auditor.nome} sai da lista de pendências.
          Fica registrado no histórico.
        </ConfirmarModal>
      )}
      {aprovando?.arquivo && (
        <ConfirmarModal titulo="Aprovar documento" confirmar="Aprovar" cancelar="Voltar"
          ocupado={aprovar.isPending} onConfirmar={confirmarAprovacao} onCancelar={() => setAprovando(null)}>
          <strong>{aprovando.tipo.nome}</strong> de {data.auditor.nome}, enviado pelo App em{' '}
          {dataHora(aprovando.arquivo.enviado_em).slice(0, 10)}
          {aprovando.arquivo.validade ? <>, validade <strong>{dataBR(aprovando.arquivo.validade)}</strong></> : null}.
          Aprovado, ele passa a valer na ficha e no App do auditor.
        </ConfirmarModal>
      )}
      {recusando?.arquivo && (
        <RecusarModal ficha={data} doc={recusando} onFechar={() => setRecusando(null)}
          onFeito={(m) => { setRecusando(null); setAviso(m) }} />
      )}
      {aviso && <Toast message={aviso} onDone={() => setAviso('')} />}
    </div>
  )
}

// /auditores/:auditor: acha o auditor pelo nome do endereço na lista. Um número
// (endereço antigo ou auditor fora da lista, como um inativo) abre pelo id e,
// achando o auditor na lista, troca o endereço pelo nome.
function AbrirFicha({ endereco }: { endereco: string }) {
  const navigate = useNavigate()
  const lista = useAuditores()
  const enderecos = useMemo(() => enderecosDosAuditores(lista.data?.auditores ?? []), [lista.data])
  const porNumero = /^\d+$/.test(endereco) ? Number(endereco) : 0
  const id = porNumero || ([...enderecos].find(([, e]) => e === endereco)?.[0] ?? 0)
  const pelonome = porNumero ? enderecos.get(porNumero) : undefined
  useEffect(() => {
    if (pelonome) navigate(`/auditores/${pelonome}`, { replace: true })
  }, [pelonome, navigate])

  if (id > 0) return <FichaDoAuditor key={id} id={id} />
  if (lista.isLoading) return <LoadingState />
  return (
    <div>
      <style>{estilos}</style>
      <Link to="/auditores" className="aud-voltar">← Todos os auditores</Link>
      <div className="card">
        <div className="aud-vazio">
          {lista.isError ? (lista.error as Error)?.message || 'Não foi possível carregar os auditores.'
            : 'Auditor não encontrado. O nome pode ter mudado: abra pela lista.'}
        </div>
      </div>
    </div>
  )
}

export default function Auditores() {
  const { auditor } = useParams()
  return auditor ? <AbrirFicha endereco={auditor} /> : <ListaDeAuditores />
}
