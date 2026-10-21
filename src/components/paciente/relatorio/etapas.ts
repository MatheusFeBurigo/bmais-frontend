// As seções da modal "Registrar relatório" e a ordem delas (20/10/2026).
//
// A ordem é a de prioridade de preenchimento: as seções com campo obrigatório
// vêm primeiro (Relatório de visita e Quadro clínico), as opcionais depois, na
// ordem desta lista. A prorrogação, por exemplo, é opcional. Marcar uma seção
// como obrigatória a traz para cima; o que ela exige fica na regra de
// `useFormRelatorio.conferirSecao` e no asterisco do campo.
import type { SecaoRelatorio } from '../useFormRelatorio'

export interface Etapa {
  secao: SecaoRelatorio
  titulo: string
  obrigatoria: boolean
}

const SECOES: Etapa[] = [
  { secao: 'visita', titulo: 'Relatório de visita', obrigatoria: true },
  { secao: 'internacao', titulo: 'Quadro de internação', obrigatoria: false },
  { secao: 'quadro', titulo: 'Quadro clínico', obrigatoria: true },
  { secao: 'periodo', titulo: 'No período', obrigatoria: false },
  { secao: 'prorrogacao', titulo: 'Prorrogação', obrigatoria: false },
  { secao: 'negociacao', titulo: 'Negociação com o hospital', obrigatoria: false },
]

/** As seções na ordem da modal: as obrigatórias primeiro. */
export const ETAPAS: Etapa[] = [
  ...SECOES.filter((e) => e.obrigatoria),
  ...SECOES.filter((e) => !e.obrigatoria),
]

export const ETAPA = Object.fromEntries(ETAPAS.map((e) => [e.secao, e])) as Record<SecaoRelatorio, Etapa>
