// Busca da Visão Geral recolhida numa lupa (22/10/2026: "ajuste os filtros para
// que caiba o componente de pesquisa, pode deixar ele como uma lupa grande que
// quando clica abre o componente de pesquisa mostrando uma transição").
//
// Fechada, ocupa só a lupa e os filtros rápidos cabem numa linha. O clique
// abre o campo (a largura cresce com transição) já com o foco. Com texto, fica
// aberta; vazia, fecha ao sair do campo ou num novo clique na lupa. Esc limpa e
// fecha; o × só limpa.
//
// Aberta, a busca usa o espaço que sobra na linha dos filtros (o campo vai até
// 300px e encolhe para caber), em vez de descer inteira para uma linha nova e
// deixar um vão ao lado do "Ordenar". Só quebra a linha com menos de 180px.
import { useRef, useState } from 'react'

const estilos = `
.bx{display:flex;align-items:center;justify-content:flex-end;position:relative;flex:1 1 40px;min-width:40px}
.bx.aberta{flex-basis:180px}
.bx-lupa{width:40px;height:40px;flex-shrink:0;display:grid;place-items:center;border-radius:99px;border:1px solid var(--border);background:var(--surface-3);color:var(--ink-2);cursor:pointer;transition:background .15s,border-color .15s,color .15s}
.bx-lupa:hover{background:var(--surface);border-color:var(--border-strong);color:var(--ink)}
.bx.aberta .bx-lupa{background:var(--surface);border-color:var(--border-strong);color:var(--ink)}
.bx-campo{position:relative;flex:0 1 300px;min-width:0;max-width:0;opacity:0;overflow:hidden;overflow:clip;overflow-clip-margin:4px;transition:max-width .28s ease,opacity .2s ease,margin .28s ease}
.bx.aberta .bx-campo{max-width:300px;opacity:1;margin-left:8px}
.bx-campo .bm-input{padding-right:32px;text-overflow:ellipsis}
.bx-limpar{position:absolute;right:6px;top:50%;transform:translateY(-50%);border:0;background:none;color:var(--muted);font-size:18px;line-height:1;padding:2px 6px;cursor:pointer}
.bx-limpar:hover{color:var(--ink)}
@media (prefers-reduced-motion:reduce){.bx-campo,.bx-lupa{transition:none}}
`

export function BuscaExpansivel({ valor, onChange, placeholder }: {
  valor: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [aberta, setAberta] = useState(Boolean(valor))
  const campo = useRef<HTMLInputElement>(null)
  // Com texto (ex.: busca que veio de antes) a busca fica sempre à vista.
  const expandida = aberta || Boolean(valor)

  function abrir() {
    setAberta(true)
    // Foca depois que o campo deixou de ser invisível.
    requestAnimationFrame(() => campo.current?.focus())
  }

  // Aberta: com texto, a lupa só devolve o foco ao campo; vazia, fecha.
  function clicarLupa() {
    if (!expandida) abrir()
    else if (valor) campo.current?.focus()
    else {
      setAberta(false)
      campo.current?.blur()
    }
  }

  return (
    <div className={`bx${expandida ? ' aberta' : ''}`}>
      <style>{estilos}</style>
      {/* Sem o preventDefault, o mousedown na lupa tirava o foco do campo vazio,
          o blur fechava a busca e o click a reabria: fechava e abria de novo. */}
      <button type="button" className="bx-lupa" onClick={clicarLupa}
              onMouseDown={(e) => { if (expandida) e.preventDefault() }}
              aria-label="Buscar segurado ou atendimento" aria-expanded={expandida}
              title="Buscar segurado, atendimento ou senha">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7.5" /><path d="m21 21-4.6-4.6" />
        </svg>
      </button>
      <div className="bx-campo">
        <input
          ref={campo}
          type="text"
          className="bm-input"
          tabIndex={expandida ? 0 : -1}
          aria-hidden={!expandida}
          placeholder={placeholder}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => { if (!valor.trim()) setAberta(false) }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onChange('')
              setAberta(false)
              e.currentTarget.blur()
            }
          }}
        />
        {valor && (
          <button type="button" className="bx-limpar" aria-label="Limpar a busca" title="Limpar a busca"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onChange(''); campo.current?.focus() }}>
            ×
          </button>
        )}
      </div>
    </div>
  )
}
