// Pedidos para desfazer "Marcar como atualizado" de um censo (12/10/2026): o
// operacional pede no card de Tarefas e quem está nesta tela (Gestor,
// Coordenadores, Administrador) aprova ou recusa. Aprovar desfaz a atualização
// e o censo volta a ficar pendente; recusar deixa como está. A decisão vai para
// a timeline do card. Só renderiza quando há pedido.
import { useState } from 'react'
import { useDecidirDesfazerCenso, usePedidosDesfazerCenso } from '../../hooks/useKanban'
import type { PedidoDesfazerCenso } from '../../types/api'
import { dataHora } from '../../lib/datas'
import { nomeProprio } from '../../lib/texto'
import { OpAvatar } from '../ui'

const chave = (p: PedidoDesfazerCenso) => `${p.hospital_key}|${p.operadora_key ?? ''}`

export default function PedidosDesfazerAtualizacao({ onErro, onAviso }: {
  onErro: (msg: string) => void
  onAviso: (msg: string) => void
}) {
  const { data } = usePedidosDesfazerCenso()
  const decidir = useDecidirDesfazerCenso()
  // Qual pedido está gravando: desabilita só ele, não a lista toda.
  const [gravando, setGravando] = useState<string | null>(null)
  const pedidos = data?.pedidos ?? []
  if (pedidos.length === 0) return null

  function responder(p: PedidoDesfazerCenso, aprovar: boolean) {
    setGravando(chave(p))
    decidir.mutate({ hospitalKey: p.hospital_key, operadoraKey: p.operadora_key ?? '', aprovar }, {
      onSuccess: () => onAviso(aprovar ? 'Atualização desfeita' : 'Pedido recusado'),
      onError: (e) => onErro((e as Error).message || 'Não foi possível responder ao pedido. Tente de novo.'),
      onSettled: () => setGravando(null),
    })
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">
        <div>
          <div className="card-title">Pedidos para desfazer atualização ({pedidos.length})</div>
          <p className="card-sub">Ao aprovar, o censo volta a ficar pendente em Tarefas.</p>
        </div>
      </div>
      <div className="card-body">
        {pedidos.map((p) => {
          const ocupado = gravando === chave(p)
          return (
            <div className="vol-pedido" key={chave(p)}>
              {p.operadora_key ? <OpAvatar opKey={p.operadora_key} size={28} /> : <span />}
              <span style={{ minWidth: 0 }}>
                <div className="vol-hosp-nome" title={p.hospital_nome}>{nomeProprio(p.hospital_nome)}</div>
                <div className="vol-hosp-sub">
                  {[p.operadora_nome,
                    p.solicitado_por && `Pedido por ${p.solicitado_por}`,
                    dataHora(p.solicitado_em)].filter(Boolean).join(' · ')}
                </div>
              </span>
              <div className="vol-pedido-acoes">
                <button type="button" className="btn btn-ghost btn-sm" disabled={ocupado}
                        onClick={() => responder(p, false)}>
                  Recusar
                </button>
                <button type="button" className="btn btn-primary btn-sm" disabled={ocupado}
                        onClick={() => responder(p, true)}>
                  {ocupado ? 'Gravando…' : 'Aprovar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
