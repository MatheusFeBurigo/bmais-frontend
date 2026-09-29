// Modal "Dividir a carga": o coordenador escolhe com quem dividir (a pessoa +
// N colegas = N+1 partes) e por quanto tempo. Os hospitais da pessoa são
// repartidos pelo peso em horas e cada um pode ser trocado de mão antes de
// confirmar. Durante o período, Tarefas de cada um já mostra a divisão; ao fim,
// tudo volta sozinho (nada muda na área definida em Operações).
import { useMemo, useState } from 'react'
import type { VolumetriaGrupo, VolumetriaPessoa } from '../../types/api'
import { useCancelarDivisao, useDividirCarga } from '../../hooks/useVolumetria'
import { Badge, Modal, Spinner } from '../ui'
import {
  NIVEL_LABEL, NIVEL_VAR, colegasParaDividir, divisoesDe, fmtDiaMes, fmtDias, fmtHoras,
  hojeIso, hospitaisDivisiveis, preverDivisao, repartir, type PlanoDivisao,
} from './volumetria.model'
import { dividirStyles } from './volumetria.styles'

const PERIODOS: Array<{ key: string; label: string; dias: number }> = [
  { key: 'hoje', label: 'Só hoje', dias: 1 },
  { key: 'amanha', label: 'Hoje e amanhã', dias: 2 },
  { key: 'semana', label: '7 dias', dias: 7 },
]

export default function DividirCarga({ pessoa, grupo, onClose, onErro, onAviso }: {
  pessoa: VolumetriaPessoa
  grupo: VolumetriaGrupo
  onClose: () => void
  onErro: (msg: string) => void
  onAviso: (msg: string) => void
}) {
  const dividir = useDividirCarga()
  const cancelar = useCancelarDivisao()
  const colegas = useMemo(() => colegasParaDividir(grupo, pessoa.user_id), [grupo, pessoa.user_id])
  const divisiveis = useMemo(() => hospitaisDivisiveis(pessoa), [pessoa])
  const andamento = divisoesDe(grupo, pessoa.user_id)

  const [escolhidos, setEscolhidos] = useState<string[]>([])
  const [inicio, setInicio] = useState(hojeIso())
  const [fim, setFim] = useState(hojeIso(1))
  // Trocas feitas à mão sobre a sugestão. Guardadas à parte (e não como o plano
  // inteiro) para um refetch da tela não desfazer o que o coordenador ajustou.
  const [ajustes, setAjustes] = useState<PlanoDivisao>({})
  // Datas à mão e troca de hospital são exceção: ficam recolhidas até pedir.
  const [outroPeriodo, setOutroPeriodo] = useState(false)
  const [verHospitais, setVerHospitais] = useState(false)

  const participantes = colegas.filter((c) => escolhidos.includes(c.user_id))
  const plano = useMemo<PlanoDivisao>(() => {
    const validos = new Set([pessoa.user_id, ...escolhidos])
    const base = repartir(pessoa, escolhidos)
    for (const [hk, uid] of Object.entries(ajustes)) if (hk in base && validos.has(uid)) base[hk] = uid
    return base
  }, [pessoa, escolhidos, ajustes])
  const previsao = preverDivisao(grupo, pessoa, participantes, plano)
  const distribuicao = Object.fromEntries(
    Object.entries(plano).filter(([, uid]) => uid !== pessoa.user_id),
  )
  const repassados = Object.keys(distribuicao).length
  const periodoAtivo = PERIODOS.find((p) => inicio === hojeIso() && fim === hojeIso(p.dias - 1))?.key
  const datasOk = !!inicio && !!fim && inicio >= hojeIso() && fim >= inicio
  const ocupado = dividir.isPending || cancelar.isPending
  const podeDividir = datasOk && repassados > 0 && repassados < divisiveis.length && !ocupado

  function alternar(uid: string) {
    setEscolhidos((atual) => (atual.includes(uid) ? atual.filter((u) => u !== uid) : [...atual, uid]))
    // Mudou o número de partes: a sugestão é refeita do zero.
    setAjustes({})
  }

  function escolherPeriodo(dias: number) {
    setOutroPeriodo(false)
    setInicio(hojeIso())
    setFim(hojeIso(dias - 1))
  }

  function confirmar() {
    dividir.mutate({ de_user_id: pessoa.user_id, distribuicao, inicio, fim }, {
      onSuccess: () => {
        onAviso(`Carga de ${pessoa.nome} dividida de ${fmtDiaMes(inicio)} a ${fmtDiaMes(fim)}.`)
        onClose()
      },
      onError: (e) => onErro(e instanceof Error && e.message ? e.message : 'Não foi possível dividir a carga.'),
    })
  }

  function encerrar(lote: string) {
    cancelar.mutate(lote, {
      onSuccess: () => onAviso('Divisão cancelada. Os hospitais voltaram para quem os cedeu.'),
      onError: () => onErro('Não foi possível cancelar a divisão. Tente de novo.'),
    })
  }

  const nomeDe = (uid: string) =>
    uid === pessoa.user_id ? pessoa.nome : colegas.find((c) => c.user_id === uid)?.nome ?? 'Outra pessoa'

  return (
    <Modal
      title={`Dividir a carga de ${pessoa.nome}`}
      largura={520}
      onClose={ocupado ? () => {} : onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline btn-sm" disabled={ocupado} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary btn-sm" disabled={!podeDividir} onClick={confirmar}>
            {dividir.isPending && <Spinner size={12} style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.4)' }} />}
            {participantes.length > 0 ? `Dividir em ${participantes.length + 1}` : 'Dividir'}
          </button>
        </>
      }
    >
      <style>{dividirStyles}</style>

      {andamento.length > 0 && (
        <div className="dv-sec">
          <div className="dv-lbl">Divisões desta pessoa</div>
          {andamento.map((d) => (
            <div className="dv-and" key={d.lote}>
              <Badge variant={d.vigente ? 'info' : 'muted'}>{d.vigente ? 'Em andamento' : 'Agendada'}</Badge>
              <span>
                {fmtDiaMes(d.inicio)} a {fmtDiaMes(d.fim)} · {d.itens.length} {d.itens.length === 1 ? 'hospital' : 'hospitais'} com{' '}
                {[...new Set(d.itens.map((i) => i.para_nome))].join(', ')}
              </span>
              <button type="button" className="btn btn-ghost btn-sm" disabled={ocupado} onClick={() => encerrar(d.lote)}>
                Cancelar divisão
              </button>
            </div>
          ))}
        </div>
      )}

      {divisiveis.length < 2 ? (
        <div className="dv-vazio">
          {pessoa.nome} tem {divisiveis.length === 1 ? 'um só hospital' : 'nenhum hospital próprio'}: não há o que dividir.
        </div>
      ) : colegas.length === 0 ? (
        <div className="dv-vazio">Ninguém mais do grupo tem hospitais definidos para receber parte da carga.</div>
      ) : (
        <>
          <div className="dv-sec">
            <div className="dv-lbl">
              Dividir com
              {participantes.length > 0 && <span>{participantes.length + 1} partes</span>}
            </div>
            <div className="dv-lista">
              {colegas.map((c) => {
                const marcado = escolhidos.includes(c.user_id)
                const nivel = c.nivel ?? 'normal'
                return (
                  <button type="button" key={c.user_id} className="dv-colega" aria-pressed={marcado}
                    onClick={() => alternar(c.user_id)}>
                    <input type="checkbox" checked={marcado} readOnly tabIndex={-1} aria-hidden="true" />
                    <span className="dv-colega-nome" title={c.email}>{c.nome}</span>
                    {/* Só o que pede cuidado ganha rótulo: "dentro da capacidade" é o normal. */}
                    {nivel !== 'normal' && (
                      <span className="dv-colega-nivel" style={{ color: NIVEL_VAR[nivel] }}>{NIVEL_LABEL[nivel]}</span>
                    )}
                    <span className="dv-colega-fila">{fmtDias(c.dias_fila)} de fila</span>
                  </button>
                )
              })}
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

          {participantes.length > 0 && (
            <div className="dv-sec">
              <div className="dv-lbl">
                Como fica
                <span>Fila no período</span>
              </div>
              <div className="dv-prev">
                {previsao.map((p) => (
                  <div className="dv-prev-item" key={p.pessoa.user_id}>
                    <span className="dv-prev-nome" title={p.pessoa.nome}>{p.pessoa.nome}</span>
                    <span className="dv-prev-num">
                      {p.hospitais.length} {p.hospitais.length === 1 ? 'hospital' : 'hospitais'}
                    </span>
                    <span className="dv-prev-num">
                      {fmtDias(p.diasAntes)} → <b style={{ color: NIVEL_VAR[p.nivelDepois] }}>{fmtDias(p.diasDepois)}</b>
                    </span>
                  </div>
                ))}
              </div>
              <button type="button" className="dv-ajustar" aria-expanded={verHospitais}
                onClick={() => setVerHospitais((v) => !v)}>
                {verHospitais ? 'Ocultar hospitais' : `Trocar hospitais de mão (${divisiveis.length})`}
              </button>
              {verHospitais && (
                <div style={{ marginTop: 6 }}>
                  {divisiveis.map((h) => (
                    <div className="dv-hosp" key={h.hospital_key}>
                      <span className="dv-hosp-nome" title={`${h.hospital_nome} · ${fmtHoras(h.horas)}`}>{h.hospital_nome}</span>
                      <select
                        className="bm-input bm-select"
                        value={plano[h.hospital_key] ?? pessoa.user_id}
                        disabled={ocupado}
                        aria-label={`Quem fica com ${h.hospital_nome}`}
                        onChange={(e) => setAjustes((atual) => ({ ...atual, [h.hospital_key]: e.target.value }))}
                      >
                        {[pessoa.user_id, ...escolhidos].map((uid) => (
                          <option key={uid} value={uid}>{nomeDe(uid)}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
              {repassados >= divisiveis.length && (
                <div className="dv-vazio" style={{ color: 'var(--danger)', marginTop: 8 }}>
                  Deixe ao menos um hospital com {pessoa.nome}.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
