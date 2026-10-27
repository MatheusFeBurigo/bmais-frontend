// Aba Pendências de Tarefas (27/10/2026). Pedido do usuário: "criar uma
// terceira aba aqui ... Pacientes / Censos / pendencias. E criar uma timeline
// também para pendências com 3 cards: Pendencias, aguardando, resolvida".
//
// Substitui o painel que ficava no topo de Tarefas (21/10/2026): as mesmas
// pendências, agora num quadro com o caminho delas. Aqui ficam os dados; o
// desenho é QuadroPendenciasVisao, o mesmo da Ajuda.
//
// Abrir a aba é ver o que chegou: o aviso de pendência nova (AvisoPendencias)
// some para quem recebeu.
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { podeExecutar } from '../../auth/permissions'
import { useMarcarPendenciasVistas, useMinhasPendencias, usePendenciasNovas } from '../../hooks/usePendencias'
import type { Pendencia } from '../../types/api'
import { LoadingState } from '../ui'
import { CardPendencia } from './CardPendencia'
import { NovaPendenciaModal } from './NovaPendenciaModal'
import { QuadroPendenciasVisao } from './QuadroPendenciasVisao'

/** Todas as pendências da pessoa, com a relação dela com cada uma. Um backend
 *  anterior à 0059 não manda `relacao` nem `resolvidas`: a origem da lista diz. */
function juntar(para_mim: Pendencia[], pedidas: Pendencia[], resolvidas: Pendencia[]): Pendencia[] {
  return [
    ...para_mim.map((p) => ({ ...p, relacao: p.relacao ?? 'recebida' as const })),
    ...pedidas.map((p) => ({ ...p, relacao: p.relacao ?? 'pedida' as const })),
    ...resolvidas,
  ]
}

export function QuadroPendencias({ onAviso }: { onAviso: (msg: string) => void }) {
  const { role } = useAuth()
  const { data, isLoading, isError } = useMinhasPendencias()
  const podePedir = podeExecutar(role, 'criarPendencia')
  const [criando, setCriando] = useState(false)

  // Mesma consulta do aviso global (cache compartilhado): havendo não vista, a
  // aba aberta as marca como vistas.
  const novas = usePendenciasNovas(true)
  const marcar = useMarcarPendenciasVistas()
  const naoVistas = novas.data?.pendencias.length ?? 0
  const { mutate: marcarVistas } = marcar
  useEffect(() => {
    if (naoVistas > 0) marcarVistas()
  }, [naoVistas, marcarVistas])

  const todas = useMemo(
    () => juntar(data?.para_mim ?? [], data?.pedidas ?? [], data?.resolvidas ?? []),
    [data])

  if (isLoading) return <LoadingState label="Carregando pendências…" />
  if (isError) return <div className="empty-state t-danger">Erro ao carregar as pendências.</div>

  return (
    <>
      <QuadroPendenciasVisao
        pendencias={todas}
        podePedir={podePedir}
        onNova={() => setCriando(true)}
        cartao={(p) => <CardPendencia p={p} onAviso={onAviso} />}
      />
      {criando && <NovaPendenciaModal onFeito={onAviso} onClose={() => setCriando(false)} />}
    </>
  )
}
