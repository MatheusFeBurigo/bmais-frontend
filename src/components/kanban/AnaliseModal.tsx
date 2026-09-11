// Modal de analise tecnica: le o relatorio externo e grava o parecer interno.
// Extraido de pages/Kanban.tsx (god component).
import { useEffect, useState } from 'react'
import type { KanbanTarefa } from '../../types/api'
import { useConcluirAnalise } from '../../hooks/useKanban'
import { urlArquivoRelatorio } from '../../services/kanban.service'
import { labelCurto } from '../../lib/datas'

// ── Modal de análise técnica ──────────────────────────────────────────────────
// O técnico lê o relatório do auditor externo, escreve o parecer e Aprova/Rejeita.
// Concluir grava o 2º relatório (Técnico Interno) e tira o card do quadro.
export function AnaliseModal({ tarefa, onClose, onToast, onDone }: {
  tarefa: KanbanTarefa
  onClose: () => void
  onToast: (m: string) => void
  onDone: () => void
}) {
  const rel = tarefa.relatorio_externo
  const [comentario, setComentario] = useState('')
  const [baixando, setBaixando] = useState(false)
  const concluir = useConcluirAnalise()
  // Parecer é obrigatório para concluir (aprovar OU rejeitar): trava os botões.
  const semParecer = comentario.trim().length === 0

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Baixa o documento do relatório do auditor. Pede ao backend a signed URL (JSON,
  // autenticado) e baixa DIRETO dela — não do endpoint que redireciona. Seguir o
  // redirect 307 com fetch reenviava o Authorization ao domínio do Storage, que o
  // rejeita, corrompendo o arquivo. A signed URL é pública e não leva header.
  async function baixarDocumento() {
    if (!rel?.relatorio_id) return
    setBaixando(true)
    try {
      const { url, nome: nomeReal } = await urlArquivoRelatorio(rel.relatorio_id)
      if (!url) { onToast('Documento não disponível para este relatório.'); return }
      // Extensão vem do arquivo REAL (.docx/.pdf/…) — nunca fixar. Nome amigável:
      // hospital + data, com a extensão original preservada.
      const ext = nomeReal?.includes('.') ? nomeReal.slice(nomeReal.lastIndexOf('.')) : ''
      const partes = [tarefa.hospital_nome || 'relatorio', labelCurto(rel.data_visita)].filter(Boolean)
      const nome = `relatorio-auditor-${partes.join('-')}${ext}`.replace(/[/\\?%*:|"<>]/g, '-')
      const a = document.createElement('a')
      a.href = url
      a.download = nome
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e) {
      onToast(`Erro ao baixar: ${(e as Error).message}`)
    } finally {
      setBaixando(false)
    }
  }

  async function enviar(veredito: 'APROVADO' | 'REJEITADO') {
    if (tarefa.analise_id == null) return
    if (!comentario.trim()) { onToast('Escreva o comentário da análise antes de concluir.'); return }
    try {
      await concluir.mutateAsync({
        analiseId: tarefa.analise_id,
        payload: { comentario: comentario.trim(), veredito },
      })
      onToast(veredito === 'APROVADO' ? '✓ Relatório aprovado' : 'Relatório rejeitado')
      onDone()
    } catch (e) {
      onToast(`Erro: ${(e as Error).message}`)
    }
  }

  return (
    <div className="kb-modal-back" onClick={onClose}>
      <div className="kb-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="kb-modal-head">
          <div>
            <div className="kb-modal-title">{tarefa.hospital_nome || 'Análise técnica'}</div>
            <div className="kb-modal-sub">
              <span>Relatório do auditor externo</span>
              {rel?.data_visita && (
                <>
                  <span style={{ color: 'var(--border-strong)' }}>·</span>
                  <span>{labelCurto(rel.data_visita)}</span>
                </>
              )}
              {rel?.tem_arquivo && rel.relatorio_id && (
                <>
                  <span style={{ color: 'var(--border-strong)' }}>·</span>
                  {/* Baixa o documento (autenticado). Botão, não <a href>: o endpoint
                      exige o token Bearer, que um link simples não envia. */}
                  <button
                    type="button"
                    onClick={baixarDocumento}
                    disabled={baixando}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: 0, background: 'none', padding: 0, color: 'var(--accent)', cursor: baixando ? 'default' : 'pointer', font: 'inherit' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>
                    {baixando ? 'Baixando…' : 'Baixar documento'}
                  </button>
                </>
              )}
            </div>
          </div>
          <button type="button" className="kb-modal-x" onClick={onClose} aria-label="Fechar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="kb-modal-body">
          <div>
            <div className="kb-modal-field-lbl">Relatório do auditor externo</div>
            <div className="kb-modal-field-val" style={{ whiteSpace: 'pre-wrap' }}>
              {rel?.descricao || 'Sem texto no relatório (confira o documento anexado).'}
            </div>
            {rel?.medico && (
              <div className="kb-modal-field-val" style={{ color: 'var(--muted-2)', marginTop: 4 }}>
                Médico: {rel.medico}
              </div>
            )}
          </div>

          <div className="rr-field">
            <label>Parecer do técnico interno *</label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Descreva o que foi analisado (obrigatório para aprovar ou rejeitar)"
              style={{ minHeight: 96 }}
              autoFocus
            />
            {semParecer && (
              <div style={{ marginTop: 5, fontSize: 'var(--t-sm)', color: 'var(--muted-2)' }}>
                Escreva o parecer para poder concluir a análise.
              </div>
            )}
          </div>
        </div>

        <div className="kb-modal-foot split">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => enviar('REJEITADO')}
            disabled={concluir.isPending || semParecer}
            title={semParecer ? 'Escreva o parecer antes de concluir' : undefined}
          >
            {concluir.isPending ? 'Enviando…' : 'Rejeitar'}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => enviar('APROVADO')}
            disabled={concluir.isPending || semParecer}
            title={semParecer ? 'Escreva o parecer antes de concluir' : undefined}
          >
            {concluir.isPending ? 'Enviando…' : 'Aprovar'}
          </button>
        </div>
      </div>
    </div>
  )
}
