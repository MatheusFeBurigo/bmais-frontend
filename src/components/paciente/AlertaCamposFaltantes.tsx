// Resumo do que falta na ficha, ACIMA do card: os campos em branco estão
// espalhados pela grade, e sem ele descobrir que a ficha está incompleta exigiria
// varrer 14 campos um a um. Nível "atenção" (nunca crítico): o paciente está no
// sistema e a tela funciona; o que falta é completar, e o "Editar" do próprio
// card é o caminho, por isso o alerta não repete um botão de ação.
import { Alerta } from '../Alerta'
import type { camposIncompletos } from '../../lib/fichaIncompleta'

export function AlertaCamposFaltantes({ faltantes }: { faltantes: ReturnType<typeof camposIncompletos> }) {
  if (faltantes.length === 0) return null
  return (
    <Alerta nivel="atencao">
      {faltantes.length === 1 ? (
        <>
          <b>{faltantes[0].label}</b> não veio no censo. {faltantes[0].porque}
        </>
      ) : (
        <>
          <b>{faltantes.length} campos importantes</b> não vieram no censo:{' '}
          {faltantes.map((f) => f.label).join(', ')}.
        </>
      )}
    </Alerta>
  )
}
