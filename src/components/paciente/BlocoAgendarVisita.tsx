// Bloco "Agendar visita" do drawer: mostra a visita marcada (com Cancelar) ou o
// seletor para marcar uma. A regra de gravação e invalidação é do
// `useAgendarVisita`, compartilhado com o card do quadro.
import { useState } from 'react'
import { dataBR } from '../../lib/datas'
import type { InternacaoDados } from '../../types/api'
import { SeletorVisita } from '../kanban/SeletorVisita'
import { useAgendarVisita } from '../kanban/useAgendarVisita'

export function BlocoAgendarVisita({ d }: { d: InternacaoDados }) {
  const agenda = useAgendarVisita(d.id)
  // Estado próprio, separado do formulário de relatório: as duas datas
  // significam coisas opostas (prevista x realizada) e não podem se misturar.
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [medico, setMedico] = useState('')

  async function agendar() {
    if (await agenda.agendar(data, medico, hora)) {
      setData('')
      setHora('')
      setMedico('')
    }
  }

  return (
    <>
      <div className="section-label" style={{ marginTop: 22 }}>Agendar visita</div>
      {d.visita_agendada ? (
        <div className="dk" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="flex-1" style={{ minWidth: 0 }}>
            <div style={{ fontSize: 'var(--t-md)', color: d.visita_agendada_vencida ? 'var(--danger)' : 'var(--ink-2)' }}>
              {d.visita_agendada_vencida
                ? `Visita atrasada, era ${dataBR(d.visita_agendada_em)}`
                : `Visita marcada para ${dataBR(d.visita_agendada_em)}`}
              {d.visita_agendada_hora && ` às ${d.visita_agendada_hora.slice(0, 5)}`}
            </div>
            {d.visita_agendada_medico && <div className="dk-meta">Responsável: {d.visita_agendada_medico}</div>}
            {d.visita_agendada_por && <div className="dk-meta">Marcada por {d.visita_agendada_por}</div>}
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={agenda.salvando}
            onClick={() => void agenda.desmarcar()}
          >
            {agenda.salvando ? 'Cancelando…' : 'Cancelar'}
          </button>
        </div>
      ) : (
        <>
          <SeletorVisita data={data} onData={setData} hora={hora} onHora={setHora} medico={medico} onMedico={setMedico} />
          {/* Médico e horário obrigatórios: sem responsável o agendamento não diz
              de QUEM é a visita, e sem horário vira só uma data solta. Mesma regra
              travada de novo no backend (a rota é chamável direto). */}
          <button
            type="button"
            className="btn btn-outline"
            style={{ marginTop: 10 }}
            disabled={agenda.salvando || !data || !hora || !medico}
            onClick={() => void agendar()}
          >
            {agenda.salvando ? 'Agendando…' : 'Agendar visita'}
          </button>
        </>
      )}
      {agenda.erro && (
        <div className="badge danger" style={{ marginTop: 8, padding: '8px 10px', textTransform: 'none', letterSpacing: 0 }}>
          {agenda.erro}
        </div>
      )}
    </>
  )
}
