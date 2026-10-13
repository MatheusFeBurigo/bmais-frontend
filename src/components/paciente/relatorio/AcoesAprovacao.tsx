// Aprovar, devolver e corrigir um relatório, no rodapé da ficha do relatório.
//
// A aprovação saiu do quadro de Tarefas (13/10/2026): o card leva à ficha do
// paciente com o relatório aberto, e é aqui, depois de ler o relatório e poder
// conferir a ficha, que o técnico decide. Duas situações:
//   - pendente: quem aprova (técnico, gestor, admin) aprova ou devolve com o motivo;
//   - devolvido: quem escreveu (ou quem aprova) corrige e reenvia.
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../../auth/AuthContext'
import { ehSomenteLeitura, podeExecutar } from '../../../auth/permissions'
import { useEquipe } from '../../../hooks/useEquipe'
import { useAprovarRelatorio, useDevolverRelatorio, useReenviarRelatorio } from '../../../hooks/useKanban'
import type { RelatorioItem } from '../../../types/api'
import { CalendarioVisita } from '../../kanban/CalendarioVisita'
import MedicoCombobox from '../../MedicoCombobox'
import { Modal, Spinner } from '../../ui'

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
      sobreposta
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

function ModalReenviar({ relatorio: rel, internacaoId, onFeito, onCancelar }: {
  relatorio: RelatorioItem
  internacaoId: number
  onFeito: () => void
  onCancelar: () => void
}) {
  const reenviar = useReenviarRelatorio()
  const { data: equipe } = useEquipe()
  const medicos = useMemo(
    () => (equipe?.medicos ?? []).filter((m) => Boolean(m.ativo)).map((m) => m.nome),
    [equipe],
  )
  const [dataVisita, setDataVisita] = useState(rel.data_visita ?? '')
  const [medico, setMedico] = useState(rel.medico ?? '')
  const [obs, setObs] = useState(rel.descricao ?? '')
  const [erro, setErro] = useState<string | null>(null)
  const ocupado = reenviar.isPending

  function enviar() {
    setErro(null)
    reenviar.mutate(
      { relatorioId: rel.id, internacaoId, data_visita: dataVisita, medico, descricao: obs },
      { onSuccess: onFeito, onError: (e) => setErro((e as Error).message) },
    )
  }

  return (
    <Modal
      title="Corrigir relatório"
      sobreposta
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
          <div className="t-danger" style={{ fontSize: 'var(--t-sm)' }}>Motivo: {rel.devolucao_motivo}</div>
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

/** Botões do rodapé da ficha do relatório, conforme o estado e quem olha.
 *  Nada a fazer (aprovado, ou sem permissão) = nada aparece. */
export function RodapeAprovacao({ relatorio: rel, internacaoId, nomePaciente, onDecidido }: {
  relatorio: RelatorioItem
  internacaoId: number
  nomePaciente: string
  /** Depois de aprovar, devolver ou reenviar, com o aviso para a tela. */
  onDecidido: (aviso: string) => void
}) {
  const { role, username } = useAuth()
  const aprovar = useAprovarRelatorio()
  const devolver = useDevolverRelatorio()
  const [devolvendo, setDevolvendo] = useState(false)
  const [corrigindo, setCorrigindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const somenteLeitura = ehSomenteLeitura(role)
  const podeAprovar = podeExecutar(role, 'aprovarRelatorio') && !somenteLeitura
  const autor = rel.autor?.toLowerCase()
  const podeCorrigir = !somenteLeitura
    && (podeAprovar || (!!autor && autor === username?.toLowerCase()))
  const pendente = rel.aprovacao === 'pendente'
  const devolvido = rel.aprovacao === 'devolvido'
  const ocupado = aprovar.isPending || devolver.isPending

  function onAprovar() {
    setErro(null)
    aprovar.mutate({ relatorioId: rel.id, internacaoId }, {
      onSuccess: () => onDecidido(`✓ Relatório de ${nomePaciente} aprovado`),
      onError: (e) => setErro((e as Error).message),
    })
  }

  function onDevolver(motivo: string) {
    setErro(null)
    devolver.mutate({ relatorioId: rel.id, motivo, internacaoId }, {
      onSuccess: () => { setDevolvendo(false); onDecidido(`Relatório de ${nomePaciente} devolvido`) },
      onError: (e) => setErro((e as Error).message),
    })
  }

  if (pendente && podeAprovar) {
    return (
      <>
        {erro && !devolvendo && <span className="t-danger" style={{ fontSize: 'var(--t-sm)', marginRight: 'auto' }}>{erro}</span>}
        <button type="button" className="btn btn-outline" disabled={ocupado}
                onClick={() => { setErro(null); setDevolvendo(true) }}>
          Devolver
        </button>
        <button type="button" className="btn btn-success" disabled={ocupado} onClick={onAprovar}>
          {aprovar.isPending && <Spinner size={12} />}
          Aprovar
        </button>
        {/* Portal: a ficha do relatório é ela mesma uma modal, e a janela do
            motivo precisa ficar por cima dela, não dentro do rodapé. */}
        {devolvendo && createPortal(
          <ModalDevolver ocupado={devolver.isPending} erro={erro}
                         onConfirmar={onDevolver} onCancelar={() => setDevolvendo(false)} />,
          document.body)}
      </>
    )
  }
  if (devolvido && podeCorrigir) {
    return (
      <>
        <button type="button" className="btn btn-primary" onClick={() => setCorrigindo(true)}>
          Corrigir e reenviar
        </button>
        {corrigindo && createPortal(
          <ModalReenviar relatorio={rel} internacaoId={internacaoId}
                         onCancelar={() => setCorrigindo(false)}
                         onFeito={() => { setCorrigindo(false); onDecidido('✓ Relatório reenviado para aprovação') }} />,
          document.body)}
      </>
    )
  }
  return null
}
