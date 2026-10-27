// As pendências avulsas abertas de uma pessoa, no painel dela da Distribuição
// de tarefas (21/10/2026: o gestor precisa "visualizar o status de demandas
// dela"), com "Nova pendência" já endereçada a ela.
import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { podeExecutar } from '../../auth/permissions'
import { usePendenciasDaPessoa } from '../../hooks/usePendencias'
import { CardPendencia } from './CardPendencia'
import { NovaPendenciaModal } from './NovaPendenciaModal'
import { estilosPendencias } from './pendencias.styles'

export function PendenciasDaPessoa({ pessoa, onAviso }: {
  pessoa: { user_id: string; nome: string }
  onAviso: (msg: string) => void
}) {
  const { role } = useAuth()
  const podePedir = podeExecutar(role, 'criarPendencia')
  const lista = usePendenciasDaPessoa(podePedir ? pessoa.user_id : null)
  const [criando, setCriando] = useState(false)
  if (!podePedir) return null
  const itens = lista.data?.pendencias ?? []

  return (
    <div style={{ marginBottom: 16 }}>
      <style>{estilosPendencias}</style>
      <div className="pd-cab">
        <span className="pd-cab-tit">Pendências</span>
        {itens.length > 0 && <span className="pd-cab-n">{itens.length} {itens.length === 1 ? 'aberta' : 'abertas'}</span>}
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setCriando(true)}>
          Nova pendência
        </button>
      </div>
      {lista.isError && <p className="pd-vazio t-danger">Não foi possível carregar as pendências.</p>}
      {lista.data && !itens.length && <p className="pd-vazio">Nenhuma pendência aberta.</p>}
      {itens.length > 0 && (
        <div className="pd-lista" style={{ marginTop: 8 }}>
          {itens.map((p) => <CardPendencia key={p.id} p={p} onAviso={onAviso} sobreposta />)}
        </div>
      )}
      {criando && (
        <NovaPendenciaModal responsavel={pessoa} onFeito={onAviso} onClose={() => setCriando(false)} sobreposta />
      )}
    </div>
  )
}
