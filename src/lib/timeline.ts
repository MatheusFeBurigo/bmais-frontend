// Reordenação da timeline de eventos de uma internação para exibição.
//
// O backend entrega ASCENDENTE (admissão primeiro, mais antigo → mais recente)
// com o marco "Hoje/Pendente" — o estado atual, sem data — no fim: é a ordem
// certa para a lógica de negócio (ex.: `_ORDEM_NO_DIA`, que decide se um
// relatório vem antes ou depois do agendamento que ele cumpre).
//
// Para leitura humana a ordem é a oposta: o mais recente no topo, como
// qualquer feed. Compartilhada entre PacienteDrawer e pages/Paciente.tsx —
// as duas telas mostram a mesma timeline, cada uma com seu próprio card.
import type { TimelineEvento } from '../types/api'

export function ordenarRecentePrimeiro(eventos: TimelineEvento[]): TimelineEvento[] {
  const hoje = eventos.filter((e) => e.hoje)
  // `.slice()` antes do `.reverse()`: não muta o array recebido, que pode ser
  // o mesmo objeto cacheado pelo React Query.
  const datados = eventos.filter((e) => !e.hoje).slice().reverse()
  return [...hoje, ...datados]
}

// Classe de cor por TIPO de evento — fonte única: nomeia tanto o marcador
// (.tl-dot.tp-*) quanto o card (.tl-card.tp-*) nas duas telas. Cada tipo tem
// sua cor padrão.
export const TIPO_CLASSE: Record<string, string> = {
  ADMISSAO: 'tp-admissao',
  RELATORIO: 'tp-relatorio',
  RELATORIO_INTERNO: 'tp-relatorio-interno',
  STATUS: 'tp-status',
  ALTA_AUTO: 'tp-alta-auto',
  EDIT: 'tp-edit',
  PENDENTE: 'tp-pendente',
  VISITA_AGENDADA: 'tp-visita-agendada',
  // Mantido só para o passivo: eventos gravados ANTES da migration 0034,
  // quando cancelar criava um SEGUNDO evento em vez de atualizar o de
  // agendamento. Nada volta a criar este tipo — ver `classeDoEvento` abaixo,
  // que decide a cor de um VISITA_AGENDADA vigente pelo `status_visita`.
  VISITA_DESMARCADA: 'tp-visita-cancelada',
}

/**
 * Classe de cor do evento: normalmente o TIPO decide (`TIPO_CLASSE`), mas
 * VISITA_AGENDADA cancelada (migration 0034) é o MESMO evento com um status
 * novo — cancelar faz UPDATE no evento de agendamento, não cria um segundo.
 * A cor do card precisa refletir o estado ATUAL, não o tipo gravado.
 */
export function classeDoEvento(ev: TimelineEvento): string | undefined {
  if (ev.tipo === 'VISITA_AGENDADA' && ev.status_visita === 'cancelada') {
    return 'tp-visita-cancelada'
  }
  return TIPO_CLASSE[ev.tipo]
}
