// Lista dos chamados: a coluna da esquerda da tela. Componente puro, sem busca
// de dados: recebe os chamados e avisa qual foi escolhido.
import { Badge } from '../ui'
import { ROLE_LABEL } from '../../lib/usuarioRoles'
import type { Chamado } from '../../services/chamados.service'
import { STATUS_LABEL, STATUS_VARIANT, finalizado, iniciais, quando } from './rotulos'

export type FiltroChamados = 'abertos' | 'finalizados'

interface Props {
  chamados: Chamado[]
  /** Quem lê é do suporte: cada linha passa a dizer de quem é o chamado. */
  atende: boolean
  filtro: FiltroChamados
  onFiltro: (f: FiltroChamados) => void
  abertoId: number | null
  onAbrir: (id: number) => void
  carregando: boolean
}

export default function ListaChamados({
  chamados, atende, filtro, onFiltro, abertoId, onAbrir, carregando,
}: Props) {
  const abertos = chamados.filter((c) => !finalizado(c.status))
  const finalizados = chamados.filter((c) => finalizado(c.status))
  const visiveis = filtro === 'abertos' ? abertos : finalizados

  return (
    <aside className="chm-lista" aria-label="Chamados">
      <div className="chm-filtros" role="tablist">
        <button type="button" role="tab" aria-selected={filtro === 'abertos'}
          className={`chm-filtro${filtro === 'abertos' ? ' ativo' : ''}`}
          onClick={() => onFiltro('abertos')}>
          Em aberto <span className="chm-filtro-n">{abertos.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={filtro === 'finalizados'}
          className={`chm-filtro${filtro === 'finalizados' ? ' ativo' : ''}`}
          onClick={() => onFiltro('finalizados')}>
          Finalizados <span className="chm-filtro-n">{finalizados.length}</span>
        </button>
      </div>

      <div className="chm-itens">
        {carregando && <p className="chm-vazio">Carregando…</p>}
        {!carregando && visiveis.length === 0 && (
          <p className="chm-vazio">
            {filtro === 'abertos' ? 'Nenhum chamado em aberto' : 'Nenhum chamado finalizado'}
          </p>
        )}
        {visiveis.map((c) => {
          // A conversa em tela já está sendo lida: o ponto nela seria um aviso
          // do que a pessoa tem diante dos olhos.
          const naoLido = c.nao_lido && c.id !== abertoId
          return (
            <button type="button" key={c.id}
              className={`chm-item${c.id === abertoId ? ' ativo' : ''}${naoLido ? ' nao-lido' : ''}`}
              aria-current={c.id === abertoId ? 'true' : undefined}
              onClick={() => onAbrir(c.id)}>
              <span className="chm-item-topo">
                <span className="chm-item-assunto">{c.assunto}</span>
                <span className="chm-item-hora">{quando(c.atualizado_em)}</span>
              </span>
              {/* Quem atende vê os chamados de todos, e a primeira pergunta
                  diante de cada um é "de quem é?". Vale também para o chamado
                  que a própria pessoa abriu: linha sem autor pareceria dado
                  faltando. */}
              {atende && (
                <span className="chm-item-autor">
                  <span className="chm-avatar" aria-hidden="true">
                    {iniciais(c.autor_nome, c.autor_email)}
                  </span>
                  <span className="chm-item-autor-nome">
                    {c.meu ? 'Você' : (c.autor_nome ?? c.autor_email ?? 'Sem nome')}
                  </span>
                  {c.autor_role && (
                    <span className="chm-item-autor-papel">
                      {ROLE_LABEL[c.autor_role] ?? c.autor_role}
                    </span>
                  )}
                </span>
              )}
              {c.previa && <span className="chm-item-previa">{c.previa}</span>}
              <span className="chm-item-pe">
                <Badge variant={STATUS_VARIANT[c.status]} dot>{STATUS_LABEL[c.status]}</Badge>
                {naoLido && <span className="chm-item-novo">Nova mensagem</span>}
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
