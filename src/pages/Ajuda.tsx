// Tela de Ajuda: a documentação funcional das telas, dentro do sistema.
//
// Antes era um HTML solto (DOCUMENTACAO_TELAS.html), com paleta própria; aqui o
// conteúdo usa o design-system do produto.
//
// A NAVEGAÇÃO entre módulos não fica nesta página: enquanto a Ajuda está aberta,
// a própria barra lateral do app troca de estado e lista os módulos
// (components/ajuda/SidebarAjuda), com um "Voltar ao sistema" que a devolve ao
// menu normal. Assim não há duas colunas de navegação na mesma tela. Aqui ficam
// só o módulo aberto e o paginador.
import { Suspense, useMemo } from 'react'
import { usePageHeader } from '../components/PageHeader'
import { useAjudaNav } from '../components/ajuda/useAjudaNav'
import '../components/ajuda/ajuda.css'

export default function Ajuda() {
  const { modulos, atual, indice, total, irPara } = useAjudaNav()

  usePageHeader(useMemo(() => ({
    title: 'Ajuda',
    subtitle: 'Documentação funcional das telas da plataforma',
  }), []))

  if (!atual) {
    return <p className="aj-carregando">Carregando a documentação…</p>
  }

  const Corpo = atual.corpo
  const Icone = atual.icone
  const anterior = indice > 0 ? modulos[indice - 1] : null
  const proximo = indice < modulos.length - 1 ? modulos[indice + 1] : null

  return (
    <div className="ajuda">
      {/* `key` por módulo: remonta o painel a cada troca, e é isso que faz a
          animação de entrada rodar de novo (sem key, o React reusaria o nó e o
          conteúdo apareceria sem transição). */}
      <article className="aj-panel" key={atual.id}>
        <header className="aj-panel-head">
          <span className="aj-panel-icon"><Icone /></span>
          <div className="aj-panel-titles">
            <h2 className="aj-panel-title">{atual.titulo}</h2>
            <p className="aj-panel-sub">{atual.subtitulo}</p>
          </div>
        </header>
        <div className="aj-body">
          {/* O texto do módulo é um chunk à parte (ver catalogo.tsx): o
              cabeçalho já está pintado, então o fallback é só uma linha. */}
          <Suspense fallback={<p className="aj-carregando">Carregando…</p>}>
            <Corpo irPara={irPara} />
          </Suspense>
        </div>
      </article>

      <nav className="aj-pager" aria-label="Navegação entre módulos">
        <button type="button" className="aj-pager-btn" disabled={!anterior}
          onClick={() => anterior && irPara(anterior.id)}>
          <svg className="aj-pager-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 18l-6-6 6-6" /></svg>
          <span className="aj-pager-text">
            <span className="aj-pager-hint">Anterior</span>
            <span className="aj-pager-name">{anterior?.titulo ?? ''}</span>
          </span>
        </button>
        <div className="aj-pager-count">{indice + 1} de {total}</div>
        <button type="button" className="aj-pager-btn end" disabled={!proximo}
          onClick={() => proximo && irPara(proximo.id)}>
          <span className="aj-pager-text">
            <span className="aj-pager-hint">Próximo</span>
            <span className="aj-pager-name">{proximo?.titulo ?? ''}</span>
          </span>
          <svg className="aj-pager-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      </nav>
    </div>
  )
}
