// Blocos de apresentação da Ajuda: as formas que o texto da documentação assume
// (pastilha de status, destaque, tabela descritiva, cartão de indicador, passo).
//
// Existem para que os 14 módulos sejam escritos como conteúdo, e não como
// markup: um módulo novo compõe estes blocos em vez de repetir <div className>.
import type { ReactNode } from 'react'

export type Tom = 'critical' | 'warn' | 'attention' | 'positive' | 'neutral' | 'brand'

/** Pastilha de status/nível. `plain` tira o ponto colorido — usada quando o
 *  texto já é a informação (Sim/Não), e não um status do sistema. */
export function Chip({ tom, plain, children }: { tom: Tom; plain?: boolean; children: ReactNode }) {
  return <span className={`aj-chip ${tom}${plain ? ' plain' : ''}`}>{children}</span>
}

/** Destaque: `rule` (regra do sistema), `caution` (armadilha), `info` (contexto). */
export function Callout({ tipo, titulo, children }: {
  tipo: 'rule' | 'caution' | 'info'
  titulo: string
  children: ReactNode
}) {
  return (
    <div className={`aj-callout ${tipo}`}>
      <span className="aj-callout-icon">{tipo === 'caution' ? <IconAlerta /> : tipo === 'info' ? <IconInfo /> : <IconEscudo />}</span>
      <div className="aj-callout-body">
        <span className="aj-callout-label">{titulo}</span>
        {children}
      </div>
    </div>
  )
}

/** Tabela descritiva (duas ou três colunas de texto). A largura da 1ª coluna é
 *  fixada por `larguras` para as tabelas do módulo não dançarem entre si. */
export function Tabela({ cabecalho, larguras, matriz, children }: {
  cabecalho: string[]
  larguras?: (string | undefined)[]
  matriz?: boolean
  children: ReactNode
}) {
  return (
    <div className="aj-table-wrap">
      <table className={`aj-table${matriz ? ' aj-matrix' : ''}`}>
        <thead>
          <tr>{cabecalho.map((c, i) => <th key={c} style={larguras?.[i] ? { width: larguras[i] } : undefined}>{c}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

/** Célula-rótulo: a primeira coluna das tabelas descritivas. */
export function Key({ children }: { children: ReactNode }) {
  return <td className="aj-key">{children}</td>
}

/** Cartão que descreve um indicador de uma tela (o que ele significa). */
export function Metrics({ children }: { children: ReactNode }) {
  return <div className="aj-metrics">{children}</div>
}

export function Metric({ tom, label, valor, nota }: {
  tom: Tom
  label: string
  valor: string
  nota?: string
}) {
  return (
    <div className={`aj-metric ${tom}`}>
      <div className="aj-metric-label">{label}</div>
      <div className="aj-metric-value">{valor}</div>
      {nota && <div className="aj-metric-note">{nota}</div>}
    </div>
  )
}

/** Lista de passos numerados (o fluxo do Envio de Censos). */
export function Passos({ children }: { children: ReactNode }) {
  return <ol className="aj-steps">{children}</ol>
}

export function Passo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <li>
      <span className="aj-step-title">{titulo}</span>
      <span className="aj-step-body">{children}</span>
    </li>
  )
}

/** Marca de acesso na matriz de permissões. */
export function Sim() {
  return (
    <span className="aj-mark yes" role="img" aria-label="tem acesso">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4.5 4.5L19 7" /></svg>
    </span>
  )
}

export function Nao() {
  return (
    <span className="aj-mark no" role="img" aria-label="sem acesso">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
    </span>
  )
}

function IconEscudo() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7.2-3.5 7.2-9V5.6L12 3 4.8 5.6V12c0 5.5 7.2 9 7.2 9Z" />
      <path d="m9.1 11.9 2.2 2.2 3.8-4" />
    </svg>
  )
}

function IconAlerta() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  )
}

function IconInfo() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" />
    </svg>
  )
}
