import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import type { Profissional, ProfTipo } from '../types/api'
import { usePageHeader } from '../components/PageHeader'
import { LoadingState, Modal } from '../components/ui'
import Toast from '../components/Toast'
import UsuariosAcesso from '../components/UsuariosAcesso'
import CadastroMalha from '../components/equipe/CadastroMalha'
import { useAuth } from '../auth/AuthContext'
import { podeGerirOperacoes } from '../auth/permissions'
import { useEquipe, useProfissional } from '../hooks/useEquipe'
import { queryKeys } from '../lib/queryKeys'
import { invalidarPorEvento } from '../lib/invalidation'
import { localStyles, isAtivo } from '../components/equipe/equipe.styles'
import { IconPlus } from '../components/equipe/icons'
import ProfTabela from '../components/equipe/ProfTabela'
import DetalheProf from '../components/equipe/DetalheProf'
import AddProfModal from '../components/equipe/AddProfModal'
import ResetSenhaModal from '../components/equipe/ResetSenhaModal'
import { definirAtivoProfissional, excluirProfissional } from '../services/equipe.service'
import { ConfirmarModal } from '../components/ConfirmarModal'

// HIERARQUIA VISUAL — o que esta tela deliberadamente NAO faz:
// antes havia duas fileiras de pilulas identicas empilhadas (as secoes e o
// filtro de tipo), entao nada dizia o que era navegacao e o que era filtro.
// Agora sao tres niveis com desenhos distintos:
//   1. secao  -> abas sublinhadas no topo (.ops-nav)
//   2. filtro -> controle segmentado unico, na barra da lista (.ops-seg)
//   3. busca  -> campo de texto, que e o que resolve lista grande de verdade
type Aba = 'profissionais' | 'usuarios' | 'malha'

const IconSearch = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
)

export default function Equipe() {
  const qc = useQueryClient()
  const { role } = useAuth()
  // Admin e analista interno veem a tela completa; a restrição do analista (contas
  // de administrador) é por linha, em UsuariosAcesso e UsuarioForm.
  const gestor = podeGerirOperacoes(role)
  //
  // Aba e filtro de tipo vivem na URL: editar um usuário abre outra página
  // (/usuarios/:id) e, na volta, a tela tem de reabrir onde a pessoa estava.
  const [params, setParams] = useSearchParams()
  const abaPadrao: Aba = gestor ? 'profissionais' : 'malha'
  const abaUrl = params.get('aba') as Aba | null
  const aba: Aba = gestor && abaUrl && ['profissionais', 'usuarios', 'malha'].includes(abaUrl) ? abaUrl : abaPadrao
  const tipoUrl = params.get('tipo')
  const tipoFiltro: 'todos' | ProfTipo = tipoUrl === 'E' || tipoUrl === 'M' ? tipoUrl : 'todos'

  function mudarParam(chave: string, valor: string | null) {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (valor == null) next.delete(chave)
      else next.set(chave, valor)
      return next
    }, { replace: true })
  }
  // Trocar de aba limpa os filtros da aba anterior (tipo, nível).
  const setAba = (a: Aba) => setParams(a === abaPadrao ? {} : { aba: a }, { replace: true })
  const setTipoFiltro = (t: 'todos' | ProfTipo) => mudarParam('tipo', t === 'todos' ? null : t)
  const [busca, setBusca] = useState('')
  const [showInativos, setShowInativos] = useState(false)
  const [selId, setSelId] = useState<number | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  // Atalho "Senha" da linha: a mesma modal de Usuários de acesso. Sem conta
  // não há senha a redefinir: ela explica e leva à ficha (e-mail + senha inicial).
  const [senhaAlvo, setSenhaAlvo] = useState<Profissional | null>(null)
  // Ações do menu "⋮" da linha, cada uma com a sua confirmação.
  const [ativoAlvo, setAtivoAlvo] = useState<Profissional | null>(null)
  const [excluirAlvo, setExcluirAlvo] = useState<Profissional | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [erroAcao, setErroAcao] = useState<string | null>(null)

  const { data, isLoading, isError } = useEquipe()
  const { data: detalhe } = useProfissional(selId)

  const enfermeiros = useMemo(() => data?.enfermeiros ?? [], [data])
  const medicos = useMemo(() => data?.medicos ?? [], [data])
  const total = enfermeiros.length + medicos.length
  const totalAtivos = [...enfermeiros, ...medicos].filter(isAtivo).length
  const totalInativos = total - totalAtivos

  // Lista final: tipo -> inativos -> busca por nome.
  const visiveis = useMemo<Profissional[]>(() => {
    const q = busca.trim().toLowerCase()
    return [...enfermeiros, ...medicos].filter((p) => {
      if (tipoFiltro !== 'todos' && p.tipo !== tipoFiltro) return false
      if (!isAtivo(p) && !showInativos) return false
      if (q && !p.nome.toLowerCase().includes(q)) return false
      return true
    })
  }, [enfermeiros, medicos, tipoFiltro, showInativos, busca])

  function invalidar() {
    invalidarPorEvento(qc, 'equipeAlterada')
    // Detalhe do profissional selecionado é granular por id — invalida à parte.
    if (selId != null) qc.invalidateQueries({ queryKey: queryKeys.profissional(selId) })
  }

  function abrirAcao(abrir: () => void) {
    setErroAcao(null)
    abrir()
  }

  async function confirmarAtivo() {
    if (!ativoAlvo) return
    const novo = !isAtivo(ativoAlvo)
    setOcupado(true)
    setErroAcao(null)
    try {
      await definirAtivoProfissional(ativoAlvo.id, novo)
      setToast(novo ? '✓ Acesso reativado' : 'Acesso desativado')
      invalidarPorEvento(qc, 'equipeAlterada')
      qc.invalidateQueries({ queryKey: queryKeys.profissional(ativoAlvo.id) })
      setAtivoAlvo(null)
    } catch (err) {
      setErroAcao((err as Error).message)
    } finally {
      setOcupado(false)
    }
  }

  async function confirmarExcluir() {
    if (!excluirAlvo) return
    const alvo = excluirAlvo
    setOcupado(true)
    setErroAcao(null)
    try {
      await excluirProfissional(alvo.id)
      // Some da lista na hora; o refetch confirma. A conta de login dele também
      // saiu, então a lista de usuários de acesso é recarregada junto.
      qc.setQueryData<typeof data>(queryKeys.equipe(), (atual) => atual && {
        ...atual,
        enfermeiros: atual.enfermeiros.filter((p) => p.id !== alvo.id),
        medicos: atual.medicos.filter((p) => p.id !== alvo.id),
      })
      invalidarPorEvento(qc, 'equipeAlterada')
      invalidarPorEvento(qc, 'usuariosAlterados')
      if (selId === alvo.id) setSelId(null)
      setToast(`Auditor ${alvo.nome} excluído`)
      setExcluirAlvo(null)
    } catch (err) {
      // O backend pode ter apagado a conta e recusado o resto: recarrega.
      invalidarPorEvento(qc, 'equipeAlterada')
      setErroAcao((err as Error).message)
    } finally {
      setOcupado(false)
    }
  }

  // Subtitulo por aba: cada secao resume a si mesma, em vez de a tela inteira
  // herdar a contagem de profissionais (que nada diz nas outras abas).
  const subtitle = aba === 'profissionais'
    ? 'Enfermeiros e médicos auditores da operação'
    : aba === 'malha'
      ? 'Operadoras e os hospitais que cada uma atende'
      : 'Contas de login e nível de acesso'

  usePageHeader({ title: 'Operações', subtitle })

  // Abas visíveis por papel: quem gere Operações vê as três.
  const abas: readonly (readonly [Aba, string, number | null])[] = gestor
    ? [
      ['profissionais', 'Auditores', total],
      ['usuarios', 'Usuários de acesso', null],
      ['malha', 'Hospitais e operadoras', null],
    ]
    : [['malha', 'Hospitais e operadoras', null]]

  return (
    <>
      <style>{localStyles}</style>

      {abas.length > 1 && (
        <nav className="ops-nav">
          {abas.map(([a, lbl, count]) => (
            <button
              key={a}
              type="button"
              className={`ops-nav-btn${aba === a ? ' active' : ''}`}
              onClick={() => setAba(a)}
            >
              {lbl}
              {count != null && count > 0 && <span className="ops-nav-count">{count}</span>}
            </button>
          ))}
        </nav>
      )}

      {/* Malha de atendimento: não depende do payload de equipe, então fica fora
          do gate de isLoading/isError abaixo (senão o analista, que só usa esta
          aba, ficaria preso a um carregamento que não é dele). */}
      {aba === 'malha' && <CadastroMalha onToast={setToast} />}

      {aba === 'usuarios' && <UsuariosAcesso />}

      {aba === 'profissionais' && isLoading && <LoadingState label="Carregando equipe…" />}
      {aba === 'profissionais' && isError && <div className="empty-state t-danger">Erro ao carregar a equipe.</div>}

      {aba === 'profissionais' && data && (
        <>
          <div className="ops-toolbar">
            <div className="ops-search">
              {IconSearch}
              <input
                className="bm-input"
                placeholder="Buscar auditor…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            {/* Filtro por tipo. Categoria sem ninguem fica desabilitada: a
                contagem ja informa que esta vazia, e clicar so levaria ao vazio. */}
            <div className="ops-seg" role="group" aria-label="Filtrar por tipo">
              {([
                ['todos', 'Todos', total],
                ['E', 'Enfermeiros', enfermeiros.length],
                ['M', 'Médicos', medicos.length],
              ] as const).map(([t, lbl, n]) => (
                <button
                  key={t}
                  type="button"
                  className={`ops-seg-btn${tipoFiltro === t ? ' active' : ''}`}
                  onClick={() => setTipoFiltro(t)}
                  disabled={n === 0 && t !== 'todos'}
                  title={n === 0 && t !== 'todos' ? `Nenhum registro em ${lbl}` : undefined}
                >
                  {lbl} <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.65 }}>{n}</span>
                </button>
              ))}
            </div>

            <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)} style={{ flexShrink: 0 }}>
              {IconPlus}
              Adicionar
            </button>
          </div>

          {/* Resumo enxuto: os KPIs em caixa ocupavam meia tela para dizer "0" e
              "2". A mesma informacao cabe numa linha, e o toggle de inativos vive
              ao lado dela — e sobre o mesmo conjunto. */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, padding: '0 2px 10px', flexWrap: 'wrap',
          }}>
            <div className="ops-resumo">
              <b>{totalAtivos}</b> ativos
              {totalInativos > 0 && (
                <>
                  <span className="ops-resumo-sep">·</span>
                  <b>{totalInativos}</b> inativos
                </>
              )}
              {visiveis.length !== total && (
                <>
                  <span className="ops-resumo-sep">·</span>
                  {visiveis.length} exibidos
                </>
              )}
            </div>
            {totalInativos > 0 && (
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer',
                fontSize: 'var(--t-sm)', color: 'var(--muted)', userSelect: 'none',
              }}>
                <input
                  type="checkbox"
                  checked={showInativos}
                  onChange={(e) => setShowInativos(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', width: 14, height: 14 }}
                />
                Mostrar desativados
              </label>
            )}
          </div>

          <ProfTabela
            lista={visiveis}
            onAbrir={(p) => setSelId(p.id)}
            acoes={gestor ? {
              onEditar: (p) => setSelId(p.id),
              onSenha: setSenhaAlvo,
              onAtivo: (p) => abrirAcao(() => setAtivoAlvo(p)),
              onExcluir: (p) => abrirAcao(() => setExcluirAlvo(p)),
            } : undefined}
            vazio={busca.trim() ? `Nenhum auditor corresponde a “${busca.trim()}”.` : 'Nenhum auditor cadastrado.'}
          />
        </>
      )}

      {/* Detalhe/edição do profissional numa modal (abre ao clicar no nome). */}
      {selId != null && detalhe && (
        <Modal title="Detalhes do auditor" onClose={() => setSelId(null)}>
          <DetalheProf
            key={detalhe.profissional.id}
            detalhe={detalhe}
            opsLista={data?.ops_lista ?? []}
            onToast={setToast}
            onChanged={invalidar}
          />
        </Modal>
      )}

      {addOpen && (
        <AddProfModal
          opsLista={data?.ops_lista ?? []}
          onClose={() => setAddOpen(false)}
          onDone={(msg) => { setAddOpen(false); setToast(msg); invalidar() }}
          onError={setToast}
        />
      )}
      {senhaAlvo && (
        <ResetSenhaModal
          userId={senhaAlvo.acesso_user_id ?? null}
          email={senhaAlvo.acesso_email ?? null}
          nome={senhaAlvo.nome}
          onInformarEmail={() => { setSelId(senhaAlvo.id); setSenhaAlvo(null) }}
          onClose={() => setSenhaAlvo(null)}
          onDone={(msg) => { setSenhaAlvo(null); setToast(msg) }}
          onError={setToast}
        />
      )}
      {ativoAlvo && (
        <ConfirmarModal
          titulo={isAtivo(ativoAlvo) ? 'Desativar acesso' : 'Reativar acesso'}
          confirmar={isAtivo(ativoAlvo) ? 'Desativar acesso' : 'Reativar acesso'}
          perigo={isAtivo(ativoAlvo)}
          ocupado={ocupado}
          onConfirmar={confirmarAtivo}
          onCancelar={() => setAtivoAlvo(null)}
        >
          {isAtivo(ativoAlvo) ? (
            <>
              <p style={{ margin: 0 }}><strong>{ativoAlvo.nome}</strong> sai das listas de escala e{ativoAlvo.tem_acesso ? ' deixa de entrar na plataforma a partir de agora' : ' não pode receber novos hospitais'}.</p>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 'var(--t-sm)' }}>O cadastro e o histórico ficam guardados. Dá para reativar depois pelo mesmo menu.</p>
            </>
          ) : (
            <p style={{ margin: 0 }}><strong>{ativoAlvo.nome}</strong> volta a aparecer na equipe{ativoAlvo.tem_acesso ? ' e a entrar na plataforma com a senha atual' : ''}.</p>
          )}
          {erroAcao && <p className="uac-erro" role="alert">{erroAcao}</p>}
        </ConfirmarModal>
      )}
      {excluirAlvo && (
        <ConfirmarModal
          titulo="Excluir auditor"
          confirmar="Excluir definitivamente"
          perigo
          ocupado={ocupado}
          onConfirmar={confirmarExcluir}
          onCancelar={() => setExcluirAlvo(null)}
        >
          <p style={{ margin: 0 }}>Excluir <strong>{excluirAlvo.nome}</strong>? Esta ação é <strong>irreversível</strong>.</p>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 'var(--t-sm)' }}>
            Sai o cadastro{excluirAlvo.tem_acesso ? ', a escala de hospitais e a conta de login' : ' e a escala de hospitais'}.
            Relatórios e visitas já registrados com o nome dele continuam no histórico.
            Para só tirar o acesso, use Desativar acesso.
          </p>
          {erroAcao && <p className="uac-erro" role="alert">{erroAcao}</p>}
        </ConfirmarModal>
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  )
}
