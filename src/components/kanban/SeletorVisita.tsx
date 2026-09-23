// Escolha do dia, do horário e do médico responsável pela visita.
//
// Reúne os três campos porque eles são uma decisão só ("quem vai, quando e a
// que horas"), e porque quem agenda precisa ver os três sem rolar. Data e
// médico são campos fechados que abrem ao clique — o calendário aberto o tempo
// todo dominava o formulário e empurrava o médico para fora da vista.
//
// Médico E horário são OBRIGATÓRIOS: sem responsável o agendamento não diz de
// QUEM é a visita (a pergunta que "Aguardando visita" existe para responder), e
// sem horário vira só uma data solta — "marquei uma visita" sem dono nem hora
// não é uma agenda de verdade.
import { useMemo } from 'react'
import MedicoCombobox from '../MedicoCombobox'
import { useEquipe } from '../../hooks/useEquipe'
import { CalendarioVisita } from './CalendarioVisita'

// O CSS do calendário mora em CalendarioVisita.tsx (ele é usado também sozinho,
// direto pelo PacienteDrawer, fora deste seletor). Aqui fica só o que é do
// próprio seletor — o layout dos campos e a dica do médico.
const seletorStyles = `
.sv{display:flex;flex-direction:column;gap:12px}
.sv-campo{display:flex;flex-direction:column;gap:5px}
.sv-lbl{font-size:var(--t-xs);text-transform:uppercase;letter-spacing:.06em;font-weight:700;color:var(--muted)}
/* Data + hora lado a lado: são uma decisão só ("quando"), então dividem a
   linha. A hora fica mais estreita — não precisa da largura de um calendário. */
.sv-data-hora{display:flex;gap:8px;align-items:flex-start}
.sv-data-hora>.sv-campo:first-child{flex:1;min-width:0}
.sv-hora{width:100px;flex-shrink:0}
`

export function SeletorVisita({ data, onData, hora, onHora, medico, onMedico }: {
  data: string
  onData: (iso: string) => void
  hora: string
  onHora: (hhmm: string) => void
  medico: string
  onMedico: (nome: string) => void
}) {
  const { data: equipe } = useEquipe()
  // Mesma fonte do formulário de relatório: os médicos auditores ativos da tela
  // de Equipe. Reusar a lista evita que o responsável pela visita e o do
  // relatório venham de cadastros diferentes.
  const nomes = useMemo(
    () => (equipe?.medicos ?? []).filter((m) => Boolean(m.ativo)).map((m) => m.nome),
    [equipe],
  )

  return (
    <div className="sv">
      <style>{seletorStyles}</style>

      <div className="sv-data-hora">
        <div className="sv-campo">
          <span className="sv-lbl">Data da visita</span>
          <CalendarioVisita valor={data} onEscolher={onData} limite="futuro" />
        </div>
        <div className="sv-campo sv-hora">
          <span className="sv-lbl">Horário</span>
          <input
            type="time"
            className="bm-input"
            value={hora}
            onChange={(e) => onHora(e.target.value)}
          />
        </div>
      </div>

      <div className="sv-campo">
        <span className="sv-lbl">Médico responsável</span>
        <MedicoCombobox value={medico} onChange={onMedico} nomes={nomes} />
      </div>
    </div>
  )
}
