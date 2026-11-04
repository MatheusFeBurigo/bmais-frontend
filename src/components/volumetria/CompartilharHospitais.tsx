// Modal "Dar hospitais por um período" (0060): a coordenação escolhe hospitais
// para a pessoa cobrir e por quanto tempo. Diferente de "Dividir a carga", nada
// sai de ninguém: quem já tinha o hospital continua com ele, e os dois o veem na
// Visão Geral e nas Tarefas durante o período. No fim, sai sozinho; antes, pelo
// "Encerrar agora" deste mesmo modal.
import { useMemo, useState } from 'react'
import type { VolumetriaGrupo, VolumetriaPessoa } from '../../types/api'
import { useTodosHospitais } from '../../hooks/useEquipe'
import { useCancelarDivisao, useCompartilharHospitais } from '../../hooks/useVolumetria'
import { HospitalCombobox } from '../HospitalCombobox'
import { Badge, Modal, Spinner } from '../ui'
import { PERIODOS, compartilhamentosDe, fmtDiaMes, hojeIso } from './volumetria.model'
import { dividirStyles } from './volumetria.styles'

export default function CompartilharHospitais({ pessoa, grupo, onClose, onErro, onAviso }: {
  pessoa: VolumetriaPessoa
  grupo: VolumetriaGrupo
  onClose: () => void
  onErro: (msg: string) => void
  onAviso: (msg: string) => void
}) {
  const todos = useTodosHospitais()
  const compartilhar = useCompartilharHospitais()
  const cancelar = useCancelarDivisao()
  const andamento = compartilhamentosDe(grupo, pessoa.user_id)

  const [escolhidos, setEscolhidos] = useState<string[]>([])
  const [novo, setNovo] = useState('')
  const [inicio, setInicio] = useState(hojeIso())
  const [fim, setFim] = useState(hojeIso())
  const [outroPeriodo, setOutroPeriodo] = useState(false)

  // Fora da lista: os que a pessoa já cobre (a área dela ou outro período) e os
  // já escolhidos aqui.
  const disponiveis = useMemo(() => {
    const fora = new Set([...pessoa.hospitais.map((h) => h.hospital_key), ...escolhidos])
    return (todos.data ?? []).filter((h) => !fora.has(h.key))
  }, [todos.data, pessoa.hospitais, escolhidos])
  const nomeDe = (key: string) => (todos.data ?? []).find((h) => h.key === key)?.nome ?? key

  const periodoAtivo = PERIODOS.find((p) => inicio === hojeIso() && fim === hojeIso(p.dias - 1))?.key
  const datasOk = !!inicio && !!fim && inicio >= hojeIso() && fim >= inicio
  const ocupado = compartilhar.isPending || cancelar.isPending
  const podeConfirmar = datasOk && escolhidos.length > 0 && !ocupado

  function incluir() {
    if (!novo) return
    setEscolhidos((atual) => [...atual, novo])
    setNovo('')
  }

  function escolherPeriodo(dias: number) {
    setOutroPeriodo(false)
    setInicio(hojeIso())
    setFim(hojeIso(dias - 1))
  }

  function confirmar() {
    const nome = pessoa.nome
    const n = escolhidos.length
    compartilhar.mutate({ para_user_id: pessoa.user_id, hospitais: escolhidos, inicio, fim }, {
      onSuccess: () => {
        onAviso(`${n} ${n === 1 ? 'hospital dado' : 'hospitais dados'} a ${nome} de ${fmtDiaMes(inicio)} a ${fmtDiaMes(fim)}.`)
        onClose()
      },
      onError: (e) => onErro(e instanceof Error && e.message ? e.message : 'Não foi possível dar os hospitais.'),
    })
  }

  function encerrar(lote: string) {
    cancelar.mutate(lote, {
      onSuccess: () => onAviso(`Período encerrado. Os hospitais saíram de ${pessoa.nome}.`),
      onError: () => onErro('Não foi possível encerrar o período. Tente de novo.'),
    })
  }

  return (
    <Modal
      title={`Dar hospitais a ${pessoa.nome} por um período`}
      largura={520}
      onClose={ocupado ? () => {} : onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline btn-sm" disabled={ocupado} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary btn-sm" disabled={!podeConfirmar} onClick={confirmar}>
            {compartilhar.isPending && <Spinner size={12} style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.4)' }} />}
            {escolhidos.length > 1 ? `Dar ${escolhidos.length} hospitais` : 'Dar hospital'}
          </button>
        </>
      }
    >
      <style>{dividirStyles}</style>

      {andamento.length > 0 && (
        <div className="dv-sec">
          <div className="dv-lbl">Hospitais por um período</div>
          {andamento.map((d) => (
            <div className="dv-and" key={d.lote}>
              <Badge variant={d.vigente ? 'info' : 'muted'}>{d.vigente ? 'Em andamento' : 'Agendado'}</Badge>
              <span>
                {fmtDiaMes(d.inicio)} a {fmtDiaMes(d.fim)} ·{' '}
                {d.itens.filter((i) => i.para_user_id === pessoa.user_id).map((i) => i.hospital_nome).join(', ')}
              </span>
              <button type="button" className="btn btn-ghost btn-sm" disabled={ocupado} onClick={() => encerrar(d.lote)}>
                Encerrar agora
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="dv-sec">
        <div className="dv-vazio">
          Os hospitais entram na Visão Geral e nas Tarefas de {pessoa.nome} durante o período,
          sem sair de quem já os tem. No fim, saem sozinhos.
        </div>
      </div>

      <div className="dv-sec">
        <div className="dv-lbl">
          Hospitais
          {escolhidos.length > 0 && <span>{escolhidos.length} {escolhidos.length === 1 ? 'escolhido' : 'escolhidos'}</span>}
        </div>
        {escolhidos.length > 0 && (
          <div className="dv-lista" style={{ marginBottom: 8 }}>
            {escolhidos.map((k) => (
              <div className="dv-colega" key={k} style={{ cursor: 'default' }}>
                <span className="dv-colega-nome">{nomeDe(k)}</span>
                <button type="button" className="vol-x" disabled={ocupado} aria-label={`Tirar ${nomeDe(k)}`}
                  onClick={() => setEscolhidos((atual) => atual.filter((x) => x !== k))}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="vol-add" style={{ marginTop: 0 }}>
          <HospitalCombobox
            hospitais={disponiveis}
            value={novo}
            onChange={setNovo}
            disabled={ocupado || todos.isLoading}
            placeholder={todos.isLoading ? 'Carregando hospitais…' : 'Escolher hospital…'}
            mostrarOperadora
            sugerirCadastro={false}
          />
          <button type="button" className="btn btn-outline btn-sm" disabled={!novo || ocupado} onClick={incluir}>
            Incluir
          </button>
        </div>
      </div>

      <div className="dv-sec">
        <div className="dv-lbl">
          Período
          <span>{fmtDiaMes(inicio)} a {fmtDiaMes(fim)}</span>
        </div>
        <div className="dv-periodo">
          {PERIODOS.map((p) => (
            <button type="button" key={p.key} className="dv-chip"
              aria-pressed={!outroPeriodo && periodoAtivo === p.key}
              onClick={() => escolherPeriodo(p.dias)}>
              {p.label}
            </button>
          ))}
          <button type="button" className="dv-chip" aria-pressed={outroPeriodo || !periodoAtivo}
            onClick={() => setOutroPeriodo(true)}>
            Outro
          </button>
        </div>
        {(outroPeriodo || !periodoAtivo) && (
          <div className="dv-datas">
            <input className="bm-input" type="date" value={inicio} min={hojeIso()} aria-label="Início"
              onChange={(e) => setInicio(e.target.value)} />
            <span>até</span>
            <input className="bm-input" type="date" value={fim} min={inicio || hojeIso()} aria-label="Fim"
              onChange={(e) => setFim(e.target.value)} />
          </div>
        )}
      </div>
    </Modal>
  )
}
