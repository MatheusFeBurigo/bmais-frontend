// Tela Aprovações (09/11/2026, migration 0061): os pedidos do técnico (ou do
// coordenador técnico) para registrar relatório de um paciente que não é da área
// dele. Pedido do usuário: "isso vai cair em uma tela de aprovações, que vai
// aparecer para os coordenadores técnicos e Gestor" (o admin vê para supervisão).
//
// Aprovar libera UM relatório daquela internação para quem pediu; recusar deixa
// a ficha só para leitura. Nos dois casos quem decide pode deixar uma mensagem,
// que aparece na ficha para quem pediu. Ninguém decide o próprio pedido.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageHeader } from '../components/PageHeader'
import Tabs from '../components/Tabs'
import Toast from '../components/Toast'
import { Badge, LoadingState, Modal, OpAvatar } from '../components/ui'
import { useAutorizacoes, useDecidirAutorizacao } from '../hooks/useAutorizacoes'
import { dataHora } from '../lib/datas'
import { nomeProprio } from '../lib/texto'
import { ROLE_LABEL } from '../lib/usuarioRoles'
import type { UserRole } from '../types/api'
import type {
  AutorizacaoRelatorio, QuaisAutorizacoes, SituacaoAutorizacao,
} from '../services/autorizacoes.service'

const estilos = `
.apv-lista{display:flex;flex-direction:column}
.apv-item{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:12px;align-items:start;
  padding:14px 0;border-top:1px solid var(--border-soft)}
.apv-item:first-child{border-top:0;padding-top:4px}
.apv-paciente{font-weight:600;color:var(--ink);text-decoration:none}
.apv-paciente:hover{text-decoration:underline}
.apv-sub{font-size:var(--t-sm);color:var(--muted);margin-top:2px}
.apv-motivo{margin-top:8px;padding:8px 11px;background:var(--surface-2);border-left:3px solid var(--border-strong);
  border-radius:var(--r-xs);font-size:var(--t-sm);color:var(--ink-2);white-space:pre-wrap;overflow-wrap:anywhere}
.apv-resposta{margin-top:6px;font-size:var(--t-sm);color:var(--ink-2);white-space:pre-wrap;overflow-wrap:anywhere}
.apv-acoes{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
.apv-vazio{padding:28px 8px;text-align:center;color:var(--muted);font-size:var(--t-sm)}
@media(max-width:640px){
  .apv-item{grid-template-columns:28px minmax(0,1fr)}
  .apv-acoes{grid-column:1 / -1;justify-content:flex-start}
}
`

const SITUACAO: Record<SituacaoAutorizacao, { rotulo: string; variante: 'success' | 'info' | 'danger' | 'muted' | 'warning' }> = {
  pendente: { rotulo: 'Pendente', variante: 'warning' },
  aprovada: { rotulo: 'Aprovada, aguardando o relatório', variante: 'info' },
  usada: { rotulo: 'Relatório registrado', variante: 'success' },
  recusada: { rotulo: 'Recusada', variante: 'danger' },
  cancelada: { rotulo: 'Cancelada por quem pediu', variante: 'muted' },
}

function quemPediu(a: AutorizacaoRelatorio): string {
  const papel = a.solicitante_role ? ROLE_LABEL[a.solicitante_role as UserRole] : null
  return [a.solicitante_nome || 'Alguém da equipe', papel && `(${papel})`].filter(Boolean).join(' ')
}

function Pedido({ a, onDecidir }: {
  a: AutorizacaoRelatorio
  onDecidir?: (a: AutorizacaoRelatorio, aprovar: boolean) => void
}) {
  const p = a.paciente
  const sit = SITUACAO[a.situacao]
  return (
    <div className="apv-item">
      {p?.operadora_key ? <OpAvatar opKey={p.operadora_key} size={28} /> : <span />}
      <div style={{ minWidth: 0 }}>
        <Link to={`/paciente/${a.internacao_id}`} className="apv-paciente">
          {p?.nome ? nomeProprio(p.nome) : `Internação ${a.internacao_id}`}
        </Link>
        <div className="apv-sub">
          {[p?.hospital_nome && nomeProprio(p.hospital_nome), p?.operadora_nome, p?.leito]
            .filter(Boolean).join(' · ')}
        </div>
        <div className="apv-sub">Pedido por {quemPediu(a)} · {dataHora(a.criado_em)}</div>
        {a.motivo && <div className="apv-motivo">{a.motivo}</div>}
        {a.situacao !== 'pendente' && a.situacao !== 'cancelada' && (
          <div className="apv-sub" style={{ marginTop: 8 }}>
            {a.situacao === 'recusada' ? 'Recusado' : 'Aprovado'}
            {a.decidido_por_nome && ` por ${a.decidido_por_nome}`}
            {a.decidido_em && ` · ${dataHora(a.decidido_em)}`}
            {a.situacao === 'usada' && a.usada_em && ` · relatório em ${dataHora(a.usada_em)}`}
          </div>
        )}
        {a.resposta && <div className="apv-resposta">“{a.resposta}”</div>}
      </div>
      <div className="apv-acoes">
        {a.situacao !== 'pendente' ? (
          <Badge variant={sit.variante}>{sit.rotulo}</Badge>
        ) : a.pode_decidir && onDecidir ? (
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDecidir(a, false)}>
              Recusar
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onDecidir(a, true)}>
              Aprovar
            </button>
          </>
        ) : a.meu ? (
          // O coordenador técnico também pede: o pedido dele aparece na lista,
          // mas a decisão é de outra pessoa.
          <Badge variant="muted">Seu pedido: outra pessoa decide</Badge>
        ) : null}
      </div>
    </div>
  )
}

function DecidirModal({ a, aprovar, gravando, onConfirmar, onFechar }: {
  a: AutorizacaoRelatorio
  aprovar: boolean
  gravando: boolean
  onConfirmar: (resposta: string) => void
  onFechar: () => void
}) {
  const [resposta, setResposta] = useState('')
  const quem = a.solicitante_nome || 'quem pediu'
  const paciente = a.paciente?.nome ? nomeProprio(a.paciente.nome) : 'este paciente'
  return (
    <Modal title={aprovar ? 'Aprovar pedido' : 'Recusar pedido'} onClose={onFechar}
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onFechar} disabled={gravando}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary"
            disabled={gravando} onClick={() => onConfirmar(resposta.trim())}>
            {gravando ? 'Gravando…' : aprovar ? 'Aprovar' : 'Recusar'}
          </button>
        </>
      )}>
      <p style={{ margin: '0 0 12px', fontSize: 'var(--t-sm)', color: 'var(--ink-2)' }}>
        {aprovar
          ? <>{quem} poderá registrar <strong>um</strong> relatório de {paciente}. Para outro, será preciso pedir de novo.</>
          : <>A ficha de {paciente} continua só para leitura para {quem}.</>}
      </p>
      <label style={{ display: 'block', fontSize: 'var(--t-sm)', fontWeight: 600, marginBottom: 6 }}
        htmlFor="apv-resposta">
        Mensagem para quem pediu <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(opcional)</span>
      </label>
      <textarea id="apv-resposta" className="bm-input" rows={3} maxLength={1000} value={resposta}
        style={{ resize: 'vertical', fontFamily: 'inherit' }} disabled={gravando}
        placeholder={aprovar ? 'Ex.: liberado só para a visita de hoje' : 'Ex.: a Dra. Fulana já fez a visita'}
        onChange={(e) => setResposta(e.target.value)} />
    </Modal>
  )
}

export default function Aprovacoes() {
  const [aba, setAba] = useState<QuaisAutorizacoes>('pendentes')
  const pendentes = useAutorizacoes('pendentes')
  const decididas = useAutorizacoes('decididas')
  const decidir = useDecidirAutorizacao()
  const [decidindo, setDecidindo] = useState<{ a: AutorizacaoRelatorio; aprovar: boolean } | null>(null)
  const [aviso, setAviso] = useState('')

  usePageHeader(useMemo(() => ({
    title: 'Aprovações',
    subtitle: 'Pedidos para registrar relatório de paciente fora da área',
  }), []))

  const atual = aba === 'pendentes' ? pendentes : decididas
  const lista = atual.data?.autorizacoes ?? []
  const nPendentes = pendentes.data?.autorizacoes.filter((a) => a.pode_decidir).length

  function confirmar(resposta: string) {
    if (!decidindo) return
    const { a, aprovar } = decidindo
    decidir.mutate({ id: a.id, aprovar, resposta }, {
      onSuccess: () => {
        setDecidindo(null)
        setAviso(aprovar ? 'Pedido aprovado' : 'Pedido recusado')
      },
      onError: (e) => {
        setDecidindo(null)
        setAviso((e as Error).message || 'Não foi possível responder ao pedido. Tente de novo.')
      },
    })
  }

  return (
    <div>
      <style>{estilos}</style>
      <div style={{ marginBottom: 14 }}>
        <Tabs active={aba} onChange={(k) => setAba(k as QuaisAutorizacoes)} tabs={[
          { key: 'pendentes', label: 'Pendentes', count: nPendentes },
          { key: 'decididas', label: 'Decididas (30 dias)' },
        ]} />
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              {aba === 'pendentes' ? 'Esperando decisão' : 'Decididos nos últimos 30 dias'}
            </div>
            <p className="card-sub">
              {aba === 'pendentes'
                ? 'Cada aprovação libera um relatório do paciente para quem pediu.'
                : 'Aprovados, recusados e cancelados, do mais novo ao mais antigo.'}
            </p>
          </div>
        </div>
        <div className="card-body">
          {atual.isLoading ? (
            <LoadingState />
          ) : atual.isError ? (
            <div className="apv-vazio">
              {(atual.error as Error)?.message || 'Não foi possível carregar os pedidos.'}
            </div>
          ) : lista.length === 0 ? (
            <div className="apv-vazio">
              {aba === 'pendentes' ? 'Nenhum pedido esperando decisão.' : 'Nenhum pedido decidido nos últimos 30 dias.'}
            </div>
          ) : (
            <div className="apv-lista">
              {lista.map((a) => (
                <Pedido key={a.id} a={a}
                  onDecidir={(alvo, aprovar) => setDecidindo({ a: alvo, aprovar })} />
              ))}
            </div>
          )}
        </div>
      </div>

      {decidindo && (
        <DecidirModal a={decidindo.a} aprovar={decidindo.aprovar} gravando={decidir.isPending}
          onConfirmar={confirmar} onFechar={() => setDecidindo(null)} />
      )}
      {aviso && <Toast message={aviso} onDone={() => setAviso('')} />}
    </div>
  )
}
