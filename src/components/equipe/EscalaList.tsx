// Escala do profissional: REGIÃO → HOSPITAL, com as operadoras como tags.
//
// Antes era agrupada por operadora, e o mesmo hospital se repetia em cada
// bloco (Alvorada Moema aparecia 4 vezes, uma por operadora), com nome do
// serviço por extenso em toda linha. Agora o hospital aparece uma vez, sob a
// cidade dele, e as operadoras viram tags.
//
// Um hospital atende várias operadoras, mas o profissional não cobre
// necessariamente todas. As tags só MOSTRAM as que ele cobre; quem muda é o
// botão "Operadoras" do cartão, que abre ali mesmo a lista de todas as
// operadoras do hospital para marcar e salvar. (Antes as próprias tags eram
// botões liga/desliga, e ninguém descobria: tag cheia parece etiqueta.)
//
// A escala no banco segue sendo uma linha por (hospital, operadora, serviço);
// o agrupamento é só de exibição. Remover um hospital (X) apaga todas as
// linhas dele.
import { useMemo, useState } from 'react'
import type { Escala, Hospital } from '../../types/api'
import { adicionarEscala, removerEscala } from '../../services/escala.service'
import { cidadeDaRegiao, ordenarCidades } from '../../lib/cidades'
import { corOperadora } from '../../lib/coresOperadora'
import { SERVICO_LABEL } from './equipe.styles'
import { IconX } from './icons'

const IconLapis = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
)

interface OpHospital {
  /** hospital_key do cadastro para esta operadora. */
  key: string
  operadora_key: string
}

interface HospitalEscala {
  id: string
  nome: string
  linhas: Escala[]
  servicos: string[]
  /** Todas as operadoras do hospital no cadastro (as da escala incluídas). */
  ops: OpHospital[]
}

function normalizar(s: string): string {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export default function EscalaList({ escala, hospitais, opsLista, profissionalId, onToast, onChanged }: {
  escala: Escala[]
  /** Cadastro de hospitais: cidade de cada um e as operadoras que ele atende. */
  hospitais: Hospital[]
  opsLista: Array<{ key: string; nome: string }>
  profissionalId: number
  onToast: (m: string) => void
  onChanged: () => void
}) {
  // Hospital com a lista de operadoras aberta, e o que está marcado nela.
  const [editando, setEditando] = useState<string | null>(null)
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set())
  const [salvando, setSalvando] = useState(false)
  const nomeOp = useMemo(() => new Map(opsLista.map((o) => [o.key, o.nome])), [opsLista])

  const regioes = useMemo(() => {
    const regiaoPorKey = new Map(hospitais.map((h) => [h.key, h.regiao]))
    // Mesmo agrupamento do SeletorEscala: o cadastro repete o hospital uma vez
    // por operadora, e cidade + nome normalizado é o que os une (dois "São
    // Lucas" em cidades diferentes são hospitais diferentes).
    const opsPorNome = new Map<string, OpHospital[]>()
    for (const h of hospitais) {
      const id = `${cidadeDaRegiao(h.regiao)}|${normalizar(h.nome)}`
      if (!opsPorNome.has(id)) opsPorNome.set(id, [])
      const lista = opsPorNome.get(id)!
      // Cadastro antigo: uma linha por operadora (coluna operadora_key).
      // Vínculo N-N (0015): uma linha só, com todas em `operadoras`.
      const ops = h.operadoras?.length ? h.operadoras : [h.operadora_key || '']
      for (const op of ops) {
        if (op && !lista.some((o) => o.operadora_key === op)) lista.push({ key: h.key, operadora_key: op })
      }
    }
    const porCidade = new Map<string, Map<string, HospitalEscala>>()
    for (const e of escala) {
      const cidade = cidadeDaRegiao(e.hospital_key ? regiaoPorKey.get(e.hospital_key) : null)
      if (!porCidade.has(cidade)) porCidade.set(cidade, new Map())
      const mapa = porCidade.get(cidade)!
      const id = `${cidade}|${normalizar(e.hospital_nome)}`
      const h = mapa.get(id) ?? { id, nome: e.hospital_nome, linhas: [], servicos: [], ops: [...(opsPorNome.get(id) ?? [])] }
      h.linhas.push(e)
      if (!h.servicos.includes(e.servico)) h.servicos.push(e.servico)
      // Operadora da escala que o cadastro não lista (hospital renomeado,
      // vínculo desfeito): entra mesmo assim, senão some sem dar para tirar.
      if (!h.ops.some((o) => o.operadora_key === e.operadora_key)) {
        h.ops.push({ key: e.hospital_key || '', operadora_key: e.operadora_key })
      }
      mapa.set(id, h)
    }
    const porNome = (a: OpHospital, b: OpHospital) =>
      (nomeOp.get(a.operadora_key) ?? a.operadora_key).localeCompare(nomeOp.get(b.operadora_key) ?? b.operadora_key, 'pt-BR')
    return Array.from(porCidade, ([cidade, mapa]) => {
      const hosp = Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      for (const h of hosp) h.ops.sort(porNome)
      return { cidade, hosp }
    }).sort((a, b) => ordenarCidades(a.cidade, b.cidade))
  }, [escala, hospitais, nomeOp])

  if (escala.length === 0) {
    return <div style={{ color: 'var(--muted)', fontSize: 'var(--t-sm)', padding: '10px 0' }}>Nenhum hospital na escala.</div>
  }

  async function remover(h: HospitalEscala) {
    if (!confirm(`Remover ${h.nome} da escala?`)) return
    try {
      // Sem transação: uma chamada por linha. Se uma falhar, as outras já saíram.
      for (const e of h.linhas) await removerEscala(e.id)
      onToast('Removido da escala')
    } catch {
      onToast('Não foi possível remover tudo. Confira a lista e tente de novo.')
    } finally {
      onChanged()
    }
  }

  const ativasDe = (h: HospitalEscala) => new Set(h.linhas.map((e) => e.operadora_key))

  function abrirEdicao(h: HospitalEscala) {
    setEditando(h.id)
    setMarcadas(ativasDe(h))
  }

  function marcar(op: string) {
    setMarcadas((cur) => {
      const next = new Set(cur)
      if (next.has(op)) next.delete(op)
      else next.add(op)
      return next
    })
  }

  async function salvarOperadoras(h: HospitalEscala) {
    // Desmarcar todas = tirar o hospital: mesma confirmação do X.
    if (marcadas.size === 0) { await remover(h); setEditando(null); return }
    const ativas = ativasDe(h)
    const tirar = h.linhas.filter((e) => !marcadas.has(e.operadora_key))
    const incluir = h.ops.filter((o) => marcadas.has(o.operadora_key) && !ativas.has(o.operadora_key))
    if (tirar.length === 0 && incluir.length === 0) { setEditando(null); return }
    setSalvando(true)
    try {
      // Sem transação: uma chamada por linha, em sequência.
      for (const e of tirar) await removerEscala(e.id)
      // A operadora nova entra com os mesmos serviços que o hospital já tem.
      for (const o of incluir) {
        for (const servico of h.servicos) {
          await adicionarEscala({
            hospital_key: o.key, hospital_nome: h.nome, operadora_key: o.operadora_key,
            servico, profissional_id: profissionalId,
          })
        }
      }
      onToast('✓ Operadoras atualizadas')
      setEditando(null)
    } catch {
      onToast('Não foi possível salvar todas as operadoras. Confira a lista e tente de novo.')
    } finally {
      setSalvando(false)
      onChanged()
    }
  }

  return (
    <>
      {regioes.map((r) => (
        <div key={r.cidade} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>
            {r.cidade}
          </div>
          {r.hosp.map((h) => {
            const aberto = editando === h.id
            const ativas = ativasDe(h)
            return (
              <div key={h.id} className="escala-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="fw-6 truncate" style={{ fontSize: 'var(--t-sm)' }}>{h.nome}</div>
                    {!aberto && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        {h.ops.filter((o) => ativas.has(o.operadora_key)).map((op) => {
                          const c = corOperadora(op.operadora_key)
                          return (
                            <span key={op.operadora_key} style={{
                              fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 999,
                              background: c.fundo, color: c.ink,
                            }}>
                              {nomeOp.get(op.operadora_key) ?? op.operadora_key}
                            </span>
                          )
                        })}
                        {ativas.size < h.ops.length && (
                          <span style={{ fontSize: 10, color: 'var(--muted)', padding: '1px 2px' }}>
                            {ativas.size} de {h.ops.length} operadoras
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {h.servicos.map((s) => (
                    <span key={s} className="servico-badge" title={SERVICO_LABEL[s] || s}>{s}</span>
                  ))}
                  {h.ops.length > 1 && !aberto && (
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => abrirEdicao(h)}
                      disabled={editando !== null} title="Escolher as operadoras que ele cobre neste hospital">
                      {IconLapis}
                      Operadoras
                    </button>
                  )}
                  <button className="escala-remove" onClick={() => remover(h)} title="Remover da escala" disabled={salvando}>{IconX}</button>
                </div>

                {aberto && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)', marginBottom: 6 }}>
                      Operadoras que ele cobre neste hospital
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 6 }}>
                      {h.ops.map((op) => {
                        const c = corOperadora(op.operadora_key)
                        return (
                          <label key={op.operadora_key} style={{
                            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                            fontSize: 'var(--t-sm)', color: 'var(--ink)',
                          }}>
                            <input
                              type="checkbox"
                              checked={marcadas.has(op.operadora_key)}
                              onChange={() => marcar(op.operadora_key)}
                              disabled={salvando}
                              style={{ accentColor: 'var(--primary)', width: 14, height: 14 }}
                            />
                            <span style={{ width: 8, height: 8, borderRadius: 999, background: c.ink, flexShrink: 0 }} />
                            {nomeOp.get(op.operadora_key) ?? op.operadora_key}
                          </label>
                        )
                      })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditando(null)} disabled={salvando}>Cancelar</button>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => salvarOperadoras(h)} disabled={salvando}>
                        {salvando ? 'Salvando…' : 'Salvar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </>
  )
}
