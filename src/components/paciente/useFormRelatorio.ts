// Estado e envio do formulário "Registrar relatório", da ficha e do drawer.
// As duas telas mudam só o desenho; validação, envio e mensagem de erro ficam
// aqui para não divergirem.
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRegistrarRelatorio } from '../../hooks/useInternacao'
import { queryKeys } from '../../lib/queryKeys'

/** CID escolhido no formulário. A descrição é só para a etiqueta na tela: o
 *  backend grava a do vínculo/catálogo, nunca a que veio daqui. */
export interface CidEscolhido {
  codigo: string
  descricao: string
}

export function useFormRelatorio(internacaoId: number, {
  dataInicial,
  onRegistrado,
}: {
  /** Data com que o formulário abre: a ficha sugere hoje; o drawer abre vazio
   *  para o botão só acender depois que o técnico confirma a data. */
  dataInicial: () => string
  onRegistrado: () => void
}) {
  const qc = useQueryClient()
  const registrar = useRegistrarRelatorio(internacaoId)
  const [dataVisita, setDataVisita] = useState(dataInicial)
  const [medico, setMedico] = useState('')
  const [obs, setObs] = useState('')
  // CIDs que o relatório trata. Os que o paciente ainda não tem entram nele
  // junto com o relatório (só para quem pode atribuir CID; regra do backend).
  const [cids, setCids] = useState<CidEscolhido[]>([])
  const [erro, setErro] = useState<string | null>(null)

  function adicionarCid(c: CidEscolhido) {
    setCids((atual) => atual.some((x) => x.codigo === c.codigo) ? atual : [...atual, c])
  }

  function removerCid(codigo: string) {
    setCids((atual) => atual.filter((c) => c.codigo !== codigo))
  }

  function limpar() {
    setDataVisita(dataInicial())
    setMedico('')
    setObs('')
    setCids([])
    setErro(null)
  }

  async function salvar() {
    if (!dataVisita) {
      setErro('Informe a data da visita')
      return
    }
    setErro(null)
    try {
      await registrar.mutateAsync({ data_visita: dataVisita, medico, descricao: obs, cids: cids.map((c) => c.codigo) })
      // Um CID novo passou a ser do paciente: o card de CIDs da ficha relê.
      if (cids.length) qc.invalidateQueries({ queryKey: queryKeys.internacaoCids(internacaoId) })
      setCids([])
      onRegistrado()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao registrar')
    }
  }

  return {
    internacaoId, dataVisita, setDataVisita, medico, setMedico, obs, setObs,
    cids, adicionarCid, removerCid,
    erro, salvando: registrar.isPending, salvar, limpar,
  }
}

export type FormRelatorio = ReturnType<typeof useFormRelatorio>
