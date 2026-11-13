// Pergunta do envio: pacientes com o MESMO atendimento já gravados em OUTRO
// hospital, que o envio não salvou.
//
// Decisão do usuário (13/11/2026): "avisar ao usuário e perguntar se deve
// salvar". O caso real é o censo enviado no hospital errado (290 pacientes do
// Vera Cruz gravados no Casa de Saúde, que viraram fichas em dobro). A pergunta
// é em bloco, para o arquivo inteiro: um assistente de um paciente por vez faria
// 290 perguntas iguais.
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Alerta } from '../Alerta'
import { invalidarPorEvento } from '../../lib/invalidation'
import { nomeProprio } from '../../lib/texto'
import { decidirOutroHospital } from '../../services/censos.service'
import type { AguardandoOutroHospital } from '../../types/api'
import { plural } from './comuns'

export function PerguntaOutroHospital({ itens, hospitalDoEnvio, somenteLeitura, onDecidido }: {
  itens: AguardandoOutroHospital[]
  hospitalDoEnvio: string
  /** O analista lê a conferência, mas não decide pelo envio. */
  somenteLeitura?: boolean
  /** A frase do que foi feito, para o cartão mostrar no lugar da pergunta. */
  onDecidido: (resumo: string) => void
}) {
  const qc = useQueryClient()
  const [enviando, setEnviando] = useState<'salvar' | 'descartar' | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const n = itens.length
  const hospitais = [...new Set(itens.map((i) => i.hospital_nome || i.hospital_key))]
  const nomes = itens.slice(0, 4).map((i) => nomeProprio(i.nome) || i.atendimento).join(', ')

  async function decidir(salvar: boolean) {
    setEnviando(salvar ? 'salvar' : 'descartar')
    setErro(null)
    try {
      const r = await decidirOutroHospital(itens.map((i) => i.pendencia_id), salvar)
      if (salvar) invalidarPorEvento(qc, 'pacienteAdicionado')
      onDecidido(salvar
        ? `${r.salvos} ${plural(r.salvos, 'paciente')} ${plural(r.salvos, 'salvo')} também em ${hospitalDoEnvio}.`
        : `${r.descartados} ${plural(r.descartados, 'paciente')} não ${plural(r.descartados, 'salvo')}: ${plural(r.descartados, 'continua', 'continuam')} só em ${hospitais.join(', ')}.`)
    } catch (e) {
      setErro((e as Error).message || 'Não foi possível concluir. Tente de novo.')
    } finally {
      setEnviando(null)
    }
  }

  return (
    <Alerta nivel="critico">
      <b>{n} {plural(n, 'paciente')}</b> deste arquivo já {plural(n, 'está', 'estão')} em{' '}
      <b>{hospitais.join(', ')}</b> com o mesmo atendimento e <b>{plural(n, 'não foi salvo', 'não foram salvos')}</b>:{' '}
      {nomes}{n > 4 && ` e mais ${n - 4}`}. O arquivo pode ter sido enviado no hospital errado.
      {!somenteLeitura && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span>Salvar também em <b>{hospitalDoEnvio}</b>?</span>
          <button type="button" className="btn btn-outline btn-sm" disabled={enviando !== null}
                  onClick={() => decidir(false)}>
            {enviando === 'descartar' ? 'Descartando…' : 'Não salvar'}
          </button>
          <button type="button" className="btn btn-primary btn-sm" disabled={enviando !== null}
                  onClick={() => decidir(true)}>
            {enviando === 'salvar' ? 'Salvando…' : `Salvar ${n === 1 ? 'mesmo assim' : `os ${n} mesmo assim`}`}
          </button>
        </div>
      )}
      {erro && <div style={{ marginTop: 6 }}>{erro}</div>}
    </Alerta>
  )
}
