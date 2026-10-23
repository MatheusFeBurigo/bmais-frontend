// "Gerar PDF" na seção "Prorrogar" da modal do relatório, no lugar onde ficava
// o "Anexar documento" (22/10/2026). A Porto
// pede o formulário de prorrogação dela junto do pedido; até 22/10/2026 ele era
// preenchido à mão e anexado ao relatório ("não é uma entrada de arquivo, é uma
// saída"). Agora sai daqui, em PDF, no modelo da Porto, com o paciente e o que
// está na modal, antes mesmo de registrar: períodos, justificativa, folha
// rosa, procedimentos, alto custo e CIDs.
//
// Só aparece para paciente da Porto. Para ajustar um campo da folha antes de
// baixar (ex.: diária globalizada), a ficha tem a tela "Formulário Porto".
import { useExportarFormularioPorto } from '../../hooks/useInternacao'
import type { InternacaoDados, RelatorioItem } from '../../types/api'
import type { FormRelatorio } from '../paciente/useFormRelatorio'
import { ehPorto, nomeArquivoPorto, preencherFolha } from './folhaPorto.model'

/** O relatório como a modal está agora, no formato que `preencherFolha` lê. */
function relatorioDaModal(form: FormRelatorio, justificativaDesc: string): RelatorioItem {
  const prr = form.prorrogacao
  const c = form.completo?.noBanco ? form.completo : null
  const fr = form.folhaRosa?.ativa ? form.folhaRosa.valores : null
  const diarias = Number(fr?.diarias)
  return {
    id: 0,
    cids: [...(form.cidPrincipal ? [form.cidPrincipal] : []), ...form.cids],
    prorrogacao: prr && {
      periodos: prr.periodos.finais(),
      justificativa: prr.justificativa,
      justificativa_desc: justificativaDesc,
      complemento: prr.complemento.trim(),
    },
    // Só a negociação completa: pela metade, a frase sairia sem sentido.
    folha_rosa: fr && fr.de && fr.para && Number.isInteger(diarias) && diarias > 0
      ? { ...fr, diarias, obs: fr.obs.trim() }
      : null,
    detalhes: c && {
      cid_principal: form.cidPrincipal?.codigo ?? null,
      procedimentos: c.ligado('procedimentos')
        ? c.procedimentos.finais().map((p) => ({ codigo: p.codigo, nome: p.nome, qtde: Number(p.qtde) || 0 }))
        : [],
      alto_custo: c.ligado('altoCusto') ? c.altoCusto.finais() : [],
      trocas_procedimento: c.ligado('trocas') ? c.trocas.finais() : [],
    },
  }
}

const IconPdf = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
    <path d="M12 18v-6" /><path d="m9 15 3 3 3-3" />
  </svg>
)

export function ExportarFormularioPorto({ form, paciente, justificativaDesc }: {
  form: FormRelatorio
  paciente: InternacaoDados
  /** A justificativa escolhida, por extenso (o catálogo está com a seção). */
  justificativaDesc: string
}) {
  const exportar = useExportarFormularioPorto()
  const prr = form.prorrogacao
  if (!prr || !ehPorto(paciente)) return null
  const semPeriodo = prr.periodos.finais().length === 0

  function baixar() {
    exportar.mutate({
      folha: preencherFolha(paciente, relatorioDaModal(form, justificativaDesc)),
      nomeArquivo: nomeArquivoPorto(paciente),
    })
  }

  return (
    <div className="rr-campo">
      <span className="form-lbl">Formulário de prorrogação da Porto</span>
      <p className="rr-bloco-dica rr-porto-dica">
        Gera o PDF no modelo da Porto, preenchido com o paciente e com o que está nesta janela.
        Envie junto do pedido de prorrogação.
      </p>
      <div className="rr-porto-acao">
        <button type="button" className="btn btn-outline btn-sm" style={{ gap: 6 }}
                disabled={semPeriodo || exportar.isPending || form.salvando} onClick={baixar}>
          <IconPdf />
          {exportar.isPending ? 'Gerando…' : 'Gerar PDF'}
        </button>
        {semPeriodo && <span className="rr-porto-nota">Adicione um período para gerar.</span>}
      </div>
      {exportar.isError && (
        <div className="t-danger" role="alert" style={{ fontSize: 'var(--t-sm)', marginTop: 6 }}>
          Não foi possível gerar o formulário. Tente de novo.
        </div>
      )}
    </div>
  )
}
