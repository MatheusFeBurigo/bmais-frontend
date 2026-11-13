// Perguntas de home care. Espelho de `domain/alta_homecare.py`: o banco guarda
// a CHAVE, a tela mostra o rótulo. Nenhuma é obrigatória desde 13/11/2026
// (pedido do usuário: "os campos do homecare não são todos obrigatórios"):
// marcar o home care já registra, e a pergunta em branco vai como null.
//
// Desde 13/11/2026 vão no relatório, na seção "Home care" da modal, como a
// prorrogação (pedido do usuário: "homecare não deve virar alta, e sim um
// cadastro dentro do registro de relatório"). De 08/10 a 13/11 iam na alta com
// o motivo Homecare. O nome do arquivo é o de 08/10.
import type { HomecareRelatorio } from '../types/api'

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

export const homecareVazio = (): RascunhoHomecare => ({
  solicitado: '', acesso_venoso: '', traqueostomia: '', curativo: '', ostomias: '',
  oxigenioterapia: '', mobilizacao: '', consciencia: '', alimentacao: [],
})

// Sim/Não em branco = não respondido (null), nunca "não".
const simNaoParaEnvio = (v: '' | 'sim' | 'nao'): boolean | null => (v === '' ? null : v === 'sim')

export function homecareParaEnvio(r: RascunhoHomecare): HomecareRelatorio {
  return {
    solicitado: simNaoParaEnvio(r.solicitado),
    acesso_venoso: simNaoParaEnvio(r.acesso_venoso),
    traqueostomia: simNaoParaEnvio(r.traqueostomia),
    curativo: simNaoParaEnvio(r.curativo),
    ostomias: simNaoParaEnvio(r.ostomias),
    oxigenioterapia: r.oxigenioterapia || null,
    mobilizacao: r.mobilizacao || null,
    consciencia: r.consciencia || null,
    alimentacao: r.alimentacao,
  }
}

/** O rascunho a partir do que foi gravado (correção do relatório pendente). */
export function homecareParaRascunho(h: HomecareRelatorio): RascunhoHomecare {
  const sn = (v: boolean | null | undefined): '' | 'sim' | 'nao' => (v == null ? '' : v ? 'sim' : 'nao')
  return {
    solicitado: sn(h.solicitado), acesso_venoso: sn(h.acesso_venoso),
    traqueostomia: sn(h.traqueostomia), curativo: sn(h.curativo), ostomias: sn(h.ostomias),
    oxigenioterapia: h.oxigenioterapia ?? '', mobilizacao: h.mobilizacao ?? '',
    consciencia: h.consciencia ?? '', alimentacao: [...(h.alimentacao ?? [])],
  }
}

const rot = (lista: readonly { key: string; label: string }[], key?: string | null) =>
  lista.find((x) => x.key === key)?.label ?? ''

/** Uma linha com o que foi respondido, para o card do relatório, o topo da
 *  ficha e o card das Tarefas (o que ficou em branco não entra; nada
 *  respondido = ''). Mesma ordem de `alta_homecare.resumo`. */
export function resumoHomecare(h: HomecareRelatorio): string {
  const partes = [
    h.solicitado == null ? '' : h.solicitado ? 'Home care solicitado' : 'Home care não solicitado',
    rot(MOBILIZACAO, h.mobilizacao),
    rot(CONSCIENCIA, h.consciencia),
    !h.oxigenioterapia ? ''
      : h.oxigenioterapia === 'nao' ? 'Sem oxigenioterapia'
      : `Oxigenioterapia: ${rot(OXIGENIOTERAPIA, h.oxigenioterapia) || h.oxigenioterapia}`,
    ...(['acesso_venoso', 'traqueostomia', 'curativo', 'ostomias'] as const)
      .filter((k) => h[k]).map((k) => rot(SIM_NAO, k)),
    h.alimentacao?.length ? `Alimentação: ${h.alimentacao.map((a) => rot(ALIMENTACAO, a) || a).join(', ')}` : '',
  ]
  return partes.filter(Boolean).join(' · ')
}
