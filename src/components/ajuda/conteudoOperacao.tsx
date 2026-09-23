// Conteúdo dos módulos da área de Operação: o trabalho do dia a dia.
// Cada módulo declara no catálogo a tela que documenta, e só chega a quem
// acessa essa tela.
import { Callout, Chip, Key, Metric, Metrics, Passo, Passos, Tabela } from './blocos'

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
        <tr><Key>Longa permanência</Key><td>Dois filtros, de 10 e de 30 dias, que usam os marcadores reais da operadora e não uma contagem fixa. São mutuamente exclusivos.</td></tr>
        <tr><Key>Mais de 30 dias</Key><td>Contagem bruta de dias de internação, independente da regra da operadora.</td></tr>
        <tr><Key>Altas</Key><td>Troca a base da lista para os pacientes que já saíram, em vez dos internados.</td></tr>
        <tr><Key>Ordenação</Key><td>Padrão, mais dias sem relatório, ou mais dias internado. Na primeira opção, quem nunca teve relatório vai ao topo.</td></tr>
      </Tabela>

      <h3>Colunas da tabela</h3>
      <Tabela cabecalho={['Coluna', 'Conteúdo']} larguras={['150px']}>
        <tr><Key>Relatório</Key><td>Pastilha colorida de status, detalhada no{' '}
          <button type="button" className="aj-link" onClick={() => irPara('regras')}>anexo de regras</button>.
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
        <tr><Key>Clicar numa linha</Key><td>Abre a <strong>ficha rápida do paciente</strong> em painel lateral: dias internado, dias sem relatório, leito, timeline da internação e, para o perfil técnico, o formulário de registrar relatório.</td></tr>
        <tr><Key>Clicar no hospital</Key><td>Abre a ficha do hospital, com indicadores, operadoras atendidas, dados cadastrais e histórico de censos sob demanda.</td></tr>
        <tr><Key>Adicionar paciente</Key><td>Cadastro manual: operadora, hospital, nome, atendimento, data de entrada e, opcionalmente, leito, especialidade e médico. Não duplica: se o atendimento já existir no hospital, avisa que o paciente não foi duplicado.</td></tr>
        <tr><Key>Exportar</Key><td>Gera a planilha de controle de auditoria, da operadora aberta ou de todas num único arquivo, com uma aba por hospital.</td></tr>
        <tr><Key>Atualizar</Key><td>Recarrega lista, indicadores e contagens da barra lateral.</td></tr>
      </Tabela>
    </>
  )
}

export function ModuloPaciente() {
  return (
    <>
      <h3>Objetivo</h3>
      <p>
        Reunir tudo sobre uma internação: situação do relatório, dados cadastrais corrigíveis,
        relatórios já registrados com seus documentos anexos e o histórico completo da internação.
      </p>

      <h3>Como se chega</h3>
      <p>
        Pelo botão de ver completo na ficha rápida do Painel Operacional, ou por link direto. A
        ficha em si não é restrita por perfil, mas <strong>o registro de relatório é exclusivo do
        perfil técnico</strong>, e cada pessoa continua vendo apenas os pacientes dos hospitais do
        seu escopo.
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
        <tr><Key>Recém-nascido</Key><td><Chip tom="neutral" plain>Não</Chip></td><td>O sistema preenche a partir da idade.</td></tr>
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
        Lista os relatórios de auditoria já registrados, com contador. Para o perfil técnico, o
        botão de registrar abre o formulário na própria tela, com três campos.
      </p>
      <ul>
        <li><strong>Data da visita</strong>, obrigatória, já preenchida com a data de hoje.</li>
        <li><strong>Médico auditor</strong>, campo com busca entre os médicos ativos cadastrados em
          Cadastros, aceitando também texto livre.</li>
        <li><strong>Observação</strong>, em texto livre.</li>
      </ul>
      <p>
        Cada relatório aparece como um cartão com borda colorida pelo papel de quem o registrou, com
        data e hora, autor, médico responsável e, quando há anexo, o botão de baixar o documento.
      </p>

      <h3>Timeline</h3>
      <p>
        Histórico completo da internação, do mais recente para o mais antigo, com o marco de hoje no
        topo. Registra admissão, relatórios externos, pareceres internos, mudanças de status, altas
        automáticas, edições manuais e pendências. Relatórios internos exibem o autor; os externos,
        o médico responsável.
      </p>
    </>
  )
}

export function ModuloKanban() {
  return (
    <>
      <h3>Objetivo</h3>
      <p>
        Reunir as pendências da equipe em um quadro único, separadas por tipo: pacientes que
        precisam de relatório, visitas já marcadas, visitas cujo horário passou e hospitais que não
        enviaram o censo.
      </p>

      <h3>Como o quadro funciona</h3>
      <p>
        O quadro é dividido em colunas, e <strong>cada coluna reúne um tipo de pendência</strong>.
        Uma tarefa permanece na sua coluna até ser resolvida, e então deixa o quadro. As colunas não
        são fases de um mesmo item: indicam o tipo de providência necessária. A exceção é o
        agendamento, que de fato move o card, conforme descrito adiante.
      </p>

      <h3>As quatro colunas</h3>
      <Tabela cabecalho={['Coluna', 'O que reúne', 'Como a tarefa é resolvida']} larguras={['160px', undefined, '215px']}>
        <tr><Key>Sem relatório</Key>
          <td>Internados sem relatório de auditoria e sem visita marcada.</td>
          <td>Marcando a visita ou registrando o relatório.</td></tr>
        <tr><Key>Aguardando visita</Key>
          <td>Pacientes com visita marcada, ainda dentro do prazo.</td>
          <td>Registrando o relatório depois da visita.</td></tr>
        <tr><Key>Visitas atrasadas</Key>
          <td>Visitas cujo horário combinado já passou sem que o relatório fosse registrado.</td>
          <td>Cobrando o auditor responsável, e registrando o relatório ou remarcando a visita.</td></tr>
        <tr><Key>Cobrar censo</Key>
          <td>Hospitais que não enviaram o censo do dia anterior. Aqui a tarefa é por hospital, e não por paciente.</td>
          <td>Registrando a cobrança junto ao hospital.</td></tr>
      </Tabela>

      <h3>O que cada perfil vê</h3>
      <p>
        As colunas seguem a divisão de responsabilidades: cada perfil recebe a fila que é dele, e
        não o quadro inteiro.
      </p>
      <ul>
        <li>O perfil <strong>técnico</strong> vê as três colunas de pacientes, que são a agenda de
          visitas dele, sem a cobrança de censo.</li>
        <li>O perfil <strong>administrativo</strong> vê a coluna de cobrança de censo, que é a
          providência dele junto aos hospitais.</li>
        <li>A <strong>administração do sistema</strong> vê o quadro completo, para supervisão.</li>
        <li>O perfil <strong>analista</strong> acompanha o quadro sem executar as tarefas, por ser
          um perfil de observação.</li>
      </ul>

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
          cadastrados em Cadastros, que são os mesmos oferecidos ao registrar um relatório.</li>
      </ul>
      <p>
        Marcada a visita, o card <strong>sai de "Sem relatório" e passa para "Aguardando
        visita"</strong>, com a data, o horário e o responsável visíveis. Passado o horário
        combinado sem relatório registrado, ele vai para "Visitas atrasadas", e o card diz de quem
        era a visita, para a cobrança ter destinatário. A visita também pode ser cancelada.
      </p>

      <Callout tipo="rule" titulo="Quem marca a visita">
        O agendamento pertence a quem realiza a visita, e por isso é feito pelo perfil técnico, com
        a administração do sistema supervisionando. Os perfis de observação acompanham o quadro,
        mas não marcam nem cancelam visitas.
      </Callout>

      <h3>O que o card mostra</h3>
      <Tabela cabecalho={['Tipo de tarefa', 'O que apresenta']} larguras={['175px']}>
        <tr><Key>Paciente</Key>
          <td>Operadora, nome do paciente, hospital e número de atendimento, além dos dias sem
            relatório. Quando há visita marcada, traz a data, o horário e o responsável; quando
            atrasada, o card inteiro é destacado, com a indicação de quando era.</td></tr>
        <tr><Key>Cobrança de censo</Key>
          <td>Hospital, o dia cujo censo não foi recebido e a data do último censo enviado. O
            indicador fica <Chip tom="critical">Vermelho acima de 3 dias</Chip>.</td></tr>
      </Tabela>
      <p>
        Os cards de paciente trazem ainda etiquetas que explicam por que aquele caso merece atenção:
        leito de UTI, longa permanência e nunca visitado.
      </p>

      <h3>Priorizar o quadro</h3>
      <p>
        Uma barra acima das colunas recorta o quadro inteiro. Tudo é aplicado de imediato, sobre o
        que já está em tela.
      </p>
      <Tabela cabecalho={['Controle', 'O que faz']} larguras={['185px']}>
        <tr><Key>Busca</Key>
          <td>Localiza tarefas em todas as colunas ao mesmo tempo, por paciente, atendimento, leito,
            médico e convênio. Acentos e maiúsculas são desconsiderados.</td></tr>
        <tr><Key>Chips de urgência</Key>
          <td>Quatro recortes combináveis: <strong>Urgentes</strong> (relatório vencido, ou em
            monitoramento sem nenhuma visita), <strong>UTI</strong>, <strong>Longa
            permanência</strong> e <strong>Nunca visitados</strong>. Cada chip mostra quantos casos
            existem antes de ser acionado, e o que levaria a nenhum card aparece visivelmente
            vazio.</td></tr>
        <tr><Key>Hospital</Key><td>Restringe o quadro a uma unidade.</td></tr>
        <tr><Key>Ordenar por</Key>
          <td>Prioridade, mais dias sem relatório, mais dias internado, nome do paciente ou
            hospital.</td></tr>
      </Tabela>
      <p>
        Com algum filtro ativo, a barra informa <strong>quantas tarefas estão visíveis e quantas
        existem no total</strong>, e oferece a opção de limpar os filtros, para o recorte nunca
        passar despercebido. Não há filtro de operadora nem de período: o quadro já apresenta
        somente os hospitais que o usuário acompanha.
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
