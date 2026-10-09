// Catálogos do relatório completo da visita (0054). Espelho de
// `domain/relatorio_detalhes.py` no backend: o banco guarda a CHAVE, a tela
// mostra o rótulo.
import type { AcomodacaoUtilizada, DetalhesRelatorio, RelatorioItem, TimelineEvento } from '../types/api'
import { paraISO } from './datas'

export const CARATER = [
  { key: 'U', label: 'Urgência' },
  { key: 'E', label: 'Eletivo' },
] as const

// Clínico ou cirúrgico num campo só: no Márcia o "tipo" (geral, pediátrica,
// neonatal, obstétrica) só existe para a internação clínica.
export const TIPOS_INTERNACAO = [
  { key: 'clinica_geral', label: 'Clínica geral' },
  { key: 'clinica_pediatrica', label: 'Clínica pediátrica' },
  { key: 'clinica_neonatal', label: 'Clínica neonatal' },
  { key: 'clinica_obstetrica', label: 'Clínica obstétrica' },
  { key: 'cirurgica', label: 'Cirúrgica' },
] as const

export const TIPOS_ALTO_CUSTO = [
  { key: 'albumina', label: 'Albumina' },
  { key: 'imunoglobulina', label: 'Imunoglobulina' },
  { key: 'quimioterapicos', label: 'Quimioterápicos' },
  { key: 'antibioticos', label: 'Antibióticos' },
] as const

type Catalogo = readonly { key: string; label: string }[]

/** Rótulo da chave no catálogo; a própria chave se ela não estiver lá. */
export function rotulo(catalogo: Catalogo, key: string | null | undefined): string {
  if (!key) return ''
  return catalogo.find((c) => c.key === key)?.label ?? key
}

/** O último relatório que trouxe a classificação da internação: a modal abre
 *  com ela (no Márcia, caráter e tipo quase nunca mudam de uma visita a outra).
 *  `relatorios` vem do mais recente para o mais antigo. */
export function ultimaClassificacao(relatorios: RelatorioItem[] | undefined): DetalhesRelatorio | null {
  return relatorios?.find((r) => r.detalhes?.carater || r.detalhes?.tipo_internacao
    || r.detalhes?.acomodacoes?.length)?.detalhes ?? null
}

// O `tipo_leito` do censo (UTI, APARTAMENTO, ENFERMARIA) no nome do catálogo de
// acomodações da prorrogação (0047), o mesmo das acomodações utilizadas.
// HOMECARE e o que não casa ficam de fora: o backend recusa nome fora do catálogo.
const ACOMODACAO_DO_LEITO: Record<string, string> = {
  UTI: 'UTI',
  APARTAMENTO: 'Apartamento',
  ENFERMARIA: 'Enfermaria',
}

export function acomodacaoDoLeito(leito: string | null | undefined): string | null {
  const chave = (leito ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase()
  return ACOMODACAO_DO_LEITO[chave] ?? null
}

// Valores do censo que não são acomodação (o homecare e o legado "DESCONHECIDO").
const FORA_DO_CATALOGO = new Set(['HOMECARE', 'DESCONHECIDO'])

/** A acomodação de um evento MUDANCA_ACOMODACAO: o do censo e o da ficha trazem
 *  o `tipo_leito` ("APARTAMENTO"); o registrado no relatório já traz o nome do
 *  catálogo ("UTI Pediátrica", "SEMI"), que passa como está. */
function acomodacaoDoEvento(valor: string | null | undefined): string | null {
  const bruto = (valor ?? '').trim()
  if (!bruto || FORA_DO_CATALOGO.has(bruto.toUpperCase())) return null
  return acomodacaoDoLeito(bruto) ?? bruto
}

/** As acomodações utilizadas como o censo as capturou (08/10/2026: "já deve
 *  vir nativamente quando capturado pelo censo"): a de entrada desde a
 *  internação e, a cada MUDANCA_ACOMODACAO da timeline (do censo ou da edição
 *  da ficha), a seguinte a partir do dia da troca. A última é a atual (sem
 *  saída). Vazio quando nunca houve acomodação. */
export function acomodacoesDoCenso(
  eventos: TimelineEvento[] | undefined,
  dataEntrada: string | null | undefined,
  leitoAtual: string | null | undefined,
): AcomodacaoUtilizada[] {
  const mudancas = (eventos ?? [])
    .filter((e) => e.tipo === 'MUDANCA_ACOMODACAO' && !e.outra_internacao && e.data)
    .slice()
    .sort((a, b) => (a.data ?? '').localeCompare(b.data ?? ''))
  const entrada = paraISO(dataEntrada) || ''
  // A de entrada: a de onde a 1ª troca saiu; sem troca, a atual. Se a 1ª troca
  // não tem origem ("Entrou em UTI", registrada à mão), ela mesma é a de entrada.
  const primeira = mudancas.length ? acomodacaoDoEvento(mudancas[0].de) : acomodacaoDoLeito(leitoAtual)
  const trechos: AcomodacaoUtilizada[] = []
  if (primeira) trechos.push({ acomodacao: primeira, data_entrada: entrada, data_saida: null })
  for (const m of mudancas) {
    const para = acomodacaoDoEvento(m.para)
    const dia = paraISO(m.data)
    const aberta = trechos[trechos.length - 1]
    if (!aberta) {
      if (para) trechos.push({ acomodacao: para, data_entrada: entrada, data_saida: null })
      continue
    }
    if (!aberta.data_saida && aberta.acomodacao === para) continue
    // A troca é do dia em que foi vista: a anterior sai nele e a nova entra nele.
    if (!aberta.data_saida) aberta.data_saida = dia
    if (para) trechos.push({ acomodacao: para, data_entrada: dia, data_saida: null })
  }
  // Sem data de internação, a 1ª linha não tem entrada: fica de fora (o backend
  // exige a entrada), e as seguintes seguem.
  return trechos.filter((t) => t.data_entrada)
}
