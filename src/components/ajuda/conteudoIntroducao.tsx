// Conteúdo dos módulos de introdução: o que é a plataforma e quem acessa o quê.
// Transversais — valem para todos os papéis.
import { useAuth } from '../../auth/AuthContext'
import { ACOES_NO_PAINEL } from '../../lib/recursos'
import { Callout, Key, Metric, Metrics, Nao, Sim, SoGestao, Tabela } from './blocos'
import { useLeAlemDoMenu, useVeTodosOsPerfis } from './acessoAjuda'
import { modulosVisiveis } from './catalogo'

interface Props {
  irPara: (id: string) => void
}

export function ModuloVisao({ irPara }: Props) {
  const { role } = useAuth()
  // Módulo fora do índice do papel vira texto: o link abriria o primeiro módulo
  // do índice (useAjudaNav), e o clique só voltaria ao topo desta página.
  const legiveis = new Set(modulosVisiveis(role).map((m) => m.id))
  const Link = ({ para, children }: { para: string; children: string }) => (
    legiveis.has(para)
      ? <button type="button" className="aj-link" onClick={() => irPara(para)}>{children}</button>
      : <>{children}</>
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
        <SoGestao>
          <Metric tom="neutral" label="Como vai o serviço" valor="Indicadores e trilha"
            nota="Nível de serviço, permanência e histórico de cada ação" />
        </SoGestao>
      </Metrics>

      <h3>Como o sistema é organizado</h3>
      <p>
        As telas distribuem-se nas áreas abaixo. O menu lateral as reúne de outro modo, em{' '}
        <strong>Painel</strong> e <strong>Sistema</strong>, e algumas aparecem nele com outro
        nome, indicado entre parênteses. Cada pessoa enxerga apenas as telas compatíveis com o seu
        perfil de acesso, de modo que a lista abaixo pode incluir telas que não estão no seu menu;
        as que não têm módulo no seu índice aparecem sem link.
      </p>
      <Tabela cabecalho={['Área', 'Telas', 'A que serve']} larguras={['150px', '210px']}>
        <tr>
          <Key>Operação</Key>
          <td>
            <Link para="painel-operacional">Painel Operacional</Link> (no menu,{' '}
            <strong>Visão Geral</strong>),{' '}
            <Link para="ficha-do-paciente">Ficha do Paciente</Link>,{' '}
            <Link para="tarefas">Tarefas</Link>,{' '}
            <Link para="envio-de-censos">Envio de Censos</Link>
          </td>
          <td>O trabalho do dia a dia: receber os censos dos hospitais, saber quem precisa de
            visita e registrar o que foi auditado.</td>
        </tr>
        <tr>
          <Key>Gestão</Key>
          <td>
            <SoGestao>
              <Link para="dashboard-da-diretoria">Dashboard da Diretoria</Link> (no menu,{' '}
              <strong>Diretoria / KPIs</strong>),{' '}
              <Link para="painel-do-gestor">Painel do Gestor</Link> (no menu,{' '}
              <strong>Gestor / Fluxo</strong>),{' '}
            </SoGestao>
            <Link para="distribuicao-de-tarefas">Distribuição de tarefas</Link>
          </td>
          <td>
            <SoGestao>
              O acompanhamento: nível de serviço por operadora, volume de alertas, fluxo de
              entradas e altas e concentração da rede.{' '}
            </SoGestao>
            A carga de trabalho de cada pessoa da equipe e a divisão do trabalho entre elas.
          </td>
        </tr>
        <tr>
          <Key>Administração</Key>
          <td>
            <Link para="operacoes">Operações</Link>,{' '}
            <Link para="configuracoes">Configurações</Link>,{' '}
            <Link para="movimentacoes">Movimentações</Link>,{' '}
            <Link para="progresso">Progresso</Link>
          </td>
          <td>Os cadastros que sustentam o resto: equipe, contas de acesso, hospitais,
            operadoras, as regras de prazo, a trilha do que cada pessoa fez e o avanço da
            construção da própria plataforma.</td>
        </tr>
        <tr>
          <Key>Acesso</Key>
          <td><Link para="perfis-de-acesso">Perfis de acesso e permissões</Link></td>
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
        plataforma não consegue ler, as correções feitas na conferência do envio e a alta dada à
        mão, quando o hospital demora a mandar o censo e já se sabe que o paciente saiu.
      </p>

      <h3>O que a plataforma entrega</h3>
      <ul>
        <li><strong>Prioridade clara</strong>: a cada momento, quais pacientes precisam de visita e
          quais hospitais estão devendo censo, ordenados por urgência.</li>
        <li><strong>Prazo calculado por operadora</strong>: cada cliente tem regras próprias, e o
          sistema aplica a regra certa a cada paciente, sem ninguém precisar lembrar dela.</li>
        <li><strong>Histórico completo</strong>: tudo o que aconteceu em cada internação, com os
          relatórios, seus documentos e quem os registrou.</li>
        <SoGestao>
          <li><strong>Visão gerencial</strong>: indicadores consolidados por operadora, para
            negociação e prestação de contas.</li>
        </SoGestao>
        <li><strong>Rastreabilidade</strong>: o registro de quem fez o quê e quando, em toda a
          plataforma.</li>
      </ul>

      <h3>Vocabulário da plataforma</h3>
      <p>
        Alguns termos recorrem em praticamente todas as telas e fundamentam a leitura das demais
        seções.
      </p>
      <Tabela cabecalho={['Conceito', 'O que significa']} larguras={['175px']}>
        <tr><Key>Operadora</Key><td>A empresa de saúde cliente. Cada uma tem regras próprias de prazo e é o primeiro nível de recorte de quase toda tela.</td></tr>
        <tr><Key>Hospital</Key><td>A unidade onde o paciente está internado. Um hospital pode atender várias operadoras.</td></tr>
        <tr><Key>Internação</Key><td>A passagem de um paciente por um hospital: entrada, leito, médico, diagnóstico e, eventualmente, alta.</td></tr>
        <tr><Key>Gatilho de monitoramento</Key><td>Quantos dias de internação o paciente precisa ter para passar a exigir relatório. Varia por tipo de leito e por operadora.</td></tr>
        <tr><Key>Janela entre relatórios</Key><td>Prazo máximo entre uma visita de auditoria e a seguinte. Passou da janela, o relatório está atrasado.</td></tr>
        <tr><Key>Longa permanência</Key><td>Dois marcos configuráveis por operadora, prolongada e avançada, que sinalizam internações que se estendem demais.</td></tr>
        <SoGestao>
          <tr><Key>Nível de serviço</Key><td>Percentual de pacientes com o relatório em conformidade, exibido como SLA.</td></tr>
        </SoGestao>
        <tr><Key>Censo</Key><td>O arquivo que o hospital envia com os pacientes do dia. É a fonte de todos os dados de internação.</td></tr>
        <tr><Key>Escopo de dados</Key><td>Recorte aplicado a cada usuário: por hospital para o técnico e os coordenadores, por operadora para o operacional. Quem tem vínculo só enxerga o que está nele; sem vínculo, enxerga tudo. Exceção: o técnico e o coordenador técnico consultam os outros hospitais pelo filtro <strong>Todos os pacientes</strong>, sem escrever relatório neles.</td></tr>
      </Tabela>

      <h3>Dúvidas e suporte</h3>
      <p>
        O que esta documentação não responder vai ao suporte por um chamado: use{' '}
        <strong>Abrir chamado</strong>, no fim de cada módulo, ou o balão no rodapé da barra
        lateral, que ocupa o lugar da interrogação enquanto a Ajuda está aberta. A resposta chega
        no próprio chamado, e um ponto no ícone avisa quando há mensagem nova.
      </p>
    </>
  )
}

// Matriz de telas por papel. As colunas de Gestor e Diretor e as linhas das
// telas de decisão só aparecem para quem tem essa competência e para o analista
// interno (acessoAjuda.ts).
const PAPEIS_MATRIZ = [
  { nome: 'Técnico' },
  { nome: 'Operacional' },
  { nome: 'Gestor', gestao: true },
  { nome: 'Diretor', gestao: true },
  { nome: 'Analista interno' },
  { nome: 'Coord. técnico' },
  { nome: 'Coord. operacional' },
] as const

// Uma letra por papel, na ordem de PAPEIS_MATRIZ: S = tem acesso, N = não tem.
// Os dois coordenadores têm colunas próprias (13/11/2026): só o técnico abre
// Aprovações (EXCLUSIVAS.aprovacoes em auth/permissions.ts).
const TELAS_MATRIZ: { tela: string; acesso: string; gestao?: boolean }[] = [
  { tela: 'Painel Operacional', acesso: 'SSSSSSS' },
  { tela: 'Ficha do Paciente', acesso: 'SSSSNSS' },
  { tela: 'Tarefas', acesso: 'SSSNSSS' },
  { tela: 'Envio de Censos', acesso: 'SSSSNSS' },
  { tela: 'Dashboard da Diretoria', acesso: 'NNNSNNN', gestao: true },
  { tela: 'Painel do Gestor', acesso: 'NNSSNNN', gestao: true },
  { tela: 'Distribuição de tarefas', acesso: 'NNSNNSS' },
  { tela: 'Aprovações', acesso: 'NNSNNSN' },
  { tela: 'Configurações', acesso: 'NNSSNNN' },
  { tela: 'Operações', acesso: 'NNNNSNN' },
  { tela: 'Movimentações', acesso: 'NNNNSNN' },
  { tela: 'Progresso', acesso: 'NNNSNNN' },
]

function MatrizTelas() {
  const todos = useVeTodosOsPerfis()
  const colunas = PAPEIS_MATRIZ
    .map((p, i) => ({ ...p, i }))
    .filter((p) => todos || !('gestao' in p))
  const linhas = TELAS_MATRIZ
    .filter((t) => todos || !t.gestao)
    // Sem as colunas de gestão, uma tela que só a gestão abre viraria uma
    // linha inteira de "sem acesso", que não informa nada.
    .filter((t) => colunas.some((c) => t.acesso[c.i] === 'S'))
  return (
    <Tabela matriz cabecalho={['Tela', ...colunas.map((c) => c.nome)]}>
      {linhas.map((t) => (
        <tr key={t.tela}>
          <Key>{t.tela}</Key>
          {colunas.map((c) => <td key={c.nome}>{t.acesso[c.i] === 'S' ? <Sim /> : <Nao />}</td>)}
        </tr>
      ))}
    </Tabela>
  )
}

export function ModuloNavegacao() {
  const alemDoMenu = useLeAlemDoMenu()
  const todosOsPerfis = useVeTodosOsPerfis()
  return (
    <>
      <p>
        Cada conta recebe um <strong>papel</strong>, e é ele que determina quais telas a pessoa vê e
        o que ela pode fazer em cada uma. Algumas contas têm ainda um segundo recorte, por
        <strong> hospital</strong> ou por <strong>operadora</strong>, que limita quais pacientes
        aparecem para elas.
      </p>
      {alemDoMenu ? (
        <p>
          Para o seu perfil, esta documentação vai além do menu: o índice traz também módulos de
          telas que você não abre, para consulta.
        </p>
      ) : (
        <p>
          Esta documentação segue a mesma regra: os módulos listados no índice são os das telas que o
          seu perfil acessa, pelo mesmo motivo que as demais não aparecem no menu.
        </p>
      )}

      <h3>Os perfis de acesso</h3>
      <Tabela cabecalho={['Papel', 'Descrição funcional']} larguras={['220px']}>
        <tr>
          <Key>Técnico</Key>
          <td>Faz as visitas de auditoria: registra os
            relatórios,{ACOES_NO_PAINEL ? ' agenda as visitas,' : ''} informa os CIDs do paciente
            e dá alta a quem já saiu. Aprova o relatório do operacional, ou o corrige e salva para
            depois ou já aprova. Trabalha no Painel Operacional, nas Tarefas e no Envio de
            Censos.</td>
        </tr>
        <tr>
          <Key>Operacional</Key>
          <td>Operação do dia a dia: envia os censos, cobra os hospitais que atrasam, dá alta a
            quem já saiu e pausa ou retoma a prorrogação do paciente. Registra relatórios, que só
            valem depois que um técnico, um coordenador técnico ou um gestor aprova. Trabalha no
            Painel Operacional, no Envio de Censos e nas Tarefas.</td>
        </tr>
        {todosOsPerfis && (
          <>
            <tr>
              <Key>Gestor</Key>
              <td>Painel do Gestor, Configurações e Distribuição de tarefas, além do Painel
                Operacional, das Tarefas e do Envio de Censos, para acompanhar quem ele gerencia.
                Tem as ações do técnico: o
                relatório dele vale na hora, e ele aprova o do operacional, ou o corrige e
                salva para depois ou já aprova. Pede pendências a quem é da equipe e aprova ou
                recusa os pedidos para desfazer a atualização de um censo. Não acessa a
                Diretoria.</td>
            </tr>
            <tr>
              <Key>Diretor</Key>
              <td>Diretoria, Gestor, Painel Operacional, Envio de Censos, Configurações e Progresso.
                Não acessa os cadastros de manutenção do sistema.</td>
            </tr>
          </>
        )}
        <tr>
          <Key>Analista interno</Key>
          <td>Acompanha o Painel Operacional, as Tarefas e as Movimentações sem alterar nada
            nelas, e mantém os cadastros da tela Operações: auditores, contas de acesso,
            hospitais e operadoras. Não registra relatório, não envia censo e não abre a ficha
            completa do paciente.</td>
        </tr>
        <tr>
          <Key>Coordenador técnico</Key>
          <td>Coordena os técnicos: acompanha a carga de análise de cada um na Distribuição de
            tarefas e define quais hospitais cada um cobre. Também é da equipe: tem Tarefas e as
            ações do técnico, inclusive aprovar e editar o relatório do operacional e mexer nos
            CIDs, e envia censos. Decide, em Aprovações, os pedidos de relatório de paciente fora
            da área.</td>
        </tr>
        <tr>
          <Key>Coordenador operacional</Key>
          <td>Coordena os operacionais: acompanha a carga de cobrança de censo de cada um na
            Distribuição de tarefas e define quais operadoras cada um cobre. Também é da equipe:
            tem Tarefas e as ações do operacional, inclusive pausar e retomar a prorrogação, e
            envia censos. O relatório dele, como o do operacional, só vale depois de
            aprovado.</td>
        </tr>
        <tr>
          <Key>Médico e enfermeiro</Key>
          <td>Contas da equipe assistencial, criadas a partir do cadastro do profissional. Não
            usam as telas internas: entram num portal próprio.</td>
        </tr>
      </Tabela>

      <h3>Matriz de telas por papel</h3>
      <MatrizTelas />
      <p className="aj-legend"><Sim /> tem acesso <Nao /> sem acesso</p>
      <p>
        Os dois coordenadores abrem as mesmas telas, com uma exceção:{' '}
        <strong>Aprovações</strong>, onde se decidem os pedidos de relatório de paciente fora da
        área, é só do coordenador técnico. O que mais os separa está dentro das telas: a equipe que
        cada um acompanha e as ações que tem, explicadas em <strong>Coordenadores</strong>, mais
        abaixo.
      </p>

      <SoGestao>
        <Callout tipo="rule" titulo="Telas de decisão seguem o cargo">
          O Dashboard da Diretoria e o Painel do Gestor acompanham desempenho de operadora e fluxo
          de internações, e por isso alcançam apenas <strong>a diretoria e, no caso do Gestor, a
          gestão</strong>. Quem mantém os cadastros não é, por isso, destinatário da informação
          gerencial.
        </Callout>
      </SoGestao>

      <h3>Perfil de observação</h3>
      <ul>
        <li>O analista <strong>não altera pacientes nem relatórios</strong>. Vê essas telas, mas
          sem os botões de edição, e não envia censos.</li>
        <li>O analista mantém os cadastros da tela Operações.</li>
      </ul>

      <h3>Coordenadores</h3>
      <p>
        Há um papel de coordenação para cada equipe: o <strong>coordenador técnico</strong>{' '}
        acompanha os técnicos, e o <strong>coordenador operacional</strong>, os operacionais. Os
        dois coordenam e trabalham ao mesmo tempo, e o que cada um faz segue a equipe dele.
      </p>
      <p>Em comum, os dois:</p>
      <ul>
        <li>Dividem o trabalho do grupo deles na Distribuição de tarefas, incluindo a própria
          parte. Cada um só mexe no próprio grupo: o coordenador técnico não altera a área de um
          operacional, nem o coordenador operacional a de um técnico.</li>
        <li>Também trabalham no grupo: têm Tarefas, registram relatório, dão e desfazem alta,
          ligam internações da mesma pessoa e enviam censos.</li>
        <li>Pedem pendências a quem é do grupo deles, inclusive a si mesmos, e aprovam ou recusam
          os pedidos para desfazer a atualização de um censo.</li>
        <li>Recebem hospitais na Distribuição de tarefas, e não no cadastro da conta. Enquanto não
          têm hospital vinculado, veem a rede inteira; com hospitais vinculados, veem os deles.</li>
      </ul>
      <p>O que separa um do outro:</p>
      <Tabela cabecalho={['O que muda', 'Coordenador técnico', 'Coordenador operacional']} larguras={['200px']}>
        <tr><Key>Equipe que acompanha</Key>
          <td>Técnicos e outros coordenadores técnicos</td>
          <td>Operacionais e outros coordenadores operacionais</td></tr>
        <tr><Key>O que divide na Distribuição</Key>
          <td>Hospitais entre os técnicos</td>
          <td>Operadoras entre os operacionais</td></tr>
        <tr><Key>A própria área</Key>
          <td>Hospitais</td>
          <td>Hospitais, e não operadoras, como a do operacional</td></tr>
        <tr><Key>Quadro de Tarefas</Key>
          <td>As colunas do técnico: pacientes e aprovação</td>
          <td>As colunas do operacional: censos e, em Pacientes, Sem relatório e aprovação</td></tr>
        <tr><Key>Relatório que registra</Key>
          <td>Vale na hora</td>
          <td>Só vale depois de aprovado</td></tr>
        <tr><Key>Relatório do operacional</Key>
          <td>Aprova, ou edita e aprova</td>
          <td>Não aprova</td></tr>
        <tr><Key>CIDs do paciente</Key>
          <td>Adiciona e remove</td>
          <td>Não mexe</td></tr>
        <tr><Key>Prorrogação em andamento</Key>
          <td>Não pausa</td>
          <td>Pausa e retoma</td></tr>
        <tr><Key>Paciente fora da área</Key>
          <td>Consulta pelo filtro Todos os pacientes, pede autorização para o relatório e decide
            os pedidos em Aprovações</td>
          <td>Não tem o filtro nem participa das autorizações</td></tr>
      </Tabela>

      <h3>Escopo de dados</h3>
      <p>
        Além do papel, uma conta pode ter um recorte de dados, que vale em todas as telas. O técnico
        é vinculado a hospitais e enxerga os pacientes, censos e indicadores dessas unidades. O
        operacional é vinculado a operadoras e enxerga os pacientes e censos delas, em todos os
        hospitais que as atendem. Os dois vínculos são definidos no cadastro da conta e também
        ajustados na Distribuição de tarefas: os hospitais dos técnicos pelo coordenador técnico, e
        as operadoras dos operacionais pelo coordenador operacional. Os dois coordenadores
        enxergam os hospitais que recebem na Distribuição de tarefas. Sem vínculo, a conta enxerga
        a operação inteira.
      </p>
      <p>
        No Painel Operacional, o técnico e o coordenador técnico podem trocar para{' '}
        <strong>Todos os pacientes</strong> e ver os pacientes de todos os hospitais. É só para
        consulta: <strong>nos pacientes de fora da área eles não escrevem relatório</strong>, nem
        mexem em CID, alta ou dados. Tarefas e cobranças continuam pela área.
      </p>
    </>
  )
}
