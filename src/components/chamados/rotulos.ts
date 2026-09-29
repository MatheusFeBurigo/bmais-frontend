// Textos e formatos dos chamados, separados dos componentes (um arquivo que
// exporta componente E constante quebra o fast refresh).
import type { StatusChamado } from '../../services/chamados.service'

/** O mesmo rótulo para os dois lados da conversa: diz de quem é a vez. */
export const STATUS_LABEL: Record<StatusChamado, string> = {
  aberto: 'Aguardando suporte',
  respondido: 'Respondido',
  encerrado: 'Encerrado',
  cancelado: 'Cancelado',
}

// Encerrado e cancelado têm cores diferentes: os dois ficam lado a lado na aba
// "Finalizados", e o que interessa ali é qual foi resolvido e qual foi desfeito.
export const STATUS_VARIANT: Record<StatusChamado, 'caution' | 'success' | 'info' | 'muted'> = {
  aberto: 'caution',
  respondido: 'success',
  encerrado: 'info',
  cancelado: 'muted',
}

/** A conversa terminou (encerrada pelo suporte ou cancelada). */
export function finalizado(status: StatusChamado): boolean {
  return status === 'encerrado' || status === 'cancelado'
}

/** Iniciais de quem abriu o chamado, para o avatar ("Ricardino Junior" → "RJ").
 *  Sem nome, cai no e-mail. */
export function iniciais(nome: string | null | undefined, email?: string | null): string {
  const base = (nome || (email || '').split('@')[0] || '').trim()
  const partes = base.split(/[\s._-]+/).filter(Boolean)
  if (partes.length === 0) return '?'
  const letras = partes.length >= 2
    ? partes[0][0] + partes[partes.length - 1][0]
    : partes[0].slice(0, 2)
  return letras.toUpperCase()
}

export const ASSUNTO_MAX = 120
export const MENSAGEM_MAX = 4000

/** Hora da mensagem: só `HH:MM` no dia, `dd/mm HH:MM` nos anteriores. Numa
 *  conversa a data completa em toda linha pesaria mais que o texto. */
export function quando(iso: string | null | undefined): string {
  if (!iso) return ''
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return ''
  const dois = (n: number) => String(n).padStart(2, '0')
  const hora = `${dois(dt.getHours())}:${dois(dt.getMinutes())}`
  const hoje = new Date()
  const mesmoDia = dt.getFullYear() === hoje.getFullYear()
    && dt.getMonth() === hoje.getMonth() && dt.getDate() === hoje.getDate()
  if (mesmoDia) return hora
  const dia = `${dois(dt.getDate())}/${dois(dt.getMonth() + 1)}`
  return dt.getFullYear() === hoje.getFullYear()
    ? `${dia} ${hora}`
    : `${dia}/${dt.getFullYear()} ${hora}`
}
