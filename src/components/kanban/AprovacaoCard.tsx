// Card das colunas de aprovação do quadro de pacientes: UM relatório que o
// operacional enviou.
//
// Só o que tria o card (13/10/2026): quem é o paciente, onde está, quando foi a
// visita, quem enviou e se o relatório pede prorrogação. Ler o relatório e
// decidir (aprovar ou editar) acontece na ficha do paciente, para onde o clique
// leva com o relatório aberto (`onAbrir`). O quadro não aprova.
import { memo } from 'react'
import type { KanbanTarefa } from '../../types/api'
import { OpAvatar } from '../ui'
import { nomeDePessoa, nomeProprio } from '../../lib/texto'
import { dataBR, diariasNoPeriodo } from '../../lib/datas'
import { etiquetaProrrogacao } from '../../lib/prorrogacao'

export const AprovacaoCard = memo(function AprovacaoCard({ tarefa: t, onAbrir, onPrefetch }: {
  tarefa: KanbanTarefa
  /** Leva à análise: a ficha do paciente com o relatório aberto. */
  onAbrir: (t: KanbanTarefa) => void
  onPrefetch: (id: number) => void
}) {
  const rel = t.relatorio!
  const nome = nomeProprio(t.titulo) || t.titulo
  // O paciente já está prorrogado (pedido aprovado antes deste relatório).
  const prorrogado = etiquetaProrrogacao(t.prorrogacao_ate, t.prorrogacao_pausada)
  // O que ESTE relatório pede, no total dos períodos.
  const diariasPedidas = rel.prorrogacao?.periodos
    .reduce((s, x) => s + diariasNoPeriodo(x.data_inicio, x.data_fim), 0) ?? 0
  const prefetch = t.internacao_id != null
    ? () => onPrefetch(t.internacao_id as number)
    : undefined

  return (
    <article className="kb-card clicavel" onClick={() => onAbrir(t)}
             onMouseEnter={prefetch} onFocus={prefetch}>
      <div className="kb-card-top">
        {t.operadora_key && <OpAvatar opKey={t.operadora_key} size={20} />}
        <span className="kb-card-nome">{nome}</span>
      </div>
      {t.hospital_nome && <div className="kb-card-meta"><span>{t.hospital_nome}</span></div>}
      <div className="kb-card-meta"><span>Visita {dataBR(rel.data_visita) || '—'}</span></div>
      {rel.autor && (
        <div className="kb-card-meta"><span>Enviado por {nomeDePessoa(rel.autor_nome, rel.autor)}</span></div>
      )}
      {(rel.prorrogacao || prorrogado || rel.tem_anexo) && (
        <div className="kb-tags">
          {rel.prorrogacao && (
            <span className="kb-tag" style={{ color: 'var(--info)', background: 'var(--info-bg)' }}>
              Prorrogação {diariasPedidas} {diariasPedidas === 1 ? 'diária' : 'diárias'}
            </span>
          )}
          {prorrogado && (
            <span className="kb-tag" title={prorrogado.titulo} style={prorrogado.pausada
              ? { color: 'var(--muted)', background: 'var(--surface-3)' }
              : { color: 'var(--caution)', background: 'var(--caution-bg)' }}>
              {prorrogado.texto}
            </span>
          )}
          {rel.tem_anexo && (
            <span className="kb-tag" title={rel.anexo_nome ?? undefined}
                  style={{ color: 'var(--muted)', background: 'var(--surface-3)' }}>
              Com documento
            </span>
          )}
        </div>
      )}
    </article>
  )
})
