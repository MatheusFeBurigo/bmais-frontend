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
// Solicitar cria um pedido por documento; registrar o recebido anexa o arquivo
// (PDF ou foto) e atende o pedido. Renovar é pedir de novo: o arquivo anterior
// continua disponível no histórico. Quem pede, insere e recebe: coordenador
// operacional, Operacional e admin (ACOES.gerirDocumentosAuditor); os demais da
// tela só consultam.
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { usePageHeader } from '../components/PageHeader'
import { ConfirmarModal } from '../components/ConfirmarModal'
import Toast from '../components/Toast'
import { Badge, KpiCard, LoadingState, Modal } from '../components/ui'
import {
  useAuditores, useCadastroAuditor, useCancelarPedidoDocumento, useFichaAuditor, useInserirDocumento, usePedirDocumentos,
  useReceberDocumento, useSalvarCadastroAuditor, useSalvarContratoAuditor,
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
  em_dia: { rotulo: 'Em dia', variante: 'success' },
  vence: { rotulo: 'Vence em breve', variante: 'warning' },
  vencido: { rotulo: 'Vencido', variante: 'danger' },
}

const GERAL: Record<SituacaoGeral, { rotulo: string; variante: Variante }> = {
  pendente: { rotulo: 'Com pendência', variante: 'danger' },
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

function ListaDeAuditores() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useAuditores()
  const servicos = useServicosDosAuditores()
  const servicosDe = (id: number) => servicos.data?.servicos[String(id)] ?? []
  const [tipo, setTipo] = useState<FiltroTipo>('')
  const [situacao, setSituacao] = useState<SituacaoGeral | ''>('')
  const [busca, setBusca] = useState('')

  usePageHeader(useMemo(() => ({
    title: 'Auditores',
    subtitle: 'Serviços e documentos de cada médico e enfermeiro auditor',
  }), []))

  const auditores = useMemo(() => data?.auditores ?? [], [data])
  const enderecos = useMemo(() => enderecosDosAuditores(auditores), [auditores])
  const fichaDe = (a: AuditorNaLista) => `/auditores/${enderecos.get(a.id) ?? a.id}`
  const conta = (s: SituacaoGeral) => auditores.filter((a) => a.resumo.geral === s).length
  const termo = semAcento(busca.trim())
  const visiveis = auditores
    .filter((a) => !tipo || a.tipo === tipo)
    .filter((a) => !situacao || a.resumo.geral === situacao)
    .filter((a) => !termo || semAcento(a.nome).includes(termo))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  const alterna = (s: SituacaoGeral) => setSituacao((v) => (v === s ? '' : s))

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
            Os documentos dos auditores ainda não estão disponíveis neste ambiente: o banco ainda não
            tem o catálogo de documentos.
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
                  <td>{a.ultimo_envio ? dataHora(a.ultimo_envio).slice(0, 10) : <span style={{ color: 'var(--muted-2)' }}>—</span>}</td>
                  <td>
                    <Link to={fichaDe(a)} className="btn btn-outline btn-sm"
                      onClick={(e) => e.stopPropagation()}>Abrir</Link>
                  </td>
                </tr>
              ))}
              {visiveis.length === 0 && (
                <tr>
                  <td colSpan={5} className="aud-vazio">
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
    pedir.mutate([...marcados], {
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
          <button type="button" className="btn btn-primary" onClick={enviar} disabled={!n || pedir.isPending}>
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
  const limpo = nome.trim().replace(/\s+/g, ' ')
  const existente = limpo ? ficha.catalogo.find((t) => semAcento(t.nome) === semAcento(limpo)) : undefined
  const pronto = !!limpo && !existente?.em_aberto && !inserir.isPending
  function enviar() {
    if (!pronto) return
    setErro('')
    inserir.mutate({ nome: limpo, comValidade: existente ? existente.com_validade : vence }, {
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

function LinhaDocumento({ d, gerir, onPedir, onReceber, onCancelar, pedindo }: {
  d: DocumentoDoAuditor
  gerir: boolean
  onPedir: () => void
  onReceber: () => void
  onCancelar: () => void
  pedindo: boolean
}) {
  const sit = SITUACAO[d.situacao]
  const a = d.arquivo
  return (
    <tr>
      <td>
        <div className="aud-nome" style={{ fontWeight: 550 }}>{d.tipo.nome}</div>
        <div className="aud-sub">{d.tipo.dono === 'empresa' ? 'Da empresa' : 'Do auditor'}</div>
      </td>
      <td>
        <Badge variant={sit.variante}>{sit.rotulo}</Badge>
        {d.pedido && (
          <div className="aud-sub">
            {d.pedido.pedido_padrao ? 'pedido automático em ' : 'pedido em '}
            {dataHora(d.pedido.pedido_em).slice(0, 10)}
            {d.pedido.pedido_por_nome && ` por ${d.pedido.pedido_por_nome}`}
          </div>
        )}
      </td>
      <td>{a?.validade ? dataBR(a.validade) : a ? <span className="aud-sub">sem validade</span> : '—'}</td>
      <td>
        {a ? (
          <>
            <div>{dataHora(a.enviado_em).slice(0, 10)}</div>
            <div className="aud-sub">
              {[a.enviado_por_nome && `por ${a.enviado_por_nome}`, a.enviado_via === 'app' && 'pelo App']
                .filter(Boolean).join(' · ')}
            </div>
          </>
        ) : '—'}
      </td>
      <td>
        <div className="aud-acoes">
          {a?.tem_arquivo && <BotaoBaixar r={a} />}
          {gerir && (
            <>
              {d.situacao !== 'falta' && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={onPedir} disabled={pedindo}>
                  {a ? 'Pedir de novo' : 'Pedir'}
                </button>
              )}
              {d.pedido && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelar}>Cancelar pedido</button>
              )}
              <button type="button" className="btn btn-primary btn-sm" onClick={onReceber}>
                {a ? 'Registrar nova versão' : 'Registrar recebido'}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

function TabelaDocumentos({ docs, vazio, gerir, pedindo, onPedir, onReceber, onCancelar }: {
  docs: DocumentoDoAuditor[]
  vazio: string
  gerir: boolean
  pedindo: boolean
  onPedir: (d: DocumentoDoAuditor) => void
  onReceber: (d: DocumentoDoAuditor) => void
  onCancelar: (d: DocumentoDoAuditor) => void
}) {
  return (
    <div style={{ overflow: 'auto' }}>
      <table className="bmais-table" style={{ minWidth: 760 }}>
        <thead>
          {/* Larguras fixas: as duas tabelas da ficha (padrão e outros) ficam alinhadas. */}
          <tr>
            <th style={{ width: '30%' }}>Documento</th>
            <th style={{ width: '24%' }}>Situação</th>
            <th style={{ width: '11%' }}>Validade</th>
            <th style={{ width: '12%' }}>Recebido</th>
            <th style={{ width: 1 }}></th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <LinhaDocumento key={d.tipo.id} d={d} gerir={gerir} pedindo={pedindo}
              onPedir={() => onPedir(d)} onReceber={() => onReceber(d)} onCancelar={() => onCancelar(d)} />
          ))}
          {docs.length === 0 && (
            <tr><td colSpan={5} className="aud-vazio">{vazio}</td></tr>
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
    r.enviado_em && `Recebido em ${dataHora(r.enviado_em)}${r.enviado_por_nome ? ` por ${r.enviado_por_nome}` : ''}${r.enviado_via === 'app' ? ' pelo App' : ''}`,
    r.validade && `Validade ${dataBR(r.validade)}`,
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
// dois ficam atrás da senha de desbloqueio do auditor.

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
      <p className="aud-nota">Todos os campos são opcionais. O auditor vê no App, atrás da senha de desbloqueio.</p>
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
            O cadastro e o contrato ainda não estão disponíveis neste ambiente: o banco ainda não tem as tabelas.
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
        <div style={{ overflow: 'auto' }}>
          <table className="bmais-table" style={{ minWidth: 560 }}>
            <thead><tr><th>Hospital</th><th>Operadoras</th><th>Serviços</th></tr></thead>
            <tbody>
              {data.hospitais.map((h) => (
                <tr key={h.hospital_key}>
                  <td>
                    <div className="aud-nome">{h.hospital_nome}</div>
                    {(h.cidade || h.uf) && <div className="aud-sub">{[h.cidade, h.uf].filter(Boolean).join(', ')}</div>}
                  </td>
                  <td>{h.operadoras.join(', ')}</td>
                  <td><div className="aud-servs">{h.servicos.map((s) => <Badge key={s} variant="info">{s}</Badge>)}</div></td>
                </tr>
              ))}
              {data.hospitais.length === 0 && <tr><td colSpan={3} className="aud-vazio">Sem posto vigente.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FichaDoAuditor({ id }: { id: number }) {
  const { data, isLoading, isError, error } = useFichaAuditor(id)
  const agenda = useAgendaDoAuditor(id)
  const prod = agenda.data?.producao
  const pedir = usePedirDocumentos(id)
  const cancelar = useCancelarPedidoDocumento()
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
    subtitle: nome ? `${tipoAuditor(tipo)} · documentos` : 'Documentos do auditor',
    actions: acoes,
  }), [nome, tipo, acoes]))

  function pedirUm(d: DocumentoDoAuditor) {
    pedir.mutate([d.tipo.id], {
      onSuccess: () => setAviso(`${d.tipo.nome} pedido`),
      onError: (e) => setAviso((e as Error).message || 'Não foi possível pedir. Tente de novo.'),
    })
  }
  function confirmarCancelamento() {
    const p = cancelando?.pedido
    if (!p) return
    cancelar.mutate(p.id, {
      onSuccess: () => { setCancelando(null); setAviso('Pedido cancelado') },
      onError: (e) => { setCancelando(null); setAviso((e as Error).message || 'Não foi possível cancelar.') },
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
  return (
    <div>
      <style>{estilos}</style>
      {voltar}
      {!data.disponivel && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="aud-aviso">
            Os documentos dos auditores ainda não estão disponíveis neste ambiente: o banco ainda não
            tem o catálogo de documentos.
          </div>
        </div>
      )}
      {!!agenda.data?.servicos.length && (
        <div className="aud-servs aud-servs-ficha">
          {agenda.data.servicos.map((s) => <Badge key={s} variant="info">{s}</Badge>)}
        </div>
      )}
      <CadastroEContratoCard id={id} tipo={data.auditor.tipo} onAviso={setAviso} />
      <div className="kpi-grid aud-kpis" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', marginBottom: 14 }}>
        {/* A produção do mês de cada serviço que ele faz, como os quadros da ficha do protótipo. */}
        {prod?.senhas != null && (
          <KpiCard label={`Senhas lançadas em ${prod.mes}`} value={prod.senhas} meta={prod.senhas ? undefined : 'sem lançamento'} />
        )}
        {prod?.contas != null && <KpiCard label={`Contas finalizadas em ${prod.mes}`} value={prod.contas} />}
        {prod?.pacientes != null && <KpiCard label={`Pacientes visitados em ${prod.mes}`} value={prod.pacientes} />}
        <KpiCard label="Em dia" value={r.em_dia} variant={r.em_dia ? 'success' : 'neutral'} />
        <KpiCard label="Vencem em breve" value={r.vence} variant={r.vence ? 'warning' : 'neutral'}
          meta={`em até ${data.vence_em_dias} dias`} />
        <KpiCard label="Pendentes" value={r.falta + r.vencido} variant={r.falta + r.vencido ? 'danger' : 'neutral'}
          meta="faltam enviar ou vencidos" />
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Documentação padrão</div>
            <p className="card-sub">Todo auditor abre com estes documentos pendentes desde o cadastro. Do auditor e da empresa dele.</p>
          </div>
        </div>
        <TabelaDocumentos docs={data.documentos.filter((d) => d.tipo.padrao)} gerir={gerir} pedindo={pedir.isPending}
          vazio="Nenhum documento padrão para este auditor."
          onPedir={pedirUm} onReceber={setRecebendo} onCancelar={setCancelando} />
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Outros documentos</div>
            <p className="card-sub">Documentos fora do padrão que o Operacional pediu a este auditor.</p>
          </div>
          {gerir && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setInserindo(true)}>
              Inserir documento
            </button>
          )}
        </div>
        <TabelaDocumentos docs={data.documentos.filter((d) => !d.tipo.padrao)} gerir={gerir} pedindo={pedir.isPending}
          vazio={gerir ? 'Nenhum outro documento pedido. Use “Inserir documento” para pedir um que não está no padrão.'
            : 'Nenhum outro documento pedido.'}
          onPedir={pedirUm} onReceber={setRecebendo} onCancelar={setCancelando} />
      </div>

      <HospitaisEServicos id={id} />

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Histórico</div>
            <p className="card-sub">Cada pedido e cada arquivo recebido, do mais novo ao mais antigo.</p>
          </div>
        </div>
        <div className="card-body">
          {data.historico.length === 0
            ? <div className="aud-vazio">Nenhum documento pedido ou recebido ainda.</div>
            : <div className="aud-hist">{data.historico.map((h) => <ItemHistorico key={h.id} r={h} />)}</div>}
        </div>
      </div>

      {solicitando && (
        <SolicitarModal ficha={data} onFechar={() => setSolicitando(false)}
          onFeito={(m) => { setSolicitando(false); setAviso(m) }} />
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
