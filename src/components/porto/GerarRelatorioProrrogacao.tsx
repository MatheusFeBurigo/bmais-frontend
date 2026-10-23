// "Gerar relatório": os relatórios que saem de um pedido de prorrogação; hoje,
// o da Porto Seguro (o formulário de prorrogação dela em PDF, no modelo da
// Porto, preenchido com o paciente e o relatório). Fica em dois lugares:
//   - na seção Prorrogação da ficha de um relatório salvo (22/10/2026: "devo
//     poder gerar um relatório de prorrogação a partir de um relatório já
//     salvo, só clicando no componente");
//   - no topo da folha de impressão, ao lado de "Imprimir ou salvar em PDF"
//     (22/10/2026: "no momento de imprimir").
//
// Para ajustar algum campo antes de gerar, a ficha do paciente tem a tela
// "Formulário Porto".
import MenuAcoes from '../MenuAcoes'
import { useExportarFormularioPorto, useInternacaoDados } from '../../hooks/useInternacao'
import { dataBR } from '../../lib/datas'
import type { RelatorioItem } from '../../types/api'
import { nomeArquivoPorto, preencherFolha } from './folhaPorto.model'

const icone = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
    <path d="M12 18v-6" /><path d="m9 15 3 3 3-3" />
  </svg>
)

const IconAbrir = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
)

export function GerarRelatorioProrrogacao({ internacaoId, relatorio }: {
  internacaoId: number
  /** O relatório de onde o pedido sai; sem ele, só os dados do paciente. */
  relatorio: RelatorioItem | null
}) {
  // A ficha do paciente já buscou: vem do cache.
  const { data: paciente } = useInternacaoDados(internacaoId)
  const { mutate, isPending, isError } = useExportarFormularioPorto()

  function gerarPorto() {
    if (!paciente) return
    mutate({ folha: preencherFolha(paciente, relatorio), nomeArquivo: nomeArquivoPorto(paciente) })
  }

  const origem = relatorio
    ? `o relatório${relatorio.data_visita ? ` de ${dataBR(relatorio.data_visita)}` : ''}`
    : 'os dados do paciente'

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {isError && (
        <span role="alert" style={{ fontSize: 'var(--t-sm)', fontWeight: 400, letterSpacing: 0, color: 'var(--danger)' }}>
          Não foi possível gerar. Tente de novo.
        </span>
      )}
      <MenuAcoes
        rotulo="Gerar um relatório a partir do pedido de prorrogação"
        gatilho={{
          classe: 'btn btn-outline btn-sm',
          desabilitado: isPending,
          conteudo: <>{icone}{isPending ? 'Gerando…' : 'Gerar relatório'}{!isPending && IconAbrir}</>,
        }}
        itens={[{
          rotulo: 'Relatório para Porto Seguro',
          icone,
          dica: `Formulário de prorrogação da Porto, em PDF, preenchido com ${origem}`,
          desabilitado: !paciente,
          onClick: gerarPorto,
        }]}
      />
    </span>
  )
}
