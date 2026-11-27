// Bloco "Agendar visita" do drawer: mostra a visita marcada (com Cancelar) ou o
// seletor para marcar uma. A regra de gravação e invalidação é do
// `useAgendarVisita`, compartilhado com o card do quadro.
import { useState } from 'react'
import { dataBR } from '../../lib/datas'
import type { InternacaoDados } from '../../types/api'
import { SeletorVisita } from '../kanban/SeletorVisita'
import { useAgendarVisita } from '../kanban/useAgendarVisita'
import { SecaoRecolhivel } from './SecaoRecolhivel'

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

  const hora5 = d.visita_agendada_hora ? ` às ${d.visita_agendada_hora.slice(0, 5)}` : ''
  // Passou o horário da visita e o relatório não foi registrado (o agendamento
  // sai sozinho quando o relatório entra): o mesmo componente vira um alerta
  // (27/11/2026, pedido do usuário: "tem que aparecer no mesmo componente ...
  // um alerta que visita foi agendada e paciente não foi registrado no
  // relatório"). Antes dizia só "Visita atrasada, era DD/MM".
  const semRelatorio = Boolean(d.visita_agendada && d.visita_agendada_vencida)
  // Resumo visível com a seção fechada: quem só quer conferir a visita marcada
  // não precisa abrir o bloco.
  const resumo = !d.visita_agendada
    ? 'Nenhuma visita marcada'
    : semRelatorio
      ? `Visita de ${dataBR(d.visita_agendada_em)}${hora5} · relatório não registrado`
      : `Marcada para ${dataBR(d.visita_agendada_em)}${hora5}`

  return (
    <SecaoRecolhivel
      titulo="Agendar visita"
      resumo={resumo}
      corResumo={semRelatorio ? 'var(--danger)' : d.visita_agendada ? 'var(--info)' : undefined}
      tom="futuro"
      icone={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M12 14v3l2 1" /></svg>}
    >
      {d.visita_agendada ? (
        <div className="dk" role={semRelatorio ? 'alert' : undefined} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: semRelatorio ? 'var(--danger-bg)' : 'var(--surface)',
          borderColor: semRelatorio ? 'var(--danger)' : undefined,
        }}>
          <div className="flex-1" style={{ minWidth: 0 }}>
            {semRelatorio && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--t-sm)', fontWeight: 700, color: 'var(--danger-2)', marginBottom: 2 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></svg>
                Relatório não registrado
              </div>
            )}
            <div style={{ fontSize: 'var(--t-md)', fontWeight: 600, color: 'var(--ink)' }}>
              {semRelatorio
                ? `Visita agendada para ${dataBR(d.visita_agendada_em)}`
                : `Visita marcada para ${dataBR(d.visita_agendada_em)}`}
              {hora5}
            </div>
            {semRelatorio && <div className="dk-meta">O horário da visita passou e o relatório dela não foi registrado.</div>}
            {d.visita_agendada_medico && <div className="dk-meta">Responsável: <strong style={{ color: 'var(--ink-2)' }}>{d.visita_agendada_medico}</strong></div>}
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
            className="btn btn-primary"
            style={{ marginTop: 12 }}
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
    </SecaoRecolhivel>
  )
}
