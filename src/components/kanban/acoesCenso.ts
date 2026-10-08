// Ações manuais sobre o card de censo. Todas pedem uma anotação do que aconteceu
// ("Falei com a Maria da recepção") antes de ir ao backend, que também a exige.
// Os textos de cada uma moram aqui para o card, o drawer e a modal dizerem o
// mesmo.
import type { KanbanTarefa } from '../../types/api'

export type AcaoCenso = 'cobrar' | 'desfazer' | 'atualizar' | 'desfazerAtualizado' | 'anotar'

const nomeDoCenso = (t: KanbanTarefa) =>
  `${t.hospital_nome || t.titulo || 'Hospital'}${t.operadora_nome ? ` (${t.operadora_nome})` : ''}`

export const ACOES_CENSO: Record<AcaoCenso, {
  /** Título da modal de anotação e rótulo do botão que a abre. */
  titulo: string
  /** Botão que confirma na modal. */
  confirmar: string
  placeholder: string
  sucesso: (t: KanbanTarefa) => string
}> = {
  cobrar: {
    titulo: 'Marcar como cobrado',
    confirmar: 'Marcar como cobrado',
    placeholder: 'Ex.: Falei com a Maria da recepção, envia até 14h',
    sucesso: (t) => `${nomeDoCenso(t)} cobrado. Aguardando retorno`,
  },
  atualizar: {
    titulo: 'Marcar como atualizado',
    confirmar: 'Marcar como atualizado',
    placeholder: 'Ex.: Maria confirmou que não há paciente novo hoje',
    sucesso: (t) => `${nomeDoCenso(t)} marcado como atualizado`,
  },
  desfazer: {
    titulo: 'Desfazer cobrança',
    confirmar: 'Desfazer cobrança',
    placeholder: 'Ex.: Marquei o hospital errado',
    sucesso: (t) => `Cobrança de ${nomeDoCenso(t)} desfeita`,
  },
  desfazerAtualizado: {
    titulo: 'Desfazer atualização',
    confirmar: 'Desfazer',
    placeholder: 'Ex.: O hospital vai mandar o censo de hoje',
    sucesso: (t) => `Atualização de ${nomeDoCenso(t)} desfeita`,
  },
  anotar: {
    titulo: 'Nova anotação',
    confirmar: 'Salvar anotação',
    placeholder: 'Ex.: Liguei às 10h e ninguém atendeu',
    sucesso: () => 'Anotação salva',
  },
}

/** Executa a ação com a anotação. Rejeita com o erro do backend, que a modal
 *  mostra sem fechar (o texto digitado não se perde). */
export type ExecutarCenso = (t: KanbanTarefa, acao: AcaoCenso, anotacao: string) => Promise<void>
