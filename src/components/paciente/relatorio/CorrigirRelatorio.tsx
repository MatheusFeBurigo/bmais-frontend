// Correção do relatório pendente por quem aprova (20/10/2026: "o gestor que
// aprova precisa conseguir editar este relatório também; muitos casos só corrige
// a palavra e já libera, não precisa devolver").
//
// É a modal "Registrar relatório", aberta por cima da ficha do relatório já com
// o que foi gravado; "Salvar e aprovar" grava a correção e aprova no mesmo
// passo. A autoria segue de quem escreveu: quem corrigiu fica na aprovação.
import { useEffect, useState } from 'react'
import { paraISO } from '../../../lib/datas'
import type { InternacaoDados, RelatorioItem } from '../../../types/api'
import { useFormRelatorio } from '../useFormRelatorio'
import { ModalRelatorio } from './ModalRelatorio'

export function CorrigirRelatorio({ internacaoId, relatorio, paciente, medicos, enfermeiros, onFechar, onFeito }: {
  internacaoId: number
  relatorio: RelatorioItem
  paciente: InternacaoDados
  medicos: string[]
  enfermeiros: string[]
  onFechar: () => void
  /** Corrigido e aprovado. */
  onFeito: () => void
}) {
  const form = useFormRelatorio(internacaoId, {
    dataInicial: () => '',
    prorrogacao: { ate: paciente.prorrogacao_ate, acomodacao: paciente.prorrogacao_acomodacao },
    folhaRosa: { acomodacao: paciente.prorrogacao_acomodacao || paciente.tipo_leito },
    completo: { ultimo: null, dataEntrada: paraISO(paciente.data_entrada) },
    onRegistrado: onFeito,
  })
  // A modal só monta com o relatório carregado: as seções sugerem a acomodação
  // da ficha ao montar, e não podem fazer isso sobre o formulário vazio.
  const [pronto, setPronto] = useState(false)
  const { carregarRelatorio } = form
  useEffect(() => {
    carregarRelatorio(relatorio)
    setPronto(true)
  }, [relatorio.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!pronto) return null
  return (
    <ModalRelatorio form={form} paciente={paciente} medicos={medicos} enfermeiros={enfermeiros}
                    onAviso={() => {}} onFechar={onFechar} sobreposta />
  )
}
