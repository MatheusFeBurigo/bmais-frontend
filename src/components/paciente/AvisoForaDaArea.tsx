// Aviso da ficha (e do drawer) para o paciente de FORA da área de quem abriu, com
// o pedido de autorização para relatório (09/11/2026, migration 0061).
//
// Sem pedido, o aviso diz que a ficha é só para leitura e, para quem pode pedir
// (técnico e coordenador técnico), oferece "Pedir autorização para relatório".
// Pendente, mostra que o pedido está com a coordenação e deixa cancelar.
// Aprovado, avisa que UM relatório está liberado. Recusado ou já usado, mostra
// o desfecho e deixa pedir de novo.
import { useState } from 'react'
import {
  useCancelarAutorizacao, useLiberacaoRelatorio, usePedirAutorizacao,
} from '../../hooks/useAutorizacoes'
import { dataHora } from '../../lib/datas'
import type { AutorizacaoRelatorio } from '../../services/autorizacoes.service'
import { Alerta } from '../Alerta'
import { Modal } from '../ui'

const MOTIVO_MAX = 1000

function Resposta({ a }: { a: AutorizacaoRelatorio }) {
  return a.resposta ? <> Mensagem: “{a.resposta}”</> : null
}

export function AvisoForaDaArea({ internacaoId, hospitalNome, naFicha }: {
  internacaoId: number
  hospitalNome?: string | null
  /** Falso no drawer: lá não se registra relatório, então o liberado manda à ficha. */
  naFicha: boolean
}) {
  const { pede, liberado, dados } = useLiberacaoRelatorio(internacaoId, true)
  const pedir = usePedirAutorizacao(internacaoId)
  const cancelar = useCancelarAutorizacao()
  const [aberto, setAberto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  const a = dados?.autorizacao ?? null
  const hospital = hospitalNome || 'hospital'

  function enviar() {
    setErro('')
    pedir.mutate(motivo.trim(), {
      onSuccess: () => { setAberto(false); setMotivo('') },
      onError: (e) => setErro((e as Error).message || 'Não foi possível enviar o pedido. Tente de novo.'),
    })
  }

  const botaoPedir = pede && dados?.pode_pedir ? (
    <button type="button" className="btn btn-outline btn-sm" onClick={() => { setErro(''); setAberto(true) }}>
      Pedir autorização para relatório
    </button>
  ) : undefined

  let aviso
  if (liberado && a) {
    aviso = (
      <Alerta nivel="nota">
        Este paciente não é da sua área, mas {a.decidido_por_nome || 'a coordenação'} aprovou seu pedido:{' '}
        <strong>você pode registrar um relatório</strong>
        {naFicha ? ' em Relatórios, nesta ficha.' : '. Abra a ficha completa para registrar.'}{' '}
        CID, alta e edição seguem com quem cobre o {hospital}.
        <Resposta a={a} />
      </Alerta>
    )
  } else if (a?.situacao === 'pendente') {
    aviso = (
      <Alerta nivel="atencao" acao={(
        <button type="button" className="btn btn-ghost btn-sm" disabled={cancelar.isPending}
          onClick={() => cancelar.mutate(a.id)}>
          {cancelar.isPending ? 'Cancelando…' : 'Cancelar pedido'}
        </button>
      )}>
        Este paciente não é da sua área. Seu pedido de autorização para relatório, de{' '}
        {dataHora(a.criado_em)}, está com o coordenador técnico e o gestor, em Aprovações.
      </Alerta>
    )
  } else {
    aviso = (
      <Alerta nivel="nota" acao={botaoPedir}>
        Este paciente não é da sua área. A ficha abre só para leitura: relatório, CID, alta e
        edição ficam com quem cobre o {hospital}.
        {a?.situacao === 'recusada' && (
          <> Seu último pedido de autorização foi recusado
            {a.decidido_por_nome && ` por ${a.decidido_por_nome}`}.<Resposta a={a} /></>
        )}
        {a?.situacao === 'usada' && (
          <> O relatório que você foi autorizado a registrar já foi gravado. Para outro, peça de novo.</>
        )}
      </Alerta>
    )
  }

  return (
    <>
      {aviso}
      {aberto && (
        <Modal title="Pedir autorização para relatório" onClose={() => setAberto(false)}
          footer={(
            <>
              <button type="button" className="btn btn-outline" onClick={() => setAberto(false)}
                disabled={pedir.isPending}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={enviar}
                disabled={pedir.isPending || !motivo.trim()}>
                {pedir.isPending ? 'Enviando…' : 'Enviar pedido'}
              </button>
            </>
          )}>
          <p style={{ margin: '0 0 12px', fontSize: 'var(--t-sm)', color: 'var(--ink-2)' }}>
            O pedido vai para a tela Aprovações do coordenador técnico e do gestor. Aprovado, você
            poderá registrar <strong>um</strong> relatório deste paciente.
          </p>
          <label htmlFor="autoriz-motivo"
            style={{ display: 'block', fontSize: 'var(--t-sm)', fontWeight: 600, marginBottom: 6 }}>
            Motivo
          </label>
          <textarea id="autoriz-motivo" className="bm-input" rows={3} maxLength={MOTIVO_MAX}
            value={motivo} disabled={pedir.isPending} autoFocus
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
            placeholder="Ex.: estou cobrindo a visita da colega no hospital hoje"
            onChange={(e) => setMotivo(e.target.value)} />
          {erro && (
            <div style={{ marginTop: 8, fontSize: 'var(--t-sm)', color: 'var(--danger)' }}>{erro}</div>
          )}
        </Modal>
      )}
    </>
  )
}
