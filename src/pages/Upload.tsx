import { useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { invalidarPorEvento } from '../lib/invalidation'
import { enviarCensos, reverterEnvioCenso } from '../services/censos.service'
import type { HospitalManual, Operadora, PacienteGravado, PendenteCenso, UploadCensoResponse, UploadCensoResult } from '../types/api'
import { usePageHeader } from '../components/PageHeader'
import { Spinner } from '../components/ui'
import Toast from '../components/Toast'
import WizardComplemento from '../components/upload/WizardComplemento'
import { HospitalCombobox } from '../components/HospitalCombobox'
import { ConfirmarModal } from '../components/ConfirmarModal'
import { useTodosHospitais } from '../hooks/useEquipe'
import { useSidebar } from '../hooks/useDashboard'

// Estilos específicos da tela (não pertencem ao design system global).
const localStyles = `
/* ── Área de envio ─────────────────────────────────────────────────────────── */
.up-drop{position:relative;border:1px dashed var(--border-strong);border-radius:var(--r-md);padding:34px 24px;text-align:center;cursor:pointer;background:var(--surface-3);transition:border-color .14s,background .14s}
.up-drop:hover{border-color:var(--primary-3);background:var(--primary-soft)}
.up-drop.dragover{border-color:var(--primary-3);border-style:solid;background:var(--primary-soft);box-shadow:0 0 0 3px rgba(21,92,168,.1)}
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

/* ── Resultado do envio ─────────────────────────────────────────────────────── */
.up-resultado{border:1px solid var(--border);border-radius:var(--r-md);background:var(--surface);overflow:hidden;animation:up-pop .28s cubic-bezier(.2,.7,.2,1)}

/* Placar: só aparece quando resume algo além do que a linha do arquivo já diz. */
.up-placar{display:flex;align-items:center;gap:10px;padding:11px 14px;background:var(--surface-3);border-bottom:1px solid var(--border);flex-wrap:wrap}
.up-placar-ico{flex-shrink:0;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;color:#fff}
.up-placar-ico.ok{background:var(--success)}
.up-placar-ico.atencao{background:var(--warning)}
.up-placar-txt{flex:1;min-width:180px;font-size:var(--t-sm);color:var(--ink-2)}
.up-placar-txt strong{font-family:var(--font-mono);font-size:var(--t-md);color:var(--ink)}
.up-placar-alertas{display:flex;gap:6px;flex-wrap:wrap}
/* A mesma dupla de cores do resto da tela, para o placar e a lista falarem a
   mesma língua: azul = em leito, verde = com alta. */
.up-cor-internado{color:var(--info);font-weight:600}
.up-cor-alta{color:var(--success-2);font-weight:600}

/* Faixa de ação (completar / desfazer): mesma estrutura para as duas. */
.up-faixa{display:flex;align-items:center;gap:12px;padding:10px 14px;border-top:1px solid var(--border-soft);flex-wrap:wrap}
.up-faixa.atencao{background:var(--warning-bg)}
.up-faixa-txt{flex:1;min-width:220px;font-size:var(--t-sm);color:var(--ink-2);line-height:1.45}
.up-faixa:not(.atencao) .up-faixa-txt{color:var(--muted)}

/* Um arquivo do envio. */
.up-arquivo{padding:11px 14px;border-top:1px solid var(--border-soft);border-left:3px solid transparent;display:grid;gap:7px}
.up-arquivo.ok{border-left-color:var(--success)}
.up-arquivo.atencao{border-left-color:var(--warning)}
.up-arquivo.erro{border-left-color:var(--danger)}
.up-arquivo-topo{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap}
.up-arquivo-nome{font-family:var(--font-mono);font-size:var(--t-sm);font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
.up-arquivo-sub{font-size:var(--t-sm);color:var(--muted)}
.up-arquivo-erro{font-size:var(--t-sm);color:var(--danger-2);line-height:1.45}
.up-arquivo-notas{font-size:var(--t-xs);color:var(--ink-3);line-height:1.5;display:grid;gap:2px}
.up-ignorar{margin-left:auto;flex-shrink:0;padding:2px 9px;border:1px solid var(--border);background:var(--surface);border-radius:99px;font-size:var(--t-xs);font-weight:600;color:var(--muted);cursor:pointer;font-family:inherit}
.up-ignorar:hover{border-color:var(--border-strong);color:var(--ink-2)}

/* Grupos clicáveis (internados / com alta). Cor de link e chevron: precisam se ler
   como controle, não como rótulo — com o cinza das tags informativas ninguém
   percebia que dava para abrir. */
.up-grupos{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
/* Cor por SITUAÇÃO, não por importância: internado (azul) e alta (verde) são dois
   estados normais do censo, não um bom e outro ruim. Evitamos vermelho/laranja de
   propósito — nesta tela eles já significam erro e pendência. O verde da alta
   ecoa o "Alta OK" do StatusBadge, mantendo a leitura consistente entre telas.
   A cor é reforço: o rótulo ("internados"/"com alta") continua dizendo o estado
   por escrito, para quem não distingue as duas matizes. */
.up-grupo{display:inline-flex;align-items:center;gap:6px;padding:3px 9px 3px 11px;border:1px solid;border-radius:99px;background:var(--surface);font-size:var(--t-sm);font-family:inherit;cursor:pointer;transition:background .12s,border-color .12s,color .12s}
.up-grupo:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(21,92,168,.18)}

.up-grupo.internado{border-color:var(--info);color:var(--info)}
.up-grupo.internado:hover{background:var(--info-bg)}
.up-grupo.internado.aberto{background:var(--info);border-color:var(--info);color:#fff}

.up-grupo.alta{border-color:var(--success);color:var(--success-2)}
.up-grupo.alta:hover{background:var(--success-bg)}
.up-grupo.alta.aberto{background:var(--success);border-color:var(--success);color:#fff}
.up-grupo-n{font-family:var(--font-mono);font-weight:700;font-variant-numeric:tabular-nums}
.up-grupo-rot{font-weight:500}
.up-grupo-seta{display:grid;place-items:center;transition:transform .18s cubic-bezier(.2,.7,.2,1)}
.up-grupo.aberto .up-grupo-seta{transform:rotate(180deg)}
/* Grupo sem nomes para abrir (arquivo processado antes desta função): mantém a
   cor da situação, mas sem afford de clique. */
.up-grupo-mudo{display:inline-flex;align-items:center;gap:6px;padding:3px 11px;border:1px dashed;border-radius:99px;font-size:var(--t-sm)}
.up-grupo-mudo.internado{border-color:var(--info);color:var(--info)}
.up-grupo-mudo.alta{border-color:var(--success);color:var(--success-2)}
.up-grupos-dica{font-size:var(--t-xs);color:var(--muted-2)}

/* Lista de quem entrou: densa e com scroll próprio — um censo pode ter 60 nomes. */
.up-lista-pac{border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface-2);max-height:260px;overflow:auto}
/* Herda .bmais-table (cabeçalho sticky, zebra, hover) e só aperta a densidade:
   esta é uma lista de conferência dentro de um card, não a tabela cheia de uma
   tela. O nome é a única coluna elástica; as demais ficam do tamanho do conteúdo,
   e é esse alinhamento vertical que permite conferir o censo contra o PDF
   descendo a vista por uma coluna só. */
.up-pac-tabela{font-size:var(--t-sm)}
.up-pac-tabela thead th{padding:6px 8px;background:var(--surface-3)}
.up-pac-tabela tbody td{padding:5px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.up-pac-tabela th:first-child,.up-pac-tabela td:first-child{padding-left:10px}
.up-pac-tabela th:last-child,.up-pac-tabela td:last-child{padding-right:10px}
.up-pac-tabela th.col-data,.up-pac-tabela td.up-pac-data{text-align:right}
.up-pac-nome{max-width:0;width:100%}          /* absorve a sobra; o resto encolhe */
.up-pac-vazio{color:var(--muted-2);font-style:italic}
.up-pac-atend{font-family:var(--font-mono);font-size:var(--t-xs);color:var(--muted);font-variant-numeric:tabular-nums}
.up-pac-leito{font-size:var(--t-xs);color:var(--muted-2)}
.up-pac-conv{font-size:var(--t-xs);color:var(--muted-2);max-width:180px}
/* Data colorida pela situação — a mesma dupla dos grupos acima. */
.up-pac-data{font-size:var(--t-xs);font-weight:600;font-variant-numeric:tabular-nums}
.up-pac-data.internado{color:var(--info)}
.up-pac-data.alta{color:var(--success-2)}

@keyframes up-pop{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@keyframes up-check{from{stroke-dasharray:0 40;opacity:0}to{stroke-dasharray:40 40;opacity:1}}
`

const IcoUpload = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" />
  </svg>
)

const IcoCheck = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const IcoAtencao = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8v5" /><path d="M12 17h.01" />
  </svg>
)

const IcoChevron = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 9l6 6 6-6" />
  </svg>
)

function plural(n: number, singular: string, pluralForma = `${singular}s`): string {
  return n === 1 ? singular : pluralForma
}

const IcoPdf = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" />
  </svg>
)

// ── Área de envio ────────────────────────────────────────────────────────────
function DropZone({ files, onFiles }: { files: File[]; onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragover, setDragover] = useState(false)

  // Reenviar o mesmo arquivo depois de removê-lo só dispara o change se o input
  // for limpo — senão o navegador considera que o valor não mudou.
  function receber(novos: File[]) {
    if (inputRef.current) inputRef.current.value = ''
    if (novos.length) onFiles([...files, ...novos])
  }

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

    </>
  )
}

// ── Lista dos arquivos escolhidos ────────────────────────────────────────────
// Conferência antes de enviar: o usuário vê o que anexou e tira o que veio errado.
// O hospital NÃO aparece aqui — ele é único para o lote e foi escolhido no passo 1.
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

// Todos os pendentes de um conjunto de resultados (o backend carimba o arquivo em cada um).
function coletarPendentes(resultados: UploadCensoResult[]): PendenteCenso[] {
  return resultados.flatMap((r) => r.pendentes_detalhe ?? [])
}

export default function Upload() {
  const qc = useQueryClient()
  // Todo upload muda os dados de origem — o evento de domínio "dadosAlterados"
  // invalida (centralizadamente) os caches derivados: Dashboard/Diretoria/Gestor/
  // Sidebar/Kanban refazem o fetch ao serem abertos, sem esperar o staleTime.
  function invalidarDados() {
    invalidarPorEvento(qc, 'dadosAlterados')
  }

  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<UploadCensoResponse | null>(null)
  // Pacientes que o sistema leu mas não conseguiu completar e ainda não foram gravados.
  // Cada um já é uma pendência no Kanban — o que ficar sem completar continua lá.
  const [pendentes, setPendentes] = useState<PendenteCenso[]>([])
  // O assistente abre sozinho quando há algo a resolver; pode ser reaberto.
  const [wizardAberto, setWizardAberto] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  // Arquivos que o usuário mandou ignorar (só na tela): o PDF ilegível sai da lista
  // e do placar. Nada é gravado — não há o que gravar, o arquivo não foi lido.
  const [ignorados, setIgnorados] = useState<string[]>([])
  // Hospital do LOTE, escolhido antes de anexar os arquivos. É o 1º passo do envio:
  // com ele o sistema já lê cada PDF sabendo a origem (usando o leitor próprio
  // daquele hospital quando existe) em vez de perguntar depois.
  // Operadora primeiro, hospital depois. O cadastro tem uma linha por
  // hospital×operadora (385 linhas para 219 hospitais distintos), então uma lista
  // única repetiria o mesmo nome até 4x, sem nada que os diferenciasse na tela.
  // Filtrar pela operadora resolve na origem: cada nome aparece uma vez só.
  const [operadora, setOperadora] = useState('')
  const [hospital, setHospital] = useState('')
  // Desfazer: sessão em processo de reversão (trava o botão) e envios recentes.
  const [revertendo, setRevertendo] = useState<string | null>(null)
  // Envio aguardando confirmação para ser desfeito (null = modal fechada). Guarda
  // o que a modal mostra, para o texto citar o hospital e a quantidade.
  const [confirmarDesfazer, setConfirmarDesfazer] = useState<
    { sessao: string; quantos: number; hospital?: string | null } | null>(null)
  const hospitaisQ = useTodosHospitais()
  const sidebarQ = useSidebar()

  const operadoras = useMemo<Operadora[]>(() => {
    const daSidebar = sidebarQ.data?.operadoras ?? []
    if (daSidebar.length) return daSidebar
    // Fallback: deriva do próprio cadastro de hospitais enquanto a sidebar carrega.
    const vistas = new Map<string, string>()
    for (const h of hospitaisQ.data ?? []) {
      if (h.operadora_key && !vistas.has(h.operadora_key)) {
        vistas.set(h.operadora_key, h.operadora_nome || h.operadora_key)
      }
    }
    return [...vistas.entries()].map(([key, nome]) => ({ key, nome }))
  }, [sidebarQ.data, hospitaisQ.data])

  // Hospitais da operadora escolhida, sem nomes repetidos.
  const hospitaisDaOperadora = useMemo(() => {
    if (!operadora) return []
    return (hospitaisQ.data ?? []).filter((h) => h.operadora_key === operadora)
  }, [hospitaisQ.data, operadora])

  const hospitalEscolhido = hospitaisDaOperadora.find((h) => h.key === hospital) ?? null

  // Trocar de operadora invalida o hospital anterior (era de outra operadora).
  function trocarOperadora(nova: string) {
    setOperadora(nova)
    setHospital('')
  }

  // Arquivos ignorados saem de tudo o que a tela mostra — inclusive do placar,
  // senão o "1 com erro" continuaria contando o que o usuário mandou tirar.
  const visiveis = (result?.resultados ?? []).filter((r) => !ignorados.includes(r.arquivo))
  // Arquivos lidos cujo hospital não está no cadastro (o assistente pede o hospital).
  const semHospital = visiveis.filter((r) => r.precisa_hospital)
  // Pacientes que ESTE envio criou — exatamente o que o desfazer apaga. Não é o
  // total gravado: quem já existia e foi só atualizado não é removido.
  const gravados = visiveis.reduce((n, r) => n + (r.criados ?? 0), 0)
  // Pacientes que JÁ existiam e foram atualizados por este envio. O desfazer não os
  // toca (não há valor anterior guardado), então a tela precisa avisar: se o envio
  // foi no hospital errado, esses registros ficaram com dados de outro censo.
  const atualizados = visiveis.reduce((n, r) => n + (r.atualizados?.length ?? 0), 0)
  const aResolver = pendentes.length + semHospital.length

  async function processar(e: React.FormEvent) {
    e.preventDefault()
    if (!files.length) return
    setBusy(true)
    try {
      // O hospital do lote vale para TODOS os arquivos deste envio. O backend usa a
      // key para escolher o leitor e carimbar o resultado.
      const hospitais: Record<string, HospitalManual> = {}
      for (const f of files) hospitais[f.name] = { key: hospital }
      const data = await enviarCensos(files, hospitais)
      const pend = coletarPendentes(data.resultados ?? [])
      const faltaHosp = (data.resultados ?? []).filter((r) => r.precisa_hospital).length
      setResult(data)
      setPendentes(pend)
      setWizardAberto(pend.length + faltaHosp > 0)
      setFiles([])
      setIgnorados([])
      invalidarDados()
      const partes: string[] = []
      if (faltaHosp) partes.push(`${faltaHosp} ${plural(faltaHosp, 'arquivo')} sem hospital`)
      if (pend.length) partes.push(`${pend.length} ${plural(pend.length, 'paciente')} para completar`)
      setToast(partes.length ? `Censos lidos — ${partes.join(' · ')}` : 'Censos processados')
    } catch (err) {
      setToast(`Erro: ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  // Desfazer um envio: apaga os pacientes que ELE criou. É o conserto do erro mais
  // comum — mandar o censo no hospital errado. Passa pela modal de confirmação:
  // apagar paciente é irreversível.
  async function desfazer(sessao: string) {
    setConfirmarDesfazer(null)
    setRevertendo(sessao)
    try {
      const r = await reverterEnvioCenso(sessao)
      invalidarDados()
      if (result?.sessao === sessao) {
        setResult(null)
        setPendentes([])
      }
      setToast(`Envio desfeito — ${r.removidos} ${plural(r.removidos, 'paciente')} ${plural(r.removidos, 'removido')}`)
    } catch (err) {
      setToast(`Erro ao desfazer: ${(err as Error).message}`)
    } finally {
      setRevertendo(null)
    }
  }

  // Arquivo reprocessado pelo assistente com o hospital informado: substitui o
  // resultado daquele arquivo e soma os pendentes que ele trouxe.
  function onArquivoProcessado(res: UploadCensoResult) {
    setResult((atual) => atual
      ? { ...atual, resultados: atual.resultados.map((r) => (r.arquivo === res.arquivo ? res : r)) }
      : atual)
    setPendentes((lista) => [...lista, ...(res.pendentes_detalhe ?? [])])
    invalidarDados()
    setToast(`${res.arquivo}: ${res.total ?? 0} ${plural(res.total ?? 0, 'paciente')} ${plural(res.total ?? 0, 'gravado')}`)
  }

  function onSalvo(id: number, nome: string, situacao?: 'INTERNADO' | 'ALTA') {
    setPendentes((lista) => lista.filter((p) => p.pendencia_id !== id))
    // O paciente entrou agora: soma no placar do arquivo de origem, na coluna certa.
    // Sem isto os números do resumo ficavam no valor do processamento inicial e não
    // refletiam o que o próprio usuário acabou de completar.
    setResult((atual) => {
      if (!atual) return atual
      const pendente = pendentes.find((p) => p.pendencia_id === id)
      const alvo = pendente?.arquivo
      if (!alvo) return atual
      return {
        ...atual,
        resultados: atual.resultados.map((r) => (r.arquivo !== alvo ? r : {
          ...r,
          total: (r.total ?? 0) + 1,
          criados: (r.criados ?? 0) + 1,
          altas: (r.altas ?? 0) + (situacao === 'ALTA' ? 1 : 0),
          internados: (r.internados ?? 0) + (situacao === 'ALTA' ? 0 : 1),
          pendentes: Math.max(0, (r.pendentes ?? 0) - 1),
          // Entra também na lista de nomes: quem completou espera vê-lo ali junto
          // dos demais, e não só o contador subir.
          gravados_detalhe: [
            ...(r.gravados_detalhe ?? []),
            {
              nome: nome || pendente?.nome || null,
              atendimento: pendente?.atendimento ?? null,
              situacao: situacao === 'ALTA' ? 'ALTA' : 'INTERNADO',
              leito_codigo: pendente?.leito_codigo ?? null,
              data_entrada: pendente?.data_entrada ?? null,
              data_alta: pendente?.data_alta ?? null,
            },
          ],
        })),
      }
    })
    invalidarDados()
    setToast(`${nome || 'Paciente'} gravado`)
  }

  // Descartado = resolvido sem gravar. Sai da lista de pendentes igual ao gravado:
  // em ambos os casos a decisão já foi tomada e não há mais o que fazer com ele.
  function onDescartado(id: number, nome: string) {
    setPendentes((lista) => lista.filter((p) => p.pendencia_id !== id))
    setToast(`${nome || 'Paciente'} descartado — não foi gravado`)
  }

  usePageHeader({
    title: 'Envio de Censos',
    subtitle: 'Escolha o hospital e envie os arquivos do censo (PDF, CSV ou Excel).',
  })

  return (
    <>
      <style>{localStyles}</style>
      <div>
        <div className="card">
          {/* Sem título/subtítulo próprios: o cabeçalho da página já diz o que é a
              tela, e os passos numerados abaixo explicam o fluxo sozinhos. */}
          <div className="card-body" style={{ paddingTop: 16 }}>
            <form onSubmit={processar}>
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
                      onChange={(e) => trocarOperadora(e.target.value)}
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
                          disabled={hospitaisQ.isLoading || busy}
                          placeholder={hospitaisQ.isLoading ? 'Carregando hospitais…' : 'Digite o nome do hospital…'}
                          onChange={setHospital}
                        />
                      </div>
                      {!hospitaisQ.isLoading && hospitaisDaOperadora.length === 0 && (
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
                      <DropZone files={files} onFiles={setFiles} />
                      <ListaArquivos files={files} onFiles={setFiles} />
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
                {files.length > 0 && !busy && (
                  <>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFiles([])}>
                      Limpar arquivos
                    </button>
                    <span className="up-acoes-info">
                      {files.length} {plural(files.length, 'arquivo')} {plural(files.length, 'pronto')} para envio
                    </span>
                  </>
                )}
                {busy && <span className="up-acoes-info">Não feche a página até terminar.</span>}
              </div>
            </form>
          </div>
        </div>

        {result && visiveis.length > 0 && (
          <>
            <div className="section-label">Resultado do processamento</div>
            <ResultadoEnvio
              resultados={visiveis}
              pendentes={pendentes.length}
              semHospital={semHospital.length}
              criados={gravados}
              atualizados={atualizados}
              podeDesfazer={Boolean(result.sessao) && gravados > 0}
              desfazendo={revertendo === result.sessao}
              onCompletar={!wizardAberto && aResolver > 0 ? () => setWizardAberto(true) : undefined}
              onDesfazer={() => setConfirmarDesfazer({
                sessao: result.sessao, quantos: gravados, hospital: hospitalEscolhido?.nome,
              })}
              onIgnorar={(arquivo) => {
                setIgnorados((lista) => [...lista, arquivo])
                setToast(`${arquivo} ignorado`)
              }}
            />
          </>
        )}
      </div>

      {wizardAberto && result && aResolver > 0 && (
        <WizardComplemento
          sessao={result.sessao}
          arquivosSemHospital={semHospital}
          pendentes={pendentes}
          onArquivoProcessado={onArquivoProcessado}
          onSalvo={onSalvo}
          onDescartado={onDescartado}
          onClose={() => setWizardAberto(false)}
        />
      )}

      {confirmarDesfazer && (
        <ConfirmarModal
          titulo="Desfazer este envio?"
          perigo
          confirmar="Apagar e desfazer"
          cancelar="Manter como está"
          ocupado={revertendo === confirmarDesfazer.sessao}
          onCancelar={() => setConfirmarDesfazer(null)}
          onConfirmar={() => desfazer(confirmarDesfazer.sessao)}
        >
          <div>
            <strong>{confirmarDesfazer.quantos} {plural(confirmarDesfazer.quantos, 'paciente')}</strong>{' '}
            {plural(confirmarDesfazer.quantos, 'criado')} por este envio
            {confirmarDesfazer.hospital && <> em <strong>{confirmarDesfazer.hospital}</strong></>}{' '}
            {plural(confirmarDesfazer.quantos, 'será', 'serão')}{' '}
            {plural(confirmarDesfazer.quantos, 'apagado')}. Esta ação não pode ser desfeita.
          </div>
          <div>
            Pacientes que já existiam antes e foram apenas atualizados por este envio{' '}
            <strong>não são apagados</strong>.
          </div>
        </ConfirmarModal>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  )
}

// ── Resumo do lote: o placar do que entrou e do que ficou pendente ────────────
// ── Resultado do envio ───────────────────────────────────────────────────────
// Um componente só. Antes eram três blocos empilhados (placar + linha por arquivo
// + faixa de desfazer) que repetiam a mesma informação: com UM arquivo — o caso
// comum — o placar dizia "25 gravados / 25 em leito" e a linha logo abaixo dizia
// exatamente o mesmo, com os mesmos números.
//
// Agora o placar aparece SÓ quando resume algo: mais de um arquivo, ou algo que a
// linha não mostra (pendências, erros). Com um arquivo só, a linha basta.
function ResultadoEnvio({
  resultados, pendentes, semHospital, criados, atualizados,
  podeDesfazer, desfazendo, onCompletar, onDesfazer, onIgnorar,
}: {
  resultados: UploadCensoResult[]
  pendentes: number
  semHospital: number
  /** Pacientes que este envio criou — o que o desfazer apaga. */
  criados: number
  /** Já existiam e foram atualizados: o desfazer NÃO os toca. */
  atualizados: number
  podeDesfazer: boolean
  desfazendo: boolean
  /** Ausente quando não há nada a completar. */
  onCompletar?: () => void
  onDesfazer: () => void
  onIgnorar: (arquivo: string) => void
}) {
  const falhas = resultados.filter((r) => r.erro).length
  const totalPacientes = resultados.reduce((s, r) => s + (r.total || 0), 0)
  const emLeito = resultados.reduce((s, r) => s + (r.internados || 0), 0)
  const comAlta = resultados.reduce((s, r) => s + (r.altas || 0), 0)

  const problemas = pendentes > 0 || semHospital > 0 || falhas > 0
  // O placar só ganha espaço se realmente somar algo além do que a linha já diz.
  const vaiResumir = resultados.length > 1 || problemas

  return (
    <div className="up-resultado">
      {vaiResumir && (
        <div className="up-placar">
          <span className={`up-placar-ico ${problemas ? 'atencao' : 'ok'}`}>
            {problemas ? IcoAtencao : IcoCheck}
          </span>
          <div className="up-placar-txt">
            <strong>{totalPacientes}</strong> {plural(totalPacientes, 'paciente')}{' '}
            {plural(totalPacientes, 'gravado')}
            {emLeito > 0 && comAlta > 0 && (
              <>
                {' · '}
                <b className="up-cor-internado">{emLeito} em leito</b>
                {', '}
                <b className="up-cor-alta">{comAlta} com alta</b>
              </>
            )}
            {resultados.length > 1 && <> · {resultados.length} arquivos</>}
          </div>
          {problemas && (
            <div className="up-placar-alertas">
              {pendentes > 0 && <span className="badge warning">{pendentes} a completar</span>}
              {semHospital > 0 && <span className="badge warning">{semHospital} sem hospital</span>}
              {falhas > 0 && <span className="badge danger">{falhas} com erro</span>}
            </div>
          )}
        </div>
      )}

      {onCompletar && (
        <div className="up-faixa atencao">
          <span className="up-faixa-txt">
            {pendentes > 0
              ? <>{pendentes} {plural(pendentes, 'paciente')} {plural(pendentes, 'veio', 'vieram')} com dado faltando e {plural(pendentes, 'aguarda', 'aguardam')} sua decisão.</>
              : <>{semHospital} {plural(semHospital, 'arquivo')} sem hospital — nada foi gravado.</>}
          </span>
          <button type="button" className="btn btn-primary btn-sm" onClick={onCompletar}>
            Completar agora
          </button>
        </div>
      )}

      {resultados.map((res, i) => (
        <LinhaResultado key={`${res.arquivo}-${i}`} res={res} onIgnorar={onIgnorar} />
      ))}

      {podeDesfazer && (
        <div className="up-faixa">
          <span className="up-faixa-txt">
            Hospital errado? Desfazer apaga os {criados} {plural(criados, 'paciente')} que este envio criou.
            {atualizados > 0 && (
              <> {atualizados} já {plural(atualizados, 'existia', 'existiam')} antes e {plural(atualizados, 'permanece', 'permanecem')}.</>
            )}
          </span>
          <button type="button" className="btn btn-outline btn-sm"
                  disabled={desfazendo} onClick={onDesfazer}>
            {desfazendo ? 'Desfazendo…' : 'Desfazer envio'}
          </button>
        </div>
      )}
    </div>
  )
}

// Lista dos pacientes de um grupo (em leito ou com alta), para conferência.
//
// Tabela de colunas fixas, não uma linha corrida de campos: conferir um censo é
// comparar com o PDF ao lado, e para isso o olho precisa descer UMA coluna (todas
// as datas alinhadas, todos os atendimentos alinhados) em vez de reencontrar cada
// campo numa posição diferente a cada linha. As colunas são só os campos que todo
// censo traz — acrescentar um que metade dos hospitais não preenche deixaria a
// tabela cheia de buracos.
function ListaPacientes({ pacientes }: { pacientes: PacienteGravado[] }) {
  if (!pacientes.length) return null
  // O rótulo da data muda com o grupo, e o grupo é homogêneo (a lista já vem
  // filtrada por situação): o cabeçalho diz "entrada" ou "alta", e a célula fica
  // só com o valor — repetir a palavra em toda linha era ruído.
  const deAlta = pacientes[0].situacao === 'ALTA'
  return (
    <div className="up-lista-pac">
      <table className="bmais-table up-pac-tabela">
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Atendimento</th>
            <th>Leito</th>
            <th>Convênio</th>
            <th className="col-data">{deAlta ? 'Alta' : 'Entrada'}</th>
          </tr>
        </thead>
        <tbody>
          {pacientes.map((p, i) => (
            <tr key={`${p.atendimento ?? ''}-${i}`}>
              {/* Alguns censos não trazem coluna de paciente: o hospital
                  identifica a internação pela senha de autorização, e é ela que
                  aparece aqui. */}
              <td className="up-pac-nome" title={p.nome ?? undefined}>
                {p.nome || <i className="up-pac-vazio">sem identificação no PDF</i>}
              </td>
              <td className="up-pac-atend">{p.atendimento || '—'}</td>
              <td className="up-pac-leito">{p.leito_codigo || '—'}</td>
              <td className="up-pac-conv" title={p.convenio ?? undefined}>
                {p.convenio || '—'}
              </td>
              {/* A data recebe a cor da situação — a mesma dupla dos grupos acima. */}
              <td className={`up-pac-data ${deAlta ? 'alta' : 'internado'}`}>
                {(deAlta ? p.data_alta : p.data_entrada) || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Um arquivo do envio ──────────────────────────────────────────────────────
function LinhaResultado({ res, onIgnorar }: {
  res: UploadCensoResult
  onIgnorar: (arquivo: string) => void
}) {
  // Grupo aberto (null = recolhido). Recolhido por padrão: um lote com vários
  // arquivos de 60 pacientes empurraria a tela inteira.
  const [aberto, setAberto] = useState<'INTERNADO' | 'ALTA' | null>(null)

  if (res.erro) {
    return (
      <div className="up-arquivo erro">
        <div className="up-arquivo-topo">
          <span className="up-arquivo-nome" title={res.arquivo}>{res.arquivo}</span>
          <span className="badge danger"><i className="bdot" />não lido</span>
          <button type="button" className="up-ignorar" onClick={() => onIgnorar(res.arquivo)}
                  title="Tira este arquivo da lista. Nada foi gravado por ele.">
            Ignorar
          </button>
        </div>
        <div className="up-arquivo-erro">{res.erro}</div>
      </div>
    )
  }

  if (res.precisa_hospital) {
    const lidos = res.pacientes_extraidos ?? 0
    return (
      <div className="up-arquivo atencao">
        <div className="up-arquivo-topo">
          <span className="up-arquivo-nome" title={res.arquivo}>{res.arquivo}</span>
          <span className="badge warning"><i className="bdot" />falta o hospital</span>
        </div>
        <div className="up-arquivo-sub">
          {res.hospital_sugerido
            ? <>O PDF diz <b>“{res.hospital_sugerido}”</b>, que não está no cadastro.</>
            : <>O PDF não traz o nome do hospital.</>}
          {' '}{lidos} {plural(lidos, 'paciente')} {plural(lidos, 'lido')}, nenhum gravado.
        </div>
      </div>
    )
  }

  const gravados = res.gravados_detalhe ?? []
  const emLeito = gravados.filter((p) => p.situacao !== 'ALTA')
  const comAlta = gravados.filter((p) => p.situacao === 'ALTA')
  const pendentes = res.pendentes || 0
  const descartados = res.descartados || 0
  const avisos = res.avisos ?? []

  // Um grupo vira botão quando há nomes para mostrar; senão é só o número — não
  // pode parecer clicável sem ter o que abrir.
  const grupo = (
    chave: 'INTERNADO' | 'ALTA', n: number, rotulo: string, lista: PacienteGravado[],
  ) => {
    if (!n) return null
    const cor = chave === 'ALTA' ? 'alta' : 'internado'
    if (!lista.length) return <span className={`up-grupo-mudo ${cor}`}>{n} {rotulo}</span>
    const ativo = aberto === chave
    return (
      <button
        type="button"
        className={`up-grupo ${cor}${ativo ? ' aberto' : ''}`}
        aria-expanded={ativo}
        onClick={() => setAberto((a) => (a === chave ? null : chave))}
      >
        <span className="up-grupo-n">{n}</span>
        <span className="up-grupo-rot">{rotulo}</span>
        <span className="up-grupo-seta">{IcoChevron}</span>
      </button>
    )
  }

  return (
    <div className={`up-arquivo ${pendentes > 0 || avisos.length ? 'atencao' : 'ok'}`}>
      <div className="up-arquivo-topo">
        <span className="up-arquivo-nome" title={res.arquivo}>{res.arquivo}</span>
        <span className="up-arquivo-sub">
          {res.hospital_nome || res.hospital || 'Hospital não informado'}
        </span>
      </div>

      <div className="up-grupos">
        {grupo('INTERNADO', res.internados ?? 0, plural(res.internados ?? 0, 'internado'), emLeito)}
        {grupo('ALTA', res.altas ?? 0, 'com alta', comAlta)}
        {gravados.length > 0 && !aberto && (
          <span className="up-grupos-dica">clique para ver os nomes</span>
        )}
      </div>

      {aberto && <ListaPacientes pacientes={aberto === 'ALTA' ? comAlta : emLeito} />}

      {(pendentes > 0 || descartados > 0 || avisos.length > 0) && (
        <div className="up-arquivo-notas">
          {pendentes > 0 && (
            <div>{pendentes} {plural(pendentes, 'paciente')} com dado faltando.</div>
          )}
          {descartados > 0 && (
            <div>
              {descartados} {plural(descartados, 'alta')} de paciente sem internação no
              sistema — {plural(descartados, 'ignorada')}.
            </div>
          )}
          {avisos.map((a, j) => <div key={j}>⚠ {a}</div>)}
        </div>
      )}
    </div>
  )
}
