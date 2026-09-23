// Formulário de envio: operadora → hospital → arquivos, nesta ordem.
//
// Os três passos são numerados e o seguinte fica visivelmente inativo enquanto o
// anterior não for respondido — não porque o usuário não saiba a ordem, mas porque
// escolher o hospital ANTES de anexar é o que permite ao sistema ler cada arquivo
// já sabendo a origem (usando o leitor próprio daquele hospital, quando existe) em
// vez de adivinhar e perguntar depois.
//
// A operadora vem antes do hospital porque é ela que recorta a lista: o cadastro
// tem uma linha por hospital×operadora (385 linhas para 219 hospitais distintos),
// então sem o filtro o mesmo nome apareceria até 4x, sem nada que os diferenciasse.

import { useRef, useState } from 'react'
import type { Hospital, Operadora } from '../../types/api'
import { HospitalCombobox } from '../HospitalCombobox'
import { Spinner } from '../ui'
import { varsOperadora } from '../../lib/coresOperadora'
import { type EstadoProgresso, ProgressoEnvio } from './ProgressoEnvio'
import { plural } from './comuns'

export const formularioStyles = `
/* ── Área de envio ─────────────────────────────────────────────────────────── */
.up-drop{position:relative;border:1px dashed var(--border-strong);border-radius:var(--r-md);padding:34px 24px;text-align:center;cursor:pointer;background:var(--surface-3);transition:border-color .14s,background .14s}
.up-drop:hover{border-color:var(--primary-3);background:var(--primary-soft)}
.up-drop.dragover{border-color:var(--primary-3);border-style:solid;background:var(--primary-soft);box-shadow:0 0 0 3px rgba(21,92,168,.1)}
/* Trabalhando: a MESMA caixa, com o andamento dentro. A borda vira sólida na
   cor da operadora (tracejada é o convite a soltar arquivos, e aqui não há mais
   o que soltar), o padding encolhe porque o conteúdo agora é dado e não um
   convite centralizado, e o cursor deixa de ser de clique — a caixa não abre
   mais o seletor de arquivos enquanto o lote roda. */
.up-drop.trabalhando{cursor:default;border-style:solid;border-color:var(--op-cor,var(--primary-3));background:var(--op-fundo,var(--primary-soft));padding:16px 18px;text-align:left}
.up-drop.trabalhando:hover{border-color:var(--op-cor,var(--primary-3));background:var(--op-fundo,var(--primary-soft))}
.up-drop-icon{width:44px;height:44px;border-radius:12px;background:var(--surface);border:1px solid var(--border);display:grid;place-items:center;color:var(--primary-3);margin:0 auto 10px;box-shadow:var(--shadow-xs)}
.up-drop-titulo{font-size:var(--t-md);font-weight:600;color:var(--ink-2);letter-spacing:-.01em}
.up-drop-hint{font-size:var(--t-sm);color:var(--muted);margin-top:3px}
.up-drop-link{color:var(--primary-3);font-weight:600}

/* Arquivos escolhidos: lista real, não uma contagem solta — o usuário confere
   antes de processar e pode tirar um que veio errado. */
.up-lista{margin-top:14px;border:1px solid var(--border);border-radius:var(--r-md);overflow:visible}
.up-lista-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 12px;background:var(--surface-3);border-bottom:1px solid var(--border);font-size:var(--t-xs);text-transform:uppercase;letter-spacing:.1em;font-weight:700;color:var(--muted)}
.up-arq{display:flex;align-items:center;gap:10px;padding:9px 12px;border-top:1px solid var(--border-soft)}
.up-arq:first-of-type{border-top:0}
.up-arq-ico{flex-shrink:0;color:var(--muted-2);display:grid;place-items:center}
.up-arq-nome{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--t-sm);color:var(--ink-2)}
.up-arq-x{display:grid;place-items:center;width:24px;height:24px;flex-shrink:0;border:0;background:none;border-radius:6px;color:var(--muted-2);cursor:pointer;transition:background .12s,color .12s}
.up-arq-x:hover{background:var(--danger-bg);color:var(--danger)}
@media (max-width:780px){
  .up-arq{flex-wrap:wrap}
}
/* Passos numerados: o hospital vem antes dos arquivos, e o passo 2 fica
   visivelmente inativo enquanto o 1 não for respondido. */
.up-passo{display:flex;gap:12px;align-items:flex-start;padding:14px 0;border-top:1px solid var(--border-soft)}
.up-passo:first-of-type{border-top:0;padding-top:4px}
.up-passo.inativo{opacity:.55}
.up-passo-n{flex-shrink:0;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:var(--primary);color:#fff;font-size:var(--t-xs);font-weight:700;font-family:var(--font-mono);margin-top:1px}
.up-passo.inativo .up-passo-n{background:var(--muted-2)}
.up-passo-corpo{flex:1;min-width:0}
.up-passo-lbl{display:block;font-size:var(--t-md);font-weight:600;color:var(--ink);letter-spacing:-.01em;margin-bottom:8px}
.up-passo-campo{max-width:460px}
.up-passo-hint{margin-top:6px;font-size:var(--t-sm);color:var(--muted)}
.up-bloqueado{padding:22px;border:1px dashed var(--border);border-radius:var(--r-md);background:var(--surface-3);text-align:center;font-size:var(--t-sm);color:var(--muted)}
.up-acoes{margin-top:16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.up-acoes-info{font-size:var(--t-sm);color:var(--muted)}
`

const IcoUpload = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" />
  </svg>
)

const IcoPdf = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" />
  </svg>
)

// A caixa de arrastar tem DOIS estados, e é a mesma caixa nos dois: parada, ela
// convida a soltar arquivos; trabalhando, ela mostra o andamento do lote dentro
// de si. O progresso não é um bloco que nasce em outro lugar da página — ele
// acontece onde os arquivos foram soltos, que é para onde o usuário já está
// olhando.
function DropZone({ files, onFiles, progresso, operadoraKey }: {
  files: File[]
  onFiles: (files: File[]) => void
  /** Andamento do envio (`null` = parada, aceitando arquivos). */
  progresso: EstadoProgresso | null
  operadoraKey?: string | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragover, setDragover] = useState(false)

  // Reenviar o mesmo arquivo depois de removê-lo só dispara o change se o input
  // for limpo — senão o navegador considera que o valor não mudou.
  function receber(novos: File[]) {
    if (inputRef.current) inputRef.current.value = ''
    if (novos.length) onFiles([...files, ...novos])
  }

  // Trabalhando: a caixa para de aceitar arquivos e de abrir o seletor. Soltar
  // um PDF aqui agora não o incluiria neste lote (que já subiu), e aceitá-lo em
  // silêncio faria o usuário acreditar que ele entrou.
  if (progresso) {
    return (
      <div className="up-drop trabalhando" style={varsOperadora(operadoraKey)}>
        <ProgressoEnvio estado={progresso} arquivos={files.map((f) => f.name)} />
      </div>
    )
  }

  return (
    <div
      className={`up-drop${dragover ? ' dragover' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragover(true) }}
      onDragEnter={(e) => { e.preventDefault(); setDragover(true) }}
      onDragLeave={(e) => { e.preventDefault(); setDragover(false) }}
      onDrop={(e) => {
        e.preventDefault()
        setDragover(false)
        receber(Array.from(e.dataTransfer.files))
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.PDF,.csv,.CSV,.xlsx,.XLSX,.xls,.XLS,.xlsm"
        style={{ display: 'none' }}
        onChange={(e) => receber(Array.from(e.target.files ?? []))}
      />
      <div className="up-drop-icon">{IcoUpload}</div>
      <div className="up-drop-titulo">
        Arraste os censos aqui ou <span className="up-drop-link">escolha os arquivos</span>
      </div>
      <div className="up-drop-hint">PDF, CSV ou Excel · vários arquivos de uma vez</div>
    </div>
  )
}

// Conferência antes de enviar: o usuário vê o que anexou e tira o que veio errado.
// O hospital NÃO aparece aqui — ele é único para o lote e foi escolhido no passo 1.
//
// Some durante o processamento: a caixa de arrastar já lista os mesmos arquivos
// com o estado de cada um, e manter as duas listas na tela mostraria o lote em
// duplicidade — uma viva e outra parada.
function ListaArquivos({ files, onFiles }: {
  files: File[]
  onFiles: (files: File[]) => void
}) {
  if (!files.length) return null
  return (
    <div className="up-lista">
      <div className="up-lista-head">
        <span>{files.length} {plural(files.length, 'arquivo')} {plural(files.length, 'anexado')}</span>
      </div>
      {files.map((f, i) => (
        <div className="up-arq" key={`${f.name}-${i}`}>
          <span className="up-arq-ico">{IcoPdf}</span>
          <span className="up-arq-nome mono" title={f.name}>{f.name}</span>
          <button
            type="button"
            className="up-arq-x"
            title="Tirar este arquivo do envio"
            aria-label={`Remover ${f.name}`}
            onClick={() => onFiles(files.filter((_, j) => j !== i))}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
    </div>
  )
}

export function FormularioEnvio({
  operadoras, hospitaisDaOperadora, hospitalEscolhido, carregandoHospitais,
  operadora, hospital, files, busy, progresso,
  onTrocarOperadora, onHospital, onFiles, onSubmit,
}: {
  operadoras: Operadora[]
  hospitaisDaOperadora: Hospital[]
  hospitalEscolhido: Hospital | null
  carregandoHospitais: boolean
  operadora: string
  hospital: string
  files: File[]
  busy: boolean
  /** Andamento do envio em curso (`null` = nenhum). */
  progresso: EstadoProgresso | null
  onTrocarOperadora: (key: string) => void
  onHospital: (key: string) => void
  onFiles: (files: File[]) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <div className="card">
      {/* Sem título/subtítulo próprios: o cabeçalho da página já diz o que é a
          tela, e os passos numerados abaixo explicam o fluxo sozinhos. */}
      <div className="card-body" style={{ paddingTop: 16 }}>
        <form onSubmit={onSubmit}>
          {/* PASSO 1 — operadora. Antes do hospital porque é ela que recorta a
              lista: o cadastro tem uma linha por hospital×operadora, então sem
              este filtro o mesmo nome apareceria repetido várias vezes. */}
          <div className="up-passo">
            <span className="up-passo-n">1</span>
            <div className="up-passo-corpo">
              <label className="up-passo-lbl" htmlFor="up-operadora">De qual operadora é o censo?</label>
              <div className="up-passo-campo">
                <select
                  id="up-operadora"
                  className="bm-input bm-select"
                  value={operadora}
                  disabled={busy}
                  onChange={(e) => onTrocarOperadora(e.target.value)}
                >
                  <option value="">Selecione a operadora…</option>
                  {operadoras.map((o) => <option key={o.key} value={o.key}>{o.nome}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* PASSO 2 — hospital, já filtrado pela operadora. */}
          <div className={`up-passo${operadora ? '' : ' inativo'}`}>
            <span className="up-passo-n">2</span>
            <div className="up-passo-corpo">
              <label className="up-passo-lbl" htmlFor="up-hospital">De qual hospital são estes censos?</label>
              {operadora ? (
                <>
                  <div className="up-passo-campo">
                    <HospitalCombobox
                      id="up-hospital"
                      hospitais={hospitaisDaOperadora}
                      value={hospital}
                      disabled={carregandoHospitais || busy}
                      placeholder={carregandoHospitais ? 'Carregando hospitais…' : 'Digite o nome do hospital…'}
                      onChange={onHospital}
                    />
                  </div>
                  {!carregandoHospitais && hospitaisDaOperadora.length === 0 && (
                    <div className="up-passo-hint">Nenhum hospital cadastrado nesta operadora.</div>
                  )}
                </>
              ) : (
                <div className="up-bloqueado">Escolha a operadora acima.</div>
              )}
            </div>
          </div>

          {/* PASSO 3 — arquivos. Só faz sentido depois do hospital, então fica
              visivelmente inativo até lá em vez de aceitar um envio incompleto. */}
          <div className={`up-passo${hospital ? '' : ' inativo'}`}>
            <span className="up-passo-n">3</span>
            <div className="up-passo-corpo">
              <label className="up-passo-lbl">
                Envie os arquivos {hospitalEscolhido ? <>de <strong>{hospitalEscolhido.nome}</strong></> : 'do hospital'}
              </label>
              {hospital ? (
                <>
                  <DropZone
                    files={files}
                    onFiles={onFiles}
                    progresso={progresso}
                    operadoraKey={operadora}
                  />
                  {!progresso && <ListaArquivos files={files} onFiles={onFiles} />}
                </>
              ) : (
                <div className="up-bloqueado">Escolha o hospital acima para liberar o envio.</div>
              )}
            </div>
          </div>

          <div className="up-acoes">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!files.length || !hospital || busy}
            >
              {busy && <Spinner size={14} style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.4)' }} />}
              {busy ? 'Lendo os censos…' : 'Processar censos'}
            </button>
            {/* A contagem some daqui: o cabeçalho da lista logo acima já diz
                "N arquivos anexados", e repetir o mesmo número a dois centímetros
                de distância não confirma nada — só ocupa a linha das ações. */}
            {files.length > 0 && !busy && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onFiles([])}>
                Limpar arquivos
              </button>
            )}
            {busy && <span className="up-acoes-info">Não feche a página até terminar.</span>}
          </div>
        </form>
      </div>
    </div>
  )
}
