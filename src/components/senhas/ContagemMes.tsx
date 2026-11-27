// Módulo 2 > Senhas > Contagem do mês (23/11/2026, migration 0071). Sem a planilha do Bradesco (não existe
// arquivo), a conferência é manual (REGRAS do Bloco 2, 2.3): a contagem por auditor (validadas em dia útil e
// em fim de semana, canceladas, lançadas depois do prazo), o envio à diretoria e a decisão (aprovar, ou
// devolver com motivo). Enviada, a contagem é um retrato: o passado não recalcula. Por ora tudo é do admin.
// O auditor vê a dele no Meu mês do App.
import { useState } from 'react'
import { ConfirmarModal } from '../ConfirmarModal'
import { Badge, LoadingState, Modal } from '../ui'
import { useContagem, useDecidirContagem, useEnviarContagem } from '../../hooks/useSenhasPortal'
import { dataHora } from '../../lib/datas'

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const nomeMes = (c: string) => `${MESES[Number(c.slice(5, 7)) - 1]} de ${c.slice(0, 4)}`
const titulo = (c: string) => nomeMes(c).replace(/^./, (x) => x.toUpperCase())
const mover = (c: string, d: number) => {
  const t = new Date(Number(c.slice(0, 4)), Number(c.slice(5, 7)) - 1 + d, 1)
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`
}
const VAR = { enviada: 'info', aprovada: 'success', devolvida: 'warning' } as const

export default function ContagemMes({ onAviso }: { onAviso: (m: string) => void }) {
  const [comp, setComp] = useState('')
  const { data, isLoading, isError, error } = useContagem(comp)
  const enviar = useEnviarContagem()
  const decidir = useDecidirContagem()
  const [confirma, setConfirma] = useState<'enviar' | 'aprovar' | null>(null)
  const [devolvendo, setDevolvendo] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')

  if (isLoading) return <LoadingState />
  if (isError || !data) return <div className="card"><div className="sp-vazio">{(error as Error)?.message || 'Não foi possível carregar a contagem.'}</div></div>
  const c = data.competencia, st = data.contagem
  const total = (k: 'validadas_util' | 'validadas_fds' | 'canceladas' | 'tardias') => data.linhas.reduce((s, l) => s + l[k], 0)
  const gerir = data.pode_gerir && data.disponivel
  const falhou = (e: unknown) => { setConfirma(null); setDevolvendo(false); onAviso((e as Error).message || 'Não foi possível concluir.') }

  return (
    <>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-ghost btn-sm" aria-label="Mês anterior" onClick={() => setComp(mover(c, -1))}>‹</button>
            <div className="card-title">{titulo(c)}</div>
            <button type="button" className="btn btn-ghost btn-sm" aria-label="Mês seguinte" disabled={!data.fechado} onClick={() => setComp(mover(c, 1))}>›</button>
            {st ? <Badge variant={VAR[st.estado]}>{st.estado_nome}</Badge> : <Badge variant="muted">{data.fechado ? 'não enviada' : 'mês em andamento'}</Badge>}
          </div>
          {gerir && (
            <div style={{ display: 'flex', gap: 6 }}>
              {(!st || st.estado === 'devolvida') && (
                <button type="button" className="btn btn-primary btn-sm" disabled={!data.fechado || enviar.isPending} onClick={() => setConfirma('enviar')}>
                  {st ? 'Enviar de novo' : 'Enviar à diretoria'}
                </button>
              )}
              {st?.estado === 'enviada' && (
                <>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => { setMotivo(''); setErro(''); setDevolvendo(true) }}>Devolver</button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setConfirma('aprovar')}>Aprovar</button>
                </>
              )}
            </div>
          )}
        </div>
        <div className="card-body" style={{ fontSize: 'var(--t-sm)', color: 'var(--ink-2)' }}>
          {st ? (
            <>
              Enviada por {st.enviada_por} em {dataHora(st.enviada_em)}.
              {st.decidida_em && <> {st.estado === 'aprovada' ? 'Aprovada' : 'Devolvida'} por {st.decidida_por} em {dataHora(st.decidida_em)}{st.motivo ? `: ${st.motivo}` : ''}.</>}
              {data.retrato ? ' Os números são os do envio; o que foi lançado depois não muda a contagem.' : ' Os números abaixo são os de agora; o reenvio tira um retrato novo.'}
            </>
          ) : data.fechado
            ? 'Confira os números de cada auditor e envie. Enviada, a contagem vira um retrato: o que for lançado depois não muda o mês.'
            : 'O mês ainda não terminou: os números mudam até o último dia.'}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflow: 'auto' }}>
          <table className="bmais-table">
            <thead>
              <tr><th>Auditor</th><th>Validadas, dia útil</th><th>Validadas, fim de semana</th><th>Canceladas</th><th>Depois do prazo</th></tr>
            </thead>
            <tbody>
              {data.linhas.map((l) => (
                <tr key={l.profissional_id}>
                  <td className="sp-nome">{l.nome}</td><td>{l.validadas_util}</td><td>{l.validadas_fds}</td><td>{l.canceladas}</td><td>{l.tardias}</td>
                </tr>
              ))}
              {data.linhas.length > 0 && (
                <tr style={{ fontWeight: 600 }}>
                  <td>Total</td><td>{total('validadas_util')}</td><td>{total('validadas_fds')}</td><td>{total('canceladas')}</td><td>{total('tardias')}</td>
                </tr>
              )}
              {data.linhas.length === 0 && <tr><td colSpan={5} className="sp-vazio">Nenhuma senha lançada neste mês.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <p className="sp-sub" style={{ margin: '8px 2px 0' }}>Conta no dia do lançamento. Sábado e domingo são fim de semana (ainda sem a lista de feriados). "Depois do prazo" só nas senhas cadastradas aqui, que têm a hora da solicitação.</p>

      {confirma && (
        <ConfirmarModal titulo={confirma === 'enviar' ? 'Enviar a contagem' : 'Aprovar a contagem'} confirmar={confirma === 'enviar' ? 'Enviar' : 'Aprovar'}
          cancelar="Voltar" ocupado={enviar.isPending || decidir.isPending} onCancelar={() => setConfirma(null)}
          onConfirmar={() => confirma === 'enviar'
            ? enviar.mutate(c, { onSuccess: () => { setConfirma(null); onAviso(`Contagem de ${nomeMes(c)} enviada`) }, onError: falhou })
            : decidir.mutate({ comp: c, aprovar: true }, { onSuccess: () => { setConfirma(null); onAviso(`Contagem de ${nomeMes(c)} aprovada`) }, onError: falhou })}>
          <div>
            {confirma === 'enviar'
              ? <><strong>{total('validadas_util') + total('validadas_fds')}</strong> validadas e <strong>{total('canceladas')}</strong> canceladas em {nomeMes(c)}, de {data.linhas.length} auditores. O auditor vê a dele no App.</>
              : <>A contagem de {nomeMes(c)} fica aprovada. O auditor vê no App.</>}
          </div>
        </ConfirmarModal>
      )}
      {devolvendo && (
        <Modal title="Devolver a contagem" onClose={decidir.isPending ? () => {} : () => setDevolvendo(false)}
          footer={(
            <>
              <button type="button" className="btn btn-outline" onClick={() => setDevolvendo(false)} disabled={decidir.isPending}>Voltar</button>
              <button type="button" className="btn btn-primary" disabled={decidir.isPending}
                onClick={() => {
                  if ((motivo.match(/\p{L}/gu) ?? []).length < 4) { setErro('Escreva o motivo da devolução.'); return }
                  decidir.mutate({ comp: c, aprovar: false, motivo: motivo.trim() }, { onSuccess: () => { setDevolvendo(false); onAviso(`Contagem de ${nomeMes(c)} devolvida`) }, onError: falhou })
                }}>Devolver</button>
            </>
          )}>
          <label className="form-lbl" htmlFor="sp-dev">Motivo</label>
          <input id="sp-dev" className="bm-input" value={motivo} autoFocus onChange={(e) => setMotivo(e.target.value)} placeholder="O que precisa ser revisto" />
          {erro && <p className="sp-erro">{erro}</p>}
        </Modal>
      )}
    </>
  )
}
