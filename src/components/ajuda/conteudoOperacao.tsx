// Conteúdo dos módulos da área de Operação: o trabalho do dia a dia.
// Cada módulo declara no catálogo a tela que documenta, e só chega a quem
// acessa essa tela.
import { Callout, Chip, Key, Metric, Metrics, Passo, Passos, SoGestao, Tabela } from './blocos'
import { ComoFazer, Tela } from './replica'
import { ACOES_NO_PAINEL, NEGOCIACAO_NO_RELATORIO } from '../../lib/recursos'
import {
  ReplicaAdicionarPaciente, ReplicaCidsPaciente, ReplicaCobranca, ReplicaConferencia, ReplicaDadosPaciente,
  ReplicaFichaRapida, ReplicaFichaRelatorioPendente, ReplicaFormularioEnvio, ReplicaModalAlta,
  ReplicaModalRelatorio, ReplicaPainel, ReplicaProrrogacaoRelatorio, ReplicaQuadro, ReplicaResultadoEnvio,
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
      <p>
        No menu, a tela aparece como <strong>Visão Geral</strong>. A seta ao lado do item abre a
        lista de operadoras: clicar numa delas abre o painel já recortado para ela, e o número ao
        lado do nome é o de pacientes dela em <strong>Sem relatório</strong>.
      </p>

      <h3>Passo a passo</h3>
      <ComoFazer
        titulo="Descobrir quem precisa de visita hoje"
        passos={[
          { n: 1, titulo: "Escolha a operadora, ou deixe todas", corpo: <>A tela abre com todas as operadoras juntas. Troque aqui para ver só uma delas, ou clique nela na lista sob <strong>Visão Geral</strong>, no menu.</> },
          { n: 2, titulo: "Clique no cartão da situação que quer atacar", corpo: <><strong>Sem Relatório</strong> e <strong>Atrasado</strong> são os mais urgentes. O cartão clicado ganha um contorno e a lista passa a mostrar só aqueles pacientes. Clique de novo para voltar a ver todos.</> },
          { n: 3, titulo: "Afine com os filtros rápidos, se precisar", corpo: <>Por exemplo, <strong>UTI / CTI</strong> para começar pelos leitos de terapia intensiva, ou{' '} <strong>Longa permanência</strong> e depois a partir de quantos dias (3, 7, 10, 15 ou 30) para ver quem está internado há mais tempo.</> },
          { n: 4, titulo: "Clique na linha do paciente", corpo: ACOES_NO_PAINEL
            ? <>Abre a ficha rápida ao lado, sem sair da lista. É ali que se registra o relatório e se agenda a visita (veja{' '} <button type="button" className="aj-link" onClick={() => irPara('ficha-do-paciente')}>Ficha do Paciente</button>).</>
            : <>Abre a ficha rápida ao lado, sem sair da lista. Para registrar o relatório, clique em <strong>Detalhes</strong>: a ficha completa tem o botão <strong>Registrar</strong> (veja{' '} <button type="button" className="aj-link" onClick={() => irPara('ficha-do-paciente')}>Ficha do Paciente</button>).</> },
        ]}
      >
        <Tela nome="Painel Operacional" largura={1120}
          descricao="Cartão Sem Relatório clicado: a lista mostra só os pacientes que já passaram do gatilho e nunca receberam visita.">
          <ReplicaPainel kpiAtivo="sem_relatorio" marcas={{ operadora: 1, kpi: 2, filtros: 3, linha: 4 }} />
        </Tela>
      </ComoFazer>

      <ComoFazer
        titulo="Encontrar um paciente específico"
        passos={[
          { n: 1, titulo: "Clique na lupa e digite", corpo: <>A lupa fica no fim dos filtros rápidos e abre o campo de busca. Vale o nome do segurado, o número de atendimento ou a senha de autorização. Não precisa digitar o nome inteiro.</> },
          { n: 2, titulo: "Quem já saiu aparece junto", corpo: <>A partir de duas letras, a busca procura também entre as altas: quem já saiu entra no fim da lista, com o selo <strong>Alta</strong> e a data da alta. Com um card de status do topo escolhido, a busca fica só nos internados.</> },
          { n: 3, titulo: "Clique na linha para abrir a ficha", corpo: <>Se nem assim aparecer, confira se a operadora e o hospital escolhidos no topo são os dele, e se não ficou ligado um período ou um filtro rápido: a busca procura só dentro da lista já recortada.</> },
        ]}
      >
        <Tela nome="Painel Operacional" largura={1120}
          descricao="Busca por “hel”: a internada vem primeiro e, no fim da lista, quem já teve alta, com o selo Alta e a data da alta.">
          <ReplicaPainel busca="hel" marcas={{ busca: 1, alta: 2, linha: 3 }} />
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
        <Tela nome="Painel Operacional" largura={1120}
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
          nota="Já no gatilho, sem nenhuma visita" />
        <Metric tom="warn" label="Atrasado" valor="Passou da janela"
          nota="Último relatório mais antigo que o prazo" />
        <Metric tom="attention" label="Próx. vencer" valor="Vence em breve"
          nota="Dentro do alerta antecipado da operadora" />
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
        <tr><Key>Operadora</Key><td>Recorta tudo para uma operadora, ou consolida todas. Também se escolhe pela lista sob <strong>Visão Geral</strong>, no menu. Com uma aberta, <strong>Ver todas as operadoras</strong> volta ao consolidado.</td></tr>
        <tr><Key>Hospital</Key><td>Restringe a uma unidade. Cada opção já mostra quantos internados e quantos alertas ela tem. Na visão consolidada, os hospitais aparecem agrupados por operadora. <strong>Limpar filtro</strong> volta a todos.</td></tr>
        <tr><Key>Período</Key><td><strong>Internação de</strong> e <strong>até</strong>: recorta a lista pela data de internação. Na lista de altas vira <strong>Alta de</strong> e recorta pela data da alta. Digite a data ou escolha no calendário; <strong>Limpar datas</strong> tira o recorte.</td></tr>
        <tr><Key>Busca</Key><td>A lupa, no fim dos filtros rápidos, abre o campo de busca. Procura por nome do segurado, número de atendimento e senha de autorização, entre os internados e também entre as altas (sem precisar ligar o filtro <strong>Altas</strong>). Esc limpa e fecha.</td></tr>
        <tr><Key>UTI / CTI</Key><td>Mantém apenas leitos de terapia intensiva.</td></tr>
        <tr><Key>Longa permanência</Key><td>Escolha a partir de quantos dias de internação: 3, 7, 10, 15 ou 30. O chip fica marcado com o corte escolhido. Clique nele para trocar, ou no x para tirar o filtro. Na lista de altas, conta os dias até a alta.</td></tr>
        <tr><Key>Prorrogados</Key><td>Mantém apenas os internados com prorrogação aprovada que ainda não terminou, inclusive as pausadas. Quem teve a prorrogação encerrada sai do filtro. Não aparece na lista de altas.</td></tr>
        <tr><Key>Pendentes de aprovação</Key><td>Mantém apenas os pacientes da lista com relatório aguardando aprovação. Na lista de internados, quem já saiu só aparece pela busca: para ver também as altas com relatório pendente, ligue <strong>Altas</strong>.</td></tr>
        <tr><Key>Altas</Key><td>Troca a base da lista para os pacientes que já saíram, em vez dos internados. A tabela vira <strong>Pacientes com Alta</strong> e ganha a coluna <strong>Alta</strong>, com a data e o motivo da alta; <strong>Dias internado</strong> vira <strong>Dias</strong>, contados até a alta.</td></tr>
        <tr><Key>Ordenação</Key><td>Padrão, mais dias sem relatório, ou mais dias internado. Na primeira opção, quem nunca teve relatório vai ao topo.</td></tr>
        <tr><Key>Limpar</Key><td>Aparece com algum filtro rápido ligado ou outra ordenação escolhida, e desfaz tudo isso de uma vez, inclusive <strong>Altas</strong>. A busca, o período e o hospital ficam como estão.</td></tr>
      </Tabela>

      <h3>Colunas da tabela</h3>
      <Tabela cabecalho={['Coluna', 'Conteúdo']} larguras={['150px']}>
        <tr><Key>Relatório</Key><td>Pastilha colorida de status, detalhada no{' '}
          <button type="button" className="aj-link" onClick={() => irPara('calculo-do-status')}>anexo de regras</button>.
          A linha do internado recebe uma faixa da mesma cor; a de quem já teve alta, não. Paciente
          com relatório esperando aprovação mostra <strong>Aguardando aprovação</strong>, mas até a
          aprovação segue contado no status de antes, e a faixa fica com a cor dele. Na busca, quem já
          teve alta aparece com o selo <strong>Alta</strong> e a data da alta embaixo.</td></tr>
        <tr><Key>Operadora</Key><td>Só na visão consolidada. Identifica a operadora do paciente.</td></tr>
        <tr><Key>Hospital</Key><td>Clicável, abre a ficha de contato do hospital sem sair da tela.</td></tr>
        <tr><Key>Segurado</Key><td>Nome do paciente. Quando o censo não traz nome, identifica por senha de autorização; na falta desta, pelo número de atendimento.</td></tr>
        <tr><Key>Atend.</Key><td>Número do atendimento.</td></tr>
        <tr><Key>Leito</Key><td>UTI, apartamento, enfermaria ou home care, abreviados como UTI, APT, ENF e HOME.</td></tr>
        <tr><Key>Internação</Key><td>Data de entrada.</td></tr>
        <tr><Key>Última visita</Key><td>Data da visita do último relatório aprovado. Relatório aguardando aprovação ainda não conta.</td></tr>
        <tr><Key>Sem relatório</Key><td>Fração de dias decorridos sobre a janela permitida. Fica vermelho quando não há relatório e laranja quando venceu. Com prorrogação aprovada em curso, a contagem dá lugar à tag <strong>Prorrogado</strong>, ou <strong>Prorrogação pausada</strong>; terminada a prorrogação, a contagem volta.</td></tr>
        <tr><Key>Dias internado</Key><td>Fração de dias sobre o gatilho de alerta.</td></tr>
        <tr><Key>Permanência</Key><td>Marcador de longa permanência com o limite real da operadora.</td></tr>
      </Tabela>

      <h3>Ações disponíveis</h3>
      <Tabela cabecalho={['Ação', 'Efeito']} larguras={['185px']}>
        <tr><Key>Clicar numa linha</Key><td>Abre a <strong>ficha rápida do paciente</strong> em painel lateral: dias internado, dias sem relatório, leito, timeline da internação{ACOES_NO_PAINEL ? ' e, para técnico, gestor e operacional, o formulário de registrar relatório' : ''}. O nome do hospital abre a ficha dele, e um relatório da timeline abre o relatório. No topo ficam <strong>Detalhes</strong>, que leva à ficha completa, e, em paciente da Porto, <strong>Formulário Porto</strong>; o analista não vê os dois nem abre os relatórios. Técnico, coordenador técnico, gestor, operacional e coordenador operacional têm ainda o botão <strong>Alta</strong>, no rodapé; em quem saiu por alta dada à mão ou automática, ele vira <strong>Desfazer alta</strong>.</td></tr>
        <tr><Key>Clicar no hospital</Key><td>Abre a ficha do hospital, com indicadores, operadoras atendidas, dados cadastrais e histórico de censos sob demanda.<SoGestao> Gestor e diretor têm ainda <strong>Abrir cadastro</strong>, que leva ao cadastro do hospital em Configurações.</SoGestao></td></tr>
        <tr><Key>Adicionar paciente</Key><td>Cadastro manual: operadora, hospital, nome, atendimento, situação (internado ou alta), data de entrada, data de alta quando for o caso e, opcionalmente, leito, especialidade e médico. Não duplica: se o atendimento já existir no hospital, avisa que o paciente não foi duplicado.</td></tr>
        <tr><Key>Exportar</Key><td>Gera a planilha de controle de auditoria. Com algum filtro ligado (card de status, hospital, busca, filtro rápido ou período), a primeira opção já vem marcada: <strong>Com os filtros do painel</strong>, só com os pacientes que a lista mostra, de todas as páginas. As outras dão a planilha inteira, sem os filtros da tela: da operadora aberta, ou de todas num único arquivo, com uma aba por hospital.</td></tr>
        <tr><Key>Atualizar</Key><td>Recarrega lista, indicadores e contagens da barra lateral. A tela também se atualiza sozinha enquanto está à vista e ao voltar para ela; ao lado do botão, <strong>Atualizado</strong> mostra a hora dos dados na tela.</td></tr>
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
        <strong>Técnico, coordenador técnico, gestor, operacional e coordenador operacional
        registram relatório</strong>; o do operacional e o do coordenador operacional só valem
        depois que um técnico, um coordenador técnico ou um gestor aprova.{' '}
        <strong>Mexer nos CIDs é do técnico, do coordenador técnico e do gestor</strong>, e
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
      </>)}

      <ComoFazer
        titulo="Registrar o relatório de uma visita"
        passos={[
          { n: 1, titulo: "Preencha o Relatório de visita e clique em OK", corpo: <>A data já vem com a de hoje. Informe quem fez a visita: o médico auditor, o enfermeiro auditor ou os dois. Um deles é obrigatório. O <strong>OK</strong> confere a seção, fecha com a marca verde <strong>Concluída</strong> e abre a seguinte.</> },
          { n: 2, titulo: "Escreva o relatório no Quadro clínico", corpo: <>O texto é obrigatório: motivo da internação, antecedentes, procedimentos, evolução e plano. Os diagnósticos são opcionais, e o CID que o paciente ainda não tem passa a constar na ficha dele. No perfil operacional os diagnósticos não aparecem: o CID fica com quem aprova.</> },
          { n: 3, titulo: "Clique em OK", corpo: <>Faltou algo? O aviso aparece no alto da seção, em cima dos campos, e ela continua aberta. Corrija e clique de novo.</> },
          { n: 4, titulo: "Abra as seções opcionais que se aplicam", corpo: <>Quadro de internação, No período e Prorrogação não são obrigatórias. Abra cada uma pela seta ao lado do título.</> },
          { n: 5, titulo: "Clique em Registrar relatório", corpo: <>Vale de qualquer ponto: se faltar algo, o aviso aparece e a seção do campo abre sozinha. No perfil operacional o botão é <strong>Enviar para aprovação</strong>, e o paciente fica como <strong>Aguardando aprovação</strong> até um técnico, coordenador técnico ou gestor aprovar.</> },
        ]}
      >
        <Tela nome="Registrar relatório" largura={900}
          destaques={{ '.rr-grupo.aberto .rr-grupo-okbtn': 3 }}
          descricao="O botão Registrar do card Relatórios abre esta janela. O Relatório de visita já foi concluído no OK, e o Quadro clínico está aberto.">
          <ReplicaModalRelatorio marcas={{ visita: 1, texto: 2, opcionais: 4, registrar: 5 }} />
        </Tela>
      </ComoFazer>

      <ComoFazer
        titulo="Prorrogar e baixar o formulário da Porto"
        passos={[
          { n: 1, titulo: "Marque Prorrogar", corpo: <>Na seção <strong>Prorrogação</strong> da janela do relatório. O primeiro período já vem começando na data final da prorrogação atual, se houver.</> },
          { n: 2, titulo: "Adicione os períodos", corpo: <>Acomodação, início e fim, e <strong>Adicionar</strong>. As diárias contam a data inicial e não a final: de 01/10 a 05/10 são 4 diárias. Para cobrar o último dia, use a acomodação <strong>Alta tardia</strong>. O período seguinte já vem começando na data final do anterior.</> },
          { n: 3, titulo: "Escolha a justificativa", corpo: <>Obrigatória, entre os motivos clínicos da lista. O complemento é livre.</> },
          { n: 4, titulo: "Paciente da Porto: gere o formulário", corpo: <><strong>Gerar PDF</strong> gera o formulário de prorrogação no modelo da Porto, já preenchido com o paciente e com o que está na janela: períodos, justificativa, negociação, procedimentos, alto custo e CIDs. Isolamento, diária da madrugada e alta tardia saem marcados pela acomodação pedida. Envie o PDF à Porto junto do pedido. Para ajustar algum campo antes, use <strong>Formulário Porto</strong>, no topo da ficha.</> },
        ]}
      >
        <Tela nome="Registrar relatório" largura={760}
          destaques={{ '.rr-bloco-tg': 1 }}
          descricao="Seção Prorrogação com dois períodos, a justificativa e o botão que baixa o formulário da Porto.">
          <ReplicaProrrogacaoRelatorio marcas={{ periodos: 2, justificativa: 3, porto: 4 }} />
        </Tela>
      </ComoFazer>
      <p>
        <strong>Formulário Porto</strong>, no topo da ficha do paciente da Porto, abre o mesmo
        formulário já preenchido com o paciente e com um relatório: por padrão, o último que pediu
        prorrogação. Para usar outro, ou só os dados do paciente, troque em{' '}
        <strong>Preencher com o relatório</strong>. Clique em qualquer campo da folha para ajustar
        e use <strong>Baixar PDF</strong>. O que se ajusta na folha não fica gravado no sistema:
        trocar o relatório ou clicar em <strong>Desfazer alterações</strong> preenche a folha de novo.
      </p>

      <ComoFazer
        titulo="Corrigir e aprovar o relatório do operacional"
        passos={[
          { n: 1, titulo: "Abra o relatório e clique em Editar", corpo: <>Pelo card em <strong>Tarefas</strong>, coluna <strong>Aguardando aprovação</strong>, ou pela ficha do paciente. Só técnico, coordenador técnico e gestor veem o botão.</> },
          { n: 2, titulo: "Corrija o que precisar", corpo: <>É a janela do registro, já com tudo o que o operacional preencheu: texto, acomodações, No período e prorrogação. Os diagnósticos o operacional não informa: quem corrige os escolhe aqui.</> },
          { n: 3, titulo: "Salvar, ou Salvar e aprovar", corpo: <><strong>Salvar</strong> grava a correção e o relatório segue em <strong>Aguardando aprovação</strong>, para editar de novo depois. <strong>Salvar e aprovar</strong> grava e libera: o relatório já vale. Ele segue com o nome de quem escreveu; quem corrigiu fica na trilha de{' '} <button type="button" className="aj-link" onClick={() => irPara('movimentacoes')}>Movimentações</button>, com o que mudou.</> },
        ]}
      >
        <>
          <Tela nome="Ficha do relatório" largura={760}
            descricao="Relatório do operacional esperando aprovação. Editar fica ao lado de Aprovar.">
            <ReplicaFichaRelatorioPendente marcas={{ editar: 1 }} />
          </Tela>
          <Tela nome="Corrigir relatório" largura={900}
            descricao="A mesma janela do registro, aberta por cima da ficha do relatório e já preenchida.">
            <ReplicaModalRelatorio corrigindo marcas={{ texto: 2, salvar: 3, registrar: 3 }} />
          </Tela>
        </>
      </ComoFazer>
      <Callout tipo="info" titulo="Quem aprova libera o relatório do operacional">
        O relatório do operacional vai para a coluna <strong>Aguardando aprovação</strong>, em
        Tarefas, e só vale depois de aprovado. No rodapé dele: <strong>Aprovar</strong> vale como
        está, e <strong>Editar</strong> abre a correção, que pode só ser salva (o relatório segue
        aguardando) ou salva e aprovada. O relatório não volta para quem escreveu. Aprovam o
        técnico, o coordenador técnico e o gestor; o relatório deles vale na hora.
      </Callout>

      <ComoFazer
        titulo="Corrigir um dado que veio errado ou faltando"
        passos={[
          { n: 1, titulo: "Veja o que falta", corpo: <>O aviso amarelo diz quais campos importantes o censo não trouxe. Eles também ficam destacados na grade.</> },
          { n: 2, titulo: "Clique em Editar", corpo: <>Chega-se à ficha completa pelo botão <strong>Detalhes</strong> da ficha rápida.</> },
          { n: 3, titulo: "Corrija ou complete os campos", corpo: <>O destaque amarelo some assim que o campo é preenchido.</> },
          { n: 4, titulo: "Clique em Salvar", corpo: <>Trocar o tipo de leito ou o leito gera na timeline o card <strong>Mudança de acomodação</strong> ou <strong>Mudança de leito</strong>, com o seu nome. As demais alterações não entram na timeline: ficam na trilha de{' '} <button type="button" className="aj-link" onClick={() => irPara('movimentacoes')}>Movimentações</button>. <strong>Cancelar</strong> descarta tudo o que foi digitado.</> },
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
          { n: 2, titulo: "Escolha o motivo da alta", corpo: <>Obrigatório: alta médica, homecare, transferência, óbito, a pedido, evasão, administrativa ou outro. Com o motivo <strong>Homecare</strong>, a janela pede também as perguntas de home care, descritas em Relatórios, mais abaixo.</> },
          { n: 3, titulo: "Informe a data da alta", corpo: <>Obrigatória. Vai da data de internação até hoje.</> },
          { n: 4, titulo: "Informe o horário, se souber", corpo: <>Opcional.</> },
          { n: 5, titulo: "Clique em Confirmar alta", corpo: <>O botão só libera com o motivo e a data. O paciente sai da lista de internados e passa a constar nas altas. Se havia visita agendada, ela é cancelada. A alta fica registrada na timeline, com o seu nome e o motivo.</> },
        ]}
      >
        <Tela nome="Ficha rápida do paciente" largura={640}
          descricao="O botão Alta fica no rodapé, longe das ações de relatório.">
          <ReplicaFichaRapida esconderRelatorio esconderAgenda marcas={{ alta: 1 }} />
        </Tela>
        <Tela nome="Alta" largura={520} descricao="A janela de alta, com o motivo, a data e o horário preenchidos.">
          <ReplicaModalAlta marcas={{ motivo: 2, data: 3, hora: 4, confirmar: 5 }} />
        </Tela>
      </ComoFazer>
      <Callout tipo="info" titulo="Quem dá alta, e como desfazer">
        Técnico, coordenador técnico, gestor, operacional e coordenador operacional. Deu alta por
        engano? No mesmo lugar aparece{' '}
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
      <Callout tipo="info" titulo="Só técnico, coordenador técnico e gestor adicionam e removem CID">
        Os demais perfis veem o card quando o paciente tem algum CID. Ao registrar um relatório, ou
        ao corrigir e aprovar o do operacional, eles também podem informar um CID novo, que entra
        junto na lista do paciente.
      </Callout>

      {/* Agendar visita está oculto (lib/recursos): sem ele, não há passo a
          passo de visita futura em Tarefas. */}
      {ACOES_NO_PAINEL && (
      <p>
        Para marcar uma visita futura, veja o passo a passo em{' '}
        <button type="button" className="aj-link" onClick={() => irPara('tarefas')}>Tarefas</button>.
      </p>
      )}

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
        <tr><Key>RN</Key><td><Chip tom="neutral" plain>Não</Chip></td><td>Recém-nascido. O sistema marca quando o nome traz RN (como "RN de Maria"), quando a idade é de até 28 dias ou quando a data de nascimento é de até 28 dias antes da internação.</td></tr>
        <tr><Key>Data de nascimento</Key><td><Chip tom="neutral" plain>Não</Chip></td><td>Quando o censo a informa.</td></tr>
        <tr><Key>Atendimento</Key><td><Chip tom="positive" plain>Sim</Chip></td><td>Número do atendimento no hospital.</td></tr>
        <tr><Key>Operadora / convênio</Key><td><Chip tom="neutral" plain>Não</Chip></td><td>O convênio como o censo trouxe, que diz a modalidade do plano. A correção é feita na conferência do envio.</td></tr>
        <tr><Key>Tipo de leito</Key><td><Chip tom="positive" plain>Sim</Chip></td><td>Define o gatilho aplicado ao paciente.</td></tr>
        <tr><Key>Leito e código</Key><td><Chip tom="positive" plain>Sim</Chip></td><td></td></tr>
        <tr><Key>Data de internação</Key><td><Chip tom="positive" plain>Sim</Chip></td><td>Base de todo o cálculo de dias.</td></tr>
        <tr><Key>Hora de internação</Key><td><Chip tom="neutral" plain>Não</Chip></td><td>Quando o censo a informa.</td></tr>
        <tr><Key>Data de alta</Key><td><Chip tom="neutral" plain>Não</Chip></td><td>Indica que o paciente permanece enquanto a internação está ativa.</td></tr>
        <tr><Key>Motivo da alta</Key><td><Chip tom="neutral" plain>Não</Chip></td><td>O escolhido na alta dada à mão. A alta que veio no censo e a automática ficam sem motivo.</td></tr>
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
        Cada uma reduz e expande pela seta ao lado do título. As seções vêm na ordem de
        preenchimento: primeiro as que têm campo obrigatório (Relatório de visita e Quadro
        clínico), depois as opcionais.
      </p>
      <ul>
        <li><strong>Relatório de visita</strong>: a data, obrigatória e já com a data de hoje, e quem
          fez a visita: o médico auditor, o enfermeiro auditor ou os dois. Um deles é obrigatório. O
          que foi analisado vai no texto do relatório, no Quadro clínico.</li>
        <li><strong>Quadro clínico</strong>: diagnóstico principal e secundário, opcionais, e o
          texto do relatório, obrigatório. O CID que o paciente ainda não tem passa a constar na
          ficha dele.</li>
        <li><strong>Quadro de internação</strong>: caráter (urgência ou eletivo), tipo de
          internação e as acomodações utilizadas, com entrada e saída. Elas vêm do censo e das
          trocas já registradas, e a janela mostra onde o paciente está. Para cada troca que
          faltar, como a ida para a UTI e a volta para o quarto, use{' '}
          <strong>Adicionar movimentação</strong> e escolha a nova acomodação e a data: quando o
          relatório passa a valer, ela entra na timeline como <strong>Mudança de acomodação</strong>.
          Sem nenhuma acomodação conhecida, preencha a acomodação e a entrada; a saída em branco
          fica como <strong>Atual</strong>, a acomodação em que o paciente está.</li>
        <li><strong>No período</strong>: procedimentos realizados, medicação de alto custo, evento
          adverso e negociações (a troca de acomodação, antes chamada de folha rosa). Quando o
          relatório com negociação passa a valer, a timeline ganha o evento{' '}
          <strong>Troca de acomodação</strong>.</li>
        <li><strong>Prorrogação</strong>: marque <strong>Prorrogar</strong>, adicione os
          períodos (acomodação, início e fim) e escolha a justificativa. As diárias contam a data
          inicial e não a final (01/10 a 05/10 são 4 diárias); o último dia, quando cobrado, entra
          como <strong>Alta tardia</strong>. O período seguinte já vem começando na data final do
          anterior. Para paciente da Porto, <strong>Gerar PDF</strong>, no fim da seção, gera o
          formulário de prorrogação dela em PDF, já preenchido, para enviar junto do pedido. Depois
          que a prorrogação vale, o operacional e o coordenador operacional pausam e retomam pelo
          botão <strong>Pausar prorrogação</strong> (pausada, ele vira{' '}
          <strong>Retomar prorrogação</strong>), no topo da ficha. Enquanto ela vale, o subtítulo
          da ficha mostra <strong>Prorrogado até</strong> e a data final, com{' '}
          <strong>(pausada)</strong> quando for o caso; passada a data, mostra{' '}
          <strong>Prorrogação terminou em</strong>.</li>
{NEGOCIACAO_NO_RELATORIO && (
        <li><strong>Negociação com o hospital</strong>: glosa de diárias, medicação negada,
          procedimento negado e troca de procedimento.</li>
        )}
      </ul>
      <p>
        Ao terminar uma seção, clique em <strong>OK</strong>, no fim dela: os campos daquela seção são
        conferidos, ela fecha com a marca verde <strong>Concluída</strong> ao lado do título, e a
        seguinte abre. Se faltar algo, o aviso aparece no alto da seção, em cima dos campos, e ela
        continua aberta.{' '}
        <strong>Registrar relatório</strong> continua valendo
        de qualquer ponto. A prorrogação e os blocos de <strong>No período</strong>
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
        data e hora, autor, médico responsável, os CIDs informados, um resumo do que foi marcado e,
        quando há documento anexado, o nome dele. Prorrogação e negociação valem quando o
        relatório é aprovado. Clicar num relatório abre a ficha dele, só para leitura, com o que
        foi preenchido em cada seção, na mesma ordem da janela de registro (as negociações saem
        numa seção própria, <strong>Negociação com o hospital</strong>, no fim), e o botão{' '}
        <strong>Baixar</strong> do documento. Quando o relatório pede prorrogação, a seção{' '}
        <strong>Prorrogação</strong> traz <strong>Gerar relatório</strong>: a opção{' '}
        <strong>Relatório para Porto Seguro</strong> baixa o formulário de prorrogação da Porto em
        PDF, no modelo dela, já preenchido com o paciente e com esse relatório. No relatório pendente, o rodapé da ficha traz as
        ações de quem aprova. <strong>Imprimir ou PDF</strong>, no rodapé, abre a folha do
        relatório com a identificação do paciente no topo (hospital, atendimento, convênio e
        internação); o botão <strong>Imprimir ou salvar em PDF</strong> manda só a folha para a
        impressora, ou para um PDF. Ao lado dele fica o mesmo <strong>Gerar relatório</strong>, que
        usa o relatório escolhido ou, com todos, o último que pediu prorrogação. Para imprimir a internação inteira, use{' '}
        <strong>Imprimir / PDF</strong>, no topo da ficha do paciente: saem os dados do paciente e
        todos os relatórios, ou só o escolhido em <strong>O que imprimir</strong>. Sem relatório
        ainda, sai a folha com os dados do paciente.
      </p>

      <h3>Timeline</h3>
      <p>
        Histórico completo da internação, do mais recente para o mais antigo, com o marco de hoje no
        topo. Registra admissão, relatórios externos, pareceres internos, mudanças de status, altas
        automáticas, altas dadas à mão e desfeitas, visitas agendadas e canceladas e pendências.
        As edições da ficha não entram, salvo a troca de acomodação ou de leito, logo abaixo: elas
        ficam na trilha de Movimentações. Relatórios internos exibem o autor; os externos,
        o médico responsável. Clicar num relatório (ou numa troca de acomodação) abre a ficha do
        relatório. Quando o censo mostra o paciente noutra acomodação, entra o card{' '}
        <strong>Mudança de acomodação</strong>, no dia do censo, dizendo de onde ele saiu e para
        onde foi. Trocar o tipo de leito pelo <strong>Editar</strong> da ficha gera o mesmo card, com
        o nome de quem editou; trocar só o leito gera <strong>Mudança de leito</strong>.
      </p>
      <p>
        Quando o paciente teve outra internação, noutro hospital ou no mesmo, ela entra junto na
        timeline, com o nome do hospital, e o card ganha o selo com o número de internações. Na
        admissão dela, <strong>Abrir esta internação</strong> leva à ficha de lá; de um hospital
        fora do seu escopo, aparecem só a entrada e a alta. A timeline marca ainda a{' '}
        <strong>Troca de hospital</strong>, quando ele passa a ser atendido noutro hospital, e a{' '}
        <strong>Internação simultânea</strong>, quando uma internação começa com a de outro
        hospital ainda aberta: confira se houve transferência.
      </p>
      <Callout tipo="info" titulo="Internações da mesma pessoa">
        O sistema junta sozinho as internações quando batem dois destes: carteirinha, nome e
        nascimento. Quando só o nome bate, ele pergunta: o aviso <strong>Possível mesmo paciente</strong>, no
        topo da ficha, traz <strong>É o mesmo</strong>, que junta as duas, e{' '}
        <strong>Não é</strong>, que descarta a sugestão. Juntou errado? <strong>Não é este
        paciente</strong>, na admissão da outra internação, tira-a da timeline sem apagar nada. Se
        a pessoa tem uma internação mais nova, o aviso do topo diz onde, com{' '}
        <strong>Abrir</strong>. Respondem e desfazem técnico, coordenador técnico, gestor,
        operacional e coordenador operacional.
      </Callout>
    </>
  )
}

export function ModuloKanban({ irPara }: Props) {
  return (
    <>
      <h3>Objetivo</h3>
      <p>
        Reunir as pendências da equipe em um quadro único, separadas por tipo: pacientes que
        precisam de relatório, visitas já marcadas, visitas cujo horário passou, relatórios
        aguardando aprovação e hospitais que não enviaram o censo. No topo ficam ainda as
        pendências que o gestor ou um coordenador pediu a alguém da equipe.
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
          descricao="Quadro de censos do perfil operacional. O card é por hospital e operadora, não por paciente.">
          <ReplicaCobranca marcas={{ card: 1, retorno: 2 }} />
        </Tela>
      </ComoFazer>

      <h3>Como o quadro funciona</h3>
      <p>
        O quadro é dividido em colunas, e <strong>cada coluna reúne um tipo de pendência</strong>.
        Uma tarefa permanece na sua coluna até ser resolvida, e então deixa o quadro. As colunas não
        são fases de um mesmo item: indicam o tipo de providência necessária.
        {ACOES_NO_PAINEL ? ' A exceção é o agendamento, que de fato move o card, conforme descrito adiante.' : ''}
      </p>

      <h3>As colunas de pacientes</h3>
      <Tabela cabecalho={['Coluna', 'O que reúne', 'Como a tarefa é resolvida']} larguras={['160px', undefined, '215px']}>
        <tr><Key>Sem relatório</Key>
          <td>Internados sem relatório, com o relatório vencido ou com a prorrogação terminada, e sem visita marcada.</td>
          <td>{ACOES_NO_PAINEL ? 'Marcando a visita ou registrando o relatório.' : 'Registrando o relatório.'}</td></tr>
        <tr><Key>Aguardando visita</Key>
          <td>Pacientes com visita marcada, ainda dentro do prazo.</td>
          <td>Registrando o relatório depois da visita.</td></tr>
        <tr><Key>Visitas atrasadas</Key>
          <td>Visitas cujo horário combinado já passou sem que o relatório fosse registrado.</td>
          <td>{ACOES_NO_PAINEL
            ? 'Cobrando o auditor responsável, e registrando o relatório ou remarcando a visita.'
            : 'Cobrando o auditor responsável e registrando o relatório.'}</td></tr>
      </Tabela>

      <h3>A coluna de aprovação</h3>
      <p>
        No mesmo quadro de pacientes, à direita da fila. O relatório que o operacional ou o
        coordenador operacional registra chega aqui para o técnico, o coordenador técnico ou o
        gestor conferir. Enquanto
        espera, o paciente aparece como <strong>Aguardando aprovação</strong> e não conta como
        visitado. Aprovado, o paciente sai do quadro e volta para <strong>Sem relatório</strong>{' '}
        quando o relatório vencer.
      </p>
      <Tabela cabecalho={['Coluna', 'O que reúne', 'O que fazer']} larguras={['160px', undefined, '215px']}>
        <tr><Key>Aguardando aprovação</Key>
          <td>Relatórios enviados pelo operacional e pelo coordenador operacional: paciente, visita, quem enviou, a prorrogação pedida e se há documento anexado.</td>
          <td>Técnico, coordenador técnico ou gestor: clique no card. A ficha do paciente abre com o relatório, e Editar e Aprovar ficam no rodapé dele. Na edição, Salvar deixa o relatório aqui; Salvar e aprovar libera.</td></tr>
      </Tabela>

      <h3>Pendências</h3>
      <p>
        Além das demandas que vêm do censo, o gestor e os coordenadores podem pedir algo a alguém
        da equipe: um paciente para olhar, um e-mail urgente, uma tarefa específica. O coordenador
        pede a quem é do grupo dele, inclusive a si mesmo. O pedido
        aparece no painel <strong>Pendências</strong>, no topo de Tarefas, com o paciente, os
        detalhes e o prazo (em vermelho quando venceu). Feito o que foi pedido, use{' '}
        <strong>Concluir</strong>: a pendência sai da lista. Quem pediu acompanha em{' '}
        <strong>Que você pediu</strong>, onde também pode concluir o pedido ou excluí-lo, se foi
        feito por engano. Para pedir, use{' '}
        <strong>Nova pendência</strong>, no mesmo painel, ou o painel da pessoa na Distribuição de
        tarefas.
        <SoGestao> O gestor conclui e exclui a pendência de qualquer pessoa, pelo painel dela na
        Distribuição de tarefas.</SoGestao>
      </p>

      <h3>Pacientes em prorrogação</h3>
      <p>
        A prorrogação é pedida ao registrar o relatório na ficha <strong>Detalhes</strong> do
        paciente: marque <strong>Prorrogar</strong>, informe os períodos por acomodação e
        escolha a justificativa. Ela vale quando o relatório é aprovado e não muda o prazo do
        próximo relatório. No quadro de pacientes, o card do paciente prorrogado mostra{' '}
        <strong>Prorrogado até</strong> a data final, <strong>Prorrogação termina hoje</strong> no
        último dia ou <strong>Prorrogação pausada</strong>.
        Para ver só quem está em prorrogação, use o filtro <strong>Prorrogados</strong> do
        Painel Operacional. Passada a data final, o paciente volta para{' '}
        <strong>Sem relatório</strong>, com a etiqueta <strong>Prorrogação terminou em</strong> e a
        data. O operacional e o coordenador operacional podem{' '}
        <strong>Pausar prorrogação</strong> e <strong>Retomar prorrogação</strong> na ficha do
        paciente.
      </p>

      <h3>As colunas de censos</h3>
      <p>
        Cada hospital aparece uma vez por operadora que atende, pela data do último censo daquela
        operadora: as operadoras do cadastro dele, mesmo sem paciente internado, e a de qualquer
        paciente internado ali. A operadora dispensada de censo naquele hospital não aparece. O
        censo da Porto chegar não conta para a Bradesco do mesmo hospital. O operacional recebe os censos de todas as operadoras dos hospitais dele, e os
        da operadora dele ficam no topo de cada coluna. O de outra operadora sai do quadro dele
        quando fica atualizado. O card muda de coluna sozinho quando o
        censo chega, e o filtro de operadora mostra só os censos de uma delas. Clicar no card abre a timeline dos últimos 15 dias,
        com as anotações e os censos recebidos, e o contato do hospital. Ali,{' '}
        <strong>Nova anotação</strong> registra uma conversa sem mover o card (ligou e ninguém
        atendeu, por exemplo), e <strong>Ficha do hospital</strong> mostra os dados dele. Toda mudança
        de coluna feita à mão pede uma anotação do que aconteceu, menos desfazer a atualização, que
        não pede: para o operacional, vira um pedido que um coordenador ou o gestor aprova ou recusa
        na Distribuição de tarefas, e até a decisão o card mostra{' '}
        <strong>Desfazer aguardando aprovação</strong>. Os coordenadores<SoGestao> e o
        gestor</SoGestao> desfazem na hora, sem pedido.
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
          <td>Nada. O hospital está em dia. Marcou como atualizado por engano? Desfazer, que espera a aprovação de um coordenador ou do gestor (quem aprova desfaz na hora).</td></tr>
      </Tabela>

      <h3>O que cada perfil vê</h3>
      <p>
        As colunas seguem a divisão de responsabilidades: cada perfil recebe a fila que é dele, e
        não o quadro inteiro.
      </p>
      <ul>
        <li>O perfil <strong>técnico</strong> vê as colunas de pacientes, que são a agenda de
          visitas dele, e a de aprovação, sem a cobrança de censo.</li>
        <li>O perfil <strong>operacional</strong> vê as colunas de censos, que são a
          providência dele junto aos hospitais. Na aba <strong>Pacientes</strong>, vê a coluna{' '}
          <strong>Sem relatório</strong> e a de aprovação.</li>
        <li>Os coordenadores também trabalham no quadro: o <strong>coordenador técnico</strong>{' '}
          recebe as colunas do técnico, e o <strong>coordenador operacional</strong>, as do
          operacional, com as mesmas abas.</li>
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
          <td>Operadora, nome do paciente, hospital, tipo e código do leito, além dos dias sem
            relatório. Quando há visita marcada, traz a data, o horário e o responsável; quando
            atrasada, o card inteiro é destacado, com a indicação de quando era. Atendimento, tempo
            internado, médico, convênio e os demais dados ficam em <strong>Mais detalhes</strong>,
            que abre dentro do próprio card.</td></tr>
        <tr><Key>Aprovação</Key>
          <td>Paciente, hospital, data da visita e quem enviou. Etiquetas mostram as diárias de
            prorrogação pedidas, se o paciente já está prorrogado e <strong>Com documento</strong>{' '}
            quando há anexo.</td></tr>
        <tr><Key>Cobrança de censo</Key>
          <td>Hospital e operadora, desde quando o censo está pendente, a última atualização
            recebida e, se já houve cobrança, quando e por quem. O selo de dias sem atualizar fica{' '}
            <Chip tom="critical">Vermelho acima de 3 dias</Chip>.</td></tr>
      </Tabela>
      <p>
        Os cards de paciente trazem ainda etiquetas que explicam por que aquele caso merece atenção:
        longa permanência, nunca visitado e a situação da prorrogação. O leito de UTI aparece no
        tipo do leito, ao lado do código.
      </p>
      <p>
        Todo card mostra, em bolinhas com as iniciais, <strong>quem responde por ele</strong>: as
        pessoas da equipe que têm aquele hospital na área definida na Distribuição de tarefas (no
        operacional, a operadora dele naquele hospital). Azul é o grupo técnico, verde o
        operacional, e clicar nas bolinhas mostra o nome, o cargo e o e-mail de cada um. Em Sem
        relatório entram os dois grupos; nas visitas e na aprovação, o técnico; nos censos, o
        operacional. <strong>Sem responsável</strong> indica um hospital que ninguém cobre.
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
            quantos casos alcança antes de ser marcado. No quadro de censos, o painel traz, no lugar
            dos recortes, a <strong>operadora</strong> e <strong>Sem atualizar há</strong> (de em dia
            a mais de 30 dias, ou nunca enviou), uma opção de cada, também com a contagem.</td></tr>
        <tr><Key>Ordenar</Key>
          <td>No quadro de pacientes: prioridade, mais dias sem relatório, mais dias internado,
            nome do paciente ou hospital. No de censos: mais urgentes, atualização mais recente,
            atualização mais antiga ou hospital.</td></tr>
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
          { n: 1, titulo: "Escolha a operadora", corpo: <>A lista de hospitais do passo seguinte passa a mostrar só os daquela operadora. Ela também define qual censo do hospital é dado como recebido em Tarefas.</> },
          { n: 2, titulo: "Escolha o hospital", corpo: <>Digite parte do nome. Vale para todos os arquivos do envio: censos de hospitais diferentes vão em envios separados.</> },
          { n: 3, titulo: "Arraste os arquivos para a caixa", corpo: <>Ou clique nela para escolher. PDF, CSV e Excel, vários de uma vez, até 25 MB cada. Confira a lista que aparece embaixo; o <strong>X</strong> tira um arquivo que veio errado, e <strong>Limpar arquivos</strong> tira todos.</> },
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
          { n: 2, titulo: "Resolva as pendências", corpo: <>O assistente abre sozinho quando há pacientes que vieram com dado faltando; fechado, <strong>Completar agora</strong> o reabre. Cada um precisa ser gravado ou descartado: o que ficar sem decisão não entra no sistema.</> },
          { n: 3, titulo: "Abra os arquivos marcados", corpo: <>Os arquivos que pedem atenção vêm primeiro. <strong>Detalhes</strong> abre os avisos e a lista de pacientes daquele arquivo. Cada aviso pode ser dispensado no <strong>X</strong> depois de lido.</> },
          { n: 4, titulo: "Foi o hospital errado? Desfaça", corpo: <><strong>Desfazer envio</strong> apaga os pacientes que este envio criou. Quem já existia antes permanece, e a frase ao lado diz quantos são. O botão só aparece quando o envio criou algum paciente.</> },
        ]}
      >
        <Tela nome="Envio de Censos" largura={760}
          destaques={{
            '.up-placar': 1,
            '.up-faixa.atencao .btn': 2,
            '.up-faixa.atencao + .up-arquivo .up-detalhes': 3,
            '.up-faixa:not(.atencao) .btn': 4,
          }}
          descricao="Resultado com o assistente já fechado: um arquivo pede atenção e o outro foi lido sem pendências.">
          <ReplicaResultadoEnvio />
        </Tela>
      </ComoFazer>

      <Callout tipo="caution" titulo="Sinais de que o censo foi para o hospital errado">
        <strong>Paciente que já existia em outro hospital.</strong> Quando o envio cria pacientes
        que o sistema já tinha em outro hospital, o arquivo traz um aviso crítico com o nome desse
        hospital e dos pacientes, e o botão <strong>Desfazer este arquivo</strong>. Se o arquivo
        não é do hospital escolhido, desfaça e envie de novo no hospital certo.
        <br />
        <strong>A tela lembra o último envio.</strong> Operadora e hospital continuam escolhidos
        depois de processar e mesmo ao recarregar a página. Antes de soltar o arquivo seguinte,
        confira se o passo 2 é o hospital dele.
      </Callout>

      <ComoFazer
        titulo="Corrigir um paciente na lista de conferência"
        passos={[
          { n: 1, titulo: "Clique no alerta para saber o problema", corpo: <>O ícone antes do nome explica o que há de errado: convênio fora do cadastro ou paciente sem convênio.</> },
          { n: 2, titulo: "Use o lápis para corrigir", corpo: <>Nome, atendimento, carteirinha, leito, convênio, operadora e datas. A correção vale para a ficha do paciente, e o alerta da linha some quando o problema é resolvido.</> },
        ]}
      >
        <Tela nome="Envio de Censos" largura={820}
          destaques={{
            '.up-pac-ico-alerta': 1,
            '.up-pac-sec:first-child tbody tr:first-child .up-pac-lapis': 2,
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
          que os diferenciasse. A escolha também vale como dado: o censo conta como recebido para
          essa operadora no quadro de Tarefas, mesmo sem nenhum paciente dela, e quem vier com
          convênio não reconhecido entra nela. Os demais entram na operadora do próprio convênio.
        </Passo>
        <Passo titulo="De qual hospital são estes censos">
          Campo com busca, já filtrado pela operadora escolhida. O hospital vale para todo o lote.
          Informá-lo antes do arquivo permite ao sistema usar o leitor dedicado daquele hospital, em
          vez de adivinhar a origem e perguntar depois.
        </Passo>
        <Passo titulo="Envie os arquivos">
          Área de arrastar e soltar, aceitando PDF, CSV e planilhas, vários de uma vez, até 25 MB
          cada. Os arquivos ficam listados para conferência antes do envio e podem ser retirados um
          a um.
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
          Editar um paciente, corrigir a operadora, ou completar pelo assistente os pacientes que
          ficaram incompletos.
        </Passo>
        <Passo titulo="Desfazer, se foi engano">
          O envio inteiro, ou apenas um arquivo do lote, pode ser revertido.
        </Passo>
      </Passos>

      <Callout tipo="rule" titulo="Alta automática">
        Um censo de internados que cobre a maior parte dos pacientes do hospital também dá alta a
        quem deixou de constar nele, com a data do último dia em que o paciente constou. Não
        acontece com arquivo só de altas, sem data ou que cobre um período. <strong>Desfazer
        envio</strong> não reverte essa alta: ela se desfaz sozinha se o paciente reaparecer num
        censo seguinte, ou pelo <strong>Desfazer alta</strong> da ficha.
      </Callout>

      <h3>Avisos do leitor</h3>
      <Tabela cabecalho={['Nível', 'Significado', 'Exemplos']} larguras={['135px']}>
        <tr><td><Chip tom="critical">Crítico</Chip></td>
          <td>Falta dado no sistema, ou o censo pode estar no hospital errado.</td>
          <td>Paciente que já existia em outro hospital; pacientes que o leitor não conseguiu extrair.</td></tr>
        <tr><td><Chip tom="attention">Atenção</Chip></td>
          <td>O paciente entrou, mas de forma incompleta, ou há algo a conferir.</td>
          <td>Sem convênio, sem número de atendimento, sem data de alta; hospital indicado no arquivo diferente do escolhido, que muitas vezes é só a razão social do hospital.</td></tr>
        <tr><td><Chip tom="neutral">Nota</Chip></td>
          <td>Confirmação, e não alerta.</td>
          <td>Dia sem internados; linhas repetidas desconsideradas; paciente que já tinha alta e continua como estava.</td></tr>
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
        A lista é dividida em internações e altas, com as colunas de paciente, atendimento,
        carteirinha, senha, leito, convênio e data. Quando o arquivo não traz o nome dos pacientes,
        eles são identificados pela senha de autorização.
      </p>
      <p>
        Clicar na linha abre a ficha do censo daquele paciente, com tudo o que o arquivo trouxe:
        nome, operadora, senha, carteirinha, data de nascimento, internação e alta com o horário,
        acomodação, leito, médico assistente e diagnóstico. O que o hospital não informou aparece
        como <strong>Não veio no censo</strong>, porque saber que o dado faltou também é conferir.
      </p>
      <p>
        Linhas com problema recebem um sinal de alerta que, ao ser acionado, informa o motivo:
        convênio fora do cadastro ou paciente sem convênio. A lupa no cabeçalho do arquivo busca por
        nome, atendimento, carteirinha ou senha. Os links dos avisos (<strong>ver na lista</strong>,{' '}
        <strong>ver quem são</strong>) recortam a lista em quem tem alerta em aberto, e{' '}
        <strong>Ver todos</strong> volta à lista inteira.
      </p>
      <p>
        <strong>Censo misto.</strong> Quando o arquivo traz pacientes de mais de uma operadora, a
        lista ganha abas: <strong>Todos</strong> e uma por operadora, cada uma com a sua contagem, e
        um anel marca a operadora escolhida no envio. Cada paciente entra na operadora do próprio
        convênio, que é o certo; as abas servem para conferir cada grupo contra o PDF.
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
        <tr><Key>Editar paciente</Key><td>Corrige nome, atendimento, carteirinha, leito, convênio, operadora, data de internação e data de alta. A alteração vale para a ficha do paciente, não só para esta tela. Escolher um convênio conhecido já traz a operadora dele junto, e só o que mudou é enviado. Aberto numa linha marcada, o modal traz <strong>Salvar e próximo</strong>, que segue para o próximo paciente com alerta sem voltar à lista.<SoGestao> O diretor pode ainda cadastrar ali um convênio novo, que passa a valer para todos.</SoGestao></td></tr>
        <tr><Key>Tirar do censo</Key><td>Quem não deveria estar no censo é retirado pelo suporte. Peça por um chamado, em <strong>Abrir chamado</strong>, no fim deste módulo.</td></tr>
        <tr><Key>Corrigir a operadora</Key><td>Pelo lápis, no campo Operadora: no censo misto, o paciente muda de aba na hora. Corrigir um convênio não reconhecido baixa o aviso do resumo do envio, e o arquivo fica sinalizado como resolvido quando não resta pendência. Quem já existe em outra operadora continua nela, porque nenhum censo troca a seguradora de quem já está no sistema; o aviso do arquivo lista esses casos, e a troca, se for o certo, também é feita pelo lápis.</td></tr>
        <tr><Key>Completar pendências</Key><td>Abre o assistente para os pacientes que o leitor entendeu parcialmente. Também é possível descartar a pendência, para o registro que não deve entrar.</td></tr>
        <tr><Key>Ignorar arquivo</Key><td>Retira um arquivo ilegível da lista e do resumo do envio. Nada é gravado, porque não há o que gravar.</td></tr>
        <tr><Key>Desfazer envio</Key><td>Reverte o lote inteiro ou apenas um arquivo dele. Apaga os pacientes que aquele envio criou; quem já existia e foi apenas atualizado permanece, com os dados que este censo trouxe, e a tela avisa sobre isso. A alta automática dada pelo envio também fica. Só aparece quando o envio criou algum paciente, e exige confirmação, com o hospital e a quantidade no texto.</td></tr>
      </Tabela>
    </>
  )
}
