// Seleção de escopo de dados de um usuário — OPERADORA → HOSPITAIS.
// Primeiro o admin escolhe UMA operadora; a lista completa de hospitais dela
// aparece no lugar e ele marca alguns, todos ou apenas um. A saída continua
// sendo hospital_keys (gravadas em profile_hospitais). Vazio = sem restrição.
//
// Uma operadora de cada vez, e não um acordeão com vários grupos abertos: no
// cadastro real o MESMO hospital é uma linha por operadora (AACD existe como
// aacd_br, aacd_po, aacd_ms), então empilhar grupos repetia os nomes na tela e
// parecia que a lista inteira da plataforma tinha aberto.
//
// ESCOPO É POR HOSPITAL: a saída é um Set de hospital.key. O código ainda trata
// o vínculo N-N (`operadoras`) porque o backend o suporta e um hospital pode vir
// a atender mais de uma; nesse caso ele aparece na lista de cada operadora e
// marcá-lo por uma vale para todas.
import { useMemo, useState, useRef, useEffect } from 'react'
import type { Hospital } from '../types/api'

interface Props {
  hospitais: Hospital[]
  selecionados: string[]
  onChange: (keys: string[]) => void
  loading?: boolean
}

// Nome amigável de uma operadora; se faltar, capitaliza a key (allianz → Allianz)
// em vez de exibir a key crua em minúsculo.
function nomeDaOperadora(h: Hospital, key: string): string {
  const achado = h.operadoras_nomes?.find((o) => o.key === key)
  if (achado?.nome) return achado.nome
  if (key === h.operadora_key && h.operadora_nome) return h.operadora_nome
  return key === '—' ? 'Sem operadora' : key.charAt(0).toUpperCase() + key.slice(1)
}

// Keys das operadoras que o hospital atende (N-N). Cai na coluna legada e, em
// último caso, no grupo "Sem operadora", para nenhum hospital sumir da lista.
function operadorasDoHospital(h: Hospital): string[] {
  if (h.operadoras?.length) return h.operadoras
  return [h.operadora_key || '—']
}

// Checkbox que suporta estado "indeterminado" (alguns filhos marcados).
function TriCheck({ checked, indeterminate, onChange }: {
  checked: boolean; indeterminate?: boolean; onChange: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate && !checked
  }, [indeterminate, checked])
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      style={{ accentColor: 'var(--primary)' }}
    />
  )
}

export default function MultiSelectHospitais({ hospitais, selecionados, onChange, loading }: Props) {
  const [busca, setBusca] = useState('')
  // Operadora aberta (null = tela de operadoras). Uma de cada vez.
  const [operadoraAtiva, setOperadoraAtiva] = useState<string | null>(null)
  const sel = useMemo(() => new Set(selecionados), [selecionados])

  // Operadoras (a partir dos vínculos dos hospitais), cada uma com sua lista
  // COMPLETA de hospitais. Independe da busca — a busca filtra dentro do nível.
  const operadoras = useMemo(() => {
    const map = new Map<string, { key: string; nome: string; hosp: Hospital[] }>()
    for (const h of hospitais) {
      for (const opKey of operadorasDoHospital(h)) {
        const g = map.get(opKey) || { key: opKey, nome: nomeDaOperadora(h, opKey), hosp: [] }
        g.hosp.push(h)
        map.set(opKey, g)
      }
    }
    for (const g of map.values()) g.hosp.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome))
  }, [hospitais])

  const grupoAtivo = useMemo(
    () => operadoras.find((g) => g.key === operadoraAtiva) ?? null,
    [operadoras, operadoraAtiva],
  )

  // Dentro da operadora aberta, a busca filtra os hospitais por nome/key.
  const hospitaisVisiveis = useMemo(() => {
    if (!grupoAtivo) return []
    const q = busca.trim().toLowerCase()
    if (!q) return grupoAtivo.hosp
    return grupoAtivo.hosp.filter(
      (h) => (h.nome || '').toLowerCase().includes(q) || (h.key || '').toLowerCase().includes(q),
    )
  }, [grupoAtivo, busca])

  // Na tela de operadoras, a busca filtra as próprias operadoras.
  const operadorasVisiveis = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return operadoras
    return operadoras.filter(
      (g) => g.nome.toLowerCase().includes(q) || g.key.toLowerCase().includes(q),
    )
  }, [operadoras, busca])

  function toggleHosp(key: string) {
    const next = new Set(sel)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange(Array.from(next))
  }

  // Marca/desmarca TODOS os hospitais de uma operadora ("selecionar o operador").
  // Desmarcar remove mesmo os hospitais compartilhados com outras operadoras: o
  // escopo é por hospital, então "não quero os da Bradesco" tem que tirar o
  // hospital do escopo — deixá-lo marcado porque também é da SulAmérica faria o
  // botão mentir. O badge na linha avisa quais são compartilhados.
  function toggleOperadora(keys: string[], todos: boolean) {
    const next = new Set(sel)
    for (const k of keys) {
      if (todos) next.delete(k)
      else next.add(k)
    }
    onChange(Array.from(next))
  }

  function abrirOperadora(key: string) {
    setOperadoraAtiva(key)
    setBusca('')  // a busca passa a valer para os hospitais desta operadora
  }

  function voltarParaOperadoras() {
    setOperadoraAtiva(null)
    setBusca('')
  }

  const todasKeys = hospitais.map((h) => h.key)
  const todosMarcados = todasKeys.length > 0 && todasKeys.every((k) => sel.has(k))
  const nOps = new Set(
    hospitais.filter((h) => sel.has(h.key)).flatMap((h) => operadorasDoHospital(h)),
  ).size
  // Contagens da operadora aberta (cabeçalho + botão "marcar todos").
  const keysAtivas = grupoAtivo ? grupoAtivo.hosp.map((h) => h.key) : []
  const marcadosAtivos = keysAtivas.filter((k) => sel.has(k)).length
  const todosAtivos = keysAtivas.length > 0 && marcadosAtivos === keysAtivas.length

  return (
    <div style={{ border: '1px solid var(--border-strong)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 8, padding: 8, borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
        {grupoAtivo && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={voltarParaOperadoras}
            title="Voltar para a lista de operadoras"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Operadoras
          </button>
        )}
        <input
          className="bm-input"
          placeholder={grupoAtivo ? `Buscar hospital em ${grupoAtivo.nome}…` : 'Buscar operadora…'}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ flex: 1, minWidth: 0 }}
        />
        {grupoAtivo ? (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => toggleOperadora(keysAtivas, todosAtivos)}
            disabled={loading || keysAtivas.length === 0}
            style={{ flexShrink: 0 }}
          >
            {todosAtivos ? 'Desmarcar todos' : 'Marcar todos'}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onChange(todosMarcados ? [] : todasKeys)}
            disabled={loading || todasKeys.length === 0}
            style={{ flexShrink: 0 }}
          >
            {todosMarcados ? 'Limpar' : 'Todos'}
          </button>
        )}
      </div>

      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {loading && <div style={{ color: 'var(--muted-2)', padding: 14, fontSize: 'var(--t-base)' }}>Carregando operadoras…</div>}

        {/* Nível 1 — escolher a operadora */}
        {!loading && !grupoAtivo && operadorasVisiveis.length === 0 && (
          <div style={{ color: 'var(--muted-2)', padding: 12, fontSize: 'var(--t-sm)' }}>Nenhuma operadora encontrada.</div>
        )}
        {!loading && !grupoAtivo && operadorasVisiveis.map((g) => {
          const keys = g.hosp.map((h) => h.key)
          const marcados = keys.filter((k) => sel.has(k)).length
          const todos = marcados === keys.length && keys.length > 0
          const alguns = marcados > 0 && !todos
          return (
            <div
              key={g.key}
              onClick={() => abrirOperadora(g.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
            >
              <TriCheck checked={todos} indeterminate={alguns} onChange={() => toggleOperadora(keys, todos)} />
              <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 'var(--t-md)', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {g.nome}
              </span>
              <span style={{ fontSize: 'var(--t-sm)', color: marcados ? 'var(--primary-3)' : 'var(--muted)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {marcados}/{keys.length}
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          )
        })}

        {/* Nível 2 — lista completa de hospitais da operadora escolhida */}
        {!loading && grupoAtivo && (
          <div>
            <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 'var(--t-md)', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {grupoAtivo.nome}
              </span>
              <span style={{ fontSize: 'var(--t-sm)', color: marcadosAtivos ? 'var(--primary-3)' : 'var(--muted)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {marcadosAtivos}/{keysAtivas.length} hospitais
              </span>
            </div>
            {/* Lista DENSA em colunas: uma operadora tem ~100 hospitais, e uma
                linha por item obrigaria a rolar às cegas. Em duas/três colunas a
                lista inteira cabe em poucas telas e dá para varrer com os olhos. */}
            <div style={{
              padding: '6px 12px 12px', display: 'grid', gap: '1px 14px',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            }}>
              {hospitaisVisiveis.length === 0 && (
                <div style={{ color: 'var(--muted-2)', padding: '10px 2px', fontSize: 'var(--t-sm)' }}>
                  {grupoAtivo.hosp.length === 0 ? 'Esta operadora não tem hospitais cadastrados.' : 'Nenhum hospital encontrado.'}
                </div>
              )}
              {hospitaisVisiveis.map((h) => (
                <label
                  key={h.key}
                  title={h.nome}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', cursor: 'pointer',
                    borderRadius: 6, fontSize: 'var(--t-sm)',
                    background: sel.has(h.key) ? 'var(--accent-soft)' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={sel.has(h.key)}
                    onChange={() => toggleHosp(h.key)}
                    style={{ accentColor: 'var(--primary)', width: 14, height: 14, flexShrink: 0 }}
                  />
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.nome}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
        {sel.size === 0
          ? 'Nenhum hospital selecionado: o usuário verá TODOS os hospitais.'
          : `${sel.size} hospital(is) de ${nOps} operadora(s): o usuário verá apenas estes.`}
      </div>
    </div>
  )
}
