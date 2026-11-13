// Confirmação do "Desfazer lote" de Movimentações, com a prévia do que sai.
//
// 12/11/2026: o CENSO BMA.PDF foi enviado às 13:53 e de novo às 13:58. O de
// 13:58 só atualizou os 101 pacientes que o de 13:53 tinha criado, e o desfazer
// na linha dele removeu 0 com um "✓ Lote desfeito". A confirmação dizia "101
// gravados, entre criados e atualizados" e não tinha como saber. Agora ela pede
// ao servidor quantos saem, quantos ficam e de qual envio vieram os que ficam.
//
// Quando a origem é o MESMO arquivo (mesmo conteúdo, mesmo com outro nome) num
// envio ainda aberto, oferece desfazer os dois. Num censo diário, quem fica veio
// do censo certo de ontem: aí a tela só informa, sem oferecer apagar.
import type { ReactNode } from 'react'
import { ConfirmarModal } from '../ConfirmarModal'
import { Spinner } from '../ui'
import { dataHora } from '../../lib/datas'
import type { OrigemReversao, PreviaReversao } from '../../services/censos.service'
import type { AlvoDesfazer } from './logs.model'

/** Quantas origens a lista mostra antes do "e mais N envios". */
const ORIGENS_VISIVEIS = 4

function pacientes(n: number): string {
  return `${n} paciente${n === 1 ? '' : 's'}`
}

function envioDe(o: OrigemReversao): string {
  const quando = dataHora(o.processado_em)
  return `${quando ? `envio de ${quando}` : 'envio anterior'}${o.arquivo ? ` (${o.arquivo})` : ''}`
}

/** Envios de origem que é seguro desfazer junto: o mesmo arquivo, ainda aberto
 *  e ao alcance do desfazer. */
function reenviosDesfaziveis(previa?: PreviaReversao | null): OrigemReversao[] {
  return (previa?.origens ?? []).filter((o) => o.mesmo_arquivo && o.desfazivel && o.sessao && o.arquivo)
}

export default function ConfirmarDesfazerLote({
  alvo, previa, carregando, erro, ocupado, onCancelar, onConfirmar,
}: {
  alvo: AlvoDesfazer
  previa?: PreviaReversao
  carregando: boolean
  /** A prévia falhou: a confirmação volta ao aviso genérico. */
  erro?: string | null
  ocupado: boolean
  onCancelar: () => void
  /** `origens`: envios do mesmo arquivo a desfazer antes deste (vazio = só este). */
  onConfirmar: (origens: OrigemReversao[]) => void
}) {
  const quem = alvo.arquivo
    ? <strong>{alvo.arquivo}</strong>
    : <>os <strong>{alvo.arquivos.length} arquivos</strong> deste envio</>
  const onde = alvo.hospital ? <> em <strong>{alvo.hospital}</strong></> : null
  const esteLote = alvo.arquivo ? 'Este arquivo' : 'Este envio'
  const criou = alvo.arquivo ? 'criou' : 'criaram'
  const criados = previa?.criados ?? 0
  const atualizados = previa?.atualizados ?? 0
  const reenvios = reenviosDesfaziveis(previa)
  const daOrigem = reenvios.reduce((n, o) => n + o.pacientes, 0)
  const origens = previa?.origens ?? []
  const outrasDesfaziveis = origens.some((o) => o.desfazivel && !o.mesmo_arquivo)

  // Os botões dizem o que vai acontecer, com o número de quem sai.
  let confirmar = 'Apagar e desfazer'
  let perigo = true
  let extra: ReactNode = null
  if (previa && reenvios.length > 0) {
    confirmar = `Desfazer ${reenvios.length === 1 ? 'os dois' : `os ${reenvios.length + 1}`} (${pacientes(criados + daOrigem)})`
    extra = (
      <button type="button" className="btn btn-outline btn-sm" disabled={ocupado}
              onClick={() => onConfirmar([])}>
        {criados > 0 ? `Só este (${pacientes(criados)})` : 'Só este (ninguém sai)'}
      </button>
    )
  } else if (previa && criados > 0) {
    confirmar = `Apagar ${pacientes(criados)} e desfazer`
  } else if (previa) {
    confirmar = 'Desfazer mesmo assim'
    perigo = false
  }

  return (
    <ConfirmarModal
      titulo={alvo.arquivo ? 'Desfazer este lote?' : 'Desfazer o envio inteiro?'}
      perigo={perigo}
      confirmar={confirmar}
      cancelar="Manter como está"
      ocupado={ocupado}
      podeConfirmar={!carregando}
      extra={extra}
      largura={560}
      onCancelar={onCancelar}
      onConfirmar={() => onConfirmar(reenvios)}
    >
      {carregando && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Spinner size={14} /> Conferindo o que {quem} {criou}…
        </div>
      )}

      {!carregando && !previa && (
        <div>
          Os pacientes que {quem} {criou}{onde} serão apagados. Quem já existia antes e foi só
          atualizado continua no sistema.
          {erro && <> (Não deu para conferir quantos são: {erro.replace(/\.+$/, '')}.)</>}
        </div>
      )}

      {previa && (criados > 0 ? (
        <div>
          Vai apagar <strong>{pacientes(criados)}</strong> que {quem} {criou}{onde}. Esta ação não
          pode ser desfeita.
        </div>
      ) : (
        <div>
          {esteLote} não criou nenhum paciente{onde}: desfazer só ele <strong>não tira ninguém
          do sistema</strong>.
        </div>
      ))}

      {previa && atualizados > 0 && (
        <div>
          <strong>{pacientes(atualizados)}</strong>{' '}
          {atualizados === 1 ? 'já existia antes e fica, com os dados que tinha' : 'já existiam antes e ficam, com os dados que tinham'}:
          <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
            {origens.slice(0, ORIGENS_VISIVEIS).map((o) => (
              <li key={o.censo_id}>
                {pacientes(o.pacientes)} do {envioDe(o)}{o.mesmo_arquivo && ', o mesmo arquivo'}
              </li>
            ))}
            {origens.length > ORIGENS_VISIVEIS && (
              <li>e mais {origens.length - ORIGENS_VISIVEIS} envios anteriores</li>
            )}
            {previa.sem_envio > 0 && (
              <li>{pacientes(previa.sem_envio)} cadastrado{previa.sem_envio === 1 ? '' : 's'} à mão ou antes do registro de envios</li>
            )}
          </ul>
        </div>
      )}

      {reenvios.length > 0 && (
        <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning)', borderRadius: 8, padding: '8px 10px' }}>
          {alvo.arquivo ? 'É o mesmo arquivo' : 'Este envio repete o arquivo'} do{' '}
          {reenvios.map((o, i) => (
            <span key={o.censo_id}>{i > 0 && (i === reenvios.length - 1 ? ' e do ' : ', do ')}<strong>{envioDe(o)}</strong></span>
          ))}
          , que {reenvios.length === 1 ? 'criou' : 'criaram'} {pacientes(daOrigem)}. Para tirar esses pacientes do
          sistema, desfaça {reenvios.length === 1 ? 'os dois' : 'todos'}.
        </div>
      )}

      {previa && criados === 0 && reenvios.length === 0 && outrasDesfaziveis && (
        <div style={{ color: 'var(--muted)', fontSize: 'var(--t-sm)' }}>
          Se esses pacientes não deviam estar no sistema, desfaça o envio que os criou, na linha
          dele em Movimentações.
        </div>
      )}
    </ConfirmarModal>
  )
}
