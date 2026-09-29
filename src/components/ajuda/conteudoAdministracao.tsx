// Conteúdo dos módulos de Administração (cadastros, contas, regras de prazo e
// trilha) e do anexo de Referência.
//
// Cadastros e Movimentações ficam presos às telas 'equipe' e 'logs', as regras
// de prazo à tela 'configuracoes' e o avanço da obra à tela 'progresso': são
// assuntos de manutenção do sistema, e quem não administra não os encontra no
// índice. O anexo de status é transversal,
// porque a pastilha que ele explica aparece em praticamente toda tela.
import { useState } from 'react'
import type { UserRole } from '../../types/api'
import { ROLE_LABEL, temEscopoHospital } from '../../lib/usuarioRoles'
import { Callout, Chip, Key, Metric, Metrics, SoGestao, Tabela } from './blocos'
import { ComoFazer, Tela, type PassoAjuda } from './replica'
import { PAPEIS_CADASTRO } from './acessoAjuda'
import {
  ReplicaAdicionarProfissional, ReplicaCriarAcesso, ReplicaNovoUsuario, ReplicaProfissionais,
  ReplicaUsuarios,
} from './exemplosCadastros'

// O que marcar em "Nível de acesso", papel a papel. O rótulo e a descrição do
// cartão vêm da própria tela (lib/usuarioRoles); aqui fica só o "para quem é".
const PARA_QUEM: Partial<Record<UserRole, string>> = {
  tecnico: 'Para quem faz as visitas de auditoria e registra os relatórios.',
  administrativo: 'Para quem envia os censos e cobra os hospitais que atrasam.',
  coordenador_tecnico: 'Para quem distribui os hospitais entre os técnicos, na Distribuição de tarefas.',
  coordenador_administrativo: 'Para quem distribui os hospitais entre os administrativos, na Distribuição de tarefas.',
  analista: 'Para quem acompanha a operação sem alterar pacientes e mantém os cadastros desta tela.',
  // Gestor e diretor sem descrição de função: o que a gestão vê e faz só é
  // contado a quem tem essa competência (acessoAjuda.ts), e quem lê este
  // módulo é o analista.
  gestor: 'Para a gestão.',
  diretor: 'Para a diretoria.',
}

function passosDaConta(papel: UserRole): PassoAjuda[] {
  const escopo = temEscopoHospital(papel)
  const passos: PassoAjuda[] = [
    { n: 1, titulo: 'Clique em Novo usuário', corpo: <>Na aba <strong>Usuários de acesso</strong> da tela Operações. Abre a página de cadastro da conta.</> },
    { n: 2, titulo: 'Informe nome, e-mail e senha', corpo: <>A pessoa entra com esse e-mail e essa senha, de no mínimo 6 caracteres. O e-mail não pode ser trocado depois; a senha, sim, pelo botão <strong>Senha</strong> da lista.</> },
    {
      n: 3,
      titulo: `Marque ${ROLE_LABEL[papel]}`,
      corpo: (
        <>
          {PARA_QUEM[papel]}{' '}
          {escopo
            ? <>Este papel <strong>tem escopo por hospital</strong>: o campo de cidades e hospitais aparece logo abaixo.</>
            : <>Este papel <strong>não tem escopo por hospital</strong>: enxerga a operação inteira, e o campo de hospitais não aparece.</>}
        </>
      ),
    },
  ]
  if (escopo) {
    passos.push({
      n: 4,
      titulo: 'Escolha as cidades e os hospitais',
      corpo: <>A pessoa verá só os pacientes, censos e tarefas desses hospitais. Marque a cidade inteira de uma vez ou só alguns hospitais dela. <strong>Sem nenhum marcado, ela vê a operação inteira.</strong></>,
    })
  }
  passos.push({
    n: passos.length + 1,
    titulo: 'Clique em Criar usuário',
    corpo: <>A conta já pode entrar. O papel e os hospitais podem ser mudados depois pelo botão <strong>Editar</strong> da lista.</>,
  })
  return passos
}

/** "Criar conta para a equipe interna", com a escolha do tipo de usuário: a
 *  réplica e os passos mudam conforme o papel, porque o formulário real muda
 *  (o escopo por hospital só existe para técnico e administrativo). */
function CadastroDeConta() {
  const [papel, setPapel] = useState<UserRole>('tecnico')
  const passos = passosDaConta(papel)
  const escopo = temEscopoHospital(papel)
  return (
    <>
      <ComoFazer titulo={`Criar uma conta de ${ROLE_LABEL[papel]}`} passos={passos}>
        <div className="aj-tipos" role="group" aria-label="Tipo de usuário">
          <span className="aj-tipos-lbl">Tipo de usuário:</span>
          {PAPEIS_CADASTRO.map((r) => (
            <button key={r} type="button" aria-pressed={papel === r}
              className={`aj-tipo${papel === r ? ' ativo' : ''}`} onClick={() => setPapel(r)}>
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
        <Tela nome="Operações" largura={900}
          descricao="Aba Usuários de acesso: as contas da equipe interna e o papel de cada uma.">
          <ReplicaUsuarios marcas={{ novo: 1 }} />
        </Tela>
        <Tela nome="Novo usuário de acesso" largura={700}
          descricao={escopo
            ? `Cadastro de ${ROLE_LABEL[papel]}: com escopo de cidades e hospitais.`
            : `Cadastro de ${ROLE_LABEL[papel]}: sem escopo, enxerga a operação inteira.`}>
          <ReplicaNovoUsuario papel={papel}
            marcas={escopo
              ? { credenciais: 2, papel: 3, escopo: 4, criar: 5 }
              : { credenciais: 2, papel: 3, criar: 4 }} />
        </Tela>
      </ComoFazer>
    </>
  )
}

export function ModuloOperacoes() {
  return (
    <>
      <h3>Objetivo</h3>
      <p>
        Manter os <strong>cadastros que sustentam as demais telas</strong>. Nada aqui é atividade do
        dia a dia: são os registros que precisam existir antes, para que o restante da plataforma
        funcione.
      </p>
      <Tabela cabecalho={['Aba', 'O que se cadastra']} larguras={['210px']}>
        <tr><Key>Profissionais</Key>
          <td>Os enfermeiros e médicos auditores, os hospitais que cada um cobre e o acesso deles ao
            portal do profissional. Os médicos ativos são os oferecidos ao registrar um relatório e
            ao agendar uma visita.</td></tr>
        <tr><Key>Usuários de acesso</Key>
          <td>As contas da equipe interna e o papel de cada uma, que define o que a pessoa vê e o
            que pode fazer.</td></tr>
        <tr><Key>Hospitais e operadoras</Key>
          <td>Quais unidades existem e quais operadoras cada uma atende. É o que permite que um
            censo enviado seja reconhecido e vinculado ao hospital certo.</td></tr>
      </Tabela>

      <h3>Quem acessa</h3>
      <p>
        O perfil analista, que mantém os três cadastros. Os demais perfis não entram aqui.
      </p>

      <h3>Passo a passo</h3>
      <p>
        Há dois caminhos para criar o acesso de alguém, conforme quem é a pessoa.{' '}
        <strong>Médicos e enfermeiros</strong> são cadastrados como profissionais, e a conta nasce
        junto, levando ao portal do profissional. <strong>A equipe interna</strong> (técnicos,
        administrativos, coordenadores, analistas, gestores e diretores) recebe uma conta de acesso,
        com o papel escolhido no cadastro.
      </p>

      <ComoFazer
        titulo="Cadastrar um médico auditor ou um enfermeiro"
        passos={[
          { n: 1, titulo: 'Clique em Adicionar', corpo: <>Na aba <strong>Profissionais</strong> da tela Operações.</> },
          { n: 2, titulo: 'Escolha o tipo e informe o nome', corpo: <><strong>Médico(a) Auditor(a)</strong> ou <strong>Enfermeiro(a)</strong>. O tipo decide o portal que a pessoa vai usar, e só médicos ativos aparecem como auditor ao registrar relatório.</> },
          { n: 3, titulo: 'Informe o e-mail e a senha inicial', corpo: <>São obrigatórios: com eles o profissional entra no portal dele, que não mostra nenhuma informação interna. A senha tem no mínimo 6 caracteres.</> },
          { n: 4, titulo: 'Marque os hospitais que ele cobre', corpo: <>Escolha a cidade e marque os hospitais dela; vários entram de uma vez. Um hospital que atende mais de uma operadora aparece uma vez só e vale para todas; na ficha dele dá para deixar só algumas. A escala também pode ficar para depois.</> },
          { n: 5, titulo: 'Escolha o serviço', corpo: <>Aparece quando há hospital marcado e vale para todos eles: análise de conta, auditoria concorrente, ambulatório ou pronto socorro. Serviço diferente por hospital se ajusta na ficha.</> },
          { n: 6, titulo: 'Clique em Adicionar', corpo: <>O aviso diz o que entrou. Se o e-mail já estiver em uso, o profissional é gravado sem acesso, e o acesso se cria depois pelo <strong>Editar</strong>.</> },
        ]}
      >
        <Tela nome="Operações" largura={900}
          descricao="Aba Profissionais: a equipe assistencial, com o e-mail de acesso e o número de hospitais de cada um.">
          <ReplicaProfissionais marcas={{ adicionar: 1 }} />
        </Tela>
        <Tela nome="Operações" largura={600}
          descricao="Formulário de novo profissional, preenchido com um médico auditor e dois hospitais.">
          <ReplicaAdicionarProfissional marcas={{ tipo: 2, acesso: 3, hospitais: 4, servico: 5, adicionar: 6 }} />
        </Tela>
      </ComoFazer>

      <ComoFazer
        titulo="Dar acesso a um profissional que ainda não tem"
        passos={[
          { n: 1, titulo: 'Clique em Editar, na linha dele', corpo: <>Quem ainda não tem acesso aparece com <strong>Sem acesso</strong> na coluna de e-mail.</> },
          { n: 2, titulo: 'Informe o e-mail e a senha inicial', corpo: <>O campo de senha aparece ao digitar o e-mail. A senha tem no mínimo 6 caracteres. O papel (médico ou enfermeiro) sai do tipo do cadastro.</> },
          { n: 3, titulo: 'Clique em Salvar', corpo: <>O profissional já pode entrar no portal. Desativar o profissional suspende o acesso, e reativar o devolve.</> },
        ]}
      >
        <Tela nome="Operações" largura={900}
          destaques={{ 'tbody tr:nth-child(2) td:last-child .btn:nth-child(2)': 1 }}
          descricao="Paulo Mendes ainda não tem acesso à plataforma.">
          <ReplicaProfissionais />
        </Tela>
        <Tela nome="Operações" largura={560} descricao="Ficha do profissional com o e-mail de acesso preenchido.">
          <ReplicaCriarAcesso marcas={{ dados: 2, salvar: 3 }} />
        </Tela>
      </ComoFazer>

      <CadastroDeConta />

      <h3>Profissionais</h3>
      <ul>
        <li>A lista tem busca por nome e filtro por tipo, com a contagem de cada categoria.</li>
        <li>Cada linha mostra o tipo, o e-mail de acesso (ou <strong>Sem acesso</strong>) e quantos
          hospitais o profissional cobre, com três atalhos: <strong>Senha</strong> (só redefine a senha de quem já tem acesso),{' '}
          <strong>Editar</strong> e <strong>Desativar</strong>.</li>
        <li>Clicar na linha abre a ficha do profissional, com a <strong>escala de hospitais</strong>:
          em quais unidades ele atende e em qual serviço. O que já está na escala aparece marcado,
          para não ser incluído duas vezes.</li>
        <li>Um hospital pode atender várias operadoras sem que o profissional cubra todas. No
          cartão do hospital, o botão <strong>Operadoras</strong> abre a lista das que o hospital
          atende: marque as que ele cobre e clique em <strong>Salvar</strong>.</li>
        <li>Profissional não é apagado, é desativado, preservando o histórico dele. Desativar
          também suspende o acesso ao portal.</li>
      </ul>

      <h3>Usuários de acesso</h3>
      <ul>
        <li>A lista tem busca por nome ou e-mail e filtro por papel, com a contagem de cada um.</li>
        <li>A coluna de <strong>hospitais</strong> diz se a conta enxerga toda a operação
          (<strong>Todos</strong>) ou só as unidades vinculadas a ela.</li>
        <li>Os atalhos da linha são <strong>Senha</strong>, <strong>Editar</strong> (papel,
          hospitais e nome) e <strong>Apagar</strong>. A exclusão é irreversível, mas o histórico de
          ações da pessoa na trilha de auditoria é preservado. A própria conta não pode ser
          apagada.</li>
      </ul>

      <h3>Hospitais e operadoras</h3>
      <p>Cadastro das unidades e das operadoras que cada uma atende.</p>
      <ul>
        <li>A lista é organizada por operadora, e cada uma abre mostrando seus hospitais e o total
          de unidades.</li>
        <li>A <strong>busca localiza tanto operadoras quanto hospitais</strong>: procurar o nome de
          uma unidade também encontra a operadora que a atende.</li>
        <li>É possível criar operadora e criar hospital dentro de uma operadora, informando apenas o
          nome.</li>
        <li>Renomear uma operadora altera apenas o nome exibido. Os pacientes, hospitais e o
          histórico dela permanecem vinculados.</li>
        <li>A exclusão de operadora ou hospital exige confirmação e é recusada quando há pacientes
          ou escala vinculados ao registro, com a indicação do motivo.</li>
        <li>Ao abrir um hospital, é apresentada a ficha cadastral com nome, CNPJ, telefone, e-mail,
          endereço, cidade, estado, CEP, região e observações.</li>
        <li>A região é o que define em que <strong>cidade</strong> o hospital aparece nas telas de
          escolha de escopo e de escala. A <strong>região é escolhida de uma lista fechada</strong>, tanto ao cadastrar o hospital
          quanto na ficha. É ela que agrupa os hospitais na definição do escopo de dados de um
          usuário<SoGestao>, e também o recorte geográfico do painel do Gestor</SoGestao>.</li>
      </ul>
    </>
  )
}

export function ModuloConfiguracoes() {
  return (
    <>
      <h3>Objetivo</h3>
      <p>
        Definir, para cada operadora, <strong>a partir de quando um relatório passa a ser
        devido</strong> e <strong>de quanto em quanto tempo ele precisa se repetir</strong>. São
        essas duas definições que produzem os status, os alertas e os indicadores exibidos em todas
        as demais telas.
      </p>

      <h3>Quem acessa</h3>
      <p>
        Gestão e diretoria. É a tela que altera a régua de cobrança do contrato, por isso fica fora
        do alcance dos perfis de operação.
      </p>

      <h3>As duas regras que governam o sistema</h3>
      <p>Cada operadora tem regras próprias, e elas são aplicadas paciente a paciente.</p>

      <h4>1. Gatilho de monitoramento: quando o relatório passa a ser devido</h4>
      <p>
        Um paciente recém-internado ainda não exige relatório. O <strong>gatilho</strong> é a
        quantidade de dias de internação a partir da qual ele passa a exigir. Como a gravidade varia
        conforme o leito, o gatilho é definido separadamente para cada tipo.
      </p>
      <Tabela cabecalho={['Campo', 'O que define']} larguras={['210px']}>
        <tr><Key>UTI, CTI e unidade coronariana</Key>
          <td>Dias de internação em terapia intensiva até o relatório passar a ser exigido. Costuma
            ser o prazo mais curto, pela gravidade do caso.</td></tr>
        <tr><Key>Apartamento</Key><td>Dias de internação em apartamento até o relatório passar a ser exigido.</td></tr>
        <tr><Key>Enfermaria</Key><td>Dias de internação em enfermaria até o relatório passar a ser exigido.</td></tr>
        <tr><Key>Leito não identificado</Key>
          <td>Qual das regras acima aplicar quando o censo do hospital não informa o tipo de leito
            do paciente. Sem essa definição, o paciente ficaria sem regra.</td></tr>
      </Tabela>
      <p>
        Enquanto o paciente não atinge o gatilho do leito dele, nada é devido e ele aparece como{' '}
        <Chip tom="positive">Em dia</Chip>. Ao atingir, passa a ser cobrado: sem nenhum relatório
        registrado, torna-se <Chip tom="critical">Sem relatório</Chip>.
      </p>

      <h4>2. Janela entre relatórios: de quanto em quanto tempo ele se repete</h4>
      <p>
        Registrado o primeiro relatório, o paciente volta à conformidade, mas por tempo determinado.
        A <strong>janela</strong> é o prazo máximo entre uma visita de auditoria e a seguinte.
      </p>
      <Tabela cabecalho={['Campo', 'O que define']} larguras={['210px']}>
        <tr><Key>Janela entre relatórios</Key>
          <td>Prazo máximo, em dias, entre uma visita e a próxima. Ultrapassado esse prazo, o
            paciente passa a <Chip tom="warn">Vencido</Chip>.</td></tr>
        <tr><Key>Alerta antecipado</Key>
          <td>Quantos dias antes do vencimento o paciente já deve ser sinalizado, passando a{' '}
            <Chip tom="attention">Próximo a vencer</Chip>. Serve para a visita ser programada antes
            do prazo estourar, e não depois.</td></tr>
      </Tabela>

      <h4>3. Permanência prolongada</h4>
      <p>
        Independente do relatório, internações que se estendem demais merecem acompanhamento
        próprio. São dois marcos, definidos em dias, e um botão que liga ou desliga esses alertas na
        operadora. Eles alimentam os indicadores de permanência do Painel Operacional e da
        Diretoria.
      </p>

      <h4>4. Responsáveis e situação da operadora</h4>
      <p>
        Quem responde pela operadora, nome exibido na Diretoria, e o botão que inclui ou retira a
        operadora do monitoramento e dos relatórios.
      </p>

      <Callout tipo="caution" titulo="Efeito imediato das alterações">
        Alterar um gatilho ou uma janela recalcula o status de <strong>todos os pacientes daquela
        operadora</strong>, inclusive os já internados. Encurtar a janela pode levar diversos
        pacientes à condição de vencido de uma só vez; alongá-la produz o efeito inverso.
      </Callout>

      <h3>Como a tela se organiza</h3>
      <p>A navegação ocorre em três níveis, do geral ao específico.</p>
      <Tabela cabecalho={['Nível', 'O que apresenta']} larguras={['175px']}>
        <tr><Key>Lista de operadoras</Key>
          <td>Todas as operadoras e a indicação de quais estão ativas. Permite criar uma nova.</td></tr>
        <tr><Key>Regras da operadora</Key>
          <td>Os quatro grupos descritos acima, além dos indicadores da operadora (internados,
            alertas, em dia e nível de serviço) e da lista de hospitais dela. O botão de salvar só é
            habilitado quando há alteração pendente.</td></tr>
        <tr><Key>Ficha do hospital</Key>
          <td>Indicadores da unidade, pacientes internados, escala de auditores, operadoras
            atendidas e dados cadastrais.</td></tr>
      </Tabela>
    </>
  )
}

export function ModuloMovimentacoes() {
  return (
    <>
      <h3>Objetivo</h3>
      <p>
        Registrar e permitir consultar tudo o que foi feito com os dados na plataforma, e acompanhar
        a atividade de cada conta. É a tela de prestação de contas e de investigação quando algo
        parece errado.
      </p>

      <h3>Quem acessa</h3>
      <p>
        O perfil analista, que existe justamente para observar. Os demais perfis não acessam a
        trilha.
      </p>

      <Callout tipo="info" titulo="O que a trilha registra">
        Registra ações sobre os dados: relatórios, pacientes, censos, hospitais, operadoras, equipe,
        escalas, contas e tarefas. A simples entrada no sistema não entra na trilha, porque a tela é
        sobre o que se fez com os dados, e não sobre quem entrou no sistema.
      </Callout>

      <h3>Período</h3>
      <p>
        Um seletor no topo vale para as duas abas, com as opções de hoje, 7 dias, 30 dias, 90 dias
        ou todo o histórico. Os períodos seguem o calendário de quem realiza a consulta.
      </p>

      <h3>Indicadores</h3>
      <Metrics>
        <Metric tom="brand" label="Movimentações" valor="Total no período" />
        <Metric tom="brand" label="Relatórios" valor="Registros de auditoria" />
        <Metric tom="positive" label="Censos" valor="Envios processados" />
        <Metric tom="attention" label="Cadastros" valor="Hospitais, operadoras, equipe e escala" />
        <Metric tom="critical" label="Falhas e negadas" valor="Tentativas recusadas" />
      </Metrics>

      <h3>Aba de movimentações</h3>
      <p>
        Os filtros são busca livre, por paciente, arquivo, e-mail ou hospital, além de usuário, tipo
        de registro e ação específica. As ações disponíveis mudam conforme o tipo escolhido.
      </p>
      <p>
        As colunas são quando, usuário, papel e ação. Cada linha pode ser expandida para mostrar os
        detalhes completos do registro, e há um atalho para filtrar tudo daquele usuário.
      </p>
      <p>
        O horário aparece em linguagem natural, como agora, há 5 minutos ou há 3 horas, e passa à
        data completa quando o evento é de outro dia. Cada tipo de registro tem cor própria.
      </p>

      <h3>Aba de usuários</h3>
      <p>
        Uma linha por conta, com usuário, papel, estado, contagem de movimentações, relatórios,
        censos e cadastros no período, e a última movimentação. Os estados possíveis são{' '}
        <Chip tom="positive">Ativo</Chip>, <Chip tom="warn">Suspenso</Chip> e{' '}
        <Chip tom="neutral">Removido</Chip>.
      </p>
      <p>
        <strong>Ver atividade</strong> leva à aba de movimentações já filtrada por aquele usuário. A
        aba é de consulta: as contas não são alteradas por aqui.
      </p>
    </>
  )
}

export function ModuloRegras() {
  return (
    <>
      <p>
        Para cada internação, o sistema compara três coisas: há quanto tempo o paciente está
        internado, qual o gatilho do tipo de leito dele e quando foi o último relatório. Dessa
        comparação saem os oito status abaixo.
      </p>

      <h3>Pacientes internados</h3>
      <Tabela cabecalho={['Status', 'Quando se aplica']} larguras={['205px']}>
        <tr><td><Chip tom="positive">Em dia</Chip></td>
          <td>Duas situações: o paciente ainda não atingiu o gatilho correspondente ao seu leito,
            não havendo relatório devido; ou já foi visitado dentro da janela, sem vencimento
            próximo.</td></tr>
        <tr><td><Chip tom="critical">Sem relatório</Chip></td>
          <td>Já passou do gatilho e nunca recebeu relatório.</td></tr>
        <tr><td><Chip tom="warn">Vencido</Chip></td>
          <td>O último relatório é mais antigo que a janela entre relatórios.</td></tr>
        <tr><td><Chip tom="attention">Próximo a vencer</Chip></td>
          <td>O vencimento está dentro do prazo de alerta antecipado da operadora.</td></tr>
      </Tabela>

      <h3>Pacientes com alta</h3>
      <Tabela cabecalho={['Status', 'Quando se aplica']} larguras={['205px']}>
        <tr><td><Chip tom="positive">Alta em conformidade</Chip></td>
          <td>Teve alta com o relatório em dia.</td></tr>
        <tr><td><Chip tom="critical">Alta sem relatório</Chip></td>
          <td>Teve alta sem nunca ter recebido relatório.</td></tr>
        <tr><td><Chip tom="warn">Alta com relatório vencido</Chip></td>
          <td>Teve alta com o relatório já fora da janela.</td></tr>
        <tr><td><Chip tom="neutral">Alta automática</Chip></td>
          <td>Alta inferida pelo sistema, porque o paciente deixou de aparecer nos censos. Não foi
            confirmada pelo hospital e merece verificação.</td></tr>
      </Tabela>

      <Callout tipo="rule" titulo="Não existe status de espera">
        Um paciente que ainda não atingiu o gatilho aparece como em dia, e não com um status próprio
        de espera. A razão é que nada é devido dele ainda: um rótulo separado sugeriria uma
        pendência que não existe e inflaria a lista de coisas a fazer.
      </Callout>

      <h3>Permanência prolongada</h3>
      <p>
        Independente do relatório, o sistema marca internações longas em dois níveis configuráveis
        por operadora, prolongada e avançada. Esses marcadores aparecem na coluna de permanência do
        Painel Operacional<SoGestao>, nos indicadores da Diretoria</SoGestao> e nos filtros
        rápidos. São calculados
        apenas para pacientes ainda internados.
      </p>

      <h3>Data de referência</h3>
      <p>
        Todos os cálculos usam uma data de referência do sistema, exibida no subtítulo das telas. É
        ela que garante que todas as telas concordem entre si sobre quantos dias se passaram.
      </p>
    </>
  )
}

export function ModuloProgresso() {
  return (
    <>
      <h3>Objetivo</h3>
      <p>
        Acompanhar <strong>o avanço da construção da própria plataforma</strong>, módulo a módulo:
        o que já está entregue, o que está sendo construído e o que ainda será. É informação sobre o
        projeto, e não sobre a operação de auditoria.
      </p>

      <h3>Quem acessa</h3>
      <p>
        <strong>Diretoria</strong>, para acompanhar o andamento da obra. O conteúdo diz respeito ao
        que foi contratado e ao que já foi entregue, e por isso não alcança quem trabalha na
        assistência.
      </p>
      <p>
        A tela é <strong>somente leitura</strong>: os números são acompanhados, não editados.
      </p>

      <Callout tipo="info" titulo="Nenhum número desta tela vem da operação">
        Os percentuais são <strong>acompanhamento de obra</strong>, apurados na conferência do que
        já está construído, e não saem das internações, dos censos nem dos relatórios. A data da
        última conferência aparece na tela, para os números não serem lidos como se fossem de hoje.
      </Callout>

      <h3>Como a tela se organiza</h3>
      <p>
        O topo traz o <strong>avanço geral do projeto</strong>, que é a média dos módulos listados
        abaixo. Em seguida, a legenda das seis etapas e o quadro, dividido em{' '}
        <strong>quatro grupos</strong>, do mais adiantado ao mais distante, cada um com a contagem
        de módulos.
      </p>
      <Tabela cabecalho={['Grupo', 'O que reúne']} larguras={['175px']}>
        <tr><Key>Em construção</Key><td>Módulos em desenvolvimento no momento.</td></tr>
        <tr><Key>Iniciados</Key><td>Módulos que já saíram do papel, mas ainda não estão em construção plena.</td></tr>
        <tr><Key>A construir</Key><td>Módulos previstos, com escopo definido e desenvolvimento ainda não começado.</td></tr>
        <tr><Key>A estudar</Key><td>Módulos ainda em avaliação, sem escopo fechado.</td></tr>
      </Tabela>

      <h3>As seis etapas de cada módulo</h3>
      <p>
        Todo módulo percorre a mesma trilha, e cada linha da tela mostra em qual ponto dela o módulo
        está. O percentual exibido é a média do avanço das seis etapas.
      </p>
      <ol>
        <li><strong>Escopo e proposta</strong></li>
        <li><strong>Aprovação do front</strong></li>
        <li><strong>Em desenvolvimento</strong></li>
        <li><strong>Entrega do módulo</strong></li>
        <li><strong>Testes e ajustes</strong></li>
        <li><strong>Entrega final</strong></li>
      </ol>
      <p>
        Cada etapa aparece como <strong>concluída</strong>, em andamento, com o percentual ao lado,
        ou não iniciada, e exibe as datas de <strong>início</strong> e <strong>até</strong> quando
        há prazo definido. Um resumo acima da trilha informa quantas das seis já foram concluídas e
        em qual etapa o módulo está. <strong>Mais de uma etapa pode estar em andamento ao mesmo
        tempo</strong>, porque na prática elas se sobrepõem: os testes começam antes de a entrega
        terminar. Módulo que ainda não começou não exibe trilha.
      </p>

      <h3>Duas etiquetas que aparecem na linha do módulo</h3>
      <Tabela cabecalho={['Etiqueta', 'O que indica']} larguras={['175px']}>
        <tr><Key>Ajustado</Key>
          <td>O valor exibido foi atualizado depois da conferência de origem, e é o mais recente. O
            nome de quem atualizou aparece ao passar o cursor.</td></tr>
        <tr><Key>Etapa estimada</Key>
          <td>A conferência registrou o percentual do módulo, mas não em qual etapa ele estava, e a
            posição na trilha foi deduzida do avanço. Esses módulos não devem ser lidos como
            apurados etapa a etapa. A etiqueta deixa de aparecer quando o módulo recebe uma
            atualização.</td></tr>
      </Tabela>

      <h3>De onde vêm os números</h3>
      <p>
        O ponto de partida é a <strong>conferência do que já está construído</strong>, feita contra
        o código, cuja data aparece no rodapé da tela. A partir dela o avanço é mantido em dia, e
        os módulos atualizados desse modo ficam marcados como{' '}
        <strong>ajustado</strong>, com o nome de quem os atualizou.
      </p>
      <p>
        Nenhum percentual é digitado diretamente: o do módulo é sempre a{' '}
        <strong>média das suas seis etapas</strong>, e o avanço geral do topo é a média dos módulos.
        É por isso que os números do topo e da lista nunca se contradizem, e que basta olhar a
        trilha de um módulo para entender o percentual dele. Os prazos, por sua vez, admitem tanto
        uma data quanto uma previsão aproximada, de modo que nem toda etapa traz um dia exato.
      </p>

      <Callout tipo="caution" titulo="A data do rodapé é a da conferência, não a do último ajuste">
        O rodapé informa a data da conferência que originou os números, e ela só muda quando há uma
        conferência nova. Uma atualização pontual de módulo não altera essa data, de modo que o
        rodapé pode indicar uma data anterior à do avanço mais recente exibido na lista.
      </Callout>
    </>
  )
}
