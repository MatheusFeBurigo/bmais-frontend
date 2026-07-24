import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Profissional, ProfTipo } from '../types/api'
import { usePageHeader } from '../components/PageHeader'
import { KpiCard, LoadingState, Modal } from '../components/ui'
import Toast from '../components/Toast'
import UsuariosAcesso from '../components/UsuariosAcesso'
import { useEquipe, useProfissional } from '../hooks/useEquipe'
import { queryKeys } from '../lib/queryKeys'
import { invalidarPorEvento } from '../lib/invalidation'
import { localStyles, isAtivo } from '../components/equipe/equipe.styles'
import { IconPlus, IconEyeOff, IconUsers } from '../components/equipe/icons'
import ProfItem from '../components/equipe/ProfItem'
import DetalheProf from '../components/equipe/DetalheProf'
import AddProfModal from '../components/equipe/AddProfModal'

export default function Equipe() {
  const qc = useQueryClient()
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | ProfTipo>('todos')
  const [showInativos, setShowInativos] = useState(false)
  const [selId, setSelId] = useState<number | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const { data, isLoading } = useEquipe()
  const { data: detalhe } = useProfissional(selId)

  const todos = useMemo<Profissional[]>(() => {
    if (!data) return []
    return [...data.enfermeiros, ...data.medicos]
  }, [data])

  const totalInativos = todos.filter((p) => !isAtivo(p)).length

  function visiveisPorTipo(lista: Profissional[]): Profissional[] {
    return lista.filter((p) => {
      if (tipoFiltro !== 'todos' && p.tipo !== tipoFiltro) return false
      if (!isAtivo(p) && !showInativos) return false
      return true
    })
  }

  function invalidar() {
    invalidarPorEvento(qc, 'equipeAlterada')
    // Detalhe do profissional selecionado é granular por id — invalida à parte.
    if (selId != null) qc.invalidateQueries({ queryKey: queryKeys.profissional(selId) })
  }

  const enfermeirosMedicos = data ? visiveisPorTipo([...data.enfermeiros, ...data.medicos]) : []

  const subtitle = data
    ? `${data.total_prof} ativos${data.total_todos > data.total_prof ? ` · ${data.total_todos - data.total_prof} inativos` : ''} · clique em um nome para editar`
    : undefined

  usePageHeader({ title: 'Equipe B+ Auditoria', subtitle })

  return (
    <>
      <style>{localStyles}</style>

      {isLoading && <LoadingState label="Carregando equipe…" />}

      {data && (
        <>
          {/* KPIs */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)', marginBottom: 20 }}>
            <KpiCard variant="success" label="Enfermeiros" value={data.enfermeiros.filter(isAtivo).length}
              meta={`${data.enfermeiros.filter((p) => !isAtivo(p)).length > 0 ? `${data.enfermeiros.filter((p) => !isAtivo(p)).length} inativos · ` : ''}ativos no sistema`} />
            <KpiCard variant="info" label="Médicos Auditores" value={data.medicos.filter(isAtivo).length}
              meta={`${data.medicos.filter((p) => !isAtivo(p)).length > 0 ? `${data.medicos.filter((p) => !isAtivo(p)).length} inativos · ` : ''}ativos no sistema`} />
          </div>

          {/* Lista (largura total) — o detalhe/edição de um profissional abre numa
              modal ao clicar no nome (antes era um painel lateral fixo). */}
          <div>
            {/* Filtro por tipo */}
            <div className="tab-section">
              {([['todos', `Todos (${data.enfermeiros.length + data.medicos.length})`], ['E', `Enfermeiros (${data.enfermeiros.length})`], ['M', `Médicos Auditores (${data.medicos.length})`]] as const).map(([t, lbl]) => (
                <button key={t} className={`tab-sec-btn${tipoFiltro === t ? ' active' : ''}`} onClick={() => setTipoFiltro(t)}>{lbl}</button>
              ))}
            </div>

            {/* Toggle mostrar/ocultar inativos */}
            {totalInativos > 0 && (
              <div className="inativos-toggle" onClick={() => setShowInativos((v) => !v)}>
                {IconEyeOff}
                <span>{showInativos ? 'Ocultar desativados' : `Mostrar ${totalInativos} desativado${totalInativos > 1 ? 's' : ''}`}</span>
              </div>
            )}

            {/* Profissionais de Saúde */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div className="section-label" style={{ marginBottom: 0 }}>Profissionais de Saúde</div>
              <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}>
                {IconPlus}
                Adicionar
              </button>
            </div>
            {/* Bloco com scroll interno: limita a altura a ~6 itens (cada
                .prof-item ≈ 62px) para não empurrar o resto da página quando
                a lista é longa; abaixo disso o bloco encolhe naturalmente. */}
            <div className="prof-lista-scroll">
              {enfermeirosMedicos.map((p) => (
                <ProfItem key={p.id} p={p} active={selId === p.id} onClick={() => setSelId(p.id)} />
              ))}
              {enfermeirosMedicos.length === 0 && (
                <div className="empty-state" style={{ padding: '36px 16px' }}>
                  <div style={{ marginBottom: 8, opacity: 0.4, display: 'flex', justifyContent: 'center' }}><IconUsers /></div>
                  <div className="fw-6">Nenhum profissional cadastrado</div>
                  <div style={{ fontSize: 'var(--t-sm)', marginTop: 4 }}>Use o botão "+ Adicionar" para cadastrar.</div>
                </div>
              )}
            </div>
          </div>

          {/* Usuários de acesso (contas de login) — só admin vê */}
          <UsuariosAcesso />
        </>
      )}

      {/* Detalhe/edição do profissional numa modal (abre ao clicar no nome). */}
      {selId != null && detalhe && (
        <Modal title="Detalhes do profissional" onClose={() => setSelId(null)}>
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
          onClose={() => setAddOpen(false)}
          onDone={(msg) => { setAddOpen(false); setToast(msg); invalidar() }}
          onError={setToast}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  )
}
