// Tela da "Documentação técnica": subrota de Progresso
// (`/progresso/documentacao`), aberta pelo botão do cabeçalho daquela tela, ao
// lado do Relatório da auditoria.
//
// Subordinada a Progresso pelo mesmo motivo do relatório: é leitura de apoio a
// quem acompanha a construção do sistema (como ele é montado, que APIs expõe e
// o que pede atenção), não tela de trabalho. Sem item de menu; entra-se por
// Progresso e volta-se para lá.
//
// O acesso é o da Progresso (screen 'progresso': administração e diretoria). O
// documento descreve guards, variáveis de ambiente e pontos fracos do sistema,
// então não deve ficar ao alcance de quem opera.
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { usePageHeader } from '../components/PageHeader'
import DocumentoTecnico from '../components/documentacao/DocumentoTecnico'

// Seta para a esquerda: volta ao quadro de módulos.
const IconVoltar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
)

export default function DocumentacaoTecnica() {
  // `Link` para Progresso, e não `navigate(-1)`: quem abre por link direto não
  // tem para onde voltar, e o botão levaria para fora do sistema.
  usePageHeader(useMemo(() => ({
    title: 'Documentação técnica',
    subtitle: 'Arquitetura, segurança e APIs do sistema',
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

  return <DocumentoTecnico />
}
