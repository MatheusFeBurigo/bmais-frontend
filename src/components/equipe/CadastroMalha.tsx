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
import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useConfiguracoes } from '../../hooks/useConfiguracoes'
import { useTodosHospitais } from '../../hooks/useEquipe'
import {
  criarOperadora, criarHospital, renomearOperadora, excluirOperadora, excluirHospital,
} from '../../services/configuracoes.service'
import HospitalFichaModal from './HospitalFichaModal'
import { invalidarPorEvento } from '../../lib/invalidation'
import { LoadingState, Modal, Spinner } from '../ui'

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

// Nome → key: mesma regra do AddHospitalForm de Configurações (minúsculas, só
// [a-z0-9_], truncado). Mantida idêntica para os dois caminhos gerarem a mesma
// key para o mesmo nome, em vez de criar duplicata por divergência de slug.
function paraKey(nome: string): string {
  return nome.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)
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
  const [addHospEm, setAddHospEm] = useState<string | null>(null)
  // Hospital aberto na ficha (editar/excluir), junto da operadora de contexto.
  const [fichaHosp, setFichaHosp] = useState<{ hosp: { key: string; nome: string }; opNome: string } | null>(null)
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
  const porOperadora = useMemo(() => {
    const mapa = new Map<string, { key: string; nome: string }[]>()
    for (const h of hospitais ?? []) {
      const ops = h.operadoras?.length ? h.operadoras : [h.operadora_key || '—']
      for (const k of ops) {
        const lista = mapa.get(k) ?? []
        lista.push({ key: h.key, nome: h.nome })
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
        <button className="btn btn-primary btn-sm" onClick={() => setAddOp(true)} style={{ flexShrink: 0 }}>
          {IconPlus}
          Nova operadora
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {operadoras.length === 0 && (
          <div className="empty-state" style={{ padding: '32px 16px' }}>
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
        {operadoras.map((op) => {
          const hosp = hospitaisDe(op.key)
          const totalHosp = (porOperadora.get(op.key) ?? []).length
          // Busca ativa abre os grupos: o resultado esta la dentro.
          const expandida = aberta === op.key || (!!q && hosp.length > 0)
          return (
            <div key={op.key} style={{ borderBottom: '1px solid var(--border)' }}>
              <div
                onClick={() => setAberta(expandida ? null : op.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer', background: expandida ? 'var(--surface-2)' : 'transparent' }}
              >
                <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 'var(--t-md)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {op.nome}
                </span>
                <span style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {q && hosp.length !== totalHosp
                    ? `${hosp.length} de ${totalHosp}`
                    : `${totalHosp} ${totalHosp === 1 ? 'hospital' : 'hospitais'}`}
                </span>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={(e) => { e.stopPropagation(); setAddHospEm(op.key) }}
                  style={{ flexShrink: 0 }}
                >
                  {IconPlus}
                  Hospital
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={(e) => { e.stopPropagation(); setOpEdit({ key: op.key, nome: op.nome }) }}
                  title="Renomear ou excluir a operadora"
                  style={{ flexShrink: 0, padding: '5px 8px' }}
                >
                  {IconCog}
                </button>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ color: 'var(--muted)', flexShrink: 0, transform: expandida ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              {expandida && (
                // Lista densa em colunas: uma operadora tem ~100 hospitais, e uma
                // linha por item viraria uma rolagem interminável.
                <div style={{
                  padding: '4px 14px 12px', display: 'grid', gap: '2px 18px',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  maxHeight: 300, overflowY: 'auto',
                }}>
                  {hosp.length === 0 && (
                    <div style={{ color: 'var(--muted-2)', fontSize: 'var(--t-sm)', padding: '6px 0' }}>
                      Nenhum hospital nesta operadora ainda.
                    </div>
                  )}
                  {hosp.map((h) => (
                    <HospitalItem
                      key={h.key}
                      hosp={h}
                      confirmando={excluindo === h.key}
                      ocupado={apagando}
                      onEditar={() => setFichaHosp({ hosp: h, opNome: op.nome })}
                      onPedirExcluir={() => { setExcluindo(h.key); setErroExcluir(null) }}
                      onCancelar={() => { setExcluindo(null); setErroExcluir(null) }}
                      onConfirmar={() => removerHospital(h)}
                      erro={excluindo === h.key ? erroExcluir : null}
                    />
                  ))}
                </div>
              )}
            </div>
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
      {addHospEm && (
        <NovoHospitalModal
          opKey={addHospEm}
          // Lista COMPLETA (nao a filtrada pela busca): a operadora aberta pode
          // ter saido do filtro enquanto a modal esta no ar.
          opNome={(data?.operadoras ?? []).find((o) => o.key === addHospEm)?.nome ?? addHospEm}
          onClose={() => setAddHospEm(null)}
          onToast={onToast}
          onDone={() => { setAddHospEm(null); invalidar() }}
        />
      )}
      {fichaHosp && (
        <HospitalFichaModal
          hospital={fichaHosp.hosp}
          opNome={fichaHosp.opNome}
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
        <div>
          <label style={{
            display: 'block', marginBottom: 4, fontSize: 10, textTransform: 'uppercase',
            letterSpacing: '.1em', fontWeight: 600, color: 'var(--muted)',
          }}>
            Nome *
          </label>
          <input type="text" className="bm-input" value={nome}
            onChange={(e) => setNome(e.target.value)} autoFocus />
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
        <input type="text" className="bm-input" placeholder="Nome da operadora"
          value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
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

function NovoHospitalModal({ opKey, opNome, onClose, onToast, onDone }: {
  opKey: string; opNome: string; onClose: () => void; onToast: (m: string) => void; onDone: () => void
}) {
  const [nome, setNome] = useState('')
  const [saving, setSaving] = useState(false)

  async function criar() {
    const n = nome.trim()
    if (!n) { onToast('Informe o nome do hospital'); return }
    setSaving(true)
    try {
      const d = await criarHospital(n, opKey, paraKey(n))
      if (d.ok || (d as { criado?: boolean }).criado) { onToast('✓ Hospital adicionado'); onDone() }
      else onToast('Erro ao adicionar hospital')
    } catch (e) {
      onToast(`Erro: ${(e as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Novo hospital · ${opNome}`} onClose={onClose}>
      <div style={{ display: 'grid', gap: 10 }}>
        <input type="text" className="bm-input" placeholder="Nome do hospital"
          value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={criar} disabled={saving || !nome.trim()}>
            {saving ? 'Adicionando…' : 'Adicionar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
