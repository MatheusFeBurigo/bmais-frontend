// "Desfazer lote" na linha de Movimentações (27/10/2026). Pedido do usuário:
// "implemente na tela de movimentacoes um componente que me permite desfazer um
// lote de pacientes", nas linhas de "Censo processado".
//
// Um lote é UM arquivo de um envio de censo (o desfazer do backend já trabalha
// por arquivo: `/upload/envios/{sessao}/reverter?arquivo=`). O estado vem da
// lista de envios, e não da trilha: é ela que diz se o arquivo já foi desfeito.
// Envio fora dessa lista (antigo demais, ou de hospital fora do escopo) não
// mostra nada, porque o backend também não o desfaria.
import type { EnvioCenso } from '../../services/censos.service'
import { dataHora } from '../../lib/datas'
import type { LoteDoRegistro } from './logs.model'

export default function DesfazerLote({ lotes, envios, desfazendo, onDesfazer }: {
  lotes: LoteDoRegistro[]
  envios: ReadonlyMap<string, EnvioCenso>
  /** `sessao|arquivo` do lote em reversão: trava o botão dele. */
  desfazendo: string | null
  onDesfazer: (lote: LoteDoRegistro) => void
}) {
  const varios = lotes.length > 1
  const itens = lotes.flatMap((lote) => {
    // O mesmo nome pode aparecer duas vezes na sessão (arquivo reprocessado pelo
    // assistente): desfeito só quando todas as ocorrências estão.
    const doArquivo = (envios.get(lote.sessao)?.por_arquivo ?? []).filter((a) => a.arquivo === lote.arquivo)
    if (doArquivo.length === 0) return []
    const aberto = doArquivo.some((a) => !a.revertido_em)
    const quando = doArquivo.map((a) => a.revertido_em).filter(Boolean).sort().pop()
    return [{ lote, aberto, quando }]
  })
  if (itens.length === 0) return null

  return (
    <span className="logs-lote" onClick={(e) => e.stopPropagation()}>
      {itens.map(({ lote, aberto, quando }) => {
        const chave = `${lote.sessao}|${lote.arquivo}`
        if (!aberto) {
          return (
            <span key={chave} className="logs-lote-feito" title={quando ? `Desfeito em ${dataHora(quando)}` : undefined}>
              {varios ? `${lote.arquivo}: lote desfeito` : 'Lote desfeito'}
            </span>
          )
        }
        return (
          <button key={chave} type="button" className="btn btn-ghost btn-sm logs-lote-btn"
                  disabled={desfazendo === chave}
                  title={`Apaga os pacientes que ${lote.arquivo} criou${lote.hospital ? ` em ${lote.hospital}` : ''}`}
                  onClick={() => onDesfazer(lote)}>
            {desfazendo === chave ? 'Desfazendo…' : varios ? `Desfazer ${lote.arquivo}` : 'Desfazer lote'}
          </button>
        )
      })}
    </span>
  )
}
