// Como o avanço é calculado na tela Progresso.
//
// Desde a migration 0031 a fonte da verdade é o percentual de CADA etapa. Tudo
// o mais é derivado daqui, e é isso que torna os números da diretoria
// consistentes: ajustar uma etapa move o módulo e o geral na mesma hora, sem
// três valores digitados à parte que podem se contradizer.
//
//   etapas [100, 100, 70, 20, 0, 0]  →  módulo 48%  →  geral = média dos módulos
//
// O modelo anterior (uma `etapa_atual` + um `pct` do módulo) tinha dois limites
// que o uso expôs: só uma etapa podia estar em curso — enquanto na prática os
// testes começam antes de a entrega terminar — e não havia como dizer QUANTO de
// uma etapa já fora feito.
import { ETAPAS, type FaseStatus } from './dados'

/** Situação de uma etapa a partir do seu percentual. */
export function faseDoPct(pct: number): FaseStatus {
  if (pct >= 100) return 'done'
  if (pct > 0) return 'current'
  return 'pending'
}

/** Avanço do módulo: média simples das etapas.
 *
 *  Simples, e não ponderada, porque nada no projeto diz que uma etapa pesa mais
 *  que outra — inventar pesos aqui seria fabricar precisão que a conferência
 *  não tem. Arredonda para inteiro: a tela não mostra casas decimais, e exibir
 *  "47%" enquanto o valor guardado é 47,3 confundiria quem confere. */
export function pctDoModulo(etapasPct: readonly number[]): number {
  if (etapasPct.length === 0) return 0
  const soma = etapasPct.reduce((a, b) => a + b, 0)
  return Math.round(soma / etapasPct.length)
}

/** Avanço geral: média dos módulos.
 *
 *  Também simples. O 35% do documento de origem era uma apuração própria que
 *  não batia com os módulos (220/10 = 22%); com o cálculo, o número do topo
 *  passa a ser explicável — é a média do que está na tela logo abaixo. */
export function pctGeral(modulos: readonly { pct: number }[]): number {
  if (modulos.length === 0) return 0
  const soma = modulos.reduce((a, m) => a + m.pct, 0)
  return Math.round(soma / modulos.length)
}

/** Percentuais por etapa de um ajuste feito ANTES da migration 0031.
 *
 *  Aqueles ajustes gravaram só uma `etapa_atual`: tudo antes dela conta como
 *  concluído, ela mesma como metade feita, o resto zerado. Meia etapa é um
 *  chute, mas é o mais honesto — dizer 0 apagaria o trabalho em curso, e 100
 *  daria por pronta uma etapa que está começando.
 *
 *  Sem isto, quem ajustou um módulo antes da 0031 veria tudo voltar ao catálogo
 *  e perderia a correção. `etapaAtual` nulo = módulo não iniciado. */
export function etapasPctDerivadas(etapaAtual: number | null | undefined): number[] {
  if (etapaAtual == null) return ETAPAS.map(() => 0)
  return ETAPAS.map((_, i) => {
    if (i + 1 < etapaAtual) return 100
    if (i + 1 === etapaAtual) return 50
    return 0
  })
}

/** Quantas etapas estão concluídas (100%). */
export function etapasConcluidas(etapasPct: readonly number[]): number {
  return etapasPct.filter((p) => p >= 100).length
}

/** As etapas em curso (entre 1 e 99), por índice. Pode ser mais de uma: é
 *  justamente o que o modelo de `etapa_atual` única não permitia dizer. */
export function etapasEmCurso(etapasPct: readonly number[]): number[] {
  return etapasPct.reduce<number[]>((acc, p, i) => {
    if (p > 0 && p < 100) acc.push(i)
    return acc
  }, [])
}
