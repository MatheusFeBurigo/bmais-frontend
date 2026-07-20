import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { invalidarPorEvento } from '../lib/invalidation'
import {
  enviarCensos, enviarRelatorios, reprocessarPastaRelatorios,
} from '../services/censos.service'
import type {
  UploadCensoResponse,
  RelatorioLoteResponse,
  RelatorioRefreshResponse,
} from '../types/api'
import { usePageHeader } from '../components/PageHeader'
import Toast from '../components/Toast'

// Estilos específicos da tela (portados de upload.html — não pertencem ao design system global).
const localStyles = `
.up-drop{border:2px dashed var(--border-strong);border-radius:var(--r-md);padding:40px 24px;text-align:center;cursor:pointer;transition:all .15s;background:var(--surface-3)}
.up-drop:hover,.up-drop.dragover{border-color:var(--accent);background:var(--accent-soft)}
.up-drop-icon{width:56px;height:56px;border-radius:14px;background:var(--surface);border:1px solid var(--border);display:grid;place-items:center;color:var(--accent);margin:0 auto 12px}
.up-tabnav{display:flex;border-bottom:1px solid var(--border);background:var(--surface-3);border-radius:var(--r-md) var(--r-md) 0 0;overflow:hidden}
.up-tabnav-item{padding:12px 20px;font-size:var(--t-sm);font-weight:500;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;transition:all .12s;user-select:none;background:none;border-top:0;border-left:0;border-right:0}
.up-tabnav-item:hover{color:var(--ink-2);background:rgba(0,0,0,.03)}
.up-tabnav-item.active{color:var(--primary);font-weight:600;border-bottom-color:var(--primary)}
.res-ok{border-left:3px solid var(--success);background:var(--success-bg);border-radius:0 var(--r-md) var(--r-md) 0;padding:10px 14px}
.res-err{border-left:3px solid var(--danger);background:var(--danger-bg);border-radius:0 var(--r-md) var(--r-md) 0;padding:10px 14px}
/* Banner de sucesso do upload — feedback claro de que os arquivos subiram. */
.up-success{display:flex;align-items:center;gap:14px;padding:16px 18px;border-radius:var(--r-md);background:linear-gradient(180deg,var(--success-bg),var(--surface) 92%);border:1px solid rgba(14,122,83,.28);animation:up-pop .3s cubic-bezier(.2,.7,.2,1)}
.up-success-ico{flex-shrink:0;width:40px;height:40px;border-radius:50%;background:var(--success);color:#fff;display:grid;place-items:center;box-shadow:0 4px 12px rgba(14,122,83,.3)}
.up-success-ico svg{animation:up-check .4s .1s both cubic-bezier(.2,.7,.2,1)}
.up-success-title{font-weight:600;font-size:var(--t-md);color:var(--success-2);line-height:1.2}
.up-success-sub{font-size:var(--t-sm);color:var(--ink-3);margin-top:2px}
.up-success-sub strong{color:var(--success-2)}
@keyframes up-pop{from{opacity:0;transform:translateY(-8px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes up-check{from{stroke-dasharray:0 40;opacity:0}to{stroke-dasharray:40 40;opacity:1}}
`

type TabKey = 'censos' | 'relatorios'
type Kind = 'censos' | 'relatorios'
type ResultData = UploadCensoResponse | RelatorioLoteResponse | RelatorioRefreshResponse

// ── Drop-zone reutilizável (dentro do arquivo — específico do upload) ─────────
interface DropZoneProps {
  accept: string
  icon: React.ReactNode
  titulo: string
  hint: string
  onFiles: (files: File[]) => void
  files: File[]
}

function DropZone({ accept, icon, titulo, hint, onFiles, files }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragover, setDragover] = useState(false)

  return (
    <>
      <div
        className={`up-drop${dragover ? ' dragover' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragover(true) }}
        onDragEnter={(e) => { e.preventDefault(); setDragover(true) }}
        onDragLeave={(e) => { e.preventDefault(); setDragover(false) }}
        onDrop={(e) => {
          e.preventDefault()
          setDragover(false)
          onFiles(Array.from(e.dataTransfer.files))
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          style={{ display: 'none' }}
          onChange={(e) => onFiles(Array.from(e.target.files ?? []))}
        />
        <div className="up-drop-icon">{icon}</div>
        <div className="fw-6" style={{ fontSize: 15, marginBottom: 4, color: 'var(--ink-2)' }}>{titulo}</div>
        <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>{hint}</div>
      </div>
      <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', marginTop: 10, minHeight: 18 }}>
        {files.length > 0 && `${files.length} arquivo${files.length > 1 ? 's' : ''} selecionado${files.length > 1 ? 's' : ''}`}
      </div>
    </>
  )
}

const IconUp = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg>
)
const IconDoc = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></svg>
)

export default function Upload() {
  const qc = useQueryClient()
  // Todo upload muda os dados de origem — o evento de domínio "dadosAlterados"
  // invalida (centralizadamente) os caches derivados: Dashboard/Diretoria/Gestor/
  // Sidebar/Equipe refazem o fetch ao serem abertos, sem esperar o staleTime.
  function invalidarDados() {
    invalidarPorEvento(qc, 'dadosAlterados')
  }

  const [tab, setTab] = useState<TabKey>('censos')
  const [censosFiles, setCensosFiles] = useState<File[]>([])
  const [relFiles, setRelFiles] = useState<File[]>([])
  const [autoApply, setAutoApply] = useState(true)
  const [busy, setBusy] = useState<Kind | 'refresh' | null>(null)
  const [result, setResult] = useState<{ kind: Kind; data: ResultData } | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  async function processarCensos(e: React.FormEvent) {
    e.preventDefault()
    if (!censosFiles.length) return
    setBusy('censos')
    try {
      const data = await enviarCensos(censosFiles)
      setResult({ kind: 'censos', data })
      invalidarDados()
      setToast('✓ Processamento concluído')
    } catch (err) {
      setToast(`Erro: ${(err as Error).message}`)
    } finally {
      setBusy(null)
    }
  }

  async function processarRelatorios(e: React.FormEvent) {
    e.preventDefault()
    if (!relFiles.length) return
    setBusy('relatorios')
    try {
      const data = await enviarRelatorios(relFiles, autoApply)
      setResult({ kind: 'relatorios', data })
      invalidarDados()
      setToast('✓ Processamento concluído')
    } catch (err) {
      setToast(`Erro: ${(err as Error).message}`)
    } finally {
      setBusy(null)
    }
  }

  async function processarPasta() {
    setBusy('refresh')
    try {
      const data = await reprocessarPastaRelatorios()
      setResult({ kind: 'relatorios', data })
      invalidarDados()
      setToast('✓ Pasta processada')
    } catch (err) {
      setToast(`Erro: ${(err as Error).message}`)
    } finally {
      setBusy(null)
    }
  }

  const actions = (
    <button className="btn btn-outline btn-sm" onClick={processarPasta} disabled={busy != null}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 1-15.4 6.3L3 16M3 12a9 9 0 0 1 15.4-6.3L21 8" /><path d="M21 3v5h-5M3 21v-5h5" /></svg>
      {busy === 'refresh' ? 'Processando…' : 'Processar pasta de relatórios'}
    </button>
  )

  usePageHeader({
    title: 'Upload de Arquivos',
    subtitle: 'Censos hospitalares (PDF) ou relatórios de auditoria em lote (DOCX/PDF)',
    actions,
  })

  return (
    <>
      <style>{localStyles}</style>
      <div style={{ maxWidth: 860 }}>
        {/* Tabs */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="up-tabnav">
            <button className={`up-tabnav-item${tab === 'censos' ? ' active' : ''}`} onClick={() => setTab('censos')}>
              Censos Hospitalares
            </button>
            <button className={`up-tabnav-item${tab === 'relatorios' ? ' active' : ''}`} onClick={() => setTab('relatorios')}>
              Relatórios em Lote
            </button>
          </div>

          {tab === 'censos' && (
            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', marginBottom: 18 }}>
                PDFs de internados/altas vindos dos hospitais. O sistema identifica o hospital pelo
                cabeçalho e adiciona/atualiza no banco automaticamente.
              </p>
              <form onSubmit={processarCensos}>
                <DropZone
                  accept=".pdf,.PDF"
                  icon={IconUp}
                  titulo="Arraste PDFs para esta área"
                  hint="Apenas arquivos .pdf — censos diários das operadoras"
                  files={censosFiles}
                  onFiles={setCensosFiles}
                />
                <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!censosFiles.length || busy != null}
                    style={{ opacity: censosFiles.length ? 1 : 0.4 }}
                  >
                    {busy === 'censos' ? 'Processando…' : 'Processar censos'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {tab === 'relatorios' && (
            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', marginBottom: 18 }}>
                DOCX/PDF de relatórios em lote (um médico, vários pacientes). O sistema identifica cada
                paciente pelo nome e anexa o trecho ao histórico de cada um.
              </p>
              <form onSubmit={processarRelatorios}>
                <DropZone
                  accept=".docx,.pdf,.PDF"
                  icon={IconDoc}
                  titulo="Arraste DOCX/PDF para esta área"
                  hint="Relatórios de visita em lote (.docx ou .pdf)"
                  files={relFiles}
                  onFiles={setRelFiles}
                />
                <div style={{ marginTop: 14 }}>
                  <label className="row" style={{ gap: 8, cursor: 'pointer', fontSize: 'var(--t-sm)' }}>
                    <input type="checkbox" checked={autoApply} onChange={(e) => setAutoApply(e.target.checked)} />
                    <span>Aplicar matches automaticamente (score ≥ 0.70)</span>
                  </label>
                </div>
                <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!relFiles.length || busy != null}
                    style={{ opacity: relFiles.length ? 1 : 0.4 }}
                  >
                    {busy === 'relatorios' ? 'Processando…' : 'Processar relatórios'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Resultados */}
        {result && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SucessoBanner kind={result.kind} data={result.data} />
            <Resultados kind={result.kind} data={result.data} />
          </div>
        )}
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  )
}

// ── Banner de sucesso: feedback visual claro de que os arquivos foram subidos ─
function SucessoBanner({ kind, data }: { kind: Kind; data: ResultData }) {
  let total = 0
  let ok = 0
  let detalhe = ''

  if (kind === 'censos') {
    const resultados = (data as UploadCensoResponse).resultados ?? []
    total = resultados.length
    ok = resultados.filter((r) => !r.erro).length
    const pacientes = resultados.reduce((s, r) => s + (r.total || 0), 0)
    detalhe = `${pacientes} pacientes atualizados no banco`
  } else {
    const d = data as RelatorioRefreshResponse
    const resultados = d.resultados ?? []
    total = d.arquivos ?? resultados.length
    ok = resultados.filter((r) => !r.erro).length
    detalhe = `${d.aplicados ?? 0} relatórios aplicados`
  }

  const falhas = total - ok
  const titulo = falhas > 0
    ? `${ok} de ${total} arquivo${total > 1 ? 's' : ''} processado${ok > 1 ? 's' : ''}`
    : `${total} arquivo${total > 1 ? 's' : ''} enviado${total > 1 ? 's' : ''} com sucesso`

  return (
    <div className="up-success">
      <div className="up-success-ico">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="up-success-title">{titulo}</div>
        <div className="up-success-sub">
          <strong>{detalhe}</strong>
          {falhas > 0 && <span style={{ color: 'var(--danger)' }}> · {falhas} com erro (ver abaixo)</span>}
        </div>
      </div>
    </div>
  )
}

// ── Render dos resultados (2 formatos distintos: censos vs relatórios) ────────
function Resultados({ kind, data }: { kind: Kind; data: ResultData }) {
  if (kind === 'censos') {
    const resultados = (data as UploadCensoResponse).resultados ?? []
    if (!resultados.length) return <div className="empty-state">Nenhum resultado para exibir.</div>
    return (
      <>
        {resultados.map((res, i) =>
          res.erro ? (
            <div key={i} className="res-err">
              <strong className="mono" style={{ fontSize: 'var(--t-sm)' }}>{res.arquivo}</strong>{' '}
              <span style={{ color: 'var(--danger)', fontSize: 'var(--t-sm)' }}>— {res.erro}</span>
            </div>
          ) : (
            <div key={i} className="res-ok">
              <strong className="mono" style={{ fontSize: 'var(--t-sm)' }}>{res.arquivo}</strong>
              <span style={{ color: 'var(--muted)', margin: '0 6px' }}>·</span>
              {res.hospital_nome || res.hospital || '?'}
              <span style={{ color: 'var(--muted)', margin: '0 6px' }}>·</span>
              {res.tipo || ''}
              <span style={{ color: 'var(--muted)', margin: '0 6px' }}>·</span>
              <strong style={{ color: 'var(--success)' }}>{res.total} pacientes</strong>
            </div>
          ),
        )}
      </>
    )
  }

  // relatórios (upload em lote ou refresh de pasta)
  const d = data as RelatorioRefreshResponse
  const resultados = d.resultados ?? []
  const arquivos = d.arquivos ?? resultados.length
  return (
    <>
      <div className="card" style={{ background: 'var(--success-bg)', borderColor: 'rgba(14,122,83,.2)', padding: '14px 16px' }}>
        <div style={{ fontSize: 'var(--t-sm)' }}>
          <strong>Resumo:</strong> {arquivos} arquivos &nbsp;·&nbsp;{' '}
          <strong style={{ color: 'var(--success)' }}>{d.aplicados ?? 0} relatórios aplicados</strong> &nbsp;·&nbsp;{' '}
          <span style={{ color: 'var(--warning)' }}>{d.baixa_confianca ?? 0} baixa confiança</span> &nbsp;·&nbsp;{' '}
          <span style={{ color: 'var(--danger)' }}>{d.sem_match ?? 0} sem match</span>
        </div>
      </div>

      {resultados.map((res, i) => (
        <div key={i} className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 'var(--t-sm)', fontWeight: 600, marginBottom: 8 }}>📋 {res.arquivo}</div>
          {res.erro ? (
            <div style={{ color: 'var(--danger)', fontSize: 'var(--t-sm)' }}>{res.erro}</div>
          ) : (
            <>
              <div style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)', marginBottom: 10 }}>
                Hospital: {res.hospital_key || '?'} · Médico: {res.medico || '?'} · Data: {res.data_relatorio || '?'}
              </div>

              {res.aplicados && res.aplicados.length > 0 && (
                <>
                  <div style={{ fontSize: 'var(--t-sm)', fontWeight: 600, color: 'var(--success)', marginBottom: 4 }}>
                    ✓ {res.aplicados.length} aplicados:
                  </div>
                  <div style={{ display: 'grid', gap: 4 }}>
                    {res.aplicados.map((a, j) => (
                      <div key={j} style={{ fontSize: 'var(--t-xs)', display: 'flex', justifyContent: 'space-between' }}>
                        <Link to={`/paciente/${a.match.internacao_id}`} style={{ color: 'var(--accent)' }}>
                          {a.nome_raw} → {a.match.nome_db}
                        </Link>
                        <span style={{ color: 'var(--muted)' }}>score {a.match.score}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {res.baixa_confianca && res.baixa_confianca.length > 0 && (
                <>
                  <div style={{ fontSize: 'var(--t-sm)', fontWeight: 600, color: 'var(--warning)', margin: '10px 0 4px' }}>
                    ⚠ {res.baixa_confianca.length} baixa confiança:
                  </div>
                  <div style={{ display: 'grid', gap: 2 }}>
                    {res.baixa_confianca.map((b, j) => (
                      <div key={j} style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-3)' }}>
                        {b.nome_raw} — {b.candidatos.map((c) => `${c.nome_db}(${c.score})`).join(', ')}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {res.sem_match && res.sem_match.length > 0 && (
                <>
                  <div style={{ fontSize: 'var(--t-sm)', fontWeight: 600, color: 'var(--danger)', margin: '10px 0 4px' }}>
                    ✗ {res.sem_match.length} sem match:
                  </div>
                  <div style={{ display: 'grid', gap: 2 }}>
                    {res.sem_match.map((s, j) => (
                      <div key={j} style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)' }}>{s.nome_raw}</div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      ))}
    </>
  )
}
