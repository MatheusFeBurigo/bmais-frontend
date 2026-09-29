// Estado e envio do formulário "Registrar relatório", da ficha e do drawer.
// As duas telas mudam só o desenho; validação, envio e mensagem de erro ficam
// aqui para não divergirem.
import { useState } from 'react'
import { useRegistrarRelatorio } from '../../hooks/useInternacao'

export function useFormRelatorio(internacaoId: number, {
  dataInicial,
  onRegistrado,
}: {
  /** Data com que o formulário abre: a ficha sugere hoje; o drawer abre vazio
   *  para o botão só acender depois que o técnico confirma a data. */
  dataInicial: () => string
  onRegistrado: () => void
}) {
  const registrar = useRegistrarRelatorio(internacaoId)
  const [dataVisita, setDataVisita] = useState(dataInicial)
  const [medico, setMedico] = useState('')
  const [obs, setObs] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  function limpar() {
    setDataVisita(dataInicial())
    setMedico('')
    setObs('')
    setErro(null)
  }

  async function salvar() {
    if (!dataVisita) {
      setErro('Informe a data da visita')
      return
    }
    setErro(null)
    try {
      await registrar.mutateAsync({ data_visita: dataVisita, medico, descricao: obs })
      onRegistrado()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao registrar')
    }
  }

  return {
    dataVisita, setDataVisita, medico, setMedico, obs, setObs,
    erro, salvando: registrar.isPending, salvar, limpar,
  }
}

export type FormRelatorio = ReturnType<typeof useFormRelatorio>
