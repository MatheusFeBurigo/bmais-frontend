// Indicador de sincronização da Visão Geral (topbar): hora do dado mais recente
// em tela e um spinner discreto enquanto alguma revalidação está em voo — seja o
// polling automático, o refetch ao focar a aba ou o botão "Atualizar". Dá ao
// usuário a evidência de que a tela acompanha o backend sem ele fazer nada.
// Apresentação pura: a página calcula os valores (hooks) e passa por props.
import { Spinner } from '../ui'

function horaCurta(ts: number): string {
  return new Date(ts).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export default function StatusAtualizacao({ atualizadoEm, sincronizando, intervaloMs }: {
  /** Timestamp (ms) do dado mais recente na tela; 0 enquanto nada chegou. */
  atualizadoEm: number
  /** Alguma query da tela está buscando (automática ou manual). */
  sincronizando: boolean
  /** Intervalo do polling em ms; 0 = desligado (mostra só o horário). */
  intervaloMs: number
}) {
  const segundos = Math.round(intervaloMs / 1000)
  const title = intervaloMs > 0
    ? `Revalidado automaticamente a cada ${segundos}s com a aba visível, e ao voltar para ela.`
    : 'Atualização automática desligada — use "Atualizar".'
  return (
    <span
      className="row"
      style={{ gap: 6, fontSize: 'var(--t-xs)', color: 'var(--muted)', whiteSpace: 'nowrap' }}
      title={title}
      aria-live="polite"
    >
      {sincronizando
        ? <Spinner size={11} />
        : (
          <span
            aria-hidden
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success, #2e9e5b)', flexShrink: 0 }}
          />
        )}
      {atualizadoEm > 0
        ? <>Atualizado <span className="mono">{horaCurta(atualizadoEm)}</span>{intervaloMs > 0 && ` · auto ${segundos}s`}</>
        : 'Aguardando dados…'}
    </span>
  )
}
