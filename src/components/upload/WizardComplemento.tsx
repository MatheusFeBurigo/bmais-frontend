// Assistente de complemento do censo: abre sozinho após o processamento. Dois
// tipos de passo, nesta ordem:
//   1. HOSPITAL — arquivo cujo PDF foi lido mas o hospital não está no cadastro:
//      o usuário escolhe um cadastrado ou cadastra um novo; o arquivo é
//      reprocessado na hora (mesma sessão) e seus pendentes viram passos abaixo.
//   2. PACIENTE — paciente que o parser não conseguiu validar: mostra o que FOI
//      capturado do PDF (editável + contexto) e o que FALTOU (em destaque), e
//      grava via /upload/pendencia/{id}/completar.
// A revisão acontece TODA aqui: não há mais coluna "Analisar censo" no Kanban
// para resgatar o que ficasse aberto. Por isso cada paciente exige uma decisão —
// preencher (grava) ou DESCARTAR (resolve a pendência sem gravar). Fechar o
// assistente com pacientes ainda sem decisão pede confirmação.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { completarPendenciaCenso, descartarPendenciaCenso, reprocessarCensos } from '../../services/censos.service'
import type {
  CampoCenso, CompletarPendenciaPayload, Hospital, HospitalManual, Operadora,
  PendenteCenso, UploadCensoResult,
} from '../../types/api'
import { Alerta, alertaStyles } from './Alerta'
import { Spinner } from '../ui'
import { ConfirmarModal } from '../ConfirmarModal'
import { HospitalCombobox } from '../HospitalCombobox'
import { useTodosHospitais } from '../../hooks/useEquipe'
import { useSidebar } from '../../hooks/useDashboard'
import { useTravarScroll } from '../../lib/travarScroll'
import { motivoCensoTexto, tipoCensoTexto } from '../../lib/pendenciaLabels'
import { paraISO } from '../../lib/datas'

const styles = `
.wz{max-width:760px;width:94%;margin:5vh auto;position:relative;padding:0;overflow:hidden;display:flex;flex-direction:column;max-height:90vh;box-shadow:var(--shadow-lg)}
.wz-head{padding:14px 20px 12px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-shrink:0}
.wz-head-txt{min-width:0}
.wz-titulo{font-size:var(--t-md);font-weight:600;letter-spacing:-.01em;color:var(--ink)}
.wz-sub{font-size:var(--t-sm);color:var(--muted);margin-top:2px;display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.wz-passo-n{font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.04em;padding:1px 7px;border-radius:99px;background:var(--primary-soft);color:var(--primary);flex-shrink:0}
.wz-fechar{display:grid;place-items:center;width:28px;height:28px;flex-shrink:0;border:1px solid transparent;background:none;border-radius:7px;color:var(--muted);cursor:pointer;transition:background .12s,color .12s,border-color .12s}
.wz-fechar:hover{background:var(--surface-3);color:var(--ink-2);border-color:var(--border)}
.wz-progress{height:3px;background:var(--bg-2);flex-shrink:0}
.wz-progress>div{height:100%;background:var(--primary-3);transition:width .25s cubic-bezier(.2,.7,.2,1)}
.wz .card-body{padding:16px 20px 18px;overflow-y:auto;overscroll-behavior:contain;flex:1;min-height:0}
/* Passo de hospital: SEM scroll proprio — o menu do combobox e posicionado
   absoluto e um overflow:auto no ancestral o recortaria. O passo e curto (2
   campos), entao nao precisa rolar; se a tela for muito baixa, o proprio card
   ja limita a 90vh e o conteudo cabe. */
.wz .card-body.wz-sem-scroll{overflow:visible}
.wz-body{display:grid;gap:14px;align-content:start}

/* Cabeçalho do passo: quem/qual arquivo estamos resolvendo. */
.wz-alvo{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding-bottom:12px;border-bottom:1px solid var(--border-soft)}
.wz-alvo-ico{width:32px;height:32px;flex-shrink:0;border-radius:9px;display:grid;place-items:center;background:var(--warning-bg);color:var(--warning-2)}
.wz-alvo-txt{flex:1;min-width:160px}
.wz-alvo-nome{font-weight:600;font-size:var(--t-md);color:var(--ink);letter-spacing:-.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wz-alvo-meta{font-size:var(--t-sm);color:var(--muted);margin-top:1px}

/* Explicação do que falta — texto corrente, não bullet de log. */
/* Só empilha os <Alerta> do passo — a forma de cada um vem do componente. */
.wz-motivos{display:grid;gap:5px}

.wz-sec{display:grid;gap:9px}
.wz-sec-lbl{font-size:10px;letter-spacing:.12em;font-weight:700;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:9px}
.wz-sec-lbl::after{content:"";flex:1;height:1px;background:var(--border-soft)}
.wz-sec-lbl.falta{color:var(--warning-2)}
.wz-sec-lbl.falta::after{background:rgba(217,105,12,.2)}
.wz-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}
/* Busca de hospital: campo em linha cheia + filtro de operadora menor embaixo. */
.wz-busca{display:grid;gap:10px}
.wz-filtro-op{max-width:280px}
.wz-lbl{display:block;margin-bottom:4px;font-size:10px;letter-spacing:.08em;font-weight:600;text-transform:uppercase;color:var(--muted)}
.wz-lbl.falta{color:var(--warning-2)}
.wz .bm-input.falta{border-color:var(--warning);background:var(--warning-bg)}
.wz .bm-input.falta:focus{border-color:var(--warning);box-shadow:0 0 0 3px rgba(217,105,12,.12)}
.wz .bm-input:disabled{background:var(--surface-3);color:var(--muted);cursor:default}
.wz-hint{font-size:var(--t-xs);color:var(--muted);margin-top:3px;line-height:1.4}

.wz-chips{display:flex;flex-wrap:wrap;gap:6px}
.wz-chip{font-size:var(--t-xs);background:var(--surface-3);border:1px solid var(--border);border-radius:99px;padding:3px 10px;color:var(--muted)}
.wz-chip b{color:var(--ink-2);font-weight:600}

/* Escolha do modo: dois cartões clicáveis, não dois radios soltos. */
.wz-modo{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px}
.wz-modo label{display:flex;align-items:flex-start;gap:9px;padding:10px 12px;border:1px solid var(--border);background:var(--surface);border-radius:9px;cursor:pointer;transition:border-color .12s,background .12s}
.wz-modo label:hover{border-color:var(--border-strong)}
.wz-modo label.sel{border-color:var(--primary-3);background:var(--primary-soft)}
.wz-modo input{margin:2px 0 0;accent-color:var(--primary-3);cursor:pointer;flex-shrink:0}
.wz-modo-txt{min-width:0;display:block}
/* block: como <span>, margin-top e line-height nao se aplicavam e o titulo saia
   colado na descricao ("Ja esta cadastradoEscolher um hospital da lista"). */
.wz-modo-t{display:block;font-size:var(--t-base);font-weight:600;color:var(--ink-2);line-height:1.25}
.wz-modo-d{display:block;font-size:var(--t-xs);color:var(--muted);margin-top:3px;line-height:1.4}

.wz-foot{padding:11px 20px;border-top:1px solid var(--border);background:var(--surface-2);display:flex;gap:8px;align-items:center;flex-wrap:wrap;flex-shrink:0}
.wz-erro{display:flex;align-items:center;gap:6px;font-size:var(--t-sm);color:var(--danger-2);background:var(--danger-bg);border-radius:7px;padding:4px 10px;flex:1;min-width:180px;line-height:1.35}
.wz-spacer{flex:1}

.wz-ok{display:flex;gap:9px;align-items:flex-start;border-left:3px solid var(--success);background:var(--success-bg);padding:10px 14px;border-radius:0 var(--r-sm) var(--r-sm) 0;font-size:var(--t-sm);color:var(--ink-2);line-height:1.5}
.wz-ok-ico{color:var(--success);flex-shrink:0}

/* Resumo final */
.wz-resumo{display:grid;gap:16px;font-size:var(--t-sm);color:var(--ink-3);line-height:1.5}
.wz-placar{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}
.wz-placar-item{border:1px solid var(--border);border-radius:10px;padding:11px 13px;background:var(--surface-2);position:relative;overflow:hidden}
.wz-placar-item::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--ink-2)}
.wz-placar-item.ok::before{background:var(--success)}
.wz-placar-item.pend::before{background:var(--warning)}
.wz-resumo-n{font-family:var(--font-mono);font-size:var(--t-2xl);font-weight:600;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums;color:var(--ink)}
.wz-placar-item.ok .wz-resumo-n{color:var(--success)}
.wz-placar-item.pend .wz-resumo-n{color:var(--warning)}
.wz-placar-l{font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:600;color:var(--muted);margin-top:4px}
`

// ── Ícones ────────────────────────────────────────────────────────────────────
const IcoOk = (
  <svg className="wz-ok-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const IcoAlerta = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" />
  </svg>
)

const IcoArquivo = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" />
  </svg>
)

const IcoPessoa = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)

function plural(n: number, singular: string, pluralForma = `${singular}s`): string {
  return n === 1 ? singular : pluralForma
}

// ── Modelo dos passos ─────────────────────────────────────────────────────────
type Passo =
  | { tipo: 'hospital'; arquivo: UploadCensoResult }
  | { tipo: 'paciente'; item: PendenteCenso }

type EstadoItem = 'pendente' | 'salvo' | 'descartado'
type EstadoArquivo = 'pendente' | 'processado' | 'pulado'

interface Rascunho {
  atendimento: string
  nome: string
  data_entrada: string
  data_alta: string
}

interface HospForm {
  modo: 'existente' | 'novo'
  operadora: string      // filtra a lista (existente) ou é a operadora do novo
  hospitalKey: string    // existente
  nome: string           // novo
}

const ORDEM: CampoCenso[] = ['atendimento', 'nome', 'data_entrada', 'data_alta']

const CAMPO_LABEL: Record<CampoCenso, string> = {
  atendimento: 'Nº de atendimento',
  nome: 'Nome do paciente',
  data_entrada: 'Data de internação',
  data_alta: 'Data de alta',
}

const CAMPO_TIPO: Record<CampoCenso, 'text' | 'date'> = {
  atendimento: 'text', nome: 'text', data_entrada: 'date', data_alta: 'date',
}

// Contexto capturado do PDF, só leitura — ajuda o usuário a reconhecer o paciente.
const CONTEXTO: Array<[keyof PendenteCenso, string]> = [
  ['situacao', 'Situação'], ['data_nascimento', 'Nascimento'], ['setor', 'Setor'],
  ['leito_codigo', 'Leito'], ['tipo_leito', 'Tipo de leito'], ['convenio', 'Convênio'],
  ['categoria', 'Categoria'], ['especialidade', 'Especialidade'], ['medico', 'Médico'],
]

function chavePaciente(p: PendenteCenso): string {
  return p.pendencia_id != null
    ? String(p.pendencia_id)
    : `x-${p.arquivo ?? ''}-${p.atendimento ?? ''}-${p.nome ?? ''}`
}

function rascunhoDe(p: PendenteCenso): Rascunho {
  return {
    atendimento: p.atendimento ?? '',
    nome: p.nome ?? '',
    data_entrada: paraISO(p.data_entrada),
    data_alta: paraISO(p.data_alta),
  }
}

// Data: se o usuário não mexeu, devolve o valor cru extraído (pode ser um formato
// que o <input type="date"> não exibe, ex. "05/04/26", mas que o backend aceita);
// se mexeu, o ISO do input. Vazio → null (limpa o valor extraído).
function valorData(original: string | null | undefined, editado: string): string | null {
  if (editado === paraISO(original)) return original ?? null
  return editado || null
}

function payloadDe(item: PendenteCenso, r: Rascunho): CompletarPendenciaPayload {
  return {
    hospital_key: item.hospital_key ?? undefined,
    atendimento: r.atendimento.trim(),
    nome: r.nome.trim(),
    data_entrada: valorData(item.data_entrada, r.data_entrada),
    data_alta: valorData(item.data_alta, r.data_alta),
  }
}

function valorContexto(campo: keyof PendenteCenso, v: unknown): string | null {
  if (v == null || v === '') return null
  if (campo === 'situacao') return v === 'ALTA' ? 'Alta' : 'Internado'
  return String(v)
}

function porChave<T>(itens: PendenteCenso[], f: (p: PendenteCenso) => T): Record<string, T> {
  return Object.fromEntries(itens.map((p) => [chavePaciente(p), f(p)]))
}

// Hospital sugerido pelo PDF quase sempre é novo no cadastro (senão teria casado):
// começa em "novo" com o nome pré-preenchido; sem sugestão, começa em "existente".
function hospFormInicial(a: UploadCensoResult): HospForm {
  return {
    modo: a.hospital_sugerido ? 'novo' : 'existente',
    operadora: a.operadora ?? '',
    hospitalKey: '',
    nome: a.hospital_sugerido ?? '',
  }
}

/** Dados do hospital prontos para gravar, ou `null` se ainda falta algo.
 *
 *  `operadorasValidas` (as keys do cadastro) é obrigatório no modo "novo": não
 *  basta o campo estar preenchido, a key precisa EXISTIR. Um censo pode trazer a
 *  razão social ("BRADESCO SEGUR") que não casa nenhuma operadora cadastrada; se
 *  aceitássemos qualquer string, o hospital nasceria vinculado a uma operadora
 *  inexistente — sem regras de avaliação e invisível nas telas. */
function hospManualDe(f: HospForm, operadorasValidas?: Set<string>): HospitalManual | null {
  if (f.modo === 'existente') return f.hospitalKey ? { key: f.hospitalKey } : null
  const nome = f.nome.trim()
  if (!nome || !f.operadora) return null
  if (operadorasValidas && !operadorasValidas.has(f.operadora)) return null
  return { nome, operadora_key: f.operadora }
}

function Campo({ campo, value, onChange, faltando, cru, disabled }: {
  campo: CampoCenso
  value: string
  onChange: (v: string) => void
  faltando: boolean
  /** Valor cru extraído que o input não consegue exibir (mostrado como dica). */
  cru?: string | null
  disabled?: boolean
}) {
  return (
    <div>
      <label className={`wz-lbl${faltando ? ' falta' : ''}`}>
        {CAMPO_LABEL[campo]}{faltando ? ' · preencher' : ''}
      </label>
      <input
        type={CAMPO_TIPO[campo]}
        className={`bm-input${faltando ? ' falta' : ''}`}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      {cru && !value && <div className="wz-hint">No censo está “{cru}”. Confirme a data no calendário.</div>}
    </div>
  )
}

export default function WizardComplemento({
  sessao, arquivosSemHospital, pendentes, onArquivoProcessado, onSalvo, onDescartado, onClose,
}: {
  /** Sessão do upload (pasta de staging) — o reprocessamento lê os mesmos arquivos. */
  sessao: string
  /** Arquivos lidos cujo hospital não está no cadastro (passos de hospital). */
  arquivosSemHospital: UploadCensoResult[]
  /** Pendentes a completar, na ordem do lote (passos de paciente). */
  pendentes: PendenteCenso[]
  /** Arquivo reprocessado com hospital: o pai substitui o resultado e soma os pendentes. */
  onArquivoProcessado: (res: UploadCensoResult) => void
  /** Chamado a cada paciente gravado (o pai atualiza contadores/caches).
   *  `situacao` diz em qual coluna do placar ele entra (em leito x com alta). */
  onSalvo: (pendenciaId: number, nome: string, situacao?: 'INTERNADO' | 'ALTA') => void
  /** Chamado a cada paciente descartado (resolvido sem gravar). */
  onDescartado: (pendenciaId: number, nome: string) => void
  onClose: () => void
}) {
  // O assistente congela as listas ao abrir; novos passos só entram por reprocessamento.
  const [passos, setPassos] = useState<Passo[]>(() => [
    ...arquivosSemHospital.map((arquivo): Passo => ({ tipo: 'hospital', arquivo })),
    ...pendentes.map((item): Passo => ({ tipo: 'paciente', item })),
  ])
  const [idx, setIdx] = useState(0)

  // Estado dos passos de PACIENTE (por chave).
  const [rascunhos, setRascunhos] = useState<Record<string, Rascunho>>(() => porChave(pendentes, rascunhoDe))
  const [faltantes, setFaltantes] = useState<Record<string, CampoCenso[]>>(
    () => porChave(pendentes, (p) => p.campos_faltantes ?? []))
  const [motivos, setMotivos] = useState<Record<string, string[]>>(
    () => porChave(pendentes, (p) => p.motivos ?? []))
  const [estado, setEstado] = useState<Record<string, EstadoItem>>({})
  const [erro, setErro] = useState<Record<string, string | undefined>>({})

  // Estado dos passos de HOSPITAL (por nome de arquivo).
  const [hospForm, setHospForm] = useState<Record<string, HospForm>>(
    () => Object.fromEntries(arquivosSemHospital.map((a) => [a.arquivo, hospFormInicial(a)])))
  const [hospEstado, setHospEstado] = useState<Record<string, EstadoArquivo>>({})
  const [hospResultado, setHospResultado] = useState<Record<string, UploadCensoResult>>({})
  const [hospErro, setHospErro] = useState<Record<string, string | undefined>>({})

  const [ocupado, setOcupado] = useState(false)
  // Confirmação de saída com pacientes sem decisão (substitui o window.confirm).
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)

  // Espelhos para o guard de fechamento: `tentarFechar` precisa do estado ATUAL
  // sem virar uma dependência que se refaz a cada tecla (o listener de Esc seria
  // reassinado a cada render).
  const passosRef = useRef(passos)
  const estadoRef = useRef(estado)
  passosRef.current = passos
  estadoRef.current = estado

  // Cadastros para o passo de hospital (só busca se houver esse passo).
  const temHosp = arquivosSemHospital.length > 0
  const hospitaisQ = useTodosHospitais(temHosp)
  const sidebarQ = useSidebar()
  const operadoras = useMemo<Operadora[]>(() => {
    const doSidebar = sidebarQ.data?.operadoras ?? []
    if (doSidebar.length) return doSidebar
    // Fallback: operadoras derivadas dos hospitais (quando a sidebar ainda não carregou).
    const vistas = new Map<string, string>()
    for (const h of hospitaisQ.data ?? []) {
      if (h.operadora_key && !vistas.has(h.operadora_key)) vistas.set(h.operadora_key, h.operadora_nome || h.operadora_key)
    }
    return [...vistas.entries()].map(([key, nome]) => ({ key, nome }))
  }, [sidebarQ.data, hospitaisQ.data])
  // Keys realmente cadastradas — o formulário só aceita uma destas como operadora.
  const operadorasValidas = useMemo(() => new Set(operadoras.map((o) => o.key)), [operadoras])

  // Fechar com pacientes ainda sem decisão: como não há fila no Kanban, eles
  // ficariam como pendência aberta invisível. Avisa antes de sair.
  // Quantos pacientes ficariam sem decisão se o assistente fechasse agora. Sem fila
  // no Kanban, eles viram pendência aberta invisível — por isso a confirmação.
  const semDecisaoAoFechar = passos.filter(
    (p) => p.tipo === 'paciente' && (estado[chavePaciente(p.item)] ?? 'pendente') === 'pendente',
  ).length

  const tentarFechar = useCallback(() => {
    const pendentesAgora = passosRef.current.filter(
      (p) => p.tipo === 'paciente' && (estadoRef.current[chavePaciente(p.item)] ?? 'pendente') === 'pendente',
    ).length
    if (pendentesAgora > 0) {
      setConfirmandoSaida(true)
      return
    }
    onClose()
  }, [onClose])

  useEffect(() => {
    // Com a confirmação aberta, o Esc pertence a ELA (o Modal a fecha): reagir aqui
    // também reabriria/duplicaria o fluxo de saída.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirmandoSaida) tentarFechar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tentarFechar, confirmandoSaida])

  const n = passos.length
  const resumo = idx >= n
  const passo = resumo ? null : passos[idx]
  const salvos = Object.values(estado).filter((e) => e === 'salvo').length
  const descartados = Object.values(estado).filter((e) => e === 'descartado').length
  // Pacientes que o usuário ainda não decidiu (nem gravou, nem descartou). Sem fila
  // no Kanban, sair deixando-os assim é perda silenciosa — por isso o aviso.
  const semDecisao = passos.filter(
    (p) => p.tipo === 'paciente' && (estado[chavePaciente(p.item)] ?? 'pendente') === 'pendente',
  ).length
  const processados = Object.values(hospEstado).filter((e) => e === 'processado').length
  const pacientesGravadosPorHospital = Object.values(hospResultado).reduce((s, r) => s + (r.total || 0), 0)

  function avancar() { setIdx((i) => Math.min(i + 1, n)) }
  function voltar() { setIdx((i) => Math.max(i - 1, 0)) }

  // ── Passo de paciente ──────────────────────────────────────────────────────
  function setCampo(k: string, campo: CampoCenso, v: string) {
    setRascunhos((r) => ({ ...r, [k]: { ...r[k], [campo]: v } }))
  }

  // Descartar = decisão explícita de que o registro NÃO entra. Resolve a pendência
  // no backend: sem coluna no Kanban, deixá-la aberta a tornaria invisível.
  async function descartarPaciente(item: PendenteCenso) {
    const k = chavePaciente(item)
    if (item.pendencia_id == null) return
    setOcupado(true)
    setErro((e) => ({ ...e, [k]: undefined }))
    try {
      await descartarPendenciaCenso(item.pendencia_id)
      setEstado((e) => ({ ...e, [k]: 'descartado' }))
      onDescartado(item.pendencia_id, rascunhos[k]?.nome?.trim() || item.nome || '')
      avancar()
    } catch (err) {
      setErro((e) => ({ ...e, [k]: (err as Error).message }))
    } finally {
      setOcupado(false)
    }
  }

  async function salvarPaciente(item: PendenteCenso) {
    const k = chavePaciente(item)
    if (item.pendencia_id == null) return
    const id = item.pendencia_id
    setOcupado(true)
    setErro((e) => ({ ...e, [k]: undefined }))
    try {
      const res = await completarPendenciaCenso(id, payloadDe(item, rascunhos[k]))
      if (res.ok) {
        setEstado((e) => ({ ...e, [k]: 'salvo' }))
        onSalvo(id, rascunhos[k].nome.trim() || item.nome || '', res.situacao)
        avancar()
        return
      }
      // Ainda falta algo: o backend diz o quê — realça os campos e fica no passo.
      setErro((e) => ({ ...e, [k]: res.erro ?? 'Ainda faltam dados.' }))
      setFaltantes((f) => ({ ...f, [k]: res.campos_faltantes ?? [] }))
      setMotivos((m) => ({ ...m, [k]: res.motivos ?? [] }))
    } catch (err) {
      setErro((e) => ({ ...e, [k]: (err as Error).message }))
    } finally {
      setOcupado(false)
    }
  }

  // ── Passo de hospital ──────────────────────────────────────────────────────
  function setHosp(arquivo: string, patch: Partial<HospForm>) {
    setHospForm((f) => ({ ...f, [arquivo]: { ...f[arquivo], ...patch } }))
  }

  function pularArquivo(arquivo: string) {
    setHospEstado((e) => ({ ...e, [arquivo]: 'pulado' }))
    avancar()
  }

  // Pendentes do arquivo reprocessado viram passos logo após o último passo de
  // hospital — o usuário resolve todos os hospitais antes de entrar nos pacientes.
  function inserirPacientes(novos: PendenteCenso[]) {
    if (!novos.length) return
    setRascunhos((r) => ({ ...porChave(novos, rascunhoDe), ...r }))
    setFaltantes((f) => ({ ...porChave(novos, (p) => p.campos_faltantes ?? []), ...f }))
    setMotivos((m) => ({ ...porChave(novos, (p) => p.motivos ?? []), ...m }))
    setPassos((ps) => {
      const ultimoHosp = ps.map((p) => p.tipo).lastIndexOf('hospital')
      const extra = novos.map((item): Passo => ({ tipo: 'paciente', item }))
      return [...ps.slice(0, ultimoHosp + 1), ...extra, ...ps.slice(ultimoHosp + 1)]
    })
  }

  async function confirmarHospital(arquivo: UploadCensoResult) {
    const nome = arquivo.arquivo
    const manual = hospManualDe(hospForm[nome])
    if (!manual) return
    setOcupado(true)
    setHospErro((e) => ({ ...e, [nome]: undefined }))
    try {
      const data = await reprocessarCensos(sessao, [nome], { [nome]: manual })
      const res = data.resultados?.find((r) => r.arquivo === nome) ?? data.resultados?.[0]
      if (!res) throw new Error('O servidor não devolveu o resultado do arquivo.')
      if (res.erro) throw new Error(res.erro)
      if (res.precisa_hospital) throw new Error('O hospital informado não foi aceito. Tente outro.')
      setHospResultado((r) => ({ ...r, [nome]: res }))
      setHospEstado((e) => ({ ...e, [nome]: 'processado' }))
      onArquivoProcessado(res)
      inserirPacientes(res.pendentes_detalhe ?? [])
      avancar()
    } catch (err) {
      setHospErro((e) => ({ ...e, [nome]: (err as Error).message }))
    } finally {
      setOcupado(false)
    }
  }

  // Enter aciona a AÇÃO PRIMÁRIA do passo — o mesmo que o botão azul do rodapé.
  //
  // Quem completa um censo passa por dezenas de pacientes digitando um campo
  // cada: tirar a mão do teclado para clicar em "Gravar e continuar" a cada um é
  // o grosso do trabalho. Aqui Enter faz o que o passo pede e já avança.
  //
  // As condições são as MESMAS dos botões (`disabled`), não uma cópia aproximada:
  // se o botão não pode ser clicado, o Enter também não age — senão o atalho
  // gravaria um paciente incompleto que o clique recusaria.
  useEffect(() => {
    const onEnter = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return
      // Fora do assistente, ou com a confirmação de saída aberta (o Enter
      // pertence a ela), não há o que acionar.
      if (ocupado || confirmandoSaida) return
      const alvo = e.target as HTMLElement | null
      // Em <textarea> o Enter é quebra de linha; num <button> ou <a> focado, o
      // navegador já dispara o clique daquele elemento — interceptar aqui
      // acionaria DOIS comandos com uma tecla.
      const tag = alvo?.tagName
      if (tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A' || tag === 'SELECT') return
      // Um combobox aberto usa o Enter para escolher o item da lista.
      if (alvo?.getAttribute('aria-expanded') === 'true') return

      if (!passo) return
      e.preventDefault()

      if (passo.tipo === 'hospital') {
        const nome = passo.arquivo.arquivo
        if ((hospEstado[nome] ?? 'pendente') === 'processado') { avancar(); return }
        if (hospManualDe(hospForm[nome], operadorasValidas) != null) {
          confirmarHospital(passo.arquivo)
        }
        return
      }

      const item = passo.item
      const k = chavePaciente(item)
      if ((estado[k] ?? 'pendente') !== 'pendente') { avancar(); return }
      if (item.pendencia_id != null) salvarPaciente(item)
    }
    window.addEventListener('keydown', onEnter)
    return () => window.removeEventListener('keydown', onEnter)
    // Sem array de dependências de propósito: o handler lê `passo`, `estado`,
    // `hospForm` e os três callbacks, que mudam a cada tecla digitada nos campos.
    // Uma lista aqui ou estaria sempre desatualizada (gravando o paciente com o
    // valor anterior do formulário) ou seria reescrita a cada render assim mesmo.
  })

  // Assistente cobre a tela inteira: a página de Upload atrás fica parada.
  useTravarScroll()

  const pct = n ? Math.round((Math.min(idx, n) / n) * 100) : 100
  const descricaoPasso = passo?.tipo === 'hospital'
    ? 'De qual hospital é este arquivo?'
    : passo?.tipo === 'paciente'
      ? `O que faltou neste paciente${passo.item.arquivo ? ` · ${passo.item.arquivo}` : ''}`
      : ''

  return (
    <div className="drawer-backdrop" onClick={tentarFechar}>
      <style>{alertaStyles}{styles}</style>
      <div className="card wz" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="wz-head">
          <div className="wz-head-txt">
            <div className="wz-titulo">Completar o que faltou no censo</div>
            <div className="wz-sub">
              {resumo ? (
                <span>{n} {plural(n, 'item')} {plural(n, 'revisado')}</span>
              ) : (
                <>
                  <span className="wz-passo-n">{idx + 1} / {n}</span>
                  <span className="truncate">{descricaoPasso}</span>
                </>
              )}
            </div>
          </div>
          <button className="wz-fechar" onClick={tentarFechar} title="Fechar (Esc)" aria-label="Fechar" type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="wz-progress"><div style={{ width: `${pct}%` }} /></div>

        {passo?.tipo === 'hospital' && (
          <PassoHospital
            arquivo={passo.arquivo}
            form={hospForm[passo.arquivo.arquivo]}
            estado={hospEstado[passo.arquivo.arquivo] ?? 'pendente'}
            resultado={hospResultado[passo.arquivo.arquivo]}
            operadoras={operadoras}
            hospitais={hospitaisQ.data ?? []}
            carregando={hospitaisQ.isLoading}
            onChange={(patch) => setHosp(passo.arquivo.arquivo, patch)}
          />
        )}
        {passo?.tipo === 'paciente' && (
          <PassoPaciente
            item={passo.item}
            rascunho={rascunhos[chavePaciente(passo.item)]}
            faltantes={faltantes[chavePaciente(passo.item)] ?? []}
            motivos={motivos[chavePaciente(passo.item)] ?? []}
            estado={estado[chavePaciente(passo.item)] ?? 'pendente'}
            onCampo={(campo, v) => setCampo(chavePaciente(passo.item), campo, v)}
          />
        )}
        {resumo && (
          <div className="card-body wz-resumo">
            <div className="wz-ok">
              {IcoOk}
              <span>Revisão concluída. O que você preencheu já está gravado no sistema.</span>
            </div>
            <div className="wz-placar">
              {temHosp && (
                <div className="wz-placar-item ok">
                  <div className="wz-resumo-n">{processados}</div>
                  <div className="wz-placar-l">{plural(processados, 'Arquivo')} com hospital definido</div>
                </div>
              )}
              <div className="wz-placar-item ok">
                <div className="wz-resumo-n">{salvos + pacientesGravadosPorHospital}</div>
                <div className="wz-placar-l">{plural(salvos + pacientesGravadosPorHospital, 'Paciente')} {plural(salvos + pacientesGravadosPorHospital, 'gravado')} aqui</div>
              </div>
              <div className="wz-placar-item pend">
                <div className="wz-resumo-n">
                  {passos.filter((p) => p.tipo === 'paciente'
                    && estado[chavePaciente(p.item)] === 'descartado').length}
                </div>
                <div className="wz-placar-l">{plural(descartados, 'Descartado')} (não {plural(descartados, 'entrou', 'entraram')})</div>
              </div>
            </div>
            {arquivosSemHospital.some((a) => hospEstado[a.arquivo] !== 'processado') && (
              <Alerta nivel="atencao">
                Arquivo sem hospital definido <strong>não teve nenhum paciente gravado</strong>. Volte um passo
                para informar o hospital, ou envie o arquivo de novo mais tarde.
              </Alerta>
            )}
            {semDecisao > 0 && (
              <Alerta nivel="critico">
                <strong>{semDecisao} {plural(semDecisao, 'paciente')}</strong> ainda sem decisão.
                {plural(semDecisao, 'Ele não será gravado', 'Eles não serão gravados')} e não
                {plural(semDecisao, ' aparecerá', ' aparecerão')} em outra tela. Volte para
                preencher ou descartar.
              </Alerta>
            )}
          </div>
        )}

        <div className="wz-foot">
          {passo?.tipo === 'hospital' && (() => {
            const a = passo.arquivo
            const nome = a.arquivo
            const est = hospEstado[nome] ?? 'pendente'
            const valido = hospManualDe(hospForm[nome], operadorasValidas) != null
            return (
              <>
                {hospErro[nome] && <span className="wz-erro">{IcoAlerta} {hospErro[nome]}</span>}
                {est !== 'processado' && (
                  <button type="button" className="btn btn-outline btn-sm" disabled={ocupado}
                    onClick={() => pularArquivo(nome)} title="Nenhum paciente deste arquivo será gravado">
                    Pular este arquivo
                  </button>
                )}
                <span className="wz-spacer" />
                <button type="button" className="btn btn-outline btn-sm" disabled={idx === 0 || ocupado} onClick={voltar}>
                  Anterior
                </button>
                {est === 'processado' ? (
                  <button type="button" className="btn btn-primary btn-sm" onClick={avancar}>
                    {idx === n - 1 ? 'Concluir' : 'Próximo'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={ocupado || !valido}
                    onClick={() => confirmarHospital(a)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    {ocupado && <Spinner size={12} style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.4)' }} />}
                    {ocupado ? 'Gravando…' : 'Confirmar hospital e gravar'}
                  </button>
                )}
              </>
            )
          })()}

          {passo?.tipo === 'paciente' && (() => {
            const item = passo.item
            const k = chavePaciente(item)
            const est = estado[k] ?? 'pendente'
            return (
              <>
                {item.pendencia_id == null
                  ? <span className="wz-erro">{IcoAlerta} Este paciente não pode ser completado aqui. Resolva pelo Kanban.</span>
                  : erro[k] && <span className="wz-erro">{IcoAlerta} {erro[k]}</span>}
                {est === 'pendente' && (
                  <button type="button" className="btn btn-outline btn-sm"
                    disabled={ocupado || item.pendencia_id == null}
                    onClick={() => descartarPaciente(item)}
                    title="O paciente não será gravado. A decisão fica registrada">
                    Descartar paciente
                  </button>
                )}
                <span className="wz-spacer" />
                <button type="button" className="btn btn-outline btn-sm" disabled={idx === 0 || ocupado} onClick={voltar}>
                  Anterior
                </button>
                {est !== 'pendente' ? (
                  <button type="button" className="btn btn-primary btn-sm" onClick={avancar}>
                    {idx === n - 1 ? 'Concluir' : 'Próximo'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={ocupado || item.pendencia_id == null}
                    onClick={() => salvarPaciente(item)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    {ocupado && <Spinner size={12} style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.4)' }} />}
                    {ocupado ? 'Gravando…' : idx === n - 1 ? 'Gravar e concluir' : 'Gravar e continuar'}
                  </button>
                )}
              </>
            )
          })()}

          {resumo && (
            <>
              <button type="button" className="btn btn-outline btn-sm" onClick={voltar} disabled={n === 0}>Voltar</button>
              <span className="wz-spacer" />
              <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>Concluir</button>
            </>
          )}
        </div>
      </div>

      {confirmandoSaida && (
        <ConfirmarModal
          titulo="Sair sem decidir?"
          confirmar="Sair mesmo assim"
          cancelar="Continuar preenchendo"
          sobreposta
          onCancelar={() => setConfirmandoSaida(false)}
          onConfirmar={() => { setConfirmandoSaida(false); onClose() }}
        >
          <div>
            <strong>{semDecisaoAoFechar} {plural(semDecisaoAoFechar, 'paciente')}</strong>{' '}
            {plural(semDecisaoAoFechar, 'continua', 'continuam')} sem decisão.
          </div>
          <div>
            {plural(semDecisaoAoFechar, 'Ele não será gravado', 'Eles não serão gravados')} e não{' '}
            {plural(semDecisaoAoFechar, 'aparecerá', 'aparecerão')} em outra tela. A revisão
            do censo acontece só aqui.
          </div>
        </ConfirmarModal>
      )}
    </div>
  )
}

// ── Passo de hospital: escolher cadastrado ou cadastrar novo ─────────────────
function PassoHospital({ arquivo, form, estado, resultado, operadoras, hospitais, carregando, onChange }: {
  arquivo: UploadCensoResult
  form: HospForm
  estado: EstadoArquivo
  resultado?: UploadCensoResult
  operadoras: Operadora[]
  hospitais: Hospital[]
  carregando: boolean
  onChange: (patch: Partial<HospForm>) => void
}) {
  const processado = estado === 'processado'
  const daOperadora = useMemo(
    () => hospitais
      .filter((h) => !form.operadora || h.operadora_key === form.operadora)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [hospitais, form.operadora],
  )
  const opConhecida = operadoras.some((o) => o.key === arquivo.operadora)
  // O <select> só pode exibir uma key que exista entre as <option>. Se `form.operadora`
  // vier de fora do cadastro (o PDF trouxe a razão social, e o casamento não achou a
  // operadora), o navegador cairia na PRIMEIRA opção e mostraria uma operadora que o
  // usuário não escolheu — foi assim que hospital acabava gravado na operadora errada.
  // Tratamos como "não escolhida": o campo fica vazio e pede a escolha.
  const opSelecionada = operadoras.some((o) => o.key === form.operadora) ? form.operadora : ''
  const lidos = arquivo.pacientes_extraidos ?? 0

  return (
    <div className={`card-body wz-body${processado ? '' : ' wz-sem-scroll'}`}>
      <div className="wz-alvo">
        <span className="wz-alvo-ico">{IcoArquivo}</span>
        <div className="wz-alvo-txt">
          <div className="wz-alvo-nome mono" title={arquivo.arquivo}>{arquivo.arquivo}</div>
          <div className="wz-alvo-meta">
            {lidos} {plural(lidos, 'paciente')} {plural(lidos, 'lido')} do PDF
            {arquivo.operadora_nome && <> · convênio {arquivo.operadora_nome}</>}
            {tipoCensoTexto(arquivo.tipo) && <> · {tipoCensoTexto(arquivo.tipo)}</>}
          </div>
        </div>
      </div>

      {processado && resultado ? (
        <div className="wz-ok">
          {IcoOk}
          <span>
            Gravado como <strong>{resultado.hospital_nome || resultado.hospital}</strong>:{' '}
            {resultado.total ?? 0} {plural(resultado.total ?? 0, 'paciente')} {plural(resultado.total ?? 0, 'gravado')}
            {/* Quebra por situação: o censo desta safra é misto (internados + altas
                do dia no mesmo PDF), então dizer só "13 gravados" deixa parecer que
                um arquivo de altas cadastrou gente em leito. */}
            {(resultado.altas != null || resultado.internados != null) && (resultado.total ?? 0) > 0 && (
              <> ({resultado.internados ?? 0} em leito · {resultado.altas ?? 0} com alta)</>
            )}
            {(resultado.pendentes || 0) > 0 && (
              <> · {resultado.pendentes} {plural(resultado.pendentes ?? 0, 'aguarda', 'aguardam')} preenchimento nos próximos passos</>
            )}.
          </span>
        </div>
      ) : (
        <Alerta nivel="atencao">
          {arquivo.hospital_sugerido
            ? <>O PDF informa o hospital <strong>“{arquivo.hospital_sugerido}”</strong>, que ainda não está no cadastro.</>
            : <>O PDF não informa de qual hospital é o censo.</>}
          {' '}Escolha um hospital já cadastrado ou cadastre este agora. Só depois disso os{' '}
          {lidos} {plural(lidos, 'paciente')} {plural(lidos, 'é', 'são')} {plural(lidos, 'gravado')}.
        </Alerta>
      )}

      {!processado && (
        <>
          <div className="wz-modo">
            <label className={form.modo === 'existente' ? 'sel' : undefined}>
              <input type="radio" name={`modo-${arquivo.arquivo}`} checked={form.modo === 'existente'}
                onChange={() => onChange({ modo: 'existente' })} />
              <span className="wz-modo-txt">
                <span className="wz-modo-t">Já está cadastrado</span>
                <span className="wz-modo-d">Escolher um hospital da lista</span>
              </span>
            </label>
            <label className={form.modo === 'novo' ? 'sel' : undefined}>
              <input type="radio" name={`modo-${arquivo.arquivo}`} checked={form.modo === 'novo'}
                onChange={() => onChange({ modo: 'novo' })} />
              <span className="wz-modo-txt">
                <span className="wz-modo-t">Cadastrar agora</span>
                <span className="wz-modo-d">Criar o hospital com o nome do censo</span>
              </span>
            </label>
          </div>

          {form.modo === 'existente' ? (
            <div className="wz-busca">
              {/* Busca ocupa a linha inteira: é o campo que o usuário realmente usa.
                  A operadora vira um filtro opcional embaixo, não um passo obrigatório
                  antes de poder digitar. */}
              <div>
                <label className={`wz-lbl${form.hospitalKey ? '' : ' falta'}`}>
                  Hospital{form.hospitalKey ? '' : ' · digite para buscar'}
                </label>
                <HospitalCombobox
                  hospitais={daOperadora}
                  value={form.hospitalKey}
                  disabled={carregando}
                  invalido
                  mostrarOperadora={!form.operadora}
                  placeholder={carregando ? 'Carregando hospitais…' : 'Digite o nome do hospital…'}
                  onChange={(key) => onChange({ hospitalKey: key })}
                />
              </div>
              <div className="wz-filtro-op">
                <label className="wz-lbl" htmlFor={`op-${arquivo.arquivo}`}>Filtrar por operadora</label>
                <select id={`op-${arquivo.arquivo}`} className="bm-input bm-select" value={opSelecionada}
                  onChange={(e) => onChange({ operadora: e.target.value, hospitalKey: '' })}>
                  <option value="">Todas as operadoras</option>
                  {operadoras.map((o) => <option key={o.key} value={o.key}>{o.nome}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="wz-grid">
              <div>
                <label className={`wz-lbl${form.nome.trim() ? '' : ' falta'}`}>Nome do hospital{form.nome.trim() ? '' : ' · preencher'}</label>
                <input type="text" className={`bm-input${form.nome.trim() ? '' : ' falta'}`} value={form.nome}
                  placeholder="Como aparece no censo" onChange={(e) => onChange({ nome: e.target.value })} />
                <div className="wz-hint">Este nome aparecerá em todas as telas do sistema.</div>
              </div>
              <div>
                <label className={`wz-lbl${opSelecionada ? '' : ' falta'}`}>Operadora{opSelecionada ? '' : ' · escolha'}</label>
                <select className={`bm-input bm-select${opSelecionada ? '' : ' falta'}`} value={opSelecionada}
                  onChange={(e) => onChange({ operadora: e.target.value })}>
                  <option value="">Selecione…</option>
                  {operadoras.map((o) => <option key={o.key} value={o.key}>{o.nome}</option>)}
                </select>
                {!opConhecida && arquivo.operadora_nome && !opSelecionada && (
                  <div className="wz-hint">
                    O convênio “{arquivo.operadora_nome}” do PDF não corresponde a nenhuma operadora cadastrada.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Passo de paciente: o que faltou (em destaque) + o que foi capturado ──────
function PassoPaciente({ item, rascunho, faltantes, motivos, estado, onCampo }: {
  item: PendenteCenso
  rascunho: Rascunho
  faltantes: CampoCenso[]
  motivos: string[]
  estado: EstadoItem
  onCampo: (campo: CampoCenso, v: string) => void
}) {
  const faltou = ORDEM.filter((c) => faltantes.includes(c))
  const capturados = ORDEM.filter((c) => !faltantes.includes(c))
  const contexto = CONTEXTO
    .map(([campo, label]) => [label, valorContexto(campo, item[campo])] as const)
    .filter(([, v]) => v)
  const cru = (c: CampoCenso) => (CAMPO_TIPO[c] === 'date' ? item[c] : null)
  const salvo = estado === 'salvo'

  return (
    <div className="card-body wz-body">
      <div className="wz-alvo">
        <span className="wz-alvo-ico">{IcoPessoa}</span>
        <div className="wz-alvo-txt">
          <div className="wz-alvo-nome" title={item.nome || undefined}>{item.nome || 'Nome não lido do PDF'}</div>
          <div className="wz-alvo-meta">
            {item.hospital_nome || 'Hospital não informado'}
            {item.atendimento && <> · atendimento {item.atendimento}</>}
          </div>
        </div>
      </div>

      {salvo && (
        <div className="wz-ok">{IcoOk}<span>Paciente gravado no sistema.</span></div>
      )}
      {estado === 'descartado' && (
        <Alerta nivel="nota">Paciente descartado. Não foi gravado. A decisão ficou registrada.</Alerta>
      )}

      {!salvo && motivos.length > 0 && (
        <div className="wz-motivos">
          {motivos.map((m, i) => (
            <Alerta key={i} nivel="atencao">{motivoCensoTexto(m)}</Alerta>
          ))}
        </div>
      )}

      {faltou.length > 0 && (
        <div className="wz-sec">
          <div className="wz-sec-lbl falta">Preencha o que faltou</div>
          <div className="wz-grid">
            {faltou.map((c) => (
              <Campo key={c} campo={c} value={rascunho[c]} faltando={!salvo} disabled={salvo}
                cru={cru(c)} onChange={(v) => onCampo(c, v)} />
            ))}
          </div>
        </div>
      )}

      <div className="wz-sec">
        <div className="wz-sec-lbl">Lido do PDF: confira e corrija se precisar</div>
        {capturados.length > 0 && (
          <div className="wz-grid">
            {capturados.map((c) => (
              <Campo key={c} campo={c} value={rascunho[c]} faltando={false} disabled={salvo}
                cru={cru(c)} onChange={(v) => onCampo(c, v)} />
            ))}
          </div>
        )}
        {contexto.length > 0 ? (
          <div className="wz-chips">
            {contexto.map(([label, v]) => (
              <span className="wz-chip" key={label}>{label}: <b>{v}</b></span>
            ))}
          </div>
        ) : capturados.length === 0 && (
          <div className="wz-hint">O PDF não trouxe mais nenhum dado deste paciente.</div>
        )}
      </div>
    </div>
  )
}
