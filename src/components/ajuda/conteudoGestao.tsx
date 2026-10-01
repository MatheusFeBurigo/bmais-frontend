// Conteúdo dos módulos da área de Gestão: Dashboard da Diretoria, Painel do
// Gestor e Volumetria.
//
// São os módulos de acesso mais restrito da Ajuda. O catálogo os prende às telas
// 'diretoria', 'gestor' e 'volumetria', então um perfil da operação não os
// encontra no índice:
// números consolidados de desempenho e de rede são informação de gestão, e a
// documentação respeita a mesma divisão de responsabilidades da aplicação.
// O analista interno lê a Distribuição de tarefas, mas não os outros dois
// (acessoAjuda.ts).
import { lazy, Suspense, type ReactNode } from 'react'
import { Callout, Chip, Key, Metric, Metrics, Tabela } from './blocos'
import { ComoFazer, Tela } from './replica'
import {
  ReplicaDemandaXDistribuicao, ReplicaDividirCarga, ReplicaEquipe, ReplicaPainelPessoa,
  ReplicaParametros, ReplicaPorRegiao, ReplicaSemCobertura,
} from './exemplosDistribuicao'

// As réplicas do Gestor usam os gráficos reais, que puxam o Chart.js. Este
// arquivo também serve a Distribuição de tarefas, e o coordenador que só abre
// aquele módulo não deve baixar os gráficos: por isso entram sob demanda.
const gestor = () => import('./exemplosGestor')
const ReplicaMovimento = lazy(async () => ({ default: (await gestor()).ReplicaMovimento }))
const ReplicaFluxo = lazy(async () => ({ default: (await gestor()).ReplicaFluxo }))
const ReplicaFiltros = lazy(async () => ({ default: (await gestor()).ReplicaFiltros }))
const ReplicaPacientes = lazy(async () => ({ default: (await gestor()).ReplicaPacientes }))
// O bloco de produtividade da Distribuição de tarefas também é Chart.js.
const ReplicaProdutividade = lazy(async () => ({
  default: (await import('./exemplosProdutividade')).ReplicaProdutividade,
}))

/** Espaço reservado enquanto os gráficos carregam, para a página não pular. */
function Carregando({ altura, children }: { altura: number; children: ReactNode }) {
  return <Suspense fallback={<div style={{ height: altura }} />}>{children}</Suspense>
}

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
        Exclusiva da <strong>diretoria</strong>. É a visão consolidada do serviço, e por isso fica
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
        <strong>Gestão e diretoria</strong>. É a tela inicial do gestor, que acompanha o movimento
        sem trabalhar a lista de pacientes um a um. Os perfis de operação não entram.
      </p>

      <h3>Passo a passo</h3>
      <ComoFazer
        titulo="Ler o movimento do dia"
        passos={[
          { n: 1, titulo: 'Internados até o momento', corpo: <>Quantos pacientes estão internados agora, na operadora escolhida no topo. Clicar no cartão volta a lista de baixo para todos eles.</> },
          { n: 2, titulo: 'As faixas de permanência', corpo: <>Os três cartões do meio repartem os internados por tempo de internação: até 9 dias, de 10 a 29 e <strong>30 ou mais</strong>, que é a faixa crítica. Clicar num deles lista só aqueles pacientes.</> },
          { n: 3, titulo: 'Altas e entradas do dia', corpo: <>O número grande são as altas; abaixo, as novas entradas. Quando entram mais pacientes do que saem, a ocupação sobe.</> },
          { n: 4, titulo: 'As médias da janela', corpo: <>Resumem os dias da janela do gráfico de fluxo: internados por dia, entradas e altas no período. Somem quando um dia ou período específico é escolhido, porque aí as médias não se aplicam.</> },
        ]}
      >
        <Tela nome="Painel do Gestor" largura={960}
          descricao="Topo da tela no modo geral: todas as operadoras, os números de hoje e as médias dos últimos 30 dias.">
          <Carregando altura={300}><ReplicaMovimento marcas={{ internados: 1, faixas: 2, altas: 3, medias: 4 }} /></Carregando>
        </Tela>
      </ComoFazer>

      <ComoFazer
        titulo="Analisar um dia ou um período no gráfico de fluxo"
        passos={[
          { n: 1, titulo: 'Escolha a janela', corpo: <>30 dias, 90 dias, 6 meses ou 1 ano. Nas janelas longas as colunas agrupam semana ou mês.</> },
          { n: 2, titulo: 'Ocupação', corpo: <>Quantos pacientes estavam internados em cada dia. Mostra o nível, não o movimento.</> },
          { n: 3, titulo: 'Fluxo diário: clique numa coluna', corpo: <>Entradas e altas lado a lado, com a linha do saldo, que fica vermelha quando saem mais do que entram. <strong>Clicar numa coluna</strong> leva o painel inteiro para aquele dia, ou para aquela semana ou mês.</> },
          { n: 4, titulo: 'Ou escolha a data no calendário', corpo: <>Para ir direto a um dia, sem procurar a coluna.</> },
          { n: 5, titulo: 'Recolher', corpo: <>Fecha o gráfico e devolve o espaço aos números. Ao escolher um período ele se recolhe sozinho.</> },
          { n: 6, titulo: 'O período em análise', corpo: <>Com um período escolhido, indicadores, gráficos e lista passam a falar dele, e esta etiqueta diz qual é. O <strong>×</strong> dela desfaz a escolha.</> },
          { n: 7, titulo: 'Ver todo o período', corpo: <>Volta ao modo geral, com os números de hoje e as médias da janela.</> },
        ]}
      >
        <Tela nome="Painel do Gestor" largura={960}
          destaques={{
            '.janela-pills': 1,
            '.chart-card > div:nth-of-type(3)': 2,
            '.chart-card > div:nth-of-type(6)': 3,
            '.chart-date': 4,
            '.chart-toggle': 5,
          }}
          descricao="Gráfico de fluxo aberto, com os últimos 30 dias.">
          <Carregando altura={520}><ReplicaFluxo aberto /></Carregando>
        </Tela>
        <Tela nome="Painel do Gestor" largura={960}
          destaques={{ '.dia-abaixo .dia-chip': 6, '.dia-abaixo .btn-primary': 7 }}
          descricao="Depois de clicar numa coluna: o gráfico recolhe e o painel passa a mostrar o dia escolhido.">
          <Carregando altura={120}><ReplicaFluxo aberto={false} /></Carregando>
        </Tela>
      </ComoFazer>

      <ComoFazer
        titulo="Filtrar por operadora, hospital ou região"
        passos={[
          { n: 1, titulo: 'Escolha a operadora', corpo: <>É o filtro que refaz a consulta do painel inteiro. Trocar de operadora limpa o hospital escolhido, que pode não pertencer à nova.</> },
          { n: 2, titulo: 'Clique na barra de um hospital', corpo: <>O painel passa a mostrar só aquele hospital, e as outras barras ficam claras. Clicar de novo na mesma barra desfaz.</> },
          { n: 3, titulo: 'Ou na barra de uma região', corpo: <>Funciona igual. O gráfico só aparece quando os hospitais estão em mais de uma região.</> },
          { n: 4, titulo: 'Confira os filtros ativos', corpo: <>Cada filtro em vigor vira uma etiqueta; clicar nela remove só aquele filtro.</> },
          { n: 5, titulo: 'Limpar tudo', corpo: <>Tira todos os filtros de uma vez e volta ao painel completo.</> },
        ]}
      >
        <Tela nome="Painel do Gestor" largura={960}
          destaques={{
            '.op-pills': 1,
            '.aj-graficos > .chart-card:first-child > div:last-child': 2,
            '.aj-graficos > .chart-card:last-child > div:last-child': 3,
            '.filtros-ativos .filtro-chip': 4,
            '.filtros-limpar': 5,
          }}
          descricao="CarePlus escolhida no topo e o Hospital Santa Clara selecionado no gráfico.">
          <Carregando altura={420}><ReplicaFiltros /></Carregando>
        </Tela>
      </ComoFazer>

      <ComoFazer
        titulo="Listar os pacientes de uma faixa de permanência"
        passos={[
          { n: 1, titulo: 'Clique numa faixa do gráfico', corpo: <>A lista ao lado passa a mostrar só os internados daquela faixa. O mesmo vale para os cartões de faixa do topo.</> },
          { n: 2, titulo: 'Ou use as pastilhas da lista', corpo: <>São a mesma escolha, e ficam sincronizadas com o gráfico e com os cartões. <strong>Altas</strong> lista quem saiu no período.</> },
          { n: 3, titulo: 'Clique no paciente', corpo: <>Abre a ficha rápida dele, sem sair do painel.</> },
        ]}
      >
        <Tela nome="Painel do Gestor" largura={960}
          destaques={{
            '.chart-card > div:last-child': 1,
            '.aj-pills-faixa': 2,
            '.tbl-gestor tbody tr:first-child td:first-child': 3,
          }}
          descricao="Faixa de 30 dias ou mais escolhida: a lista mostra só esses pacientes.">
          <Carregando altura={340}><ReplicaPacientes /></Carregando>
        </Tela>
      </ComoFazer>

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
        Os perfis de <strong>coordenação</strong>, operacional e técnica. Cada coordenador
        enxerga apenas o seu grupo.
      </p>

      <h3>Passo a passo</h3>
      <p>
        Os exemplos mostram o grupo de técnicos. No grupo de operacionais a tela é a mesma, e a
        demanda de cada pessoa são os hospitais sem censo que ela precisa cobrar.
      </p>

      <ComoFazer
        titulo="Descobrir quem está sobrecarregado"
        passos={[
          { n: 1, titulo: 'Olhe o indicador Equipe', corpo: <>Ele diz quantas pessoas estão em <strong>sobrecarga</strong> e quantas em <strong>atenção</strong>. Fica vermelho quando há alguém em sobrecarga.</> },
          { n: 2, titulo: 'Leia o cartão de cada pessoa', corpo: <>O número grande são as <strong>demandas</strong> abertas, e o selo ao lado é o nível. A barra compara a pessoa com quem tem mais demandas no grupo, e a quebra usa os mesmos nomes das colunas de Tarefas. As horas e os dias de fila ficam nos gráficos mais abaixo e no painel da pessoa.</> },
          { n: 3, titulo: 'Ordene por Maior carga', corpo: <>É a ordem padrão: quem está em sobrecarga vem primeiro. <strong>Nome</strong> serve para achar alguém específico, e a lupa ao lado busca pelo nome.</> },
          { n: 4, titulo: 'Repare em quem está sem área', corpo: <>O cartão esmaecido, no fim, é de quem não tem hospitais: vê a rede inteira e por isso <strong>não entra na conta</strong> de carga. Clique nele para definir a área.</> },
        ]}
      >
        <Tela nome="Distribuição de tarefas" largura={960}
          destaques={{
            '.vol-grade > .vol-card-wrap:first-child .vol-card': 2,
            '.vol-toolbar select': 3,
            '.vol-card.sem-area': 4,
          }}
          descricao="Grupo de técnicos com uma pessoa em cada situação: sobrecarga, atenção, normal e sem área definida.">
          <ReplicaEquipe marcas={{ equipe: 1 }} />
        </Tela>
      </ComoFazer>

      <ComoFazer
        titulo="Redistribuir os hospitais de quem está sobrecarregado"
        passos={[
          { n: 1, titulo: 'Clique no cartão da pessoa', corpo: <>Abre o painel dela ao lado, sem sair da tela.</> },
          { n: 2, titulo: 'Veja onde a carga se concentra', corpo: <>Os números do topo repetem o cartão, com o percentual do <strong>prazo</strong>: quanto da capacidade dos próximos dias os casos que vencem nesse período consomem. Na lista, o hospital com mais horas aparece em vermelho.</> },
          { n: 3, titulo: 'Remova o hospital que vai sair dela', corpo: <>O <strong>×</strong> desfaz o vínculo e a carga dele sai da conta dela na hora. Se ninguém mais cobrir o hospital, ele passa para <strong>Hospitais sem cobertura</strong>. Cuidado: tirar o último hospital de alguém faz a pessoa voltar a ver a rede inteira.</> },
          { n: 4, titulo: 'Adicione o hospital a quem tem folga', corpo: <>Abra o cartão de quem está em nível <strong>Normal</strong> e escolha o hospital neste campo. Outra forma é atribuí-lo pela lista de hospitais sem cobertura, logo depois de removê-lo.</> },
          { n: 5, titulo: 'Ajuste a capacidade, se for o caso', corpo: <>São as horas de análise por dia da pessoa, a referência dos dias de fila. Quem trabalha meio período, por exemplo, precisa de uma capacidade menor que a do grupo, senão a fila dela parece mais curta do que é.</> },
        ]}
      >
        <Tela nome="Distribuição de tarefas" largura={960}
          destaques={{ '.vol-grade > .vol-card-wrap:first-child .vol-card': 1 }}
          descricao="Juliana Prado está em sobrecarga.">
          <ReplicaEquipe />
        </Tela>
        <Tela nome="Distribuição de tarefas" largura={640}
          descricao="Painel da pessoa: a carga, a capacidade e os hospitais sob responsabilidade dela.">
          <ReplicaPainelPessoa marcas={{ indicadores: 2, remover: 3, adicionar: 4, capacidade: 5 }} />
        </Tela>
      </ComoFazer>

      <ComoFazer
        titulo="Atribuir um hospital que ficou sem ninguém"
        passos={[
          { n: 1, titulo: 'Clique em Hospitais sem cobertura', corpo: <>O indicador fica vermelho quando algum hospital tem demanda e ninguém responsável. O clique leva direto à lista deles.</> },
          { n: 2, titulo: 'Escolha a pessoa em Atribuir a…', corpo: <>A lista traz só os nomes do grupo. Para saber quem está mais folgado, olhe os cartões da equipe antes. O hospital sai desta lista e entra na carga da pessoa na hora.</> },
        ]}
      >
        <Tela nome="Distribuição de tarefas" largura={960}
          destaques={{ '.vol-sc:first-child select': 2 }}
          descricao="Dois hospitais com demanda e nenhum técnico vinculado.">
          <ReplicaSemCobertura marcas={{ semCobertura: 1 }} />
        </Tela>
      </ComoFazer>

      <ComoFazer
        titulo="Dividir a carga de alguém por alguns dias"
        passos={[
          { n: 1, titulo: 'Clique no ⋮ do cartão e em Dividir a carga', corpo: <>Serve para cobrir férias, folga ou um pico de trabalho. A opção só libera para quem tem ao menos dois hospitais e quando há colega com área definida para receber.</> },
          { n: 2, titulo: 'Marque com quem dividir', corpo: <>A lista traz os colegas do grupo com área definida, com os dias de fila de cada um. Marcar um colega divide em duas partes; marcar dois, em três.</> },
          { n: 3, titulo: 'Escolha o período', corpo: <><strong>Só hoje</strong>, <strong>Hoje e amanhã</strong>, <strong>7 dias</strong> ou <strong>Outro</strong>, para escolher as datas. O período não pode começar no passado.</> },
          { n: 4, titulo: 'Confira como fica', corpo: <>Mostra, para cada participante, quantos hospitais terá e a fila antes e depois da divisão. A sugestão manda o hospital mais pesado para quem está recebendo menos.</> },
          { n: 5, titulo: 'Clique em Dividir', corpo: <>O botão diz em quantas partes a carga será dividida. A janela fecha e os cartões já mostram as demandas de cada um com a divisão. O quadro de Tarefas de cada pessoa também passa a mostrar os hospitais do período.</> },
          { n: 6, titulo: 'Acompanhe pelos cartões', corpo: <>Quem cedeu mostra <strong>Carga dividida até</strong> a data final; quem recebeu, <strong>Ajudando com</strong> o número de hospitais. No fim do período tudo volta sozinho.</> },
        ]}
      >
        <Tela nome="Distribuição de tarefas" largura={960}
          destaques={{ '.vol-grade > .vol-card-wrap:first-child .vol-menu-btn': 1 }}
          descricao="Juliana Prado está em sobrecarga. O ⋮ no canto do cartão abre as ações sobre ela.">
          <ReplicaEquipe />
        </Tela>
        <Tela nome="Distribuição de tarefas" largura={560}
          descricao="Juliana divide a carga com Beatriz por dois dias. Dois hospitais passam para Beatriz.">
          <ReplicaDividirCarga marcas={{ colegas: 2, periodo: 3, previa: 4, dividir: 5 }} />
        </Tela>
        <Tela nome="Distribuição de tarefas" largura={960}
          destaques={{
            '.vol-grade > .vol-card-wrap:first-child .vol-card-div': 6,
            '.vol-grade > .vol-card-wrap:nth-child(3) .vol-card-div': 6,
          }}
          descricao="A equipe durante a divisão: os dois cartões avisam o que está acontecendo.">
          <ReplicaEquipe dividida />
        </Tela>
      </ComoFazer>

      <ComoFazer
        titulo="Comparar demandas com a distribuição dos hospitais"
        passos={[
          { n: 1, titulo: 'Compare a barra com o traço', corpo: <>A barra é a parte das demandas abertas do grupo que está com a pessoa; o traço é a parte dos hospitais que ela recebeu. <strong>Barra além do traço</strong> quer dizer hospitais mais pesados que a média; barra aquém, hospitais leves. Clicar na linha abre o painel da pessoa.</> },
          { n: 2, titulo: 'Olhe a linha Sem responsável', corpo: <>São as demandas de hospitais que ninguém do grupo cobre. Elas existem, mas não estão na carga de ninguém. Atribua esses hospitais pela lista de hospitais sem cobertura.</> },
        ]}
      >
        <Tela nome="Distribuição de tarefas" largura={900}
          destaques={{
            '.vol-dxd > button.vol-dxd-row:nth-child(2) .vol-dxd-trilha': 1,
            '.vol-dxd-row.sem .vol-dxd-nome': 2,
          }}
          descricao="Juliana tem 44% dos hospitais e 49% das demandas. Beatriz tem 22% dos hospitais e só 12% das demandas.">
          <ReplicaDemandaXDistribuicao />
        </Tela>
      </ComoFazer>

      <ComoFazer
        titulo="Acompanhar a produtividade da equipe"
        passos={[
          { n: 1, titulo: 'Compare abertas e concluídas por pessoa', corpo: <>Azul é o que está aberto agora; verde, o que a pessoa concluiu nos últimos 30 dias. Quem concluiu mais aparece primeiro. Clicar numa pessoa abre o painel dela.</> },
          { n: 2, titulo: 'Veja o ritmo dia a dia', corpo: <>As entregas do grupo por dia. Passe o mouse sobre a linha para ver o número de cada dia.</> },
          { n: 3, titulo: 'Repare no que foi feito por fora', corpo: <>Entregas feitas por quem não é da equipe, como o coordenador, não entram na conta de ninguém e aparecem nesta nota.</> },
        ]}
      >
        <Tela nome="Distribuição de tarefas" largura={960}
          descricao="Relatórios registrados pelos técnicos nos últimos 30 dias.">
          <Carregando altura={420}>
            <ReplicaProdutividade marcas={{ porPessoa: 1, porDia: 2, fora: 3 }} />
          </Carregando>
        </Tela>
      </ComoFazer>

      <ComoFazer
        titulo="Ver quem responde por cada região"
        passos={[
          { n: 1, titulo: 'Leia o peso de cada região', corpo: <>Pacientes, hospitais, demandas e horas somados da região. Um hospital dividido entre duas pessoas conta uma vez só aqui.</> },
          { n: 2, titulo: 'Clique num nome para abrir a área da pessoa', corpo: <>São os responsáveis pela região, deduzidos dos hospitais de cada um. Quem cobre duas regiões aparece nas duas.</> },
          { n: 3, titulo: 'Corrija o que está em Sem região', corpo: <>São hospitais sem região no cadastro. A região se define na ficha do hospital, em Configurações; não se atribui região a pessoas.</> },
        ]}
      >
        <Tela nome="Distribuição de tarefas" largura={900}
          destaques={{
            '.vol-reg-linha:first-child .vol-reg-nums': 1,
            '.vol-reg-linha:first-child .vol-reg-resp': 2,
            '.vol-reg-linha:last-child .vol-reg-nome': 3,
          }}
          descricao="Bloco Por região: quem responde por cada uma e o que há sob a responsabilidade dela.">
          <ReplicaPorRegiao />
        </Tela>
      </ComoFazer>

      <ComoFazer
        titulo="Calibrar os parâmetros de carga"
        passos={[
          { n: 1, titulo: 'Clique em Ajustar', corpo: <>O bloco fica recolhido no fim da tela. Aberto, o botão vira <strong>Recolher</strong>.</> },
          { n: 2, titulo: 'Minutos por tipo de leito', corpo: <>Quanto tempo, em média, um caso leva conforme o leito. UTI costuma levar mais.</> },
          { n: 3, titulo: 'Multiplicadores', corpo: <>Aumentam o tempo de quem está internado há muito tempo e diminuem o de quem já tem relatório anterior (reanálise).</> },
          { n: 4, titulo: 'Capacidade e limiares', corpo: <>A capacidade padrão vale para quem não tem uma própria. Os limiares separam Normal, Atenção e Sobrecarga, em dias de fila e em percentual do prazo. São absolutos: se a equipe inteira estiver sobrecarregada, todos aparecem assim.</> },
          { n: 5, titulo: 'Clique em Salvar parâmetros', corpo: <>Os cartões são recalculados com os valores novos. O bloco passa a dizer quem calibrou e quando, e a mudança fica em Movimentações.</> },
          { n: 6, titulo: 'Restaurar padrão, se precisar recomeçar', corpo: <>Volta tudo aos valores de fábrica, <strong>inclusive as capacidades próprias</strong> das pessoas. Pede confirmação antes.</> },
        ]}
      >
        <Tela nome="Distribuição de tarefas" largura={900}
          descricao="Bloco de parâmetros aberto, com a calibração do grupo de técnicos.">
          <ReplicaParametros marcas={{ ajustar: 1, minutos: 2, fatores: 3, limiares: 4, salvar: 5, restaurar: 6 }} />
        </Tela>
      </ComoFazer>

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
        <tr><Key>Operacionais</Key>
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
        anterior. No operacional, cada hospital a cobrar conta como um caso, porque a unidade de
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
        <li><strong>Equipe</strong>: um cartão por pessoa, com o nível de carga, o número de
          demandas e a quebra delas pelos mesmos nomes das colunas de Tarefas. A lista pode ser
          ordenada por <strong>Maior carga</strong> ou por <strong>Nome</strong>. O ⋮ de cada cartão
          traz <strong>Dividir a carga</strong>.</li>
        <li><strong>Demandas x distribuição</strong>: a parte das demandas abertas e a parte dos
          hospitais de cada pessoa, lado a lado.</li>
        <li><strong>Produtividade</strong>: abertas e concluídas por pessoa, e as entregas do grupo
          por dia, nos últimos 30 dias.</li>
        <li><strong>Onde o tempo está indo</strong>: o tempo estimado da fila repartido por tipo
          de tarefa, numa barra única. A quebra dos cartões conta casos; esta conta horas.</li>
        <li><strong>Por região</strong>: uma linha por região, com quem responde por ela e o que
          há sob a responsabilidade dela. Clicar num nome abre o painel daquela pessoa.</li>
        <li><strong>Hospitais sem cobertura</strong>, que só aparece quando há alguma unidade nessa
          condição.</li>
        <li><strong>Comparativo</strong>, gráfico da carga pessoa a pessoa, recolhido por padrão.</li>
        <li><strong>Parâmetros de carga</strong>, também recolhido, descrito adiante.</li>
      </ol>

      <h3>Demandas x distribuição</h3>
      <p>
        Dividir o <strong>número de hospitais</strong> por igual não divide o trabalho por igual: um
        hospital pode ter duzentos pacientes e outro, cinco. Este bloco põe as duas medidas lado a
        lado. A barra é a parte das demandas abertas do grupo que está com a pessoa, e o traço, a
        parte dos hospitais. Quando a barra passa do traço, a pessoa ficou com hospitais mais
        pesados que a média.
      </p>
      <p>
        Um hospital compartilhado conta para cada pessoa que o cobre, como no resto da tela. As
        demandas de hospitais sem ninguém responsável aparecem numa linha própria, em vermelho,
        para a equipe não parecer dividir tudo quando parte do trabalho está sem dono. Quem está
        sem área definida fica de fora.
      </p>

      <h3>Produtividade</h3>
      <p>
        Conta o que cada pessoa <strong>concluiu nos últimos 30 dias</strong>. O sistema não marca
        uma tarefa como concluída: ele registra o gesto que a tira do quadro, com o nome de quem
        o fez.
      </p>
      <Tabela cabecalho={['Grupo', 'O que conta como concluído']} larguras={['175px']}>
        <tr><Key>Técnicos</Key><td>Relatório registrado.</td></tr>
        <tr><Key>Operacionais</Key><td>Cobrança de censo marcada como cobrada.</td></tr>
      </Tabela>
      <p>
        O envio de censo não entra na conta, porque o sistema não guarda quem enviou cada arquivo.
        Quem está sem área definida aparece no gráfico se tiver concluído algo. O gráfico por dia
        mostra os 30 dias inteiros, com zero nos dias sem entrega.
      </p>

      <h3>Divisão temporária da carga</h3>
      <p>
        <strong>Dividir a carga</strong> empresta hospitais de uma pessoa a colegas do mesmo grupo
        por um período. É diferente de redistribuir no painel da pessoa: <strong>a área definida
        não muda</strong>, e no fim do período tudo volta sozinho.
      </p>
      <Tabela cabecalho={['Situação', 'O que acontece']} larguras={['215px']}>
        <tr><Key>Durante o período</Key>
          <td>Os hospitais emprestados entram na carga e no quadro de Tarefas de quem recebeu, e saem
            dos de quem cedeu. Os números da tela já refletem a divisão.</td></tr>
        <tr><Key>No fim do período</Key>
          <td>Cada hospital volta para quem o cedeu, sem nenhuma ação.</td></tr>
        <tr><Key>Cancelar antes do fim</Key>
          <td>Abra de novo <strong>Dividir a carga</strong> na pessoa que cedeu: as divisões dela
            aparecem no topo, em andamento ou agendadas, cada uma com <strong>Cancelar
            divisão</strong>.</td></tr>
        <tr><Key>No painel de quem recebeu</Key>
          <td>O hospital emprestado diz de quem veio e até quando, e não tem o <strong>×</strong> de
            remover: ele sai sozinho.</td></tr>
      </Tabela>
      <Callout tipo="caution" titulo="Regras da divisão">
        Só recebe quem já tem área definida. Quem cede fica sempre com ao menos um hospital, e um
        hospital recebido não pode ser repassado de novo. O mesmo hospital não entra em duas
        divisões com períodos que se sobrepõem.
      </Callout>

      <h3>Onde o tempo está indo</h3>
      <p>
        A quebra de demandas conta <strong>casos</strong>; esta barra conta <strong>horas</strong>,
        e as duas discordam de propósito. Dez pacientes de UTI e dez de enfermaria são o mesmo
        número de casos e não dão o mesmo trabalho, então uma pessoa pode ter poucos casos e a
        semana inteira presa num tipo de tarefa. É a diferença entre <em>quanta</em> coisa há e
        <em>em que</em> o tempo está sendo gasto.
      </p>
      <p>
        A barra aparece três vezes, sempre sobre a fila atual: no bloco da equipe inteira, dentro
        de cada cartão em versão reduzida, para comparar pessoas de relance, e no painel da pessoa,
        com os valores em horas. Só as tarefas que geram trabalho pendente entram: quem está em dia
        conta como paciente sob responsabilidade, mas não consome tempo de fila.
      </p>

      <h3>Responsabilidade por região</h3>
      <p>
        A região <strong>não é atribuída a ninguém</strong>: ela vem do cadastro do hospital, e a
        responsabilidade é deduzida dos hospitais de cada pessoa. Por isso quem cobre hospitais de
        duas regiões aparece nas duas, com a parte de cada uma, e um hospital dividido entre duas
        pessoas conta uma vez só no total da região, com as duas listadas como responsáveis.
      </p>
      <p>
        Hospitais sem região preenchida caem na linha <strong>Sem região</strong>, que fica sempre
        no fim porque indica cadastro faltando, e não uma área de verdade. A correção é feita na
        ficha do hospital, em Configurações.
      </p>

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
        Lista as unidades que <strong>têm demanda aberta e ninguém responsável</strong>, com o
        número de casos ou há quantos dias estão sem censo. Cada linha traz um seletor para
        atribuir o hospital a alguém do grupo ali mesmo. O seletor mostra só os nomes: a carga de
        cada um está nos cartões da equipe.
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
        No grupo operacional não há janela de prazo nem limiares de prazo, porque toda cobrança
        de censo já está vencida por definição e o indicador repetiria o de fila. Os dias contados
        são sempre corridos, pois o sistema não trabalha com calendário de dias úteis.
      </p>
      <Callout tipo="caution" titulo="Restaurar apaga a calibração inteira">
        A restauração devolve o grupo aos valores de fábrica e <strong>desfaz também as capacidades
        individuais</strong> definidas pessoa a pessoa. Por isso a ação pede confirmação.
      </Callout>

      <Callout tipo="info" titulo="Única tela em que o coordenador escreve">
        Os perfis de coordenação observam as demais telas sem alterá-las. Definir a área de cada
        pessoa, dividir a carga por um período e calibrar os parâmetros, aqui, são as únicas
        alterações que eles executam no sistema, e ficam registradas em Movimentações. Cada coordenador atua apenas sobre o próprio
        grupo, e a restrição vale também fora da tela.
      </Callout>
    </>
  )
}
