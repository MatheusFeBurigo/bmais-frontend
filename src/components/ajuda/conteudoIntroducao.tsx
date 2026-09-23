// Conteúdo dos módulos de introdução: o que é a plataforma e quem acessa o quê.
// Transversais — valem para todos os papéis.
import { Callout, Chip, Key, Metric, Metrics, Nao, Sim, Tabela } from './blocos'

interface Props {
  irPara: (id: string) => void
}

export function ModuloVisao({ irPara }: Props) {
  const Link = ({ para, children }: { para: string; children: string }) => (
    <button type="button" className="aj-link" onClick={() => irPara(para)}>{children}</button>
  )
  return (
    <>
      <p>
        O BMais Intelligence System é um sistema destinado ao <strong>recebimento dos censos
        enviados pelos hospitais e ao acompanhamento da auditoria dos pacientes internados</strong>.
        Os arquivos de censo são submetidos à plataforma, que interpreta os pacientes
        automaticamente, calcula as exigências aplicáveis a cada um conforme as regras da operadora
        e indica quem requer visita do auditor.
      </p>
      <p>
        O acompanhamento passa a ser centralizado, dispensando o controle de prazos em planilhas
        avulsas: a plataforma consolida quem está internado em cada hospital, o que está devido de
        cada paciente e o que já foi registrado.
      </p>

      <h3>O que a plataforma controla</h3>
      <Metrics>
        <Metric tom="brand" label="Quem está internado" valor="A carteira de pacientes"
          nota="Alimentada diariamente pelos censos que os hospitais enviam" />
        <Metric tom="attention" label="O que é devido" valor="Os prazos de auditoria"
          nota="Calculados a partir das regras de cada operadora" />
        <Metric tom="positive" label="O que foi feito" valor="Os relatórios de visita"
          nota="Registrados pelos auditores, com documento e parecer" />
        <Metric tom="neutral" label="Como vai o serviço" valor="Indicadores e trilha"
          nota="Nível de serviço, permanência e histórico de cada ação" />
      </Metrics>

      <h3>Como o sistema é organizado</h3>
      <p>
        As telas distribuem-se em quatro áreas, conforme a organização apresentada no menu lateral.
        Cada pessoa enxerga apenas as áreas compatíveis com o seu perfil de acesso, de modo que a
        lista abaixo descreve a plataforma inteira, e não necessariamente o seu menu.
      </p>
      <Tabela cabecalho={['Área', 'Telas', 'A que serve']} larguras={['150px', '210px']}>
        <tr>
          <Key>Operação</Key>
          <td>
            <Link para="operacional">Painel Operacional</Link>,{' '}
            <Link para="paciente">Ficha do Paciente</Link>,{' '}
            <Link para="kanban">Quadro de Tarefas</Link>,{' '}
            <Link para="upload">Envio de Censos</Link>
          </td>
          <td>O trabalho do dia a dia: receber os censos dos hospitais, saber quem precisa de
            visita e registrar o que foi auditado.</td>
        </tr>
        <tr>
          <Key>Gestão</Key>
          <td>
            <Link para="diretoria">Dashboard da Diretoria</Link>,{' '}
            <Link para="gestor">Painel do Gestor</Link>,{' '}
            <Link para="volumetria">Volumetria</Link>
          </td>
          <td>O acompanhamento: nível de serviço por operadora, volume de alertas, fluxo de
            entradas e altas, concentração da rede e a carga de trabalho de cada pessoa da
            equipe.</td>
        </tr>
        <tr>
          <Key>Administração</Key>
          <td>
            <Link para="operacoes">Cadastros</Link>,{' '}
            <Link para="usuario">Cadastro de Usuário</Link>,{' '}
            <Link para="configuracoes">Configurações</Link>,{' '}
            <Link para="movimentacoes">Movimentações</Link>,{' '}
            <Link para="progresso">Progresso</Link>
          </td>
          <td>Os cadastros que sustentam o resto: equipe, contas de acesso, hospitais, operadoras,
            as regras de prazo, a trilha do que cada pessoa fez e o avanço da construção da própria
            plataforma.</td>
        </tr>
        <tr>
          <Key>Acesso</Key>
          <td><Link para="navegacao">Perfis e permissões</Link></td>
          <td>Quem entra na plataforma e o que cada perfil pode ver e fazer.</td>
        </tr>
      </Tabela>

      <h3>De onde vêm os dados</h3>
      <p>Praticamente todo o conteúdo exibido pela plataforma provém de <strong>duas fontes</strong>.</p>
      <ul>
        <li>Os <strong>censos enviados pelos hospitais</strong>, que trazem quem está internado e
          quem teve alta. São eles que criam e atualizam os pacientes; nenhuma tela inventa uma
          internação. Quando um hospital não manda o censo, isso vira uma cobrança no quadro de
          tarefas.</li>
        <li>O <strong>registro dos auditores</strong>, feito na ficha do paciente a cada visita.
          É o que registra a auditoria feita e o que recoloca o paciente em conformidade.</li>
      </ul>
      <p>
        Há ainda o cadastro manual, usado quando um hospital envia o censo em formato que a
        plataforma não consegue ler, e as correções feitas na conferência do envio.
      </p>

      <h3>O que a plataforma entrega</h3>
      <ul>
        <li><strong>Prioridade clara</strong>: a cada momento, quais pacientes precisam de visita e
          quais hospitais estão devendo censo, ordenados por urgência.</li>
        <li><strong>Prazo calculado por operadora</strong>: cada cliente tem regras próprias, e o
          sistema aplica a regra certa a cada paciente, sem ninguém precisar lembrar dela.</li>
        <li><strong>Histórico completo</strong>: tudo o que aconteceu em cada internação, com os
          relatórios, seus documentos e quem os registrou.</li>
        <li><strong>Visão gerencial</strong>: indicadores consolidados por operadora, para
          negociação e prestação de contas.</li>
        <li><strong>Rastreabilidade</strong>: o registro de quem fez o quê e quando, em toda a
          plataforma.</li>
      </ul>

      <h3>Vocabulário da plataforma</h3>
      <p>
        Nove termos recorrem em praticamente todas as telas e fundamentam a leitura das demais
        seções.
      </p>
      <Tabela cabecalho={['Conceito', 'O que significa']} larguras={['175px']}>
        <tr><Key>Operadora</Key><td>A empresa de saúde cliente. Cada uma tem regras próprias de prazo e é o primeiro nível de recorte de quase toda tela.</td></tr>
        <tr><Key>Hospital</Key><td>A unidade onde o paciente está internado. Um hospital pode atender várias operadoras.</td></tr>
        <tr><Key>Internação</Key><td>A passagem de um paciente por um hospital: entrada, leito, médico, diagnóstico e, eventualmente, alta.</td></tr>
        <tr><Key>Gatilho de monitoramento</Key><td>Quantos dias de internação o paciente precisa ter para passar a exigir relatório. Varia por tipo de leito e por operadora.</td></tr>
        <tr><Key>Janela entre relatórios</Key><td>Prazo máximo entre uma visita de auditoria e a seguinte. Passou da janela, o relatório está atrasado.</td></tr>
        <tr><Key>Longa permanência</Key><td>Dois marcos configuráveis por operadora, prolongada e avançada, que sinalizam internações que se estendem demais.</td></tr>
        <tr><Key>Nível de serviço</Key><td>Percentual de pacientes com o relatório em conformidade, exibido como SLA.</td></tr>
        <tr><Key>Censo</Key><td>O arquivo que o hospital envia com os pacientes do dia. É a fonte de todos os dados de internação.</td></tr>
        <tr><Key>Escopo de dados</Key><td>Recorte por hospital aplicado a cada usuário. Quem tem hospitais vinculados só enxerga esses; sem vínculo, enxerga tudo.</td></tr>
      </Tabela>
    </>
  )
}

export function ModuloNavegacao() {
  return (
    <>
      <p>
        Cada conta recebe um <strong>papel</strong>, e é ele que determina quais telas a pessoa vê e
        o que ela pode fazer em cada uma. Algumas contas têm ainda um segundo recorte, o de
        <strong> hospitais</strong>, que limita quais pacientes aparecem para elas.
      </p>
      <p>
        Esta documentação segue a mesma regra: os módulos listados no índice são os das telas que o
        seu perfil acessa. Um perfil da operação não encontra aqui o texto sobre as telas de gestão,
        pelo mesmo motivo que não as encontra no menu.
      </p>

      <h3>Os perfis de acesso</h3>
      <Tabela cabecalho={['Papel', 'Descrição funcional']} larguras={['160px']}>
        <tr>
          <td><Chip tom="positive">Técnico</Chip></td>
          <td>Análise técnica dos relatórios do auditor externo. É o papel que emite o parecer
            interno e registra relatórios.</td>
        </tr>
        <tr>
          <td><Chip tom="positive">Administrativo</Chip></td>
          <td>Operação do dia a dia: Painel Operacional, Envio de Censos e Quadro de Tarefas.</td>
        </tr>
        <tr>
          <td><Chip tom="attention">Gestor</Chip></td>
          <td>Painel do Gestor, Envio de Censos e Configurações. Não acessa a Diretoria nem o
            Painel Operacional.</td>
        </tr>
        <tr>
          <td><Chip tom="brand">Diretor</Chip></td>
          <td>Diretoria, Gestor, Painel Operacional e Configurações. Não acessa os cadastros de
            manutenção do sistema.</td>
        </tr>
        <tr>
          <td><Chip tom="neutral">Analista</Chip></td>
          <td>Perfil de observação: lê o Painel Operacional, o Quadro de Tarefas e as
            Movimentações, e mantém o cadastro de hospitais e operadoras. Não registra relatório
            nem envia censo.</td>
        </tr>
        <tr>
          <td><Chip tom="neutral">Coordenador técnico</Chip></td>
          <td>Acompanha a carga de trabalho dos técnicos na Volumetria e define quais hospitais
            cada um cobre. Enxerga o Painel Operacional como contexto, sem alterar nada nele.</td>
        </tr>
        <tr>
          <td><Chip tom="neutral">Coordenador administrativo</Chip></td>
          <td>O mesmo papel, do lado administrativo: acompanha a carga de cobrança de censo e
            distribui os hospitais entre os administrativos.</td>
        </tr>
        <tr>
          <td><Chip tom="brand">Administrador</Chip></td>
          <td>Manutenção do sistema: cadastros, contas de acesso e a trilha de Movimentações.
            Não acessa a Diretoria nem o Painel do Gestor, que são telas de decisão.</td>
        </tr>
      </Tabela>

      <h3>Matriz de telas por papel</h3>
      <Tabela matriz
        cabecalho={['Tela', 'Técnico', 'Administrativo', 'Gestor', 'Diretor', 'Analista', 'Coord.', 'Admin.']}>
        <tr><Key>Painel Operacional</Key>
          <td><Sim /></td><td><Sim /></td><td><Nao /></td><td><Sim /></td><td><Sim /></td><td><Sim /></td><td><Sim /></td></tr>
        <tr><Key>Ficha do Paciente</Key>
          <td><Sim /></td><td><Sim /></td><td><Sim /></td><td><Sim /></td><td><Sim /></td><td><Sim /></td><td><Sim /></td></tr>
        <tr><Key>Quadro de Tarefas</Key>
          <td><Sim /></td><td><Sim /></td><td><Nao /></td><td><Nao /></td><td><Sim /></td><td><Nao /></td><td><Sim /></td></tr>
        <tr><Key>Envio de Censos</Key>
          <td><Sim /></td><td><Sim /></td><td><Sim /></td><td><Sim /></td><td><Nao /></td><td><Nao /></td><td><Sim /></td></tr>
        <tr><Key>Dashboard da Diretoria</Key>
          <td><Nao /></td><td><Nao /></td><td><Nao /></td><td><Sim /></td><td><Nao /></td><td><Nao /></td><td><Nao /></td></tr>
        <tr><Key>Painel do Gestor</Key>
          <td><Nao /></td><td><Nao /></td><td><Sim /></td><td><Sim /></td><td><Nao /></td><td><Nao /></td><td><Nao /></td></tr>
        <tr><Key>Volumetria</Key>
          <td><Nao /></td><td><Nao /></td><td><Nao /></td><td><Nao /></td><td><Nao /></td><td><Sim /></td><td><Sim /></td></tr>
        <tr><Key>Configurações</Key>
          <td><Nao /></td><td><Nao /></td><td><Sim /></td><td><Sim /></td><td><Nao /></td><td><Nao /></td><td><Sim /></td></tr>
        <tr><Key>Cadastros</Key>
          <td><Nao /></td><td><Nao /></td><td><Nao /></td><td><Nao /></td><td><Sim /></td><td><Nao /></td><td><Sim /></td></tr>
        <tr><Key>Movimentações</Key>
          <td><Nao /></td><td><Nao /></td><td><Nao /></td><td><Nao /></td><td><Sim /></td><td><Nao /></td><td><Sim /></td></tr>
        <tr><Key>Progresso</Key>
          <td><Nao /></td><td><Nao /></td><td><Nao /></td><td><Sim /></td><td><Nao /></td><td><Nao /></td><td><Sim /></td></tr>
      </Tabela>
      <p className="aj-legend"><Sim /> tem acesso <Nao /> sem acesso</p>
      <p>
        A coluna <strong>Coord.</strong> vale para os dois perfis de coordenação, técnico e
        administrativo, que têm o mesmo recorte de telas e se distinguem pela equipe que acompanham
        na Volumetria.
      </p>

      <Callout tipo="rule" titulo="Telas de decisão seguem o cargo">
        O Dashboard da Diretoria e o Painel do Gestor acompanham desempenho de operadora e fluxo de
        internações, e por isso alcançam apenas <strong>a diretoria e, no caso do Gestor, a
        gestão</strong>. Nem mesmo a administração do sistema entra: quem mantém cadastros e contas
        não é, por isso, destinatário da informação gerencial. É a única exceção à ideia de que o
        administrador enxerga o sistema inteiro.
      </Callout>

      <h3>Perfis de observação</h3>
      <p>
        Três perfis <strong>não alteram dado nenhum</strong>: o analista e os dois de coordenação.
        Eles enxergam as telas às quais têm acesso, mas os controles que gravariam alguma coisa não
        são oferecidos a eles. A única exceção é a definição da área de cada pessoa na Volumetria,
        que pertence à coordenação.
      </p>

      <h3>Escopo por hospital</h3>
      <p>
        Além do papel, uma conta pode ser vinculada a hospitais específicos. Nesse caso, ela enxerga
        apenas os pacientes, censos e indicadores dessas unidades, em todas as telas. Sem vínculo, a
        conta enxerga a operação inteira. O vínculo é definido no cadastro da conta.
      </p>

      <Callout tipo="rule" titulo="Regra de acesso">
        O menu apresenta exclusivamente as telas que o papel pode acessar. O recebimento do link de
        uma tela restrita não permite sua abertura: o usuário é direcionado à primeira tela
        autorizada ao seu papel. A restrição permanece válida ainda que se tente contorná-la por
        outro meio, porque quem decide é o servidor, e não o menu.
      </Callout>
    </>
  )
}
