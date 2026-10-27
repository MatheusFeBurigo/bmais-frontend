// Réplicas das pendências (27/10/2026), usadas nos "como fazer" de Tarefas: a
// aba Pendências, o modal "Nova pendência" e o aviso de pendência nova.
//
// Reusam o que é puro na tela real: o quadro (QuadroPendenciasVisao), o card
// (CartaoPendencia) e o corpo do aviso (ListaPendenciasNovas), com dados
// fictícios. Como são componentes reais, os passos se marcam pela <Tela>
// (`destaques`), com as classes deles: `.pd-col-<situação>`, `.pd-com`,
// `.pd-aguardar`, `.pd-concluir`, `.pd-reabrir`, `.pd-nova`.
//
// O modal "Nova pendência" é redesenhado com as mesmas classes: o real busca a
// equipe e grava ao enviar. A moldura do aviso também: o modal real é fixo na
// janela. Mudou a tela? Confira a réplica.
//
// Os nomes são inventados: nenhum dado real de paciente entra na documentação.
import type { ReactNode } from 'react'
import type { Pendencia } from '../../types/api'
import { localStyles as kanbanStyles } from '../kanban/kanban.styles'
import { ListaPendenciasNovas } from '../pendencias/AvisoPendencias'
import { CartaoPendencia } from '../pendencias/CartaoPendencia'
import { QuadroPendenciasVisao } from '../pendencias/QuadroPendenciasVisao'
import { estilosPendencias } from '../pendencias/pendencias.styles'
import Tabs from '../Tabs'
import { hojeISO } from '../../lib/datas'
import { ROLE_LABEL } from '../../lib/usuarioRoles'
import { Topo } from './exemplosOperacao'
import { Marcado, ModalReplica } from './replica'

const nada = () => {}

/** Uma pendência fictícia: a da técnica Ana, pedida pela coordenadora Carla,
 *  vista por Ana. Cada exemplo muda só o que tem de diferente. */
function pendencia(d: Partial<Pendencia> & Pick<Pendencia, 'id' | 'titulo'>): Pendencia {
  return {
    descricao: null, paciente: null, prazo: null, vencida: false,
    responsavel: 'ana', responsavel_nome: 'Ana Ribeiro', criado_por_nome: 'Carla Mendes',
    criado_em: '2026-10-22T13:00:00Z', situacao: 'pendente', relacao: 'recebida',
    pode_concluir: true, pode_excluir: false, pode_mover: true, pode_reabrir: false,
    ...d,
  }
}

const RESOLVIDA = { situacao: 'resolvida', pode_concluir: false, pode_excluir: false, pode_mover: false,
  pode_reabrir: true, concluida_em: '2026-10-23T18:00:00Z', concluida_por_nome: 'Ana Ribeiro' } as const

// O que a técnica Ana vê: tudo foi pedido a ela pela coordenadora.
const RECEBIDAS: Pendencia[] = [
  pendencia({ id: 1, titulo: 'Responder o e-mail da operadora sobre a senha', paciente: 'Maria A. Souza',
    prazo: '2026-10-24', vencida: true }),
  // O prazo é o dia em que a Ajuda é lida: a tag mostra "Vence hoje".
  pendencia({ id: 2, titulo: 'Conferir o CID do último relatório', paciente: 'João P. Lima', prazo: hojeISO() }),
  pendencia({ id: 3, titulo: 'Pedir ao hospital a cópia do prontuário', situacao: 'aguardando',
    descricao: 'E-mail enviado ao faturamento do Hospital Santa Clara.', aguardando_em: '2026-10-25T14:00:00Z' }),
  pendencia({ id: 4, titulo: 'Ligar para a família sobre a alta', paciente: 'Rosa M. Dias', ...RESOLVIDA }),
]

// O que a coordenadora Carla vê: o que pediu a si mesma e o que pediu à
// equipe, nesta ordem, como a tela junta (recebidas antes das pedidas).
const PEDIDA = { relacao: 'pedida', pode_excluir: true } as const
const DA_COORDENACAO: Pendencia[] = [
  pendencia({ id: 5, titulo: 'Revisar a escala da semana que vem', responsavel: 'carla',
    responsavel_nome: 'Carla Mendes', prazo: '2026-10-30', pode_excluir: true }),
  pendencia({ ...RECEBIDAS[0], ...PEDIDA }),
  pendencia({ id: 6, titulo: 'Cobrar o relatório da visita de ontem', responsavel: 'bruno',
    responsavel_nome: 'Bruno Alves', paciente: 'Paulo R. Nunes', ...PEDIDA }),
  pendencia({ ...RECEBIDAS[2], ...PEDIDA }),
  pendencia({ ...RECEBIDAS[3], ...PEDIDA, pode_excluir: false }),
]

const cartao = (p: Pendencia): ReactNode => (
  <CartaoPendencia p={p} onConcluir={nada} onMover={nada} onExcluir={nada} />
)

/** A aba Pendências de Tarefas. Sem `coordenador`, é o quadro de quem recebe
 *  (a técnica); com ele, o de quem pede, com o filtro e "Nova pendência". */
export function ReplicaQuadroPendencias({ coordenador }: { coordenador?: boolean }) {
  const pendencias = coordenador ? DA_COORDENACAO : RECEBIDAS
  const abertas = pendencias.filter((p) => p.situacao !== 'resolvida').length
  return (
    <>
      <style>{kanbanStyles}</style>
      <Topo titulo="Tarefas" sub="4 tarefas pendentes" />
      <div style={{ marginBottom: 12 }}>
        <Tabs tabs={[{ key: 'pacientes', label: 'Pacientes', count: 4 },
          { key: 'pendencias', label: 'Pendências', count: abertas }]}
          active="pendencias" onChange={nada} />
      </div>
      <QuadroPendenciasVisao pendencias={pendencias} podePedir={!!coordenador} onNova={nada} cartao={cartao} />
    </>
  )
}

/** As pendências abertas de uma pessoa, como o painel dela na Distribuição de
 *  tarefas mostra para quem pediu. */
export function CartoesPendencias({ pendencias }: { pendencias: Pendencia[] }) {
  return (
    <>
      <style>{estilosPendencias}</style>
      <div className="pd-lista">{pendencias.map((p) => <div key={p.id}>{cartao(p)}</div>)}</div>
    </>
  )
}

function Campo({ rotulo, obrigatorio, children }: { rotulo: string; obrigatorio?: boolean; children: ReactNode }) {
  return (
    <label className="pd-campo">
      <span className="form-lbl">{rotulo}{obrigatorio && <span className="req">*</span>}</span>
      {children}
    </label>
  )
}

/** O modal "Nova pendência", preenchido. */
export function ReplicaNovaPendencia({ marcas = {} }: {
  marcas?: Partial<Record<'para' | 'oque' | 'opcionais' | 'enviar', number>>
}) {
  return (
    <>
      <style>{estilosPendencias}</style>
      <ModalReplica titulo="Nova pendência" largura={520} rodape={(
        <>
          <span className="btn btn-outline btn-sm">Cancelar</span>
          <Marcado n={marcas.enviar}>
            <span className="btn btn-primary btn-sm">Enviar pendência</span>
          </Marcado>
        </>
      )}>
        <div style={{ display: 'grid', gap: 12 }}>
          <Marcado n={marcas.para} bloco>
            <Campo rotulo="Para" obrigatorio>
              <select className="bm-input bm-select" value="ana" onChange={nada}>
                <option value="ana">Ana Ribeiro · {ROLE_LABEL.tecnico}</option>
              </select>
            </Campo>
          </Marcado>
          <Marcado n={marcas.oque} bloco>
            <Campo rotulo="O que fazer" obrigatorio>
              <input className="bm-input" readOnly value="Responder o e-mail da operadora sobre a senha" />
            </Campo>
          </Marcado>
          <Marcado n={marcas.opcionais} bloco>
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="pd-par">
                <Campo rotulo="Paciente">
                  <input className="bm-input" readOnly value="Maria A. Souza" />
                </Campo>
                <Campo rotulo="Prazo">
                  <input className="bm-input" readOnly value="30/10/2026" />
                </Campo>
              </div>
              <Campo rotulo="Detalhes">
                <textarea className="bm-input" rows={3} readOnly style={{ resize: 'none', fontFamily: 'inherit' }}
                  value="A operadora pediu a senha de autorização da internação até sexta." />
              </Campo>
            </div>
          </Marcado>
        </div>
      </ModalReplica>
    </>
  )
}

/** O aviso de pendência nova, que abre em qualquer tela para quem recebeu. */
export function ReplicaAvisoPendencia({ marcas = {} }: {
  marcas?: Partial<Record<'ver' | 'depois', number>>
}) {
  const novas = RECEBIDAS.filter((p) => p.situacao === 'pendente')
  return (
    <ModalReplica titulo={`Você recebeu ${novas.length} pendências`} rodape={(
      <>
        <Marcado n={marcas.depois}><span className="btn btn-ghost">Depois</span></Marcado>
        <Marcado n={marcas.ver}><span className="btn btn-primary">Ver pendências</span></Marcado>
      </>
    )}>
      <ListaPendenciasNovas pendencias={novas} />
    </ModalReplica>
  )
}
