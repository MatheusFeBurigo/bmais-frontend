// Área do OPERACIONAL: as operadoras que ele atende (migration 0053). Marcar uma
// operadora dá a ele TODOS os hospitais dela, sem escolher hospital por hospital;
// o técnico continua escolhendo cidades e hospitais (MultiSelectHospitais).
// A saída são operadora_keys, gravadas em profile_operadoras. Vazio = vê todas.
//
// A lista sai do cadastro de hospitais (o mesmo `useTodosHospitais` do seletor
// de hospitais), porque é dele que vem o número de hospitais de cada operadora
// (lib/operadorasDosHospitais).
import { useMemo, useState } from 'react'
import type { Hospital } from '../types/api'
import { normalizarNome, operadorasDosHospitais } from '../lib/operadorasDosHospitais'
import { OpAvatar } from './ui'

interface Props {
  hospitais: Hospital[]
  selecionados: string[]
  onChange: (keys: string[]) => void
  loading?: boolean
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

export default function SeletorOperadoras({ hospitais, selecionados, onChange, loading }: Props) {
  const [busca, setBusca] = useState('')
  const sel = useMemo(() => new Set(selecionados), [selecionados])

  const operadoras = useMemo(() => {
    const lista = operadorasDosHospitais(hospitais)
    // Operadora gravada que não tem hospital no cadastro (ou saiu dele) continua
    // na lista: sem a linha, ela não poderia ser desmarcada e sumiria calada ao salvar.
    const conhecidas = new Set(lista.map((o) => o.key))
    const orfas = selecionados.filter((k) => !conhecidas.has(k))
      .map((k) => ({ key: k, nome: k, hospitais: new Set<string>() }))
    return [...lista, ...orfas]
  }, [hospitais, selecionados])

  const visiveis = useMemo(() => {
    const q = normalizarNome(busca)
    if (!q) return operadoras
    return operadoras.filter((o) => normalizarNome(o.nome).includes(q) || o.key.includes(q))
  }, [operadoras, busca])

  function alternar(key: string) {
    const next = new Set(sel)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange(Array.from(next))
  }

  const todasMarcadas = operadoras.length > 0 && operadoras.every((o) => sel.has(o.key))
  const marcadas = operadoras.filter((o) => sel.has(o.key))
  // Hospitais distintos somando as operadoras marcadas: um hospital que atende
  // duas delas é um hospital só para quem vai cobrar o censo.
  const nHospitais = new Set(marcadas.flatMap((o) => [...o.hospitais])).size

  return (
    <div style={{ border: '1px solid var(--border-strong)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 8, padding: 8, borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
        <input
          className="bm-input"
          placeholder="Buscar operadora…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ flex: 1, minWidth: 0 }}
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => onChange(todasMarcadas ? [] : operadoras.map((o) => o.key))}
          disabled={loading || operadoras.length === 0}
          style={{ flexShrink: 0 }}
        >
          {todasMarcadas ? 'Limpar' : 'Todas'}
        </button>
      </div>

      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {loading && <div style={{ color: 'var(--muted-2)', padding: 14, fontSize: 'var(--t-base)' }}>Carregando operadoras…</div>}
        {!loading && visiveis.length === 0 && (
          <div style={{ color: 'var(--muted-2)', padding: 12, fontSize: 'var(--t-sm)' }}>
            {operadoras.length === 0 ? 'Nenhuma operadora com hospital cadastrado.' : 'Nenhuma operadora encontrada.'}
          </div>
        )}
        {!loading && visiveis.map((o) => {
          const marcada = sel.has(o.key)
          return (
            <label
              key={o.key}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                background: marcada ? 'var(--accent-soft)' : 'transparent',
              }}
            >
              <input
                type="checkbox"
                checked={marcada}
                onChange={() => alternar(o.key)}
                style={{ accentColor: 'var(--primary)' }}
              />
              <OpAvatar opKey={o.key} size={28} />
              <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 'var(--t-md)', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {o.nome}
              </span>
              <span style={{ flexShrink: 0, fontSize: 'var(--t-sm)', color: marcada ? 'var(--primary-3)' : 'var(--muted)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {plural(o.hospitais.size, 'hospital', 'hospitais')}
              </span>
            </label>
          )
        })}
      </div>

      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
        {marcadas.length === 0
          ? 'Nenhuma operadora selecionada: o usuário verá TODAS as operadoras.'
          : `${plural(marcadas.length, 'operadora', 'operadoras')}, ${plural(nHospitais, 'hospital', 'hospitais')}: o usuário verá todos os hospitais delas.`}
      </div>
    </div>
  )
}
