// "Pausar prorrogação" / "Retomar prorrogação" no topo da ficha (08/10/2026).
//
// Só aparece depois que a prorrogação passou a valer, isto é, depois que o
// relatório com o pedido foi registrado (e aprovado, no caso do operacional):
// "o pausar prorrogação só deve aparecer quando eu registrar o relatório". Saiu
// da modal "Registrar relatório". Mesma rota e mesma regra do card da coluna
// "Em prorrogação" de Tarefas: admin e operacional (`controlarProrrogacao`).
import { usePausarProrrogacao } from '../../hooks/useKanban'
import type { InternacaoDados } from '../../types/api'

const estilos = `
.btn-pausa{gap:6px;color:var(--caution);border-color:color-mix(in srgb,var(--caution) 45%,transparent);font-weight:600}
.btn-pausa:hover:not(:disabled){background:var(--caution-bg);border-color:var(--caution)}
`

export function AcaoPausarProrrogacao({ d, onFeito }: {
  d: InternacaoDados
  onFeito: (msg: string) => void
}) {
  const pausar = usePausarProrrogacao()
  // Prorrogação valendo: ativa, no último dia ou pausada. A que terminou não
  // tem o que pausar.
  const vigente = Boolean(d.prorrogacao_ate)
    && ['ativa', 'termina_hoje', 'pausada'].includes(d.prorrogacao_situacao ?? '')
  if (!vigente) return null
  const pausada = d.prorrogacao_situacao === 'pausada'

  return (
    <>
      <style>{estilos}</style>
      <button
        type="button"
        className="btn btn-outline btn-sm btn-pausa"
        disabled={pausar.isPending}
        title={pausada ? 'Volta a contar a prorrogação' : 'Para de contar a prorrogação até retomar'}
        onClick={() => pausar.mutate({ internacaoId: d.id, pausada: !pausada }, {
          onSuccess: () => onFeito(pausada ? '✓ Prorrogação retomada' : '✓ Prorrogação pausada'),
          onError: (e) => onFeito(`Erro: ${(e as Error).message}`),
        })}
      >
        {pausada ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z" /></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
        )}
        {pausada ? 'Retomar prorrogação' : 'Pausar prorrogação'}
      </button>
    </>
  )
}
