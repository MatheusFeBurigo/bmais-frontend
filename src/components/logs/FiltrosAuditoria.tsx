// Barra de filtros das movimentações (apresentação pura): busca, usuário, tipo e ação.
import type { AuditoriaOpcoes, AuditoriaUsuario } from '../../types/api'
import { nomeDoUsuario } from './logs.model'

export interface FiltrosTrilha {
  usuario: string
  entidade: string
  acao: string
  q: string
}

const IconBusca = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
)

export default function FiltrosAuditoria({ value, opcoes, usuarios, onChange, onLimpar }: {
  value: FiltrosTrilha
  opcoes?: AuditoriaOpcoes
  usuarios: AuditoriaUsuario[]
  onChange: (patch: Partial<FiltrosTrilha>) => void
  onLimpar: () => void
}) {
  const temFiltro = Boolean(value.usuario || value.entidade || value.acao || value.q)
  // Ações do select acompanham o tipo escolhido (sem tipo, lista todas).
  const acoes = (opcoes?.acoes ?? []).filter((a) => !value.entidade || a.entidade === value.entidade)
  // Só contas com id (as removidas ainda podem ser filtradas: têm user_id na trilha).
  const contas = usuarios.filter((u) => u.user_id)

  return (
    <div className="logs-filtros">
      <div className="logs-busca">
        {IconBusca}
        <input
          className="bm-input"
          placeholder="Buscar por paciente, arquivo, e-mail, hospital…"
          value={value.q}
          onChange={(e) => onChange({ q: e.target.value })}
          aria-label="Buscar nas movimentações"
        />
      </div>
      <select className="bm-input bm-select" value={value.usuario} onChange={(e) => onChange({ usuario: e.target.value })} aria-label="Usuário">
        <option value="">Todos os usuários</option>
        {contas.map((u) => (
          <option key={u.user_id} value={u.user_id}>
            {nomeDoUsuario(u)}{u.existe ? '' : ' (removido)'}
          </option>
        ))}
      </select>
      <select className="bm-input bm-select" value={value.entidade}
        onChange={(e) => onChange({ entidade: e.target.value, acao: '' })} aria-label="Tipo">
        <option value="">Todos os tipos</option>
        {(opcoes?.entidades ?? []).map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
      </select>
      <select className="bm-input bm-select" value={value.acao} onChange={(e) => onChange({ acao: e.target.value })} aria-label="Ação">
        <option value="">Todas as ações</option>
        {acoes.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
      </select>
      <button type="button" className="btn btn-ghost btn-sm logs-limpar" onClick={onLimpar} disabled={!temFiltro}>
        Limpar
      </button>
    </div>
  )
}
