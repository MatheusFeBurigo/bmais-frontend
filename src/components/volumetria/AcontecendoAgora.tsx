// Aba "Acontecendo agora" da Distribuição (29/10/2026): a operação da rede em
// linhas de gente — quem fez o quê, com qual paciente, em qual hospital —, para
// quem remaneja os hospitais decidir. Mesmo público da tela (coordenadores,
// gestor e admin); técnicos e operacionais não a veem.
//
// A fonte é a trilha de Movimentações, filtrada e reescrita pelo backend
// (application/atividade.py). Atualiza sozinha pelo polling (lib/autoRefresh).
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AtividadeGrupo, AtividadeItem } from '../../types/api'
import { useDebounce } from '../../hooks/useCid'
import { useAtividade } from '../../hooks/useVolumetria'
import { diaRelativo } from '../../lib/datas'
import { ROLE_LABEL } from '../../lib/usuarioRoles'
import { entidadeLabel, entidadeVariant } from '../logs/logs.model'
import { Badge, LoadingState } from '../ui'
import { iniciais, rotuloGrupo } from './volumetria.model'
import { atividadeStyles } from './volumetria.styles'

const GRUPOS: Array<{ key: AtividadeGrupo; label: string }> = [
  { key: 'tecnico', label: rotuloGrupo('coordenador_tecnico').plural },
  { key: 'administrativo', label: rotuloGrupo('coordenador_administrativo').plural },
  { key: 'todos', label: 'Todos' },
]

/** Data local (YYYY-MM-DD) de um timestamp: o dia do calendário de quem olha. */
function diaLocal(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** "agora", "há 12 min" na primeira hora; depois, a hora do dia. */
function hora(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const min = Math.round((Date.now() - d.getTime()) / 60_000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// Os remanejos são gravados como ação sobre a pessoa ("usuario"): aqui são da
// Distribuição, não de conta de acesso.
function rotuloTipo(tipo: string): string {
  return tipo === 'usuario' ? 'Distribuição' : entidadeLabel(tipo)
}

/** Uma ação. Exportada para a réplica da Ajuda mostrar a linha real. */
export function Linha({ item }: { item: AtividadeItem }) {
  return (
    <div className="at-item">
      <span className="vol-av" aria-hidden="true">{iniciais(item.quem)}</span>
      <div style={{ minWidth: 0 }}>
        <div className="at-quem">
          {item.quem}{item.papel && <span> · {ROLE_LABEL[item.papel] ?? item.papel}</span>}
        </div>
        <div className="at-texto">{item.texto}</div>
        <div className="at-meta">
          <Badge variant={item.tipo === 'usuario' ? 'muted' : entidadeVariant(item.tipo)}>{rotuloTipo(item.tipo)}</Badge>
          {item.internacao_id != null && (
            <Link to={`/paciente/${item.internacao_id}`}>Abrir paciente</Link>
          )}
        </div>
      </div>
      <span className="at-hora" title={item.quando ? new Date(item.quando).toLocaleString('pt-BR') : undefined}>
        {hora(item.quando)}
      </span>
    </div>
  )
}

export default function AcontecendoAgora({ pessoas }: {
  /** Quem dá para filtrar: as pessoas dos grupos que o painel trouxe. */
  pessoas: Array<{ user_id: string; nome: string }>
}) {
  // Sem grupo escolhido, o backend abre no do coordenador (gestor e admin, em todos).
  const [grupo, setGrupo] = useState<AtividadeGrupo | undefined>(undefined)
  const [usuario, setUsuario] = useState('')
  const [busca, setBusca] = useState('')
  const q = useDebounce(busca.trim(), 300)
  const filtros = useMemo(() => ({
    ...(grupo ? { grupo } : {}), ...(usuario ? { usuario } : {}), ...(q ? { q } : {}),
  }), [grupo, usuario, q])
  const consulta = useAtividade(filtros, true)

  const grupoEfetivo = grupo ?? consulta.data?.pages[0]?.grupo
  const itens = useMemo(() => (consulta.data?.pages ?? []).flatMap((p) => p.itens), [consulta.data])
  // Uma pessoa pode aparecer nos dois grupos do admin: uma opção por pessoa.
  const opcoes = useMemo(() => [...new Map(pessoas.map((p) => [p.user_id, p])).values()]
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')), [pessoas])

  const porDia = useMemo(() => {
    const dias: Array<{ dia: string; itens: AtividadeItem[] }> = []
    for (const it of itens) {
      const dia = it.quando ? diaLocal(it.quando) : ''
      const ultimo = dias.at(-1)
      if (ultimo && ultimo.dia === dia) ultimo.itens.push(it)
      else dias.push({ dia, itens: [it] })
    }
    return dias
  }, [itens])

  return (
    <div className="card">
      <style>{atividadeStyles}</style>
      <div className="card-header">
        <div>
          <div className="card-title">Acontecendo agora</div>
          <p className="card-sub">
            O que a equipe está fazendo na rede inteira: relatórios, visitas, altas, censos, cobranças e remanejos.
          </p>
        </div>
      </div>
      <div className="card-body">
        <div className="at-barra">
          <div className="vol-seg" role="tablist" aria-label="Quem agiu">
            {GRUPOS.map((g) => (
              <button type="button" role="tab" key={g.key} aria-selected={grupoEfetivo === g.key}
                className={grupoEfetivo === g.key ? 'active' : ''} onClick={() => setGrupo(g.key)}>
                {g.label}
              </button>
            ))}
          </div>
          <select className="bm-input bm-select" value={usuario} aria-label="Pessoa"
            onChange={(e) => setUsuario(e.target.value)}>
            <option value="">Todas as pessoas</option>
            {opcoes.map((p) => <option key={p.user_id} value={p.user_id}>{p.nome}</option>)}
          </select>
          <input className="bm-input at-busca" type="search" value={busca} placeholder="Buscar paciente ou hospital…"
            aria-label="Buscar" onChange={(e) => setBusca(e.target.value)} />
        </div>
        <p className="at-nota">Atualiza sozinho a cada 30 segundos.</p>

        {consulta.isLoading ? (
          <LoadingState style={{ minHeight: 160 }} />
        ) : consulta.isError ? (
          <div className="vol-vazio">Não foi possível carregar o que está acontecendo. Tente de novo em instantes.</div>
        ) : itens.length === 0 ? (
          <div className="vol-vazio">Nada por aqui com esses filtros.</div>
        ) : (
          <>
            {porDia.map(({ dia, itens: doDia }) => (
              <div key={dia || 'sem-data'}>
                <div className="at-dia">{dia ? diaRelativo(dia) : 'Sem data'}</div>
                {doDia.map((it) => <Linha key={it.id} item={it} />)}
              </div>
            ))}
            {consulta.hasNextPage && (
              <div className="at-mais">
                <button type="button" className="btn btn-outline btn-sm" disabled={consulta.isFetchingNextPage}
                  onClick={() => void consulta.fetchNextPage()}>
                  {consulta.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
