// Campos do formulário de relatório (data realizada, médico, CID, observação).
// Só apresentação: o estado vem de `useFormRelatorio`.
import MedicoCombobox from '../MedicoCombobox'
import { CalendarioVisita } from '../kanban/CalendarioVisita'
import { CampoCidRelatorio } from './CampoCidRelatorio'
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
          <span className="form-lbl">Data da visita realizada<span className="req">*</span></span>
          <CalendarioVisita valor={form.dataVisita} onEscolher={form.setDataVisita} limite="passado" placeholder="Escolher data" />
        </div>
        <div>
          <span className="form-lbl">Médico auditor</span>
          <MedicoCombobox value={form.medico} onChange={form.setMedico} nomes={medicos} />
        </div>
      </div>
      {!form.vaiParaAprovacao && <CampoCidRelatorio form={form} />}
      <div>
        <span className="form-lbl">Observação</span>
        <textarea
          className="bm-input" rows={3} placeholder="Observações técnicas do auditor…"
          style={{ resize: 'vertical', fontFamily: 'inherit' }}
          value={form.obs} onChange={(e) => form.setObs(e.target.value)}
        />
      </div>
      {form.vaiParaAprovacao && (
        <div className="t-muted" style={{ fontSize: 'var(--t-sm)' }}>
          O relatório vai para aprovação do técnico.
        </div>
      )}
      {form.erro && (
        <div className="badge danger" style={{ padding: '8px 10px', textTransform: 'none', letterSpacing: 0 }}>{form.erro}</div>
      )}
    </>
  )
}
