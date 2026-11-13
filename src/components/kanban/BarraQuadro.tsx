// Abas do quadro de Tarefas (13/11/2026, pedido do usuário: "melhore a barra").
//
// As abas (Pacientes, Censos, Acompanhamento, Pendências) ficam no topo do
// cartão da barra de busca e filtros, com ícone e o número do que cada uma
// conta. O número só fica vermelho onde é trabalho pendente; nas demais, neutro.
//
// Houve também um seletor de colunas (esconder/mostrar por aba), retirado no
// mesmo dia a pedido do usuário: ficou só a barra de busca e filtros.
//
// O componente Tabs genérico (Envio, Movimentações, Aprovações) não mudou.
import type { ReactNode } from 'react'

const svg = (d: ReactNode) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
)

export const ICONES_ABA: Record<string, ReactNode> = {
  pacientes: svg(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>),
  censos: svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></>),
  acompanhamento: svg(<path d="M22 12h-4l-3 9L9 3l-3 9H2" />),
  pendencias: svg(<path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8" />),
}

export interface AbaQuadro {
  key: string
  label: string
  count: number
  /** O que o número conta, para o balão: "tarefas pendentes", "pacientes"… */
  legenda: string
  /** true = o número é trabalho a fazer e fica vermelho quando passa de zero. */
  alerta?: boolean
}

export function QuadroAbas({ abas, ativa, onChange }: {
  abas: AbaQuadro[]
  ativa: string
  onChange: (key: string) => void
}) {
  return (
    <div className="kb-abas" role="tablist" aria-label="Quadros de Tarefas">
      {abas.map((a) => {
        const sel = a.key === ativa
        return (
          <button
            key={a.key}
            type="button"
            role="tab"
            aria-selected={sel}
            className={`kb-aba${sel ? ' ativa' : ''}`}
            title={`${a.count} ${a.legenda}`}
            onClick={() => onChange(a.key)}
          >
            <span className="kb-aba-ico">{ICONES_ABA[a.key]}</span>
            <span>{a.label}</span>
            <span className={`kb-aba-n${a.alerta && a.count > 0 ? ' alerta' : ''}`}>
              {a.count.toLocaleString('pt-BR')}
            </span>
          </button>
        )
      })}
    </div>
  )
}
