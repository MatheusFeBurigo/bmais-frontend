// Conteúdo dos módulos da área de Operação: o trabalho do dia a dia.
// Cada módulo declara no catálogo a tela que documenta, e só chega a quem
// acessa essa tela.
import { Callout, Chip, Key, Metric, Metrics, Passo, Passos, Tabela } from './blocos'
import { ComoFazer, Tela } from './replica'
import { ACOES_NO_PAINEL, NEGOCIACAO_NO_RELATORIO } from '../../lib/recursos'
import {
  ReplicaAdicionarPaciente, ReplicaCidsPaciente, ReplicaCobranca, ReplicaConferencia, ReplicaDadosPaciente,
  ReplicaFichaRapida, ReplicaFormularioEnvio, ReplicaModalAlta, ReplicaPainel, ReplicaQuadro,
  ReplicaResultadoEnvio,
} from './exemplosOperacao'

interface Props {
  irPara: (id: string) => void
}

export function ModuloOperacional({ irPara }: Props) {
  return (
    <>
      <h3>Objetivo</h3>
      <p>
        Apresentar de forma centralizada quais pacientes internados requerem relatório de auditoria
        e com que urgência. A partir dela, a equipe prioriza as visitas do dia, consulta a ficha do
        paciente, registra relatórios, cadastra pacientes manualmente e exporta a planilha de
        controle.
      </p>

      <h3>Passo a passo</h3>
      <ComoFazer
        titulo="Descobrir quem precisa de visita hoje"
        passos={[
          { n: 1, titulo: "Escolha a operadora, ou deixe todas", corpo: <>A tela abre com todas as operadoras juntas. Troque aqui para ver só uma delas.</> },
          { n: 2, titulo: "Clique no cartão da situação que quer atacar", corpo: <><strong>Sem Relatório</strong> e <strong>Atrasado</strong> são os mais urgentes. O cartão clicado ganha um contorno e a lista passa a mostrar só aqueles pacientes. Clique de novo para voltar a ver todos.</> },
          { n: 3, titulo: "Afine com os filtros rápidos, se precisar", corpo: <>Por exemplo, <strong>UTI / CTI</strong> para começar pelos leitos de terapia intensiva, ou{' '} <strong>Longa permanência</strong> e depois a partir de quantos dias (3, 7, 10, 15 ou 30) para ver quem está internado há mais tempo.</> },
          { n: 4, titulo: "Clique na linha do paciente", corpo: <>Abre a ficha rápida ao lado, sem sair da lista. É ali que se registra o relatório e se agenda a visita (veja{' '} <button type="button" className="aj-link" onClick={() => irPara('ficha-do-paciente')}>Ficha do Paciente</button>).</> },
        ]}
      >
        <Tela nome="Painel Operacional" largura={960}
          descricao="Cartão Sem Relatório clicado: a lista mostra só os pacientes que nunca receberam visita.">
          <ReplicaPainel kpiAtivo="sem_relatorio" marcas={{ operadora: 1, kpi: 2, filtros: 3, linha: 4 }} />
        </Tela>
      </ComoFazer>

      <ComoFazer
        titulo="Encontrar um paciente específico"
        passos={[
          { n: 1, titulo: "Digite no campo de busca", corpo: <>Vale o nome do segurado, o número de atendimento ou a senha de autorização. Não precisa digitar o nome inteiro.</> },
          { n: 2, titulo: "Não achou? Ligue o filtro Altas", corpo: <>A lista mostra só quem está internado. Um paciente que já saiu só aparece na busca com o filtro <strong>Altas</strong> ligado.</> },
          { n: 3, titulo: "Clique na linha para abrir a ficha", corpo: <>Se nem assim aparecer, confira se a operadora e o hospital escolhidos no topo são os dele.</> },
        ]}
      >
        <Tela nome="Painel Operacional" largura={960}
          descricao="A busca procura por nome, número de atendimento e senha de autorização.">
          <ReplicaPainel marcas={{ busca: 1, filtros: 2, linha: 3 }} />
        </Tela>
      </ComoFazer>

      <ComoFazer
        titulo="Cadastrar um paciente que não veio no censo"
        passos={[
          { n: 1, titulo: "Clique em Adicionar paciente", corpo: <>Abre o formulário de cadastro manual. Quem tem perfil somente leitura não vê o botão.</> },
          { n: 2, titulo: "Escolha a operadora e o hospital", corpo: <>O hospital só libera depois da operadora, e a lista traz apenas os hospitais dela.</> },
          { n: 3, titulo: "Informe nome e atendimento", corpo: <>Os dois são obrigatórios. O atendimento é o que impede o mesmo paciente de ser cadastrado duas vezes no hospital.</> },
          { n: 4, titulo: "Marque a situação e as datas", corpo: <><strong>Internado</strong> pede só a data de entrada, que é a base de todo o cálculo de dias. <strong>Alta</strong> serve para quem já saiu: pede também a data de alta, entre a entrada e hoje, e o paciente entra direto nos indicadores de altas e de permanência.</> },
          { n: 5, titulo: "Complete o resto, se souber", corpo: <>Leito, especialidade e médico são opcionais e podem ser completados depois, na ficha. O leito define o gatilho de monitoramento, então vale informar.</> },
          { n: 6, titulo: "Clique em Adicionar", corpo: <>Se o atendimento já existir naquele hospital, o sistema avisa e não cria um paciente repetido.</> },
        ]}
      >
        <Tela nome="Painel Operacional" largura={960}
          descricao="O botão Adicionar paciente fica no topo da lista de internados.">
          <ReplicaPainel marcas={{ adicionar: 1 }} />
        </Tela>
        <Tela nome="Painel Operacional" largura={560}
          descricao="Formulário de cadastro manual, preenchido para um paciente que já teve alta.">
          <ReplicaAdicionarPaciente marcas={{ origem: 2, paciente: 3, situacao: 4, opcionais: 5, adicionar: 6 }} />
        </Tela>
      </ComoFazer>

      <h3>Os cinco indicadores</h3>
      <Metrics>
        <Metric tom="critical" label="Sem relatório" valor="Nunca registrado"
          nota="Pacientes que nunca receberam visita" />
        <Metric tom="warn" label="Atrasado" valor="Passou da janela"
          nota="Último relatório mais antigo que o prazo" />
        <Metric tom="attention" label="Próximo a vencer" valor="Vence em 1 a 3 dias"
          nota="Alerta antecipado configurável" />
        <Metric tom="positive" label="Em dia" valor="Sem relatório devido"
          nota="Em conformidade com a regra" />
        <Metric tom="neutral" label="Total ativos" valor="Todos os internados"
          nota="Com o número em monitoramento" />
      </Metrics>
      <p>
        Clicar num cartão filtra a lista por aquele status. Clicar de novo no cartão já ativo volta
        a mostrar todos. Trocar de indicador ou de operadora limpa o hospital selecionado.
      </p>

      <h3>Filtros disponíveis</h3>
      <Tabela cabecalho={['Filtro', 'O que faz']} larguras={['185px']}>
        <tr><Key>Operadora</Key><td>Recorta tudo para uma operadora, ou consolida todas.</td></tr>
        <tr><Key>Hospital</Key><td>Restringe a uma unidade. Cada opção já mostra quantos internados e quantos alertas ela tem. Na visão consolidada, os hospitais aparecem agrupados por operadora.</td></tr>
        <tr><Key>Busca</Key><td>Procura por nome do segurado, número de atendimento e senha de autorização.</td></tr>
        <tr><Key>UTI e CTI</Key><td>Mantém apenas leitos de terapia intensiva.</td></tr>
        <tr><Key>Longa permanência</Key><td>Escolha a partir de quantos dias de internação: 3, 7, 10, 15 ou 30. O chip fica marcado com o corte escolhido. Clique nele para trocar, ou no x para tirar o filtro. Na lista de altas, conta os dias até a alta.</td></tr>
        <tr><Key>Altas</Key><td>Troca a base da lista para os pacientes que já saíram, em vez dos internados.</td></tr>
        <tr><Key>Ordenação</Key><td>Padrão, mais dias sem relatório, ou mais dias internado. Na primeira opção, quem nunca teve relatório vai ao topo.</td></tr>
      </Tabela>

      <h3>Colunas da tabela</h3>
      <Tabela cabecalho={['Coluna', 'Conteúdo']} larguras={['150px']}>
        <tr><Key>Relatório</Key><td>Pastilha colorida de status, detalhada no{' '}
          <button type="button" className="aj-link" onClick={() => irPara('calculo-do-status')}>anexo de regras</button>.
          A linha inteira recebe uma faixa da mesma cor.</td></tr>
        <tr><Key>Operadora</Key><td>Só na visão consolidada. Identifica a operadora do paciente.</td></tr>
        <tr><Key>Hospital</Key><td>Clicável, abre a ficha de contato do hospital sem sair da tela.</td></tr>
        <tr><Key>Segurado</Key><td>Nome do paciente. Quando o censo não traz nome, identifica por senha de autorização; na falta desta, pelo número de atendimento.</td></tr>
        <tr><Key>Atendimento</Key><td>Número do atendimento.</td></tr>
        <tr><Key>Leito</Key><td>UTI, apartamento ou enfermaria.</td></tr>
        <tr><Key>Internação</Key><td>Data de entrada.</td></tr>
        <tr><Key>Última visita</Key><td>Data do último relatório registrado.</td></tr>
        <tr><Key>Sem relatório</Key><td>Fração de dias decorridos sobre a janela permitida. Fica vermelho quando não há relatório e laranja quando venceu.</td></tr>
        <tr><Key>Dias internado</Key><td>Fração de dias sobre o gatilho de alerta.</td></tr>
        <tr><Key>Permanência</Key><td>Marcador de longa permanência com o limite real da operadora.</td></tr>
      </Tabela>

      <h3>Ações disponíveis</h3>
      <Tabela cabecalho={['Ação', 'Efeito']} larguras={['185px']}>
        <tr><Key>Clicar numa linha</Key><td>Abre a <strong>ficha rápida do paciente</strong> em painel lateral: dias internado, dias sem relatório, leito, timeline da internação{ACOES_NO_PAINEL ? ' e, para técnico, gestor e operacional, o formulário de registrar relatório' : ''}. Técnico, gestor e operacional têm ainda o botão <strong>Alta</strong>, no rodapé.</td></tr>
        <tr><Key>Clicar no hospital</Key><td>Abre a ficha do hospital, com indicadores, operadoras atendidas, dados cadastrais e histórico de censos sob demanda.</td></tr>
        <tr><Key>Adicionar paciente</Key><td>Cadastro manual: operadora, hospital, nome, atendimento, situação (internado ou alta), data de entrada, data de alta quando for o caso e, opcionalmente, leito, especialidade e médico. Não duplica: se o atendimento já existir no hospital, avisa que o paciente não foi duplicado.</td></tr>
        <tr><Key>Exportar</Key><td>Gera a planilha de controle de auditoria, da operadora aberta ou de todas num único arquivo, com uma aba por hospital.</td></tr>
        <tr><Key>Atualizar</Key><td>Recarrega lista, indicadores e contagens da barra lateral.</td></tr>
      </Tabela>
    </>
  )
}

export function ModuloPaciente({ irPara }: Props) {
  return (
    <>
      <h3>Objetivo</h3>
      <p>
        Reunir tudo sobre uma internação: situação do relatório, dados cadastrais corrigíveis, os
        CIDs do paciente, relatórios já registrados com seus documentos anexos e o histórico
        completo da internação.
      </p>

      <h3>Como se chega</h3>
      <p>
        Pelo botão <strong>Detalhes</strong> da ficha rápida do Painel Operacional, ou por link
        direto. O perfil analista vê a ficha rápida, mas não abre a completa.{' '}
        <strong>Técnico, gestor e operacional registram relatório</strong>; o do operacional só vale
        depois que um técnico ou gestor aprova. <strong>Mexer nos CIDs é do técnico e do gestor</strong>, e
        cada pessoa continua vendo apenas os pacientes dos hospitais do seu escopo.
      </p>

      <h3>Passo a passo</h3>
      {/* Registrar pela ficha rápida está oculto (lib/recursos): o relatório
          se registra pela modal da ficha, explicada em "Relatórios" abaixo. */}
      {ACOES_NO_PAINEL && (<>
      <ComoFazer
        titulo="Registrar o relatório de uma visita"
        passos={[
          { n: 1, titulo: "Informe a data em que a visita aconteceu", corpo: <>O calendário só aceita hoje ou datas passadas. Visita futura se marca no bloco{' '} <strong>Agendar visita</strong>, logo abaixo.</> },
          { n: 2, titulo: "Escolha o médico auditor", corpo: <>Comece a digitar o nome. A lista traz os médicos ativos do cadastro, e um nome fora dela também é aceito.</> },
          { n: 3, titulo: "Informe o CID observado, se houver", corpo: <>Opcional. A lista traz primeiro os CIDs que o paciente já tem e depois o catálogo inteiro. Um CID que o paciente ainda não tem aparece como <strong>Novo no paciente</strong> e passa a constar na ficha dele ao registrar.</> },
          { n: 4, titulo: "Escreva a observação, se houver", corpo: <>Texto livre, que aparece no histórico do paciente.</> },
          { n: 5, titulo: "Clique em Registrar relatório", corpo: <>O status do paciente é recalculado na hora e ele sai das listas de pendência. O relatório aparece na timeline com a cor do seu perfil. No perfil operacional o botão é <strong>Enviar para aprovação</strong>, sem o campo CID, e o paciente fica como <strong>Aguardando aprovação</strong> até um técnico aprovar.</> },
        ]}
      >
        <Tela nome="Ficha rápida do paciente" largura={640}
          descricao="A ficha rápida abre ao clicar num paciente do Painel Operacional ou do quadro de Tarefas.">
          <ReplicaFichaRapida preenchido esconderAgenda
            marcas={{ dataVisita: 1, medico: 2, cid: 3, obs: 4, registrar: 5 }} />
        </Tela>
      </ComoFazer>
      <Callout tipo="info" titulo="Técnico ou gestor aprova o relatório do operacional">
        O relatório do operacional vai para a coluna <strong>Aguardando aprovação</strong> do quadro
        de pacientes, em Tarefas. O do técnico e o do gestor valem na hora. Os demais perfis veem a ficha, mas o bloco de
        registrar não aparece para eles.
      </Callout>
      </>)}

      <ComoFazer
        titulo="Corrigir um dado que veio errado ou faltando"
        passos={[
          { n: 1, titulo: "Veja o que falta", corpo: <>O aviso amarelo diz quais campos importantes o censo não trouxe. Eles também ficam destacados na grade.</> },
          { n: 2, titulo: "Clique em Editar", corpo: <>Chega-se à ficha completa pelo botão <strong>Detalhes</strong> da ficha rápida.</> },
          { n: 3, titulo: "Corrija ou complete os campos", corpo: <>O destaque amarelo some assim que o campo é preenchido.</> },
          { n: 4, titulo: "Clique em Salvar", corpo: <>A alteração fica registrada na timeline, com o seu nome. <strong>Cancelar</strong> descarta tudo o que foi digitado.</> },
        ]}
      >
        <>
          <Tela nome="Ficha do paciente" largura={720}
            descricao="Campo importante que o censo não trouxe fica em amarelo, com um aviso acima do card.">
            <ReplicaDadosPaciente marcas={{ aviso: 1, editar: 2 }} />
          </Tela>
          <Tela nome="Ficha do paciente (editando)" largura={720}
            descricao="Em edição, todos os campos corrigíveis viram caixas de texto de uma vez.">
            <ReplicaDadosPaciente editando marcas={{ campo: 3, salvar: 4 }} />
          </Tela>
        </>
      </ComoFazer>
      <ComoFazer
        titulo="Dar alta a um paciente que já saiu"
        passos={[
          { n: 1, titulo: "Clique em Alta", corpo: <>No rodapé da ficha rápida ou no topo da ficha completa. Serve para quando o hospital demora a mandar o censo e já se sabe que o paciente saiu: sem censo, ninguém sai da lista sozinho.</> },
          { n: 2, titulo: "Informe a data da alta", corpo: <>Obrigatória. Vai da data de internação até hoje.</> },
          { n: 3, titulo: "Informe o horário, se souber", corpo: <>Opcional.</> },
          { n: 4, titulo: "Clique em Confirmar alta", corpo: <>O paciente sai da lista de internados e passa a constar nas altas. Se havia visita agendada, ela é cancelada. A alta fica registrada na timeline, com o seu nome.</> },
        ]}
      >
        <Tela nome="Ficha rápida do paciente" largura={640}
          descricao="O botão Alta fica no rodapé, longe das ações de relatório.">
          <ReplicaFichaRapida esconderRelatorio esconderAgenda marcas={{ alta: 1 }} />
        </Tela>
        <Tela nome="Alta" largura={520} descricao="A janela de alta, com a data e o horário preenchidos.">
          <ReplicaModalAlta marcas={{ data: 2, hora: 3, confirmar: 4 }} />
        </Tela>
      </ComoFazer>
      <Callout tipo="info" titulo="Quem dá alta, e como desfazer">
        Técnico e operacional. Deu alta por engano? No mesmo lugar aparece{' '}
        <strong>Desfazer alta</strong>, e o paciente volta para a lista de internados. Vale para a
        alta dada à mão e para a alta automática; a alta que veio no censo do hospital não se desfaz.
      </Callout>

      <ComoFazer
        titulo="Adicionar os CIDs do paciente"
        passos={[
          { n: 1, titulo: "Clique no campo Adicionar CID", corpo: <>Fica no card <strong>CID</strong> da ficha completa, abaixo de Dados do Paciente. A lista abre com o catálogo inteiro. Digite o código (J18.9) ou parte do nome da doença para filtrar.</> },
          { n: 2, titulo: "Clique no CID", corpo: <>Escolher já adiciona: não há botão de confirmar. O campo continua pronto para o próximo. O que o paciente já tem aparece como <strong>Já adicionado</strong>.</> },
          { n: 3, titulo: "Confira a lista", corpo: <>Cada CID mostra a categoria e o capítulo a que pertence, e quem o adicionou.</> },
          { n: 4, titulo: "Use a lixeira para tirar um CID", corpo: <>Remove na hora, sem pedir confirmação.</> },
        ]}
      >
        <Tela nome="Ficha do paciente" largura={640}
          descricao="Card CID com a lista de sugestões aberta e dois CIDs já vinculados.">
          <ReplicaCidsPaciente marcas={{ campo: 1, opcao: 2, lista: 3, remover: 4 }} />
        </Tela>
      </ComoFazer>
      <Callout tipo="info" titulo="Só o perfil técnico adiciona e remove CID">
        Os demais perfis veem o card quando o paciente tem algum CID. Ao registrar um relatório, o
        técnico também pode informar um CID novo, que entra junto na lista do paciente.
      </Callout>

      <p>
        Para marcar uma visita futura, veja o passo a passo em{' '}
        <button type="button" className="aj-link" onClick={() => irPara('tarefas')}>Tarefas</button>.
      </p>

      <h3>Os quatro indicadores</h3>
      <Metrics>
        <Metric tom="brand" label="Dias internado" valor="Dias decorridos"
          nota="Com o gatilho da operadora como referência. Fica vermelho quando o paciente está sem relatório" />
        <Metric tom="neutral" label="Tipo de leito" valor="UTI, apartamento ou enfermaria"
          nota="Com o código do leito" />
        <Metric tom="critical" label="Última visita" valor="Data do último relatório"
          nota="Na ausência, o cartão inteiro fica em destaque vermelho" />
        <Metric tom="attention" label="Próximo vencimento" valor="Dias restantes"
          nota="Sobre a janela da operadora" />
      </Metrics>

      <h3>Dados do paciente</h3>
      <p>
        Mostra a situação da internação e os campos cadastrais. O botão de editar abre a edição em
        bloco, com as opções de cancelar e salvar.
      </p>
      <Tabela cabecalho={['Campo', 'Editável', 'Observação']} larguras={['180px', '95px']}>
        <tr><Key>Nome do segurado</Key><td><Chip tom="positive" plain>Sim</Chip></td><td>Exibido com iniciais maiúsculas. Na edição, é apresentado exatamente como foi gravado, evitando alteração involuntária do nome.</td></tr>
        <tr><Key>Senha de autorização</Key><td><Chip tom="positive" plain>Sim</Chip></td><td>É como o paciente é identificado quando o censo do hospital não traz o nome dele.</td></tr>
        <tr><Key>Carteirinha</Key><td><Chip tom="positive" plain>Sim</Chip></td><td>Número do beneficiário na operadora, quando o censo o informa.</td></tr>
        <tr><Key>Status</Key><td><Chip tom="positive" plain>Sim</Chip></td><td>Internado, alta, óbito ou transferido.</td></tr>
        <tr><Key>Recém-nascido</Key><td><Chip tom="neutral" plain>Não</Chip></td><td>O sistema marca quando o nome traz RN (como "RN de Maria"), quando a idade é de até 28 dias ou quando a data de nascimento é de até 28 dias antes da internação.</td></tr>
        <tr><Key>Atendimento</Key><td><Chip tom="positive" plain>Sim</Chip></td><td>Número do atendimento no hospital.</td></tr>
        <tr><Key>Tipo de leito</Key><td><Chip tom="positive" plain>Sim</Chip></td><td>Define o gatilho aplicado ao paciente.</td></tr>
        <tr><Key>Leito e código</Key><td><Chip tom="positive" plain>Sim</Chip></td><td></td></tr>
        <tr><Key>Data de internação</Key><td><Chip tom="positive" plain>Sim</Chip></td><td>Base de todo o cálculo de dias.</td></tr>
        <tr><Key>Data de alta</Key><td><Chip tom="neutral" plain>Não</Chip></td><td>Indica que o paciente permanece enquanto a internação está ativa.</td></tr>
        <tr><Key>Médico e especialidade</Key><td><Chip tom="positive" plain>Sim</Chip></td><td></td></tr>
        <tr><Key>Diagnóstico e observações</Key><td><Chip tom="positive" plain>Sim</Chip></td><td>Ocupam a linha inteira.</td></tr>
      </Tabela>

      <h3>Relatórios</h3>
      <p>
        Lista os relatórios de auditoria já registrados, com contador. O botão{' '}
        <strong>Registrar</strong> abre o relatório completo numa janela. No alto ficam os dados do
        paciente; os relatórios anteriores continuam na timeline da ficha. A janela abre simples:
        só o relatório de visita aberto, e as demais seções fechadas, com o resumo do que já está
        preenchido.
        Cada uma reduz e expande pela seta ao lado do título.
      </p>
      <ul>
        <li><strong>Relatório de visita</strong>: a data, obrigatória e já com a data de hoje, o médico
          ou o enfermeiro que fez a visita (um campo só) e o que foi analisado.</li>
        <li><strong>Quadro de internação</strong>: caráter (urgência ou eletivo), tipo de
          internação e as acomodações utilizadas, com entrada e saída. Elas vêm do censo e das
          trocas já registradas, e a janela mostra onde o paciente está. Para cada troca que
          faltar, como a ida para a UTI e a volta para o quarto, use{' '}
          <strong>Adicionar movimentação</strong> e escolha a nova acomodação e a data: ao
          registrar, ela entra na timeline como <strong>Mudança de acomodação</strong>. Sem
          nenhuma acomodação conhecida, preencha a acomodação, a entrada e a saída.</li>
        <li><strong>Quadro clínico</strong>: diagnóstico principal e secundário, opcionais, e o
          texto do relatório, obrigatório. O CID que o paciente ainda não tem passa a constar na
          ficha dele.</li>
        <li><strong>No período</strong>: procedimentos realizados, medicação de alto custo, evento
          adverso e folha rosa (a troca de acomodação). Quando o relatório com folha rosa passa a
          valer, a timeline ganha o evento <strong>Troca de acomodação</strong>.</li>
        <li><strong>Prorrogação</strong>: marque <strong>Pedir prorrogação</strong>, adicione os
          períodos (acomodação, início e fim) e escolha a justificativa. O período seguinte já vem
          começando no dia depois do anterior. Depois que a prorrogação vale, admin e operacional
          pausam e retomam pelo botão <strong>Pausar prorrogação</strong>, no topo da ficha.</li>
{NEGOCIACAO_NO_RELATORIO && (
        <li><strong>Negociação com o hospital</strong>: glosa de diárias, medicação negada,
          procedimento negado e troca de procedimento.</li>
        )}
      </ul>
      <p>
        A prorrogação e os blocos de <strong>No período</strong>
        {NEGOCIACAO_NO_RELATORIO && <> e <strong>Negociação com o hospital</strong></>} abrem quando
        marcados. Nas listas, preencha a
        linha e clique em <strong>Adicionar</strong>; a última linha completa também entra ao
        registrar. O lápis devolve o item à linha para corrigir. Se o paciente teve alta, use o
        botão <strong>Alta</strong> do rodapé, ao lado de <strong>Registrar relatório</strong>: é o
        mesmo do topo da ficha e vale na hora. Com o motivo <strong>Homecare</strong>, a alta pede
        as perguntas de home care (solicitado, oxigenioterapia, mobilização, nível de consciência,
        acesso venoso, traqueostomia, curativo e ostomias), todas obrigatórias, e a alimentação; as
        respostas ficam no evento da alta na timeline.
      </p>
      <p>
        Cada relatório aparece como um cartão com borda colorida pelo papel de quem o registrou, com
        data e hora, autor, médico responsável, os CIDs informados e um resumo do que foi marcado
        e, quando há anexo, o botão de baixar o documento. Prorrogação e folha rosa valem quando o
        relatório é aprovado. Clicar num relatório abre a ficha dele, só para leitura, com o que
        foi preenchido em cada seção.
      </p>

      <h3>Timeline</h3>
      <p>
        Histórico completo da internação, do mais recente para o mais antigo, com o marco de hoje no
        topo. Registra admissão, relatórios externos, pareceres internos, mudanças de status, altas
        automáticas, altas dadas à mão e desfeitas, edições manuais e pendências. Relatórios internos exibem o autor; os externos,
        o médico responsável. Clicar num relatório (ou numa troca de acomodação) abre a ficha do
        relatório. Quando o censo mostra o paciente noutra acomodação, entra o card{' '}
        <strong>Mudança de acomodação</strong>, no dia do censo, dizendo de onde ele saiu e para
        onde foi. Trocar o tipo de leito pelo <strong>Editar</strong> da ficha gera o mesmo card, com
        o nome de quem editou; trocar só o leito gera <strong>Mudança de leito</strong>.
      </p>
    </>
  )
}

export function ModuloKanban({ irPara }: Props) {
  return (
    <>
      <h3>Objetivo</h3>
      <p>
        Reunir as pendências da equipe em um quadro único, separadas por tipo: pacientes que
        precisam de relatório, visitas já marcadas, visitas cujo horário passou e hospitais que não
        enviaram o censo.
      </p>

      <h3>Passo a passo</h3>
      {/* Agendar e cancelar visita pela ficha rápida estão ocultos (lib/recursos). */}
      {ACOES_NO_PAINEL && (<>
      <ComoFazer
        titulo="Agendar a visita de um paciente"
        passos={[
          { n: 1, titulo: "Clique no card do paciente", corpo: <>Na coluna <strong>Sem relatório</strong>. Para conferir um dado sem sair do quadro, use{' '} <strong>Mais detalhes</strong>, que abre dentro do próprio card.</> },
          { n: 2, titulo: "Escolha o dia da visita", corpo: <>O calendário só oferece datas a partir de hoje.</> },
          { n: 3, titulo: "Informe o horário", corpo: <>É ele que define quando a visita passa a contar como atrasada.</> },
          { n: 4, titulo: "Escolha o médico responsável", corpo: <>Entre os médicos auditores ativos do cadastro. É a pessoa que será cobrada se a visita não acontecer.</> },
          { n: 5, titulo: "Clique em Agendar visita", corpo: <>O botão só libera com os três campos preenchidos.</> },
          { n: 6, titulo: "Confira o card em Aguardando visita", corpo: <>O card sai de <strong>Sem relatório</strong> e passa a mostrar a data, o horário e o responsável. Ele deixa o quadro quando o relatório da visita for registrado.</> },
        ]}
      >
        <>
          <Tela nome="Tarefas" largura={960}
            descricao="Quadro do perfil técnico: pacientes sem relatório, visitas marcadas e visitas atrasadas.">
            <ReplicaQuadro marcas={{ card: 1, aguardando: 6 }} />
          </Tela>
          <Tela nome="Ficha rápida do paciente" largura={640}
            descricao="O bloco Agendar visita fica no fim da ficha rápida. Os três campos são obrigatórios.">
            <ReplicaFichaRapida preenchido esconderRelatorio
              marcas={{ agendaData: 2, agendaHora: 3, agendaMedico: 4, agendar: 5 }} />
          </Tela>
        </>
      </ComoFazer>

      <ComoFazer
        titulo="Resolver uma visita atrasada"
        passos={[
          { n: 1, titulo: "Veja de quem era a visita", corpo: <>O card no quadro e a ficha dizem quando era e quem é o responsável. Cobre essa pessoa.</> },
          { n: 2, titulo: "A visita aconteceu? Registre o relatório", corpo: <>Com a data em que ela de fato ocorreu. O paciente sai do quadro.</> },
          { n: 3, titulo: "Não vai acontecer? Cancele e marque de novo", corpo: <><strong>Cancelar</strong> devolve o card para <strong>Sem relatório</strong>, e o bloco de agendar volta a aparecer para uma nova data.</> },
        ]}
      >
        <Tela nome="Ficha rápida do paciente" largura={640}
          descricao="Paciente da coluna Visitas atrasadas: o horário combinado passou e nenhum relatório foi registrado.">
          <ReplicaFichaRapida atrasada marcas={{ agendaResumo: 1, registrar: 2, cancelar: 3 }} />
        </Tela>
      </ComoFazer>
      </>)}

      <ComoFazer
        titulo="Cobrar um censo atrasado"
        passos={[
          { n: 1, titulo: "Contate o hospital e clique em Marcar como cobrado", corpo: <>O card mostra desde que dia falta o censo e até quando os dados do hospital estão atualizados. Ao marcar, anote com quem falou: a anotação é obrigatória e fica na timeline do card.</> },
          { n: 2, titulo: "O card espera em Aguardando retorno", corpo: <>Quando o censo chegar pelo{' '} <button type="button" className="aj-link" onClick={() => irPara('envio-de-censos')}>Envio de Censos</button>, ele sai sozinho. Se o dia virar sem censo, ele volta para Censos atrasados para uma nova cobrança.</> },
        ]}
      >
        <Tela nome="Tarefas" largura={960}
          descricao="Quadro de censos do perfil operacional. O card é por hospital, não por paciente.">
          <ReplicaCobranca marcas={{ card: 1, retorno: 2 }} />
        </Tela>
      </ComoFazer>

      <h3>Como o quadro funciona</h3>
      <p>
        O quadro é dividido em colunas, e <strong>cada coluna reúne um tipo de pendência</strong>.
        Uma tarefa permanece na sua coluna até ser resolvida, e então deixa o quadro. As colunas não
        são fases de um mesmo item: indicam o tipo de providência necessária. A exceção é o
        agendamento, que de fato move o card, conforme descrito adiante.
      </p>

      <h3>As colunas de pacientes</h3>
      <Tabela cabecalho={['Coluna', 'O que reúne', 'Como a tarefa é resolvida']} larguras={['160px', undefined, '215px']}>
        <tr><Key>Sem relatório</Key>
          <td>Internados sem relatório, ou com o relatório vencido, e sem visita marcada.</td>
          <td>Marcando a visita ou registrando o relatório.</td></tr>
        <tr><Key>Aguardando visita</Key>
          <td>Pacientes com visita marcada, ainda dentro do prazo.</td>
          <td>Registrando o relatório depois da visita.</td></tr>
        <tr><Key>Visitas atrasadas</Key>
          <td>Visitas cujo horário combinado já passou sem que o relatório fosse registrado.</td>
          <td>Cobrando o auditor responsável, e registrando o relatório ou remarcando a visita.</td></tr>
      </Tabela>

      <h3>As colunas de aprovação</h3>
      <p>
        No mesmo quadro de pacientes, à direita da fila. O relatório que o operacional registra
        chega aqui para o técnico conferir. Enquanto
        espera, o paciente aparece como <strong>Aguardando aprovação</strong> e não conta como
        visitado. Aprovado, o paciente sai do quadro e volta para <strong>Sem relatório</strong>{' '}
        quando o relatório vencer.
      </p>
      <Tabela cabecalho={['Coluna', 'O que reúne', 'O que fazer']} larguras={['160px', undefined, '215px']}>
        <tr><Key>Aguardando aprovação</Key>
          <td>Relatórios enviados pelo operacional, com o texto no próprio card.</td>
          <td>Técnico ou gestor: Aprovar, ou Devolver dizendo o que corrigir.</td></tr>
        <tr><Key>Devolvidos</Key>
          <td>Relatórios que o técnico pediu para corrigir, com o motivo.</td>
          <td>Quem escreveu: Corrigir e reenviar.</td></tr>
      </Tabela>

      <h3>A coluna Em prorrogação</h3>
      <p>
        A prorrogação é pedida ao registrar o relatório na ficha <strong>Detalhes</strong> do
        paciente: marque <strong>Pedir prorrogação</strong>, informe os períodos por acomodação e
        escolha a justificativa. Ela vale quando o relatório é aprovado e não muda o prazo do
        próximo relatório. A coluna, no quadro de pacientes, lista quem está em prorrogação,
        primeiro as que terminam hoje. Nas outras colunas de pacientes, o card do paciente
        prorrogado mostra <strong>Prorrogado até</strong> a data final (ou{' '}
        <strong>Prorrogação pausada</strong>). Passada a data final, o paciente volta para{' '}
        <strong>Sem relatório</strong>. Admin e operacional podem{' '}
        <strong>Pausar</strong> e <strong>Retomar</strong> no próprio card.
      </p>

      <h3>As colunas de censos</h3>
      <p>
        Cada hospital aparece uma vez por operadora com paciente internado, pela data do último
        censo daquela operadora. O censo da Porto chegar não conta para a Bradesco do mesmo
        hospital. O card muda de coluna sozinho quando o censo chega, e o filtro de operadora
        mostra só os censos de uma delas. Clicar no card abre a timeline dos últimos 15 dias,
        com as anotações e os censos recebidos, e o contato do hospital. Toda mudança de coluna
        feita à mão pede uma anotação do que aconteceu.
      </p>
      <Tabela cabecalho={['Coluna', 'Quando o hospital está aqui', 'O que fazer']} larguras={['160px', undefined, '215px']}>
        <tr><Key>Censos atrasados</Key>
          <td>Falta o censo de ontem ou de dias anteriores, ou o hospital nunca enviou. Hospital que manda censo a cada tantos dias só atrasa depois desse prazo.</td>
          <td>Cobrar o hospital e clicar em Marcar como cobrado.</td></tr>
        <tr><Key>Aguardando retorno</Key>
          <td>O hospital já foi cobrado e o censo ainda não chegou.</td>
          <td>Esperar. Se o hospital avisar que não há censo novo, clicar em Marcar como atualizado. Se o dia virar sem censo, o card volta para Censos atrasados. Cobrou por engano? Desfazer cobrança.</td></tr>
        <tr><Key>Aguardando censo</Key>
          <td>O censo de ontem chegou, o de hoje ainda não.</td>
          <td>Nada por enquanto.</td></tr>
        <tr><Key>Censos atualizados</Key>
          <td>O censo de hoje já chegou, ou o hospital confirmou que não há censo novo.</td>
          <td>Nada. O hospital está em dia.</td></tr>
      </Tabela>

      <h3>O que cada perfil vê</h3>
      <p>
        As colunas seguem a divisão de responsabilidades: cada perfil recebe a fila que é dele, e
        não o quadro inteiro.
      </p>
      <ul>
        <li>O perfil <strong>técnico</strong> vê as três colunas de pacientes, que são a agenda de
          visitas dele, sem a cobrança de censo.</li>
        <li>O perfil <strong>operacional</strong> vê as colunas de censos, que são a
          providência dele junto aos hospitais.</li>
        <li>Quem acompanha as duas equipes alterna entre os quadros pelas abas{' '}
          <strong>Pacientes</strong> e <strong>Censos</strong>.</li>
        <li>O perfil <strong>analista</strong> acompanha o quadro sem executar as tarefas, por ser
          um perfil de observação.</li>
      </ul>

      {ACOES_NO_PAINEL && (<>
      <h3>Agendar a visita</h3>
      <p>
        Abrir um paciente do quadro mostra a ficha rápida dele, e é ali que a visita é marcada. O
        agendamento pede <strong>três informações obrigatórias</strong>.
      </p>
      <ul>
        <li>A <strong>data da visita</strong>, escolhida no calendário, que só aceita datas a partir
          de hoje.</li>
        <li>O <strong>horário</strong>, porque é ele que define quando a visita passa a estar
          atrasada.</li>
        <li>O <strong>médico responsável</strong>, escolhido entre os médicos auditores ativos
          do cadastro, que são os mesmos oferecidos ao registrar um relatório.</li>
      </ul>
      <p>
        Marcada a visita, o card <strong>sai de "Sem relatório" e passa para "Aguardando
        visita"</strong>, com a data, o horário e o responsável visíveis. Passado o horário
        combinado sem relatório registrado, ele vai para "Visitas atrasadas", e o card diz de quem
        era a visita, para a cobrança ter destinatário. A visita também pode ser cancelada.
      </p>

      <Callout tipo="rule" titulo="Quem marca a visita">
        O agendamento pertence a quem realiza a visita, e por isso é feito pelo perfil técnico. Os
        perfis de observação acompanham o quadro, mas não marcam nem cancelam visitas.
      </Callout>
      </>)}

      <h3>O que o card mostra</h3>
      <Tabela cabecalho={['Tipo de tarefa', 'O que apresenta']} larguras={['175px']}>
        <tr><Key>Paciente</Key>
          <td>Operadora, nome do paciente, hospital e número de atendimento, além dos dias sem
            relatório. Quando há visita marcada, traz a data, o horário e o responsável; quando
            atrasada, o card inteiro é destacado, com a indicação de quando era.</td></tr>
        <tr><Key>Cobrança de censo</Key>
          <td>Hospital e operadora, desde quando o censo está pendente, a última atualização
            recebida e, se já houve cobrança, quando e por quem. O selo de dias sem atualizar fica{' '}
            <Chip tom="critical">Vermelho acima de 3 dias</Chip>.</td></tr>
      </Tabela>
      <p>
        Os cards de paciente trazem ainda etiquetas que explicam por que aquele caso merece atenção:
        leito de UTI, longa permanência e nunca visitado.
      </p>

      <h3>Priorizar o quadro</h3>
      <p>
        Uma barra acima das colunas recorta o quadro inteiro. Tudo é aplicado de imediato, sobre o
        que já está em tela. O significado de cada coluna aparece ao passar o mouse no{' '}
        <strong>i</strong> ao lado do título dela.
      </p>
      <Tabela cabecalho={['Controle', 'O que faz']} larguras={['185px']}>
        <tr><Key>Busca</Key>
          <td>Sempre à vista. No quadro de pacientes, localiza tarefas em todas as colunas ao mesmo
            tempo, por paciente, atendimento, leito, médico e convênio; no de censos, por hospital.
            Acentos e maiúsculas são desconsiderados.</td></tr>
        <tr><Key>Filtros</Key>
          <td>Botão que abre um painel com o <strong>hospital</strong> e, no quadro de pacientes, os
            recortes de <strong>Mostrar só</strong>: <strong>Urgentes</strong> (relatório vencido, ou
            em monitoramento sem nenhuma visita), <strong>UTI</strong>, <strong>Longa
            permanência</strong> e <strong>Nunca visitados</strong>, combináveis. Cada recorte mostra
            quantos casos alcança antes de ser marcado. No quadro de censos, o painel traz a{' '}
            <strong>operadora</strong> no lugar dos recortes.</td></tr>
        <tr><Key>Ordenar</Key>
          <td>Só no quadro de pacientes: prioridade, mais dias sem relatório, mais dias internado,
            nome do paciente ou hospital.</td></tr>
      </Tabela>
      <p>
        Os filtros ligados ficam à vista abaixo da barra, cada um com um <strong>X</strong> para
        tirá-lo, junto de <strong>quantas tarefas estão visíveis e quantas existem no
        total</strong> e da opção de limpar tudo, para o recorte nunca passar despercebido. Não há
        filtro de período: o quadro já apresenta somente os hospitais que o usuário acompanha.
      </p>
    </>
  )
}

export function ModuloUpload() {
  return (
    <>
      <h3>Objetivo</h3>
      <p>
        Receber os arquivos de censo que os hospitais enviam, em PDF, CSV ou Excel, ler
        automaticamente os pacientes, gravar as internações e altas, e dar ao usuário a chance de
        conferir e corrigir o que foi entendido antes de considerar o envio concluído.
      </p>

      <h3>Passo a passo</h3>
      <ComoFazer
        titulo="Enviar os censos do dia"
        passos={[
          { n: 1, titulo: "Escolha a operadora", corpo: <>A lista de hospitais do passo seguinte passa a mostrar só os daquela operadora.</> },
          { n: 2, titulo: "Escolha o hospital", corpo: <>Digite parte do nome. Vale para todos os arquivos do envio: censos de hospitais diferentes vão em envios separados.</> },
          { n: 3, titulo: "Arraste os arquivos para a caixa", corpo: <>Ou clique nela para escolher. PDF, CSV e Excel, vários de uma vez. Confira a lista que aparece embaixo; o <strong>X</strong> tira um arquivo que veio errado.</> },
          { n: 4, titulo: "Clique em Processar censos", corpo: <>O andamento aparece dentro da própria caixa. Não feche a página até terminar.</> },
        ]}
      >
        <Tela nome="Envio de Censos" largura={760}
          destaques={{
            '.up-passo:nth-of-type(1) .up-passo-campo': 1,
            '.up-passo:nth-of-type(2) .up-passo-campo': 2,
            '.up-passo:nth-of-type(3) .up-drop': 3,
            '.up-acoes .btn-primary': 4,
          }}
          descricao="Formulário pronto para processar. Cada passo só libera depois que o anterior é respondido.">
          <ReplicaFormularioEnvio />
        </Tela>
      </ComoFazer>

      <ComoFazer
        titulo="Conferir o resultado do envio"
        passos={[
          { n: 1, titulo: "Leia o resumo do lote", corpo: <>Hospital, quantos pacientes entraram, de que dia é o censo e, à direita, as etiquetas do que precisa de atenção.</> },
          { n: 2, titulo: "Resolva as pendências", corpo: <><strong>Completar agora</strong> abre o assistente com os pacientes que vieram com dado faltando. Cada um precisa ser gravado ou descartado: o que ficar sem decisão não entra no sistema.</> },
          { n: 3, titulo: "Abra os arquivos marcados", corpo: <>Os arquivos que pedem atenção vêm primeiro. <strong>Detalhes</strong> abre os avisos e a lista de pacientes daquele arquivo.</> },
          { n: 4, titulo: "Foi o hospital errado? Desfaça", corpo: <><strong>Desfazer envio</strong> apaga os pacientes que este envio criou. Quem já existia antes permanece, e a frase ao lado diz quantos são.</> },
        ]}
      >
        <Tela nome="Envio de Censos" largura={760}
          destaques={{
            '.up-placar': 1,
            '.up-faixa.atencao .btn': 2,
            '.up-faixa.atencao + .up-arquivo .up-detalhes': 3,
            '.up-faixa:not(.atencao) .btn': 4,
          }}
          descricao="Resultado logo depois de processar: um arquivo pede atenção e o outro foi lido sem pendências.">
          <ReplicaResultadoEnvio />
        </Tela>
      </ComoFazer>

      <ComoFazer
        titulo="Corrigir um paciente na lista de conferência"
        passos={[
          { n: 1, titulo: "Clique no alerta para saber o problema", corpo: <>O ícone antes do nome explica o que há de errado: convênio fora do cadastro, paciente de outra operadora ou sem convênio.</> },
          { n: 2, titulo: "Use o lápis para corrigir", corpo: <>Nome, atendimento, leito, convênio, operadora e datas. A correção vale para a ficha do paciente, e o alerta da linha some quando o problema é resolvido.</> },
          { n: 3, titulo: "Use a lixeira para tirar quem não deveria estar ali", corpo: <>Tira o paciente deste censo. A ficha só é apagada se ele nasceu deste envio e não consta em nenhum outro, e um aviso permite desfazer por alguns segundos.</> },
        ]}
      >
        <Tela nome="Envio de Censos" largura={820}
          destaques={{
            '.up-pac-ico-alerta': 1,
            '.up-pac-sec:first-child tbody tr:first-child .up-pac-lapis': 2,
            '.up-pac-sec:first-child tbody tr:nth-child(3) .up-pac-lixeira': 3,
          }}
          descricao="Lista de um arquivo aberto. Linhas com problema sobem para o topo da sua seção.">
          <ReplicaConferencia />
        </Tela>
      </ComoFazer>

      <h3>Fluxo do envio</h3>
      <p>
        O formulário é numerado em três passos, e cada passo só é liberado quando o anterior for
        respondido.
      </p>
      <Passos>
        <Passo titulo="De qual operadora é o censo">
          Escolhe-se a operadora primeiro. O motivo é prático: o cadastro tem uma linha por hospital
          e operadora, e uma lista única repetiria o mesmo nome de hospital várias vezes sem nada
          que os diferenciasse.
        </Passo>
        <Passo titulo="De qual hospital são estes censos">
          Campo com busca, já filtrado pela operadora escolhida. O hospital vale para todo o lote.
          Informá-lo antes do arquivo permite ao sistema usar o leitor dedicado daquele hospital, em
          vez de adivinhar a origem e perguntar depois.
        </Passo>
        <Passo titulo="Envie os arquivos">
          Área de arrastar e soltar, aceitando PDF, CSV e planilhas, vários de uma vez. Os arquivos
          ficam listados para conferência antes do envio e podem ser retirados um a um.
        </Passo>
        <Passo titulo="Processar os censos">
          O sistema lê cada arquivo e grava os pacientes. Durante o processo, a tela pede que a
          página não seja fechada.
        </Passo>
        <Passo titulo="Conferir o resultado">
          Placar do lote e um cartão por arquivo, ordenados por urgência, com a lista nominal dos
          pacientes e a data a que o censo se refere.
        </Passo>
        <Passo titulo="Corrigir e completar">
          Editar um paciente, remover quem não deveria estar ali, corrigir a operadora, ou completar
          pelo assistente os pacientes que ficaram incompletos.
        </Passo>
        <Passo titulo="Desfazer, se foi engano">
          O envio inteiro, ou apenas um arquivo do lote, pode ser revertido.
        </Passo>
      </Passos>

      <h3>Avisos do leitor</h3>
      <Tabela cabecalho={['Nível', 'Significado', 'Exemplos']} larguras={['135px']}>
        <tr><td><Chip tom="critical">Crítico</Chip></td>
          <td>Falta dado no sistema, ou o censo pode estar no hospital errado.</td>
          <td>Divergência de hospital; pacientes que o leitor não conseguiu extrair.</td></tr>
        <tr><td><Chip tom="attention">Atenção</Chip></td>
          <td>O paciente entrou, mas de forma incompleta.</td>
          <td>Sem convênio, sem número de atendimento, sem data de alta.</td></tr>
        <tr><td><Chip tom="neutral">Nota</Chip></td>
          <td>Confirmação, e não alerta.</td>
          <td>Dia sem internados; linhas repetidas desconsideradas.</td></tr>
      </Tabela>

      <h3>Situações possíveis de um arquivo</h3>
      <Tabela cabecalho={['Situação', 'O que a tela diz e oferece']} larguras={['175px']}>
        <tr><Key>Lido normalmente</Key><td>Lista de pacientes para conferência, com busca e filtro.</td></tr>
        <tr><Key>Arquivo digitalizado</Key><td>Avisa que o censo precisa ser cadastrado à mão, porque o arquivo é uma imagem e não tem texto para o sistema ler. Orienta em duas partes: agora, cadastrar pela Visão Geral; para os próximos, pedir ao hospital o PDF gerado pelo sistema dele. Não conta como erro, porque o arquivo chegou certo e quem o mandou como imagem foi o hospital.</td></tr>
        <tr><Key>Falta o hospital</Key><td>Informa qual nome o arquivo traz e que ele não está no cadastro, quantos pacientes foram lidos e que nenhum foi gravado.</td></tr>
        <tr><Key>Erro de leitura</Key><td>O layout não foi reconhecido. A tela oferece a opção de ignorar o arquivo.</td></tr>
      </Tabela>

      <h3>Lista de pacientes para conferência</h3>
      <p>
        A lista é dividida em internações e altas, com as colunas de paciente, atendimento, leito,
        convênio e data. Quando o arquivo não traz o nome dos pacientes, eles são identificados pela
        senha de autorização.
      </p>
      <p>
        Linhas com problema recebem um sinal de alerta que, ao ser acionado, informa o motivo:
        convênio fora do cadastro, paciente registrado em outra operadora ou paciente sem convênio.
        A lista dispõe de busca e de um filtro que exibe somente as linhas com alerta em aberto.
      </p>

      <h3>Assistente de complemento</h3>
      <p>
        Aberto automaticamente quando o envio deixa pendências, e reabrível a qualquer momento, o
        assistente conduz a resolução passo a passo, em duas situações.
      </p>
      <ul>
        <li><strong>Arquivos sem hospital</strong>: o hospital é escolhido entre os já cadastrados
          ou cadastrado na hora. Somente após essa definição os pacientes do arquivo são gravados.</li>
        <li><strong>Pacientes incompletos</strong>: o assistente indica os campos que faltam e
          permite gravar ou descartar cada paciente.</li>
      </ul>
      <p>Ao final, é apresentado um resumo com os arquivos resolvidos e os pacientes gravados e descartados.</p>

      <Callout tipo="caution" titulo="Pontos de atenção do assistente">
        <strong>Toda pendência exige decisão.</strong> O paciente que não for preenchido nem
        descartado não é gravado e não constará em nenhuma outra tela, pois a revisão do censo é
        feita apenas aqui.
        <br />
        <strong>O hospital novo exige operadora cadastrada.</strong> O censo pode trazer a razão
        social da seguradora, que não corresponde a nenhuma operadora existente, e o vínculo a uma
        operadora inválida deixaria o hospital sem regras de prazo.
      </Callout>

      <h3>Conferência e correções</h3>
      <Tabela cabecalho={['Ação', 'Efeito']} larguras={['185px']}>
        <tr><Key>Editar paciente</Key><td>Corrige nome, atendimento, leito, convênio, operadora, data de internação e data de alta. A alteração vale para a ficha do paciente, não só para esta tela. Escolher um convênio conhecido já traz a operadora dele junto, e só o que mudou é enviado.</td></tr>
        <tr><Key>Remover do censo</Key><td>Tira o paciente daquele censo. Só apaga a ficha de quem nasceu desse envio e não consta em nenhum outro. Confirmada a exclusão da ficha, um aviso com contagem regressiva permite desfazer a operação.</td></tr>
        <tr><Key>Corrigir a operadora</Key><td>Quando o convênio do paciente diverge da operadora escolhida, a linha é marcada e a correção é feita ali. O resumo do envio desconta a correção de imediato, e o arquivo fica sinalizado como resolvido quando não resta pendência.</td></tr>
        <tr><Key>Completar pendências</Key><td>Abre o assistente para os pacientes que o leitor entendeu parcialmente. Também é possível descartar a pendência, para o registro que não deve entrar.</td></tr>
        <tr><Key>Ignorar arquivo</Key><td>Retira um arquivo ilegível da lista e do resumo do envio. Nada é gravado, porque não há o que gravar.</td></tr>
        <tr><Key>Desfazer envio</Key><td>Reverte o lote inteiro ou apenas um arquivo dele. Apaga os pacientes que aquele envio criou; quem já existia e foi apenas atualizado permanece, e a tela avisa sobre isso. Exige confirmação, com o hospital e a quantidade no texto.</td></tr>
      </Tabela>
    </>
  )
}
