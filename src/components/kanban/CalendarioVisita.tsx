// Campo de data que abre um calendário ao ser clicado.
//
// Substitui o <input type="date"> nativo em toda escolha de data de visita: o
// calendário do sistema operacional muda de aparência por SO/navegador/idioma,
// não segue o design do produto, e obriga a digitar ou rolar dia/mês/ano para
// uma decisão que, vista num calendário, é um clique. Também esconde o que mais
// importa aqui: em que dia da semana a data cai.
//
// O calendário fica FECHADO por padrão, atrás do campo. Aberto o tempo todo, ele
// dominava o formulário e empurrava os campos vizinhos para fora da vista.
//
// Serve os dois sentidos de data de visita do sistema, cada um com seu `limite`:
//   * "vai acontecer" (agendar): só hoje ou futuro, `limite="futuro"`;
//   * "já aconteceu" (registrar relatório): só hoje ou passado, `limite="passado"`.
// O texto dos atalhos e o desabilitar do dia mudam de sentido conforme o limite,
// mas o desenho do calendário é o mesmo — daí um componente só para os dois.
import { useEffect, useMemo, useRef, useState } from 'react'
import { hojeISO } from '../../lib/datas'

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS_LONGO = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado']

/** ISO `AAAA-MM-DD` de ano/mês/dia, sem passar por Date (que desloca por fuso). */
function iso(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

/** Soma dias a uma data ISO pelo calendário local (`dias` negativo = subtrai). */
function somarDias(isoDia: string, dias: number): string {
  const [a, m, d] = isoDia.split('-').map(Number)
  const dt = new Date(a, m - 1, d + dias)
  return iso(dt.getFullYear(), dt.getMonth(), dt.getDate())
}

/** Diferença em dias entre duas datas ISO (positivo = `fim` no futuro). */
function diffDias(inicio: string, fim: string): number {
  const [a1, m1, d1] = inicio.split('-').map(Number)
  const [a2, m2, d2] = fim.split('-').map(Number)
  return Math.round(
    (new Date(a2, m2 - 1, d2).getTime() - new Date(a1, m1 - 1, d1).getTime()) / 86400000,
  )
}

/**
 * Como o campo se descreve quando fechado. Diz o dia da semana e a distância em
 * dias, que é como se raciocina no dia a dia ("quinta", "há 3 dias") — a data
 * sozinha obrigaria a ir conferir num calendário qual dia é aquele.
 */
export function rotuloDoDia(isoDia: string, hoje: string): string {
  if (!isoDia) return ''
  const [ano, mes, dia] = isoDia.split('-').map(Number)
  const dm = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`
  const dist = diffDias(hoje, isoDia)
  if (dist === 0) return `Hoje, ${dm}`
  if (dist === 1) return `Amanhã, ${dm}`
  if (dist === -1) return `Ontem, ${dm}`
  const semana = DIAS_LONGO[new Date(ano, mes - 1, dia).getDay()]
  const capitalizado = semana.charAt(0).toUpperCase() + semana.slice(1)
  if (dist > 1) return `${capitalizado}, ${dm} (em ${dist} dias)`
  if (dist < -1) return `${capitalizado}, ${dm} (há ${-dist} dias)`
  return `${capitalizado}, ${dm}`
}

interface Celula {
  dia: number
  iso: string
  fora: boolean
  hoje: boolean
  fds: boolean
}

/** As células do mês, com `null` nos espaços antes do dia 1 (alinhamento da grade). */
function montarMes(ano: number, mes: number, hoje: string, foraDoLimite: (iso: string) => boolean): Array<Celula | null> {
  // Dia 0 do mês seguinte = último dia deste mês.
  const total = new Date(ano, mes + 1, 0).getDate()
  const celulas: Array<Celula | null> = Array(new Date(ano, mes, 1).getDay()).fill(null)
  for (let dia = 1; dia <= total; dia++) {
    const d = iso(ano, mes, dia)
    const semana = new Date(ano, mes, dia).getDay()
    celulas.push({
      dia,
      iso: d,
      fora: foraDoLimite(d),
      hoje: d === hoje,
      fds: semana === 0 || semana === 6,
    })
  }
  return celulas
}

// O CSS mora AQUI, junto do componente: ele é usado tanto pelo SeletorVisita
// (agendamento) quanto direto pelo PacienteDrawer (registrar relatório), e cada
// um desses lugares carrega o <style> de telas diferentes — ou de nenhuma.
const calendarioStyles = `
/* ── Campo de data (fechado) ── */
.cal-wrap{position:relative}
.cal-campo{width:100%;display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--muted);font-size:var(--t-md);font-family:inherit;text-align:left;cursor:pointer;transition:border-color .12s,box-shadow .12s}
.cal-campo:hover{border-color:var(--border-strong)}
.cal-campo.aberto{border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-soft)}
/* Data escolhida em cor cheia: distingue campo preenchido do placeholder. */
.cal-campo.preenchido{color:var(--ink-2);font-weight:600}
.cal-campo-icone{flex-shrink:0;color:var(--muted-2)}
.cal-campo.preenchido .cal-campo-icone{color:var(--primary)}
.cal-campo-txt{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cal-campo-seta{flex-shrink:0;color:var(--muted-2);transition:transform .14s}
.cal-campo.aberto .cal-campo-seta{transform:rotate(180deg)}
@media (prefers-reduced-motion:reduce){.cal-campo-seta{transition:none}}
/* ── Calendário (popover) ── */
.cal-pop{position:absolute;z-index:30;left:0;top:calc(100% + 6px);width:268px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);box-shadow:0 12px 32px rgba(6,46,92,.16);padding:10px;animation:calAbrir .14s ease}
/* Sem espaço embaixo (campo perto do fim do drawer/tela): o popover nasce ACIMA
   do campo em vez de ser cortado pela borda do scroll. */
.cal-pop.para-cima{top:auto;bottom:calc(100% + 6px);animation:calAbrirCima .14s ease}
@keyframes calAbrir{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
@keyframes calAbrirCima{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.cal-pop,.cal-pop.para-cima{animation:none}}
/* Atalhos: cobrem a maioria dos casos sem navegar o mês. */
.cal-atalhos{display:flex;gap:5px;margin-bottom:9px}
.cal-atalho{flex:1;padding:5px 6px;border:1px solid var(--border);background:var(--surface-2);color:var(--ink-2);font-size:var(--t-xs);font-weight:600;font-family:inherit;border-radius:99px;cursor:pointer;transition:background .12s,border-color .12s}
.cal-atalho:hover{background:var(--primary-soft);border-color:var(--primary-3);color:var(--primary)}
.cal-topo{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:7px}
.cal-mes{font-size:var(--t-sm);font-weight:700;color:var(--ink)}
.cal-nav{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border:1px solid var(--border);background:var(--surface);color:var(--ink-2);border-radius:7px;cursor:pointer;transition:background .12s,border-color .12s}
.cal-nav:hover:not(:disabled){background:var(--surface-2);border-color:var(--border-strong)}
.cal-nav:disabled{color:var(--muted-2);cursor:default;opacity:.35}
.cal-grade{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}
.cal-cabeca{display:flex;align-items:center;justify-content:center;font-size:var(--t-xs);font-weight:700;color:var(--muted-2);height:22px}
.cal-dia{display:flex;align-items:center;justify-content:center;height:31px;border:1px solid transparent;background:transparent;color:var(--ink-2);font-size:var(--t-sm);font-family:inherit;border-radius:8px;cursor:pointer;transition:background .1s,border-color .1s}
.cal-dia:hover:not(:disabled){background:var(--surface-2);border-color:var(--border-strong)}
/* Fim de semana esmaecido: visita em sábado/domingo é exceção, não regra. */
.cal-dia.fds:not(.escolhido){color:var(--muted-2)}
/* Hoje contornado: mostra a distância até hoje sem precisar contar no calendário. */
.cal-dia.hoje:not(.escolhido){border-color:var(--accent);font-weight:700}
.cal-dia.escolhido{background:var(--primary);border-color:var(--primary);color:#fff;font-weight:700}
/* Fora do limite desabilitado: o backend recusa de qualquer forma, e deixar
   clicável só levaria a uma mensagem de erro que dava para evitar. */
.cal-dia:disabled{color:var(--muted-2);opacity:.3;cursor:default}
`

export function CalendarioVisita({ valor, onEscolher, placeholder = 'Escolher data', limite = 'futuro' }: {
  /** Dia escolhido (ISO), ou '' quando nenhum. */
  valor: string
  onEscolher: (iso: string) => void
  placeholder?: string
  /** 'futuro' (default) = só hoje ou depois, para agendar; 'passado' = só hoje
   *  ou antes, para registrar uma visita que já aconteceu. */
  limite?: 'futuro' | 'passado'
}) {
  const hoje = hojeISO()
  const [aberto, setAberto] = useState(false)
  // true = não cabe embaixo do campo (perto do fim da tela/do scroll do
  // drawer): o popover abre para CIMA em vez de nascer cortado.
  const [paraCima, setParaCima] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const popRef = useRef<HTMLDivElement>(null)

  // Mês exibido: o do dia escolhido, ou o corrente. Volta a acompanhar o valor
  // quando ele muda de fora (ex.: o formulário foi limpo depois de salvar).
  const base = (valor || hoje).split('-')
  const [ano, setAno] = useState(Number(base[0]))
  const [mes, setMes] = useState(Number(base[1]) - 1)
  useEffect(() => {
    if (!valor) return
    const [a, m] = valor.split('-')
    setAno(Number(a))
    setMes(Number(m) - 1)
  }, [valor])

  // Ao abrir: garante que o campo fica visível (o drawer rola por dentro, e um
  // campo perto do rodapé abriria o popover fora da área visível) e decide se
  // ele abre para baixo ou para cima, conforme o espaço real do viewport.
  useEffect(() => {
    if (!aberto) return
    const campo = wrapRef.current
    if (!campo) return

    // `block: 'nearest'`: só rola se o campo já não estiver visível — não força
    // a página a pular quando ele já está à vista. INSTANTÂNEO de propósito: um
    // scroll suave ainda estaria em trânsito quando o rAF abaixo mede a posição,
    // e a medição pegaria o campo a meio caminho — lado errado escolhido.
    campo.scrollIntoView({ block: 'nearest', behavior: 'auto' })

    // Mede DEPOIS que o popover renderizou (senão a altura ainda é 0) e depois
    // do scroll acima, que já terminou por ser instantâneo. Um
    // requestAnimationFrame basta: o DOM já foi commitado neste ponto.
    const id = requestAnimationFrame(() => {
      const rectCampo = campo.getBoundingClientRect()
      const alturaPop = popRef.current?.offsetHeight ?? 360
      const espacoAbaixo = window.innerHeight - rectCampo.bottom
      const espacoAcima = rectCampo.top
      // Só inverte quando embaixo não cabe E em cima cabe melhor — evita trocar
      // de lado à toa quando os dois espaços são apertados.
      setParaCima(espacoAbaixo < alturaPop + 12 && espacoAcima > espacoAbaixo)
    })
    return () => cancelAnimationFrame(id)
  }, [aberto])

  // Fecha ao clicar fora, como os demais dropdowns do sistema.
  useEffect(() => {
    if (!aberto) return
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setAberto(false)
    }
    function onKey(e: KeyboardEvent) {
      // Escape fecha só o calendário. Sem isto ele atravessaria para o drawer,
      // que fecharia inteiro e levaria junto o formulário em andamento.
      if (e.key === 'Escape') {
        e.stopPropagation()
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [aberto])

  // Fora do limite: dia recusado pelo backend de qualquer forma (agendar não
  // aceita passado; registrar relatório não aceita futuro). Deixar clicável só
  // levaria a uma mensagem de erro que dava para evitar.
  const foraDoLimite = useMemo(
    () => (limite === 'passado' ? (d: string) => d > hoje : (d: string) => d < hoje),
    [limite, hoje],
  )
  const celulas = useMemo(() => montarMes(ano, mes, hoje, foraDoLimite), [ano, mes, hoje, foraDoLimite])

  // Mês inteiro fora do limite: o botão daquele lado some em vez de levar a uma
  // tela sem nenhum dia clicável.
  const inicioMes = iso(ano, mes, 1)
  const fimMes = iso(ano, mes, new Date(ano, mes + 1, 0).getDate())
  const podeVoltar = limite === 'passado' || inicioMes > hoje.slice(0, 7) + '-01'
  const podeAvancar = limite === 'futuro' || fimMes < hoje

  function mudarMes(delta: number) {
    const d = new Date(ano, mes + delta, 1)
    setAno(d.getFullYear())
    setMes(d.getMonth())
  }

  function escolher(isoDia: string) {
    onEscolher(isoDia)
    setAberto(false)
  }

  // Atalhos: cobrem a maioria dos casos sem navegar o mês. O sentido muda com
  // o limite — quem registra pensa em "hoje/ontem", quem agenda em "hoje/amanhã".
  const atalhos = limite === 'passado'
    ? [{ rotulo: 'Hoje', dia: hoje }, { rotulo: 'Ontem', dia: somarDias(hoje, -1) }]
    : [{ rotulo: 'Hoje', dia: hoje }, { rotulo: 'Amanhã', dia: somarDias(hoje, 1) },
       { rotulo: 'Em 1 semana', dia: somarDias(hoje, 7) }]

  return (
    <div className="cal-wrap" ref={wrapRef}>
      <style>{calendarioStyles}</style>
      <button
        type="button"
        className={`cal-campo${aberto ? ' aberto' : ''}${valor ? ' preenchido' : ''}`}
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={aberto}
      >
        <svg className="cal-campo-icone" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
        <span className="cal-campo-txt">{valor ? rotuloDoDia(valor, hoje) : placeholder}</span>
        <svg className="cal-campo-seta" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </button>

      {aberto && (
        <div ref={popRef} className={`cal-pop${paraCima ? ' para-cima' : ''}`} role="dialog" aria-label="Escolher a data">
          <div className="cal-atalhos">
            {atalhos.map((a) => (
              <button key={a.rotulo} type="button" className="cal-atalho" onClick={() => escolher(a.dia)}>
                {a.rotulo}
              </button>
            ))}
          </div>

          <div className="cal-topo">
            <button
              type="button"
              className="cal-nav"
              onClick={() => mudarMes(-1)}
              disabled={!podeVoltar}
              aria-label="Mês anterior"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <span className="cal-mes" aria-live="polite">{MESES[mes]} {ano}</span>
            <button
              type="button"
              className="cal-nav"
              onClick={() => mudarMes(1)}
              disabled={!podeAvancar}
              aria-label="Próximo mês"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>

          <div className="cal-grade" role="grid">
            {DIAS_SEMANA.map((d, i) => (
              <span key={i} className="cal-cabeca" aria-hidden>{d}</span>
            ))}
            {celulas.map((c, i) => c === null ? <span key={`v${i}`} /> : (
              <button
                key={c.iso}
                type="button"
                className={[
                  'cal-dia',
                  c.iso === valor ? 'escolhido' : '',
                  c.hoje ? 'hoje' : '',
                  c.fds ? 'fds' : '',
                ].filter(Boolean).join(' ')}
                disabled={c.fora}
                aria-pressed={c.iso === valor}
                onClick={() => escolher(c.iso)}
              >
                {c.dia}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
