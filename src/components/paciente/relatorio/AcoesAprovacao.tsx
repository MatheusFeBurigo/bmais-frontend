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
import { useState } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import { ehSomenteLeitura, podeExecutar } from '../../../auth/permissions'
import { useAprovarRelatorio } from '../../../hooks/useKanban'
import type { RelatorioItem } from '../../../types/api'
import { Spinner } from '../../ui'

/** Botões do rodapé da ficha do relatório, conforme o estado e quem olha.
 *  Nada a fazer (aprovado, ou sem permissão) = nada aparece. */
export function RodapeAprovacao({ relatorio: rel, internacaoId, nomePaciente, onDecidido, onCorrigir }: {
  relatorio: RelatorioItem
  internacaoId: number
  nomePaciente: string
  /** Depois de aprovar, com o aviso para a tela. */
  onDecidido: (aviso: string) => void
  /** Abre a modal do relatório já preenchida, para corrigir. */
  onCorrigir?: () => void
}) {
  const { role } = useAuth()
  const aprovar = useAprovarRelatorio()
  const [erro, setErro] = useState<string | null>(null)

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
      {onCorrigir && (
        <button type="button" className="btn btn-outline" disabled={aprovar.isPending} onClick={onCorrigir}>
          Editar
        </button>
      )}
      <button type="button" className="btn btn-success" disabled={aprovar.isPending} onClick={onAprovar}>
        {aprovar.isPending && <Spinner size={12} />}
        Aprovar
      </button>
    </>
  )
}
