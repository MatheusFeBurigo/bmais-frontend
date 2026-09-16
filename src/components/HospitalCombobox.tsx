// Combobox de hospital: digita para filtrar, seleciona um item REAL da lista.
//
// Valor fechado por definição — o texto digitado é só o filtro; enquanto nada for
// selecionado, `value` fica vazio e quem usa sabe que ainda não há hospital. Isso
// impede o caso em que o usuário digita um nome parecido e o sistema "adivinha"
// um hospital errado.
//
// Existe porque um <select> nativo com centenas de hospitais é impraticável: abre
// uma lista que cobre a tela e só se navega por scroll. Extraído do
// AddPacienteModal (que o tinha inline) para ser usado também pelo assistente do
// upload de censos.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Hospital } from '../types/api'

const styles = `
.hc-wrap{position:relative}
.hc-menu{position:absolute;z-index:20;left:0;right:0;top:calc(100% + 4px);background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);box-shadow:var(--shadow-lg);max-height:224px;overflow-y:auto;padding:4px}
.hc-opt{display:flex;align-items:baseline;gap:8px;padding:7px 10px;font-size:var(--t-sm);color:var(--ink-2);border-radius:6px;cursor:pointer}
.hc-opt:hover,.hc-opt.active{background:var(--primary-soft);color:var(--primary)}
.hc-opt-nome{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hc-opt-op{flex-shrink:0;font-size:var(--t-xs);color:var(--muted)}
.hc-opt.active .hc-opt-op{color:var(--primary-3)}
.hc-empty{padding:9px 10px;font-size:var(--t-sm);color:var(--muted);line-height:1.45}
/* Rodapé do menu quando a lista foi truncada: sem isso o usuário acha que o
   hospital não existe, quando na verdade ele está além dos 50 exibidos. */
.hc-mais{padding:7px 10px;font-size:var(--t-xs);color:var(--muted);border-top:1px solid var(--border-soft);margin-top:2px}
`

const MAX_VISIVEIS = 50

/** Normaliza para comparação: minúsculas e sem acentos, para "sao" casar com "São". */
function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export function HospitalCombobox({
  hospitais, value, onChange, disabled, placeholder, mostrarOperadora, invalido, autoFocus, id,
}: {
  /** Hospitais candidatos (já recortados ao escopo/operadora por quem chama). */
  hospitais: Hospital[]
  /** Key do hospital escolhido; '' enquanto nada foi selecionado. */
  value: string
  onChange: (key: string) => void
  disabled?: boolean
  placeholder?: string
  /** Mostra a operadora ao lado do nome (útil quando a lista mistura operadoras). */
  mostrarOperadora?: boolean
  /** Pinta a borda de "falta preencher" enquanto não há seleção. */
  invalido?: boolean
  autoFocus?: boolean
  id?: string
}) {
  const escolhido = useMemo(
    () => hospitais.find((h) => h.key === value) ?? null,
    [hospitais, value],
  )
  const [busca, setBusca] = useState(escolhido?.nome ?? '')
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Digitando agora? Enquanto o usuário edita o campo, o texto é DELE — nenhuma
  // sincronização externa pode sobrescrevê-lo.
  const digitando = useRef(false)

  // O valor pode mudar por fora (troca de operadora limpa a escolha, por exemplo):
  // o texto acompanha, senão o campo mostraria um hospital que não está mais valendo.
  //
  // Mas só quando a mudança vem DE FORA. Com um hospital já selecionado, digitar a
  // primeira letra fazia: `onChange('')` (digitar reabre a escolha) → `escolhido`
  // vira null → este efeito rodava e limpava o campo, engolindo a letra. O usuário
  // via o campo travar e só conseguia escrever a partir da segunda tecla.
  useEffect(() => {
    if (digitando.current) return
    setBusca(escolhido?.nome ?? '')
  }, [escolhido])

  const ordenados = useMemo(() => {
    // Dedup por NOME: o cadastro pode ter duas keys para o mesmo hospital (registro
    // duplicado), e listar o nome duas vezes só faz o usuário escolher no escuro —
    // as duas linhas se parecem idênticas na tela. Fica a primeira em ordem
    // alfabética de key, para a escolha ser estável entre carregamentos.
    const porNome = new Map<string, Hospital>()
    for (const h of [...hospitais].sort((a, b) => a.key.localeCompare(b.key))) {
      const chave = h.nome.trim().toLocaleLowerCase('pt-BR')
      if (!porNome.has(chave)) porNome.set(chave, h)
    }
    // O hospital já escolhido nunca some da lista, mesmo que seja a cópia perdida
    // na deduplicação — senão o campo mostraria vazio depois de selecionado.
    const escolhidoFora = value && ![...porNome.values()].some((h) => h.key === value)
      ? hospitais.find((h) => h.key === value)
      : null
    const lista = [...porNome.values(), ...(escolhidoFora ? [escolhidoFora] : [])]
    return lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [hospitais, value])

  const { visiveis, totalFiltrado } = useMemo(() => {
    const q = normalizar(busca)
    // Com um item já escolhido, o texto é o nome dele — não filtra (senão a lista
    // encolheria para "1 resultado" logo depois de selecionar).
    const base = q && !escolhido
      ? ordenados.filter((h) => normalizar(h.nome).includes(q))
      : ordenados
    return { visiveis: base.slice(0, MAX_VISIVEIS), totalFiltrado: base.length }
  }, [busca, ordenados, escolhido])

  // Mantém o item ativo visível ao navegar pelo teclado.
  useEffect(() => {
    if (!aberto) return
    const el = menuRef.current?.children[ativo] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [ativo, aberto])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  // Acabou de escolher: o `focus` que vier LOGO em seguida não reabre o menu.
  //
  // A opção é escolhida no `mousedown` com `preventDefault` (para o campo não
  // perder o foco antes do clique registrar), e o menu fecha na hora. Só que o
  // `click` correspondente ainda vai ser despachado, e como a opção já sumiu ele
  // cai no input — que foca e dispara `onFocus`, reabrindo o menu que acabou de
  // fechar. O usuário escolhia o hospital e a lista continuava aberta.
  const acabouDeEscolher = useRef(false)

  function selecionar(h: Hospital) {
    // Escolheu um item: o texto volta a ser espelho do valor, e a sincronização
    // externa pode agir de novo.
    digitando.current = false
    acabouDeEscolher.current = true
    onChange(h.key)
    setBusca(h.nome)
    setAberto(false)
  }

  function onTexto(texto: string) {
    digitando.current = true
    setBusca(texto)
    onChange('')   // digitar reabre a escolha: o valor só volta ao selecionar um item
    setAberto(true)
    setAtivo(0)
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAberto(true)
      setAtivo((i) => Math.min(i + 1, visiveis.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAtivo((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && aberto && visiveis[ativo]) {
      e.preventDefault()
      selecionar(visiveis[ativo])
    } else if (e.key === 'Escape' && aberto) {
      // Só fecha o menu; não deixa o Esc borbulhar e fechar a modal inteira.
      e.stopPropagation()
      setAberto(false)
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="hc-wrap" ref={wrapRef}>
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={aberto}
          aria-autocomplete="list"
          className={`bm-input${invalido && !value ? ' falta' : ''}`}
          placeholder={placeholder ?? 'Digite o nome do hospital…'}
          autoComplete="off"
          autoFocus={autoFocus}
          disabled={disabled}
          value={busca}
          onChange={(e) => onTexto(e.target.value)}
          onMouseDown={() => { acabouDeEscolher.current = false }}
          onFocus={() => {
            // Foco vindo do clique que acabou de escolher: consome a marca e não
            // reabre. Um foco posterior (clicar no campo de novo, Tab) abre
            // normalmente, que é o comportamento esperado.
            if (acabouDeEscolher.current) {
              acabouDeEscolher.current = false
              return
            }
            if (!disabled) setAberto(true)
          }}
          onBlur={() => {
            // Saiu do campo: o texto deixa de ser "do usuário" e volta a espelhar
            // o valor. Soltar a trava aqui é o que faz uma mudança externa
            // posterior (a troca de operadora limpa a escolha) voltar a ser
            // refletida — senão o campo mostraria um hospital que não vale mais.
            //
            // O texto digitado sem seleção era só um filtro, e é descartado: o
            // valor é fechado por definição, e deixar "Hospi" no campo com
            // `value` vazio faria parecer que algo foi escolhido. Selecionar pelo
            // menu não passa por aqui — o `mousedown` da opção dá preventDefault
            // justamente para não disparar este blur antes da escolha.
            digitando.current = false
            setBusca(escolhido?.nome ?? '')
          }}
          onKeyDown={onKey}
        />
        {aberto && !disabled && (
          <div className="hc-menu">
            <div ref={menuRef}>
              {visiveis.map((h, i) => (
                <div
                  key={h.key}
                  role="option"
                  aria-selected={i === ativo}
                  className={`hc-opt${i === ativo ? ' active' : ''}`}
                  onMouseEnter={() => setAtivo(i)}
                  onMouseDown={(e) => { e.preventDefault(); selecionar(h) }}
                >
                  <span className="hc-opt-nome">{h.nome}</span>
                  {mostrarOperadora && h.operadora_nome && (
                    <span className="hc-opt-op">{h.operadora_nome}</span>
                  )}
                </div>
              ))}
            </div>
            {visiveis.length === 0 && (
              <div className="hc-empty">
                {ordenados.length === 0
                  ? 'Nenhum hospital disponível.'
                  : `Nenhum hospital com “${busca}”. Se ele não existe ainda, use “Cadastrar agora”.`}
              </div>
            )}
            {totalFiltrado > visiveis.length && (
              <div className="hc-mais">
                Mostrando {visiveis.length} de {totalFiltrado}. Digite para refinar.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
