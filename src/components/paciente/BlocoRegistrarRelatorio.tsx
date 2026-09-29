// Bloco "Registrar relatório" do drawer. Mesmo formulário do card da ficha
// (`useFormRelatorio` + `CamposRelatorio`), em outro desenho.
import type { FormRelatorio } from './useFormRelatorio'
import { CamposRelatorio } from './CamposRelatorio'

export function BlocoRegistrarRelatorio({ form, medicos }: { form: FormRelatorio; medicos: string[] }) {
  return (
    <>
      <div className="section-label" style={{ marginTop: 22 }}>Registrar relatório</div>
      <div style={{ display: 'grid', gap: 10 }}>
        <CamposRelatorio form={form} medicos={medicos} ladoALado />
      </div>
      {/* O botão fica FORA do grid dos campos: dentro dele, o `display:grid`
          esticava o botão por toda a largura, e ele não se parecia com o
          "Agendar visita" logo abaixo. As duas ações do drawer são irmãs. */}
      <button
        className="btn btn-outline"
        style={{ marginTop: 10 }}
        onClick={form.salvar}
        disabled={form.salvando || !form.dataVisita}
      >
        {form.salvando ? 'Registrando…' : 'Registrar relatório'}
      </button>
    </>
  )
}
