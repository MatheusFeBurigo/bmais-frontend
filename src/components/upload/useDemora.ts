// Há quanto tempo o passo atual está rodando, e o que dizer sobre isso.
//
// A barra responde "quanto falta", mas não responde "isto é normal?". Um PDF de
// 600 linhas segura o mesmo arquivo por 40 segundos, e nesse intervalo a tela
// fica idêntica a uma tela travada: mesma porcentagem, mesmo nome de arquivo.
// Quem está esperando começa a duvidar do sistema justamente quando ele está
// trabalhando direito.
//
// O que este hook faz é medir o tempo do passo ATUAL (zera a cada arquivo que
// termina) e traduzir em uma mensagem que reconhece a demora. Não é um número
// para enfeitar: é a diferença entre "travou" e "está demorando, e o sistema
// sabe disso".
//
// A régua de tempo saiu da medida real do backend (ver a memória do projeto):
// ~1,3s por arquivo no caso comum, alguns segundos num PDF grande. Por isso o
// primeiro aviso só aparece aos 10s — antes disso a demora é normal e avisar
// sobre ela criaria alarme onde não há problema. Um aviso que aparece sempre
// vira ruído e deixa de ser lido, que é como se perde o canal de avisar.

import { useEffect, useState } from 'react'

/** Um recado sobre a espera. `nivel` decide a cor: `nota` é informativo,
 *  `atencao` é uma demora fora do esperado. */
export interface RecadoDemora {
  texto: string
  nivel: 'nota' | 'atencao'
}

// Os degraus, em segundos. Cada um substitui o anterior: a mensagem acompanha a
// espera em vez de repetir a mesma frase por dois minutos.
const DEGRAUS: Array<{ apos: number; recado: RecadoDemora }> = [
  {
    apos: 10,
    recado: {
      texto: 'Este arquivo é grande e está levando mais tempo. Pode deixar aberto.',
      nivel: 'nota',
    },
  },
  {
    apos: 30,
    recado: {
      texto: 'Ainda estamos lendo. Censos com muitos pacientes levam cerca de um minuto.',
      nivel: 'nota',
    },
  },
  {
    apos: 75,
    recado: {
      texto: 'A leitura está mais lenta que o normal, mas continua em andamento. '
        + 'Se parar de vez, o sistema avisa e os arquivos já lidos ficam salvos.',
      nivel: 'atencao',
    },
  },
]

/** Segundos desde que `passo` mudou. Serve para medir o arquivo da vez: mudou o
 *  passo, o relógio zera.
 *
 *  `ativo=false` congela em zero (nenhum envio em curso) e, principalmente,
 *  desmonta o intervalo — um timer de 1s rodando para sempre numa tela parada é
 *  trabalho puro sem ninguém para ver. */
export function useSegundosNoPasso(passo: string | number, ativo: boolean): number {
  const [segundos, setSegundos] = useState(0)

  useEffect(() => {
    if (!ativo) {
      setSegundos(0)
      return
    }
    // Zera na troca de passo (o arquivo anterior terminou) e conta pelo relógio,
    // não somando +1: a aba em segundo plano estrangula o setInterval, e um
    // contador incremental atrasaria em relação ao tempo real.
    const inicio = Date.now()
    setSegundos(0)
    const id = setInterval(() => {
      setSegundos(Math.floor((Date.now() - inicio) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [passo, ativo])

  return segundos
}

/** O recado que corresponde a esta espera, ou `null` enquanto ela for normal. */
export function recadoDaDemora(segundos: number): RecadoDemora | null {
  let atual: RecadoDemora | null = null
  for (const d of DEGRAUS) {
    if (segundos >= d.apos) atual = d.recado
  }
  return atual
}

/** `1min 20s` / `45s`. O minuto entra porque "95s" obriga a fazer a conta de
 *  cabeça para saber se a espera é longa. */
export function formatarEspera(segundos: number): string {
  if (segundos < 60) return `${segundos}s`
  const min = Math.floor(segundos / 60)
  const resto = segundos % 60
  return resto ? `${min}min ${resto}s` : `${min}min`
}
