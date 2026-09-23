// Campos importantes em branco na ficha do paciente.
//
// A ficha aceita internação incompleta de propósito: muitos censos não imprimem
// data de internação, tipo de leito ou diagnóstico, e recusar o paciente por isso
// esconderia atendimento real (é a mesma decisão do validador do envio, em
// infrastructure/parsers/validador.py). O preço é que a ficha abre com campos
// vazios sem dizer QUAIS deles o sistema precisa — o usuário lê um "—" cinza igual
// ao de qualquer campo opcional e segue em frente.
//
// Aqui a ficha passa a apontar o que falta. "Importante" não é "vazio": é o campo
// de que alguma função do sistema depende. Diagnóstico, especialidade, médico,
// carteirinha e observações ficam de fora justamente por serem legítimos em branco
// na maioria dos censos — marcá-los deixaria quase toda ficha em âmbar e treinaria
// o usuário a ignorar o aviso, que é o que este módulo existe para evitar.
//
// Tipo de leito também ficou de fora (decisão do produto): a maior parte dos censos
// não imprime a categoria do leito, e o sistema já a infere do setor quando dá.

import type { InternacaoDados } from '../types/api'

/** Chave do campo na ficha, na ordem em que a ficha os exibe. */
export type CampoFicha = 'nome' | 'atendimento' | 'data_entrada' | 'leito_codigo'

export interface CampoIncompleto {
  campo: CampoFicha
  /** Rótulo exibido no resumo do topo (igual ao rótulo do campo na ficha). */
  label: string
  /** Por que o sistema precisa deste campo — dito em termos do trabalho, não do código. */
  porque: string
}

/** Rótulo de cada campo, idêntico ao que a ficha imprime acima do valor. */
const LABEL: Record<CampoFicha, string> = {
  nome: 'Nome do segurado',
  atendimento: 'Atendimento',
  data_entrada: 'Data internação',
  leito_codigo: 'Leito / código',
}

const PORQUE: Record<CampoFicha, string> = {
  nome: 'Sem nome nem senha de autorização não há como identificar o paciente.',
  atendimento: 'É a chave que liga este paciente aos próximos censos do hospital.',
  data_entrada: 'Sem ela não há contagem de dias internado nem gatilho de relatório.',
  leito_codigo: 'É como a equipe localiza o paciente na visita ao hospital.',
}

/** Ordem de exibição: a mesma da ficha, para o resumo ler de cima para baixo. */
const ORDEM: CampoFicha[] = ['nome', 'atendimento', 'data_entrada', 'leito_codigo']

function vazio(v?: string | number | null): boolean {
  // "—" é como a própria ficha desenha célula vazia; se ele chegou como VALOR
  // (dado gravado de um censo que imprimia o travessão), continua sendo ausência.
  const s = String(v ?? '').trim()
  return s === '' || s === '—'
}

/**
 * Quais campos importantes desta internação estão em branco.
 *
 * `nome` só conta como faltante quando também não há `senha`: censos sem coluna de
 * paciente identificam a internação pela senha de autorização, e nesses casos não
 * há nada a preencher — pedir o nome seria pedir um dado que o documento não tem.
 */
export function camposIncompletos(d: InternacaoDados): CampoIncompleto[] {
  const falta = new Set<CampoFicha>()

  if (vazio(d.nome) && vazio(d.senha)) falta.add('nome')
  if (vazio(d.atendimento)) falta.add('atendimento')
  if (vazio(d.data_entrada)) falta.add('data_entrada')
  if (vazio(d.leito_codigo)) falta.add('leito_codigo')

  return ORDEM.filter((c) => falta.has(c)).map((campo) => ({
    campo,
    label: LABEL[campo],
    porque: PORQUE[campo],
  }))
}
