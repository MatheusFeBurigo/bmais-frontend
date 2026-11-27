// Aprovar e editar um relatório pendente, no rodapé da ficha do relatório.
//
// A aprovação saiu do quadro de Tarefas (13/10/2026): o card leva à ficha do
// paciente com o relatório aberto, e é aqui, depois de ler o relatório e poder
// conferir a ficha, que quem aprova (técnico, coordenador técnico, gestor,
// admin) decide: aprova, ou edita (20/10/2026: corrigir uma palavra não precisa
// de devolução) e, na edição, salva para depois ou salva e aprova.
//
// A devolução ao autor saiu em 21/10/2026 ("os relatórios serão editados pelo
// coordenador ou gestor e serão liberados ou ficarão apenas salvos, aguardando
// edição"): sem "Devolver" e sem "Corrigir e reenviar".
//
// Recusar entrou em 26/11/2026 ("não está permitindo negar o relatório enviado
// igual fazemos com os pedidos de ausências"): com motivo obrigatório, como a
// ausência, e final. O relatório não conta e o auditor vê o motivo no App.
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../../auth/AuthContext'
import { ehSomenteLeitura, podeExecutar } from '../../../auth/permissions'
import { useAprovarRelatorio, useRecusarRelatorio } from '../../../hooks/useKanban'
import type { RelatorioItem } from '../../../types/api'
import { ConfirmarModal } from '../../ConfirmarModal'
import { Spinner } from '../../ui'

/** Letras do texto (a regra do servidor: recusar exige pelo menos 4, como na ausência). */
const letras = (s: string) => (s.match(/\p{L}/gu) ?? []).length

/** Recusar o relatório pendente, com o motivo. Por cima da ficha (portal no body). */
function RecusarModal({ rel, internacaoId, nomePaciente, onFechar, onFeito }: {
  rel: RelatorioItem
  internacaoId: number
  nomePaciente: string
  onFechar: () => void
  onFeito: (aviso: string) => void
}) {
  const recusar = useRecusarRelatorio()
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const pronto = letras(motivo) >= 4
  const autor = rel.autor_nome || 'Quem registrou'
  // Médico e enfermeiro registram pelo App; os outros papéis, pelo sistema.
  const onde = rel.autor_role === 'medico' || rel.autor_role === 'enfermeiro' ? 'no App' : 'na ficha do paciente'
  function enviar() {
    if (!pronto) return
    setErro(null)
    recusar.mutate({ relatorioId: rel.id, internacaoId, motivo: motivo.trim() }, {
      onSuccess: () => onFeito(`Relatório de ${nomePaciente} recusado`),
      onError: (e) => setErro((e as Error).message || 'Não foi possível recusar. Tente de novo.'),
    })
  }
  return createPortal(
    <ConfirmarModal titulo="Recusar relatório" confirmar="Recusar" cancelar="Voltar" perigo sobreposta
      ocupado={recusar.isPending} podeConfirmar={pronto} onConfirmar={enviar} onCancelar={onFechar}>
      <p style={{ margin: 0 }}>
        O relatório de <strong>{nomePaciente}</strong> não vai valer como visita. {autor} vê o motivo
        {' '}{onde} e, se precisar, registra outro.
      </p>
      <div>
        <label className="form-lbl" htmlFor="rel-recusa-motivo">Motivo da recusa</label>
        <textarea id="rel-recusa-motivo" className="bm-input" rows={3} maxLength={500} autoFocus
          style={{ resize: 'vertical', fontFamily: 'inherit' }} value={motivo}
          disabled={recusar.isPending} onChange={(e) => setMotivo(e.target.value)} />
        <div style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)', marginTop: 4 }}>Obrigatório.</div>
      </div>
      {erro && <div className="t-danger" style={{ fontSize: 'var(--t-sm)' }}>{erro}</div>}
    </ConfirmarModal>,
    document.body,
  )
}

/** Botões do rodapé da ficha do relatório (Recusar, Editar, Aprovar), conforme o estado e quem olha.
 *  Nada a fazer (aprovado, ou sem permissão) = nada aparece. */
export function RodapeAprovacao({ relatorio: rel, internacaoId, nomePaciente, onDecidido, onCorrigir }: {
  relatorio: RelatorioItem
  internacaoId: number
  nomePaciente: string
  /** Depois de aprovar ou recusar, com o aviso para a tela. */
  onDecidido: (aviso: string) => void
  /** Abre a modal do relatório já preenchida, para corrigir. */
  onCorrigir?: () => void
}) {
  const { role } = useAuth()
  const aprovar = useAprovarRelatorio()
  const [erro, setErro] = useState<string | null>(null)
  const [recusando, setRecusando] = useState(false)

  const podeAprovar = podeExecutar(role, 'aprovarRelatorio') && !ehSomenteLeitura(role)
  if (rel.aprovacao !== 'pendente' || !podeAprovar) return null

  function onAprovar() {
    setErro(null)
    aprovar.mutate({ relatorioId: rel.id, internacaoId }, {
      onSuccess: () => onDecidido(`✓ Relatório de ${nomePaciente} aprovado`),
      onError: (e) => setErro((e as Error).message),
    })
  }

  return (
    <>
      {erro && <span className="t-danger" style={{ fontSize: 'var(--t-sm)', marginRight: 'auto' }}>{erro}</span>}
      {/* Recusar em vermelho (27/11/2026, pedido do usuário), como o Aprovar em verde. */}
      <button type="button" className="btn btn-perigo" disabled={aprovar.isPending} onClick={() => setRecusando(true)}>
        Recusar
      </button>
      {onCorrigir && (
        <button type="button" className="btn btn-outline" disabled={aprovar.isPending} onClick={onCorrigir}>
          Editar
        </button>
      )}
      <button type="button" className="btn btn-success" disabled={aprovar.isPending} onClick={onAprovar}>
        {aprovar.isPending && <Spinner size={12} />}
        Aprovar
      </button>
      {recusando && (
        <RecusarModal rel={rel} internacaoId={internacaoId} nomePaciente={nomePaciente}
          onFechar={() => setRecusando(false)}
          onFeito={(aviso) => { setRecusando(false); onDecidido(aviso) }} />
      )}
    </>
  )
}
