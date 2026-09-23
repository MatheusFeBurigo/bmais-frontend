// Agendar / cancelar a visita do técnico.
// (a função interna chama-se `desmarcar` — identificador estável; o texto
// visível ao usuário é "Cancelar"/"cancelada").
//
// Hook único para os dois pontos de entrada (o botão do card no quadro e o bloco
// do drawer): a regra de invalidação e o tratamento de erro ficam num lugar só,
// e as duas telas não podem divergir sobre o que acontece depois de salvar.
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { agendarVisita, desmarcarVisita } from '../../services/internacao.service'
import { invalidarPorEvento } from '../../lib/invalidation'
import { queryKeys } from '../../lib/queryKeys'

export function useAgendarVisita(internacaoId: number | null | undefined) {
  const qc = useQueryClient()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function aoTerminar() {
    // O quadro precisa refazer o fetch porque o card muda de coluna. A ficha do
    // paciente também, para a data aparecer ao reabrir.
    invalidarPorEvento(qc, 'visitaAgendada')
    if (internacaoId != null) {
      qc.invalidateQueries({ queryKey: queryKeys.internacaoDados(internacaoId) })
      qc.invalidateQueries({ queryKey: queryKeys.internacaoTimeline(internacaoId) })
    }
  }

  /** Devolve true quando deu certo, para a tela fechar o formulário.
   *  `medico` e `hora` são obrigatórios (o backend recusa sem os dois). */
  async function agendar(data: string, medico: string, hora: string): Promise<boolean> {
    if (internacaoId == null) return false
    if (!data) {
      setErro('Escolha a data da visita')
      return false
    }
    if (!hora) {
      setErro('Escolha o horário da visita')
      return false
    }
    setSalvando(true)
    setErro(null)
    try {
      await agendarVisita(internacaoId, data, medico, hora)
      aoTerminar()
      return true
    } catch (e) {
      // A mensagem do backend é escrita para o usuário (ex.: a data já passou e
      // o caminho é registrar relatório), então vale mais que um texto genérico.
      setErro(e instanceof Error ? e.message : 'Não foi possível agendar a visita')
      return false
    } finally {
      setSalvando(false)
    }
  }

  async function desmarcar(): Promise<boolean> {
    if (internacaoId == null) return false
    setSalvando(true)
    setErro(null)
    try {
      await desmarcarVisita(internacaoId)
      aoTerminar()
      return true
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível cancelar a visita')
      return false
    } finally {
      setSalvando(false)
    }
  }

  return { agendar, desmarcar, salvando, erro, limparErro: () => setErro(null) }
}
