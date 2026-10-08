// Perguntas de home care da alta com motivo Homecare (08/10/2026). Espelho de
// `domain/alta_homecare.py`: o banco guarda a CHAVE, a tela mostra o rótulo.
// Todas obrigatórias (no portal antigo, "é requerido" em cada uma); só a
// alimentação é opcional.

export const OXIGENIOTERAPIA = [
  { key: 'nao', label: 'Não' },
  { key: 'ventilacao_mecanica', label: 'Ventilação mecânica' },
  { key: 'o2_continuo', label: 'O₂ contínuo' },
  { key: 'o2_intermitente', label: 'O₂ intermitente' },
  { key: 'bipap_cpap', label: 'BIPAP/CPAP' },
] as const

export const MOBILIZACAO = [
  { key: 'sem_ajuda', label: 'Deambula sem ajuda' },
  { key: 'com_ajuda', label: 'Deambula com ajuda' },
  { key: 'restrito_leito', label: 'Restrito ao leito' },
] as const

export const CONSCIENCIA = [
  { key: 'lucido', label: 'Lúcido' },
  { key: 'confuso', label: 'Confuso' },
  { key: 'torporoso', label: 'Torporoso' },
  { key: 'comatoso', label: 'Comatoso' },
] as const

/** Perguntas Sim/Não do portal, na ordem da tela. */
export const SIM_NAO = [
  { key: 'solicitado', label: 'Home care solicitado' },
  { key: 'acesso_venoso', label: 'Acesso venoso' },
  { key: 'traqueostomia', label: 'Traqueostomia' },
  { key: 'curativo', label: 'Curativo' },
  { key: 'ostomias', label: 'Ostomias' },
] as const

// PROVISÓRIO: a lista do Márcia (mk_alimentacao, 4 linhas) não veio nos prints.
// Trocar pelos nomes reais quando chegarem, aqui e em domain/alta_homecare.py.
export const ALIMENTACAO = [
  { key: 'oral', label: 'Via oral' },
  { key: 'sonda_enteral', label: 'Sonda enteral' },
  { key: 'gastrostomia', label: 'Gastrostomia' },
  { key: 'parenteral', label: 'Parenteral' },
] as const

type SimNaoKey = (typeof SIM_NAO)[number]['key']

/** As respostas enquanto a janela está aberta: '' = ainda não respondida. */
export type RascunhoHomecare = Record<SimNaoKey, '' | 'sim' | 'nao'> & {
  oxigenioterapia: string
  mobilizacao: string
  consciencia: string
  alimentacao: string[]
}

/** O que vai para POST /internacao/{id}/alta com o motivo Homecare. */
export type HomecareAlta = Record<SimNaoKey, boolean> & {
  oxigenioterapia: string
  mobilizacao: string
  consciencia: string
  alimentacao: string[]
}

export const homecareVazio = (): RascunhoHomecare => ({
  solicitado: '', acesso_venoso: '', traqueostomia: '', curativo: '', ostomias: '',
  oxigenioterapia: '', mobilizacao: '', consciencia: '', alimentacao: [],
})

/** Todas as perguntas obrigatórias respondidas? */
export function homecareCompleto(r: RascunhoHomecare): boolean {
  return Boolean(r.oxigenioterapia && r.mobilizacao && r.consciencia)
    && SIM_NAO.every((p) => r[p.key] !== '')
}

export function homecareParaEnvio(r: RascunhoHomecare): HomecareAlta {
  return {
    solicitado: r.solicitado === 'sim',
    acesso_venoso: r.acesso_venoso === 'sim',
    traqueostomia: r.traqueostomia === 'sim',
    curativo: r.curativo === 'sim',
    ostomias: r.ostomias === 'sim',
    oxigenioterapia: r.oxigenioterapia,
    mobilizacao: r.mobilizacao,
    consciencia: r.consciencia,
    alimentacao: r.alimentacao,
  }
}
