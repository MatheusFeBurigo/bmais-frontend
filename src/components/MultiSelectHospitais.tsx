// Seleção de escopo de dados de um usuário — REGIÃO → HOSPITAIS.
// Primeiro o admin escolhe UMA região; os hospitais dela aparecem no lugar e
// ele marca alguns, todos ou apenas um. A saída continua sendo hospital_keys
// (gravadas em profile_hospitais). Vazio = sem restrição.
//
// POR QUE REGIÃO E NÃO OPERADORA: um hospital atende várias operadoras, e o
// cadastro materializa isso como uma LINHA POR OPERADORA (AACD existe como
// aacd_br, aacd_po, aacd_ms). Agrupar por operadora obrigava o admin a saber de
// qual operadora era o hospital que ele queria — e a marcá-lo várias vezes para
// cobrir o hospital inteiro, porque cada linha é uma key diferente. Região é o
// recorte de quem de fato usa a tela: a pessoa cuida dos hospitais de uma área.
//
// DEDUPLICAÇÃO POR NOME: dentro da região, as linhas do mesmo hospital viram UM
// item, e marcá-lo marca TODAS as keys dele. Sem isso o admin veria "AACD" três
// vezes, sem nada na tela que distinguisse uma da outra, e marcar a errada
// daria a ele um escopo que só enxerga parte dos pacientes do hospital.
//
// A contagem no rodapé é de hospitais distintos, não de keys, pelo mesmo
// motivo: "3 hospitais" é o que o admin escolheu; 7 seria o número interno.
import { useMemo, useState, useRef, useEffect } from 'react'
import type { Hospital } from '../types/api'
import { grupoDaRegiao, SEM_REGIAO } from '../lib/regioes'

interface Props {
  hospitais: Hospital[]
  selecionados: string[]
  onChange: (keys: string[]) => void
  loading?: boolean
}

/** Um hospital como a tela o trata: um nome, e TODAS as keys que o representam
 *  (uma por operadora no cadastro). */
interface HospitalAgrupado {
  /** Nome normalizado — identidade do agrupamento. */
  id: string
  nome: string
  keys: string[]
  /** Nomes das operadoras que ele atende, para a linha dizer de onde ele vem. */
  operadoras: string[]
}

interface Regiao {
  nome: string
  /** Macro-região (Sudeste, Grande São Paulo…), só para ordenar e rotular. */
  grupo: string
  hosp: HospitalAgrupado[]
}

function normalizar(s: string): string {
  return (s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/** Nomes das operadoras do hospital, para a legenda da linha. */
function operadorasDe(h: Hospital): string[] {
  if (h.operadoras_nomes?.length) return h.operadoras_nomes.map((o) => o.nome)
  if (h.operadora_nome) return [h.operadora_nome]
  return []
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
  // Região aberta (null = tela de regiões). Uma de cada vez.
  const [regiaoAtiva, setRegiaoAtiva] = useState<string | null>(null)
  const sel = useMemo(() => new Set(selecionados), [selecionados])

  // Regiões, cada uma com seus hospitais já deduplicados por nome.
  const regioes = useMemo(() => {
    const porRegiao = new Map<string, Map<string, HospitalAgrupado>>()
    for (const h of hospitais) {
      const reg = h.regiao || SEM_REGIAO
      const id = normalizar(h.nome)
      if (!porRegiao.has(reg)) porRegiao.set(reg, new Map())
      const mapa = porRegiao.get(reg)!
      const existente = mapa.get(id)
      if (existente) {
        existente.keys.push(h.key)
        for (const op of operadorasDe(h)) {
          if (!existente.operadoras.includes(op)) existente.operadoras.push(op)
        }
      } else {
        mapa.set(id, { id, nome: h.nome, keys: [h.key], operadoras: operadorasDe(h) })
      }
    }
    const lista: Regiao[] = []
    for (const [nome, mapa] of porRegiao) {
      const hosp = Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome))
      for (const x of hosp) x.operadoras.sort((a, b) => a.localeCompare(b))
      lista.push({ nome, grupo: grupoDaRegiao(nome === SEM_REGIAO ? null : nome), hosp })
    }
    // Agrupadas pela macro-região, e "Sem região" sempre por último: é uma
    // pendência de cadastro, não um lugar.
    return lista.sort((a, b) => {
      if ((a.nome === SEM_REGIAO) !== (b.nome === SEM_REGIAO)) return a.nome === SEM_REGIAO ? 1 : -1
      return a.grupo.localeCompare(b.grupo) || a.nome.localeCompare(b.nome)
    })
  }, [hospitais])

  const regiaoAberta = useMemo(
    () => regioes.find((r) => r.nome === regiaoAtiva) ?? null,
    [regioes, regiaoAtiva],
  )

  // Dentro da região aberta, a busca filtra os hospitais por nome.
  const hospitaisVisiveis = useMemo(() => {
    if (!regiaoAberta) return []
    const q = normalizar(busca)
    if (!q) return regiaoAberta.hosp
    return regiaoAberta.hosp.filter((h) => h.id.includes(q))
  }, [regiaoAberta, busca])

  // Na tela de regiões a busca alcança os HOSPITAIS, não só o nome da região:
  // quem procura "Einstein" não sabe (nem deveria precisar saber) que ele está
  // em "SP - Zona Sul". A região aparece com os hospitais que casaram.
  const regioesVisiveis = useMemo(() => {
    const q = normalizar(busca)
    if (!q) return regioes.map((r) => ({ regiao: r, achados: [] as HospitalAgrupado[] }))
    const out: Array<{ regiao: Regiao; achados: HospitalAgrupado[] }> = []
    for (const r of regioes) {
      if (normalizar(r.nome).includes(q)) { out.push({ regiao: r, achados: [] }); continue }
      const achados = r.hosp.filter((h) => h.id.includes(q))
      if (achados.length) out.push({ regiao: r, achados })
    }
    return out
  }, [regioes, busca])

  /** Marca/desmarca um hospital — todas as keys dele de uma vez. */
  function toggleHosp(h: HospitalAgrupado) {
    const next = new Set(sel)
    const marcado = h.keys.every((k) => next.has(k))
    for (const k of h.keys) {
      if (marcado) next.delete(k)
      else next.add(k)
    }
    onChange(Array.from(next))
  }

  function toggleVarios(hosp: HospitalAgrupado[], desmarcar: boolean) {
    const next = new Set(sel)
    for (const h of hosp) {
      for (const k of h.keys) {
        if (desmarcar) next.delete(k)
        else next.add(k)
      }
    }
    onChange(Array.from(next))
  }

  function abrirRegiao(nome: string) {
    setRegiaoAtiva(nome)
    setBusca('')  // a busca passa a valer para os hospitais desta região
  }

  function voltarParaRegioes() {
    setRegiaoAtiva(null)
    setBusca('')
  }

  /** Um hospital conta como marcado quando TODAS as keys dele estão no escopo. */
  const marcado = (h: HospitalAgrupado) => h.keys.every((k) => sel.has(k))

  const todosHosp = useMemo(() => regioes.flatMap((r) => r.hosp), [regioes])
  const todosMarcados = todosHosp.length > 0 && todosHosp.every(marcado)
  const nSelecionados = todosHosp.filter(marcado).length
  const nRegioes = new Set(
    regioes.filter((r) => r.hosp.some(marcado)).map((r) => r.nome),
  ).size

  // Contagens da região aberta (cabeçalho + botão "marcar todos").
  const marcadosAtivos = regiaoAberta ? regiaoAberta.hosp.filter(marcado).length : 0
  const todosAtivos = !!regiaoAberta && regiaoAberta.hosp.length > 0
    && marcadosAtivos === regiaoAberta.hosp.length

  return (
    <div style={{ border: '1px solid var(--border-strong)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 8, padding: 8, borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
        {regiaoAberta && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={voltarParaRegioes}
            title="Voltar para a lista de regiões"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Regiões
          </button>
        )}
        <input
          className="bm-input"
          placeholder={regiaoAberta ? `Buscar hospital em ${regiaoAberta.nome}…` : 'Buscar região ou hospital…'}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ flex: 1, minWidth: 0 }}
        />
        {regiaoAberta ? (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => toggleVarios(regiaoAberta.hosp, todosAtivos)}
            disabled={loading || regiaoAberta.hosp.length === 0}
            style={{ flexShrink: 0 }}
          >
            {todosAtivos ? 'Desmarcar todos' : 'Marcar todos'}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => (todosMarcados ? onChange([]) : toggleVarios(todosHosp, false))}
            disabled={loading || todosHosp.length === 0}
            style={{ flexShrink: 0 }}
          >
            {todosMarcados ? 'Limpar' : 'Todos'}
          </button>
        )}
      </div>

      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {loading && <div style={{ color: 'var(--muted-2)', padding: 14, fontSize: 'var(--t-base)' }}>Carregando regiões…</div>}

        {/* Nível 1 — escolher a região */}
        {!loading && !regiaoAberta && regioesVisiveis.length === 0 && (
          <div style={{ color: 'var(--muted-2)', padding: 12, fontSize: 'var(--t-sm)' }}>Nenhuma região ou hospital encontrado.</div>
        )}
        {!loading && !regiaoAberta && regioesVisiveis.map(({ regiao: r, achados }, i) => {
          const marcados = r.hosp.filter(marcado).length
          const todos = marcados === r.hosp.length && r.hosp.length > 0
          const alguns = marcados > 0 && !todos
          // Cabeçalho da macro-região quando ela muda (só sem busca: filtrando,
          // a lista é curta e o agrupamento só atrapalharia).
          const grupoNovo = !busca.trim()
            && (i === 0 || regioesVisiveis[i - 1].regiao.grupo !== r.grupo)
          return (
            <div key={r.nome}>
              {grupoNovo && (
                <div className="uppercase" style={{
                  padding: '8px 14px 4px', fontSize: 10, letterSpacing: '.1em',
                  fontWeight: 700, color: 'var(--muted)',
                }}>{r.grupo}</div>
              )}
              <div
                onClick={() => abrirRegiao(r.nome)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
              >
                <TriCheck checked={todos} indeterminate={alguns} onChange={() => toggleVarios(r.hosp, todos)} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: 'var(--t-md)', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.nome}
                  </span>
                  {achados.length > 0 && (
                    <span style={{ display: 'block', fontSize: 'var(--t-sm)', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {achados.slice(0, 3).map((h) => h.nome).join(', ')}
                      {achados.length > 3 ? ` e mais ${achados.length - 3}` : ''}
                    </span>
                  )}
                </span>
                <span style={{ fontSize: 'var(--t-sm)', color: marcados ? 'var(--primary-3)' : 'var(--muted)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {marcados}/{r.hosp.length}
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}>
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            </div>
          )
        })}

        {/* Nível 2 — hospitais da região escolhida */}
        {!loading && regiaoAberta && (
          <div>
            <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 'var(--t-md)', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {regiaoAberta.nome}
              </span>
              <span style={{ fontSize: 'var(--t-sm)', color: marcadosAtivos ? 'var(--primary-3)' : 'var(--muted)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {marcadosAtivos}/{regiaoAberta.hosp.length} hospitais
              </span>
            </div>
            {/* Lista DENSA em colunas: a maior região tem dezenas de hospitais,
                e uma linha por item obrigaria a rolar às cegas. */}
            <div style={{
              padding: '6px 12px 12px', display: 'grid', gap: '1px 14px',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            }}>
              {hospitaisVisiveis.length === 0 && (
                <div style={{ color: 'var(--muted-2)', padding: '10px 2px', fontSize: 'var(--t-sm)' }}>
                  {regiaoAberta.hosp.length === 0 ? 'Esta região não tem hospitais cadastrados.' : 'Nenhum hospital encontrado.'}
                </div>
              )}
              {hospitaisVisiveis.map((h) => (
                <label
                  key={h.id}
                  title={h.operadoras.length ? `${h.nome} · ${h.operadoras.join(', ')}` : h.nome}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', cursor: 'pointer',
                    borderRadius: 6, fontSize: 'var(--t-sm)',
                    background: marcado(h) ? 'var(--accent-soft)' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={marcado(h)}
                    onChange={() => toggleHosp(h)}
                    style={{ accentColor: 'var(--primary)', width: 14, height: 14, flexShrink: 0 }}
                  />
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.nome}</span>
                  {/* Quantas operadoras o hospital atende. Marcar o hospital
                      cobre todas — o número está aqui para explicar por que o
                      escopo cresce mais que 1 ao marcar uma linha só. */}
                  {h.keys.length > 1 && (
                    <span
                      title={h.operadoras.join(', ')}
                      style={{ flexShrink: 0, fontSize: 'var(--t-xs)', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {h.keys.length} op.
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
        {nSelecionados === 0
          ? 'Nenhum hospital selecionado: o usuário verá TODOS os hospitais.'
          : `${nSelecionados} hospital(is) de ${nRegioes} região(ões): o usuário verá apenas estes.`}
      </div>
    </div>
  )
}
