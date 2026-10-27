// Uma pendência avulsa (21/10/2026) ligada aos dados: o card (CartaoPendencia,
// que também é o da Ajuda) com as ações gravando de verdade. Excluir pede
// confirmação; os movimentos não (cada um tem o caminho de volta).
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useConcluirPendencia, useExcluirPendencia, useMoverPendencia } from '../../hooks/usePendencias'
import type { MovimentoPendencia } from '../../services/pendencias.service'
import type { Pendencia } from '../../types/api'
import { ConfirmarModal } from '../ConfirmarModal'
import { CartaoPendencia } from './CartaoPendencia'

const SUCESSO: Record<MovimentoPendencia, string> = {
  aguardando: 'Pendência movida para Aguardando',
  pendente: 'Pendência voltou para Pendentes',
  reabrir: 'Pendência reaberta',
}

export function CardPendencia({ p, onAviso, sobreposta }: {
  p: Pendencia
  onAviso: (msg: string) => void
  /** Dentro de um drawer: a confirmação sobe acima dele. */
  sobreposta?: boolean
}) {
  const concluir = useConcluirPendencia()
  const excluir = useExcluirPendencia()
  const mover = useMoverPendencia()
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function onConcluir() {
    setErro(null)
    concluir.mutate(p.id, {
      onSuccess: () => onAviso(`✓ Pendência concluída: ${p.titulo}`),
      onError: (e) => setErro((e as Error).message),
    })
  }

  function onMover(para: MovimentoPendencia) {
    setErro(null)
    mover.mutate({ id: p.id, para }, {
      onSuccess: () => onAviso(SUCESSO[para]),
      onError: (e) => setErro((e as Error).message),
    })
  }

  function onExcluir() {
    setErro(null)
    excluir.mutate(p.id, {
      onSuccess: () => { setConfirmando(false); onAviso('Pendência excluída') },
      onError: (e) => { setConfirmando(false); setErro((e as Error).message) },
    })
  }

  return (
    <>
      <CartaoPendencia
        p={p}
        ocupado={concluir.isPending || excluir.isPending || mover.isPending}
        concluindo={concluir.isPending}
        movendo={mover.isPending}
        erro={erro}
        onConcluir={onConcluir}
        onMover={onMover}
        onExcluir={() => setConfirmando(true)}
      />
      {confirmando && createPortal(
        <ConfirmarModal titulo="Excluir pendência" confirmar="Excluir" perigo ocupado={excluir.isPending}
                        sobreposta={sobreposta}
                        onConfirmar={onExcluir} onCancelar={() => setConfirmando(false)}>
          A pendência <strong>{p.titulo}</strong> sai da lista de {p.responsavel_nome || 'quem a recebeu'}.
          Para registrar que ela foi feita, use <strong>Concluir</strong>.
        </ConfirmarModal>,
        document.body)}
    </>
  )
}
