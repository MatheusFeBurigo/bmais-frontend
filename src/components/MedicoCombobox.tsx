import { useEffect, useMemo, useRef, useState } from 'react'

// Normaliza para comparação: minúsculas e sem acentos, para o filtro casar
// "joao" com "João".
function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

const comboStyles = `
.mc-wrap{position:relative}
.mc-menu{position:absolute;z-index:20;left:0;right:0;top:calc(100% + 4px);background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md,8px);box-shadow:0 8px 24px rgba(6,46,92,.12);max-height:200px;overflow-y:auto;padding:4px}
.mc-opt{padding:7px 10px;font-size:var(--t-sm);color:var(--ink-2);border-radius:6px;cursor:pointer}
.mc-opt:hover,.mc-opt.active{background:var(--primary-soft);color:var(--primary)}
.mc-empty{padding:8px 10px;font-size:var(--t-sm);color:var(--muted)}
`

// Combobox de médico auditor: input filtrável + dropdown clicável, alimentado
// pelos nomes cadastrados na tela de Equipe. Aceita valor livre (o que estiver
// digitado) e também seleção via clique/teclado.
export default function MedicoCombobox({ value, onChange, nomes }: {
  value: string
  onChange: (v: string) => void
  nomes: string[]
}) {
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)

  const filtrados = useMemo(() => {
    const q = normalizar(value)
    const base = q ? nomes.filter((n) => normalizar(n).includes(q)) : nomes
    return base.slice(0, 50)
  }, [value, nomes])

  // Fecha ao clicar fora.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function selecionar(nome: string) {
    onChange(nome)
    setAberto(false)
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setAberto(true); setAtivo((i) => Math.min(i + 1, filtrados.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setAtivo((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && aberto && filtrados[ativo]) {
      e.preventDefault(); selecionar(filtrados[ativo])
    } else if (e.key === 'Escape') {
      setAberto(false)
    }
  }

  return (
    <div className="mc-wrap" ref={wrapRef}>
      <style>{comboStyles}</style>
      <input
        type="text"
        className="bm-input"
        placeholder="Digite ou selecione o médico…"
        autoComplete="off"
        value={value}
        onChange={(e) => { onChange(e.target.value); setAberto(true); setAtivo(0) }}
        onFocus={() => setAberto(true)}
        onKeyDown={onKey}
      />
      {aberto && (
        <div className="mc-menu">
          {filtrados.length === 0 && (
            <div className="mc-empty">
              {nomes.length === 0 ? 'Nenhum médico cadastrado' : 'Nenhum médico encontrado'}
            </div>
          )}
          {filtrados.map((n, i) => (
            <div
              key={n}
              className={`mc-opt${i === ativo ? ' active' : ''}`}
              onMouseEnter={() => setAtivo(i)}
              onMouseDown={(e) => { e.preventDefault(); selecionar(n) }}
            >
              {n}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
