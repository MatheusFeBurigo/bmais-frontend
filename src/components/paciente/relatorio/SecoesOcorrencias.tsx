// Miolo do bloco que não é lista: o evento adverso. O estado vem de
// `useDetalhesRelatorio` (via `form.completo`). A alta é o botão "Alta" do
// rodapé da modal, o mesmo do topo da ficha; as perguntas de home care ficam
// nela, com o motivo Homecare (08/10/2026).
import { hojeISO } from '../../../lib/datas'
import type { DetalhesForm } from './useDetalhesRelatorio'

export function SecaoEventoAdverso({ c }: { c: DetalhesForm }) {
  const v = c.evento
  return (
    <div className="rr-g-evento">
      <label className="rr-campo">
        <span className="form-lbl">Data<span className="req">*</span></span>
        <input type="date" className="bm-input" value={v.data} max={hojeISO()}
               onChange={(e) => c.setEvento({ ...v, data: e.target.value })} />
      </label>
      <label className="rr-campo">
        <span className="form-lbl">O que aconteceu<span className="req">*</span></span>
        <input className="bm-input" maxLength={2000} value={v.descricao}
               onChange={(e) => c.setEvento({ ...v, descricao: e.target.value })} />
      </label>
    </div>
  )
}
