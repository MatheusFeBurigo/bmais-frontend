// Cadastro da malha de atendimento (operadoras e hospitais) na tela Operações.
//
// Existe porque o analista interno mantém este cadastro sem enxergar a tela
// Configurações — lá o mesmo hospital vem acompanhado de regras de SLA e da
// carteira de pacientes, que são do gestor/diretor. Aqui é só o cadastro: criar
// operadora, criar hospital dentro dela e ver o que já existe.
//
// A leitura vem de /api/configuracoes (o mesmo payload da tela Configurações);
// a escrita usa os services já existentes. Ambos liberados ao analista por
// ROLES_LEITURA_CADASTRO / ROLES_ESCRITA_CADASTRO no backend.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useConfiguracoes } from '../../hooks/useConfiguracoes'
import { useTodosHospitais } from '../../hooks/useEquipe'
import {
  criarOperadora, renomearOperadora, excluirOperadora, excluirHospital,
} from '../../services/configuracoes.service'
import HospitalFormModal, { paraKey } from '../HospitalFormModal'
import { invalidarPorEvento } from '../../lib/invalidation'
import { LoadingState, Modal, OpAvatar, Spinner } from '../ui'
import { cidadeDaRegiao, ordenarCidades } from '../../lib/cidades'

const IconSearch = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
)
// Lixeira (excluir) — o "x" de antes se confundia com o de fechar a modal.
const IconLixeira = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></svg>
)
const IconLixeiraMini = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
)
const IconX = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
)
const IconCog = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
)
const IconPlus = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
)

const IconPredio = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M16 9h2a2 2 0 0 1 2 2v10" /><path d="M3 21h18" /><path d="M9 7h2M9 11h2M9 15h2" /></svg>
)
const IconPino = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
)

const IconEscudo = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 4 6v6c0 4.6 3.4 8.3 8 9 4.6-.7 8-4.4 8-9V6l-8-3z" /></svg>
)

interface HospitalDaLista { key: string; nome: string; cidade: string }

/** Hospitais da operadora em grupos por cidade, cidades em ordem alfabética
 *  com as pendências ("Sem cidade"/"A definir") no fim. */
function agruparPorCidade(lista: HospitalDaLista[]): [string, HospitalDaLista[]][] {
  const grupos = new Map<string, HospitalDaLista[]>()
  for (const h of lista) grupos.set(h.cidade, [...(grupos.get(h.cidade) ?? []), h])
  return [...grupos.entries()].sort(([a], [b]) => ordenarCidades(a, b))
}

interface Props {
  onToast: (m: string) => void
}

export default function CadastroMalha({ onToast }: Props) {
  const qc = useQueryClient()
  // Sem operadora/hospital nos params: queremos o panorama (lista de operadoras).
  const { data, isLoading, isError } = useConfiguracoes({ op: '', hospital: '' })
  const { data: hospitais } = useTodosHospitais()
  const [busca, setBusca] = useState('')
  const [addOp, setAddOp] = useState(false)
  // Operadora de onde o hospital novo foi pedido. '' = pelo botão "Novo", sem
  // operadora de origem (nenhuma vem marcada); null = modal fechada.
  const [addHospEm, setAddHospEm] = useState<string | null>(null)
  // Hospital aberto na ficha (editar/excluir), junto da operadora de contexto.
  const [fichaHosp, setFichaHosp] = useState<{ hosp: { key: string; nome: string } } | null>(null)
  // Operadora em edicao (renomear/excluir).
  const [opEdit, setOpEdit] = useState<{ key: string; nome: string } | null>(null)
  // Exclusao direta na lista: key do hospital aguardando confirmacao inline.
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [apagando, setApagando] = useState(false)
  const [erroExcluir, setErroExcluir] = useState<string | null>(null)

  async function removerHospital(h: { key: string; nome: string }) {
    setApagando(true)
    setErroExcluir(null)
    try {
      await excluirHospital(h.key)
      onToast(`✓ ${h.nome} excluído`)
      setExcluindo(null)
      invalidar()
    } catch (e) {
      // 409 traz o motivo (pacientes/escala presos). Fica na propria linha, para
      // a pessoa ler junto do hospital em questao.
      setErroExcluir((e as Error).message)
    } finally {
      setApagando(false)
    }
  }
  // Operadora expandida na lista (mostra os hospitais dela). Uma de cada vez.
  const [aberta, setAberta] = useState<string | null>(null)

  // hospitais por operadora, a partir do vínculo N-N já resolvido pela API.
  // Cada item leva a cidade (gravada ou derivada da região) para a lista
  // agrupar por ela, o mesmo recorte que o cadastro do hospital pede.
  const porOperadora = useMemo(() => {
    const mapa = new Map<string, HospitalDaLista[]>()
    for (const h of hospitais ?? []) {
      const ops = h.operadoras?.length ? h.operadoras : [h.operadora_key || '—']
      const cidade = h.cidade?.trim() || cidadeDaRegiao(h.regiao)
      for (const k of ops) {
        const lista = mapa.get(k) ?? []
        lista.push({ key: h.key, nome: h.nome, cidade })
        mapa.set(k, lista)
      }
    }
    for (const lista of mapa.values()) lista.sort((a, b) => a.nome.localeCompare(b.nome))
    return mapa
  }, [hospitais])

  function invalidar() {
    invalidarPorEvento(qc, 'configuracaoAlterada')
    // A lista de hospitais do multi-select tem key própria (`__todos__`) e não
    // entra no evento de configuração — sem isto, um hospital recém-criado só
    // apareceria no escopo do usuário depois do TTL.
    qc.invalidateQueries({ queryKey: ['hospitais'] })
  }

  if (isLoading) return <LoadingState label="Carregando cadastro…" />
  if (isError) return <div className="empty-state t-danger">Erro ao carregar o cadastro.</div>

  const q = busca.trim().toLowerCase()
  // A busca casa a operadora OU um hospital dela: procurar "Einstein" tem de
  // achar a operadora que o atende, senao o campo so serviria para 9 nomes.
  const operadoras = (data?.operadoras ?? []).filter((op) => {
    if (!q) return true
    if (op.nome.toLowerCase().includes(q) || op.key.toLowerCase().includes(q)) return true
    return (porOperadora.get(op.key) ?? []).some((h) => h.nome.toLowerCase().includes(q))
  })
  // Hospitais exibidos dentro de uma operadora: com busca ativa, so os que casam
  // (a operadora ja entrou na lista, mostrar os 103 esconderia o resultado).
  const hospitaisDe = (opKey: string) => {
    const lista = porOperadora.get(opKey) ?? []
    if (!q) return lista
    const casam = lista.filter((h) => h.nome.toLowerCase().includes(q))
    return casam.length > 0 ? casam : lista
  }

  return (
    <div>
      <div className="ops-toolbar">
        <div className="ops-search">
          {IconSearch}
          <input
            className="bm-input"
            placeholder="Buscar operadora ou hospital…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <MenuNovo onOperadora={() => setAddOp(true)} onHospital={() => setAddHospEm('')} />
      </div>

      {(data?.operadoras?.length ?? 0) > 0 && (
        <div className="malha-resumo">
          <b>{data?.operadoras.length}</b> {data?.operadoras.length === 1 ? 'operadora' : 'operadoras'}
          <span aria-hidden="true">·</span>
          <b>{hospitais?.length ?? 0}</b> {hospitais?.length === 1 ? 'hospital' : 'hospitais'}
        </div>
      )}

      {operadoras.length === 0 && (
        <div className="card empty-state" style={{ padding: '32px 16px' }}>
          {q ? (
            <>
              <div className="fw-6">Nenhum resultado</div>
              <div style={{ fontSize: 'var(--t-sm)', marginTop: 4 }}>
                Nenhuma operadora ou hospital corresponde a “{busca.trim()}”.
              </div>
            </>
          ) : (
            <>
              <div className="fw-6">Nenhuma operadora cadastrada</div>
              <div style={{ fontSize: 'var(--t-sm)', marginTop: 4 }}>Comece criando uma operadora.</div>
            </>
          )}
        </div>
      )}

      <div className="malha-lista">
        {operadoras.map((op) => {
          const hosp = hospitaisDe(op.key)
          const todos = porOperadora.get(op.key) ?? []
          const totalHosp = todos.length
          const totalCidades = new Set(todos.map((h) => h.cidade)).size
          // Busca ativa abre os grupos: o resultado esta la dentro.
          const expandida = aberta === op.key || (!!q && hosp.length > 0)
          const alternar = () => setAberta(expandida ? null : op.key)
          return (
            <section key={op.key} className={`malha-op${expandida ? ' aberta' : ''}`}>
              <div
                className="malha-op-topo"
                role="button"
                tabIndex={0}
                aria-expanded={expandida}
                onClick={alternar}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar() }
                }}
              >
                <OpAvatar opKey={op.key} size={38} />
                <div className="malha-op-info">
                  <div className="malha-op-nome">{op.nome}</div>
                  <div className="malha-op-sub">
                    <span>
                      {IconPredio}
                      {q && hosp.length !== totalHosp
                        ? `${hosp.length} de ${totalHosp}`
                        : `${totalHosp} ${totalHosp === 1 ? 'hospital' : 'hospitais'}`}
                    </span>
                    {totalCidades > 0 && (
                      <span>{IconPino}{totalCidades} {totalCidades === 1 ? 'cidade' : 'cidades'}</span>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={(e) => { e.stopPropagation(); setAddHospEm(op.key) }}
                  style={{ flexShrink: 0 }}
                >
                  {IconPlus}
                  Hospital
                </button>
                <button
                  type="button"
                  className="malha-op-icone"
                  onClick={(e) => { e.stopPropagation(); setOpEdit({ key: op.key, nome: op.nome }) }}
                  title="Renomear ou excluir a operadora"
                  aria-label={`Configurar ${op.nome}`}
                >
                  {IconCog}
                </button>
                <span className="malha-op-seta" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </div>
              {expandida && (
                // Agrupado por cidade, em colunas: uma operadora tem ~100
                // hospitais, e uma linha por item viraria rolagem interminável.
                <div className="malha-op-corpo">
                  {hosp.length === 0 && (
                    <div className="malha-vazio">Nenhum hospital nesta operadora ainda.</div>
                  )}
                  {agruparPorCidade(hosp).map(([cidade, lista]) => (
                    <div key={cidade} className="malha-cidade">
                      <div className="malha-cidade-topo">
                        {IconPino}
                        <span>{cidade}</span>
                        <em>{lista.length}</em>
                      </div>
                      <div className="malha-cidade-grade">
                        {lista.map((h) => (
                          <HospitalItem
                            key={h.key}
                            hosp={h}
                            confirmando={excluindo === h.key}
                            ocupado={apagando}
                            onEditar={() => setFichaHosp({ hosp: h })}
                            onPedirExcluir={() => { setExcluindo(h.key); setErroExcluir(null) }}
                            onCancelar={() => { setExcluindo(null); setErroExcluir(null) }}
                            onConfirmar={() => removerHospital(h)}
                            erro={excluindo === h.key ? erroExcluir : null}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>

      {addOp && (
        <NovaOperadoraModal
          onClose={() => setAddOp(false)}
          onToast={onToast}
          onDone={() => { setAddOp(false); invalidar() }}
        />
      )}
      {addHospEm !== null && (
        <HospitalFormModal
          operadoras={data?.operadoras ?? []}
          opInicial={addHospEm || undefined}
          onClose={() => setAddHospEm(null)}
          onToast={onToast}
          onDone={() => { setAddHospEm(null); invalidar() }}
        />
      )}
      {fichaHosp && (
        <HospitalFormModal
          operadoras={data?.operadoras ?? []}
          hospitalKey={fichaHosp.hosp.key}
          onClose={() => setFichaHosp(null)}
          onToast={onToast}
          onDone={() => { setFichaHosp(null); invalidar() }}
        />
      )}
      {opEdit && (
        <OperadoraEditModal
          operadora={opEdit}
          onClose={() => setOpEdit(null)}
          onToast={onToast}
          onDone={() => { setOpEdit(null); setAberta(null); invalidar() }}
        />
      )}
    </div>
  )
}

// "Novo +": um botão só para criar operadora ou hospital. O hospital criado por
// aqui não herda operadora nenhuma, a pessoa marca na modal todas as que ele
// atende, e ele passa a aparecer dentro de cada uma delas na lista.
function MenuNovo({ onOperadora, onHospital }: { onOperadora: () => void; onHospital: () => void }) {
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)

  // Fecha no clique fora e no Esc, como qualquer menu suspenso.
  useEffect(() => {
    if (!aberto) return
    function fora(e: MouseEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false)
    }
    function esc(e: KeyboardEvent) { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberto])

  const escolher = (acao: () => void) => () => { setAberto(false); acao() }

  return (
    <div className="malha-novo" ref={raiz}>
      <button type="button" className="btn btn-primary btn-sm" aria-haspopup="menu"
        aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        Novo
        {IconPlus}
      </button>
      {aberto && (
        <div className="malha-novo-lista" role="menu">
          <button type="button" role="menuitem" onClick={escolher(onOperadora)}>Operadora</button>
          <button type="button" role="menuitem" onClick={escolher(onHospital)}>Hospital</button>
        </div>
      )}
    </div>
  )
}

// Uma linha da lista de hospitais: o nome abre a ficha, o X exclui.
//
// A exclusao acontece AQUI, na propria linha — abrir a ficha inteira so para
// chegar num botao de excluir era caminho longo demais para uma acao simples.
// A confirmacao tambem e inline (o X vira "Excluir?/Nao"), sem modal em cima de
// modal, mas ainda exigindo um segundo clique porque e irreversivel.
function HospitalItem({ hosp, confirmando, ocupado, onEditar, onPedirExcluir, onCancelar, onConfirmar, erro }: {
  hosp: { key: string; nome: string }
  confirmando: boolean
  ocupado: boolean
  onEditar: () => void
  onPedirExcluir: () => void
  onCancelar: () => void
  onConfirmar: () => void
  erro: string | null
}) {
  if (confirmando) {
    return (
      <div className={`malha-hosp-row confirmando${erro ? ' com-erro' : ''}`}>
        <span className="malha-hosp-nome" title={hosp.nome}>{hosp.nome}</span>
        {erro ? (
          <>
            <span className="malha-hosp-erro">{erro}</span>
            <button type="button" className="malha-hosp-btn" onClick={onCancelar}>Fechar</button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="malha-hosp-acao"
              onClick={onConfirmar}
              disabled={ocupado}
              title={`Confirmar exclusão de ${hosp.nome}`}
              aria-label={`Confirmar exclusão de ${hosp.nome}`}
            >
              {ocupado ? <Spinner size={11} /> : IconLixeiraMini}
              {ocupado ? 'Excluindo' : 'Excluir'}
            </button>
            <button
              type="button"
              className="malha-hosp-cancelar"
              onClick={onCancelar}
              disabled={ocupado}
              title="Cancelar"
              aria-label="Cancelar exclusão"
            >
              {IconX}
            </button>
          </>
        )}
      </div>
    )
  }
  return (
    <div className="malha-hosp-row">
      <span className="malha-hosp-icone">{IconPredio}</span>
      <button type="button" className="malha-hosp-nome botao" onClick={onEditar}
        title={`${hosp.nome}. Clique para editar`}>
        {hosp.nome}
      </button>
      <button type="button" className="malha-hosp-x" onClick={onPedirExcluir}
        title={`Excluir ${hosp.nome}`} aria-label={`Excluir ${hosp.nome}`}>
        {IconLixeira}
      </button>
    </div>
  )
}


// Renomear ou excluir uma operadora. A key nao aparece: e identidade (internacoes
// e vinculos apontam para ela) e mudar so o rotulo e o que faz sentido aqui.
function OperadoraEditModal({ operadora, onClose, onToast, onDone }: {
  operadora: { key: string; nome: string }
  onClose: () => void
  onToast: (m: string) => void
  onDone: () => void
}) {
  const [nome, setNome] = useState(operadora.nome)
  const [saving, setSaving] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [erroExcluir, setErroExcluir] = useState<string | null>(null)

  async function salvar() {
    const n = nome.trim()
    if (!n) { onToast('Informe o nome da operadora'); return }
    if (n === operadora.nome) { onClose(); return }
    setSaving(true)
    try {
      await renomearOperadora(operadora.key, n)
      onToast('✓ Operadora renomeada')
      onDone()
    } catch (e) {
      onToast(`Erro: ${(e as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  async function excluir() {
    setSaving(true)
    setErroExcluir(null)
    try {
      await excluirOperadora(operadora.key)
      onToast('✓ Operadora excluída')
      onDone()
    } catch (e) {
      // 409 explica o que prende (hospitais/pacientes). Fica na modal, nao num
      // toast que some antes de a pessoa ler.
      setErroExcluir((e as Error).message)
      setSaving(false)
    }
  }

  return (
    <Modal title={`Operadora · ${operadora.nome}`} onClose={onClose}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div className="nh-campo nh-op-cabeca">
          <OpAvatar opKey={operadora.key} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <label htmlFor="op-edit-nome">Nome da operadora</label>
            <div className="nh-input">
              {IconEscudo}
              <input id="op-edit-nome" type="text" className="bm-input" value={nome}
                onChange={(e) => setNome(e.target.value)} autoFocus />
            </div>
          </div>
        </div>

        {erroExcluir && (
          <div style={{
            fontSize: 'var(--t-sm)', color: 'var(--danger)', background: 'var(--danger-bg)',
            border: '1px solid var(--danger)', borderRadius: 'var(--r-sm)', padding: '8px 10px',
          }}>
            {erroExcluir}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          {confirmando ? (
            <>
              <span style={{ fontSize: 'var(--t-sm)', color: 'var(--danger)', fontWeight: 600 }}>
                Excluir definitivamente?
              </span>
              <button className="btn btn-sm" onClick={excluir} disabled={saving}
                style={{ background: 'var(--danger)', color: '#fff', borderColor: 'var(--danger)' }}>
                {saving ? 'Excluindo…' : 'Sim, excluir'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setConfirmando(false)} disabled={saving}>
                Cancelar
              </button>
            </>
          ) : (
            <button className="btn btn-outline btn-sm" onClick={() => setConfirmando(true)} disabled={saving}
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
              Excluir operadora
            </button>
          )}
          <div style={{ flex: 1 }} />
          {!confirmando && (
            <>
              <button className="btn btn-outline btn-sm" onClick={onClose} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={salvar} disabled={saving || !nome.trim()}>
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

function NovaOperadoraModal({ onClose, onToast, onDone }: {
  onClose: () => void; onToast: (m: string) => void; onDone: () => void
}) {
  const [nome, setNome] = useState('')
  const [saving, setSaving] = useState(false)

  async function criar() {
    const n = nome.trim()
    if (!n) { onToast('Informe o nome da operadora'); return }
    setSaving(true)
    try {
      const d = await criarOperadora(n, paraKey(n))
      if (d.ok || (d as { criado?: boolean }).criado) { onToast('✓ Operadora criada'); onDone() }
      else onToast('Erro ao criar operadora')
    } catch (e) {
      onToast(`Erro: ${(e as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Nova operadora" onClose={onClose}>
      <div style={{ display: 'grid', gap: 10 }}>
        <div className="nh-campo">
          <label htmlFor="op-nova-nome">Nome da operadora</label>
          <div className="nh-input">
            {IconEscudo}
            <input id="op-nova-nome" type="text" className="bm-input" placeholder="Ex.: Amil Saúde"
              value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
          </div>
        </div>
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={criar} disabled={saving || !nome.trim()}>
            {saving ? 'Criando…' : 'Criar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
