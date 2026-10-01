// Bloco "Registrar relatório" do drawer. Mesmo formulário do card da ficha
// (`useFormRelatorio` + `CamposRelatorio`), em outro desenho.
import type { FormRelatorio } from './useFormRelatorio'
import { CamposRelatorio } from './CamposRelatorio'
import { SecaoRecolhivel } from './SecaoRecolhivel'

export function BlocoRegistrarRelatorio({ form, medicos }: { form: FormRelatorio; medicos: string[] }) {
  return (
    <SecaoRecolhivel
      titulo="Registrar relatório"
      resumo="Visita que já aconteceu"
      tom="realizado"
      icone={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="m9 15 2 2 4-4" /></svg>}
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <CamposRelatorio form={form} medicos={medicos} ladoALado />
      </div>
      {/* O botão fica FORA do grid dos campos: dentro dele, o `display:grid`
          esticava o botão por toda a largura. */}
      <button
        className="btn btn-success"
        style={{ marginTop: 12 }}
        onClick={form.salvar}
        disabled={form.salvando || !form.dataVisita}
      >
        {form.salvando ? 'Enviando…' : form.vaiParaAprovacao ? 'Enviar para aprovação' : 'Registrar relatório'}
      </button>
    </SecaoRecolhivel>
  )
}
