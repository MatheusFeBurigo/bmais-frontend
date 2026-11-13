// Seção "Home care" da modal "Registrar relatório" (13/11/2026), como a
// "Prorrogação": fechada até ser marcada; marcada, as perguntas do portal
// antigo, nenhuma obrigatória (marcar já registra). Vai no relatório e só vale
// com ele aprovado; o
// paciente segue internado (pedido do usuário: "homecare não deve virar alta, e
// sim um cadastro dentro do registro de relatório").
import { resumoHomecare } from '../../lib/altaHomecare'
import { dataBR } from '../../lib/datas'
import type { HomecarePaciente, HomecareRelatorio } from '../../types/api'
import { PerguntasHomecare } from './PerguntasHomecare'
import { BlocoOpcional } from './relatorio/BlocoOpcional'
import type { FormRelatorio } from './useFormRelatorio'

export function SecaoHomecare({ form, vigente }: {
  form: FormRelatorio
  /** O home care que já vale (relatório aprovado mais recente), para lembrar. */
  vigente?: HomecarePaciente | null
}) {
  const hc = form.homecare
  if (!hc) return null
  return (
    <div className="rr-pilha">
      {vigente && !hc.ativo && (
        <span style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
          Último registro{vigente.data_visita ? `, visita de ${dataBR(vigente.data_visita)}` : ''}
          {resumoHomecare(vigente) ? `: ${resumoHomecare(vigente)}.` : ', sem respostas.'}
        </span>
      )}
      <BlocoOpcional titulo="Registrar home care" marcado={hc.ativo} onMarcar={hc.alternar}
                     desabilitado={form.salvando}>
        <PerguntasHomecare valor={hc.valores} onMudar={hc.mudar} desabilitado={form.salvando} />
      </BlocoOpcional>
    </div>
  )
}

/** O home care gravado num relatório, no card do relatório e no de aprovação. */
export function ResumoHomecare({ h }: { h: HomecareRelatorio }) {
  return (
    <div style={{
      marginTop: 6, padding: '6px 10px', borderRadius: 8, background: 'var(--success-bg)',
      fontSize: 'var(--t-sm)', color: 'var(--ink-2)', display: 'grid', gap: 2,
    }}>
      <b style={{ color: 'var(--success)' }}>Home care</b>
      <span>{resumoHomecare(h) || 'Registrado, sem respostas.'}</span>
    </div>
  )
}
