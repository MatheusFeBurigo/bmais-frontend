// Etiqueta da prorrogação VIGENTE nos cards de paciente de Tarefas (08/10/2026:
// "quando prorrogado deve informar o paciente em prorrogado dentro das colunas
// de pacientes"). Mesmas situações de domain/prorrogacao.situacao: pausada,
// termina hoje, ativa. A que terminou não entra aqui: o card de "Sem relatório"
// tem etiqueta própria ("Prorrogação terminou em ...").
import { dataBR, hojeISO } from './datas'

export interface EtiquetaProrrogacao {
  texto: string
  titulo: string
  pausada: boolean
}

export function etiquetaProrrogacao(
  ate: string | null | undefined,
  pausada: boolean | null | undefined,
  hoje: string = hojeISO(),
): EtiquetaProrrogacao | null {
  const fim = (ate ?? '').slice(0, 10)
  if (!fim) return null
  if (pausada) {
    return { texto: 'Prorrogação pausada', titulo: `Prorrogado até ${dataBR(fim)}, com a prorrogação pausada`, pausada: true }
  }
  if (fim < hoje) return null
  if (fim === hoje) {
    return { texto: 'Prorrogação termina hoje', titulo: `Prorrogado até hoje (${dataBR(fim)})`, pausada: false }
  }
  return { texto: `Prorrogado até ${dataBR(fim).slice(0, 5)}`, titulo: `Prorrogação aprovada até ${dataBR(fim)}`, pausada: false }
}
