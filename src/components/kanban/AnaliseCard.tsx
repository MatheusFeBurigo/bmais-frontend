// Card da coluna "Analise tecnica" (board do tecnico interno).
// Extraido de pages/Kanban.tsx (god component): apresentacao pura.
import type { KanbanTarefa } from '../../types/api'
import { OpAvatar } from '../ui'
import { labelCurto } from '../../lib/datas'

// ── Card de análise técnica (board do técnico) ────────────────────────────────
// Um card por relatório do auditor externo a analisar. Clica para abrir a modal de
// parecer (comentário + aprovar/rejeitar → gera o 2º relatório, do técnico interno).
export function AnaliseCard({ tarefa, onAbrir }: { tarefa: KanbanTarefa; onAbrir: () => void }) {
  const rel = tarefa.relatorio_externo
  return (
    <article className="kb-card clicavel" onClick={onAbrir}>
      {/* Selo de status: comunica de cara que este card aguarda uma ação do técnico. */}
      <span className="kb-at-status">
        <span className="kb-at-dot" aria-hidden />
        Aguardando parecer
      </span>

      {/* Hospital (identificação principal do card). */}
      <div className="kb-card-top" style={{ marginTop: 9 }}>
        {tarefa.operadora_key && (
          <span title={tarefa.hospital_nome ?? undefined}>
            <OpAvatar opKey={tarefa.operadora_key} size={20} />
          </span>
        )}
        <span className="kb-card-nome">{tarefa.hospital_nome || tarefa.titulo}</span>
      </div>

      {/* Metadados do relatório do auditor, rotulados para leitura rápida. */}
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div className="kb-at-linha">
          <span className="kb-at-linha-lbl">Auditor</span>
          <span className="kb-at-linha-val">{rel?.medico || 'não informado'}</span>
        </div>
        <div className="kb-at-linha">
          <span className="kb-at-linha-lbl">Data</span>
          <span className="kb-at-linha-val">{labelCurto(rel?.data_visita) || 'sem data'}</span>
        </div>
      </div>

      {/* Trecho do relatório do auditor — o que o técnico vai avaliar. */}
      <div className="kb-at-relbox">
        <div className="kb-at-relbox-lbl">Relatório do auditor</div>
        {rel?.descricao
          ? <div className="kb-analise-preview">{rel.descricao}</div>
          : <div className="kb-at-relbox-vazio">Sem texto. Baixe o documento anexado ao abrir o card.</div>}
      </div>

      {/* Ação explícita: não deixa dúvida do que fazer com o card. */}
      <div className="kb-at-cta">
        <span className="kb-at-cta-txt">Abrir e dar parecer</span>
        <span className="kb-at-cta-icon" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </div>
    </article>
  )
}
