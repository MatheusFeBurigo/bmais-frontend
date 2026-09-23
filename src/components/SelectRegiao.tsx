// Seletor de região de um hospital — lista fechada, agrupada por macro-região.
//
// A região era texto livre na ficha. O resultado foi o previsível: 95 das 402
// linhas em branco e a mesma região grafada de formas diferentes. Como ela
// agora agrupa os hospitais na escolha de escopo do usuário, uma grafia
// divergente não é um detalhe cosmético: cria uma região fantasma com um
// hospital dentro, e quem procura o hospital no grupo certo não o encontra.
//
// Uma região gravada ANTES desta lista existir (ou vinda de outro caminho)
// continua aparecendo, num grupo "Fora do catálogo": o seletor não pode
// descartar em silêncio o valor que o hospital já tem, senão abrir a ficha e
// salvar sem tocar no campo apagaria a região.
import { GRUPOS_REGIOES, REGIOES } from '../lib/regioes'

export default function SelectRegiao({ value, onChange, id }: {
  value: string
  onChange: (v: string) => void
  id?: string
}) {
  const foraDoCatalogo = !!value && !REGIOES.includes(value)

  return (
    <select
      id={id}
      className="bm-input bm-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Sem região</option>
      {GRUPOS_REGIOES.map((g) => (
        <optgroup key={g.titulo} label={g.titulo}>
          {g.regioes.map((r) => <option key={r} value={r}>{r}</option>)}
        </optgroup>
      ))}
      {foraDoCatalogo && (
        <optgroup label="Fora do catálogo">
          <option value={value}>{value}</option>
        </optgroup>
      )}
    </select>
  )
}
