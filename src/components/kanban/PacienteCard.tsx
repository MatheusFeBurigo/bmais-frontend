// Card de paciente do Kanban (colunas derivadas de internação).
//
// Duas camadas de leitura, na ordem em que o usuário decide:
//   1. sempre visível: quem é, onde está, há quanto tempo e o que o marca como
//      prioritário (etiquetas). É o bastante para triar sem abrir nada;
//   2. "mais detalhes": entrada, médico, convênio, última visita e o que falta no
//      cadastro. Abre DENTRO do card, sem tirar o quadro da frente.
//
// A ficha completa (drawer) continua a um clique no card, para quando a correção
// exigir a timeline e o formulário de relatório.
import { memo, useState } from 'react'
import type { KanbanTarefa } from '../../types/api'
import { Badge, OpAvatar } from '../ui'
import { LeitoTag } from '../StatusBadge'
import { nomeProprio } from '../../lib/texto'
import { dataBR } from '../../lib/datas'
import { ehLonga, ehUTI, nuncaVisitado } from './prioridade'

/** Etiqueta curta de prioridade, exibida sob o nome. */
function Etiqueta({ texto, cor, bg, titulo }: { texto: string; cor: string; bg: string; titulo: string }) {
  return (
    <span className="kb-tag" style={{ color: cor, background: bg }} title={titulo}>{texto}</span>
  )
}

/** Linha rotulada do bloco expandido. Valor ausente vira travessão, nunca vazio:
 *  um campo em branco é indistinguível de uma falha de carregamento. */
function Linha({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
  return (
    <div className="kb-det-linha">
      <span className="kb-det-lbl">{rotulo}</span>
      <span className="kb-det-val">{valor || '—'}</span>
    </div>
  )
}

export const PacienteCard = memo(function PacienteCard({ tarefa: t, onAbrir, onPrefetch }: {
  tarefa: KanbanTarefa
  onAbrir: (t: KanbanTarefa) => void
  onPrefetch: (id: number) => void
}) {
  const [aberto, setAberto] = useState(false)
  const clicavel = t.internacao_id != null
  const limiteLonga = t.longa_30 ? t.limite_avancada : t.limite_longa

  // Prefetch dos dados do drawer no hover/foco (só quando há internação).
  const prefetchAoFocar = t.internacao_id != null
    ? () => onPrefetch(t.internacao_id as number)
    : undefined

  // O botão "mais detalhes" vive dentro de um card clicável: sem o stopPropagation
  // expandir abriria o drawer junto, e o usuário perderia o quadro só por querer
  // conferir um dado.
  function alternarDetalhes(e: React.MouseEvent) {
    e.stopPropagation()
    setAberto((v) => !v)
  }

  // Atrasada: sinal de alerta próprio, não só mais uma etiqueta entre outras —
  // é a razão de o card estar na coluna "Visitas atrasadas", então precisa ser
  // a primeira coisa lida.
  const atrasada = Boolean(t.visita_agendada && t.visita_agendada_vencida)

  return (
    <article
      className={`kb-card${clicavel ? ' clicavel' : ''}${atrasada ? ' atrasada' : ''}`}
      onClick={clicavel ? () => onAbrir(t) : undefined}
      onMouseEnter={prefetchAoFocar}
      onFocus={prefetchAoFocar}
    >
      {atrasada && (
        <div className="kb-card-alerta" title={
          t.visita_agendada_medico
            ? `Visita atrasada — responsável: ${t.visita_agendada_medico}`
            : 'Visita atrasada — sem médico responsável definido'
        }>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          </svg>
          <span>Atrasada</span>
          {t.visita_agendada_medico && (
            <span className="kb-card-alerta-medico">· {t.visita_agendada_medico}</span>
          )}
        </div>
      )}

      <div className="kb-card-top">
        {t.operadora_key && (
          <span title={t.hospital_nome ?? undefined}>
            <OpAvatar opKey={t.operadora_key} size={20} />
          </span>
        )}
        <span className="kb-card-nome">{nomeProprio(t.titulo) || t.titulo}</span>
        {/* "53d" sozinho não diz de quê: o rótulo vem junto, no próprio badge. */}
        {t.dias_sem_relatorio != null && (
          <Badge variant={t.dias_sem_relatorio > 7 ? 'danger' : 'warning'}>
            <span title={`${t.dias_sem_relatorio} dias sem relatório de auditoria`}>
              <span className="kb-dias">{t.dias_sem_relatorio}d</span>
              {' '}s/ relatório
            </span>
          </Badge>
        )}
      </div>

      <div className="kb-card-meta">
        {t.hospital_nome && <span>{t.hospital_nome}</span>}
      </div>

      {/* Onde o paciente está. Atendimento e tempo de internação desceram para
          "Mais detalhes": são consulta pontual, não triagem, e no topo disputavam
          espaço com o que decide a ação (hospital, leito, prazo). */}
      {(t.tipo_leito || t.leito_codigo) && (
        <div className="kb-card-clinico">
          <LeitoTag tipo={t.tipo_leito} />
          {t.leito_codigo && (
            <span title={`Leito ${t.leito_codigo}`}>
              <span className="kb-meta-lbl">Leito </span>
              <span className="kb-leito-cod">{t.leito_codigo}</span>
            </span>
          )}
        </div>
      )}

      {/* Etiquetas de prioridade: os mesmos sinais dos chips da barra, para o que
          foi filtrado lá em cima ficar explicado aqui embaixo. */}
      {(t.visita_agendada || ehUTI(t) || ehLonga(t) || nuncaVisitado(t)) && (
        <div className="kb-tags">
          {/* Vem primeiro: quando há compromisso marcado, é o que decide o que
              fazer com o card. Atrasada já tem a faixa de alerta no topo (com
              médico e "Atrasada"), então aqui só repete a data/hora — o resto
              seria repetição do que já foi dito de forma mais visível. */}
          {t.visita_agendada && (
            <Etiqueta
              texto={atrasada
                ? `Era ${dataBR(t.visita_agendada_em)}${t.visita_agendada_hora ? ` às ${t.visita_agendada_hora.slice(0, 5)}` : ''}`
                : `Visita em ${dataBR(t.visita_agendada_em)}`
                  + (t.visita_agendada_hora ? ` às ${t.visita_agendada_hora.slice(0, 5)}` : '')
                  + (t.visita_agendada_medico ? ` com ${t.visita_agendada_medico}` : '')}
              cor={atrasada ? 'var(--danger)' : 'var(--info)'}
              bg={atrasada ? 'var(--danger-bg)' : 'var(--info-bg)'}
              titulo={[
                t.visita_agendada_medico && `Responsável: ${t.visita_agendada_medico}`,
                t.visita_agendada_por && `Marcada por ${t.visita_agendada_por}`,
              ].filter(Boolean).join(' · ') || 'Visita marcada'}
            />
          )}
          {ehUTI(t) && <Etiqueta texto="UTI" cor="var(--warning-2)" bg="var(--warning-bg)" titulo="Paciente em leito de UTI" />}
          {ehLonga(t) && (
            <Etiqueta
              texto="Longa permanência"
              cor="var(--caution)"
              bg="var(--caution-bg)"
              titulo={limiteLonga != null
                ? `Acima de ${limiteLonga} dias de internação`
                : 'Acima do limite de dias da operadora'}
            />
          )}
          {/* "Nunca visitado" cede lugar à visita marcada: com a data na frente,
              dizer que nunca houve visita vira ruído — a pergunta ("e daí?") já
              está respondida pela etiqueta ao lado. Quando a visita é desmarcada
              ou vence sem acontecer, a etiqueta volta sozinha. */}
          {nuncaVisitado(t) && !t.visita_agendada && (
            <Etiqueta texto="Nunca visitado" cor="var(--info)" bg="var(--info-bg)" titulo="Sem nenhum relatório registrado até hoje" />
          )}

        </div>
      )}

      {/* Rodapé: "Mais detalhes" à esquerda e, no hover, a seta de "abrir" à
          direita. A seta mora AQUI, e não no canto do card, porque o canto
          superior é do badge de dias e o inferior muda de lugar quando os
          detalhes abrem; esta linha existe sempre e tem a direita livre. */}
      <div className="kb-card-rodape">
        <button type="button" className="kb-mais" onClick={alternarDetalhes} aria-expanded={aberto}>
          <span className={`kb-mais-seta${aberto ? ' aberta' : ''}`} aria-hidden>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </span>
          {aberto ? 'Menos detalhes' : 'Mais detalhes'}
        </button>
        {clicavel && (
          <span className="kb-card-abrir" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M7 7h10v10" /></svg>
          </span>
        )}
      </div>

      {aberto && (
        <div className="kb-det">
          <Linha rotulo="Atendimento" valor={t.atendimento} />
          <Linha rotulo="Tempo internado" valor={t.dias != null ? `${t.dias} dias` : null} />
          <Linha rotulo="Entrada" valor={dataBR(t.data_entrada)} />
          <Linha rotulo="Última visita" valor={t.data_ultima_visita ? dataBR(t.data_ultima_visita) : 'Nunca visitado'} />
          <Linha rotulo="Médico" valor={t.medico} />
          <Linha rotulo="Convênio" valor={t.convenio} />
          <Linha rotulo="Especialidade" valor={t.especialidade} />
          <Linha rotulo="Carteirinha" valor={t.carteirinha} />
          {t.senha && <Linha rotulo="Senha" valor={t.senha} />}
          {/* "Paciente: 67 · F" não dizia o que era cada parte; os dois campos
              viram linhas próprias, cada uma com o seu rótulo. */}
          {t.idade && <Linha rotulo="Idade" valor={t.idade} />}
          {t.sexo && <Linha rotulo="Sexo" valor={t.sexo} />}
          <div className="kb-det-acao">
            Abra o paciente para registrar relatório ou corrigir o cadastro.
          </div>
        </div>
      )}
    </article>
  )
})
