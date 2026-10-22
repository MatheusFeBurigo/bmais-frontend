// Pendências avulsas no topo de Tarefas (21/10/2026): o que o gestor ou o
// coordenador pediu a quem está logado ("Para você") e o que quem está logado
// pediu a outros ("Que você pediu", para acompanhar). Fica fora das colunas do
// quadro: elas são as demandas que vêm do censo, com filtros e contagens dele.
//
// Sem pendência nenhuma, só aparece para quem pode pedir (o botão "Nova
// pendência"); para os demais, o painel some.
import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { podeExecutar } from '../../auth/permissions'
import { useMinhasPendencias } from '../../hooks/usePendencias'
import { CardPendencia } from './CardPendencia'
import { NovaPendenciaModal } from './NovaPendenciaModal'
import { estilosPendencias } from './pendencias.styles'

export function PainelPendencias({ onAviso }: { onAviso: (msg: string) => void }) {
  const { role } = useAuth()
  const { data } = useMinhasPendencias()
  const [criando, setCriando] = useState(false)
  const podePedir = podeExecutar(role, 'criarPendencia')
  const paraMim = data?.para_mim ?? []
  const pedidas = data?.pedidas ?? []
  if (!podePedir && !paraMim.length && !pedidas.length) return null

  return (
    <section className="pd-painel" aria-label="Pendências">
      <style>{estilosPendencias}</style>
      <div className="pd-cab">
        <span className="pd-cab-tit">Pendências</span>
        {paraMim.length > 0 && <span className="pd-cab-n">{paraMim.length} para você</span>}
        {podePedir && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setCriando(true)}>
            Nova pendência
          </button>
        )}
      </div>
      {!paraMim.length && !pedidas.length && (
        <p className="pd-vazio">
          Nenhuma pendência aberta. Use <strong>Nova pendência</strong> para pedir algo a alguém da
          equipe: um paciente, um e-mail urgente, uma tarefa específica.
        </p>
      )}
      {paraMim.length > 0 && (
        <div className="pd-grupo">
          {pedidas.length > 0 && <div className="pd-grupo-tit">Para você</div>}
          <div className="pd-grade">
            {paraMim.map((p) => <CardPendencia key={p.id} p={p} mostrar="de" onAviso={onAviso} />)}
          </div>
        </div>
      )}
      {pedidas.length > 0 && (
        <div className="pd-grupo">
          <div className="pd-grupo-tit">Que você pediu</div>
          <div className="pd-grade">
            {pedidas.map((p) => <CardPendencia key={p.id} p={p} mostrar="para" onAviso={onAviso} />)}
          </div>
        </div>
      )}
      {criando && <NovaPendenciaModal onFeito={onAviso} onClose={() => setCriando(false)} />}
    </section>
  )
}
