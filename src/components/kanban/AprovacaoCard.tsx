// Card das colunas de aprovação do quadro de pacientes: UM relatório que o administrativo enviou.
//
// O técnico precisa LER o relatório para aprovar, então o texto vem no próprio
// card (não só no drawer). Duas situações:
//   - aguardando: o técnico aprova (o relatório passa a valer e o paciente sai
//     do quadro até o relatório vencer) ou devolve com o motivo;
//   - devolvido: o motivo em destaque, e quem escreveu corrige e reenvia.
//
// Clicar no card abre o drawer do paciente, como nos outros cards.
import { memo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { KanbanTarefa } from '../../types/api'
import { Modal, OpAvatar, Spinner } from '../ui'
import { AutorChip } from '../StatusBadge'
import MedicoCombobox from '../MedicoCombobox'
import { CalendarioVisita } from './CalendarioVisita'
import { ResumoProrrogacao } from '../paciente/SecaoProrrogacao'
import { nomeProprio } from '../../lib/texto'
import { dataBR, dataHora } from '../../lib/datas'
import { useAprovarRelatorio, useDevolverRelatorio, useReenviarRelatorio } from '../../hooks/useKanban'

const pararClique = (e: React.MouseEvent) => e.stopPropagation()

function ModalDevolver({ onConfirmar, onCancelar, ocupado, erro }: {
  onConfirmar: (motivo: string) => void
  onCancelar: () => void
  ocupado: boolean
  erro: string | null
}) {
  const [motivo, setMotivo] = useState('')
  return (
    <Modal
      title="Devolver relatório"
      onClose={ocupado ? () => {} : onCancelar}
      footer={
        <>
          <button type="button" className="btn btn-outline btn-sm" disabled={ocupado} onClick={onCancelar}>Cancelar</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={ocupado || !motivo.trim()}
                  onClick={() => onConfirmar(motivo.trim())}>
            {ocupado && <Spinner size={12} />}
            Devolver
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 8 }}>
        <span className="form-lbl">O que corrigir<span className="req">*</span></span>
        <textarea
          className="bm-input" rows={4} autoFocus maxLength={1000}
          style={{ resize: 'vertical', fontFamily: 'inherit' }}
          value={motivo} onChange={(e) => setMotivo(e.target.value)}
        />
        {erro && <div className="t-danger" style={{ fontSize: 'var(--t-sm)' }}>{erro}</div>}
      </div>
    </Modal>
  )
}

function ModalReenviar({ t, medicos, onFeito, onCancelar }: {
  t: KanbanTarefa
  medicos: string[]
  onFeito: () => void
  onCancelar: () => void
}) {
  const rel = t.relatorio!
  const reenviar = useReenviarRelatorio()
  const [dataVisita, setDataVisita] = useState(rel.data_visita ?? '')
  const [medico, setMedico] = useState(rel.medico ?? '')
  const [obs, setObs] = useState(rel.descricao ?? '')
  const [erro, setErro] = useState<string | null>(null)
  const ocupado = reenviar.isPending

  function enviar() {
    setErro(null)
    reenviar.mutate(
      { relatorioId: rel.id, internacaoId: t.internacao_id, data_visita: dataVisita, medico, descricao: obs },
      { onSuccess: onFeito, onError: (e) => setErro((e as Error).message) },
    )
  }

  return (
    <Modal
      title="Corrigir relatório"
      onClose={ocupado ? () => {} : onCancelar}
      footer={
        <>
          <button type="button" className="btn btn-outline btn-sm" disabled={ocupado} onClick={onCancelar}>Cancelar</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={ocupado || !dataVisita} onClick={enviar}>
            {ocupado && <Spinner size={12} />}
            Reenviar para aprovação
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 10 }}>
        {rel.devolucao_motivo && (
          <div className="ap-motivo">Motivo: {rel.devolucao_motivo}</div>
        )}
        <div>
          <span className="form-lbl">Data da visita realizada<span className="req">*</span></span>
          <CalendarioVisita valor={dataVisita} onEscolher={setDataVisita} limite="passado" placeholder="Escolher data" />
        </div>
        <div>
          <span className="form-lbl">Médico auditor</span>
          <MedicoCombobox value={medico} onChange={setMedico} nomes={medicos} />
        </div>
        <div>
          <span className="form-lbl">Observação</span>
          <textarea
            className="bm-input" rows={4}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
            value={obs} onChange={(e) => setObs(e.target.value)}
          />
        </div>
        {erro && <div className="t-danger" style={{ fontSize: 'var(--t-sm)' }}>{erro}</div>}
      </div>
    </Modal>
  )
}

export const AprovacaoCard = memo(function AprovacaoCard({
  tarefa: t, onAbrir, podeAprovar, podeCorrigir, medicos, onAviso,
}: {
  tarefa: KanbanTarefa
  onAbrir: (t: KanbanTarefa) => void
  /** Técnico (e admin): aprova e devolve o que está aguardando. */
  podeAprovar: boolean
  /** Quem escreveu o relatório devolvido: corrige e reenvia. */
  podeCorrigir: boolean
  medicos: string[]
  onAviso: (msg: string) => void
}) {
  const rel = t.relatorio!
  const devolvido = rel.aprovacao === 'devolvido'
  const aprovar = useAprovarRelatorio()
  const devolver = useDevolverRelatorio()
  const [lendo, setLendo] = useState(false)
  const [devolvendo, setDevolvendo] = useState(false)
  const [corrigindo, setCorrigindo] = useState(false)
  const [erroDevolver, setErroDevolver] = useState<string | null>(null)
  const nome = nomeProprio(t.titulo) || t.titulo
  const ocupado = aprovar.isPending || devolver.isPending

  function onAprovar(e: React.MouseEvent) {
    e.stopPropagation()
    aprovar.mutate({ relatorioId: rel.id, internacaoId: t.internacao_id }, {
      onSuccess: () => onAviso(`✓ Relatório de ${nome} aprovado`),
      onError: (err) => onAviso(`Erro: ${(err as Error).message}`),
    })
  }

  function onDevolver(motivo: string) {
    setErroDevolver(null)
    devolver.mutate({ relatorioId: rel.id, motivo, internacaoId: t.internacao_id }, {
      onSuccess: () => { setDevolvendo(false); onAviso(`Relatório de ${nome} devolvido`) },
      onError: (err) => setErroDevolver((err as Error).message),
    })
  }

  // Texto longo fica recolhido em 4 linhas; "Ler tudo" abre no próprio card.
  const longo = (rel.descricao?.length ?? 0) > 220

  return (
    <article
      className={`kb-card clicavel ap-card${devolvido ? ' ap-devolvido' : ''}`}
      onClick={() => onAbrir(t)}
    >
      <div className="kb-card-top">
        {t.operadora_key && <OpAvatar opKey={t.operadora_key} size={20} />}
        <span className="kb-card-nome">{nome}</span>
      </div>
      {t.hospital_nome && <div className="kb-card-meta"><span>{t.hospital_nome}</span></div>}

      <div className="ap-rel">
        <div className="ap-rel-linha">
          Visita {dataBR(rel.data_visita) || '—'}{rel.medico ? ` · ${rel.medico}` : ''}
        </div>
        {rel.prorrogacao && <ResumoProrrogacao p={rel.prorrogacao} />}
        {rel.descricao
          ? <div className={`ap-rel-texto${lendo || !longo ? '' : ' recolhido'}`}>{rel.descricao}</div>
          : <div className="ap-rel-texto t-muted">Sem observação.</div>}
        {longo && (
          <button type="button" className="kb-mais" onClick={(e) => { e.stopPropagation(); setLendo((v) => !v) }}>
            {lendo ? 'Recolher' : 'Ler tudo'}
          </button>
        )}
        <div className="ap-rel-autor">
          {rel.autor && <AutorChip role={rel.autor_role} autor={rel.autor} />}
          <span className="t-muted">{dataHora(rel.criado_em)}</span>
        </div>
      </div>

      {devolvido && rel.devolucao_motivo && (
        <div className="ap-motivo" title={rel.aprovacao_por ? `Devolvido por ${rel.aprovacao_por}` : undefined}>
          Motivo: {rel.devolucao_motivo}
        </div>
      )}

      {!devolvido && podeAprovar && (
        <div className="ap-acoes" onClick={pararClique}>
          <button type="button" className="btn btn-outline btn-sm" disabled={ocupado}
                  onClick={() => { setErroDevolver(null); setDevolvendo(true) }}>
            Devolver
          </button>
          <button type="button" className="btn btn-success btn-sm" disabled={ocupado} onClick={onAprovar}>
            {aprovar.isPending && <Spinner size={12} />}
            Aprovar
          </button>
        </div>
      )}
      {devolvido && podeCorrigir && (
        <div className="ap-acoes" onClick={pararClique}>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setCorrigindo(true)}>
            Corrigir e reenviar
          </button>
        </div>
      )}

      {/* Portal: o card ganha `transform` no hover, e um `position:fixed` dentro
          dele passaria a se posicionar pelo card. O clique que vem da modal
          ainda sobe pela árvore do React até o card, daí o pararClique. */}
      {(devolvendo || corrigindo) && createPortal(<div onClick={pararClique}>
        {devolvendo && (
          <ModalDevolver ocupado={devolver.isPending} erro={erroDevolver}
                         onConfirmar={onDevolver} onCancelar={() => setDevolvendo(false)} />
        )}
        {corrigindo && (
          <ModalReenviar t={t} medicos={medicos} onCancelar={() => setCorrigindo(false)}
                         onFeito={() => { setCorrigindo(false); onAviso('✓ Relatório reenviado para aprovação') }} />
        )}
      </div>, document.body)}
    </article>
  )
})
