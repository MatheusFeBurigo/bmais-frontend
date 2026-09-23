// Seleção de escopo de dados de um usuário — CIDADE → HOSPITAIS.
// Primeiro o admin escolhe UMA cidade; os hospitais dela aparecem no lugar e
// ele marca alguns, todos ou apenas um. A saída continua sendo hospital_keys
// (gravadas em profile_hospitais). Vazio = sem restrição.
//
// POR QUE CIDADE E NÃO OPERADORA: um hospital atende várias operadoras, e o
// cadastro materializa isso como uma LINHA POR OPERADORA (AACD existe como
// aacd_br, aacd_po, aacd_ms). Agrupar por operadora obrigava o admin a saber de
// qual operadora era o hospital que ele queria — e a marcá-lo várias vezes para
// cobrir o hospital inteiro, porque cada linha é uma key diferente. Cidade é o
// recorte de quem de fato usa a tela: a pessoa cuida dos hospitais de uma área.
//
// A cidade é DERIVADA da região gravada no hospital (ver lib/cidades.ts): as
// zonas da capital colapsam em "São Paulo", e o que é estado fica identificado
// como pendência em vez de virar uma cidade inventada. O mesmo agrupamento
// vale na escolha de hospitais de um profissional (SeletorEscala), para que
// "dar acesso" e "atribuir hospitais" não sejam duas geografias diferentes.
//
// DEDUPLICAÇÃO POR NOME: dentro da cidade, as linhas do mesmo hospital viram UM
// item, e marcá-lo marca TODAS as keys dele. Sem isso o admin veria "AACD" três
// vezes, sem nada na tela que distinguisse uma da outra, e marcar a errada
// daria a ele um escopo que só enxerga parte dos pacientes do hospital.
//
// A contagem no rodapé é de hospitais distintos, não de keys, pelo mesmo
// motivo: "3 hospitais" é o que o admin escolheu; 7 seria o número interno.
import { useMemo, useState, useRef, useEffect } from 'react'
import type { Hospital } from '../types/api'
import { cidadeDaRegiao, ordenarCidades, CIDADE_A_DEFINIR, SEM_CIDADE } from '../lib/cidades'

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

interface Cidade {
  nome: string
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
  // Cidade aberta (null = tela de cidades). Uma de cada vez.
  const [cidadeAtiva, setCidadeAtiva] = useState<string | null>(null)
  const sel = useMemo(() => new Set(selecionados), [selecionados])

  // Cidades, cada uma com seus hospitais já deduplicados por nome.
  const cidades = useMemo(() => {
    const porCidade = new Map<string, Map<string, HospitalAgrupado>>()
    for (const h of hospitais) {
      const cidade = cidadeDaRegiao(h.regiao)
      const id = normalizar(h.nome)
      if (!porCidade.has(cidade)) porCidade.set(cidade, new Map())
      const mapa = porCidade.get(cidade)!
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
    const lista: Cidade[] = []
    for (const [nome, mapa] of porCidade) {
      const hosp = Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      for (const x of hosp) x.operadoras.sort((a, b) => a.localeCompare(b, 'pt-BR'))
      lista.push({ nome, hosp })
    }
    // Alfabética, com as pendências de cadastro no fim (ver lib/cidades.ts).
    return lista.sort((a, b) => ordenarCidades(a.nome, b.nome))
  }, [hospitais])

  const cidadeAberta = useMemo(
    () => cidades.find((c) => c.nome === cidadeAtiva) ?? null,
    [cidades, cidadeAtiva],
  )

  // Dentro da cidade aberta, a busca filtra os hospitais por nome.
  const hospitaisVisiveis = useMemo(() => {
    if (!cidadeAberta) return []
    const q = normalizar(busca)
    if (!q) return cidadeAberta.hosp
    return cidadeAberta.hosp.filter((h) => h.id.includes(q))
  }, [cidadeAberta, busca])

  // Na tela de cidades a busca alcança os HOSPITAIS, não só o nome da cidade:
  // quem procura "Einstein" não sabe (nem deveria precisar saber) em que
  // cidade ele está. A cidade aparece com os hospitais que casaram.
  const cidadesVisiveis = useMemo(() => {
    const q = normalizar(busca)
    if (!q) return cidades.map((c) => ({ cidade: c, achados: [] as HospitalAgrupado[] }))
    const out: Array<{ cidade: Cidade; achados: HospitalAgrupado[] }> = []
    for (const c of cidades) {
      if (normalizar(c.nome).includes(q)) { out.push({ cidade: c, achados: [] }); continue }
      const achados = c.hosp.filter((h) => h.id.includes(q))
      if (achados.length) out.push({ cidade: c, achados })
    }
    return out
  }, [cidades, busca])

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

  function abrirCidade(nome: string) {
    setCidadeAtiva(nome)
    setBusca('')  // a busca passa a valer para os hospitais desta cidade
  }

  function voltarParaCidades() {
    setCidadeAtiva(null)
    setBusca('')
  }

  /** Um hospital conta como marcado quando TODAS as keys dele estão no escopo. */
  const marcado = (h: HospitalAgrupado) => h.keys.every((k) => sel.has(k))

  const todosHosp = useMemo(() => cidades.flatMap((c) => c.hosp), [cidades])
  const todosMarcados = todosHosp.length > 0 && todosHosp.every(marcado)
  const nSelecionados = todosHosp.filter(marcado).length
  const nCidades = new Set(
    cidades.filter((c) => c.hosp.some(marcado)).map((c) => c.nome),
  ).size

  // Contagens da cidade aberta (cabeçalho + botão "marcar todos").
  const marcadosAtivos = cidadeAberta ? cidadeAberta.hosp.filter(marcado).length : 0
  const todosAtivos = !!cidadeAberta && cidadeAberta.hosp.length > 0
    && marcadosAtivos === cidadeAberta.hosp.length

  return (
    <div style={{ border: '1px solid var(--border-strong)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 8, padding: 8, borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
        {cidadeAberta && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={voltarParaCidades}
            title="Voltar para a lista de cidades"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Cidades
          </button>
        )}
        <input
          className="bm-input"
          placeholder={cidadeAberta ? `Buscar hospital em ${cidadeAberta.nome}…` : 'Buscar cidade ou hospital…'}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ flex: 1, minWidth: 0 }}
        />
        {cidadeAberta ? (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => toggleVarios(cidadeAberta.hosp, todosAtivos)}
            disabled={loading || cidadeAberta.hosp.length === 0}
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
        {loading && <div style={{ color: 'var(--muted-2)', padding: 14, fontSize: 'var(--t-base)' }}>Carregando cidades…</div>}

        {/* Nível 1 — escolher a cidade */}
        {!loading && !cidadeAberta && cidadesVisiveis.length === 0 && (
          <div style={{ color: 'var(--muted-2)', padding: 12, fontSize: 'var(--t-sm)' }}>Nenhuma cidade ou hospital encontrado.</div>
        )}
        {!loading && !cidadeAberta && cidadesVisiveis.map(({ cidade: c, achados }) => {
          const marcados = c.hosp.filter(marcado).length
          const todos = marcados === c.hosp.length && c.hosp.length > 0
          const alguns = marcados > 0 && !todos
          // As duas pendências de cadastro não são lugares: ficam apagadas para
          // não disputarem atenção com as cidades de verdade.
          const pendencia = c.nome === SEM_CIDADE || c.nome === CIDADE_A_DEFINIR
          return (
            <div
              key={c.nome}
              onClick={() => abrirCidade(c.nome)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
            >
              <TriCheck checked={todos} indeterminate={alguns} onChange={() => toggleVarios(c.hosp, todos)} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 600, fontSize: 'var(--t-md)', color: pendencia ? 'var(--muted)' : 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.nome}
                </span>
                {achados.length > 0 && (
                  <span style={{ display: 'block', fontSize: 'var(--t-sm)', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {achados.slice(0, 3).map((h) => h.nome).join(', ')}
                    {achados.length > 3 ? ` e mais ${achados.length - 3}` : ''}
                  </span>
                )}
              </span>
              <span style={{ fontSize: 'var(--t-sm)', color: marcados ? 'var(--primary-3)' : 'var(--muted)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {marcados}/{c.hosp.length}
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          )
        })}

        {/* Nível 2 — hospitais da cidade escolhida */}
        {!loading && cidadeAberta && (
          <div>
            <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 'var(--t-md)', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cidadeAberta.nome}
              </span>
              <span style={{ fontSize: 'var(--t-sm)', color: marcadosAtivos ? 'var(--primary-3)' : 'var(--muted)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {marcadosAtivos}/{cidadeAberta.hosp.length} hospitais
              </span>
            </div>
            {/* Lista DENSA em colunas: a maior cidade tem dezenas de hospitais,
                e uma linha por item obrigaria a rolar às cegas. */}
            <div style={{
              padding: '6px 12px 12px', display: 'grid', gap: '1px 14px',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            }}>
              {hospitaisVisiveis.length === 0 && (
                <div style={{ color: 'var(--muted-2)', padding: '10px 2px', fontSize: 'var(--t-sm)' }}>
                  {cidadeAberta.hosp.length === 0 ? 'Esta cidade não tem hospitais cadastrados.' : 'Nenhum hospital encontrado.'}
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
          : `${nSelecionados} hospital(is) de ${nCidades} cidade(s): o usuário verá apenas estes.`}
      </div>
    </div>
  )
}
