// Campo de data de um filtro que mora na URL (período da Visão Geral).
// Ligado direto à URL, o <input type="date"> só funcionava pelo calendário: a
// navegação do router roda em transição, então a cada tecla o React devolvia
// ao campo o valor antigo e o ano digitado nunca fechava. Aqui o campo tem
// rascunho próprio e só publica a data quando ela está completa e dentro dos
// limites — os anos parciais da digitação ("0002", "0020", "0202") não viram
// filtro. Vazio publica ao sair do campo, para apagar o dia e redigitar sem a
// lista piscar sem o filtro.
import { useState } from 'react'

/** Data digitada por inteiro: ISO com ano de 4 dígitos a partir de 1900. */
function completa(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && Number(v.slice(0, 4)) >= 1900
}

export default function CampoDataFiltro({ valor, onChange, min, max, ariaLabel }: {
  /** Data publicada (AAAA-MM-DD) ou '' sem filtro. */
  valor: string
  /** Recebe a data nova, ou '' para limpar. */
  onChange: (v: string) => void
  min?: string
  max?: string
  ariaLabel: string
}) {
  const [rascunho, setRascunho] = useState(valor)
  // Mudança vinda de fora (URL, "Limpar datas") substitui o rascunho.
  const [visto, setVisto] = useState(valor)
  if (valor !== visto) {
    setVisto(valor)
    setRascunho(valor)
  }

  const cabe = (v: string) => completa(v) && (!min || v >= min) && (!max || v <= max)

  function mudar(v: string) {
    setRascunho(v)
    if (v !== valor && cabe(v)) onChange(v)
  }

  // Ao sair: vazio limpa o filtro; data incompleta ou fora dos limites volta à
  // última publicada, para o campo nunca mostrar um período que não está valendo.
  function sair() {
    if (!rascunho) {
      if (valor) onChange('')
    } else if (!cabe(rascunho)) {
      setRascunho(valor)
    }
  }

  return (
    <input
      type="date"
      className="bm-input"
      style={{ width: 'auto' }}
      value={rascunho}
      min={min}
      max={max}
      onChange={(e) => mudar(e.target.value)}
      onBlur={sair}
      aria-label={ariaLabel}
    />
  )
}
