// Tela de Movimentações (trilha de auditoria) — exclusiva do analista interno e
// do administrador. Registra o que se FEZ com os dados; o login fica de fora.
//
// Duas abas sobre o mesmo período:
//   - Movimentações: a trilha (quem fez o quê, quando), com filtros e detalhe por linha.
//   - Usuários: cada conta com sua atividade no período + controle total
//     (editar, senha, suspender/reativar, apagar).
// Página orquestradora fina: view-state em useLogsView; apresentação em
// components/logs/. O gating de rota/menu está em auth/permissions (EXCLUSIVAS.logs)
// e o backend exige o mesmo papel (requer_auditoria).
import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ehSomenteLeitura, podeVer, rotaFallback } from '../auth/permissions'
import { usePageHeader } from '../components/PageHeader'
import Tabs from '../components/Tabs'
import Toast from '../components/Toast'
import { Modal } from '../components/ui'
import ResetSenhaModal from '../components/equipe/ResetSenhaModal'
import ApagarUsuarioModal from '../components/equipe/ApagarUsuarioModal'
import KpisAuditoria from '../components/logs/KpisAuditoria'
import FiltrosAuditoria from '../components/logs/FiltrosAuditoria'
import TabelaAuditoria from '../components/logs/TabelaAuditoria'
import UsuariosPainel from '../components/logs/UsuariosPainel'
import { localStyles } from '../components/logs/logs.styles'
import { PERIODOS, nomeDoUsuario } from '../components/logs/logs.model'
import { useLogsView } from '../hooks/useLogsView'
import { useDefinirAtivoUsuario } from '../hooks/useAuditoria'
import type { AuditoriaUsuario } from '../types/api'

const IconRefresh = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></svg>
)

export default function Logs() {
  const { role, username } = useAuth()
  const navigate = useNavigate()
  const liberado = podeVer(role, 'logs') && role != null
  // Analista interno lê a trilha e a atividade das contas, mas não as gerencia:
  // editar/senha/suspender/apagar seguem exclusivos do administrador.
  const podeGerenciar = !ehSomenteLeitura(role)
  const v = useLogsView(liberado)
  const definirAtivo = useDefinirAtivoUsuario()

  const [toast, setToast] = useState<string | null>(null)
  const [resetAlvo, setResetAlvo] = useState<AuditoriaUsuario | null>(null)
  const [apagarAlvo, setApagarAlvo] = useState<AuditoriaUsuario | null>(null)
  const [suspenderAlvo, setSuspenderAlvo] = useState<AuditoriaUsuario | null>(null)
  const meuEmail = (username || '').trim().toLowerCase()

  const usuarios = v.resumo.data?.usuarios ?? []
  const totalTrilha = v.trilha.data?.total ?? 0
  const atualizando = v.trilha.isFetching || v.resumo.isFetching

  usePageHeader(
    useMemo(() => ({
      title: 'Movimentações',
      subtitle: podeGerenciar
        ? 'Quem fez o quê, quando, e controle das contas que geram as demandas'
        : 'Quem fez o quê, quando, e a atividade de cada conta',
      actions: (
        <button className="btn btn-outline btn-sm" onClick={v.refetchTudo} disabled={atualizando}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {IconRefresh}
          {atualizando ? 'Atualizando…' : 'Atualizar'}
        </button>
      ),
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [atualizando, podeGerenciar]),
  )

  if (!liberado) return <Navigate to={rotaFallback(role)} replace />

  async function suspender(u: AuditoriaUsuario, ativo: boolean) {
    if (!u.user_id) return
    try {
      await definirAtivo.mutateAsync({ userId: u.user_id, ativo })
      setToast(ativo ? `✓ ${nomeDoUsuario(u)} reativado` : `✓ ${nomeDoUsuario(u)} suspenso`)
    } catch (e) {
      setToast(`Erro: ${(e as Error).message}`)
    } finally {
      setSuspenderAlvo(null)
    }
  }

  const erroTrilha = v.trilha.isError ? (v.trilha.error as Error)?.message : null

  return (
    <>
      <style>{localStyles}</style>

      {/* Período: vale para as duas abas (KPIs, trilha e contagens por usuário). */}
      <div className="logs-toolbar">
        <Tabs
          tabs={[
            { key: 'atividade', label: 'Movimentações', count: totalTrilha },
            { key: 'usuarios', label: 'Usuários', count: usuarios.length },
          ]}
          active={v.aba}
          onChange={(k) => v.setAba(k as 'atividade' | 'usuarios')}
        />
        <div className="tab-section logs-periodos">
          {PERIODOS.map((p) => (
            <button key={p.key} type="button" className={`tab-sec-btn${v.periodo === p.key ? ' active' : ''}`}
              onClick={() => v.mudarPeriodo(p.key)}>{p.label}</button>
          ))}
        </div>
      </div>

      <KpisAuditoria totais={v.resumo.data?.totais} periodoLabel={v.periodoLabel} carregando={v.resumo.isLoading} />

      {erroTrilha && (
        <div className="card" style={{ padding: '12px 16px', marginBottom: 10, color: 'var(--danger)', fontSize: 'var(--t-sm)' }}>
          Não foi possível carregar as movimentações: {erroTrilha}
          {/relation|audit_logs|does not exist/i.test(erroTrilha) && (
            <div style={{ color: 'var(--muted)', marginTop: 4 }}>
              A tabela de auditoria ainda não existe no banco. Aplique a migration <span className="mono">0016_audit_logs.sql</span>.
            </div>
          )}
        </div>
      )}

      {v.aba === 'atividade' && (
        <>
          <FiltrosAuditoria
            value={v.filtros}
            opcoes={v.opcoes.data}
            usuarios={usuarios}
            onChange={v.setFiltro}
            onLimpar={v.limparFiltros}
          />
          <TabelaAuditoria
            itens={v.trilha.data?.itens ?? []}
            total={totalTrilha}
            pagina={v.pagina}
            limite={v.limite}
            carregando={v.trilha.isLoading}
            atualizando={v.trilha.isFetching && !v.trilha.isLoading}
            abertoId={v.abertoId}
            onToggle={v.toggleAberto}
            onPagina={v.setPagina}
            onFiltrarUsuario={(id) => v.setFiltro({ usuario: id })}
          />
        </>
      )}

      {v.aba === 'usuarios' && (
        <UsuariosPainel
          usuarios={usuarios}
          carregando={v.resumo.isLoading}
          meuEmail={meuEmail}
          ocupadoId={definirAtivo.isPending ? (definirAtivo.variables?.userId ?? null) : null}
          periodoLabel={v.periodoLabel}
          podeGerenciar={podeGerenciar}
          onVerAtividade={(u) => u.user_id && v.verAtividadeDe(u.user_id)}
          onEditar={(u) => navigate(`/usuarios/${u.user_id}`)}
          onSenha={setResetAlvo}
          onSuspender={setSuspenderAlvo}
          onReativar={(u) => suspender(u, true)}
          onApagar={setApagarAlvo}
        />
      )}

      {suspenderAlvo && (
        <Modal
          title="Suspender acesso"
          onClose={() => setSuspenderAlvo(null)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setSuspenderAlvo(null)} disabled={definirAtivo.isPending}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => suspender(suspenderAlvo, false)} disabled={definirAtivo.isPending}
                style={{ background: 'var(--warning)', borderColor: 'var(--warning)' }}>
                {definirAtivo.isPending ? 'Suspendendo…' : 'Suspender'}
              </button>
            </>
          }
        >
          <div style={{ fontSize: 'var(--t-base)', lineHeight: 1.5 }}>
            Suspender o acesso de <strong>{nomeDoUsuario(suspenderAlvo)}</strong>
            {suspenderAlvo.email && suspenderAlvo.nome ? <> (<span className="mono">{suspenderAlvo.email}</span>)</> : null}?
            <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: 'var(--t-sm)' }}>
              A conta continua existindo, mas toda chamada à plataforma passa a ser recusada a partir de agora.
              Você pode reativar quando quiser; o histórico de ações é mantido.
            </div>
          </div>
        </Modal>
      )}

      {resetAlvo && resetAlvo.user_id && (
        <ResetSenhaModal
          userId={resetAlvo.user_id}
          email={resetAlvo.email ?? null}
          onClose={() => setResetAlvo(null)}
          onDone={(msg) => { setResetAlvo(null); setToast(msg) }}
          onError={setToast}
        />
      )}
      {apagarAlvo && apagarAlvo.user_id && (
        <ApagarUsuarioModal
          usuario={{ user_id: apagarAlvo.user_id, email: apagarAlvo.email ?? null, nome: apagarAlvo.nome }}
          onClose={() => setApagarAlvo(null)}
          onDone={(msg) => { setApagarAlvo(null); setToast(msg); v.refetchTudo() }}
          onError={setToast}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  )
}
