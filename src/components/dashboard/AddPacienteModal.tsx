// Modal "Adicionar pacientes": cadastro manual de internações na Visão Geral,
// em formato de planilha (24/11/2026, escolhido pelo usuário). Uma tela, três
// partes, na ordem em que se decide:
//
//   ① Operadora e hospital — dois campos lado a lado: a operadora, depois o
//                 hospital dela (combobox de valor fechado). Com hospital ↔
//                 operadoras N-N, o hospital sozinho não diz a operadora do
//                 paciente, e o censo do quadro é por hospital + operadora.
//   ② Pacientes — uma linha por paciente: Nome, Atendimento, Entrada, Alta,
//                 Leito; especialidade e médico abrem por linha ("mais dados").
//                 Tab anda entre os campos; Enter vai para a próxima linha (e
//                 abre uma nova na última). Linha em branco é ignorada.
//   ③ Censo     — "O hospital já atualizou o censo de hoje": a confirmação, no
//                 fim. Marcada, depois que TODOS forem salvos o censo do par
//                 hospital + operadora vai
//                 para "Censos atualizados" na aba Tarefas (a mesma ação "Marcar
//                 como atualizado" do quadro, com a anotação escrita aqui).
//
// Um botão só: "Salvar N pacientes". Grava um a um, na ordem (o backend
// deduplica por hospital + atendimento e devolve `ja_existia`). Se algum
// falhar, os salvos saem da planilha, os que falharam ficam com o erro na
// linha, e o censo espera: salvar de novo termina e marca.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Modal } from '../ui'
import { HospitalCombobox } from '../HospitalCombobox'
import { criarPacienteManual } from '../../services/dashboard.service'
import { useMarcarAtualizado } from '../../hooks/useKanban'
import { invalidarPorEvento } from '../../lib/invalidation'
import type { Hospital, PacienteNovo } from '../../types/api'

const styles = `
.ap{display:grid;gap:22px}
.ap-sec{display:grid;gap:10px}
.ap-sec-tit{display:flex;align-items:center;gap:8px;font-size:11px;letter-spacing:.1em;font-weight:700;text-transform:uppercase;color:var(--ink-2)}
.ap-num{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:var(--primary-soft);color:var(--primary);font-size:11px;letter-spacing:0}
.ap-sec-dica{font-weight:500;letter-spacing:0;text-transform:none;color:var(--muted);font-size:var(--t-xs)}
.ap-corpo{padding-left:28px}
.ap-local{display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:640px}
.ap-grade{display:grid;grid-template-columns:minmax(170px,1fr) 108px 142px 142px 124px 30px 30px;column-gap:8px;align-items:center}
.ap-cab{font-size:10px;letter-spacing:.1em;font-weight:600;text-transform:uppercase;color:var(--muted);padding:0 2px 4px}
.ap-linha{padding:4px 0}
.ap-linha + .ap-linha{border-top:1px dashed var(--border)}
.ap-linha .bm-input{padding:6px 9px;font-size:var(--t-sm)}
.ap-btn-ico{display:inline-grid;place-items:center;width:30px;height:30px;border:0;border-radius:var(--r-sm);background:transparent;color:var(--muted);cursor:pointer;font-size:14px;line-height:1}
.ap-btn-ico:hover{background:var(--surface-3);color:var(--ink)}
.ap-btn-ico.on{color:var(--primary);background:var(--primary-soft)}
.ap-btn-ico:disabled{opacity:.35;cursor:default;background:transparent}
.ap-extra{margin-top:6px}
.ap-extra-medico{grid-column:2 / 6}
.ap-erro{margin-top:4px;font-size:var(--t-xs);color:var(--danger)}
.ap-falta{border-color:var(--warning)!important;background:var(--warning-bg)!important}
.ap-add{justify-self:start;margin-top:4px;border:0;background:transparent;color:var(--accent);font-weight:600;font-size:var(--t-sm);cursor:pointer;padding:4px 0}
.ap-add:hover{text-decoration:underline}
.ap-censo{display:grid;grid-template-columns:16px 1fr;column-gap:10px;row-gap:2px;align-items:start;padding:10px 12px;border:1px solid var(--border);border-radius:var(--r-md);background:var(--surface-2);cursor:pointer}
.ap-censo.on{border-color:var(--accent);background:var(--accent-soft)}
.ap-censo.off{cursor:default;opacity:.6}
.ap-censo input{width:16px;height:16px;margin:2px 0 0;accent-color:var(--primary);cursor:inherit}
.ap-censo-tit{font-weight:600;font-size:var(--t-sm);line-height:20px;color:var(--ink)}
.ap-censo-dica{grid-column:2;font-size:var(--t-xs);color:var(--muted)}
`

// Domínio fechado do tipo de leito (mesmo vocabulário de Paciente.tsx / LeitoTag).
const LEITO_OPCOES = [
  { value: 'UTI', label: 'UTI' },
  { value: 'APARTAMENTO', label: 'Apartamento' },
  { value: 'ENFERMARIA', label: 'Enfermaria' },
] as const

/** Uma linha da planilha. */
interface Linha {
  id: number
  nome: string
  atendimento: string
  entrada: string
  alta: string
  leito: string
  especialidade: string
  medico: string
  /** Linha com especialidade e médico abertos. */
  mais: boolean
  /** Erro do servidor ao salvar esta linha. */
  erro?: string
}

let proximoId = 1
const linhaVazia = (): Linha => ({
  id: proximoId++, nome: '', atendimento: '', entrada: '', alta: '', leito: '',
  especialidade: '', medico: '', mais: false,
})

// Linha em branco não conta (o leito sozinho não identifica ninguém).
const preenchida = (l: Linha) =>
  [l.nome, l.atendimento, l.entrada, l.alta, l.especialidade, l.medico].some((v) => v.trim() !== '')

// Hoje no fuso local, em ISO (o que o input date usa). toISOString() daria o dia
// em UTC, que à noite no Brasil já é amanhã.
function hojeIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** O que falta ou está errado numa linha preenchida. */
function problemas(l: Linha, hoje: string) {
  const nome = !l.nome.trim()
  const entrada = !l.entrada || l.entrada > hoje
  const alta = Boolean(l.alta) && (l.alta < l.entrada || l.alta > hoje)
  let msg = ''
  if (l.entrada > hoje) msg = 'A data de entrada não pode ser futura.'
  else if (l.alta && l.alta > hoje) msg = 'A data de alta não pode ser futura.'
  else if (l.alta && l.entrada && l.alta < l.entrada) msg = 'A alta não pode ser antes da entrada.'
  return { nome, entrada, alta, msg, algum: nome || entrada || alta }
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

// Anotação do card de censo (obrigatória no quadro): diz que veio do cadastro
// manual e quem entrou, para a timeline do censo contar o que aconteceu.
function anotacaoDoCenso(nomes: string[]): string {
  const texto = `O hospital já atualizou o censo. ${plural(nomes.length, 'paciente adicionado', 'pacientes adicionados')} à mão: ${nomes.join(', ')}.`
  return texto.length <= 1000 ? texto : `${texto.slice(0, 997)}...`
}

export default function AddPacienteModal({
  operadoras, hospitaisPorOperadora, operadoraInicial, hospitalInicial,
  onClose, onDone, onError,
}: {
  /** Operadoras do escopo do usuário. */
  operadoras: Array<{ key: string; nome: string }>
  /** Hospitais indexados por operadora (do panorama, já recortado ao escopo). */
  hospitaisPorOperadora: Record<string, Hospital[]>
  /** Operadora aberta no Dashboard, se houver. */
  operadoraInicial?: string
  /** Hospital do filtro atual, se houver. */
  hospitalInicial?: string
  onClose: () => void
  onDone: (msg: string) => void
  onError: (msg: string) => void
}) {
  const qc = useQueryClient()
  const marcarAtualizado = useMarcarAtualizado()
  const hoje = hojeIso()

  // ① Já vem escolhido o que o Dashboard tiver aberto: a operadora (ou, sem
  // ela, a única operadora do hospital filtrado) e o hospital, se for dela.
  const [operadora, setOperadora] = useState(() => {
    if (operadoraInicial && operadoras.some((o) => o.key === operadoraInicial)) return operadoraInicial
    if (!hospitalInicial) return ''
    const donas = operadoras.filter((o) => hospitaisPorOperadora[o.key]?.some((h) => h.key === hospitalInicial))
    return donas.length === 1 ? donas[0].key : ''
  })
  const [hospital, setHospital] = useState(() =>
    hospitalInicial && hospitaisPorOperadora[operadora]?.some((h) => h.key === hospitalInicial)
      ? hospitalInicial : '')

  // Hospitais da operadora escolhida, por nome para a busca.
  const hospitaisDaOperadora = useMemo(() => {
    const lista = hospitaisPorOperadora[operadora] ?? []
    return [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [hospitaisPorOperadora, operadora])
  const hospitalNome = hospitaisDaOperadora.find((h) => h.key === hospital)?.nome ?? ''
  const operadoraNome = operadoras.find((o) => o.key === operadora)?.nome ?? ''
  const par = Boolean(operadora && hospital)

  const [linhas, setLinhas] = useState<Linha[]>(() => [linhaVazia()])
  const [censoAtualizado, setCensoAtualizado] = useState(false)
  const [tentou, setTentou] = useState(false)
  const [saving, setSaving] = useState(false)

  // Foco no Nome da linha nova (ou da próxima) depois que ela existe no DOM.
  const nomes = useRef(new Map<number, HTMLInputElement>())
  const [focar, setFocar] = useState<number | null>(null)
  useEffect(() => {
    if (focar == null) return
    nomes.current.get(focar)?.focus()
    setFocar(null)
  }, [focar, linhas])

  const validas = linhas.filter(preenchida)
  const total = validas.length

  function mudar(id: number, campo: keyof Linha, valor: string | boolean) {
    setLinhas((ls) => ls.map((l) => (l.id === id ? { ...l, [campo]: valor, erro: undefined } : l)))
  }

  // Trocar de operadora invalida o hospital antes escolhido (era de outra), e o
  // cursor segue para o hospital (o campo abre a lista ao receber o foco).
  const [focarHospital, setFocarHospital] = useState(false)
  useEffect(() => {
    if (!focarHospital) return
    document.getElementById('ap-hospital')?.focus()
    setFocarHospital(false)
  }, [focarHospital, operadora])
  function trocarOperadora(nova: string) {
    setOperadora(nova)
    setHospital('')
    if (nova) setFocarHospital(true)
  }

  // Escolheu o hospital: o cursor segue para o primeiro paciente ainda vazio.
  function escolherHospital(k: string) {
    setHospital(k)
    const vazia = linhas.find((l) => !preenchida(l))
    if (k && vazia) setFocar(vazia.id)
  }

  function adicionarLinha() {
    const nova = linhaVazia()
    setLinhas((ls) => [...ls, nova])
    setFocar(nova.id)
  }

  function tirar(id: number) {
    setLinhas((ls) => (ls.length === 1 ? [linhaVazia()] : ls.filter((l) => l.id !== id)))
  }

  // Enter: vai ao Nome da linha de baixo; na última, abre uma nova.
  function teclaNaLinha(e: KeyboardEvent, i: number) {
    // Só nos campos: nos botões ⋯ e ✕ o Enter é o clique deles.
    if (e.key !== 'Enter' || (e.target as HTMLElement).tagName !== 'INPUT') return
    e.preventDefault()
    const prox = linhas[i + 1]
    if (prox) setFocar(prox.id)
    else if (preenchida(linhas[i])) adicionarLinha()
  }

  async function salvar() {
    if (!operadora) { onError('Escolha a operadora no passo 1.'); return }
    if (!hospital) { onError('Escolha o hospital no passo 1.'); return }
    if (!total) { onError('Preencha ao menos um paciente.'); return }
    setTentou(true)
    const comProblema = validas.filter((l) => problemas(l, hoje).algum)
    if (comProblema.length) {
      onError(comProblema.length === 1
        ? 'Um paciente está incompleto. Confira os campos marcados.'
        : `${comProblema.length} pacientes estão incompletos. Confira os campos marcados.`)
      return
    }

    setSaving(true)
    const salvos: Linha[] = []
    const falhas = new Map<number, string>()
    let jaExistiam = 0
    try {
      for (const l of validas) {
        const payload: PacienteNovo = {
          hospital_key: hospital,
          // Com hospital↔operadoras N-N, o hospital não diz a operadora do
          // paciente: sem ela o paciente cairia na operadora legada do hospital.
          operadora_key: operadora,
          atendimento: l.atendimento.trim() || null,
          nome: l.nome.trim(),
          data_entrada: l.entrada,
          data_alta: l.alta || null,
          tipo_leito: l.leito || null,
          especialidade: l.especialidade.trim() || null,
          medico: l.medico.trim() || null,
        }
        try {
          const res = await criarPacienteManual(payload)
          salvos.push(l)
          if (res.ja_existia) jaExistiam += 1
        } catch (err) {
          falhas.set(l.id, (err as Error).message)
        }
      }
      // Recompõe os agregados operacionais (Visão Geral, panorama, sidebar…).
      if (salvos.length) invalidarPorEvento(qc, 'pacienteAdicionado')

      const novos = salvos.length - jaExistiam
      const resumo = [
        novos ? `✓ ${plural(novos, 'paciente adicionado', 'pacientes adicionados')}` : '',
        jaExistiam ? plural(jaExistiam, 'já estava cadastrado e não foi duplicado', 'já estavam cadastrados e não foram duplicados') : '',
      ].filter(Boolean).join(' · ')

      if (falhas.size) {
        // Ficam só os que falharam, cada um com o seu erro.
        setLinhas((ls) => {
          const resto = ls.filter((l) => falhas.has(l.id)).map((l) => ({ ...l, erro: falhas.get(l.id) }))
          return resto.length ? resto : [linhaVazia()]
        })
        onError([
          salvos.length ? `${plural(salvos.length, 'paciente salvo', 'pacientes salvos')}.` : '',
          `${plural(falhas.size, 'não foi salvo', 'não foram salvos')}: o motivo está na linha.`,
          censoAtualizado ? 'O censo será marcado quando todos forem salvos.' : '',
        ].filter(Boolean).join(' '))
        return
      }

      if (!censoAtualizado) { onDone(resumo); return }
      try {
        await marcarAtualizado.mutateAsync({
          hospitalKey: hospital,
          operadoraKey: operadora,
          anotacao: anotacaoDoCenso(validas.map((l) => l.nome.trim())),
        })
        onDone(`${resumo} · censo marcado como atualizado`)
      } catch (err) {
        const msg = (err as Error).message
        // Já atualizado hoje (por um censo ou à mão): é o que se queria.
        onDone(/já está atualizado/i.test(msg)
          ? `${resumo} · o censo de hoje já estava atualizado`
          : `${resumo}. O censo não foi marcado como atualizado: ${msg}`)
      }
    } finally {
      setSaving(false)
    }
  }

  const rotulo = saving
    ? 'Salvando…'
    : total > 1 ? `Salvar ${total} pacientes` : 'Salvar paciente'

  return (
    <Modal
      title="Adicionar pacientes"
      onClose={onClose}
      largura={900}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={saving || !par || !total}>
            {rotulo}
          </button>
        </>
      }
    >
      <style>{styles}</style>
      <div className="ap">
        {/* ① Operadora e hospital */}
        <section className="ap-sec">
          <div className="ap-sec-tit"><span className="ap-num">1</span>Operadora e hospital</div>
          <div className="ap-corpo ap-local">
            <div>
              <div className="ap-cab">Operadora *</div>
              <select className="bm-input bm-select" value={operadora} disabled={saving}
                aria-label="Operadora" autoFocus={!operadora}
                onChange={(e) => trocarOperadora(e.target.value)}>
                <option value="">Selecione…</option>
                {operadoras.map((o) => <option key={o.key} value={o.key}>{o.nome}</option>)}
              </select>
            </div>
            <div>
              <div className="ap-cab">Hospital *</div>
              <HospitalCombobox
                id="ap-hospital"
                hospitais={hospitaisDaOperadora}
                value={hospital}
                onChange={escolherHospital}
                disabled={saving || !operadora}
                invalido={tentou && !!operadora}
                placeholder={operadora ? 'Digite o nome do hospital…' : 'Escolha a operadora primeiro'}
                autoFocus={!!operadora && !hospital}
              />
            </div>
          </div>
        </section>

        {/* ② Pacientes */}
        <section className="ap-sec">
          <div className="ap-sec-tit">
            <span className="ap-num">2</span>Pacientes
            <span className="ap-sec-dica">· Enter vai para a próxima linha</span>
          </div>
          <div className="ap-corpo" style={{ display: 'grid' }}>
            <div className="ap-grade">
              <div className="ap-cab">Nome *</div>
              <div className="ap-cab">Atendimento</div>
              <div className="ap-cab">Entrada *</div>
              <div className="ap-cab">Alta</div>
              <div className="ap-cab">Leito</div>
              <div />
              <div />
            </div>
            {linhas.map((l, i) => {
              const p = tentou && preenchida(l) ? problemas(l, hoje) : null
              const temExtra = Boolean(l.especialidade || l.medico)
              return (
                <div key={l.id} className="ap-linha" onKeyDown={(e) => teclaNaLinha(e, i)}>
                  <div className="ap-grade">
                    <input
                      ref={(el) => { if (el) nomes.current.set(l.id, el); else nomes.current.delete(l.id) }}
                      type="text" className={`bm-input${p?.nome ? ' ap-falta' : ''}`}
                      placeholder="Nome completo" aria-label="Nome do paciente"
                      value={l.nome} disabled={saving}
                      autoFocus={i === 0 && !!par}
                      onChange={(e) => mudar(l.id, 'nome', e.target.value)} />
                    <input type="text" className="bm-input" placeholder="Opcional" aria-label="Atendimento"
                      value={l.atendimento} disabled={saving}
                      onChange={(e) => mudar(l.id, 'atendimento', e.target.value)} />
                    <input type="date" className={`bm-input${p?.entrada ? ' ap-falta' : ''}`} aria-label="Data de entrada"
                      max={l.alta || hoje} value={l.entrada} disabled={saving}
                      onChange={(e) => mudar(l.id, 'entrada', e.target.value)} />
                    <input type="date" className={`bm-input${p?.alta ? ' ap-falta' : ''}`} aria-label="Data de alta, se já saiu"
                      title="Preencha só se o paciente já teve alta"
                      min={l.entrada || undefined} max={hoje} value={l.alta} disabled={saving}
                      onChange={(e) => mudar(l.id, 'alta', e.target.value)} />
                    <select className="bm-input bm-select" aria-label="Leito"
                      value={l.leito} disabled={saving}
                      onChange={(e) => mudar(l.id, 'leito', e.target.value)}>
                      <option value="">—</option>
                      {LEITO_OPCOES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <button type="button" className={`ap-btn-ico${l.mais || temExtra ? ' on' : ''}`}
                      title="Especialidade e médico" aria-label="Especialidade e médico"
                      aria-expanded={l.mais} disabled={saving}
                      onClick={() => mudar(l.id, 'mais', !l.mais)}>⋯</button>
                    <button type="button" className="ap-btn-ico" title="Tirar esta linha" aria-label="Tirar esta linha"
                      disabled={saving || (linhas.length === 1 && !preenchida(l))}
                      onClick={() => tirar(l.id)}>✕</button>
                  </div>
                  {l.mais && (
                    <div className="ap-grade ap-extra">
                      <input type="text" className="bm-input" placeholder="Especialidade (opcional)" aria-label="Especialidade"
                        value={l.especialidade} disabled={saving}
                        onChange={(e) => mudar(l.id, 'especialidade', e.target.value)} />
                      <input type="text" className="bm-input ap-extra-medico" placeholder="Médico (opcional)" aria-label="Médico"
                        value={l.medico} disabled={saving}
                        onChange={(e) => mudar(l.id, 'medico', e.target.value)} />
                    </div>
                  )}
                  {(l.erro || p?.msg) && <div className="ap-erro">{l.erro || p?.msg}</div>}
                </div>
              )
            })}
            <button type="button" className="ap-add" onClick={adicionarLinha} disabled={saving}>
              + Adicionar outro paciente
            </button>
          </div>
        </section>

        {/* ③ Censo */}
        <section className="ap-sec">
          <div className="ap-sec-tit"><span className="ap-num">3</span>Censo</div>
          <div className="ap-corpo">
            <label className={`ap-censo${censoAtualizado && par ? ' on' : ''}${par ? '' : ' off'}`}>
              <input type="checkbox" checked={censoAtualizado && !!par} disabled={saving || !par}
                onChange={(e) => setCensoAtualizado(e.target.checked)} />
              <span className="ap-censo-tit">
                {hospitalNome ? `${hospitalNome} já atualizou o censo de hoje` : 'O hospital já atualizou o censo de hoje'}
              </span>
              <span className="ap-censo-dica">
                {par
                  ? `Ao salvar, o censo de ${operadoraNome} neste hospital vai para “Censos atualizados” na aba Tarefas.`
                  : 'Escolha a operadora e o hospital no passo 1.'}
              </span>
            </label>
          </div>
        </section>
      </div>
    </Modal>
  )
}
