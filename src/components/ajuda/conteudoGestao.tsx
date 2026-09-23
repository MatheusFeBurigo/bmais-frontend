// Conteúdo dos módulos da área de Gestão: Dashboard da Diretoria, Painel do
// Gestor e Volumetria.
//
// São os módulos de acesso mais restrito da Ajuda. O catálogo os prende às telas
// 'diretoria', 'gestor' e 'volumetria', então um perfil da operação não os
// encontra no índice:
// números consolidados de desempenho e de rede são informação de gestão, e a
// documentação respeita a mesma divisão de responsabilidades da aplicação.
import { Callout, Chip, Key, Metric, Metrics, Tabela } from './blocos'

export function ModuloDiretoria() {
  return (
    <>
      <h3>Objetivo</h3>
      <p>
        Apresentar o desempenho do serviço de auditoria em números agregados de todas as operadoras:
        nível de serviço, volume de alertas, produtividade em relatórios e concentração da rede.
        Não é uma tela de trabalho, e sim de acompanhamento.
      </p>

      <h3>Quem acessa</h3>
      <p>
        Diretoria e administração do sistema. É a visão consolidada do serviço, e por isso fica
        fora do alcance dos perfis de operação, que trabalham paciente a paciente.
      </p>

      <h3>Os quatro indicadores principais</h3>
      <Metrics>
        <Metric tom="brand" label="Nível de serviço" valor="SLA global"
          nota="Verde a partir de 50 por cento, vermelho abaixo" />
        <Metric tom="critical" label="Alertas críticos" valor="Sem relatório mais vencidos"
          nota="Somados em todas as operadoras" />
        <Metric tom="neutral" label="Pacientes ativos" valor="Total de internados"
          nota="Com longa permanência e altas" />
        <Metric tom="positive" label="Relatórios registrados" valor="Produção recente"
          nota="Últimos 7 dias, com 30 dias e total" />
      </Metrics>

      <h3>Composição</h3>
      <ol>
        <li><strong>Status de relatórios</strong>, em gráfico de rosca com a distribuição global, ao
          lado dos <strong>relatórios registrados por semana</strong>, que mostram a produção no
          tempo.</li>
        <li><strong>Resumo por operadora</strong>, a tabela central da tela.</li>
        <li><strong>Rede por operadora</strong>, com quantos hospitais cada uma movimenta.</li>
        <li><strong>Alertas por operadora</strong>, <strong>top hospitais</strong> por internados
          ativos e <strong>inteligência de dados</strong>.</li>
      </ol>

      <h3>Resumo por operadora</h3>
      <Tabela cabecalho={['Coluna', 'Significado']} larguras={['175px']}>
        <tr><Key>Internados</Key><td>Total de pacientes ativos.</td></tr>
        <tr><Key>Em monitoramento</Key><td>Quantos já passaram do gatilho.</td></tr>
        <tr><td><Chip tom="critical">Sem relatório</Chip></td><td>Nunca receberam relatório.</td></tr>
        <tr><td><Chip tom="warn">Vencido</Chip></td><td>Passaram da janela entre relatórios.</td></tr>
        <tr><td><Chip tom="attention">Próximo</Chip></td><td>Vencem nos próximos dias.</td></tr>
        <tr><td><Chip tom="positive">Em dia</Chip></td><td>Em conformidade.</td></tr>
        <tr><Key>Nível de serviço</Key><td>Percentual de conformidade, com barra de progresso.</td></tr>
        <tr><Key>Longa permanência</Key><td>Pacientes nos dois marcos, prolongado e avançado.</td></tr>
        <tr><Key>Altas</Key><td>Altas do período.</td></tr>
        <tr><Key>Responsável</Key><td>Quem responde pela operadora, definido em Configurações.</td></tr>
      </Tabela>
      <p>A tabela fecha com uma linha de total geral, consolidando todas as operadoras.</p>

      <h3>Inteligência de dados</h3>
      <p>Quatro leituras dos indicadores do momento, escritas como recomendação e não como número solto.</p>
      <Tabela cabecalho={['Leitura', 'O que diz']} larguras={['185px']}>
        <tr><Key>Próximos a vencer</Key><td>Quantos pacientes vencem em 1 a 3 dias, com a orientação de priorizar a visita.</td></tr>
        <tr><Key>Cobertura de relatórios</Key><td>Percentual de relatórios em dia sobre os pacientes em monitoramento. Sem ninguém em monitoramento, a cobertura é total.</td></tr>
        <tr><Key>Tendência semanal</Key><td>Compara os relatórios desta semana com os da anterior, indicando alta, queda ou estabilidade.</td></tr>
        <tr><Key>Longa permanência</Key><td>Quantos internados passaram dos limites, candidatos a revisão de alta.</td></tr>
      </Tabela>

      <h3>Ações</h3>
      <ul>
        <li><strong>Exportar</strong>: a planilha de controle é gerada por operadora, escolhida num
          seletor ao lado do botão. Sem escolha, a tela pede a seleção em vez de baixar algo
          arbitrário.</li>
        <li><strong>Atualizar</strong>: recarrega todos os indicadores.</li>
        <li><strong>Dados de demonstração</strong>: insere pacientes e relatórios fictícios para
          apresentar a plataforma.</li>
      </ul>
      <p>
        A tela não tem filtros, pois é sempre o consolidado global. Os quatro indicadores do topo
        aparecem imediatamente e os gráficos entram logo em seguida.
      </p>
    </>
  )
}

export function ModuloGestor() {
  return (
    <>
      <h3>Objetivo</h3>
      <p>
        Acompanhar o movimento da operação: quantos pacientes entraram, quantos tiveram alta, como a
        permanência se distribui e onde os internados estão concentrados por hospital, região e
        operadora. É a tela de análise de fluxo, complementar ao controle de relatórios do Painel
        Operacional.
      </p>

      <h3>Quem acessa</h3>
      <p>
        Gestão e diretoria. É a tela inicial do gestor, que acompanha o movimento sem trabalhar a
        lista de pacientes um a um.
      </p>

      <h3>Os cinco indicadores</h3>
      <Metrics>
        <Metric tom="brand" label="Internados" valor="Total ativo"
          nota="No momento, ou ao fim do período escolhido" />
        <Metric tom="brand" label="Até 9 dias" valor="Permanência curta" />
        <Metric tom="warn" label="10 a 29 dias" valor="Permanência prolongada" />
        <Metric tom="critical" label="30 dias ou mais" valor="Permanência crítica" />
        <Metric tom="positive" label="Altas" valor="Altas do dia"
          nota="Acompanhadas das novas entradas" />
      </Metrics>
      <p>Todos filtram a lista de pacientes ao serem clicados.</p>

      <h3>Gráficos</h3>
      <Tabela cabecalho={['Gráfico', 'O que mostra e como se usa']} larguras={['210px']}>
        <tr><Key>Ocupação por dia</Key><td>Linha preenchida mostrando o nível de ocupação ao longo do tempo, ou seja, quantos pacientes estavam internados em cada dia.</td></tr>
        <tr><Key>Fluxo diário</Key><td>Barras de entradas e altas, mais a linha de saldo entre elas, que muda de cor quando fica negativa. As barras ficam lado a lado, e não empilhadas, porque têm efeitos opostos sobre a ocupação. Clicar numa coluna abre aquele dia, ou aquele intervalo quando as barras agrupam semana ou mês.</td></tr>
        <tr><Key>Permanência por período</Key><td>Distribuição dos internados nas faixas de permanência. Clicar numa faixa lista os pacientes dela abaixo.</td></tr>
        <tr><Key>Internados por hospital</Key><td>Ranking das unidades. Clicar numa barra filtra o painel por aquele hospital; clicar de novo desfaz.</td></tr>
        <tr><Key>Internados por região</Key><td>Concentração geográfica. Só aparece quando há mais de uma região.</td></tr>
        <tr><Key>Hospitais por operadora</Key><td>Unidades distintas com movimento no período. Só aparece com mais de uma operadora, porque um ranking de um item não compara nada.</td></tr>
      </Tabela>

      <h3>Filtros</h3>
      <ul>
        <li><strong>Operadora</strong>, em botões no topo. É um filtro global que refaz a consulta
          inteira, e trocar de operadora limpa o hospital, que pode não pertencer à nova.</li>
        <li><strong>Hospital e região</strong> vêm dos cliques nos gráficos. Clicar de novo na mesma
          barra desfaz.</li>
        <li><strong>Janela</strong> de 30 dias, 90 dias, 6 meses ou 1 ano, que define o alcance e o
          agrupamento do gráfico de fluxo.</li>
        <li><strong>Período</strong>, um dia específico pelo calendário ou pelo gráfico, ou um
          intervalo.</li>
        <li><strong>Faixa de permanência</strong>, em pastilhas ao lado da tabela, sincronizadas com
          os indicadores do topo e com o gráfico de rosca.</li>
        <li>Todos os filtros ativos aparecem como pastilhas removíveis, com a opção de limpar tudo.</li>
      </ul>

      <h3>Médias do período</h3>
      <p>
        No modo geral, três cartões resumem a janela escolhida: média de internados por dia, total
        de entradas e total de altas com a média diária. Eles desaparecem quando um período
        específico é selecionado, porque ao analisar um único dia as médias da janela não se
        aplicam.
      </p>

      <h3>Lista de pacientes</h3>
      <p>
        Abaixo dos gráficos, a lista acompanha exatamente os filtros aplicados, e o título diz o
        recorte em vigor. Clicar num paciente abre a ficha rápida.
      </p>
    </>
  )
}

export function ModuloVolumetria() {
  return (
    <>
      <h3>Objetivo</h3>
      <p>
        Mostrar ao coordenador <strong>quem está na equipe e quantas demandas cada pessoa tem
        agora</strong>, para que os hospitais sejam divididos com critério. É o quadro de Tarefas de
        cada funcionário, resumido em um cartão por pessoa, com o aviso de quem passou da capacidade
        e de quais hospitais ficaram sem ninguém responsável.
      </p>

      <h3>Quem acessa</h3>
      <p>
        Os perfis de <strong>coordenação</strong>, administrativa e técnica, e a administração do
        sistema. Cada coordenador enxerga apenas o seu grupo; a administração vê os dois e alterna
        entre eles por um seletor no topo, com os nomes <strong>Técnicos</strong> e{' '}
        <strong>Administrativos</strong>.
      </p>

      <h3>Como a carga é montada</h3>
      <p>
        Uma pessoa recebe hospitais, e <strong>tudo o que chega nesses hospitais vira demanda
        dela</strong>. O que conta como demanda muda conforme o grupo, e são exatamente as colunas
        que a pessoa vê no próprio quadro de Tarefas.
      </p>
      <Tabela cabecalho={['Grupo', 'O que conta como demanda']} larguras={['175px']}>
        <tr><Key>Técnicos</Key>
          <td>Pacientes sem relatório, aguardando visita, com visita atrasada, com relatório vencido
            e próximos de vencer.</td></tr>
        <tr><Key>Administrativos</Key>
          <td>Hospitais com paciente internado e sem censo recebido.</td></tr>
      </Tabela>
      <p>
        As demandas são convertidas em <strong>horas estimadas</strong> e comparadas com a
        capacidade diária da pessoa, o que produz os <strong>dias de fila</strong>: quanto tempo o
        trabalho acumulado levaria para ser vencido no ritmo dela. É essa comparação, e não a
        contagem bruta, que classifica cada um em três níveis. No grupo técnico entra ainda o{' '}
        <strong>percentual de prazo</strong>, que pega quem tem fila curta, mas com tudo vencendo ao
        mesmo tempo.
      </p>
      <p>
        No grupo técnico, a estimativa parte dos minutos do tipo de leito e é ajustada por
        multiplicadores de longa permanência e de reanálise, quando o paciente já tem relatório
        anterior. No administrativo, cada hospital a cobrar conta como um caso, porque a unidade de
        trabalho é a ligação para o hospital, e não o número de dias devidos.
      </p>
      <Metrics>
        <Metric tom="brand" label="Dentro da capacidade" valor="Fila normal"
          nota="O acumulado cabe no ritmo da pessoa" />
        <Metric tom="attention" label="Atenção" valor="Fila crescendo"
          nota="Passou do primeiro limiar de dias de fila" />
        <Metric tom="critical" label="Sobrecarga" valor="Fila fora do prazo"
          nota="O acumulado não é vencido dentro do prazo esperado" />
      </Metrics>

      <h3>Os quatro indicadores do topo</h3>
      <Tabela cabecalho={['Indicador', 'O que apresenta']} larguras={['235px']}>
        <tr><Key>Equipe</Key>
          <td>Quantas pessoas há no grupo, com quantas estão em sobrecarga, quantas em atenção e
            quantas têm área definida.</td></tr>
        <tr><Key>Pacientes sob responsabilidade</Key>
          <td>No grupo de técnicos: internados nos hospitais da equipe, com quantos já estão em
            monitoramento.</td></tr>
        <tr><Key>Hospitais sob responsabilidade</Key>
          <td>No grupo de administrativos: unidades com pelo menos uma pessoa vinculada.</td></tr>
        <tr><Key>Demandas abertas</Key>
          <td>Total de pendências do grupo, com a indicação do que está sendo contado.</td></tr>
        <tr><Key>Hospitais sem cobertura</Key>
          <td>Unidades com demanda e ninguém responsável. Clicar leva direto à lista delas, para a
            atribuição ser feita na hora.</td></tr>
      </Tabela>

      <h3>Os blocos da tela</h3>
      <ol>
        <li><strong>Resumo</strong>, com os indicadores acima.</li>
        <li><strong>Equipe</strong>: um cartão por pessoa, com o nível de carga, as horas estimadas
          e a quebra das demandas pelos mesmos nomes das colunas de Tarefas. A lista pode ser
          ordenada por <strong>Maior carga</strong> ou por <strong>Nome</strong>.</li>
        <li><strong>Hospitais sem cobertura</strong>, que só aparece quando há alguma unidade nessa
          condição.</li>
        <li><strong>Comparativo</strong>, gráfico da carga pessoa a pessoa, recolhido por padrão.</li>
        <li><strong>Parâmetros de carga</strong>, também recolhido, descrito adiante.</li>
      </ol>

      <h3>Painel da pessoa</h3>
      <p>
        Clicar num cartão abre o painel lateral daquela pessoa, que é <strong>onde a área dela é
        definida</strong>. O painel mostra demandas, pacientes, horas estimadas, dias de fila e o
        percentual do prazo consumido, além da quebra por tipo de demanda.
      </p>
      <Tabela cabecalho={['Ação', 'Efeito']} larguras={['185px']}>
        <tr><Key>Adicionar hospital</Key>
          <td>Vincula a unidade à pessoa. A partir daí, as demandas daquele hospital passam a contar
            na carga dela.</td></tr>
        <tr><Key>Remover hospital</Key>
          <td>Desfaz o vínculo. A unidade pode ficar sem cobertura, e nesse caso reaparece no
            indicador e na lista correspondente.</td></tr>
        <tr><Key>Capacidade</Key>
          <td>Horas de análise por dia daquela pessoa. É a referência dos dias de fila. Sem ajuste,
            vale o padrão do grupo, e há um botão para voltar a ele.</td></tr>
      </Tabela>
      <p>
        Cada hospital da lista traz quantos pacientes tem, ou há quantos dias está sem censo, e
        avisa quando é <strong>compartilhado com outras pessoas</strong>. A unidade que concentra
        mais horas fica destacada, indicando onde a carga daquela pessoa se acumula.
      </p>

      <Callout tipo="caution" titulo="Vincular hospital muda o que a pessoa enxerga">
        A lista de hospitais desta tela é a mesma do cadastro da conta: ao receber hospitais, a
        pessoa deixa de ver a rede inteira e passa a ver apenas essas unidades, em todas as telas.
        Pelo mesmo motivo, <strong>remover o último hospital de alguém faz essa pessoa voltar a
        enxergar a rede inteira</strong>, e não a ficar sem nada.
      </Callout>

      <Callout tipo="info" titulo="Hospital compartilhado conta para cada pessoa">
        Uma unidade pode ser coberta por mais de uma pessoa, e nesse caso ela conta inteira para
        cada uma, porque é o trabalho que cada uma enxerga. A soma das cargas individuais fica maior
        que o total do grupo, e isso é sobreposição, não erro.
      </Callout>

      <Callout tipo="caution" titulo="Pessoa sem área definida">
        Quem não tem hospitais vinculados enxerga <strong>toda a rede</strong>, e por isso não entra
        no cálculo de carga, no gráfico nem nas contagens do grupo: não há como medir a fila de quem
        não tem área delimitada. O cartão dessa pessoa aparece esmaecido, no fim da lista, e a
        convida a definir a área. Pelo mesmo motivo, <strong>ela não conta como cobertura</strong>:
        um hospital pode constar como sem cobertura mesmo havendo gente que, na prática, o enxerga.
      </Callout>

      <h3>Hospitais sem cobertura</h3>
      <p>
        Lista as unidades que <strong>têm demanda aberta e ninguém responsável</strong>, com as
        horas estimadas que estão sem dono. Cada linha traz um seletor para atribuir o hospital a
        alguém do grupo ali mesmo, e cada pessoa da lista aparece com os dias de fila dela, para a
        escolha recair sobre quem está mais folgado sem sair da tela.
      </p>

      <h3>Parâmetros de carga</h3>
      <p>
        O que a tela chama de sobrecarga é uma <strong>estimativa</strong>, e o coordenador a
        calibra neste bloco: minutos por tipo de caso, multiplicadores, capacidade padrão do grupo,
        janela de prazo e os limiares que separam os três níveis. O bloco informa quem calibrou e
        quando, e orienta a ajustar até a carga bater com a realidade da equipe. Os limiares são
        absolutos, e não uma comparação com a média: se a equipe inteira está sobrecarregada, todos
        aparecem assim, o que é intencional.
      </p>
      <p>
        No grupo administrativo não há janela de prazo nem limiares de prazo, porque toda cobrança
        de censo já está vencida por definição e o indicador repetiria o de fila. Os dias contados
        são sempre corridos, pois o sistema não trabalha com calendário de dias úteis.
      </p>
      <Callout tipo="caution" titulo="Restaurar apaga a calibração inteira">
        A restauração devolve o grupo aos valores de fábrica e <strong>desfaz também as capacidades
        individuais</strong> definidas pessoa a pessoa. Por isso a ação pede confirmação.
      </Callout>

      <Callout tipo="info" titulo="Única tela em que o coordenador escreve">
        Os perfis de coordenação observam as demais telas sem alterá-las. Definir a área de cada
        pessoa e calibrar os parâmetros, aqui, são as únicas alterações que eles executam no
        sistema, e ficam registradas em Movimentações. Cada coordenador atua apenas sobre o próprio
        grupo, e a restrição vale também fora da tela.
      </Callout>
    </>
  )
}
