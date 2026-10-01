// Card do fluxo de censos: um por HOSPITAL + OPERADORA, nas quatro colunas de
// censo. O censo da Porto chegar não diz nada sobre o da Bradesco no mesmo
// hospital, então cada operadora anda na sua coluna.
// Apresentação pura. A coluna (`estado_censo`) vem pronta do backend; o card só
// escolhe o que dizer e qual ação oferecer em cada uma:
//
//   Censos atrasados   → "Marcar como cobrado"
//   Aguardando retorno → "Marcar como atualizado" (o hospital respondeu que não
//                        há censo novo a gerar) e "Desfazer cobrança"
//   Aguardando censo   → nenhuma: o dia ainda não acabou
//   Censos atualizados → nenhuma, ou "Desfazer" se foi marcado à mão
//
// Em qualquer coluna, clicar no card abre a ficha do hospital: é onde estão o
// telefone e o e-mail de quem cobrar, e o histórico de censos enviados.
//
// "Última atualização" é o dia A QUE O CENSO SE REFERE (lido do cabeçalho do
// relatório), não o do upload: quem sobe hoje o censo de uma semana atrás não
// atualiza nada do que falta.
import type { KeyboardEvent, MouseEvent } from 'react'
import type { KanbanTarefa } from '../../types/api'
import { Badge, OpAvatar } from '../ui'
import { dataHora, diaRelativo, labelCurto } from '../../lib/datas'
import { nomeProprio } from '../../lib/texto'

const ROTULO = { color: 'var(--muted-2)' }

export function CensoCard({
  tarefa, onCobrar, onDesfazer, onAtualizar, onDesfazerAtualizado, onAbrir, cobrando, somenteLeitura,
}: {
  tarefa: KanbanTarefa
  onCobrar: () => void
  onDesfazer?: () => void
  onAtualizar?: () => void
  onDesfazerAtualizado?: () => void
  /** Abre a ficha do hospital. Ausente = card não clicável (réplica da Ajuda). */
  onAbrir?: () => void
  /** Ação em andamento neste card. */
  cobrando: boolean
  /** true = perfil de observação: sem ações, só a ficha. */
  somenteLeitura?: boolean
}) {
  const estado = tarefa.estado_censo
  const dias = tarefa.dias_sem_censo
  const atrasado = estado === 'censos_atrasados'
  const retorno = estado === 'aguardando_retorno'
  const pendente = atrasado || retorno
  // Em "Censos atualizados" sem censo: alguém deu o dia por atualizado à mão.
  const atualizadoManual = estado === 'censos_processados' && !!tarefa.atualizado_em

  // O botão fica dentro do card clicável: sem parar a propagação, cobrar
  // também abriria a ficha do hospital.
  const acao = (fn?: () => void) => (e: MouseEvent) => { e.stopPropagation(); fn?.() }
  const teclado = (e: KeyboardEvent) => {
    if (onAbrir && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onAbrir() }
  }

  return (
    <article
      className={`kb-card${onAbrir ? ' clicavel' : ''}`}
      onClick={onAbrir}
      onKeyDown={teclado}
      role={onAbrir ? 'button' : undefined}
      tabIndex={onAbrir ? 0 : undefined}
      title={onAbrir ? 'Ver contato e histórico de censos' : undefined}
    >
      <div className="kb-card-top">
        {tarefa.operadora_key && (
          <span title={tarefa.operadora_key}>
            <OpAvatar opKey={tarefa.operadora_key} size={20} />
          </span>
        )}
        <span className="kb-card-nome">
          {nomeProprio(tarefa.titulo)}
          {tarefa.operadora_nome && (
            <span style={{ display: 'block', fontWeight: 400, fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
              {tarefa.operadora_nome}
            </span>
          )}
        </span>
        {/* "20d" sozinho não diz de quê: o rótulo vem junto, no próprio badge. */}
        {pendente && dias != null && (
          <Badge variant={dias > 3 ? 'danger' : 'warning'}>
            <span title={`Última atualização há ${dias} dias`}>
              <span className="kb-dias">{dias}d</span>
              {' '}s/ atualizar
            </span>
          </Badge>
        )}
      </div>

      <div className="kb-card-meta" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
        {pendente && (
          <span>
            <span style={ROTULO}>Censo pendente desde </span>
            {labelCurto(tarefa.data_ref) || 'O primeiro envio'}
          </span>
        )}
        <span>
          <span style={ROTULO}>Última atualização </span>
          {/* "Hoje"/"Ontem" em vez da data: é o que decide a coluna (em
              "Aguardando censo" o último é sempre o de ontem). */}
          {tarefa.ultimo_censo ? diaRelativo(tarefa.ultimo_censo) : 'Nunca enviou'}
        </span>
        {/* Em "Aguardando retorno" diz desde quando se espera; em "Atrasados",
            que o hospital já foi cobrado e continuou sem mandar. */}
        {pendente && tarefa.cobrado_em && (
          <span>
            <span style={ROTULO}>{atrasado ? 'Já cobrado em ' : 'Cobrado em '}</span>
            {dataHora(tarefa.cobrado_em)}
            {tarefa.cobrado_por ? ` por ${tarefa.cobrado_por}` : ''}
          </span>
        )}
        {atualizadoManual && (
          <span>
            <span style={ROTULO}>Sem censo novo, marcado em </span>
            {dataHora(tarefa.atualizado_em)}
            {tarefa.atualizado_por ? ` por ${tarefa.atualizado_por}` : ''}
          </span>
        )}
      </div>

      {!somenteLeitura && atrasado && (
        <div className="kb-card-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={cobrando}
            onClick={acao(onCobrar)}
          >
            {cobrando ? 'Registrando…' : 'Marcar como cobrado'}
          </button>
        </div>
      )}
      {!somenteLeitura && retorno && (onAtualizar || onDesfazer) && (
        <div className="kb-card-actions empilhadas">
          {onAtualizar && (
            <button
              type="button"
              className="btn btn-outline btn-sm kb-btn-atualizar"
              disabled={cobrando}
              onClick={acao(onAtualizar)}
              title="O hospital respondeu que não há censo novo a gerar"
            >
              {cobrando ? 'Registrando…' : 'Marcar como atualizado'}
            </button>
          )}
          {onDesfazer && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={cobrando}
              onClick={acao(onDesfazer)}
              title="Volta o hospital para Censos atrasados"
            >
              Desfazer cobrança
            </button>
          )}
        </div>
      )}
      {!somenteLeitura && atualizadoManual && onDesfazerAtualizado && (
        <div className="kb-card-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={cobrando}
            onClick={acao(onDesfazerAtualizado)}
            title="Volta o hospital para Aguardando retorno"
          >
            {cobrando ? 'Desfazendo…' : 'Desfazer'}
          </button>
        </div>
      )}
    </article>
  )
}
