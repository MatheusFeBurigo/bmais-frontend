// Equipe fictícia das réplicas da Distribuição de tarefas, na Ajuda.
//
// Arquivo só de dados, separado das réplicas: a réplica de produtividade usa
// Chart.js e entra sob demanda (lazy), e precisa da MESMA equipe que as
// réplicas carregadas de imediato. Arquivo de componente que também exporta
// constante quebra o fast refresh, por isso os dados moram aqui.
//
// Quatro técnicos, um em cada situação que a tela distingue (sobrecarga,
// atenção, normal e sem área definida).
import type {
  VolumetriaDivisao, VolumetriaGrupo, VolumetriaMinutosCategoria, VolumetriaPessoa, VolumetriaQuebra,
} from '../../types/api'
import { SEM_REGIAO } from '../../lib/regioes'

/** Minutos por categoria a partir da quebra, para a barra de tempo bater com a
 *  contagem de cada pessoa (a tela real garante isso, e a réplica também). */
function minutos(q: VolumetriaQuebra): VolumetriaMinutosCategoria {
  return {
    sem_relatorio: (q.sem_relatorio ?? 0) * 38,
    aguardando_visita: (q.aguardando_visita ?? 0) * 32,
    visitas_atrasadas: (q.visitas_atrasadas ?? 0) * 34,
    vencido: (q.vencido ?? 0) * 36,
    proximo_vencer: (q.proximo_vencer ?? 0) * 30,
  }
}

function pessoa(dados: {
  id: string; nome: string; nivel: VolumetriaPessoa['nivel']; dias: number; pressao: number
  hospitais: number; pacientes: number; quebra: VolumetriaQuebra
  regioes: Array<[string, number, number]>
  concluidas: number
}): VolumetriaPessoa {
  const min = minutos(dados.quebra)
  const total = Object.values(min).reduce((s, v) => s + (v ?? 0), 0)
  const pend = (dados.quebra.sem_relatorio ?? 0) + (dados.quebra.aguardando_visita ?? 0)
    + (dados.quebra.visitas_atrasadas ?? 0) + (dados.quebra.vencido ?? 0) + (dados.quebra.proximo_vencer ?? 0)
  return {
    user_id: dados.id, nome: dados.nome, sem_nome: false, email: `${dados.id}@exemplo.com`,
    sem_vinculo: false, total_pendencias: pend, horas: total / 60, dias_fila: dados.dias,
    pressao_pct: dados.pressao, nivel: dados.nivel, capacidade_horas_dia: 6, capacidade_propria: false,
    hospitais: [], hospitais_n: dados.hospitais, quebra: dados.quebra, pacientes: dados.pacientes,
    regioes: dados.regioes.map(([regiao, hospitais, pacientes]) => ({
      regiao, hospitais, pacientes, pendencias: 0, horas: 0,
    })),
    minutos_categoria: min,
    concluidas: dados.concluidas,
  }
}

export const JULIANA = pessoa({
  id: 'juliana', nome: 'Juliana Prado', nivel: 'sobrecarga', dias: 4.6, pressao: 142, hospitais: 4, pacientes: 61,
  quebra: { internados: 61, em_monitoramento: 38, sem_relatorio: 14, aguardando_visita: 6, visitas_atrasadas: 3, vencido: 9, proximo_vencer: 6 },
  regioes: [['Campinas', 3, 48], ['SP - Zona Sul', 1, 13]],
  concluidas: 31,
})
export const MARCOS = pessoa({
  id: 'marcos', nome: 'Marcos Tavares', nivel: 'atencao', dias: 2.4, pressao: 95, hospitais: 3, pacientes: 34,
  quebra: { internados: 34, em_monitoramento: 22, sem_relatorio: 8, aguardando_visita: 4, visitas_atrasadas: 1, vencido: 3, proximo_vencer: 4 },
  regioes: [['Campinas', 2, 21], [SEM_REGIAO, 1, 13]],
  concluidas: 44,
})
export const BEATRIZ = pessoa({
  id: 'beatriz', nome: 'Beatriz Lemos', nivel: 'normal', dias: 1.0, pressao: 40, hospitais: 2, pacientes: 18,
  quebra: { internados: 18, em_monitoramento: 11, sem_relatorio: 3, aguardando_visita: 3, visitas_atrasadas: 0, vencido: 1, proximo_vencer: 2 },
  regioes: [['SP - Zona Sul', 2, 18]],
  concluidas: 58,
})
export const RAFAEL: VolumetriaPessoa = {
  user_id: 'rafael', nome: 'Rafael Costa', sem_nome: false, email: 'rafael@exemplo.com', sem_vinculo: true,
  total_pendencias: null, horas: null, dias_fila: null, pressao_pct: null, nivel: null,
  capacidade_horas_dia: 6, capacidade_propria: false, hospitais: [], hospitais_n: 0, quebra: null,
  pacientes: null, regioes: [], minutos_categoria: {}, concluidas: 9,
}

export const PESSOAS = [JULIANA, MARCOS, BEATRIZ, RAFAEL]

/** Entregas dos últimos 30 dias até 26/09/2026: dia útil entre 3 e 9, fim de
 *  semana 0 ou 1. O total fecha com a soma das pessoas, como na tela real. */
function produtividade(): VolumetriaGrupo['produtividade'] {
  const util = [6, 8, 5, 9, 7, 4, 6, 8, 3, 7]
  const fim = new Date(Date.UTC(2026, 8, 26))
  const por_dia = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(fim.getTime() - (29 - i) * 86400000)
    const semana = d.getUTCDay() === 0 || d.getUTCDay() === 6
    return { dia: d.toISOString().slice(0, 10), concluidas: semana ? i % 2 : util[i % util.length] }
  })
  const alvo = PESSOAS.reduce((s, p) => s + p.concluidas, 0)
  const soma = por_dia.reduce((s, d) => s + d.concluidas, 0)
  // Acerta a diferença no último dia útil, para a série somar o mesmo que as pessoas.
  const ultimoUtil = [...por_dia].reverse().find((d) => d.concluidas > 1)
  if (ultimoUtil) ultimoUtil.concluidas = Math.max(0, ultimoUtil.concluidas + alvo - soma)
  return { dias: 30, por_dia, total: alvo, fora_do_grupo: 4 }
}

function somar(chave: keyof VolumetriaQuebra): number {
  return PESSOAS.reduce((s, p) => s + (p.quebra?.[chave] ?? 0), 0)
}

export const GRUPO: VolumetriaGrupo = {
  papel: 'coordenador_tecnico',
  role_operacional: 'tecnico',
  total_pendencias: PESSOAS.reduce((s, p) => s + (p.total_pendencias ?? 0), 0),
  total_horas: PESSOAS.reduce((s, p) => s + (p.horas ?? 0), 0),
  total_pacientes: 113,
  quebra: {
    internados: 113, em_monitoramento: somar('em_monitoramento'), sem_relatorio: somar('sem_relatorio'),
    aguardando_visita: somar('aguardando_visita'), visitas_atrasadas: somar('visitas_atrasadas'),
    vencido: somar('vencido'), proximo_vencer: somar('proximo_vencer'),
  },
  pessoas: PESSOAS,
  sem_cobertura: [
    { hospital_key: 'bela_vista', hospital_nome: 'Hospital Bela Vista', operadora_key: 'careplus',
      pendencias: 7, horas: 4.4, internados: 12, quebra: { sem_relatorio: 5, vencido: 2 },
      minutos_categoria: { sem_relatorio: 190, vencido: 72 } },
    { hospital_key: 'santa_rita', hospital_nome: 'Hospital Santa Rita', operadora_key: 'porto',
      pendencias: 3, horas: 1.8, internados: 6, quebra: { sem_relatorio: 3 },
      minutos_categoria: { sem_relatorio: 108 } },
  ],
  regioes: [
    { regiao: 'Campinas', responsaveis: [{ user_id: 'juliana', nome: 'Juliana Prado' }, { user_id: 'marcos', nome: 'Marcos Tavares' }],
      hospitais: 4, pacientes: 69, pendencias: 41, horas: 24.6 },
    { regiao: 'SP - Zona Sul', responsaveis: [{ user_id: 'juliana', nome: 'Juliana Prado' }, { user_id: 'beatriz', nome: 'Beatriz Lemos' }],
      hospitais: 3, pacientes: 31, pendencias: 16, horas: 9.1 },
    { regiao: SEM_REGIAO, responsaveis: [{ user_id: 'marcos', nome: 'Marcos Tavares' }],
      hospitais: 1, pacientes: 13, pendencias: 5, horas: 2.9 },
  ],
  minutos_categoria: {},
  produtividade: produtividade(),
  divisoes: [],
  parametros: {
    minutos_leito: { UTI: 45, APARTAMENTO: 30, ENFERMARIA: 25 },
    fator_longa_10: 1.2, fator_longa_30: 1.5, fator_reanalise: 0.7,
    capacidade_horas_dia: 6, capacidade_por_pessoa: {}, prazo_dias: 3,
    limiares: { fila_atencao_dias: 2, fila_sobrecarga_dias: 4, pressao_atencao_pct: 100, pressao_sobrecarga_pct: 130 },
  },
  parametros_meta: { personalizado: true, atualizado_por: 'Camila Freitas', atualizado_em: '2026-09-22T14:00:00Z' },
}
GRUPO.minutos_categoria = PESSOAS.reduce<VolumetriaMinutosCategoria>((acc, p) => {
  for (const [k, v] of Object.entries(p.minutos_categoria)) {
    const chave = k as keyof VolumetriaQuebra
    acc[chave] = (acc[chave] ?? 0) + (v ?? 0)
  }
  return acc
}, {})

export const HOSPITAIS_DA_JULIANA: Array<{
  key: string; nome: string; op: string; pacientes: number; horas: number; compartilhado: number; quebra: VolumetriaQuebra
}> = [
  { key: 'santa_clara', nome: 'Hospital Santa Clara', op: 'careplus', pacientes: 28, horas: 13.1, compartilhado: 1,
    quebra: { sem_relatorio: 7, aguardando_visita: 3, visitas_atrasadas: 2, vencido: 5, proximo_vencer: 3 } },
  { key: 'sao_lucas', nome: 'Hospital São Lucas', op: 'porto', pacientes: 20, horas: 8.2, compartilhado: 0,
    quebra: { sem_relatorio: 5, aguardando_visita: 2, visitas_atrasadas: 1, vencido: 3, proximo_vencer: 2 } },
  { key: 'vila_nova', nome: 'Hospital Vila Nova', op: 'sulamerica', pacientes: 13, horas: 3.8, compartilhado: 1,
    quebra: { sem_relatorio: 2, aguardando_visita: 1, vencido: 1, proximo_vencer: 1 } },
]

/** A divisão que o passo a passo monta: Juliana cede dois hospitais a Beatriz
 *  por dois dias. */
const DIVISAO: VolumetriaDivisao = {
  lote: 'exemplo', de_user_id: 'juliana', de_nome: 'Juliana Prado',
  inicio: '2026-09-26', fim: '2026-09-27', vigente: true, criado_por: 'Camila Freitas',
  itens: [
    { hospital_key: 'sao_lucas', hospital_nome: 'Hospital São Lucas', para_user_id: 'beatriz', para_nome: 'Beatriz Lemos' },
    { hospital_key: 'vila_nova', hospital_nome: 'Hospital Vila Nova', para_user_id: 'beatriz', para_nome: 'Beatriz Lemos' },
  ],
}

/** O mesmo grupo durante a divisão: o cartão de Juliana avisa até quando a
 *  carga está dividida, e o de Beatriz, com quantos hospitais ela está ajudando.
 *  Os números de carga ficam os de antes: o exemplo mostra os avisos, não o
 *  recálculo. */
export const GRUPO_DIVIDIDO: VolumetriaGrupo = {
  ...GRUPO,
  divisoes: [DIVISAO],
  pessoas: GRUPO.pessoas.map((p) => p.user_id !== 'beatriz' ? p : {
    ...p,
    hospitais: DIVISAO.itens.map((it) => ({
      hospital_key: it.hospital_key, hospital_nome: it.hospital_nome, operadora_key: null,
      pendencias: 0, horas: 0, quebra: {}, compartilhado_com: 0, regiao: 'Campinas', minutos_categoria: {},
      temporario: { de_user_id: 'juliana', de_nome: 'Juliana Prado', fim: DIVISAO.fim, lote: DIVISAO.lote },
    })),
  }),
}
