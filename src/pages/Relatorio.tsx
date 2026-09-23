// Tela do "Relatório da Auditoria Geral": subrota de Progresso
// (`/progresso/relatorio`), aberta pelo botão do cabeçalho daquela tela.
//
// É subordinada e não irmã de propósito: o relatório é o plano de onde os
// módulos do quadro saíram, leitura de apoio a ele. Por isso não tem item de
// menu — entra-se por Progresso e volta-se para lá.
//
// O acesso é o mesmo da Progresso (screen 'progresso': administração e
// diretoria). O documento avisa, no rodapé, que traz valores de pagamento e não
// deve circular fora da diretoria; aqui o alcance passa a ser o do papel, em vez
// de depender de quem recebeu o anexo por e-mail.
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { usePageHeader } from '../components/PageHeader'
import DocumentoRelatorio from '../components/relatorio/DocumentoRelatorio'

// Seta para a esquerda: volta ao quadro de módulos.
const IconVoltar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
)

export default function Relatorio() {
  // `Link` para Progresso, e não `navigate(-1)`: quem abre o relatório por link
  // direto não tem para onde voltar, e o botão levaria para fora do sistema.
  usePageHeader(useMemo(() => ({
    title: 'Relatório da auditoria',
    subtitle: 'Sistema B+: levantamento, plano de construção e plano de transição',
    actions: (
      <>
        <Link to="/progresso" className="btn btn-outline btn-sm">
          <IconVoltar />
          Voltar
        </Link>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => window.print()}>
          Imprimir ou salvar em PDF
        </button>
      </>
    ),
  }), []))

  return <DocumentoRelatorio />
}
