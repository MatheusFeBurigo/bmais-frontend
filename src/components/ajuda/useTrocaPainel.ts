// Troca animada entre os dois estados da barra lateral (menu do sistema x
// módulos da Ajuda).
//
// O problema que isto resolve: trocar o conteúdo por um ternário simples faz o
// painel antigo DESAPARECER no mesmo quadro em que o novo entra. Só o que
// chega é animado, e a troca parece um corte. Aqui o painel que sai fica em
// cena por DURACAO_MS, com a classe de saída, e só então é desmontado.
import { useEffect, useState } from 'react'

// Mesma ordem de grandeza do resto da barra (`sb-sub-in`, .22s). Se mudar aqui,
// mude junto no CSS: os dois precisam terminar juntos, senão o painel é
// desmontado no meio do movimento.
export const DURACAO_MS = 220

export interface TrocaPainel {
  /** Qual painel renderizar agora: durante a saída ainda é o ANTERIOR. */
  ajuda: boolean
  /** Classe de animação a aplicar no painel em cena. */
  classe: string
}

/** `alvo` = true quando a rota atual é a Ajuda. */
export function useTrocaPainel(alvo: boolean): TrocaPainel {
  const [ajuda, setAjuda] = useState(alvo)
  const [fase, setFase] = useState<'parado' | 'saindo' | 'entrando'>('parado')

  useEffect(() => {
    if (alvo === ajuda) {
      // Voltou para o painel que já está em cena antes de ele terminar de sair
      // (clicar em Ajuda e no Voltar em seguida, dentro dos 220ms). O timer da
      // troca foi cancelado no cleanup, então sem isto a fase ficaria presa em
      // 'saindo': o painel correto continuaria esmaecido e SEM CLIQUE, pelo
      // pointer-events da classe. Traz ele de volta.
      setFase((f) => (f === 'saindo' ? 'entrando' : f))
      return
    }
    // 1) O painel atual sai de cena...
    setFase('saindo')
    const t = setTimeout(() => {
      // 2) ...e só então o novo assume e entra.
      setAjuda(alvo)
      setFase('entrando')
    }, DURACAO_MS)
    return () => clearTimeout(t)
  }, [alvo, ajuda])

  // Limpa a classe ao fim da entrada: pendurada, ela reanimaria o painel a cada
  // re-render (e a barra re-renderiza a cada clique de módulo).
  useEffect(() => {
    if (fase !== 'entrando') return
    const t = setTimeout(() => setFase('parado'), DURACAO_MS)
    return () => clearTimeout(t)
  }, [fase])

  // Sentido do deslize: ir para a Ajuda avança (o painel sai pela esquerda e o
  // próximo entra pela direita); voltar ao menu recua. Como `alvo` já é o
  // destino nas duas fases, ele sozinho define o sentido da dupla.
  const sentido = alvo ? 'avanca' : 'recua'
  const classe = fase === 'parado' ? '' : `sb-troca-${fase} sb-troca-${sentido}`

  return { ajuda, classe }
}
