// Seleção de escopo de dados de um usuário — ACORDEÃO por operadora.
// Primeiro só as operadoras (fechadas); clicar numa expande seus hospitais, e o
// admin marca alguns, todos ou apenas um. A saída continua sendo hospital_keys
// (gravadas em profile_hospitais). Vazio = sem restrição (vê todos).
import { useMemo, useState, useRef, useEffect } from 'react'
import type { Hospital } from '../types/api'

interface Props {
  hospitais: Hospital[]
  selecionados: string[]
  onChange: (keys: string[]) => void
  loading?: boolean
}

// Nome amigável da operadora; se faltar, capitaliza a key (allianz → Allianz)
// em vez de exibir a key crua em minúsculo.
function nomeOperadora(h: Hospital): string {
  if (h.operadora_nome) return h.operadora_nome
  const k = h.operadora_key || '—'
  return k === '—' ? 'Sem operadora' : k.charAt(0).toUpperCase() + k.slice(1)
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
  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const sel = useMemo(() => new Set(selecionados), [selecionados])

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return hospitais
    return hospitais.filter((h) => (h.nome || '').toLowerCase().includes(q) || (h.key || '').toLowerCase().includes(q))
  }, [hospitais, busca])

  // Agrupa por operadora (key + nome amigável), ordenado por nome.
  const grupos = useMemo(() => {
    const map = new Map<string, { key: string; nome: string; hosp: Hospital[] }>()
    for (const h of filtrados) {
      const opKey = h.operadora_key || '—'
      const g = map.get(opKey) || { key: opKey, nome: nomeOperadora(h), hosp: [] }
      g.hosp.push(h)
      map.set(opKey, g)
    }
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome))
  }, [filtrados])

  const buscando = busca.trim().length > 0

  function toggleHosp(key: string) {
    const next = new Set(sel)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange(Array.from(next))
  }

  // Marca/desmarca TODOS os hospitais de uma operadora ("selecionar o operador").
  function toggleOperadora(keys: string[], todos: boolean) {
    const next = new Set(sel)
    for (const k of keys) {
      if (todos) next.delete(k)
      else next.add(k)
    }
    onChange(Array.from(next))
  }

  function toggleAberto(opKey: string) {
    setAbertos((cur) => {
      const next = new Set(cur)
      if (next.has(opKey)) next.delete(opKey)
      else next.add(opKey)
      return next
    })
  }

  const todasKeys = hospitais.map((h) => h.key)
  const todosMarcados = todasKeys.length > 0 && todasKeys.every((k) => sel.has(k))
  const nOps = new Set(hospitais.filter((h) => sel.has(h.key)).map((h) => h.operadora_key || '—')).size

  return (
    <div style={{ border: '1px solid var(--border-strong)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 8, padding: 8, borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
        <input
          className="bm-input"
          placeholder="Buscar operadora ou hospital…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => onChange(todosMarcados ? [] : todasKeys)}
          disabled={loading || todasKeys.length === 0}
        >
          {todosMarcados ? 'Limpar' : 'Todos'}
        </button>
      </div>

      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {loading && <div style={{ color: 'var(--muted-2)', padding: 14, fontSize: 'var(--t-base)' }}>Carregando operadoras…</div>}
        {!loading && grupos.length === 0 && (
          <div style={{ color: 'var(--muted-2)', padding: 12, fontSize: 'var(--t-sm)' }}>Nenhum resultado.</div>
        )}
        {!loading && grupos.map((g) => {
          const keys = g.hosp.map((h) => h.key)
          const marcados = keys.filter((k) => sel.has(k)).length
          const todos = marcados === keys.length && keys.length > 0
          const alguns = marcados > 0 && !todos
          const aberto = buscando || abertos.has(g.key)  // busca abre todos os grupos com resultado
          return (
            <div key={g.key} style={{ borderBottom: '1px solid var(--border)' }}>
              {/* Cabeçalho da operadora: checkbox (todos), nome, contagem, chevron */}
              <div
                onClick={() => toggleAberto(g.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', cursor: 'pointer', background: aberto ? 'var(--surface-2)' : 'transparent' }}
              >
                <TriCheck checked={todos} indeterminate={alguns} onChange={() => toggleOperadora(keys, todos)} />
                <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 'var(--t-md)', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g.nome}
                </span>
                <span style={{ fontSize: 'var(--t-sm)', color: marcados ? 'var(--primary-3)' : 'var(--muted)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {marcados}/{keys.length}
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ color: 'var(--muted)', transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              {/* Hospitais da operadora (expandido) */}
              {aberto && (
                <div style={{ padding: '2px 14px 12px 42px' }}>
                  {g.hosp.map((h) => (
                    <label
                      key={h.key}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', cursor: 'pointer',
                        borderRadius: 7, fontSize: 'var(--t-md)',
                        background: sel.has(h.key) ? 'var(--accent-soft)' : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={sel.has(h.key)}
                        onChange={() => toggleHosp(h.key)}
                        style={{ accentColor: 'var(--primary)', width: 15, height: 15 }}
                      />
                      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.nome}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
        {sel.size === 0
          ? 'Nenhum hospital selecionado — o usuário verá TODOS os hospitais.'
          : `${sel.size} hospital(is) de ${nOps} operadora(s) — o usuário verá apenas estes.`}
      </div>
    </div>
  )
}
