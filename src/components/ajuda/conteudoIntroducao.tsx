// Conteúdo dos módulos de introdução: o que é a plataforma e quem acessa o quê.
// Transversais — valem para todos os papéis.
import { Callout, Key, Metric, Metrics, Nao, Sim, SoGestao, Tabela } from './blocos'
import { useLeAlemDoMenu, useVeGestao } from './acessoAjuda'

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
        <SoGestao>
          <Metric tom="neutral" label="Como vai o serviço" valor="Indicadores e trilha"
            nota="Nível de serviço, permanência e histórico de cada ação" />
        </SoGestao>
      </Metrics>

      <h3>Como o sistema é organizado</h3>
      <p>
        As telas distribuem-se em áreas, conforme a organização apresentada no menu lateral. Cada
        pessoa enxerga apenas as áreas compatíveis com o seu perfil de acesso, de modo que a lista
        abaixo pode incluir telas que não estão no seu menu.
      </p>
      <Tabela cabecalho={['Área', 'Telas', 'A que serve']} larguras={['150px', '210px']}>
        <tr>
          <Key>Operação</Key>
          <td>
            <Link para="painel-operacional">Painel Operacional</Link>,{' '}
            <Link para="ficha-do-paciente">Ficha do Paciente</Link>,{' '}
            <Link para="tarefas">Tarefas</Link>,{' '}
            <Link para="envio-de-censos">Envio de Censos</Link>
          </td>
          <td>O trabalho do dia a dia: receber os censos dos hospitais, saber quem precisa de
            visita e registrar o que foi auditado.</td>
        </tr>
        <SoGestao>
          <tr>
            <Key>Gestão</Key>
            <td>
              <Link para="dashboard-da-diretoria">Dashboard da Diretoria</Link>,{' '}
              <Link para="painel-do-gestor">Painel do Gestor</Link>
            </td>
            <td>O acompanhamento: nível de serviço por operadora, volume de alertas, fluxo de
              entradas e altas e concentração da rede.</td>
          </tr>
        </SoGestao>
        <tr>
          <Key>Coordenação</Key>
          <td><Link para="distribuicao-de-tarefas">Distribuição de tarefas</Link></td>
          <td>A carga de trabalho de cada pessoa da equipe e os hospitais que cada uma cobre.</td>
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
          <td><Link para="perfis-de-acesso">Perfis e permissões</Link></td>
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
        <tr><Key>Escopo de dados</Key><td>Recorte por hospital aplicado a cada usuário. Quem tem hospitais vinculados só enxerga esses; sem vínculo, enxerga tudo.</td></tr>
      </Tabela>
    </>
  )
}

// Matriz de telas por papel. As colunas de Gestor e Diretor e as linhas das
// telas de decisão só aparecem para quem tem essa competência (acessoAjuda.ts).
const PAPEIS_MATRIZ = [
  { nome: 'Técnico' },
  { nome: 'Operacional' },
  { nome: 'Gestor', gestao: true },
  { nome: 'Diretor', gestao: true },
  { nome: 'Analista' },
  { nome: 'Coordenador' },
] as const

// Uma letra por papel, na ordem de PAPEIS_MATRIZ: S = tem acesso, N = não tem.
const TELAS_MATRIZ: { tela: string; acesso: string; gestao?: boolean }[] = [
  { tela: 'Painel Operacional', acesso: 'SSSSSS' },
  { tela: 'Ficha do Paciente', acesso: 'SSSSNS' },
  { tela: 'Tarefas', acesso: 'SSSNSN' },
  { tela: 'Envio de Censos', acesso: 'SSSSNS' },
  { tela: 'Dashboard da Diretoria', acesso: 'NNNSNN', gestao: true },
  { tela: 'Painel do Gestor', acesso: 'NNSSNN', gestao: true },
  { tela: 'Distribuição de tarefas', acesso: 'NNNNNS' },
  { tela: 'Configurações', acesso: 'NNSSNN' },
  { tela: 'Operações', acesso: 'NNNNSN' },
  { tela: 'Movimentações', acesso: 'NNNNSN' },
  { tela: 'Progresso', acesso: 'NNNSNN' },
]

function MatrizTelas() {
  const gestao = useVeGestao()
  const colunas = PAPEIS_MATRIZ
    .map((p, i) => ({ ...p, i }))
    .filter((p) => gestao || !('gestao' in p))
  const linhas = TELAS_MATRIZ
    .filter((t) => gestao || !t.gestao)
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
  return (
    <>
      <p>
        Cada conta recebe um <strong>papel</strong>, e é ele que determina quais telas a pessoa vê e
        o que ela pode fazer em cada uma. Algumas contas têm ainda um segundo recorte, o de
        <strong> hospitais</strong>, que limita quais pacientes aparecem para elas.
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
          <td>Faz as visitas de auditoria: registra os relatórios, agenda as visitas, informa os
            CIDs do paciente e dá alta a quem já saiu. Trabalha no Painel Operacional, nas Tarefas
            e no Envio de Censos.</td>
        </tr>
        <tr>
          <Key>Operacional</Key>
          <td>Operação do dia a dia: envia os censos, cobra os hospitais que atrasam e dá alta a
            quem já saiu. Trabalha no Painel Operacional, no Envio de Censos e nas Tarefas.</td>
        </tr>
        <SoGestao>
          <tr>
            <Key>Gestor</Key>
            <td>Painel do Gestor e Configurações, além do Painel Operacional, das Tarefas e do
              Envio de Censos, para acompanhar quem ele gerencia. Não acessa a Diretoria.</td>
          </tr>
          <tr>
            <Key>Diretor</Key>
            <td>Diretoria, Gestor, Painel Operacional, Envio de Censos, Configurações e Progresso.
              Não acessa os cadastros de manutenção do sistema.</td>
          </tr>
        </SoGestao>
        <tr>
          <Key>Analista</Key>
          <td>Acompanha o Painel Operacional, as Tarefas e as Movimentações sem alterar nada
            nelas, e mantém os cadastros da tela Operações: auditores, contas de acesso,
            hospitais e operadoras. Não registra relatório, não envia censo e não abre a ficha
            completa do paciente.</td>
        </tr>
        <tr>
          <Key>Coordenador técnico</Key>
          <td>Acompanha a carga de trabalho dos técnicos na Distribuição de tarefas e define quais hospitais
            cada um cobre. Enxerga o Painel Operacional como contexto, sem alterar nada nele, e envia censos.</td>
        </tr>
        <tr>
          <Key>Coordenador operacional</Key>
          <td>O mesmo papel, do lado operacional: acompanha a carga de cobrança de censo e
            distribui os hospitais entre os operacionais.</td>
        </tr>
      </Tabela>

      <h3>Matriz de telas por papel</h3>
      <MatrizTelas />
      <p className="aj-legend"><Sim /> tem acesso <Nao /> sem acesso</p>
      <p>
        A coluna <strong>Coordenador</strong> vale para os dois perfis de coordenação, técnico e
        operacional, que têm o mesmo recorte de telas e se distinguem pela equipe que acompanham
        na Distribuição de tarefas.
      </p>

      <SoGestao>
        <Callout tipo="rule" titulo="Telas de decisão seguem o cargo">
          O Dashboard da Diretoria e o Painel do Gestor acompanham desempenho de operadora e fluxo
          de internações, e por isso alcançam apenas <strong>a diretoria e, no caso do Gestor, a
          gestão</strong>. Quem mantém os cadastros não é, por isso, destinatário da informação
          gerencial.
        </Callout>
      </SoGestao>

      <h3>Perfis de observação</h3>
      <ul>
        <li>Analista e coordenadores <strong>não alteram pacientes nem relatórios</strong>.
          Veem essas telas, mas sem os botões de edição.</li>
        <li>Os coordenadores enviam censos; o analista, não.</li>
        <li>O analista mantém os cadastros da tela Operações.</li>
        <li>Os coordenadores definem os hospitais de cada pessoa na Distribuição de tarefas.</li>
      </ul>

      <h3>Escopo por hospital</h3>
      <p>
        Além do papel, uma conta pode ser vinculada a hospitais específicos. Nesse caso, ela enxerga
        apenas os pacientes, censos e indicadores dessas unidades, em todas as telas. Sem vínculo, a
        conta enxerga a operação inteira. O vínculo é definido no cadastro da conta.
      </p>
    </>
  )
}
