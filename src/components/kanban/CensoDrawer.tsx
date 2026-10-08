// Drawer do card de censo (Tarefas, aba Censos), irmão do drawer do paciente:
// resumo do par hospital + operadora, contato do hospital, a timeline dos
// últimos dias e as ações da coluna.
//
// A timeline junta as anotações (toda movimentação manual exige uma: "Falei com
// a Maria da recepção") e os censos que chegaram. É a mesma timeline do
// paciente (TimelineEventos): os eventos de censo só são traduzidos para o
// formato dela, com data e hora no fuso de quem lê.
//
// `tarefa` vem viva do quadro: quando um movimento anda o card, o drawer
// acompanha a coluna nova sem fechar.
import { useEffect, useState } from 'react'
import type { CensoEvento, KanbanTarefa, TimelineEvento } from '../../types/api'
import { OpAvatar } from '../ui'
import HospitalDetalhesModal from '../HospitalDetalhesModal'
import { TimelineEventos } from '../timeline/TimelineEventos'
import { useHospital } from '../../hooks/useHospital'
import { useTimelineCenso } from '../../hooks/useKanban'
import { dataBR, diaRelativo, labelCurto } from '../../lib/datas'
import { nomeProprio } from '../../lib/texto'
import { useTravarScroll } from '../../lib/travarScroll'
import { COLUNAS_CENSO } from './colunas'
import { ACOES_CENSO, type AcaoCenso, type ExecutarCenso } from './acoesCenso'
import { AnotacaoCensoModal } from './AnotacaoCensoModal'

const doisDigitos = (n: number) => String(n).padStart(2, '0')

/** Evento do censo no formato da timeline do paciente. */
function paraTimeline(ev: CensoEvento): TimelineEvento {
  const dt = new Date(ev.em)
  const valida = !Number.isNaN(dt.getTime())
  return {
    // Prefixo CENSO_ para as cores (TIPO_CLASSE) não colidirem com as do paciente.
    tipo: ev.tipo.startsWith('CENSO_') ? ev.tipo : `CENSO_${ev.tipo}`,
    titulo: ev.titulo,
    descricao: ev.tipo === 'CENSO_RECEBIDO'
      ? (ev.data_censo ? `Censo de ${dataBR(ev.data_censo)}` : null)
      : ev.texto,
    data: valida ? `${dt.getFullYear()}-${doisDigitos(dt.getMonth() + 1)}-${doisDigitos(dt.getDate())}` : null,
    hora: valida ? `${doisDigitos(dt.getHours())}:${doisDigitos(dt.getMinutes())}` : null,
    variante: 'neutral',
    autor: ev.autor,
    autor_role: ev.autor_role,
  }
}

/** Ações do rodapé por coluna: a principal à direita, o desfazer à esquerda. */
function acoesDaColuna(t: KanbanTarefa): { principal?: AcaoCenso; desfazer?: AcaoCenso } {
  if (t.estado_censo === 'censos_atrasados') return { principal: 'cobrar' }
  if (t.estado_censo === 'aguardando_retorno') return { principal: 'atualizar', desfazer: 'desfazer' }
  if (t.estado_censo === 'censos_processados' && t.atualizado_em) return { desfazer: 'desfazerAtualizado' }
  return {}
}

function Kpi({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="dk">
      <div className="dk-label">{rotulo}</div>
      <div className="dk-value" style={{ fontSize: 'var(--t-lg)' }}>{valor}</div>
    </div>
  )
}

export default function CensoDrawer({
  tarefa, podeEscrever, ocupado, onExecutar, onClose, onAbrirCadastro,
}: {
  tarefa: KanbanTarefa
  /** false = perfil de observação: lê a timeline, sem ações. */
  podeEscrever: boolean
  /** Ação deste card em andamento (vinda do quadro). */
  ocupado: boolean
  onExecutar: ExecutarCenso
  onClose: () => void
  onAbrirCadastro?: (key: string) => void
}) {
  const hk = tarefa.hospital_key ?? ''
  const timeline = useTimelineCenso({ hospitalKey: hk, operadoraKey: tarefa.operadora_key ?? '' })
  // Contato de quem cobrar. Mesma consulta (e cache) da ficha do hospital.
  const { data: hospital } = useHospital(hk || null)
  const [acao, setAcao] = useState<AcaoCenso | null>(null)
  const [fichaAberta, setFichaAberta] = useState(false)

  useTravarScroll()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Com uma camada por cima, o Escape fecha só ela.
      if (e.key !== 'Escape') return
      if (acao) setAcao(null)
      else if (fichaAberta) setFichaAberta(false)
      else onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, acao, fichaAberta])

  const coluna = COLUNAS_CENSO.find((c) => c.key === tarefa.estado_censo)
  const { principal, desfazer } = podeEscrever ? acoesDaColuna(tarefa) : {}
  const pendente = tarefa.estado_censo === 'censos_atrasados' || tarefa.estado_censo === 'aguardando_retorno'
  const contato = [hospital?.telefone, hospital?.email].filter(Boolean).join(' · ')

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" style={{ display: 'flex' }} role="dialog" aria-modal="true">
        <div className="drawer-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          {tarefa.operadora_key && <OpAvatar opKey={tarefa.operadora_key} size={28} />}
          <div className="flex-1" style={{ minWidth: 0 }}>
            <div style={{ fontSize: 'var(--t-lg)', fontWeight: 600, letterSpacing: '-.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nomeProprio(tarefa.hospital_nome || tarefa.titulo)}
            </div>
            <div className="row" style={{ gap: 8, alignItems: 'center', fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
              {tarefa.operadora_nome && <span>{tarefa.operadora_nome}</span>}
              {coluna && (
                <span className="badge" style={{ background: coluna.corBg, color: coluna.cor, textTransform: 'none', letterSpacing: 0 }}>
                  {coluna.titulo}
                </span>
              )}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 6, flexShrink: 0 }} title="Fechar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="drawer-body" style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
            <Kpi rotulo="Sem atualizar" valor={tarefa.dias_sem_censo != null ? `${tarefa.dias_sem_censo}d` : '—'} />
            <Kpi rotulo="Última atualização" valor={tarefa.ultimo_censo ? diaRelativo(tarefa.ultimo_censo) : 'Nunca enviou'} />
            <Kpi rotulo="Pendente desde" valor={pendente ? (labelCurto(tarefa.data_ref) || '—') : '—'} />
          </div>

          <div className="row" style={{ gap: 10, alignItems: 'center', fontSize: 'var(--t-sm)', marginBottom: 22 }}>
            <span className="flex-1" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
              <span style={{ color: 'var(--muted-2)' }}>Contato </span>
              {contato || (hospital ? 'Sem telefone ou e-mail no cadastro' : '…')}
            </span>
            <button type="button" className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}
                    onClick={() => setFichaAberta(true)}>
              Ficha do hospital
            </button>
          </div>

          <div className="row" style={{ alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div className="section-label flex-1" style={{ margin: 0 }}>
              Timeline · últimos {timeline.data?.dias ?? 15} dias
            </div>
            {podeEscrever && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setAcao('anotar')}>
                Nova anotação
              </button>
            )}
          </div>
          <TimelineEventos
            eventos={timeline.data?.eventos.map(paraTimeline)}
            carregando={timeline.isLoading}
            erro={timeline.isError}
          />
        </div>

        <div className="drawer-footer" style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          {desfazer && (
            <button type="button" className="btn btn-ghost" style={{ marginRight: 'auto' }}
                    disabled={ocupado} onClick={() => setAcao(desfazer)}>
              {ACOES_CENSO[desfazer].titulo}
            </button>
          )}
          <button type="button" className="btn btn-outline" onClick={onClose}>Fechar</button>
          {principal && (
            <button type="button" className="btn btn-primary" disabled={ocupado} onClick={() => setAcao(principal)}>
              {ocupado ? 'Registrando…' : ACOES_CENSO[principal].titulo}
            </button>
          )}
        </div>
      </div>

      {acao && (
        <AnotacaoCensoModal
          tarefa={tarefa}
          acao={acao}
          sobreposta
          onConfirmar={(texto) => onExecutar(tarefa, acao, texto)}
          onClose={() => setAcao(null)}
        />
      )}

      {fichaAberta && hk && (
        <HospitalDetalhesModal
          hospital={{ key: hk, nome: tarefa.hospital_nome || tarefa.titulo }}
          onClose={() => setFichaAberta(false)}
          onAbrirCadastro={onAbrirCadastro}
          sobreposta
        />
      )}
    </>
  )
}
