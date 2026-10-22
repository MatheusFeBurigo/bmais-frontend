// Uma pendência avulsa (21/10/2026): o que foi pedido, para quem ou por quem, o
// paciente e o prazo. "Concluir" e "Excluir" aparecem conforme o backend diz
// que quem olha pode (`pode_concluir`, `pode_excluir`); excluir pede
// confirmação, concluir não (é o fim normal da pendência).
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useConcluirPendencia, useExcluirPendencia } from '../../hooks/usePendencias'
import { dataBR, ehHoje } from '../../lib/datas'
import type { Pendencia } from '../../types/api'
import { ConfirmarModal } from '../ConfirmarModal'
import { Spinner } from '../ui'

function Prazo({ p }: { p: Pendencia }) {
  if (!p.prazo) return null
  if (p.vencida) return <span className="pd-tag pd-tag-vencida">Venceu {dataBR(p.prazo).slice(0, 5)}</span>
  if (ehHoje(p.prazo)) return <span className="pd-tag pd-tag-hoje">Vence hoje</span>
  return <span className="pd-tag pd-tag-prazo">Prazo {dataBR(p.prazo).slice(0, 5)}</span>
}

export function CardPendencia({ p, mostrar, onAviso, sobreposta }: {
  p: Pendencia
  /** "de": quem pediu (a pendência é minha); "para": quem recebeu. */
  mostrar: 'de' | 'para'
  onAviso: (msg: string) => void
  /** Dentro de um drawer: a confirmação sobe acima dele. */
  sobreposta?: boolean
}) {
  const concluir = useConcluirPendencia()
  const excluir = useExcluirPendencia()
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const ocupado = concluir.isPending || excluir.isPending
  const quem = mostrar === 'de' ? p.criado_por_nome : p.responsavel_nome

  function onConcluir() {
    setErro(null)
    concluir.mutate(p.id, {
      onSuccess: () => onAviso(`✓ Pendência concluída: ${p.titulo}`),
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
    <article className={`pd-card${p.vencida ? ' pd-vencida' : ''}`}>
      <div className="pd-titulo">{p.titulo}</div>
      {p.paciente && <div className="pd-meta"><span>Paciente: {p.paciente}</span></div>}
      {p.descricao && <div className="pd-desc">{p.descricao}</div>}
      <div className="pd-meta">
        {quem && <span>{mostrar === 'de' ? 'Pedida por' : 'Para'} {quem}</span>}
        <Prazo p={p} />
      </div>
      {(p.pode_concluir || p.pode_excluir) && (
        <div className="pd-acoes">
          {erro && <span className="t-danger pd-erro" role="alert">{erro}</span>}
          {p.pode_excluir && (
            <button type="button" className="btn btn-ghost btn-sm" disabled={ocupado}
                    onClick={() => setConfirmando(true)}>
              Excluir
            </button>
          )}
          {p.pode_concluir && (
            <button type="button" className="btn btn-outline btn-sm pd-concluir" disabled={ocupado} onClick={onConcluir}>
              {concluir.isPending && <Spinner size={12} />}
              Concluir
            </button>
          )}
        </div>
      )}
      {confirmando && createPortal(
        <ConfirmarModal titulo="Excluir pendência" confirmar="Excluir" perigo ocupado={excluir.isPending}
                        sobreposta={sobreposta}
                        onConfirmar={onExcluir} onCancelar={() => setConfirmando(false)}>
          A pendência <strong>{p.titulo}</strong> sai da lista de {p.responsavel_nome || 'quem a recebeu'}.
          Para registrar que ela foi feita, use <strong>Concluir</strong>.
        </ConfirmarModal>,
        document.body)}
    </article>
  )
}
