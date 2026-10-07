// Regras de exibição e edição da ficha do paciente. Funções puras: sem estado,
// sem chamada ao servidor.
import { dataBR, paraISO } from '../../lib/datas'
import type { InternacaoEdicao } from '../../services/internacao.service'
import type { InternacaoDados } from '../../types/api'

// Opções dos campos com domínio fechado no modo edição. "" = manter em branco.
export const STATUS_OPCOES = ['INTERNADO', 'ALTA', 'OBITO', 'TRANSFERIDO']
export const LEITO_OPCOES = ['UTI', 'APARTAMENTO', 'ENFERMARIA']
// Homecare: paciente fora do hospital, que o censo não altera e só a alta
// manual encerra. Só técnico e admin escolhem ou tiram (`leitoHomecare`).
export const LEITO_HOMECARE = 'HOMECARE'

/** Recém-nascido. A regra mora no servidor (nome "RN de ...", idade ou
 *  nascimento) e chega pronta em `rn`; aqui só se escreve. */
export function rnLabel(d: InternacaoDados): string {
  return d.rn ? 'SIM' : 'NÃO'
}

/** Data da alta, ou "PERMANECE" enquanto o paciente está internado.
 *  Antes o campo decidia pela data da última visita e ignorava `data_alta`,
 *  então a data real da alta nunca aparecia. */
export function textoDataAlta(d: InternacaoDados): string {
  if (d.data_alta) return comHora(dataBR(d.data_alta) || d.data_alta, d.hora_alta)
  return d.status === 'INTERNADO' || !d.status ? 'PERMANECE' : '—'
}

/** "24/09/2026" + "11:30" → "24/09/2026 11:30". A hora vem do censo quando ele
 *  a imprime; sem ela fica só a data. Segundos ("11:30:00") não acrescentam nada
 *  na leitura e caem. */
export function comHora(data: string, hora?: string | null): string {
  const h = (hora ?? '').trim().slice(0, 5)
  return h ? `${data} ${h}` : data
}

/** Rascunho da edição, semeado com os valores atuais. */
export function rascunhoDe(d: InternacaoDados): InternacaoEdicao {
  return {
    nome: d.nome ?? '',
    senha: d.senha ?? '',
    atendimento: d.atendimento ?? '',
    carteirinha: d.carteirinha ?? '',
    // ISO: é o único formato que o <input type="date"> exibe, e o banco guarda
    // "17/08/2026". Sem converter, o campo abria VAZIO na ficha de quase todo
    // paciente e parecia dado perdido.
    data_entrada: paraISO(d.data_entrada),
    tipo_leito: d.tipo_leito ?? '',
    leito_codigo: d.leito_codigo ?? '',
    especialidade: d.especialidade ?? '',
    diagnostico: d.diagnostico ?? '',
    medico: d.medico ?? '',
    idade: d.idade ?? '',
    sexo: d.sexo ?? '',
    status: d.status ?? '',
    obs: d.obs ?? '',
  }
}

/** O que vai para o servidor ao salvar.
 *  A data volta ao valor cru se não foi tocada: as que o input não exibe (ano de
 *  2 dígitos) abrem vazias, e mandar esse vazio APAGARIA a data gravada. Mesma
 *  regra da modal do envio. */
export function payloadDaEdicao(rascunho: InternacaoEdicao, d: InternacaoDados): InternacaoEdicao {
  return {
    ...rascunho,
    data_entrada: rascunho.data_entrada === paraISO(d.data_entrada)
      ? (d.data_entrada ?? '')
      : (rascunho.data_entrada ?? ''),
  }
}
