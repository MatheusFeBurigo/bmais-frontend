// Campos do formulário de relatório (data realizada, médico, observação).
// Só apresentação: o estado vem de `useFormRelatorio`.
import MedicoCombobox from '../MedicoCombobox'
import { CalendarioVisita } from '../kanban/CalendarioVisita'
import type { FormRelatorio } from './useFormRelatorio'

export function CamposRelatorio({ form, medicos, ladoALado = false }: {
  form: FormRelatorio
  medicos: string[]
  /** Data e médico na mesma linha (drawer) ou empilhados (card da ficha). */
  ladoALado?: boolean
}) {
  return (
    <>
      <div style={ladoALado ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } : { display: 'contents' }}>
        <div>
          {/* "realizada" e o limite no passado: relatório é sempre de visita que
              já aconteceu. A data PREVISTA tem campo próprio (Agendar visita), e
              confundir as duas quebraria o cálculo de dias sem relatório. */}
          <div className="uppercase t-muted" style={{ marginBottom: 5 }}>Data da visita realizada *</div>
          <CalendarioVisita valor={form.dataVisita} onEscolher={form.setDataVisita} limite="passado" placeholder="Escolher data" />
        </div>
        <div>
          <div className="uppercase t-muted" style={{ marginBottom: 5 }}>Médico auditor</div>
          <MedicoCombobox value={form.medico} onChange={form.setMedico} nomes={medicos} />
        </div>
      </div>
      <div>
        <div className="uppercase t-muted" style={{ marginBottom: 5 }}>Observação</div>
        <textarea
          className="bm-input" rows={3} placeholder="Observações técnicas do auditor…"
          style={{ resize: 'vertical', fontFamily: 'inherit' }}
          value={form.obs} onChange={(e) => form.setObs(e.target.value)}
        />
      </div>
      {form.erro && (
        <div className="badge danger" style={{ padding: '8px 10px', textTransform: 'none', letterSpacing: 0 }}>{form.erro}</div>
      )}
    </>
  )
}
