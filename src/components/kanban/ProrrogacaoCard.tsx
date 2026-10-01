// Card da coluna "Em prorrogação" do quadro de pacientes (0047).
//
// Pedido do usuário (01/10/2026): o paciente prorrogado fica numa coluna do
// quadro de pacientes, não numa aba à parte. O card diz até quando vai a
// prorrogação, em que acomodação, por quê e em que situação está; quem administra
// (admin e administrativo) pausa e retoma no próprio card. A coluna vem ordenada
// pelo backend: terminou sem alta, termina hoje, ativas, pausadas.
// Clicar no card abre o painel lateral do paciente.
import { memo } from 'react'
import type { KanbanTarefa, SituacaoProrrogacao } from '../../types/api'
import { OpAvatar, Spinner } from '../ui'
import { usePausarProrrogacao } from '../../hooks/useKanban'
import { dataBR } from '../../lib/datas'
import { nomeProprio } from '../../lib/texto'

const SITUACAO: Record<SituacaoProrrogacao, { texto: string; cls: string }> = {
  terminou: { texto: 'Terminou', cls: 'danger' },
  termina_hoje: { texto: 'Termina hoje', cls: 'warning' },
  ativa: { texto: 'Ativa', cls: 'success' },
  pausada: { texto: 'Pausada', cls: 'muted' },
}

export const ProrrogacaoCard = memo(function ProrrogacaoCard({
  tarefa: t, onAbrir, podeControlar, onAviso,
}: {
  tarefa: KanbanTarefa
  onAbrir: (t: KanbanTarefa) => void
  /** Admin e administrativo: pausar e retomar. */
  podeControlar: boolean
  onAviso: (msg: string) => void
}) {
  const pausar = usePausarProrrogacao()
  const sit = SITUACAO[t.prorrogacao_situacao ?? 'ativa']
  const resta = t.prorrogacao_dias_restantes
  const nome = nomeProprio(t.titulo) || t.titulo

  function alternar(e: React.MouseEvent) {
    e.stopPropagation()
    if (t.internacao_id == null || pausar.isPending) return
    const pausada = !t.prorrogacao_pausada
    pausar.mutate({ internacaoId: t.internacao_id, pausada }, {
      onSuccess: () => onAviso(`Prorrogação de ${nome} ${pausada ? 'pausada' : 'retomada'}`),
      onError: (err) => onAviso(`Erro: ${(err as Error).message}`),
    })
  }

  return (
    <article className="kb-card clicavel" onClick={() => onAbrir(t)}>
      <div className="kb-card-top">
        {t.operadora_key && <OpAvatar opKey={t.operadora_key} size={20} />}
        <span className="kb-card-nome">{nome}</span>
        <span className={`badge ${sit.cls}`}>{sit.texto}</span>
      </div>
      {t.hospital_nome && <div className="kb-card-meta"><span>{t.hospital_nome}</span></div>}

      <div className="ap-rel">
        <div className="ap-rel-linha">
          {t.prorrogacao_acomodacao || 'Acomodação não informada'}
        </div>
        <div style={{ fontSize: 'var(--t-sm)', color: 'var(--ink-2)' }}>
          {dataBR(t.prorrogacao_inicio)} a {dataBR(t.prorrogacao_ate)}
          {t.prorrogacao_situacao === 'ativa' && resta != null && resta > 0 && (
            <span className="t-muted"> · faltam {resta} {resta === 1 ? 'dia' : 'dias'}</span>
          )}
        </div>
        {t.prorrogacao_justificativa_desc && (
          <div className="ap-rel-texto" title={t.prorrogacao_justificativa_desc}>{t.prorrogacao_justificativa_desc}</div>
        )}
        {t.prorrogacao_pausada && t.prorrogacao_pausada_por && (
          <div className="ap-rel-autor t-muted">Pausada por {t.prorrogacao_pausada_por}</div>
        )}
      </div>

      {podeControlar && (
        <div className="ap-acoes">
          <button type="button" className="btn btn-outline btn-sm" disabled={pausar.isPending} onClick={alternar}>
            {pausar.isPending && <Spinner size={12} />}
            {t.prorrogacao_pausada ? 'Retomar' : 'Pausar'}
          </button>
        </div>
      )}
    </article>
  )
})
