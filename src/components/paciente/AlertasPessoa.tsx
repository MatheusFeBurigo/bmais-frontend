// Avisos da ficha sobre as OUTRAS internações da mesma pessoa (migration 0049).
//
// Dois casos, cada um com o nível do Alerta que lhe cabe:
//   - existe uma internação mais nova (outro hospital ou reinternação): nota. A
//     ficha aberta conta o passado, e quem chegou por um link antigo precisa
//     saber onde o paciente está agora;
//   - só o nome bate com outra internação: atenção. O sistema não junta sozinho
//     e pergunta, porque juntar errado mistura relatórios de pessoas diferentes.
import { Link } from 'react-router-dom'
import { Alerta } from '../Alerta'
import { useResponderSugestaoPessoa, useSugestoesPessoa } from '../../hooks/useInternacao'
import { dataBR } from '../../lib/datas'
import { nomeProprio } from '../../lib/texto'
import type { InternacaoTimeline, SugestaoPessoa } from '../../types/api'

export function AlertaInternacaoMaisRecente({ recente }: {
  recente: InternacaoTimeline['internacao_mais_recente']
}) {
  if (!recente) return null
  return (
    <Alerta
      nivel="nota"
      acao={recente.acessivel ? (
        <Link className="btn btn-outline btn-sm" to={`/paciente/${recente.id}`}>Abrir</Link>
      ) : undefined}
    >
      Este paciente tem uma internação mais recente no <b>{recente.hospital_nome}</b>
      {recente.data_entrada && <>, desde {dataBR(recente.data_entrada)}</>}.
    </Alerta>
  )
}

function periodo(s: SugestaoPessoa): string {
  const entrada = dataBR(s.data_entrada)
  if (!entrada) return ''
  return s.data_alta ? ` de ${entrada} a ${dataBR(s.data_alta)}` : ` desde ${entrada}`
}

export function AlertaSugestoesPessoa({ internacaoId, habilitado, podeResponder, onFeito }: {
  internacaoId: number
  /** Leitura da ficha completa: o analista não abre a ficha, e a rota recusa. */
  habilitado: boolean
  podeResponder: boolean
  onFeito: (msg: string) => void
}) {
  const { data } = useSugestoesPessoa(internacaoId, habilitado)
  const responder = useResponderSugestaoPessoa(internacaoId)
  const sugestoes = data?.sugestoes ?? []
  if (sugestoes.length === 0) return null

  const responderUma = (s: SugestaoPessoa, confirmar: boolean) =>
    responder.mutate({ sugestaoId: s.id, confirmar }, {
      onSuccess: () => onFeito(confirmar ? '✓ Internações juntadas na ficha' : '✓ Sugestão descartada'),
      onError: (e) => onFeito(e instanceof Error ? e.message : 'Não foi possível responder'),
    })

  return (
    <div>
      {sugestoes.map((s) => (
        <Alerta
          key={s.id}
          nivel="atencao"
          acao={podeResponder ? (
            <span style={{ display: 'inline-flex', gap: 6 }}>
              <button type="button" className="btn btn-outline btn-sm" disabled={responder.isPending}
                      onClick={() => responderUma(s, true)}>É o mesmo</button>
              <button type="button" className="btn btn-outline btn-sm" disabled={responder.isPending}
                      onClick={() => responderUma(s, false)}>Não é</button>
            </span>
          ) : undefined}
        >
          <b>Possível mesmo paciente:</b> {nomeProprio(s.nome) || 'sem nome'}, no{' '}
          {s.hospital_nome}{periodo(s)}.
        </Alerta>
      ))}
    </div>
  )
}
