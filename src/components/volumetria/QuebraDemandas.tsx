// Linhas "rótulo … número" da quebra de demandas — os mesmos nomes e cores das
// colunas de Tarefas, para o coordenador ler o cartão como leria o quadro da
// pessoa. `compacto` esconde linhas zeradas (cartão); o drawer mostra todas.
import type { LinhaQuebra } from './volumetria.model'

export default function QuebraDemandas({ linhas, compacto }: {
  linhas: LinhaQuebra[]
  compacto?: boolean
}) {
  const visiveis = compacto ? linhas.filter((l) => l.valor > 0) : linhas
  if (visiveis.length === 0) {
    return <div className="vol-q-vazio">Nenhuma demanda aberta</div>
  }
  return (
    <ul className="vol-q">
      {visiveis.map((l) => (
        <li key={l.key}>
          <i style={{ background: l.cor }} aria-hidden="true" />
          <span className="vol-q-label">
            {l.label}
            {l.sub && <small>{l.sub}</small>}
          </span>
          <b>{l.valor}</b>
        </li>
      ))}
    </ul>
  )
}
