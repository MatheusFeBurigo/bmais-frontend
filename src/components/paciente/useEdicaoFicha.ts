// Modo edição do card "Dados do Paciente": rascunho local aplicado sobre `d`.
import { useEffect, useState } from 'react'
import { useEditarInternacao } from '../../hooks/useInternacao'
import type { InternacaoEdicao } from '../../services/internacao.service'
import type { InternacaoDados } from '../../types/api'
import { payloadDaEdicao, rascunhoDe } from './paciente.model'

export function useEdicaoFicha(internacaoId: number, d: InternacaoDados | undefined, {
  onSalvo,
}: {
  onSalvo: (mensagem: string) => void
}) {
  const editar = useEditarInternacao(internacaoId)
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState<InternacaoEdicao>({})
  const [erro, setErro] = useState<string | null>(null)

  // Se os dados somem enquanto edita (ex.: invalidação externa), sair do modo
  // edição evita sobrescrever com um rascunho defasado.
  useEffect(() => {
    if (!d) setEditando(false)
  }, [d])

  function abrir() {
    if (!d) return
    setRascunho(rascunhoDe(d))
    setErro(null)
    setEditando(true)
  }

  function cancelar() {
    setEditando(false)
    setErro(null)
  }

  function setCampo<K extends keyof InternacaoEdicao>(campo: K, valor: string) {
    setRascunho((r) => ({ ...r, [campo]: valor }))
  }

  async function salvar() {
    if (!d) return
    setErro(null)
    try {
      const res = await editar.mutateAsync(payloadDaEdicao(rascunho, d))
      setEditando(false)
      onSalvo(res.atualizado === false ? 'Nada foi alterado' : '✓ Dados atualizados')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao salvar')
    }
  }

  return { editando, rascunho, erro, salvando: editar.isPending, abrir, cancelar, setCampo, salvar }
}

export type EdicaoFicha = ReturnType<typeof useEdicaoFicha>
