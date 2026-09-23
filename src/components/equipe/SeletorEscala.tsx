// Escolha dos hospitais de um profissional — CIDADE → HOSPITAIS → OPERADORAS.
//
// O que ele substituiu: três selects encadeados (operadora → hospital →
// serviço) que produziam UM hospital por vez. Para um médico auditor que atende
// 8 hospitais em duas operadoras, isso eram 8 passagens pelo formulário, e a
// pessoa precisava saber de antemão de qual operadora era cada hospital.
//
// A pergunta que a tela faz agora é a que quem cadastra sabe responder: "em que
// CIDADE este auditor atua?" e, dentro dela, "quais hospitais?". A operadora
// deixou de ser o caminho até o hospital e virou detalhe DELE: um hospital que
// atende três operadoras mostra as três, e a pessoa marca as que valem para
// este profissional (todas, por padrão — é o caso comum).
//
// POR QUE CIDADE E NÃO REGIÃO: ver lib/cidades.ts. Em resumo, a região existe
// no banco e já é quase toda cidade; as zonas da capital colapsam em
// "São Paulo" porque aqui ninguém pensa por zona.
//
// DEDUPLICAÇÃO POR NOME: o cadastro repete o mesmo hospital uma vez por
// operadora (AACD é aacd_br, aacd_po, aacd_ms). Na lista ele aparece UMA vez,
// com as operadoras dele dentro. Sem isso a pessoa veria "AACD" três vezes sem
// nada que as distinguisse.
//
// SAÍDA: uma EntradaEscala por (hospital_key, serviço) — o mesmo formato que a
// API já aceita. Uma escolha de 1 hospital x 2 operadoras x 1 serviço vira 2
// entradas, porque cada operadora é uma key diferente no cadastro.
import { useMemo, useState } from 'react'
import type { Hospital } from '../../types/api'
import type { EntradaEscala } from '../../services/escala.service'
import { cidadeDaRegiao, ordenarCidades, CIDADE_A_DEFINIR, SEM_CIDADE } from '../../lib/cidades'
import { SERVICOS } from './equipe.styles'

/** Um hospital como a tela o trata: um nome e as linhas de cadastro (uma por
 *  operadora) que o representam. */
interface HospitalAgrupado {
  /** Nome normalizado — identidade do agrupamento. */
  id: string
  nome: string
  /** Uma entrada por operadora que o hospital atende. */
  ops: Array<{ key: string; nome: string; operadora_key: string }>
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

/** Linha de operadora de um hospital, com a key de cadastro dela. */
function operadoraDe(h: Hospital, nomePorKey: Map<string, string>) {
  const key = h.operadora_key || ''
  const nome = h.operadora_nome || nomePorKey.get(key) || key
  return { key: h.key, nome, operadora_key: key }
}

export default function SeletorEscala({
  hospitais, opsLista, jaNaEscala = [], onAdicionar, onClose,
  loading, rotuloBotao = 'Adicionar',
}: {
  hospitais: Hospital[]
  opsLista: Array<{ key: string; nome: string }>
  /** hospital_keys que o profissional JÁ tem — aparecem marcadas e explicadas,
   *  para a pessoa não tentar incluir de novo o que já está lá. */
  jaNaEscala?: string[]
  /** Recebe todas as entradas escolhidas de uma vez. Lançar mantém aberto. */
  onAdicionar: (entradas: EntradaEscala[]) => Promise<void> | void
  onClose?: () => void
  loading?: boolean
  rotuloBotao?: string
}) {
  const [busca, setBusca] = useState('')
  const [cidadeAtiva, setCidadeAtiva] = useState<string | null>(null)
  const [servico, setServico] = useState('P')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  /** hospital_keys marcadas nesta sessão de escolha (uma por operadora). */
  const [sel, setSel] = useState<Set<string>>(new Set())
  /** Hospitais (por id) cuja lista de operadoras está aberta. */
  const [abertos, setAbertos] = useState<Set<string>>(new Set())

  const jaTem = useMemo(() => new Set(jaNaEscala), [jaNaEscala])
  const nomePorKey = useMemo(
    () => new Map(opsLista.map((o) => [o.key, o.nome])), [opsLista],
  )

  // Cidades, cada uma com seus hospitais já deduplicados por nome.
  const cidades = useMemo(() => {
    const porCidade = new Map<string, Map<string, HospitalAgrupado>>()
    for (const h of hospitais) {
      const cidade = cidadeDaRegiao(h.regiao)
      if (!porCidade.has(cidade)) porCidade.set(cidade, new Map())
      const mapa = porCidade.get(cidade)!
      const id = normalizar(h.nome)
      const op = operadoraDe(h, nomePorKey)
      const existente = mapa.get(id)
      if (existente) existente.ops.push(op)
      else mapa.set(id, { id, nome: h.nome, ops: [op] })
    }
    const lista: Cidade[] = []
    for (const [nome, mapa] of porCidade) {
      const hosp = Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      for (const x of hosp) x.ops.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      lista.push({ nome, hosp })
    }
    return lista.sort((a, b) => ordenarCidades(a.nome, b.nome))
  }, [hospitais, nomePorKey])

  const cidadeAberta = useMemo(
    () => cidades.find((c) => c.nome === cidadeAtiva) ?? null,
    [cidades, cidadeAtiva],
  )

  // Na lista de cidades a busca alcança os HOSPITAIS também: quem procura
  // "Einstein" não sabe (nem precisa saber) em que cidade ele está.
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

  const hospitaisVisiveis = useMemo(() => {
    if (!cidadeAberta) return []
    const q = normalizar(busca)
    return q ? cidadeAberta.hosp.filter((h) => h.id.includes(q)) : cidadeAberta.hosp
  }, [cidadeAberta, busca])

  /** Operadoras do hospital que ainda cabem escolher (as que já estão na
   *  escala saem do jogo: incluir de novo não faria nada). */
  const disponiveis = (h: HospitalAgrupado) => h.ops.filter((o) => !jaTem.has(o.key))
  const totalMarcado = (h: HospitalAgrupado) => disponiveis(h).filter((o) => sel.has(o.key)).length
  const cheio = (h: HospitalAgrupado) => {
    const d = disponiveis(h)
    return d.length > 0 && d.every((o) => sel.has(o.key))
  }

  /** Marca/desmarca o hospital INTEIRO (todas as operadoras livres dele).
   *  É o gesto comum: quem cuida de um hospital costuma cuidar dele em todas
   *  as operadoras que ele atende. */
  function toggleHosp(h: HospitalAgrupado) {
    const next = new Set(sel)
    const tirar = cheio(h)
    for (const o of disponiveis(h)) {
      if (tirar) next.delete(o.key)
      else next.add(o.key)
    }
    setSel(next)
  }

  function toggleOperadora(hospKey: string) {
    const next = new Set(sel)
    if (next.has(hospKey)) next.delete(hospKey)
    else next.add(hospKey)
    setSel(next)
  }

  function toggleAberto(id: string) {
    const next = new Set(abertos)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setAbertos(next)
  }

  function abrirCidade(nome: string) {
    setCidadeAtiva(nome)
    setBusca('')
  }

  /** Tudo que está marcado, em qualquer cidade — a escolha não se perde ao
   *  voltar e entrar em outra cidade. */
  const escolhidos = useMemo(() => {
    const out: Array<{ hospital: HospitalAgrupado; ops: HospitalAgrupado['ops'] }> = []
    for (const c of cidades) {
      for (const h of c.hosp) {
        const ops = h.ops.filter((o) => sel.has(o.key))
        if (ops.length) out.push({ hospital: h, ops })
      }
    }
    return out
  }, [cidades, sel])

  const nLinhas = escolhidos.reduce((n, e) => n + e.ops.length, 0)

  async function confirmar() {
    if (nLinhas === 0) { setErro('Marque ao menos um hospital'); return }
    const entradas: EntradaEscala[] = escolhidos.flatMap((e) =>
      e.ops.map((o) => ({
        hospital_key: o.key,
        hospital_nome: e.hospital.nome,
        operadora_key: o.operadora_key,
        servico,
      })))
    setSaving(true)
    setErro(null)
    try {
      await onAdicionar(entradas)
      setSel(new Set())
      setAbertos(new Set())
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const labelStyle = {
    display: 'block', fontSize: 10, textTransform: 'uppercase' as const,
    letterSpacing: '.1em', fontWeight: 600, color: 'var(--muted)', marginBottom: 4,
  }

  return (
    <div style={{ border: '1px solid var(--border-strong)', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
      {/* Busca + navegação */}
      <div style={{ display: 'flex', gap: 8, padding: 8, borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
        {cidadeAberta && (
          <button
            type="button" className="btn btn-outline btn-sm"
            onClick={() => { setCidadeAtiva(null); setBusca('') }}
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
          style={{ flex: 1, minWidth: 0, fontSize: 'var(--t-sm)' }}
        />
      </div>

      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {loading && <div style={{ color: 'var(--muted-2)', padding: 14, fontSize: 'var(--t-sm)' }}>Carregando cidades…</div>}

        {/* Nível 1 — escolher a cidade */}
        {!loading && !cidadeAberta && cidadesVisiveis.length === 0 && (
          <div style={{ color: 'var(--muted-2)', padding: 12, fontSize: 'var(--t-sm)' }}>Nenhuma cidade ou hospital encontrado.</div>
        )}
        {!loading && !cidadeAberta && cidadesVisiveis.map(({ cidade: c, achados }) => {
          const nMarcados = c.hosp.filter((h) => totalMarcado(h) > 0).length
          const pendencia = c.nome === SEM_CIDADE || c.nome === CIDADE_A_DEFINIR
          return (
            <div
              key={c.nome}
              onClick={() => abrirCidade(c.nome)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
            >
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 600, fontSize: 'var(--t-sm)', color: pendencia ? 'var(--muted)' : 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.nome}
                </span>
                {achados.length > 0 && (
                  <span style={{ display: 'block', fontSize: 'var(--t-xs)', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {achados.slice(0, 3).map((h) => h.nome).join(', ')}
                    {achados.length > 3 ? ` e mais ${achados.length - 3}` : ''}
                  </span>
                )}
              </span>
              {nMarcados > 0 && (
                <span style={{ fontSize: 'var(--t-xs)', color: 'var(--primary-3)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {nMarcados} marcado{nMarcados > 1 ? 's' : ''}
                </span>
              )}
              <span style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{c.hosp.length}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)', flexShrink: 0 }}>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          )
        })}

        {/* Nível 2 — hospitais da cidade, com as operadoras de cada um */}
        {!loading && cidadeAberta && (
          <div>
            <div style={{ padding: '8px 14px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 'var(--t-sm)', color: 'var(--ink)' }}>
              {cidadeAberta.nome}
            </div>
            {hospitaisVisiveis.length === 0 && (
              <div style={{ color: 'var(--muted-2)', padding: 12, fontSize: 'var(--t-sm)' }}>
                {cidadeAberta.hosp.length === 0 ? 'Esta cidade não tem hospitais cadastrados.' : 'Nenhum hospital encontrado.'}
              </div>
            )}
            {hospitaisVisiveis.map((h) => {
              const livres = disponiveis(h)
              const nMarcadas = totalMarcado(h)
              const todasNaEscala = livres.length === 0
              const aberto = abertos.has(h.id)
              return (
                <div key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px' }}>
                    <input
                      type="checkbox"
                      checked={cheio(h)}
                      ref={(el) => { if (el) el.indeterminate = nMarcadas > 0 && !cheio(h) }}
                      onChange={() => toggleHosp(h)}
                      disabled={todasNaEscala}
                      style={{ accentColor: 'var(--primary)', width: 14, height: 14, flexShrink: 0 }}
                    />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 'var(--t-sm)', color: todasNaEscala ? 'var(--muted)' : 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {h.nome}
                      </span>
                      {todasNaEscala && (
                        <span style={{ display: 'block', fontSize: 'var(--t-xs)', color: 'var(--muted)' }}>Já está na escala</span>
                      )}
                    </span>
                    {/* Hospital de uma operadora só não tem o que escolher: o
                        detalhe fica escondido e a linha diz de onde ele vem. */}
                    {h.ops.length === 1 ? (
                      <span style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)', flexShrink: 0 }}>{h.ops[0].nome}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleAberto(h.id)}
                        style={{ background: 'none', border: 0, cursor: 'pointer', color: nMarcadas ? 'var(--primary-3)' : 'var(--muted)', fontSize: 'var(--t-xs)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, padding: '2px 4px' }}
                      >
                        {nMarcadas || livres.length} de {h.ops.length} operadoras
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: aberto ? 'rotate(180deg)' : 'none' }}>
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {/* Operadoras do hospital: marcar só algumas é o que permite
                      dizer "este auditor cuida do Einstein na Porto, não na Amil". */}
                  {aberto && h.ops.length > 1 && (
                    <div style={{ padding: '0 14px 8px 38px', display: 'grid', gap: 2 }}>
                      {h.ops.map((o) => {
                        const naEscala = jaTem.has(o.key)
                        return (
                          <label key={o.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--t-xs)', color: naEscala ? 'var(--muted)' : 'var(--ink)', cursor: naEscala ? 'default' : 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={naEscala || sel.has(o.key)}
                              disabled={naEscala}
                              onChange={() => toggleOperadora(o.key)}
                              style={{ accentColor: 'var(--primary)', width: 13, height: 13 }}
                            />
                            <span>{o.nome}</span>
                            {naEscala && <span style={{ color: 'var(--muted-2)' }}>(já está na escala)</span>}
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Serviço + confirmação. O serviço vale para tudo que foi marcado: quem
          precisa de serviços diferentes marca em duas rodadas. */}
      <div style={{ padding: 10, borderTop: '1px solid var(--border)', background: 'var(--surface-3)', display: 'grid', gap: 8 }}>
        <div>
          <label style={labelStyle}>Serviço</label>
          <select className="bm-input bm-select" style={{ fontSize: 'var(--t-sm)' }} value={servico} onChange={(e) => setServico(e.target.value)}>
            {SERVICOS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        {erro && <div style={{ fontSize: 'var(--t-xs)', color: 'var(--danger)' }}>{erro}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1, fontSize: 'var(--t-xs)', color: 'var(--muted)' }}>
            {nLinhas === 0
              ? 'Nenhum hospital marcado'
              : `${escolhidos.length} hospital(is), ${nLinhas} vínculo(s) de operadora`}
          </span>
          {onClose && <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>}
          <button type="button" className="btn btn-primary btn-sm" onClick={confirmar} disabled={saving || nLinhas === 0}>
            {saving ? 'Adicionando…' : rotuloBotao}
          </button>
        </div>
      </div>
    </div>
  )
}
