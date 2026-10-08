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
  ALTA_MANUAL: 'tp-status',
  ALTA_DESFEITA: 'tp-edit',
  // Troca de acomodação negociada (folha rosa, 08/10/2026): rosa como o relatório.
  TROCA_ACOMODACAO: 'tp-folha-rosa',
  EDIT: 'tp-edit',
  PENDENTE: 'tp-pendente',
  VISITA_AGENDADA: 'tp-visita-agendada',
  // Ficha do paciente (0049): marcos derivados das internações juntas.
  TROCA_HOSPITAL: 'tp-troca-hospital',
  INTERNACAO_SIMULTANEA: 'tp-pendente',
  // Mantido só para o passivo: eventos gravados ANTES da migration 0034,
  // quando cancelar criava um SEGUNDO evento em vez de atualizar o de
  // agendamento. Nada volta a criar este tipo — ver `classeDoEvento` abaixo,
  // que decide a cor de um VISITA_AGENDADA vigente pelo `status_visita`.
  VISITA_DESMARCADA: 'tp-visita-cancelada',
  // Timeline do card de censo (Tarefas, aba Censos). Reaproveita as cores da
  // coluna para onde o movimento leva: cobrado → Aguardando retorno (laranja),
  // atualizado/censo recebido → Censos atualizados (verde).
  CENSO_COBRADO: 'tp-alta-auto',
  CENSO_ATUALIZADO: 'tp-relatorio',
  CENSO_RECEBIDO: 'tp-admissao',
  CENSO_COBRANCA_DESFEITA: 'tp-edit',
  CENSO_ATUALIZADO_DESFEITO: 'tp-edit',
  CENSO_NOTA: 'tp-status',
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
  // Relatório com folha rosa (0052): rosa claro no lugar do verde.
  if (ev.tipo === 'RELATORIO' && ev.folha_rosa) return 'tp-folha-rosa'
  return TIPO_CLASSE[ev.tipo]
}

// Evento de relatório (externo OU parecer interno). O tipo é a fonte confiável:
// o backend envia RELATORIO/RELATORIO_INTERNO. O regex no título é só fallback
// para registros legados, e não casa "Parecer do técnico interno", por isso a
// checagem por tipo vem primeiro.
export function ehRelatorio(ev: TimelineEvento): boolean {
  return ev.tipo === 'RELATORIO' || ev.tipo === 'RELATORIO_INTERNO' || /relat[óo]rio/i.test(ev.titulo)
}

/** Quem aparece no chip ao lado do título do evento. */
export type ChipDoEvento =
  | { tipo: 'medico'; nome: string; titulo?: string }
  | { tipo: 'autor'; autor: string }

/**
 * Regra única de exibição de um evento da timeline, usada pela ficha do paciente
 * e pelo drawer. As duas telas tinham cópias próprias que já divergiam (o drawer
 * não reconhecia o parecer interno como relatório; a ficha escondia o autor das
 * edições).
 *
 * Chip, por tipo de evento:
 *   - relatório externo: o médico responsável;
 *   - parecer interno: quem o fez (autor);
 *   - visita agendada: o responsável pela visita, não quem clicou em agendar.
 *     Continua aparecendo cancelada: "de quem era" a visita que não aconteceu
 *     é útil tanto quanto "de quem é" a que ainda vai;
 *   - demais eventos com autoria humana: o usuário que registrou. Marcos
 *     sintéticos e eventos de sistema não têm autor e ficam sem chip.
 */
export function apresentacaoDoEvento(ev: TimelineEvento) {
  const relatorio = ehRelatorio(ev)
  const interno = ev.tipo === 'RELATORIO_INTERNO'
  const visita = ev.tipo === 'VISITA_AGENDADA'
  const cancelada = visita && ev.status_visita === 'cancelada'
  // Tipos conhecidos viram card colorido; um tipo sem mapeamento (evento
  // legado) fica em linha simples com a variante do backend no marcador.
  const tipoClasse = classeDoEvento(ev)

  let chip: ChipDoEvento | null = null
  if (relatorio && interno && ev.autor) chip = { tipo: 'medico', nome: ev.autor, titulo: 'Autor' }
  else if (relatorio && !interno && ev.medico) chip = { tipo: 'medico', nome: ev.medico }
  else if (visita && ev.medico) chip = { tipo: 'medico', nome: ev.medico, titulo: 'Responsável' }
  else if (!relatorio && !visita && ev.autor) chip = { tipo: 'autor', autor: ev.autor }

  return {
    relatorio,
    cancelada,
    cardClass: tipoClasse ? `tl-card ${tipoClasse}` : '',
    dotClass: tipoClasse || ev.variante,
    // Hora só quando o evento traz: VISITA_AGENDADA (migration 0035) e os da
    // timeline do card de censo. Os demais não têm hora registrada, e um "—"
    // gratuito seria ruído.
    hora: ev.hora ? ev.hora.slice(0, 5) : null,
    chip,
  }
}
