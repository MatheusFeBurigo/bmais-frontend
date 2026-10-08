// Estado de uma lista com linha de entrada (o padrão do portal antigo:
// campos + "Adicionar" + tabela). Usado pelos períodos da prorrogação, pelas
// acomodações utilizadas e pelos blocos em lista do relatório completo.
import { useState } from 'react'

/** `proximo`: a linha de entrada depois de um "Adicionar" (ex.: o período
 *  seguinte começa no dia depois do fim do anterior). Sem ele, volta vazia. */
export function useLista<T extends object>(
  vazio: () => T,
  valido: (t: T) => boolean,
  proximo?: (adicionado: T) => T,
) {
  const [itens, setItens] = useState<T[]>([])
  const [rascunho, setRascunho] = useState<T>(vazio)
  // A linha como a tela a deixou (vazia ou sugerida, ex.: o período seguinte).
  // Sugestão que ninguém mexeu não é "linha pela metade".
  const [base, setBase] = useState<T>(vazio)
  const json = JSON.stringify(rascunho)
  const tocado = json !== JSON.stringify(vazio()) && json !== JSON.stringify(base)
  return {
    itens,
    rascunho,
    podeAdicionar: valido(rascunho),
    /** Rascunho preenchido pela metade: o registro pede para terminar ou limpar. */
    pendente: tocado && !valido(rascunho),
    mudar<K extends keyof T>(campo: K, valor: T[K]) {
      setRascunho((r) => ({ ...r, [campo]: valor }))
    },
    adicionar() {
      if (!valido(rascunho)) return
      setItens((xs) => [...xs, rascunho])
      const seguinte = proximo ? proximo(rascunho) : vazio()
      setRascunho(seguinte)
      setBase(seguinte)
    },
    remover(i: number) {
      setItens((xs) => xs.filter((_, j) => j !== i))
    },
    /** O item volta para a linha de entrada; a linha que estava completa entra
     *  na lista no lugar dele, para não se perder. */
    editar(i: number) {
      const item = itens[i]
      if (!item) return
      setItens((xs) => {
        const resto = xs.filter((_, j) => j !== i)
        return valido(rascunho) ? [...resto, rascunho] : resto
      })
      setRascunho(item)
      setBase(vazio())
    },
    /** Os itens e, se completa, a linha que ficou sem "Adicionar". */
    finais(): T[] {
      return valido(rascunho) ? [...itens, rascunho] : itens
    },
    /** Preenche a linha de entrada com uma sugestão (que, intocada, não conta
     *  como linha pela metade). */
    sugerir(r: T) {
      setRascunho(r)
      setBase(r)
    },
    carregar(novos: T[], rascunhoInicial?: T) {
      setItens(novos)
      setRascunho(rascunhoInicial ?? vazio())
      setBase(rascunhoInicial ?? vazio())
    },
  }
}

export type ListaRelatorio<T extends object> = ReturnType<typeof useLista<T>>
