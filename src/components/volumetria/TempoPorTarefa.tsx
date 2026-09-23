// "Onde o tempo está indo": o tempo estimado da fila repartido por tipo de
// tarefa, como uma barra única de 100%.
//
// A quebra de demandas ao lado conta CASOS. Esta conta MINUTOS, e as duas
// discordam de propósito: 10 pacientes de UTI e 10 de enfermaria são o mesmo
// número de casos e não o mesmo tempo de trabalho. É a diferença entre "tenho
// muita coisa" e "minha semana está presa nisto aqui".
//
// Forma: parte-de-um-todo com poucas categorias, então barra empilhada
// horizontal (os rótulos são longos: "Aguardando visita", "Visitas
// atrasadas"). Cores por IDENTIDADE, as mesmas das colunas de Tarefas, com
// rótulo sempre ao lado — a cor nunca identifica sozinha.
import type { VolumetriaMinutosCategoria, VolumetriaQuebra } from '../../types/api'
import { fmt1, fmtHoras, linhasQuebra } from './volumetria.model'

// Na LISTA de quebra, "Visitas atrasadas" e "Relatório vencido" são as duas
// vermelhas — cada linha tem o próprio rótulo ao lado, então a repetição não
// atrapalha. Empilhadas numa barra, porém, viram uma fatia só: o olho lê 31%
// de uma categoria que não existe. Aqui o vencido recebe um tom próprio.
//
// A paleta resultante (laranja, azul, vermelho, roxo, âmbar) foi conferida
// para daltonismo: pior par adjacente ΔE 17,6 em protanopia e 26,8 em visão
// normal, todas com contraste ≥ 3:1 contra a superfície.
// Hex e não token: é o roxo da paleta de gráficos do Gestor (gestor.styles),
// o mesmo valor que passou na conferência — o design system não tem um token
// equivalente, e um `var()` com fallback esconderia isso de quem lê.
const COR_NA_BARRA: Record<string, string> = {
  vencido: '#6B34B8',
}

/** Uma fatia da barra: a categoria, quanto tempo custa e que parte do todo é. */
interface Fatia {
  key: string
  label: string
  cor: string
  minutos: number
  pct: number
}

function fatias(
  role: 'tecnico' | 'administrativo', mc: VolumetriaMinutosCategoria,
): { fatias: Fatia[]; minutos: number } {
  // A ordem e os rótulos saem de `linhasQuebra`: o mesmo vocabulário do
  // quadro de Tarefas, para o coordenador não precisar traduzir nada.
  const linhas = linhasQuebra(role, mc as unknown as VolumetriaQuebra)
  const total = linhas.reduce((s, l) => s + (mc[l.key] ?? 0), 0)
  if (total <= 0) return { fatias: [], minutos: 0 }
  return {
    minutos: total,
    fatias: linhas
      .map((l) => ({
        key: l.key as string,
        label: l.label,
        cor: COR_NA_BARRA[l.key as string] ?? l.cor,
        minutos: mc[l.key] ?? 0,
        pct: ((mc[l.key] ?? 0) / total) * 100,
      }))
      .filter((f) => f.minutos > 0),
  }
}

export default function TempoPorTarefa({ role, minutosCategoria, titulo, compacto }: {
  role: 'tecnico' | 'administrativo'
  minutosCategoria: VolumetriaMinutosCategoria
  /** Título do bloco. Sem ele, a barra vem solta (uso dentro de um cartão). */
  titulo?: string
  /** Versão miúda: barra mais fina e legenda em uma linha só. */
  compacto?: boolean
}) {
  const { fatias: fs, minutos } = fatias(role, minutosCategoria)
  if (fs.length === 0) return null

  const horas = minutos / 60
  // Uma categoria só (o caso do administrativo) não é uma composição: a barra
  // cheia não informaria nada que o número ao lado já não diga.
  const umaSo = fs.length === 1

  return (
    <div className={`vol-tpt${compacto ? ' compacto' : ''}`}>
      {titulo && (
        <div className="vol-tpt-head">
          <span>{titulo}</span>
          <span className="vol-tpt-total">{fmtHoras(horas)} no total</span>
        </div>
      )}

      {!umaSo && (
        <div
          className="vol-tpt-barra"
          role="img"
          aria-label={`Tempo por tarefa: ${fs.map((f) => `${f.label} ${Math.round(f.pct)}%`).join(', ')}`}
        >
          {fs.map((f) => (
            <span
              key={f.key}
              className="vol-tpt-fatia"
              style={{ width: `${f.pct}%`, background: f.cor }}
              title={`${f.label}: ${fmtHoras(f.minutos / 60)} (${fmt1(f.pct)}%)`}
            >
              {/* Rótulo dentro da fatia só quando cabe: abaixo disso ele
                  atropela o vizinho e a legenda abaixo já identifica tudo. */}
              {f.pct >= 14 && <b>{Math.round(f.pct)}%</b>}
            </span>
          ))}
        </div>
      )}

      <ul className="vol-tpt-legenda">
        {fs.map((f) => (
          <li key={f.key}>
            <i style={{ background: f.cor }} aria-hidden="true" />
            <span className="vol-tpt-lbl">{f.label}</span>
            <span className="vol-tpt-val">{fmtHoras(f.minutos / 60)}</span>
            {!umaSo && <span className="vol-tpt-pct">{Math.round(f.pct)}%</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
