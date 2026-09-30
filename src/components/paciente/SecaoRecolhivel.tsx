// Seção de ação do drawer (Registrar relatório, Agendar visita) que abre e fecha.
//
// Cada ação tem cor própria: verde para o que JÁ aconteceu (relatório de visita
// realizada) e azul para o que VAI acontecer (visita agendada). A cor nunca é o
// único sinal: título, ícone e resumo dizem a mesma coisa em texto.
//
// Recolhida, a seção mostra o resumo no cabeçalho (ex.: a visita já marcada),
// para o técnico não precisar abrir só para conferir. Sempre nasce fechada:
// o drawer abre mostrando o paciente, e o formulário só quando pedido.
//
// Sem `overflow:hidden` no cartão: ele cortava o calendário e os combos que
// abrem por cima dos campos.
import { useState, type ReactNode } from 'react'

export type TomSecao = 'realizado' | 'futuro'

const TONS: Record<TomSecao, { cor: string; fundo: string }> = {
  realizado: { cor: 'var(--success)', fundo: 'var(--success-bg)' },
  futuro: { cor: 'var(--info)', fundo: 'var(--info-bg)' },
}

const estilos = `
.sr{border:1px solid var(--border);border-left:3px solid var(--sr-cor);border-radius:10px;background:var(--surface)}
.sr+.sr{margin-top:10px}
.sr-cab{all:unset;box-sizing:border-box;width:100%;display:flex;align-items:center;gap:12px;padding:12px 14px;cursor:pointer;border-radius:9px}
.sr[data-aberta="true"] .sr-cab{border-radius:9px 9px 0 0}
.sr-cab:hover{background:var(--surface-2)}
.sr-cab:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.sr-ico{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;flex-shrink:0;background:var(--sr-fundo);color:var(--sr-cor)}
.sr-titulo{display:block;font-size:var(--t-md);font-weight:600;color:var(--ink)}
.sr-resumo{display:block;font-size:var(--t-sm);color:var(--muted);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sr-seta{color:var(--muted-2);flex-shrink:0;transition:transform .15s}
.sr[data-aberta="true"] .sr-seta{transform:rotate(180deg)}
.sr-corpo{padding:14px 14px 16px;border-top:1px solid var(--border-soft);background:var(--surface-2);border-radius:0 0 9px 9px}
`

export function SecaoRecolhivel({ titulo, resumo, corResumo, icone, tom, abertaPadrao = false, children }: {
  titulo: string
  resumo?: ReactNode
  /** Cor do resumo quando ele é um alerta (ex.: visita atrasada). */
  corResumo?: string
  icone: ReactNode
  tom: TomSecao
  abertaPadrao?: boolean
  children: ReactNode
}) {
  const [aberta, setAberta] = useState(abertaPadrao)
  const { cor, fundo } = TONS[tom]

  return (
    <section className="sr" data-aberta={aberta} style={{ ['--sr-cor' as string]: cor, ['--sr-fundo' as string]: fundo }}>
      <style>{estilos}</style>
      <button type="button" className="sr-cab" onClick={() => setAberta((v) => !v)} aria-expanded={aberta}>
        <span className="sr-ico">{icone}</span>
        <span className="flex-1" style={{ minWidth: 0 }}>
          <span className="sr-titulo">{titulo}</span>
          {resumo && <span className="sr-resumo" style={corResumo ? { color: corResumo, fontWeight: 600 } : undefined}>{resumo}</span>}
        </span>
        <svg className="sr-seta" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {aberta && <div className="sr-corpo">{children}</div>}
    </section>
  )
}
