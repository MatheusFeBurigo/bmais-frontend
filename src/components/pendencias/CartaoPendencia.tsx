// O card de uma pendência, sem dados nem gravação: recebe a pendência e as
// ações. CardPendencia o liga aos hooks; a réplica da Ajuda usa este mesmo card
// com dados fictícios (exemplosPendencias), como faz com o KanbanCard.
//
// Diz sempre COM QUEM a pendência está e quem a pediu (27/10/2026: "aba de
// pendências deve dizer com quem está a pendência"), com "você" no lugar do
// nome de quem está olhando. As ações aparecem conforme o backend diz que quem
// olha pode (`pode_*`) e conforme a situação (0059):
//   pendente   → "Aguardando" (já agiu, espera algo de fora) e "Concluir";
//   aguardando → "Voltar para pendente" e "Concluir";
//   resolvida  → "Reabrir" (concluída por engano, ou o problema voltou).
import { dataBR, dataHora, ehHoje } from '../../lib/datas'
import type { MovimentoPendencia } from '../../services/pendencias.service'
import type { Pendencia } from '../../types/api'
import { Spinner } from '../ui'

function Prazo({ p }: { p: Pendencia }) {
  // Resolvida não tem prazo a cumprir: a tag só confundiria.
  if (!p.prazo || p.situacao === 'resolvida') return null
  if (p.vencida) return <span className="pd-tag pd-tag-vencida">Venceu {dataBR(p.prazo).slice(0, 5)}</span>
  if (ehHoje(p.prazo)) return <span className="pd-tag pd-tag-hoje">Vence hoje</span>
  return <span className="pd-tag pd-tag-prazo">Prazo {dataBR(p.prazo).slice(0, 5)}</span>
}

/** "dd/mm" no fuso de quem olha, de um timestamp do banco. */
const diaMes = (iso: string | null | undefined) => dataHora(iso).slice(0, 5)

/** Com quem está e quem pediu, com "você" para quem olha. Quem pede para si
 *  mesmo chega como `recebida`: o mesmo nome nos dois lados também é você. */
function envolvidos(p: Pendencia): { com: string; por: string | null } {
  const recebi = p.relacao === 'recebida'
  const mesmaPessoa = !!p.responsavel_nome && p.responsavel_nome === p.criado_por_nome
  return {
    com: recebi ? 'você' : (p.responsavel_nome || 'quem recebeu'),
    por: p.relacao === 'pedida' || (recebi && mesmaPessoa) ? 'você' : (p.criado_por_nome ?? null),
  }
}

export function CartaoPendencia({ p, ocupado, concluindo, movendo, erro, onConcluir, onMover, onExcluir }: {
  p: Pendencia
  /** Alguma ação desta pendência está gravando: os botões ficam desligados. */
  ocupado?: boolean
  concluindo?: boolean
  movendo?: boolean
  erro?: string | null
  onConcluir: () => void
  onMover: (para: MovimentoPendencia) => void
  /** Quem chama pede a confirmação antes de excluir. */
  onExcluir: () => void
}) {
  const situacao = p.situacao ?? 'pendente'
  const { com, por } = envolvidos(p)
  const temAcao = p.pode_concluir || p.pode_excluir || p.pode_mover || p.pode_reabrir
  return (
    <article className={`pd-card pd-${situacao}${p.vencida ? ' pd-vencida' : ''}`}>
      <div className="pd-titulo">{p.titulo}</div>
      {p.paciente && <div className="pd-meta"><span>Paciente: {p.paciente}</span></div>}
      {p.descricao && <div className="pd-desc">{p.descricao}</div>}
      <div className="pd-meta">
        <span className="pd-com">{situacao === 'resolvida' ? 'Estava com' : 'Está com'} <strong>{com}</strong></span>
        {por && <span>· Pedida por {por}</span>}
        <Prazo p={p} />
      </div>
      {situacao === 'aguardando' && p.aguardando_em && (
        <div className="pd-meta"><span>Aguardando retorno desde {diaMes(p.aguardando_em)}</span></div>
      )}
      {situacao === 'resolvida' && p.concluida_em && (
        <div className="pd-meta">
          <span>Resolvida em {diaMes(p.concluida_em)}{p.concluida_por_nome ? ` por ${p.concluida_por_nome}` : ''}</span>
        </div>
      )}
      {temAcao && (
        <div className="pd-acoes">
          {erro && <span className="t-danger pd-erro" role="alert">{erro}</span>}
          {p.pode_excluir && (
            <button type="button" className="btn btn-ghost btn-sm pd-excluir" disabled={ocupado} onClick={onExcluir}>
              Excluir
            </button>
          )}
          {p.pode_mover && situacao === 'pendente' && (
            <button type="button" className="btn btn-outline btn-sm pd-aguardar" disabled={ocupado}
                    title="Você já agiu e está esperando um retorno"
                    onClick={() => onMover('aguardando')}>
              {movendo && <Spinner size={12} />}
              Aguardando
            </button>
          )}
          {p.pode_mover && situacao === 'aguardando' && (
            <button type="button" className="btn btn-ghost btn-sm pd-voltar" disabled={ocupado}
                    onClick={() => onMover('pendente')}>
              {movendo && <Spinner size={12} />}
              Voltar para pendente
            </button>
          )}
          {p.pode_reabrir && (
            <button type="button" className="btn btn-outline btn-sm pd-reabrir" disabled={ocupado}
                    onClick={() => onMover('reabrir')}>
              {movendo && <Spinner size={12} />}
              Reabrir
            </button>
          )}
          {p.pode_concluir && (
            <button type="button" className="btn btn-outline btn-sm pd-concluir" disabled={ocupado} onClick={onConcluir}>
              {concluindo && <Spinner size={12} />}
              Concluir
            </button>
          )}
        </div>
      )}
    </article>
  )
}
