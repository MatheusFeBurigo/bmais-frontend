// Conteúdo do "Relatório da Auditoria Geral" (Triumphi Corporation para a
// diretoria da B+), transposto do documento original `Relatorio_Diretoria.html`.
//
// O texto e a estrutura de informação são os do documento, palavra por palavra:
// o relatório é peça assinada e fechada, então a tela o APRESENTA, não o
// reescreve. Por isso o markup vem como HTML pronto em vez de virar JSX: uma
// transcrição de novecentas linhas à mão perderia trechos no caminho, e cada
// revisão do documento teria de ser refeita duas vezes.
//
// Da transposição saíram apenas os controles que o sistema já oferece: os
// botões de imprimir e de tema da barra original (a impressão é ação do
// cabeçalho da página, e o tema é do app). O estilo mora em `relatorio.css`,
// escopado em `.rel-doc`.
//
// O HTML é ESTÁTICO e versionado aqui: não vem de usuário nem da rede, e é por
// isso que a tela pode injetá-lo direto (ver Relatorio.tsx).

/** Barra de navegação entre as seções do documento. */
export const RELATORIO_NAV = `<div class="bar">
  <div class="bar-in">
    <div class="brand">B<span>+</span> Auditoria</div>
    <nav>
      <a href="#visao">A visão</a>
      <a href="#levantamento">O levantamento</a>
      <a href="#estrategia">A estratégia</a>
      <a href="#potencial">Potencial de entrega</a>
      <a href="#sequencia">Ajuste de sequência</a>
      <a href="#entrega">Entrega atual</a>
      <a href="#modulos">Módulos e blocos</a>
      <a href="#transicao">A transição</a>
      <a href="#decisoes">Decisões</a>
      <a href="#conclusao">Conclusão</a>
      <a href="#detalhe">Relatório completo</a>
    </nav>
  </div>
</div>`

/** O documento: capa, seções e o relatório completo. */
export const RELATORIO_DOC = `<div class="doc">

  <header class="cover">
    <div>
      <div class="kick">Triumphi Corporation</div>
      <h1>Relatório da Auditoria Geral</h1>
      <p class="sub">Sistema B+: a visão de negócio, o levantamento por área e o plano dos próximos meses.</p>
    </div>
    <div class="ctrl">
      <div class="row">
        <div class="cell"><span class="lbl">Versão</span><span class="v">0</span></div>
        <div class="cell"><span class="lbl">Data</span><span class="v">21 de setembro de 2026</span></div>
      </div>
      <div class="row">
        <div class="cell"><span class="lbl">Destinatário</span><span class="v">Diretoria da B+</span></div>
        <div class="cell"><span class="lbl">Situação</span><span class="v">Para decisão</span></div>
      </div>
      <div class="row one">
        <div class="cell"><span class="lbl">Natureza do trabalho</span><span class="v">Arquitetura de operação: estratégia de negócio aplicada ao desenho de cada módulo, com plano de construção, implantação e transição</span></div>
      </div>
    </div>
  </header>

  <!-- ============ VISÃO ============ -->
  <section class="sec" id="visao">
    <div class="sec-h">
      <div class="kick">A visão que orienta o projeto</div>
      <h2>Antes de construir o sistema, atualizar a operação</h2>
      <p class="lede">Este relatório apresenta o resultado do levantamento feito com as áreas da B+ e a estratégia que está sendo aplicada, módulo a módulo, para que o sistema novo não herde os limites da rotina de hoje.</p>
    </div>

    <div class="thesis">
      <p>Um sistema que reproduz a rotina atual nasce com os limites dela. Por isso cada módulo começa por uma pergunta de negócio, e não por uma tela: o que esta área precisa entregar ao cliente, e do que ela precisa para cumprir. A tela vem depois, e vem simplificada.</p>
      <p class="who">É a diferença entre informatizar o que já se faz e desenhar como passa a ser feito. A primeira opção entrega um sistema novo com os mesmos vícios. A segunda entrega velocidade de dado, clareza de decisão e tempo de volta para as pessoas.</p>
    </div>

    <div class="two">
      <div class="card">
        <h4>O modelo de negócio, organizado como eixo de decisão</h4>
        <p class="cap">O levantamento fixou a hierarquia pela qual a diretoria analisa, precifica e negocia. Ela vira a espinha de todos os painéis, para que toda leitura do negócio use os mesmos cortes.</p>
        <div class="hier">
          <div class="lv"><span class="k">Cliente</span><span class="d">a operadora que contrata</span></div>
          <div class="lv"><span class="k">Filial</span><span class="d">nove unidades, cada uma com obrigações próprias</span></div>
          <div class="lv"><span class="k">Hospital</span><span class="d">onde o serviço é prestado</span></div>
          <div class="lv"><span class="k">Serviço</span><span class="d">visita, senha ou pré-análise de contas</span></div>
          <div class="lv"><span class="k">Prestador</span><span class="d">quem executa e quem é remunerado</span></div>
        </div>
      </div>

      <div class="card">
        <h4>Três serviços, todos para todas as operadoras</h4>
        <div class="tw">
          <table>
            <thead><tr><th>Serviço</th><th>Quem executa</th><th>Como é cobrado</th></tr></thead>
            <tbody>
              <tr><td>Visita, ou auditoria concorrente</td><td>Médicos</td><td>Por frequência contratada, por unidade ou fixo</td></tr>
              <tr><td>Validação de senha clínica</td><td>Médicos</td><td>Por senha validada dentro do prazo</td></tr>
              <tr><td>Pré-análise de contas</td><td>Médicos e enfermeiros</td><td>Por conta, com classificação por parcial</td></tr>
            </tbody>
          </table>
        </div>
        <p class="cap">Os três serviços passam a ser tratados no sistema para toda a carteira. O que muda de uma operadora para outra é a regra do contrato e a forma como a informação entra, e as duas coisas são configuração, não versão diferente do sistema.</p>
        <div class="pair">
          <div><span class="ph">Quanto a B+ cobra</span><p>Fixo, por produtividade, gestão de carteira, por hospital ou mínimo</p></div>
          <div><span class="ph">Quanto a B+ paga</span><p>Fixo ou por produtividade, prestador a prestador</p></div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ LEVANTAMENTO ============ -->
  <section class="sec" id="levantamento">
    <div class="sec-h">
      <div class="kick">O levantamento</div>
      <h2>O que foi levantado, e o que isso viabiliza</h2>
      <p class="lede">O trabalho foi feito em três frentes ao mesmo tempo: as áreas da operação, os dois sistemas em uso e a base de dados que os sustenta. O objetivo não foi documentar a rotina, foi definir o que cada módulo precisa sustentar.</p>
    </div>

    <div class="tiles">
      <div class="tile">
        <span class="n">6</span>
        <span class="t">sessões estratégicas com coordenadores e líderes: gerência técnica, censos e fechamento, acessos e sistemas, governança e diretoria</span>
      </div>
      <div class="tile">
        <span class="n">2</span>
        <span class="t">sistemas em uso lidos por dentro: telas, campos, obrigatoriedades, perfis e regras de negócio</span>
      </div>
      <div class="tile">
        <span class="n">15</span>
        <span class="t">anos de base de produção analisados, em 461 tabelas, para entender o que existe e o que pode ser aproveitado</span>
      </div>
      <div class="tile">
        <span class="n">4</span>
        <span class="t">planilhas de controle reconstituídas, que são hoje as pontes entre um sistema e outro</span>
      </div>
    </div>

    <div class="sec-h sub">
      <h3>O que o levantamento viabiliza</h3>
      <p class="lede">Três constatações mudam o risco e o alcance do projeto, e as três são boas notícias para a diretoria.</p>
    </div>

    <div class="finds three">
      <div class="find hot">
        <span class="num">01</span>
        <h4>O histórico não se perde na virada</h4>
        <p>A base atual pode ser migrada até a data do corte. Tudo o que foi registrado até o dia da virada entra no sistema novo, e não apenas o que for criado depois dele.</p>
        <p class="ev">Consequência: os painéis nascem com histórico. Já no primeiro dia de uso é possível comparar mês contra mês e ano contra ano, em vez de esperar um ciclo inteiro para ter base de comparação.</p>
      </div>
      <div class="find hot">
        <span class="num">02</span>
        <h4>Há material suficiente para trabalhar</h4>
        <p>Foram encontradas informações consistentes de internações, produção, agenda, prestadores e documentos da qualidade. É material que alimenta indicador histórico e permite calibrar cada regra antes de entrar em produção.</p>
        <p class="ev">Consequência: as regras do sistema novo são testadas contra o que de fato aconteceu, e não apenas contra o que se espera que aconteça.</p>
      </div>
      <div class="find hot">
        <span class="num">03</span>
        <h4>Existe caminho técnico para a migração</h4>
        <p>Os dois sistemas em uso gravam na mesma base, o que abre uma via direta de leitura e migração. O levantamento já identificou por onde ela passa.</p>
        <p class="ev">Consequência: a migração não depende de o fornecedor atual colaborar, e a ordem segura de desligamento de cada sistema pôde ser desenhada com precisão.</p>
      </div>
    </div>
  </section>

  <!-- ============ ESTRATÉGIA ============ -->
  <section class="sec" id="estrategia">
    <div class="sec-h">
      <div class="kick">A estratégia aplicada</div>
      <h2>As decisões de desenho que já estão dentro dos módulos</h2>
      <p class="lede">Não são recomendações para depois. São critérios que valem para todos os módulos, do primeiro ao último, e que existem para que o sistema simplifique o processo em vez de reproduzi-lo.</p>
    </div>

    <div class="princ">
      <div class="pr"><span class="pn">01</span><div><h4>O registro nasce no caminho do trabalho</h4><p>Nada de coleta em aba separada. Onde o campo existe hoje e ninguém preenche, a causa é sempre essa.</p></div></div>
      <div class="pr"><span class="pn">02</span><div><h4>O sistema sugere, o profissional decide</h4><p>Vale para código de diagnóstico, relatório estruturado e classificação de conta. A responsabilidade técnica continua de quem assina.</p></div></div>
      <div class="pr"><span class="pn">03</span><div><h4>Quem registra é quem recebe</h4><p>A contagem de produção segue o login. Resolve sozinha a atribuição por profissional no fechamento do mês.</p></div></div>
      <div class="pr"><span class="pn">04</span><div><h4>Toda regra é do cliente, com vigência</h4><p>Prazo, frequência e preço são atributo da operadora, com data de início e de fim. Cliente novo entra por configuração, não por obra.</p></div></div>
      <div class="pr"><span class="pn">05</span><div><h4>Todo indicador de volume traz a média móvel</h4><p>Um hospital que represa contas engana nos dois sentidos. A média de 6 e 12 meses é a leitura que sustenta negociação.</p></div></div>
      <div class="pr"><span class="pn">06</span><div><h4>Todo número tem fórmula rastreável</h4><p>Para que dois relatórios nunca respondam diferente à mesma pergunta, dentro de casa ou diante do cliente.</p></div></div>
      <div class="pr"><span class="pn">07</span><div><h4>Vocabulário de prestação em todas as telas</h4><p>Decisão jurídica tomada pela diretoria, aplicada antes do desenho e não depois dele.</p></div></div>
      <div class="pr"><span class="pn">08</span><div><h4>Nada de exclusão de cadastro</h4><p>Inativação com justificativa, sempre. Preserva histórico, prova e memória da empresa.</p></div></div>
    </div>

    <div class="sec-h sub">
      <h3>O contrato configurado, e o cálculo sempre pela configuração</h3>
      <p class="lede">Este é o mecanismo que tira o valor da digitação e o devolve à decisão da diretoria. Cada contrato de cliente e cada acordo de prestador passa a ter modelo e valor próprios cadastrados no sistema, com data de início e de fim. O fechamento nunca calcula de outro jeito.</p>
    </div>

    <div class="flow">
      <div class="fs">
        <span class="fn">01</span>
        <h4>A diretoria configura</h4>
        <p>Modelo de cobrança de cada cliente e modelo de pagamento de cada prestador: fixo, produtividade, gestão de carteira, por hospital ou mínimo. Com valor, região, tipo de posto e vigência.</p>
      </div>
      <div class="fs">
        <span class="fn">02</span>
        <h4>A operação registra</h4>
        <p>O serviço feito, por quem, em qual hospital, para qual operadora e em que dia. Um registro só, feito por quem executou.</p>
      </div>
      <div class="fs">
        <span class="fn">03</span>
        <h4>O sistema calcula</h4>
        <p>Aplica a configuração vigente ao registro e guarda a memória do cálculo. Nenhum valor é digitado no fechamento, e a exceção precisa ser declarada como exceção.</p>
      </div>
      <div class="fs">
        <span class="fn">04</span>
        <h4>O fechamento sai pronto</h4>
        <p>Nas duas pontas ao mesmo tempo: o que faturar de cada cliente e o que pagar a cada prestador, saídos da mesma base e do mesmo critério.</p>
      </div>
    </div>
    <p class="cap">O efeito prático: a diretoria decide uma vez, na configuração, e não a cada fechamento. E como o critério fica registrado com vigência, o número apresentado ao cliente no mês passado continua reproduzível no mês seguinte.</p>
  </section>

  <!-- ============ POTENCIAL ============ -->
  <section class="sec" id="potencial">
    <div class="sec-h">
      <div class="kick">Potencial de entrega</div>
      <h2>Como cada processo funciona hoje, e como passa a funcionar</h2>
      <p class="lede">Este é o retrato por processo, do jeito que ele corre hoje até o ponto onde chega com o sistema. É também o mapa do que cada módulo precisa entregar para que o ganho apareça na operação, e não só na tela.</p>
    </div>

    <div class="bridges">
      <div class="bh"><span>Processo</span><span>Como corre hoje</span><span>Como passa a funcionar</span><span>O que isso libera</span></div>

      <div class="br">
        <div class="bp">Validação de senha<small>todas as operadoras</small></div>
        <div class="bc"><i class="c on">sistema da operadora, quando ela tem</i><i class="c">print da tela</i><i class="c">e-mail</i><i class="c">planilha de quem enviou</i><i class="c">cobrança</i></div>
        <div class="bm">A senha passa a ser registrada no sistema B+ para toda a carteira, com relógio de 24 horas e alerta antes de vencer. O registro conta para quem decidiu e alimenta o fechamento de contas depois.</div>
        <div class="bl">Prazo contratual sob controle e serviço prestado que passa a ser faturado.</div>
      </div>

      <div class="br">
        <div class="bp">Agenda e substituição</div>
        <div class="bc"><i class="c">telefonema, um a um</i><i class="c">planilha de férias</i><i class="c">planilha de substituições</i><i class="c">planilha de contratos</i><i class="c">reconstituição no fechamento</i></div>
        <div class="bm">Valores aplicados pelo sistema a partir da configuração do contrato, convite por proximidade e aceite nominal do prestador, com registro de quem aceitou e quem recusou.</div>
        <div class="bl">A diretoria aprova em vez de negociar caso a caso, e o fechamento deixa de depender de reconstituir o mês.</div>
      </div>

      <div class="br">
        <div class="bp">Apuração e pagamento</div>
        <div class="bc"><i class="c on">sistema conta a produção</i><i class="c">a conta é refeita à mão</i><i class="c">valor digitado linha a linha</i><i class="c">nota conferida uma a uma</i></div>
        <div class="bm">O valor é calculado a partir do registro e da configuração do contrato, com a memória de cálculo guardada pelo sistema. A nota do prestador passa a ser conferência.</div>
        <div class="bl">Fechamento previsível, divergência visível na hora e não no mês seguinte.</div>
      </div>

      <div class="br">
        <div class="bp">Fechamento com a operadora</div>
        <div class="bc"><i class="c">planilha mensal de milhares de contas</i><i class="c">dias para baixar e dividir</i><i class="c">arquivos por região</i><i class="c">atribuição corrigida conta a conta</i></div>
        <div class="bm">O dado nasce em quem executou o serviço, e a saída sai no formato de cada operadora. A planilha da operadora passa a servir de conferência, não de fonte.</div>
        <div class="bl">Dias de trabalho de duas pessoas, todo mês, devolvidos à operação.</div>
      </div>

      <div class="br">
        <div class="bp">Censo e relatório</div>
        <div class="bc"><i class="c">e-mail</i><i class="c">pasta</i><i class="c">planilha</i><i class="c">planilha da planilha</i><i class="c on">site atual</i></div>
        <div class="bm">Censo lido pela máquina com reconhecimento de hospital e de leito, alta automática, prazo por operadora e cobrança automática de quem não enviou.</div>
        <div class="bl">Horas diárias de consolidação, e o auditor sabe quem visitar bem mais cedo.</div>
      </div>

      <div class="br">
        <div class="bp">Gestão da qualidade</div>
        <div class="bc"><i class="c">planilhas de fornecedor e risco</i><i class="c">análise crítica de 30 páginas à mão</i></div>
        <div class="bm">Indicadores prontos no sistema, com análise crítica mensal no mesmo esforço que hoje se gasta uma vez por ano.</div>
        <div class="bl">Decisão que chega a tempo de corrigir rota, em vez de constatar no fim do ano.</div>
      </div>

      <div class="br">
        <div class="bp">Decisão da diretoria</div>
        <div class="bc"><i class="c">levantamento antes de cada conversa</i><i class="c">fila de pessoas esperando</i></div>
        <div class="bm">Consulta pronta por prestador: volume, valores, aceites e recusas dos últimos doze meses, com média móvel.</div>
        <div class="bl">O tempo de planejar de volta, e negociação feita com número à mesa.</div>
      </div>
    </div>
    <p class="cap">Chips escuros são o que já vive dentro de um sistema. Chips claros são as pontes manuais que hoje ligam uma etapa à outra. A leitura importante é a proporção entre os dois.</p>

    <div class="sec-h sub">
      <h3>Cada operadora entra pelo caminho dela, e sai no mesmo lugar</h3>
      <p class="lede">A forma de receber a informação muda de cliente para cliente, e isso não pode virar um sistema diferente para cada um. O desenho separa a porta de entrada do processamento: cada operadora tem a sua entrada, e daí para a frente tudo corre igual.</p>
    </div>

    <div class="paths">
      <div class="pt-row">
        <div class="pt-lbl">Operadoras que não têm sistema próprio</div>
        <div class="pt-steps"><i class="c">a solicitação chega à B+</i><span class="arw">&rsaquo;</span><i class="c on">registro direto no sistema B+</i></div>
      </div>
      <div class="pt-row">
        <div class="pt-lbl">Bradesco</div>
        <div class="pt-steps"><i class="c">a solicitação nasce no sistema da operadora</i><span class="arw">&rsaquo;</span><i class="c gold">adequação de entrada, em construção</i><span class="arw">&rsaquo;</span><i class="c on">registro no sistema B+</i></div>
      </div>
      <div class="pt-row">
        <div class="pt-lbl">Porto Seguro e demais com portal</div>
        <div class="pt-steps"><i class="c">a solicitação nasce no portal da operadora</i><span class="arw">&rsaquo;</span><i class="c gold">entrada assistida, lado a lado</i><span class="arw">&rsaquo;</span><i class="c on">registro no sistema B+</i></div>
      </div>
      <div class="pt-join">
        <span class="jl"></span>
        <div class="jbox">
          <h4>Daqui para a frente o caminho é um só</h4>
          <p>Relógio de prazo por contrato, alerta antes de vencer, contagem no login de quem decidiu, e o registro alimentando o fechamento de contas e o faturamento sem redigitação.</p>
        </div>
      </div>
    </div>
    <p class="cap">O caso da Bradesco é o que exige mais trabalho de adequação, porque a informação nasce dentro do sistema dela. Por isso a carta pedindo extração e integração está na lista de decisões: ela reduz esse trabalho e a janela para pedir está aberta agora.</p>

    <div class="sec-h sub">
      <h3>Dois números que dimensionam o ganho</h3>
      <p class="lede">Medidos na base de produção, nos doze meses encerrados em agosto de 2026. São a referência contra a qual o resultado do Bloco 2 será comparado depois da implantação.</p>
    </div>

    <div class="figs">
      <div class="fig">
        <h4>De onde sai o valor pago ao prestador</h4>
        <p class="cap">Na competência de julho de 2026, quase todo o valor veio de poucas linhas calculadas e digitadas à mão, enquanto a contagem automática, que gera o maior volume de linhas, quase não carrega valor. É o trabalho que o Bloco 2 passa a fazer sozinho, a partir da configuração do contrato.</p>
        <div class="leg">
          <span><i style="background:var(--s2)"></i>Calculado e digitado à mão</span>
          <span><i style="background:var(--s1)"></i>Contado pelo sistema</span>
        </div>
        <div class="panel">
          <div class="ph">Valor apurado</div>
          <div class="row2"><span class="k">À mão</span><div class="track"><span class="b" style="background:var(--s2);width:96%"></span><span class="v">R$ 626.162</span></div></div>
          <div class="row2"><span class="k">Contado</span><div class="track"><span class="b" style="background:var(--s1);width:0.64%"></span><span class="v">R$ 4.195</span></div></div>
        </div>
        <div class="panel">
          <div class="ph">Linhas geradas</div>
          <div class="row2"><span class="k">À mão</span><div class="track"><span class="b" style="background:var(--s2);width:9%"></span><span class="v">141 linhas</span></div></div>
          <div class="row2"><span class="k">Contado</span><div class="track"><span class="b" style="background:var(--s1);width:96%"></span><span class="v">1.506 linhas</span></div></div>
        </div>
        <details class="tv">
          <summary>Ver os números em tabela</summary>
          <table>
            <thead><tr><th>Origem do valor</th><th>Valor</th><th>Linhas</th></tr></thead>
            <tbody>
              <tr><td>Calculado e digitado à mão</td><td>R$ 626.162,10</td><td>141</td></tr>
              <tr><td>Contado pelo sistema</td><td>R$ 4.195,40</td><td>1.506</td></tr>
              <tr><td>Participação do que é feito à mão</td><td>99,3%</td><td>8,6%</td></tr>
            </tbody>
          </table>
        </details>
      </div>

      <div class="fig">
        <h4>Quem cobriu o posto</h4>
        <p class="cap">Substituições registradas nos últimos doze meses. Em uma a cada seis, o posto consta coberto sem o nome do prestador, e alguém precisa reconstituir isso no fechamento para pagar a pessoa certa. O aceite nominal do Módulo 4 resolve por construção.</p>
        <div class="leg">
          <span><i style="background:var(--s3)"></i>Prestador nomeado</span>
          <span><i style="background:var(--adj)"></i>Sem prestador nomeado</span>
        </div>
        <div class="stack">
          <i class="lbl" style="background:var(--s3);width:82.9%">1.175</i>
          <i class="lbl" style="background:var(--adj);width:17.1%">242</i>
        </div>
        <div class="leg" style="justify-content:space-between">
          <span>82,9% nomeados</span><span>17,1% sem nome</span>
        </div>
        <div class="tiles" style="grid-template-columns:1fr 1fr;gap:10px;margin-top:4px">
          <div class="tile" style="box-shadow:none">
            <span class="n" style="font-size:25px">12,9</span>
            <span class="t">postos deslocados a cada ausência de um prestador</span>
          </div>
          <div class="tile" style="box-shadow:none">
            <span class="n warn" style="font-size:25px">348</span>
            <span class="t">substituições registradas com 2 dias ou menos de antecedência</span>
          </div>
        </div>
        <details class="tv">
          <summary>Ver os números em tabela</summary>
          <table>
            <thead><tr><th>Registro do substituto</th><th>Postos</th><th>Participação</th></tr></thead>
            <tbody>
              <tr><td>Prestador nomeado</td><td>1.175</td><td>82,9%</td></tr>
              <tr><td>Sem prestador nomeado</td><td>242</td><td>17,1%</td></tr>
              <tr><td>Total em 12 meses</td><td>1.417</td><td>100%</td></tr>
            </tbody>
          </table>
        </details>
      </div>
    </div>
  </section>

  <!-- ============ SEQUÊNCIA ============ -->
  <section class="sec" id="sequencia">
    <div class="sec-h">
      <div class="kick">Ajuste proposto</div>
      <h2>O que o levantamento sugere mudar na sequência</h2>
      <p class="lede">O conjunto do que será entregue não muda, e o prazo total também não. O que muda é a ordem de algumas entregas, para que a operação ganhe fluidez antes e não depois, e para que os dois sistemas atuais possam sair juntos e mais cedo.</p>
    </div>

    <div class="finds">
      <div class="find hot">
        <span class="num">Ajuste 01</span>
        <h4>Agenda e fechamento de contas entram no mesmo bloco</h4>
        <p>Senha, agenda, contagem e fechamento correm hoje em quatro lugares, mas na prática são um fluxo só. Entregar esses módulos separados deixaria parte do fechamento manual de pé por mais um bloco inteiro.</p>
        <p class="ev">Ganho: com o Módulo 4 e o Módulo 2A juntos, os dois sistemas atuais passam a sair do processo operacional no mês 7, e não entre o mês 8 e o 10.</p>
      </div>
      <div class="find">
        <span class="num">Ajuste 02</span>
        <h4>A consulta do prestador vem antes</h4>
        <p>É a entrega que destrava a agenda da diretoria, e depende apenas de dados que já estarão no sistema depois do primeiro bloco. Não precisa esperar o módulo de agenda inteiro.</p>
        <p class="ev">Ganho: velocidade de decisão no começo do projeto, com o menor custo de construção de toda a lista.</p>
      </div>
      <div class="find">
        <span class="num">Ajuste 03</span>
        <h4>O assistente com IA entra depois da base organizada</h4>
        <p>Um assistente treinado sobre dado desorganizado aprende o erro junto com o acerto. Depois dos blocos 1 e 2, o registro já nasce estruturado e com dado real do processo, que é a condição para calibrar e medir acerto.</p>
        <p class="ev">Ganho: o Módulo 2B entra no Bloco 3, com material de calibração pronto e indicador de assertividade mensurável desde o primeiro dia.</p>
      </div>
      <div class="find">
        <span class="num">Ajuste 04</span>
        <h4>O App do auditor vira módulo próprio, no Bloco 3</h4>
        <p>O registro em campo apoia justamente os módulos que já estarão implantados: censo, visita, relatório e agenda. Entrar depois deles é o que permite ao App nascer sobre processo estável.</p>
        <p class="ev">Ganho: menos retrabalho de escritório, e o App com escopo e valor próprios, em vez de diluído dentro de outros módulos.</p>
      </div>
    </div>

    <div class="rule">
      <p><b>Efeito no cronograma.</b> O último módulo continua entrando em produção no mês 11, e o encerramento do projeto no mês 15, com documentação e transferência para dentro de casa. O ajuste antecipa a saída dos dois sistemas atuais e mantém o prazo total. A decisão de aprovar ou não o ajuste é a primeira da lista da diretoria.</p>
    </div>
  </section>

  <!-- ============ ENTREGA ============ -->
  <section class="sec" id="entrega">
    <div class="sec-h">
      <div class="kick">O momento atual</div>
      <h2>Módulos 0 e 1: o que está sendo entregue agora</h2>
      <p class="lede">Os dois primeiros módulos saem do desenvolvimento e entram na fase de testes, com dado real e em paralelo à operação atual. A entrega não é só o sistema: é o pacote que permite à equipe da B+ operar e, depois, seguir sozinha.</p>
    </div>

    <div class="steps">
      <div class="st"><span class="sn">01</span><h4>O sistema em ambiente de testes</h4><p>Rodando com dado real, em paralelo à operação de hoje, para que os resultados dos dois possam ser comparados antes de qualquer corte.</p></div>
      <div class="st"><span class="sn">02</span><h4>Material de treinamento</h4><p>Preparado para as pessoas-chave de cada área, no vocabulário da operação e não no da tecnologia.</p></div>
      <div class="st"><span class="sn">03</span><h4>Documentação técnica</h4><p>Entregue em condição de a equipe interna dar continuidade, porque o sistema é ativo da B+ e não serviço contratado de forma permanente.</p></div>
      <div class="st"><span class="sn">04</span><h4>Acompanhamento da implantação</h4><p>Treinamento das pessoas-chave, coleta de feedback ao longo do mês de testes e ajustes feitos conforme a operação aponta necessidade.</p></div>
    </div>

    <div class="sec-h sub">
      <h3>Como cada pedido do mês de testes é tratado</h3>
      <p class="lede">A distinção é o que garante que o módulo chegue ao ponto sem que o escopo escorra. Ela vale para todos os blocos.</p>
    </div>

    <div class="two">
      <div class="card ok">
        <span class="tag ok">Entra no próprio mês</span>
        <h4>Ajuste de funcionamento</h4>
        <p>É o que faz o processo rodar no dia a dia: um campo na ordem errada, uma tela que pede um passo a mais do que precisa, uma regra que pede acerto fino. Não é melhoria nem acréscimo, é a entrega chegando ao ponto, e por isso é tratado dentro da própria fase de testes.</p>
      </div>
      <div class="card adj">
        <span class="tag adj">Vai para a lista</span>
        <h4>Melhoria estratégica</h4>
        <p>É o que muda o processo padrão ou acrescenta capacidade nova. Nunca é recusada: entra numa lista visível, é repriorizada na abertura de cada bloco seguinte e reaparece com o custo e o momento certos. O que evita é que o módulo de hoje pare para atender a ideia de amanhã.</p>
      </div>
    </div>
  </section>

  <!-- ============ MÓDULOS ============ -->
  <section class="sec" id="modulos">
    <div class="sec-h">
      <div class="kick">Os próximos passos</div>
      <h2>Dez módulos, agrupados em cinco blocos</h2>
      <p class="lede">A ordem responde às dependências entre os processos: cada módulo só entra quando aquilo de que ele depende já existe. O bloco é a unidade de contratação, com escopo, prazo e valor próprios, e a diretoria decide um de cada vez.</p>
    </div>

    <div class="blocos">
      <div class="bloco b1">
        <div class="bhd"><span class="bid">Bloco 1</span><span class="pill go">Em testes</span><span class="bwhen">Produção no mês 3</span></div>
        <div class="bmods">
          <div class="sq">
            <span class="id">Módulo 0</span>
            <h4>Acesso e segurança</h4>
            <p>Perfis com escopo por hospital e por operadora, trilha de autoria em todo registro e proteção do dado de paciente.</p>
          </div>
          <div class="sq">
            <span class="id">Módulo 1</span>
            <h4>Censos, relatórios e linha do tempo</h4>
            <p>Censo lido pela máquina, alta automática, prazo por operadora, relatório com análise técnica e a trajetória completa de cada paciente.</p>
          </div>
        </div>
        <p class="bsub"><b>O que sai do sistema atual:</b> censo, visita, relatório, prontuário do paciente, acessos e painéis de acompanhamento.</p>
      </div>

      <div class="bloco b2">
        <div class="bhd"><span class="bid">Bloco 2</span><span class="pill next">A seguir</span><span class="bwhen">Produção no mês 5</span></div>
        <div class="bmods">
          <div class="sq">
            <span class="id">Módulo 4</span>
            <h4>Agenda de serviços e senhas</h4>
            <p>Postos por cliente e hospital, substituição com aceite nominal, valores aplicados pela configuração do contrato, entrada diária de senhas com relógio de prazo e consulta pronta por prestador.</p>
          </div>
          <div class="sq">
            <span class="id">Módulo 2A</span>
            <h4>Pré-análise e fechamento de contas</h4>
            <p>A conta como registro próprio, classificação calculada, glosa e contestação com motivo e responsável, apuração da produção e fechamento nas duas visões: o que faturar de cada cliente e o que pagar a cada prestador.</p>
          </div>
        </div>
        <p class="bsub"><b>O que sai do sistema atual:</b> capeante, painéis de contas, apuração de produtividade, fechamento de contas e faturamento. É o bloco que completa a substituição dos dois sistemas.</p>
      </div>

      <div class="bloco b3">
        <div class="bhd"><span class="bid">Bloco 3</span><span class="pill wait">Depois</span><span class="bwhen">Produção no mês 7</span></div>
        <div class="bmods">
          <div class="sq">
            <span class="id">Módulo 2B</span>
            <h4>Assistente com IA</h4>
            <p>Sugestão de código de diagnóstico, relatório estruturado a partir de texto livre ou voz, e indicador de acerto visível. Entra aqui porque a base já estará organizada e com dado real do processo para calibrar.</p>
          </div>
          <div class="sq">
            <span class="id">Módulo 3</span>
            <h4>Gestão financeira</h4>
            <p>Valor definido antes da nota, remessa bancária gerada pelo sistema, retenções por prestador, plano de contas e alerta de recebimento vencido.</p>
          </div>
          <div class="sq">
            <span class="id">App do auditor</span>
            <h4>Registro em campo</h4>
            <p>Aplicativo instalável em celular e tablet, com uso fora de área e sincronização depois. Agenda do dia, confirmação de visita, captura por foto e mensagens no lugar do e-mail corporativo.</p>
          </div>
        </div>
        <p class="bsub"><b>O que sai do sistema atual:</b> nada mais. Os dois sistemas já terão saído no bloco anterior, e este bloco acrescenta capacidade que hoje não existe.</p>
      </div>

      <div class="bloco b4">
        <div class="bhd"><span class="bid">Bloco 4</span><span class="pill wait">Depois</span><span class="bwhen">Produção no mês 9</span></div>
        <div class="bmods">
          <div class="sq">
            <span class="id">Módulo 5A</span>
            <h4>Pessoas e prestadores</h4>
            <p>Ficha completa com contratos e registro de conselho, indicadores individuais de doze meses, engajamento visível ao prestador e avaliação periódica registrada.</p>
          </div>
          <div class="sq">
            <span class="id">Módulo 5B</span>
            <h4>Sistema de gestão da qualidade</h4>
            <p>Acervo documental com versão e responsável, qualificação de fornecedor, matriz de riscos, não conformidades e análise crítica mensal.</p>
          </div>
        </div>
        <p class="bsub"><b>O que sai do sistema atual:</b> as planilhas de governança, de fornecedor e de risco, e a análise crítica montada à mão.</p>
      </div>

      <div class="bloco b5">
        <div class="bhd"><span class="bid">Bloco 5</span><span class="pill wait">Depois</span><span class="bwhen">Produção no mês 11</span></div>
        <div class="bmods">
          <div class="sq">
            <span class="id">Módulo 6</span>
            <h4>Inteligência de dados</h4>
            <p>Centro de custo por cliente, filial e operação, rentabilidade por unidade e por carteira, índice de viabilidade de contrato novo e simulador de preço e volume.</p>
          </div>
        </div>
        <p class="bsub"><b>O que sai do sistema atual:</b> nada. É capacidade nova, e depende de valor financeiro na base, que fica completo ao fim do Bloco 3.</p>
      </div>
    </div>
  </section>

  <!-- ============ TRANSIÇÃO ============ -->
  <section class="sec" id="transicao">
    <div class="sec-h">
      <div class="kick">A transição</div>
      <h2>Quando cada sistema atual sai, e como</h2>
      <p class="lede">Hoje a operação usa dois sistemas: o site, onde nascem censo, visita, relatório e capeante, e o sistema de fechamento, que apura produtividade, fecha contas e gera o faturamento. Nenhum dos dois é desligado de uma vez. Cada um vai perdendo função conforme o bloco correspondente entra, e só sai quando o que ele fazia já estiver rodando e conferido.</p>
    </div>

    <div class="trilha">
      <div class="th"><span></span><span>Hoje</span><span>Mês 3, com o Bloco 1</span><span>Mês 5, com o Bloco 2</span><span>Mês 7</span></div>

      <div class="tr">
        <div class="tn">Site atual<small>onde nasce o registro</small></div>
        <div class="tc use">Censo, visita, relatório, prontuário, capeante e painéis</div>
        <div class="tc part">Fica só com o capeante. Todo o resto passa para o sistema novo</div>
        <div class="tc par">Capeante em paralelo, os dois rodando lado a lado</div>
        <div class="tc out">Sai do processo operacional</div>
      </div>

      <div class="tr">
        <div class="tn">Sistema de fechamento<small>apuração e faturamento</small></div>
        <div class="tc use">Produtividade, fechamento de contas e faturamento</div>
        <div class="tc use">Sem mudança. Continua recebendo a produtividade da visita</div>
        <div class="tc par">Tudo em paralelo, por dois fechamentos mensais seguidos</div>
        <div class="tc out">Sai do processo operacional</div>
      </div>

      <div class="tr">
        <div class="tn">Planilhas e e-mail<small>as pontes manuais</small></div>
        <div class="tc use">Censo, agenda, férias, substituição, senhas e pagamento</div>
        <div class="tc part">Saem as de censo e de cobrança de censo</div>
        <div class="tc part">Saem as de agenda, substituição, senhas e pagamento</div>
        <div class="tc out">Não sobra nenhuma no fluxo</div>
      </div>

      <div class="tleg">
        <span><i class="sw use"></i>Em uso normal</span>
        <span><i class="sw part"></i>Substituição parcial</span>
        <span><i class="sw par"></i>Paralelo, os dois ao mesmo tempo</span>
        <span><i class="sw out"></i>Fora do processo</span>
      </div>
    </div>

    <div class="marco">
      <div class="mk">
        <span class="mn">Mês 7</span>
        <h4>O momento em que os dois sistemas saem</h4>
        <p>Depois de dois fechamentos mensais seguidos em que o sistema novo e o antigo chegam ao mesmo resultado, a operação deixa de usar os dois sistemas atuais. Eles ficam disponíveis apenas para consulta do que ainda não tiver sido migrado, e são desligados em definitivo no mês 9, quando o ciclo de conferência se encerra.</p>
      </div>
    </div>

    <div class="sec-h sub">
      <h3>Dúvidas sobre a transição, respondidas</h3>
      <p class="lede">São as perguntas que qualquer pessoa da operação faz quando ouve falar em troca de sistema. As respostas valem para todos os blocos.</p>
    </div>

    <div class="qa">
      <div class="q">
        <h4>O primeiro bloco cobre tudo o que existe hoje no site?</h4>
        <p>Não, e é de propósito. O Bloco 1 cobre censo, visita, relatório com análise técnica, prontuário do paciente e acessos. O capeante continua no site atual até o Bloco 2. Fatiar assim é o que permite testar de verdade cada parte antes de confiar a próxima a ela.</p>
      </div>
      <div class="q">
        <h4>O sistema novo entra substituindo, ou rodando junto?</h4>
        <p>Sempre junto primeiro. O sistema novo recebe dado real e a equipe opera nos dois durante a fase de testes, comparando o resultado dos dois lados: mesmo censo, mesmo relatório, mesma apuração. Só depois de bater é que a operação muda de lado.</p>
      </div>
      <div class="q">
        <h4>Quanto tempo dura esse paralelo?</h4>
        <p>Um mês na regra geral. No Bloco 2, que é o que paga as pessoas e fatura o cliente, são dois fechamentos mensais seguidos, porque errar folha de prestador é o risco que não se corre.</p>
      </div>
      <div class="q">
        <h4>Vão existir dois logins ao mesmo tempo?</h4>
        <p>Não. Um usuário por pessoa, criado pelo administrador, igual ao de hoje. Durante o paralelo a pessoa entra nos dois sistemas com o mesmo usuário. Depois do corte, o antigo fica só em consulta.</p>
      </div>
      <div class="q">
        <h4>Como é o dia do corte?</h4>
        <p>Corte em data definida, na sexta à noite, para que a segunda-feira já comece no sistema novo. Antes disso, treinamento das pessoas-chave de cada área. Depois, acompanhamento da operação assistida enquanto a equipe se acostuma.</p>
      </div>
      <div class="q">
        <h4>E o histórico dos anos anteriores?</h4>
        <p>Vai junto. A base é migrada até a data do corte, de modo que os painéis já nascem com série histórica e permitem comparar com os anos anteriores desde o primeiro dia de uso.</p>
      </div>
    </div>
  </section>

  <!-- ============ DECISÕES ============ -->
  <section class="sec" id="decisoes">
    <div class="sec-h">
      <div class="kick">O que a diretoria precisa decidir</div>
      <h2>Nove decisões, com data de necessidade</h2>
      <p class="lede">Nenhuma delas é técnica. Todas são de negócio, e as três primeiras precisam estar fechadas antes do desenho do próximo bloco.</p>
    </div>
    <div class="tw">
      <table>
        <thead><tr><th>#</th><th>Decisão</th><th>Quem</th><th>Necessária até</th><th>Recomendação</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>Aprovar o ajuste de sequência proposto, ou manter a ordem original</td><td>Dr. Eduardo</td><td>Fim da auditoria geral</td><td>Aprovar o ajuste, porque antecipa a saída dos dois sistemas atuais para o mês 7</td></tr>
          <tr><td>2</td><td>Modelos e valores contratuais a cadastrar no sistema, por cliente e por prestador</td><td>Dr. Eduardo e Juliana</td><td>Antes do protótipo do Bloco 2</td><td>Definir antes: é a configuração que o sistema passa a aplicar em todo fechamento</td></tr>
          <tr><td>3</td><td>Quais índices o prestador enxerga</td><td>Dr. Eduardo e Juliana</td><td>Antes do protótipo do Bloco 2</td><td>Engajamento visível, performance e qualidade não</td></tr>
          <tr><td>4</td><td>Nome de apresentação dos serviços no sistema</td><td>Diretoria</td><td>Antes do protótipo do Bloco 2</td><td>Adotar a nomenclatura já praticada, decidindo só o nome da pré-análise</td></tr>
          <tr><td>5</td><td>Consulta ao jurídico sobre vocabulário, localização e contrato do prestador</td><td>Juliana</td><td>Antes do protótipo do Bloco 2</td><td>Uma consulta só, com os três temas juntos</td></tr>
          <tr><td>6</td><td>Carta à Bradesco sobre extração de senhas, visão gerencial e integração</td><td>Dr. Eduardo e Dra. Érica</td><td>Durante a auditoria geral</td><td>Enviar agora: reduz o trabalho de adequação de entrada e a janela está aberta</td></tr>
          <tr><td>7</td><td>Verificação do contrato do fornecedor atual quanto a dados na rescisão</td><td>Juliana</td><td>Esta semana</td><td>Verificar antes de marcar a data de saída dos sistemas atuais</td></tr>
          <tr><td>8</td><td>Quem registra as senhas diariamente, e a que horas</td><td>Dra. Érica e Juliana</td><td>Antes do protótipo do Bloco 2</td><td>Nomear a pessoa e o horário: é a fonte diária do módulo</td></tr>
          <tr><td>9</td><td>Escopo do sistema de gestão e das contas de pronto socorro</td><td>Juliana e Dra. Érica</td><td>Levantamento dos blocos 3 e 4</td><td>Classificar item a item pelo critério do contrato</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- ============ CONCLUSÃO ============ -->
  <section class="sec" id="conclusao">
    <div class="sec-h">
      <div class="kick">Conclusão</div>
      <h2>O que a B+ ganha ao fim do caminho</h2>
    </div>

    <div class="thesis">
      <p>O ganho não está em trocar um sistema por outro. Está em sair de um parque de ferramentas costurado por planilhas e chegar a um sistema único, em que o dado nasce uma vez, no trabalho de quem executa, e serve a todos os que precisam dele depois.</p>
    </div>

    <div class="antes">
      <div class="ad hoje">
        <span class="al">Como é hoje</span>
        <div class="anodes">
          <i class="c">planilhas</i><i class="c">e-mail</i><i class="c on">site atual</i><i class="c on">sistema de fechamento</i><i class="c">sistemas das operadoras</i><i class="c">papel</i>
        </div>
        <p>Seis lugares, ligados por transcrição. O mesmo dado é digitado mais de uma vez, e cada passagem é uma chance de erro e uma hora de trabalho.</p>
      </div>
      <span class="aseta">&rsaquo;</span>
      <div class="ad depois">
        <span class="al">Como passa a ser</span>
        <div class="anodes"><i class="c on big">Sistema B+</i></div>
        <p>Uma base, uma regra, um lugar de registro, com as entradas de cada operadora conectadas nas pontas e o histórico dos anos anteriores preservado dentro dele.</p>
      </div>
    </div>

    <div class="finds three">
      <div class="find hot">
        <span class="num">01</span>
        <h4>Um sistema único</h4>
        <p>O que hoje passa por várias ferramentas e exige transcrição entre elas passa a ser uma entrada só. E os dois sistemas atuais saem do processo operacional já no mês 7.</p>
      </div>
      <div class="find hot">
        <span class="num">02</span>
        <h4>Dado em tempo real e decisão objetiva</h4>
        <p>O número deixa de ser produzido sob encomenda e passa a estar pronto quando a conversa acontece. É o que muda a velocidade de decisão, libera o tempo de quem hoje levanta informação e eleva a produtividade de toda a cadeia.</p>
      </div>
      <div class="find hot">
        <span class="num">03</span>
        <h4>Estratégia de negócio, não só de sistema</h4>
        <p>Cada módulo carrega decisões de operação tomadas antes da tela. Ao fim do projeto, a B+ fica com o sistema, com a documentação, com a capacidade de seguir internamente e com um modelo de operação desenhado para crescer sem crescer na mesma proporção em estrutura.</p>
      </div>
    </div>
  </section>

  <!-- ============ DETALHADO ============ -->
  <section class="sec" id="detalhe">
    <div class="sec-h">
      <div class="kick">Relatório completo</div>
      <h2>O detalhamento, em três partes</h2>
      <p class="lede">O levantamento, o que será feito e a transição. É o documento inteiro, com o método, a origem de cada número, os riscos, as regras de transição e as perguntas ainda abertas, cada uma com dono.</p>
    </div>
    <div class="split">
      <aside class="toc"><a class="n2" href="#s-sistema-b-levantamento-plano-de-construcao-e-plano-de-tran">Sistema B+: levantamento, plano de construção e plano de transição</a>
<a class="n2" href="#s-sumario-executivo">Sumário executivo</a>
<a class="n1" href="#s-parte-i-o-levantamento">Parte I: O levantamento</a>
<a class="n2" href="#s-1-fontes-e-metodo">1. Fontes e método</a>
<a class="n2" href="#s-2-o-que-a-b-entrega">2. O que a B+ entrega</a>
<a class="n2" href="#s-3-como-a-operacao-roda-hoje">3. Como a operação roda hoje</a>
<a class="n2" href="#s-4-o-parque-de-sistemas-atual">4. O parque de sistemas atual</a>
<a class="n2" href="#s-5-o-que-o-banco-de-dados-mostrou">5. O que o banco de dados mostrou</a>
<a class="n2" href="#s-6-os-achados-que-orientam-o-plano">6. Os achados que orientam o plano</a>
<a class="n2" href="#s-7-linha-de-base-o-que-medir-antes-de-construir">7. Linha de base: o que medir antes de construir</a>
<a class="n1" href="#s-parte-ii-o-que-sera-feito">Parte II: O que será feito</a>
<a class="n2" href="#s-8-principios-de-produto">8. Princípios de produto</a>
<a class="n2" href="#s-9-os-modulos-e-os-blocos">9. Os módulos e os blocos</a>
<a class="n2" href="#s-10-cronograma-de-referencia">10. Cronograma de referência</a>
<a class="n2" href="#s-11-essencial-e-melhoria-onde-cada-pedido-entra">11. Essencial e melhoria: onde cada pedido entra</a>
<a class="n2" href="#s-12-o-que-cada-bloco-entrega-e-como-sera-medido">12. O que cada bloco entrega e como será medido</a>
<a class="n1" href="#s-parte-iii-a-transicao">Parte III: A transição</a>
<a class="n2" href="#s-13-duvidas-sobre-a-transicao-respondidas">13. Dúvidas sobre a transição, respondidas</a>
<a class="n2" href="#s-14-regras-da-transicao">14. Regras da transição</a>
<a class="n2" href="#s-15-o-cronograma-de-desligamento">15. O cronograma de desligamento</a>
<a class="n2" href="#s-16-pre-requisitos-e-dependencias-externas">16. Pré-requisitos e dependências externas</a>
<a class="n2" href="#s-17-riscos-da-transicao-com-prevencao">17. Riscos da transição, com prevenção</a>
<a class="n2" href="#s-18-decisoes-pedidas-a-diretoria">18. Decisões pedidas à diretoria</a>
<a class="n2" href="#s-19-perguntas-abertas-com-dono">19. Perguntas abertas, com dono</a>
<a class="n2" href="#s-20-limitacoes-deste-relatorio">20. Limitações deste relatório</a>
<a class="n2" href="#s-anexo-a-glossario-do-sistema">Anexo A: glossário do sistema</a>
<a class="n2" href="#s-anexo-b-tabelas-do-banco-por-dominio">Anexo B: tabelas do banco por domínio</a></aside>
      <div class="md"><section class="mdsec" id="s-relatorio-da-auditoria-geral">
<h2 id="s-relatorio-da-auditoria-geral">Relatório da Auditoria Geral</h2>
</section>
<section class="mdsec" id="s-sistema-b-levantamento-plano-de-construcao-e-plano-de-tran">
<h3 id="s-sistema-b-levantamento-plano-de-construcao-e-plano-de-tran">Sistema B+: levantamento, plano de construção e plano de transição</h3>
<blockquote><p>Versão 0, 21 de setembro de 2026. Triumphi Corporation para a diretoria da B+ Auditoria.</p><p>O relatório é organizado como plano: o que fazer, como fazer e em que momento. O diagnóstico entra como sustentação do plano, e não como fim em si.</p><p>Todo número tem a fonte declarada. Os que vieram de relato oral estão marcados como estimativa. Os que vieram da base de produção foram recalculados linha a linha sobre a cópia de 27 de agosto de 2026.</p></blockquote>
</section>
<section class="mdsec" id="s-sumario-executivo">
<h3 id="s-sumario-executivo">Sumário executivo</h3>
<p><strong>O que foi auditado.</strong> Seis sessões com a gerência técnica, o operacional, a governança e a diretoria; os dois manuais do sistema atual; o roadmap técnico do programador; e a cópia do banco de dados de produção de 27 de agosto de 2026, lida tabela por tabela, sem truncamento.</p>
<p><strong>O que o levantamento mostrou, em uma frase.</strong> A B+ tem uma operação técnica madura e uma base de dados mais completa do que a própria empresa supunha. O que falta não é campo nem funcionalidade: é o caminho que leva o registro de quem executa até quem decide, sem transcrição no meio.</p>
<p><strong>Os oito achados que orientam o plano:</strong></p>
<ol><li>O levantamento encontrou base consistente para migrar o cadastro de prestadores com o histórico preservado, o que reduz o risco da virada e permite que os indicadores por prestador nasçam com doze meses de série.</li><li>Existe matéria-prima para montar a leitura de margem por operação desde o início do projeto. O que precisa ser construído é a regra: faixa por região e tipo de posto, com vigência, no lugar do preço negociado caso a caso.</li><li>A cadeia diária de senhas, agenda, contagem e fechamento é uma só. Cortá-la em módulos separados manteria o fechamento manual. O Bloco 2 é desenhado em cima dessa cadeia inteira.</li><li><strong>O sistema atual já conta a produção, e mesmo assim o valor a pagar é digitado por fora.</strong> Na competência de julho de 2026, 1.506 linhas contadas automaticamente somam R$ 4,2 mil, enquanto 141 linhas de modelo fixo, digitadas uma a uma, somam R$ 626 mil. A conta que produz esse valor está escrita em prosa num campo de observação. É o alvo mais preciso do Bloco 2.</li><li>Os dois sistemas atuais escrevem no mesmo banco. Nenhum desligamento é simples: cada corte exige que o fechamento que depende dele já esteja coberto pelo sistema novo.</li><li>O gargalo da diretoria é latência de informação, não volume de decisão. Uma consulta pronta por prestador destrava a agenda da diretoria antes de qualquer automação.</li><li>Uma ausência desloca 12,9 postos em média, e em 242 substituições do último ano o posto foi marcado como coberto sem nomear quem cobriu. É a causa direta da reconstituição manual no fechamento.</li><li>A regra das 24 horas da senha clínica e a rentabilidade por operação são os dois pontos onde o sistema devolve dinheiro mensurável, e por isso entram cedo.</li></ol>
<p><strong>O plano, em uma tabela.</strong> Dez módulos agrupados em cinco blocos, três meses cada, com o primeiro em 70 dias. Último módulo em produção no mês 11, encerramento no mês 15. O bloco é a unidade de contratação, com escopo, prazo e valor próprios.</p>
<div class="tw"><table><thead><tr><th>Bloco</th><th>Módulos</th><th>O que sai do sistema atual</th><th>Produção</th></tr></thead><tbody><tr><td>1, em testes</td><td>0 Acesso e segurança, 1 Censos, relatórios e linha do tempo</td><td>Censo, visita, relatório, prontuário, acessos e painéis</td><td>Mês 3</td></tr><tr><td>2</td><td>4 Agenda de serviços e senhas, 2A Pré-análise e fechamento de contas</td><td>Capeante, painéis de contas, apuração de produtividade, fechamento de contas e faturamento</td><td>Mês 5</td></tr><tr><td>3</td><td>2B Assistente com IA, 3 Gestão financeira, App do auditor</td><td>Nada mais: é capacidade nova</td><td>Mês 7</td></tr><tr><td>4</td><td>5A Gestão de pessoas e prestadores, 5B Sistema de gestão da qualidade</td><td>Planilhas de governança, fornecedor, risco e a análise crítica manual</td><td>Mês 9</td></tr><tr><td>5</td><td>6 Inteligência de dados</td><td>Nada: é capacidade nova</td><td>Mês 11</td></tr></tbody></table></div>
<p>O App do auditor e o Assistente com IA passam a ser módulos próprios, com escopo e valor definidos, em vez de itens diluídos dentro de outros módulos.</p>
<p><strong>A transição, em quatro frases.</strong> O Bloco 1 não cobre tudo o que existe no site atual, e é de propósito: cobre censo, visita, relatório e acessos, e a tabela da seção 13 diz onde fica cada tela restante. Cada módulo roda em paralelo antes de substituir, um mês na regra e dois fechamentos mensais no bloco que paga pessoas e fatura o cliente. Existe um único usuário por pessoa, igual ao de hoje, e os dois sistemas ficam abertos apenas durante o paralelo. Com o Bloco 2 concluído e conferido, o site atual e o sistema de fechamento saem juntos do processo operacional no mês 7, e são desligados em definitivo no mês 9.</p>
<p><strong>O que a diretoria precisa decidir agora.</strong> Nove decisões, listadas na seção 18, com data de necessidade. As três mais urgentes: confirmar o corte dos blocos, definir a tabela de valores de substituição antes do Bloco 2, e verificar a cláusula de extração de dados no contrato com a MKData.</p>
</section>
<section class="mdsec" id="s-parte-i-o-levantamento">
<h2 id="s-parte-i-o-levantamento">Parte I: O levantamento</h2>
</section>
<section class="mdsec" id="s-1-fontes-e-metodo">
<h3 id="s-1-fontes-e-metodo">1. Fontes e método</h3>
<div class="tw"><table><thead><tr><th>#</th><th>Fonte</th><th>Data</th><th>Natureza da evidência</th></tr></thead><tbody><tr><td>01</td><td>Dra. Érica, gerência técnica</td><td>agosto de 2026</td><td>Relato oral, alta densidade, sem número documentado</td></tr><tr><td>02</td><td>Raquel, acessos e sistemas</td><td>agosto de 2026</td><td>Sessão com telas abertas, sistemas navegados ao vivo</td></tr><tr><td>03</td><td>Alessandra, censos, produtividade e fechamento</td><td>agosto de 2026</td><td>Sessão com telas abertas, volumes lidos na tela</td></tr><tr><td>04</td><td>Manuais MKData, do auditor e do cliente</td><td>agosto de 2026</td><td>Documental: campos, obrigatoriedades e perfis</td></tr><tr><td>05</td><td>Juliana, governança</td><td>agosto de 2026</td><td>Relato oral mais quatro planilhas de controle</td></tr><tr><td>06</td><td>Dr. Eduardo, diretor fundador</td><td>agosto de 2026</td><td>Relato oral do decisor, com decisões tomadas na sessão</td></tr><tr><td>07</td><td>Roadmap técnico do programador</td><td>9 de setembro de 2026</td><td>96 requisitos avaliados contra o código e o recorte de agosto</td></tr><tr><td>08</td><td>Cópia do banco de produção</td><td>backup de 27 de agosto de 2026</td><td>5 bancos, 461 tabelas, 32,6 milhões de linhas, lidas em CSV</td></tr></tbody></table></div>
<p><strong>Método.</strong> O levantamento foi feito no nível da entrega, não da tarefa: o que cada área precisa entregar ao cliente e o que precisa para cumprir. Foi a orientação da própria gerência técnica na sessão 01, e é o que evita construir um sistema sobre a rotina atual. Onde uma sessão corrigiu outra, prevaleceu a fonte com evidência mais dura: tela vista sobre relato, banco de dados sobre planilha.</p>
<p><strong>Sobre a cópia do banco.</strong> Verificado em 11 de setembro: nenhuma tabela foi truncada. Nas 461 entradas do índice, o número de linhas exportadas bate com o de origem. As contagens deste relatório são totais dentro da janela de cada base, e as séries no tempo são válidas dentro dessa janela.</p>
<p>Ficaram de fora duas coisas. A base de homologação não foi extraída deste backup: os arquivos existentes vieram de uma rodada anterior e param em janeiro de 2025. Isso não é perda, porque é cópia de trabalho da base de produção. E 4.040 anexos financeiros, que são certificados de conselho e documentos de cliente, vieram embutidos como texto hexadecimal dentro dos arquivos, em vez de extraídos como arquivos: são recuperáveis, mas hoje inutilizáveis, e é o único ponto a tratar como pendência de extração.</p>
<p>As janelas de tempo diferem por base, e isso importa na leitura de qualquer série:</p>
<div class="tw"><table><thead><tr><th>Base</th><th>Começa</th><th>Termina</th><th>Observação</th></tr></thead><tbody><tr><td>Internações e pacientes</td><td>2011 e 2003</td><td>27 de agosto de 2026</td><td>Quinze anos de operação, e o acervo de pacientes é ainda mais antigo</td></tr><tr><td>Financeiro</td><td>maio de 2021</td><td>27 de agosto de 2026</td><td>Cinco anos</td></tr><tr><td>Módulo novo de visitas do site atual</td><td>fevereiro de 2025</td><td>27 de agosto de 2026</td><td>Só 18 meses. A série longa da visita está no modelo antigo</td></tr><tr><td>Registro de acesso</td><td>2020</td><td>27 de agosto de 2026</td><td>O anterior já foi expurgado</td></tr><tr><td>Qualidade e documentos</td><td>2014</td><td>setembro de 2025</td><td>Parada há cerca de um ano, o que explica não ter aparecido no recorte de agosto</td></tr></tbody></table></div>
<p>A cópia completa, com espelhamento contínuo, segue como pré-requisito da transição (seção 16), agora por razão de sincronismo e não de completude.</p>
</section>
<section class="mdsec" id="s-2-o-que-a-b-entrega">
<h3 id="s-2-o-que-a-b-entrega">2. O que a B+ entrega</h3>
<h4 id="s-21-os-tres-servicos-na-taxonomia-do-decisor">2.1 Os três serviços, na taxonomia do decisor</h4>
<div class="tw"><table><thead><tr><th>Serviço</th><th>Quem executa</th><th>Cliente</th><th>Como é cobrado hoje</th></tr></thead><tbody><tr><td>Visita, ou auditoria concorrente</td><td>Médicos, em geral</td><td>Todas as operadoras</td><td>Por frequência contratada, por unidade ou fixo</td></tr><tr><td>Validação de senha clínica</td><td>Médicos</td><td>Toda a carteira, com entradas diferentes por operadora</td><td>Por senha validada dentro do prazo</td></tr><tr><td>Pré-análise de contas</td><td>Médicos e enfermeiros</td><td>Todas as operadoras</td><td>Por conta, com classificação por parcial</td></tr></tbody></table></div>
<p>A validação de senha é comercialmente apartada, com fechamento e cobrança próprios, e operacionalmente ancorada na visita: o mesmo auditor, no mesmo hospital, no mesmo dia. O sistema trata como serviço com visão própria sobre a mesma base de internação.</p>
<h4 id="s-22-a-nomenclatura-resolvida-pelo-banco">2.2 A nomenclatura, resolvida pelo banco</h4>
<p>A sessão 01 registrou a nomenclatura interna como questão aberta (&quot;V, P, VVS&quot;, sem correspondência clara). O catálogo <code>Servicos</code> do banco tem 43 códigos e resolve a questão por documento:</p>
<div class="tw"><table><thead><tr><th>Prefixo ou código</th><th>Significa</th><th>Exemplos</th></tr></thead><tbody><tr><td>V</td><td>Auditoria concorrente</td><td>V visita, VE enfermagem, VD dirigida, VVS validação de senha, VDG diária global, VLP longa permanência, VHC home care, GI gestão de internados</td></tr><tr><td>P</td><td>Pré-análise de contas</td><td>P conta única, PP1 primeira parcial, PPD parcial seguinte, PNP parcial não paga, DG diária globalizada, DAY day clinic, PS pronto socorro, CO complemento</td></tr><tr><td>Modelos de remuneração</td><td>Como o prestador é pago</td><td>FIX fixo, FXP fixo mais produtividade, FXU fixo único, MIN mínimo</td></tr></tbody></table></div>
<p>Os quatro modelos de remuneração são exatamente os quatro descritos na sessão 06 (fixo, produtividade, mínimo ou pedágio). Já estão codificados. Recomendação: adotar este catálogo como nomenclatura oficial do sistema, e decidir apenas o nome de apresentação da pré-análise, que o mercado chama de retrospectiva.</p>
<h4 id="s-23-os-modelos-comerciais-com-as-operadoras">2.3 Os modelos comerciais com as operadoras</h4>
<p>Pelo menos quatro, segundo a sessão 05: valor fixo mensal (Itaú), por unidade, por faixa de volume por hospital, e por disponibilidade de auditor (frequência diária só na Bradesco). O motor de faturamento precisa ser parametrizado por contrato, com vigência, e não um cálculo único.</p>
</section>
<section class="mdsec" id="s-3-como-a-operacao-roda-hoje">
<h3 id="s-3-como-a-operacao-roda-hoje">3. Como a operação roda hoje</h3>
<p>Descrição do fluxo atual, sem julgamento. A operação funciona e sustenta a empresa; o que este relatório propõe é adequá-la ao que o mercado passou a exigir.</p>
<h4 id="s-31-a-cadeia-diaria-senha-agenda-contagem-fechamento">3.1 A cadeia diária: senha, agenda, contagem, fechamento</h4>
<p>É a cadeia que mais importa para o plano, porque é uma só e hoje corre em quatro lugares.</p>
<pre><code>1. Diariamente, o auditor entra no CAEX (Bradesco), vê as senhas pendentes do hospital
2. Printa a tela antes de decidir, porque ao decidir o nome some da lista
3. Aprova ou cancela cada senha, com justificativa
4. Envia o print à B+ por e-mail
5. O operacional confere numa planilha quais hospitais enviaram, e cobra quem não enviou
6. A agenda de quem vai a qual hospital vive em planilha e e-mail
7. A substituição de fim de semana é negociada por telefone, uma a uma
8. No fim do mês, o que cada auditor fez é contado e fechado em duas visões:
   o que a B+ fatura de cada operadora, e o que paga a cada auditor</code></pre>
<p><strong>Regra contratual em jogo.</strong> A Bradesco paga a senha validada em até 24 horas do pedido. A regra não está no contrato escrito e foi conhecida tarde. Senha validada fora do prazo é trabalho feito e não faturado; o auditor recebe igual. Ao fim do mês aparecem centenas de senhas nessa situação, segundo estimativa oral da sessão 01. Confirmação documental é item de prioridade máxima (seção 19).</p>
<h4 id="s-32-visita-e-prorrogacao">3.2 Visita e prorrogação</h4>
<p>A maioria dos médicos digita o relatório direto no site atual; apenas dois enviam manuscrito (sessão 03). O relatório fica pendente de aprovação, passa por análise técnica interna e então fica visível, inclusive para operadoras que consultam o site diretamente. A prorrogação de diárias corre em papel do hospital, fotografado e transcrito pelo operacional no site da operadora. O acordo de custo evitado (folha rosa) fica no hospital, anexado à conta, e a foto vai para um celular específico e depois para planilha.</p>
<h4 id="s-33-censo">3.3 Censo</h4>
<p>Hospitais enviam censo por e-mail para vários endereços. Alguém baixa, salva em pasta por cliente, mês e dia, alimenta planilha e cobra quem não enviou. A gerência estimou em cerca de 500 horas por mês o esforço de consolidação. Este é o processo que o Módulo 1, já em construção, substitui: leitura automática de múltiplos arquivos com reconhecimento de hospital, continuidade do paciente entre censos, alta automática quando o paciente some, cobrança automática de censo.</p>
<h4 id="s-34-fechamento-de-contas">3.4 Fechamento de contas</h4>
<pre><code>1. Bradesco envia planilha mensal, cerca de 8.000 contas
2. A planilha é dividida em cerca de 25 arquivos por região
3. Cada arquivo é reformatado e sobe no sistema de fechamento
4. Aplica-se a classificação P, PP1, PPD, PNP
5. O arquivo classificado desce e sobe de novo
6. A regra é reconfirmada todo mês</code></pre>
<p>O download da planilha leva cerca de 3 dias. A atribuição por profissional precisa ser corrigida conta a conta, porque a Bradesco aceita um único nome por hospital no arquivo. Números da sessão 03, lidos na tela.</p>
<p><strong>Os dois fechamentos.</strong> A mesma informação alimenta duas regras diferentes: o fechamento do cliente (a operadora paga uma senha por mês, cinco contas na mesma senha são uma cobrança) e o fechamento de produtividade (por conta e por classificação, com valores distintos para médico e enfermeiro). O sistema novo modela isso como duas visões sobre a mesma base.</p>
<h4 id="s-35-agenda-e-substituicao">3.5 Agenda e substituição</h4>
<p>O hospital envia mensalmente os dias de fechamento; o operacional consolida; o auditor recebe por e-mail. Quando um auditor não pode assumir um posto, a diretoria liga um a um até encontrar quem aceita, sem tabela de valores prévia. O acordo fecha por telefone, a informação chega à Juliana por e-mail, ela lança em planilha, e no fechamento abre várias planilhas para montar a apuração de cada prestador linha por linha.</p>
<p>Na planilha de férias de 2026, 185 linhas têm substituto anotado e 83 carregam a marca &quot;OK&quot; de confirmação. A planilha já carrega um fluxo de aprovação, escrito à mão. O sistema converte o sufixo em estado.</p>
<h4 id="s-36-pagamento-ao-prestador">3.6 Pagamento ao prestador</h4>
<p>O fechamento gera o valor; a Juliana informa a cada prestador quanto emitir de nota; recebe as notas; confere uma a uma contra a planilha; o financeiro lança no banco; ela confere cada lançamento antes de aprovar. Erro recorrente: empresas de médicos com nomes quase idênticos.</p>
<h4 id="s-37-governanca-e-qualidade">3.7 Governança e qualidade</h4>
<p>A B+ tem nove filiais, cada uma com obrigações legais próprias. Mantém sistema de gestão da qualidade com análise crítica anual de cerca de 30 páginas montada à mão. O banco <code>BBDoc</code> mostra que a base documental já está estruturada: 238 documentos, 259 revisões, 171 treinamentos e 2.608 participações registradas. O que a sessão 05 descreveu como trabalho manual disperso tem, por baixo, uma base já modelada.</p>
</section>
<section class="mdsec" id="s-4-o-parque-de-sistemas-atual">
<h3 id="s-4-o-parque-de-sistemas-atual">4. O parque de sistemas atual</h3>
<div class="tw"><table><thead><tr><th>Camada</th><th>O que é</th><th>Quem mantém</th><th>Situação</th></tr></thead><tbody><tr><td>Site B+ (MKData)</td><td>Sistema web: cadastros, auditoria concorrente, visitas, capeantes, relatórios, painéis, perfil de consulta para operadoras</td><td>MKData, fornecedor com produto de prateleira do setor de saúde</td><td>Em uso diário pelo operacional, pelos auditores e por operadoras</td></tr><tr><td>Sistema de fechamento</td><td>Aplicação desktop que faz fechamento de contas, faturamento e produtividade</td><td>Márcia, sob demanda</td><td>Código aberto nas pastas; regras de negócio legíveis</td></tr><tr><td>Banco de dados</td><td>Um banco compartilhado pelos dois sistemas, hospedado em nuvem</td><td>Empresa terceira de TI</td><td>Backup com rotina diária declarada, restauração nunca testada</td></tr></tbody></table></div>
<p><strong>Três fatos com consequência direta no plano:</strong></p>
<ul><li><strong>Os dois sistemas escrevem no mesmo banco.</strong> As tabelas com prefixo <code>mk_</code> são do site; <code>AtendHI</code>, <code>ProdutividadeM</code>, <code>Escala</code> e correlatas são do sistema de fechamento. Desligar um exige que o outro continue recebendo o que precisa, ou que já tenha sido substituído. É a restrição que organiza a seção 15.</li><li><strong>A MKData é fornecedora de produto, não desenvolvedora sob encomenda.</strong> A decisão de substituir em vez de disputar o código está correta. O que precisa ser verificado no contrato não é o código, é o direito de extração completa dos dados na rescisão, em formato utilizável e prazo definido.</li><li><strong>O auditor opera em até cinco lugares para o mesmo paciente:</strong> CAEX ou Horizon (Bradesco), Carfy (Porto Seguro, com redigitação integral de cada relatório), site B+, folha rosa em papel, e papel mais WhatsApp para a prorrogação da Porto. O cadastro de auditoria concorrente exige cliente, paciente, hospital e data de internação, dados que a B+ já recebe todos os dias no censo.</li></ul>
<p><strong>Janela com prazo.</strong> O CAEX será desativado em menos de 12 meses; a Bradesco está construindo no Horizon. Existe uma janela agora para pedir extração de senhas, visão gerencial consolidada e API. Esse pedido nunca foi feito. É ação de baixo custo, independe do sistema, e está na lista de decisões (seção 18).</p>
</section>
<section class="mdsec" id="s-5-o-que-o-banco-de-dados-mostrou">
<h3 id="s-5-o-que-o-banco-de-dados-mostrou">5. O que o banco de dados mostrou</h3>
<p>Esta seção responde a três perguntas de projeto: o que da operação de hoje pode ser aproveitado, o que precisa ser construído, e o que da história da empresa sobrevive à virada.</p>
<p><strong>A resposta curta sobre o histórico.</strong> A base pode ser migrada até a data do corte de cada módulo. Nada do que foi registrado até a virada se perde, o que significa que os painéis do sistema novo nascem com série histórica e permitem comparação de mês contra mês e de ano contra ano já no primeiro dia de uso. É um ganho que só existe porque os dois sistemas atuais gravam numa base comum, e o levantamento identificou por onde a leitura passa.</p>
<p>Lido tabela por tabela na cópia do backup de 27 de agosto. Cinco bancos: <code>BBAud</code> (operação), <code>BBAudH</code> (homologação, mesmo esquema), <code>BMFin-Aud</code> e <code>BMFin-Serv</code> (financeiro de cada contrato), <code>BBDoc</code> (qualidade).</p>
<div class="tw"><table><thead><tr><th>Achado</th><th>Evidência</th><th>O que muda</th></tr></thead><tbody><tr><td>O prestador tem chave única, consistente entre operação e financeiro</td><td>As 352 identificações distintas de pagamento entre 2021 e 2026 casam 100% com <code>Auditores</code> (médicos) ou <code>Enfermeiros</code></td><td>A fragmentação vista nas planilhas é só da camada manual. Cadastro de prestador é herança de ID, não construção</td></tr><tr><td>A senha de internação é chave madura</td><td><code>AtendHI.Senha</code> preenchida em 99,3% de 1.334.813 internações</td><td>Confirma a senha como chave de conta e de cruzamento com o censo</td></tr><tr><td>Não existe CPF de paciente</td><td><code>Documento</code> vazio em 100% de 788.151 pacientes; data de nascimento preenchida em 97,2%</td><td>A chave de paciente é nome mais data de nascimento. A plataforma nova ainda não guarda data de nascimento na internação: correção barata e urgente</td></tr><tr><td>Há base de preço a migrar, sem regra por trás</td><td><code>ClienteServP</code> com 1.056 linhas de custo por prestador, cliente, serviço e hospital; <code>ClienteServCob</code> com 61 linhas de receita por serviço. Doze dos catorze serviços têm mais de um valor praticado</td><td>A leitura de margem por operação pode partir daí. O trabalho do módulo é transformar 1.056 acordos individuais em tabela com faixa e vigência</td></tr><tr><td>A classificação de conta já mora no banco</td><td><code>AtendHI.Servico</code> carrega P, PP1, PPD, PNP, DG e CO, gravados pelo sistema de fechamento</td><td>O que o site não sabe (qual parcial), o banco sabe. O sistema novo calcula a sequência por regra em vez de reconfirmar todo mês</td></tr><tr><td>A agenda real está no banco, em três camadas</td><td><code>EscalaPadrao</code> com 1.635 postos vigentes de 4.566 registrados, <code>EscalaDiaria</code> com 43.020 períodos de titular, <code>Ferias</code> com 1.504 ausências</td><td>A agenda de serviços migra de tabelas estruturadas, não de planilha</td></tr><tr><td>A substituição tem vínculo próprio, e ele foi identificado</td><td>A coluna de substituição da agenda é o número do evento de ausência: 1.493 de 1.493 casam, sem órfão. O sistema divide o período do titular e insere a linha do substituto com as datas exatas da ausência</td><td>13.956 substituições no acervo, 1.417 no último ano, com titular, substituto, motivo e data de registro. É a base da tela de substituição</td></tr><tr><td>O valor a pagar não sai do que o sistema conta</td><td>Em julho de 2026, 1.506 linhas de produção contadas pelo sistema somam R$ 4,2 mil; 141 linhas de modelo fixo, digitadas, somam R$ 626 mil. A memória de cálculo está em texto livre no campo de observação, em 1.869 linhas</td><td>É o alvo do fechamento de produtividade do Bloco 2, e está detalhado no achado 6.10</td></tr><tr><td>Existe um prestador fictício no cadastro</td><td>Id 999999, nome &quot;COBERTURA&quot;, presente nos dois cadastros, sem registro de conselho. Aparece como substituto em 2.841 registros, 242 no último ano</td><td>Mede exatamente o problema que o aceite nominal resolve</td></tr><tr><td>Diária globalizada é campo estruturado, e raro por hospital</td><td>8 de 459 hospitais marcados</td><td>Precisa ser tratada por conta, não só por hospital; no recorte de agosto, 38% das contas são DG</td></tr><tr><td>O acervo da qualidade tem lastro para migrar</td><td><code>BBDoc</code> com documentos, revisões, treinamentos e vínculo cargo a documento</td><td>O Módulo 5B começa com acervo e histórico de treinamento, e não com o sistema vazio</td></tr><tr><td>Campo existe, ninguém preenche</td><td>Em 8.485 visitas do site, prorrogação estruturada tem 688 registros (8%), procedimentos 111 (1%), alto custo 3, home care 1</td><td>O problema nunca foi falta de campo. É o princípio de desenho da seção 8</td></tr></tbody></table></div>
</section>
<section class="mdsec" id="s-6-os-achados-que-orientam-o-plano">
<h3 id="s-6-os-achados-que-orientam-o-plano">6. Os achados que orientam o plano</h3>
<p><strong>6.1 A informação existe; falta o caminho.</strong> Senha que depende de print, fechamento que depende de sobe e desce, substituição que depende de telefonema, pagamento que depende de conferência visual, análise crítica que depende de 30 páginas manuais. Em todos os casos o dado existe e o que falta é o percurso de quem registra até quem decide. Seis fontes consecutivas convergem nisso.</p>
<p><strong>6.2 O site atual tem campo para quase tudo.</strong> Negociação direta (custo evitado), prorrogação, cuidados domiciliares, evento adverso, medicamentos de alto custo: as abas existem há anos e as taxas de uso ficam entre 0% e 8%. Se o registro não está no caminho natural do trabalho de quem executa, ele não é feito. É o alerta mais direto sobre o nosso próprio projeto, e vira princípio de produto.</p>
<p><strong>6.3 A cadeia diária é uma só.</strong> Senha, agenda, contagem e fechamento são o mesmo fluxo em quatro lugares. Cortar em módulos separados manteria o fechamento manual. O Bloco 2 (seção 9) é desenhado sobre a cadeia inteira, cobrindo inclusive a conta hospitalar, que passou a caber neste bloco com o ajuste de sequência.</p>
<p><strong>6.4 O gargalo da diretoria é latência.</strong> &quot;Cada vez que vou falar com um auditor, tenho que buscar as informações, e isso me toma tempo. Por isso eu não consigo dar conta.&quot; Uma consulta pronta por prestador, com volume, valores, aceites e recusas dos últimos 12 meses, destrava a agenda do decisor antes de qualquer automação de convite. É entrega de baixo custo e alto retorno percebido.</p>
<p><strong>6.5 Os valores contratuais são decisão de negócio, cadastrada no sistema.</strong> A diretoria aceitou modelos e valores tabelados, aplicados pelo sistema, com aumento de faixa vinculado a engajamento e não a barganha. O sistema só cumpre isso se a diretoria sustentar a tabela quando o primeiro auditor ligar apelando. Sem tabela definida antes da construção, o módulo automatiza a negociação caso a caso.</p>
<p><strong>6.6 Duas fontes de dinheiro mensurável.</strong> A senha clínica dentro das 24 horas é ganho em reais no primeiro mês de uso. A margem por operação (hospital, operadora, serviço) é o número que hoje não existe e que a diretoria descreveu como o que leva a precificar, incluindo o subsídio pago em hospitais onde a produtividade não remunera o auditor. As duas entram cedo no plano por esse motivo.</p>
<p><strong>6.10 O sistema conta, e a pessoa calcula.</strong> Esta é a descoberta mais consequente da leitura do banco, e ela redefine o alvo do fechamento de produtividade.</p>
<p>O sistema atual já registra, mês a mês, quantos serviços cada prestador executou, por operadora, hospital e tipo. Em julho de 2026 são 1.506 linhas e 89.888 unidades contadas. O que essas linhas somam em dinheiro é R$ 4,2 mil. Ao lado delas existem 141 linhas de modelo fixo, digitadas uma a uma, que somam R$ 626 mil, ou seja, 99% do que se paga.</p>
<p>E a conta que produz esses R$ 626 mil está escrita em prosa, no campo de observação, em linhas como estas, copiadas do banco:</p>
<pre><code>20P X17,00=340 E 44X12,00=528,00/TOTAL868,00
HMV=R$400 X 4= R$1.600/ HMV= R$4.000,00 / +2.800,00
MÍNIMO R$900,00/RECEBE PROD= 1.589,00</code></pre>
<p>São 1.869 linhas com memória de cálculo digitada. A última mostra o subsídio descrito na sessão 06, decidido à mão: compara o mínimo garantido com o que a produção rendeu.</p>
<p>Três consequências para o plano:</p>
<ol><li><strong>O fechamento de produtividade não precisa inventar a regra, precisa transcrevê-la.</strong> A regra está nas observações e nos preços de <code>ClienteServP</code>. O módulo passa a calcular o que hoje é digitado, e a observação vira memória automática.</li><li><strong>O subsídio é estrutural, não exceção.</strong> Se 99% do pagamento é fixo, a diferença entre o fixo pago e a produção entregue é o subsídio de cada operação, e ele é calculável hoje, hospital por hospital.</li><li><strong>Os preços por serviço existem mas quase não geram valor no banco.</strong> Falta confirmar se são usados para chegar ao fixo mensal ou se o fixo é negociado por fora. É a pergunta 5 da seção 19, e ela precisa da Juliana antes do protótipo do Bloco 2.</li></ol>
<p><strong>6.11 Uma ausência desloca a agenda inteira, e às vezes sem nome.</strong> Cada ausência registrada gera, em média, 12,9 postos substituídos, porque o mesmo prestador ocupa vários postos em vários hospitais e operadoras. A antecedência mediana entre o registro e o início é de 4 dias, e 348 substituições do último ano foram registradas com 2 dias ou menos.</p>
<p>Em 242 dessas substituições, o substituto registrado é o cadastro fictício de nome &quot;COBERTURA&quot;. O posto consta como coberto e o sistema não sabe por quem. É a origem mecânica do que a Alessandra descreveu na sessão 03: reconstituir o mês inteiro no fechamento para pagar a pessoa certa. O aceite nominal do Módulo 4 elimina isso por construção, e o indicador de sucesso já existe: essas 242 substituições precisam ir a zero.</p>
<p><strong>6.7 Toda regra é atributo da operadora, com vigência.</strong> A Bradesco é o caso fora da curva, não o padrão: subdivide urgência em clínica e cirúrgica, aceita um nome por hospital, tem senha no CAEX. Porto Seguro tem o Carfy e formulário próprio; Itaú controla por e-mail com SLA de um dia. Modelar sobre a Bradesco travaria a expansão comercial, que é o objetivo declarado. Toda regra parametrizada por contrato leva data de início e de fim desde a primeira versão do banco.</p>
<p><strong>6.8 O vocabulário é decisão jurídica.</strong> &quot;Escala não pode mais. Tem que ser agenda de serviços.&quot; A B+ tem atividade mista: técnicos internos CLT e auditores prestadores. As telas usam agenda de serviços, substituição, prestador, contratado e posto. Nunca escala, cobertura, colaborador, funcionário, ponto, jornada, subordinado ou equipe. O glossário e a política de localização vão ao jurídico da B+ numa mesma consulta, antes das telas do Módulo 4.</p>
<p><strong>6.9 O sistema sugere; o médico decide.</strong> A diretoria acompanhou duas ondas de &quot;a auditoria vai acabar&quot; (pacotes, diária globalizada) e um sistema que parametrizava indicação de UTI e saiu do país. O julgamento clínico não se parametriza. Alinha com o princípio da Dra. Érica: a B+ empresta conhecimento técnico, a decisão é da operadora. Fica escrito como princípio de produto.</p>
</section>
<section class="mdsec" id="s-7-linha-de-base-o-que-medir-antes-de-construir">
<h3 id="s-7-linha-de-base-o-que-medir-antes-de-construir">7. Linha de base: o que medir antes de construir</h3>
<p>O contrato condiciona a aprovação de cada onda à medição da anterior. Sem estes números, o ganho vira opinião. A captura acontece no levantamento de cada bloco, antes de qualquer construção.</p>
<div class="tw"><table><thead><tr><th>Indicador</th><th>Unidade</th><th>Fonte</th><th>Bloco que mede</th></tr></thead><tbody><tr><td>Horas por mês na consolidação de censos</td><td>horas</td><td>previsão da gerência, cerca de 500</td><td>1</td></tr><tr><td>Senhas clínicas validadas por mês, e quantas fora das 24 horas</td><td>volume e R$</td><td>prints e planilha do operacional</td><td>2</td></tr><tr><td>Horas por semana da diretoria em negociação de substituição</td><td>horas</td><td>registro amostral de duas semanas</td><td>2</td></tr><tr><td>Horas por mês da Juliana montando apurações de prestador</td><td>horas</td><td>registro amostral de um fechamento</td><td>2</td></tr><tr><td>Substituições por mês e variação de valor por substituição</td><td>volume e R$</td><td>planilha da Juliana e <code>EscalaDiaria</code></td><td>2</td></tr><tr><td>Erros de pagamento por mês, pessoa ou valor errado</td><td>ocorrências</td><td>financeiro</td><td>2 e 3</td></tr><tr><td>Substituições por mês sem prestador nomeado</td><td>contagem</td><td>agenda, hoje 242 em 12 meses</td><td>2</td></tr><tr><td>Linhas de pagamento digitadas por fora do cálculo</td><td>contagem</td><td>produtividade, hoje 141 por competência</td><td>2</td></tr><tr><td>Tempo de download e preparo da planilha mensal da Bradesco</td><td>dias</td><td>operacional, hoje cerca de 3 dias</td><td>3</td></tr><tr><td>Idade média dos capeantes em aberto</td><td>dias</td><td>site atual, status Em Aberto</td><td>3</td></tr><tr><td>Contas por mês, por classificação e por operadora</td><td>volume</td><td><code>AtendHI</code></td><td>3</td></tr><tr><td>Valor total de subsídio pago por mês</td><td>R$</td><td><code>ClienteServP</code> cruzada com produtividade</td><td>3 e 6</td></tr><tr><td>Contratos ativos sem reajuste há mais de 24 meses</td><td>contagem</td><td>Juliana</td><td>3 e 6</td></tr><tr><td>Tempo de montagem da análise crítica anual</td><td>horas</td><td>Juliana, cerca de 30 páginas</td><td>4</td></tr><tr><td>Ações por mês que exigem intervenção da Juliana</td><td>contagem</td><td>medição em um fechamento</td><td>2 e 4</td></tr><tr><td>Percentual do tempo do auditor em atividade administrativa</td><td>%</td><td>medição amostral, não estimativa</td><td>App</td></tr></tbody></table></div>
<p>Regra do plano: nenhuma onda é aprovada sem o resultado da anterior medido contra esta tabela.</p>
</section>
<section class="mdsec" id="s-parte-ii-o-que-sera-feito">
<h2 id="s-parte-ii-o-que-sera-feito">Parte II: O que será feito</h2>
</section>
<section class="mdsec" id="s-8-principios-de-produto">
<h3 id="s-8-principios-de-produto">8. Princípios de produto</h3>
<p>Valem para todos os módulos e entram no anexo de cada onda como característica obrigatória, não como melhoria.</p>
<ol><li><strong>O registro nasce no caminho do trabalho.</strong> Toda coleta nova vive dentro de uma tela que a pessoa já usa para outra coisa. Campo em aba separada repete o destino das abas do site atual.</li><li><strong>O sistema sugere; o profissional decide.</strong> Sugestão de CID, relatório estruturado por IA, classificação de conta: sempre com confirmação humana. A IA não assina parecer.</li><li><strong>Revisão interna antes de subir à operadora.</strong> O valor da B+ está em filtrar e conciliar antes que a informação chegue ao cliente. O portão de análise técnica já existe no Módulo 1.</li><li><strong>Toda regra é atributo da operadora, com data de início e de fim.</strong> Nada é fixo no código.</li><li><strong>Todo indicador de volume mostra o mês e as médias móveis de 6 e 12 meses.</strong> Um hospital que represa contas engana nos dois sentidos; a média é a verdade.</li><li><strong>Todo número exibido tem fórmula rastreável.</strong> Há histórico de decisão tomada sobre indicador errado, dos dois lados.</li><li><strong>Quem registra é quem recebe.</strong> A contagem de produtividade segue o login. Resolve sozinha a senha compartilhada e a atribuição por hospital.</li><li><strong>Vocabulário de prestação, nunca de subordinação.</strong> Glossário da seção 6.8, revisado pelo jurídico.</li><li><strong>Nada de exclusão de cadastro.</strong> Inativação com justificativa, sempre.</li><li><strong>Celular como plataforma do auditor.</strong> PWA, sem loja de aplicativos, com localização registrada e não bloqueante, sob base contratual.</li></ol>
</section>
<section class="mdsec" id="s-9-os-modulos-e-os-blocos">
<h3 id="s-9-os-modulos-e-os-blocos">9. Os módulos e os blocos</h3>
<p>A diretoria decidiu construir dois módulos por vez, na ordem apresentada. Este relatório propõe um ajuste na composição dos blocos 2 e 3, justificado pela cadeia diária (achado 6.3) e pelas dependências de desligamento (seção 15). A decisão é da diretoria; a sequência original está registrada como alternativa na seção 18.</p>
<h4 id="s-bloco-1-em-construcao-modulo-0-e-modulo-1">Bloco 1, em construção: Módulo 0 e Módulo 1</h4>
<p>Já construídos em parte e demonstrados. Na conferência de 16 de setembro, feita item a item contra o código, o núcleo dos dois módulos está em uso: acessos por perfil com trilha de autoria, leitura automática de censo com reconhecimento de hospital e de leito, alta automática, prazo por operadora, encaixe automático de relatório e cobrança automática de censo. São capacidades que o sistema atual não tem, e são as que tiram a consolidação diária de censo da mão do operacional.</p>
<p>Dois itens de gestão de risco merecem registro da diretoria, porque respondem ao que qualquer operadora pergunta numa auditoria de contrato: a <strong>política de proteção de dados</strong> escrita, com o que é tratado, quem acessa, por quanto tempo e o que se faz em caso de incidente; e o <strong>isolamento no banco</strong>, que impede a leitura de dado de paciente por fora da aplicação. A <strong>criptografia dos campos que identificam o paciente</strong> está construída e testada, e passa a valer no dia em que a chave for gerada e configurada no servidor: essa configuração é pré-requisito de entrada em produção.</p>
<p>O que ainda falta no bloco é levantamento, não código: identidade do paciente por nome e nascimento, catálogo de motivo de saída, separação de internação clínica e cirúrgica no formato que a Bradesco exige, e o fluxo de mãe e recém-nascido. Cada um entra no anexo do bloco com a regra de negócio definida com a gerência técnica.</p>
<p>A auditoria geral fecha os detalhes pendentes e o bloco segue para um mês de desenvolvimento e um mês de testes. Prazo de referência: 70 dias da assinatura.</p>
<p>Três correções baratas, com prazo de validade, já identificadas pelo programador: a linha de autenticação que descarta o papel de analista; a data de nascimento na internação, antes que a base cresça; e a tabela de agenda com eixo de tempo, enquanto ainda está vazia.</p>
<h4 id="s-bloco-2-modulo-4-e-modulo-2a">Bloco 2: Módulo 4 e Módulo 2A</h4>
<p><strong>Módulo 4, Agenda de serviços, com a entrada de senhas como fonte diária.</strong></p>
<ul><li>Postos contratados por cliente, hospital e serviço, com os descobertos sempre visíveis (migração de <code>EscalaPadrao</code>).</li><li>Titular por período e substituição, com aceite digital do prestador (migração de <code>EscalaDiaria</code> e <code>Ferias</code>).</li><li>Modelos e valores contratuais cadastrados por cliente e por prestador, com região, tipo de posto, faixa vinculada a engajamento e vigência. O sistema calcula sempre pela configuração aprovada pela diretoria, e a exceção precisa ser declarada como exceção.</li><li>Convite de substituição por proximidade e histórico de aceite, com registro de quem aceitou e quem recusou.</li><li>Entrada diária de senhas, para toda a carteira e não para um cliente só. O que muda de operadora para operadora é a porta de entrada, e ela é configuração, não versão diferente do sistema:</li><li>operadoras sem sistema próprio: a solicitação é registrada direto no sistema B+;</li><li>Bradesco: a solicitação nasce no sistema da operadora, e a adequação de entrada é o trabalho de construção deste item. A leitura automática depende de uma amostra real da tela (seção 19), e a carta pedindo extração e integração reduz esse esforço;</li><li>operadoras com portal próprio, como a Porto Seguro: entrada assistida lado a lado, sem redigitação integral.</li></ul>
<p>A partir da entrada o caminho é um só: relógio de prazo por contrato, alerta antes de vencer, contagem no login de quem decidiu, e o registro alimentando o fechamento de contas depois.</p>
<ul><li>Consulta 360º do prestador: volume, valores, aceites e recusas, últimos 12 meses, com médias móveis.</li><li>As telas do auditor (agenda do dia, aceitar substituição, confirmar visita) já nascem responsivas neste módulo. O aplicativo instalável, com uso fora de área, é o módulo App do Bloco 3.</li></ul>
<p><strong>Módulo 2A, pré-análise e fechamento de contas, inteiro.</strong></p>
<ul><li>Cada senha analisada, visita feita e relatório subido conta na hora, no login de quem fez.</li><li><strong>O valor deixa de ser digitado.</strong> Hoje 141 linhas por competência carregam o valor a pagar, com a conta escrita em prosa ao lado (achado 6.10). O módulo calcula essas linhas a partir da contagem e dos preços, e guarda a memória de cálculo como dado, não como texto. Quem digita hoje passa a conferir a exceção.</li><li>Fechamento mensal em duas visões: quanto faturar de cada operadora, quanto pagar a cada prestador, sobre <code>ProdutividadeM</code>, <code>PagtoPre</code>, <code>ClienteServP</code> e <code>ClienteServCob</code>.</li><li>Cálculo do subsídio por operação: diferença entre o fixo pago e a produção entregue, por hospital e operadora.</li><li>Capa de conta como registro próprio, com classificação P, PP1, PPD e PNP calculada a partir de senha, início de cobrança e data de internação. Elimina a rotina mensal de subir, classificar, baixar e subir.</li><li>Distinção entre conta aberta e diária globalizada, por conta.</li><li>Item de glosa e contestação, separando parte médica e de enfermagem. É a maior entidade do projeto.</li><li>A planilha mensal da operadora passa a ser conferência, não fonte.</li><li>Camada de saída configurável por operadora: exportação formatada, entrada assistida lado a lado para quem exige portal próprio, integração quando houver.</li><li>Contas de pronto socorro e ambulatorial: decisão de escopo explícita no levantamento deste bloco.</li><li>Portões de aprovação da governança: fechar a apuração, autorizar as notas, liberar o pagamento com dupla aprovação. Tudo o mais que hoje é transcrito passa a ser consequência de registro feito por quem executa.</li></ul>
<p><strong>Cadastro do prestador como camada comum.</strong> Ficha, contratos, CRM e COREN com validade, preço por serviço. É migração de <code>Auditores</code>, <code>Enfermeiros</code> e <code>ClienteServP</code>, não construção. O restante do 5A fica para o Bloco 4.</p>
<p><strong>Este é o bloco que paga as pessoas e fatura o cliente</strong>, e por isso o paralelo é de dois fechamentos mensais, não de um. É também o bloco que completa a substituição dos dois sistemas atuais: com ele conferido, os dois saem do processo operacional (seção 15).</p>
<p><strong>Régua de aceite do bloco</strong>, quatro números medidos antes e depois:</p>
<ol><li>As ações por mês que exigem intervenção da governança caem pelo menos à metade.</li><li>As linhas de pagamento digitadas por fora do cálculo caem de 141 por competência para as exceções justificadas.</li><li>As substituições sem prestador nomeado caem de 242 por ano para zero, porque o aceite é nominal.</li><li>Os dias de preparo da planilha mensal da operadora caem para o tempo de uma conferência.</li></ol>
<h4 id="s-bloco-3-modulo-2b-modulo-3-e-app-do-auditor">Bloco 3: Módulo 2B, Módulo 3 e App do auditor</h4>
<p>Com os dois sistemas atuais já fora do processo operacional, este bloco não substitui nada: acrescenta capacidade que hoje não existe.</p>
<p><strong>Módulo 2B, assistente com IA.</strong> Sugestão de código de diagnóstico a partir do texto que o hospital envia, relatório estruturado a partir de texto livre ou de voz, leitura de censo que chega como imagem, e indicador de acerto visível. Entra neste bloco por um motivo de método: depois dos blocos 1 e 2 o registro já nasce estruturado e com dado real do processo, que é a condição para calibrar o assistente e medir assertividade. Vale a regra fixada pela diretoria: o sistema sugere, o profissional confirma, e nada gerado por IA chega ao cliente sem revisão humana.</p>
<p><strong>Módulo 3, gestão financeira.</strong> Valor definido antes da nota, remessa bancária gerada pelo sistema, retenções por prestador, plano de contas com contas a pagar, a receber e bancos, e conciliação de recebimento como alerta de vencimento, sem integração bancária, por decisão da sessão 05. Duas aprovações separadas: quem altera valor não é quem libera pagamento.</p>
<p><strong>App do auditor.</strong> Aplicativo instalável em celular e tablet, sem depender de loja, com uso fora de área e sincronização quando o sinal volta. Agenda do dia, contexto do paciente pré-carregado, confirmação de visita, captura por foto usando a leitura de imagem do 2B, mensagens no lugar do e-mail corporativo e recuperação de senha pelo próprio prestador. Entra depois dos módulos que ele apoia, para nascer sobre processo já estável.</p>
<p><strong>Por que os três juntos.</strong> Os três dependem da base organizada pelos blocos anteriores e nenhum deles gate um desligamento. É o bloco de ganho de produtividade na ponta, com o risco operacional mais baixo do projeto.</p>
<h4 id="s-bloco-4-modulo-5a-mais-modulo-5b">Bloco 4: Módulo 5A mais Módulo 5B</h4>
<ul><li>5A: indicadores de performance (volume contra demanda real, retrabalho, responsividade, glosa contra o perfil do hospital), alertas de conduta, avaliação anual, separação entre índice de engajamento (visível ao prestador) e índice de performance (não exposto), padrão mínimo estadual e nacional. Depende de meses de dado capturado pelos blocos 2 e 3.</li><li>5B: migração de <code>BBDoc</code>, qualificação de fornecedor, análise crítica mensal com o mesmo esforço da anual, matriz de riscos, não conformidades, documentação legal por filial.</li></ul>
<h4 id="s-bloco-5-modulo-6">Bloco 5: Módulo 6</h4>
<p>Modelo dimensional Cliente, Filial, Hospital, Serviço, Auditor, que é a chave composta de <code>ProdutividadeM</code> e <code>Agenda</code>. Centro de custo com rateio, índice de viabilidade, simulador de contrato, hospitais subsidiados, rentabilidade em dois níveis (unidade e carteira). Depende de valor monetário, que só existe completo após o Bloco 3.</p>
<h4 id="s-sobre-a-numeracao-dos-modulos">Sobre a numeração dos módulos</h4>
<p>A numeração original de nove módulos foi mantida, e dois itens que antes apareciam como transversais passam a ser módulos próprios: o Assistente com IA, que já tinha número (2B), e o App do auditor. A razão é prática: como cada bloco é contratado com escopo, prazo e valor próprios, um item diluído dentro de outro módulo não tem como ser dimensionado nem aprovado separadamente.</p>
</section>
<section class="mdsec" id="s-10-cronograma-de-referencia">
<h3 id="s-10-cronograma-de-referencia">10. Cronograma de referência</h3>
<p>Grade em quinzenas. Levantamento e protótipo de cada onda correm dentro do mês de testes da anterior.</p>
<div class="tw"><table><thead><tr><th>Onda</th><th>Quinzenas</th><th>Módulo em produção</th><th>Marco</th></tr></thead><tbody><tr><td>1</td><td>1 a 5</td><td>Mês 3</td><td>Auditoria geral, desenvolvimento, testes</td></tr><tr><td>2</td><td>4 a 9</td><td>Mês 5</td><td>Agenda de serviços e fechamento de produtividade em uso</td></tr><tr><td>3</td><td>8 a 13</td><td>Mês 7</td><td>Contas e financeiro em uso; paralelo de dois meses até o mês 8 ou 9</td></tr><tr><td>4</td><td>12 a 17</td><td>Mês 9</td><td>Pessoas e gestão em uso</td></tr><tr><td>5</td><td>16 a 21</td><td>Mês 11</td><td>BI em uso</td></tr><tr><td>Encerramento</td><td>23 a 30</td><td>Mês 15</td><td>Análise de resultado, documentação, transferência in house</td></tr></tbody></table></div>
<p>O cronograma é prévio e de referência. A duração do desenvolvimento de cada bloco varia conforme a robustez definida no levantamento, e o cronograma definitivo de cada onda consta do seu anexo. O mês adicional de paralelo do Bloco 3 não está na grade acima e entra no anexo daquela onda.</p>
<p>O prazo de cerca de um ano para desligar o sistema atual, que a diretoria já tinha em mente, é cumprido com folga: os dois sistemas saem do processo operacional no mês 7 e são desligados em definitivo no mês 9 (seção 15).</p>
</section>
<section class="mdsec" id="s-11-essencial-e-melhoria-onde-cada-pedido-entra">
<h3 id="s-11-essencial-e-melhoria-onde-cada-pedido-entra">11. Essencial e melhoria: onde cada pedido entra</h3>
<p>Critério do contrato: é essencial o item sem o qual o processo não pode ser executado de ponta a ponta dentro do sistema. Todo o resto é melhoria, registrada, nunca recusada, repriorizada a cada onda. A lista abaixo consolida os pedidos que apareceram nas sessões.</p>
<div class="tw"><table><thead><tr><th>Pedido</th><th>Sessão</th><th>Classificação</th><th>Onde entra</th></tr></thead><tbody><tr><td>Leitura automática de censo, alta automática, prazo por operadora</td><td>03</td><td>Essencial</td><td>Bloco 1, feito</td></tr><tr><td>Identidade de paciente por nome e data de nascimento</td><td>03, banco</td><td>Essencial</td><td>Bloco 1</td></tr><tr><td>Catálogo de motivo de alta, CID com sugestão</td><td>01, 03</td><td>Essencial</td><td>Bloco 1 e 2B</td></tr><tr><td>Agenda de serviços em três camadas, substituição com aceite</td><td>02, 05, 06</td><td>Essencial</td><td>Bloco 2</td></tr><tr><td>Tabela de valores aplicada pelo sistema, faixa por engajamento</td><td>05, 06</td><td>Essencial</td><td>Bloco 2</td></tr><tr><td>Entrada de senhas com relógio de 24 horas</td><td>01</td><td>Essencial</td><td>Bloco 2</td></tr><tr><td>Consulta 360º do prestador</td><td>06</td><td>Essencial</td><td>Bloco 2</td></tr><tr><td>Fechamento de produtividade em duas visões</td><td>03</td><td>Essencial</td><td>Bloco 2 (visita e senha) e 3 (contas)</td></tr><tr><td>Convite por proximidade e rota do auditor</td><td>06</td><td>Melhoria promovida</td><td>Bloco 2 (convite), backlog (rota)</td></tr><tr><td>Classificação de parcial por cálculo</td><td>03, 04</td><td>Essencial</td><td>Bloco 3</td></tr><tr><td>Folha rosa como marcação dentro do relatório</td><td>03</td><td>Essencial</td><td>Bloco 3, com registro já no 1</td></tr><tr><td>Remessa bancária, dupla aprovação, retenções</td><td>05</td><td>Essencial</td><td>Bloco 3</td></tr><tr><td>Redigitação assistida para o Carfy</td><td>03</td><td>Essencial</td><td>Bloco 3</td></tr><tr><td>Capeante de pronto socorro e ambulatorial</td><td>04</td><td>A decidir no levantamento</td><td>Bloco 3</td></tr><tr><td>Protocolo TISS no lugar da planilha</td><td>roadmap</td><td>Melhoria</td><td>Backlog</td></tr><tr><td>Ficha do hospital com contatos por função e índice de dificuldade</td><td>05</td><td>Essencial parcial</td><td>Bloco 1 (estrutura), 4 (índice)</td></tr><tr><td>Ficha do auditor como fornecedor, CRM com validade</td><td>05</td><td>Essencial</td><td>Bloco 2 (núcleo), 4 (completo)</td></tr><tr><td>Alertas de conduta, avaliação anual, padrão nacional</td><td>05</td><td>Essencial do 5A</td><td>Bloco 4</td></tr><tr><td>SGQ: fornecedores, riscos, não conformidades, satisfação, treinamentos</td><td>05</td><td>Essencial do 5B</td><td>Bloco 4</td></tr><tr><td>Documentação legal por filial</td><td>05</td><td>Essencial do 5B</td><td>Bloco 4</td></tr><tr><td>Centro de custo, índice de viabilidade, simulador de contrato</td><td>05, 06</td><td>Essencial do 6</td><td>Bloco 5</td></tr><tr><td>Hospitais subsidiados, rentabilidade em dois níveis</td><td>06</td><td>Essencial do 6</td><td>Bloco 5</td></tr><tr><td>Mapa do Brasil com prestadores e proximidade</td><td>05</td><td>Melhoria</td><td>Backlog, protótipo já existe</td></tr><tr><td>Gamificação com níveis e benefícios</td><td>05</td><td>Depende de decisão sobre exposição de índice</td><td>Bloco 4</td></tr><tr><td>Análise de codificação CID por IA entre auditores</td><td>05</td><td>Melhoria</td><td>Backlog, exige histórico</td></tr><tr><td>Integração bancária para conciliação</td><td>05</td><td>Descartada pela própria sessão</td><td>Não entra</td></tr><tr><td>API com Bradesco, Horizon</td><td>01</td><td>Fora do sistema</td><td>Carta à Bradesco agora</td></tr><tr><td>Emissão de nota fiscal ao cliente</td><td>05</td><td>Melhoria</td><td>Backlog; o sistema gera o espelho</td></tr><tr><td>Notificação push, e-mail automático</td><td>02, 03</td><td>Melhoria</td><td>Backlog</td></tr></tbody></table></div>
</section>
<section class="mdsec" id="s-12-o-que-cada-bloco-entrega-e-como-sera-medido">
<h3 id="s-12-o-que-cada-bloco-entrega-e-como-sera-medido">12. O que cada bloco entrega e como será medido</h3>
<div class="tw"><table><thead><tr><th>Bloco</th><th>Entregável de aceite</th><th>Indicador de resultado, contra a linha de base</th></tr></thead><tbody><tr><td>1</td><td>Censos lidos automaticamente, relatórios com análise técnica, timeline por paciente, perfis com trilha</td><td>Horas por mês na consolidação de censos; tempo entre censo e relatório</td></tr><tr><td>2</td><td>Agenda de serviços em uso por prestadores e coordenação; senhas entrando todo dia com relógio de prazo; contas classificadas por cálculo; fechamento do cliente e do prestador sobre a mesma base</td><td>Senhas fora do prazo contratual; horas da diretoria em substituição; ações por mês que exigem a governança; dias de preparo da planilha mensal; erros de pagamento</td></tr><tr><td>3</td><td>Assistente com indicador de acerto medido; remessa bancária gerada pelo sistema; registro em campo pelo celular</td><td>Retrabalho de escritório após a visita; tempo entre a visita e o relatório registrado; erros de pagamento</td></tr><tr><td>4</td><td>Ficha completa do prestador com indicadores; SGQ com análise crítica mensal</td><td>Tempo da análise crítica; tempo para encontrar prestador por região</td></tr><tr><td>5</td><td>Painéis por decisor com o modelo dimensional</td><td>Contratos precificados com margem conhecida; subsídio quantificado</td></tr></tbody></table></div>
</section>
<section class="mdsec" id="s-parte-iii-a-transicao">
<h2 id="s-parte-iii-a-transicao">Parte III: A transição</h2>
</section>
<section class="mdsec" id="s-13-duvidas-sobre-a-transicao-respondidas">
<h3 id="s-13-duvidas-sobre-a-transicao-respondidas">13. Dúvidas sobre a transição, respondidas</h3>
<p>São as perguntas que a operação faz quando ouve falar em troca de sistema. As respostas abaixo valem para todos os blocos e estão escritas para serem lidas por qualquer pessoa da empresa.</p>
<p><strong>1. &quot;Esta primeira etapa contempla tudo que está no site atual, ou fica faltando coisa?&quot;</strong></p>
<p>Não contempla tudo, e é de propósito. O Bloco 1 cobre censo, visita (auditoria concorrente), relatório com análise técnica, timeline e acessos. As demais telas do site atual ficam onde estão até o bloco que as substitui:</p>
<div class="tw"><table><thead><tr><th>Tela do site atual</th><th>Onde fica no sistema novo</th><th>Quando</th></tr></thead><tbody><tr><td>Auditoria concorrente, visitas, relatórios</td><td>Módulo 1</td><td>Bloco 1</td></tr><tr><td>Cadastro de paciente</td><td>Módulo 1, com identidade por nome e nascimento</td><td>Bloco 1</td></tr><tr><td>Usuários e perfis</td><td>Módulo 0</td><td>Bloco 1</td></tr><tr><td>Perfil de consulta da operadora</td><td>Módulo 0, perfil Operadora com escopo por carteira</td><td>Bloco 1, único perfil ainda por fazer</td></tr><tr><td>Painel da concorrente</td><td>Módulo 1, painéis do gestor e da diretoria</td><td>Bloco 1</td></tr><tr><td>Abas da visita: negociação direta, prorrogação, cuidados domiciliares</td><td>Módulo 1 como marcação dentro do relatório; autorização econômica no 2A</td><td>Bloco 1 e 3</td></tr><tr><td>Capeante de internados</td><td>Módulo 2A, capa de conta</td><td>Bloco 3</td></tr><tr><td>Capeante de pronto socorro e ambulatorial</td><td>Módulo 2A, com decisão de escopo</td><td>Bloco 3</td></tr><tr><td>Painel de contas</td><td>Módulo 2A e 6</td><td>Bloco 3 e 5</td></tr><tr><td>Tabela de diária</td><td>Módulo 2A, precificação por cliente, vigência e acomodação</td><td>Bloco 3</td></tr><tr><td>Treze catálogos clínicos</td><td>Migrados como dado desde o Bloco 1; mantidos como catálogo</td><td>Bloco 1</td></tr></tbody></table></div>
<p>E do sistema de fechamento: a produtividade de visita e senha passa ao Bloco 2; o fechamento de contas e o faturamento passam ao Bloco 3.</p>
<p><strong>2. &quot;Quando começa a rodar: em paralelo à MKData, ou substituindo?&quot;</strong></p>
<p>Em paralelo, sempre, por módulo. O sistema novo entra com dado real, a equipe opera nos dois durante o mês de testes, e os resultados são comparados (mesmo censo, mesmo relatório, mesma apuração). Confirmada a equivalência, treinamento e corte em data definida: sexta à noite, para a segunda já operar no novo. Nos blocos 2 e 3, que pagam pessoas e faturam o cliente, o paralelo é de dois fechamentos mensais, não um.</p>
<p><strong>3. &quot;Vão existir dois logins no site ao mesmo tempo?&quot;</strong></p>
<p>Um único usuário por pessoa, igual ao atual, criado pelo administrador. Durante o paralelo, a pessoa entra nos dois sistemas com o mesmo usuário. Após o corte, o sistema antigo fica em modo consulta para o histórico que ainda não migrou, até o desligamento. Uma recomendação que muda o atual: os prestadores hoje usam senha padrão porque esquecem; o sistema novo dá senha individual com recuperação pelo próprio prestador, no celular. É exigência de proteção de dados de paciente e resolve, de passagem, a produtividade registrada na pessoa errada.</p>
<p><strong>4. &quot;Em que momento cada desligamento acontece?&quot;</strong></p>
<p>Pela regra da seção 15: nenhum sistema é desligado antes de o fechamento que depende dele estar coberto pelo sistema novo e conferido por um paralelo. A tabela da seção 15 dá o momento de cada um.</p>
</section>
<section class="mdsec" id="s-14-regras-da-transicao">
<h3 id="s-14-regras-da-transicao">14. Regras da transição</h3>
<ol><li><strong>Trabalho sobre banco espelhado, nunca no de produção.</strong> A cópia estática já serviu ao desenho; a cópia completa com espelhamento contínuo é pré-requisito do Bloco 1 (seção 16).</li><li><strong>Paralelo por módulo</strong>, um mês na regra, dois meses nos módulos que pagam pessoas ou faturam cliente.</li><li><strong>Corte em data definida</strong>, sexta à noite, com o antigo em modo consulta a partir da segunda.</li><li><strong>Escrita dupla temporária onde o sistema remanescente precisa do dado.</strong> Enquanto o sistema de fechamento continuar contando produtividade de visita (entre o corte do Bloco 1 e a entrada do Bloco 2), o sistema novo entrega esse dado no formato que ele lê. É a etapa de sincronização que o banco compartilhado exige, desenhada antes do anexo da Onda 2.</li><li><strong>Histórico migrado antes do desligamento</strong>, com teste de restauração do backup feito antes de qualquer promessa de comparação histórica.</li><li><strong>Logins mantidos</strong>, senha individual para prestadores.</li><li><strong>Treinamento é marco, não sobra de tempo.</strong> O aceite de cada bloco depende dele.</li><li><strong>Aceite por decurso de prazo:</strong> 15 dias corridos de operação assistida para apontar divergências contra o anexo, por escrito.</li></ol>
</section>
<section class="mdsec" id="s-15-o-cronograma-de-desligamento">
<h3 id="s-15-o-cronograma-de-desligamento">15. O cronograma de desligamento</h3>
<p>A regra é uma só: nenhum sistema sai antes de o que ele fazia estar rodando no sistema novo e conferido por um paralelo. Por isso o desligamento é progressivo, e acontece em três momentos.</p>
<p><strong>Momento 1, mês 3, com o Bloco 1 conferido.</strong> O site atual perde a maior parte do uso diário e fica apenas com o capeante.</p>
<div class="tw"><table><thead><tr><th>O que sai do site atual</th><th>Passa a ser feito em</th><th>Condição para o corte</th></tr></thead><tbody><tr><td>Recebimento e leitura de censo</td><td>Módulo 1</td><td>Um mês de paralelo com os mesmos hospitais, mesmo resultado</td></tr><tr><td>Registro de visita e relatório com análise técnica</td><td>Módulo 1</td><td>Mesmo paralelo</td></tr><tr><td>Prontuário e linha do tempo do paciente</td><td>Módulo 1</td><td>Histórico migrado e conferido por amostragem</td></tr><tr><td>Usuários, perfis e consulta da operadora</td><td>Módulo 0</td><td>Matriz de acessos conferida</td></tr><tr><td>Painéis de acompanhamento</td><td>Módulo 1</td><td>Números iguais aos do painel atual</td></tr><tr><td>Planilhas de consolidação e cobrança de censo</td><td>Módulo 1</td><td>Saem junto, no mesmo corte</td></tr></tbody></table></div>
<p><strong>Momento 2, mês 7, com o Bloco 2 conferido.</strong> É o marco principal da transição: os dois sistemas atuais saem juntos do processo operacional.</p>
<div class="tw"><table><thead><tr><th>O que sai</th><th>Passa a ser feito em</th><th>Condição para o corte</th></tr></thead><tbody><tr><td>Site atual, capeante e painéis de contas</td><td>Módulo 2A</td><td>Dois fechamentos mensais seguidos com resultado igual</td></tr><tr><td>Sistema de fechamento, apuração de produtividade</td><td>Módulo 2A</td><td>Mesmo paralelo, com conferência linha a linha do valor por prestador</td></tr><tr><td>Sistema de fechamento, contas e faturamento</td><td>Módulo 2A</td><td>Mesmo paralelo, com a nota ao cliente conferida</td></tr><tr><td>Planilhas de agenda, férias, substituição e telefone</td><td>Módulo 4</td><td>Modelos e valores contratuais cadastrados e aprovados</td></tr><tr><td>Controle de senhas por print e planilha</td><td>Módulo 4</td><td>Entrada de cada operadora funcionando, inclusive a adequação da Bradesco</td></tr><tr><td>Planilhas de pagamento e conferência de nota</td><td>Módulo 2A</td><td>Um mês de pagamento conferido contra o cálculo do sistema</td></tr></tbody></table></div>
<p><strong>Momento 3, mês 9.</strong> Encerrado o ciclo de conferência, os dois sistemas são desligados em definitivo. Entre o mês 7 e o mês 9 eles permanecem disponíveis apenas para consulta, sem receber registro novo.</p>
<p><strong>O que não é desligado pela B+.</strong> Os sistemas das operadoras seguem existindo, porque são delas: o sistema da Bradesco, o portal da Porto Seguro e os controles por e-mail de outras operadoras. O que muda é que deixam de ser o lugar onde a informação da B+ mora. Cada um passa a ser apenas uma porta de entrada, tratada por configuração, e a informação passa a viver no sistema da B+, de onde sai o fechamento e o faturamento.</p>
<p><strong>Depois do mês 9.</strong> Os blocos 3, 4 e 5 não desligam mais nada, porque já não há o que desligar. Eles acrescentam capacidade que hoje não existe: assistente, aplicativo de campo, gestão financeira completa, indicadores por prestador, sistema da qualidade e inteligência de dados.</p>
</section>
<section class="mdsec" id="s-16-pre-requisitos-e-dependencias-externas">
<h3 id="s-16-pre-requisitos-e-dependencias-externas">16. Pré-requisitos e dependências externas</h3>
<div class="tw"><table><thead><tr><th>Pré-requisito</th><th>Responsável</th><th>Prazo necessário</th><th>Trava</th></tr></thead><tbody><tr><td>Cópia completa do banco e rotina de espelhamento, pela empresa de TI ou pela Márcia</td><td>B+, com a Triumphi</td><td>Antes do fim da auditoria geral</td><td>Todo o Bloco 1</td></tr><tr><td>Teste de restauração do backup, com evidência</td><td>Empresa de TI, acompanhada pela Triumphi</td><td>Antes de qualquer promessa de histórico</td><td>Migração de histórico</td></tr><tr><td>Contrato MKData: cláusula de extração e devolução de dados, aviso prévio, carência</td><td>Juliana</td><td>Esta semana</td><td>Cronograma de desligamento</td></tr><tr><td>Teste de segregação do perfil Cliente no site atual</td><td>Raquel, dez minutos</td><td>Esta semana</td><td>Exposição entre operadoras</td></tr><tr><td>Carta à Bradesco: extração de senhas, visão gerencial, API, antes do Horizon congelar</td><td>Dr. Eduardo e Dra. Érica</td><td>Durante a auditoria geral</td><td>Entrada de senhas por API no futuro</td></tr><tr><td>Consulta ao jurídico: glossário, geolocalização, cláusula de registro no local no contrato do prestador</td><td>Juliana</td><td>Antes do protótipo do Bloco 2</td><td>Telas do Módulo 4</td></tr><tr><td>Tabela de valores de substituição por região e tipo de posto</td><td>Dr. Eduardo e Juliana</td><td>Antes do protótipo do Bloco 2</td><td>Módulo 4</td></tr><tr><td>Amostra real do print de senhas pendentes do CAEX</td><td>Dra. Érica</td><td>Antes do protótipo do Bloco 2</td><td>Leitura automática de senhas</td></tr><tr><td>Acesso às pastas de censo de todos os hospitais</td><td>Alessandra</td><td>Já em curso</td><td>Treino da leitura de censo</td></tr><tr><td>Leitura do código aberto do sistema de fechamento</td><td>Triumphi, com autorização da Márcia</td><td>Levantamento do Bloco 3</td><td>Regras de parcial e faturamento</td></tr></tbody></table></div>
</section>
<section class="mdsec" id="s-17-riscos-da-transicao-com-prevencao">
<h3 id="s-17-riscos-da-transicao-com-prevencao">17. Riscos da transição, com prevenção</h3>
<div class="tw"><table><thead><tr><th>Risco</th><th>Como aparece</th><th>Prevenção</th></tr></thead><tbody><tr><td>Cópia do banco depende de terceiro fora do contrato</td><td>Onda 1 parada esperando acesso</td><td>Responsável e prazo nomeados no anexo; caminho pela Márcia já em curso; cláusula de atraso atribuível</td></tr><tr><td>Backup não íntegro</td><td>Histórico prometido não migra</td><td>Teste de restauração antes de qualquer promessa</td></tr><tr><td>Escrita dupla mal desenhada</td><td>Produtividade de visita some do fechamento entre os blocos 1 e 2</td><td>Formato de entrega ao sistema de fechamento definido no anexo da Onda 2, testado num fechamento</td></tr><tr><td>Sistema construído sobre a rotina atual</td><td>Burocracia informatizada</td><td>Levantar entrega, não tarefa; protótipo validado por quem executa</td></tr><tr><td>Campo certo, ninguém preenche</td><td>Adoção baixa, dado vazio</td><td>Registro no caminho do trabalho; adoção medida desde a primeira semana</td></tr><tr><td>Diretoria não sustentar a tabela de valores</td><td>Negociação caso a caso volta e o módulo vira enfeite</td><td>Alinhamento explícito antes da construção, registrado como condição de sucesso</td></tr><tr><td>Aprovação parada</td><td>Protótipo esperando semanas</td><td>Atraso da B+ desloca prazo sem alterar preço; com ciclo de 3 meses, uma semana custa o dobro</td></tr><tr><td>Pessoas no limite</td><td>As mesmas pessoas validam o módulo em teste e participam do levantamento seguinte</td><td>Mês de agenda dupla bloqueado com antecedência, quatro vezes no projeto</td></tr><tr><td>CAEX desativado antes do módulo</td><td>Retrabalho de integração</td><td>Não acoplar; tratar como fonte descartável</td></tr><tr><td>Diversidade de formatos de print e de folha</td><td>Leitura automática estoura o prazo</td><td>Inventário de formatos no levantamento, antes do anexo</td></tr><tr><td>Vocabulário de subordinação nas telas</td><td>Passivo trabalhista</td><td>Glossário revisado pelo jurídico; verificação antes de publicar</td></tr><tr><td>Expectativa de escopo além do contratado</td><td>Atrito</td><td>Lista da seção 11 na mesa de cada reunião de onda</td></tr><tr><td>Errar o fechamento que paga pessoas</td><td>Folha de prestador errada</td><td>Dois meses de paralelo no Bloco 3; a regra 4 no Bloco 2</td></tr></tbody></table></div>
</section>
<section class="mdsec" id="s-18-decisoes-pedidas-a-diretoria">
<h3 id="s-18-decisoes-pedidas-a-diretoria">18. Decisões pedidas à diretoria</h3>
<div class="tw"><table><thead><tr><th>#</th><th>Decisão</th><th>Quem</th><th>Necessária até</th><th>Recomendação</th></tr></thead><tbody><tr><td>1</td><td>Aprovar o ajuste de sequência proposto na seção 9, ou manter a ordem original</td><td>Dr. Eduardo</td><td>Fim da auditoria geral</td><td>Aprovar o ajuste, porque antecipa a saída dos dois sistemas atuais para o mês 7</td></tr><tr><td>2</td><td>Modelos e valores contratuais a cadastrar no sistema, por cliente e por prestador, com a regra de faixa por engajamento</td><td>Dr. Eduardo e Juliana</td><td>Antes do protótipo do Bloco 2</td><td>Definir antes: é a configuração pela qual o sistema passa a calcular todo fechamento</td></tr><tr><td>3</td><td>Exposição de índices ao prestador</td><td>Dr. Eduardo e Juliana, juntos</td><td>Antes do protótipo do Bloco 2</td><td>Engajamento visível, performance e qualidade não</td></tr><tr><td>4</td><td>Nome de apresentação dos serviços</td><td>Diretoria</td><td>Antes do protótipo do Bloco 2</td><td>Adotar o catálogo do banco; decidir só o nome da pré-análise</td></tr><tr><td>5</td><td>Consulta ao jurídico sobre glossário, localização e contrato do prestador</td><td>Juliana</td><td>Antes do protótipo do Bloco 2</td><td>Uma consulta só, com os três temas</td></tr><tr><td>6</td><td>Carta à Bradesco sobre extração de senhas, visão gerencial e integração</td><td>Dr. Eduardo e Dra. Érica</td><td>Durante a auditoria geral</td><td>Enviar agora: reduz o trabalho de adequação de entrada e a janela está aberta</td></tr><tr><td>7</td><td>Verificação do contrato do fornecedor atual quanto a dados na rescisão</td><td>Juliana</td><td>Esta semana</td><td>Verificar antes de marcar a data de saída dos sistemas atuais</td></tr><tr><td>8</td><td>Quem sobe os prints das senhas diariamente, e a que horas</td><td>Dra. Érica e Juliana</td><td>Antes do protótipo do Bloco 2</td><td>Nomear a pessoa e o horário; é a fonte do módulo</td></tr><tr><td>9</td><td>Escopo do sistema de gestão e das contas de pronto socorro</td><td>Juliana e Dra. Érica</td><td>Levantamento dos blocos 3 e 4</td><td>Classificar item a item pelo critério do contrato</td></tr></tbody></table></div>
</section>
<section class="mdsec" id="s-19-perguntas-abertas-com-dono">
<h3 id="s-19-perguntas-abertas-com-dono">19. Perguntas abertas, com dono</h3>
<p>Consolidadas das seis sessões e do banco. As que travam o Bloco 2 vêm primeiro. Três perguntas levantadas no início do trabalho já foram respondidas pela equipe técnica e saíram desta lista: o vínculo da substituição, o escopo da cópia da base e o significado do campo de vínculo do serviço. As respostas estão nas seções 1 e 5.</p>
<div class="tw"><table><thead><tr><th>#</th><th>Pergunta</th><th>Dono</th><th>Trava</th></tr></thead><tbody><tr><td>1</td><td>Os preços por serviço são usados para chegar ao valor fixo mensal de cada prestador, ou o fixo é negociado por fora e a produção só conta?</td><td>Juliana e Dr. Eduardo</td><td>Regra de cálculo do fechamento</td></tr><tr><td>2</td><td>A memória de cálculo digitada no campo de observação tem planilha de apoio por trás, ou é feita na hora?</td><td>Juliana</td><td>Fonte da regra a automatizar</td></tr><tr><td>3</td><td>O cadastro fictício usado para marcar posto coberto sem nomear quem cobriu é recurso aceito ou registro a eliminar?</td><td>Juliana</td><td>Regra do aceite nominal</td></tr><tr><td>4</td><td>A regra das 24 horas está formalizada em algum lugar? Há penalidade por prazo?</td><td>Juliana</td><td>Relógio de senha e faturamento</td></tr><tr><td>5</td><td>Formato exato da tela de senhas pendentes do CAEX, com amostra</td><td>Dra. Érica</td><td>Leitura automática</td></tr><tr><td>6</td><td>A validação de senha tem 30 postos vigentes e nenhum registro de produtividade. Ela é remunerada dentro do fixo, ou não é contada?</td><td>Juliana</td><td>Faturamento da senha</td></tr><tr><td>7</td><td>Datas reais do ciclo de fechamento mensal, do primeiro ao último passo</td><td>Juliana</td><td>Cadência do Bloco 2</td></tr><tr><td>8</td><td>Preço geral do prestador para o cliente é a linha sem hospital definido?</td><td>Juliana</td><td>Cálculo de pagamento</td></tr><tr><td>9</td><td>Quem, além da Juliana, decide que um posto não precisa de substituto?</td><td>Juliana</td><td>Fluxo de aprovação</td></tr><tr><td>10</td><td>Diária globalizada: como afeta esforço, remuneração e preço?</td><td>Dr. Eduardo</td><td>Bloco 3</td></tr><tr><td>11</td><td>O ciclo de parcial de 7 dias e o teto de 4 valem para todas as operadoras?</td><td>Alessandra</td><td>Bloco 3</td></tr><tr><td>12</td><td>Porto Seguro e Carfy: existe exportação ou API?</td><td>Juliana</td><td>Camada de saída</td></tr><tr><td>13</td><td>Itaú: SLA contratual exato por tipo de solicitação</td><td>Juliana</td><td>Regra por operadora</td></tr><tr><td>14</td><td>Bradesco: é possível pedir o arquivo mensal com identificação por profissional?</td><td>Dra. Érica</td><td>Bloco 3</td></tr><tr><td>15</td><td>Os 4.040 anexos financeiros embutidos no backup valem extração na migração, ou recadastro?</td><td>Artur e programador</td><td>Escopo do 5A</td></tr><tr><td>16</td><td>Data do último reajuste de cada contrato ativo</td><td>Juliana</td><td>Argumento comercial</td></tr><tr><td>17</td><td>Custo mensal atual do sistema web</td><td>Juliana</td><td>Retorno do projeto</td></tr><tr><td>18</td><td>A base usada nos manuais do fornecedor é mascarada?</td><td>Raquel</td><td>Proteção de dados</td></tr><tr><td>19</td><td>Quais hospitais são subsidiados hoje, e quanto?</td><td>Dr. Eduardo</td><td>Bloco 5, com o cálculo do 6.10 como ponto de partida</td></tr><tr><td>20</td><td>Norma mantida, calendário de auditoria externa, exigências ambientais e sociais dos clientes</td><td>Juliana</td><td>Bloco 4</td></tr></tbody></table></div>
</section>
<section class="mdsec" id="s-20-limitacoes-deste-relatorio">
<h3 id="s-20-limitacoes-deste-relatorio">20. Limitações deste relatório</h3>
<ul><li>A cópia do banco veio sem truncamento, mas cada base tem sua própria janela de tempo (seção 1). Nenhuma série foi lida para trás do início da sua base, e a base de qualidade está parada desde setembro de 2025.</li><li>Duas linhas de produtividade com quantidade de 124.541 em junho de 2026 foram tratadas como erro de lançamento e excluídas dos totais. Estão nomeadas no protótipo.</li><li>O significado das letras do campo de vínculo do serviço é leitura derivada do dado, porque o backup não traz dicionário. O agrupamento é inequívoco; a nomenclatura, não.</li><li>As sessões 01, 05 e 06 são relato oral. Percentuais citados nelas (por exemplo, 30% a 40% do tempo do auditor em atividade administrativa) são estimativa e estão assim marcados.</li><li>O roadmap do programador foi lido a partir do PDF fornecido em 9 de setembro, com o recorte de agosto, que cobre 27 de 31 dias.</li><li>A pós-análise (resposta a questionamento da operadora) não foi levantada em nenhuma sessão. Está sem nome estável, dono e métrica, e precisa de sessão própria antes do Bloco 3.</li><li>Os contratos com as operadoras não foram lidos. As regras de pagamento e prazo aqui descritas vêm das sessões.</li><li>A composição dos blocos 2 e 3 é recomendação. A sequência original da apresentação segue como alternativa até a decisão 1.</li></ul>
</section>
<section class="mdsec" id="s-anexo-a-glossario-do-sistema">
<h3 id="s-anexo-a-glossario-do-sistema">Anexo A: glossário do sistema</h3>
<div class="tw"><table><thead><tr><th>Usar</th><th>No lugar de</th><th>Motivo</th></tr></thead><tbody><tr><td>Agenda de serviços</td><td>Escala</td><td>Vocabulário de prestação, decisão do Dr. Eduardo</td></tr><tr><td>Substituição, redirecionamento</td><td>Cobertura</td><td>Idem</td></tr><tr><td>Prestador, contratado</td><td>Colaborador, funcionário</td><td>Auditores são pessoas jurídicas</td></tr><tr><td>Posto</td><td>Vaga, turno</td><td>Unidade contratada por cliente, hospital e serviço</td></tr><tr><td>Aceite</td><td>Confirmação de presença</td><td>O prestador aceita o convite; não é convocado</td></tr><tr><td>Auditoria concorrente, visita</td><td>V, VP</td><td>Catálogo de serviços</td></tr><tr><td>Pré-análise de contas</td><td>Capeante, retrospectiva, fechamento</td><td>Nome de apresentação a decidir</td></tr><tr><td>Validação de senha</td><td>Senha clínica</td><td>Serviço com visão própria</td></tr><tr><td>Senha</td><td>Número de atendimento, código do paciente</td><td>Chave de internação e de conta</td></tr></tbody></table></div>
</section>
<section class="mdsec" id="s-anexo-b-tabelas-do-banco-por-dominio">
<h3 id="s-anexo-b-tabelas-do-banco-por-dominio">Anexo B: tabelas do banco por domínio</h3>
<div class="tw"><table><thead><tr><th>Domínio</th><th>Tabela</th><th>Linhas na cópia</th><th>Uso no sistema novo</th></tr></thead><tbody><tr><td>Prestador</td><td><code>BBAud.Auditores</code>, <code>BBAud.Enfermeiros</code></td><td>chaves de 233 médicos e 120 enfermeiros com pagamento</td><td>Cadastro, herança de ID</td></tr><tr><td>Paciente</td><td><code>BBAud.Pacientes</code></td><td>788.151</td><td>Identidade por nome e nascimento</td></tr><tr><td>Internação e conta</td><td><code>BBAud.AtendHI</code></td><td>1.334.813</td><td>Senha, serviço, classificação</td></tr><tr><td>Glosa</td><td><code>BBAud.AtendHIGlosa</code></td><td>5.838.603</td><td>Bloco 3</td></tr><tr><td>Diagnóstico</td><td><code>BBAud.AtendHIDiagnostico</code></td><td>701.084</td><td>CID</td></tr><tr><td>Agenda</td><td><code>BBAud.EscalaPadrao</code>, <code>EscalaDiaria</code>, <code>Ferias</code>, <code>Agenda</code></td><td>4.566, 43.020, 1.504, 168 mil</td><td>Módulo 4</td></tr><tr><td>Serviço</td><td><code>BBAud.Servicos</code></td><td>43</td><td>Catálogo oficial</td></tr><tr><td>Preço de custo</td><td><code>BMFin-Aud.ClienteServP</code></td><td>1.056</td><td>Pagamento ao prestador</td></tr><tr><td>Preço de receita</td><td><code>BMFin-Aud.ClienteServCob</code></td><td>61</td><td>Faturamento</td></tr><tr><td>Produtividade</td><td><code>BBAud.ProdutividadeM</code>, <code>BMFin-Aud.ProdutividadeM</code></td><td>150.293 e 51.136</td><td>Fechamento em duas visões</td></tr><tr><td>Pagamento</td><td><code>BMFin-Aud.PagtoPre</code>, <code>PagtoPreItens</code></td><td>4.991 e 5.866</td><td>Módulo 3</td></tr><tr><td>Contrato e fornecedor</td><td><code>BMFin-Aud.Clientes</code></td><td>572</td><td>Retenções por prestador</td></tr><tr><td>Qualidade</td><td><code>BBDoc.Documento</code>, <code>DocRevisao</code>, <code>Treinamento</code>, <code>TreinamentoPart</code></td><td>238, 259, 171, 2.608</td><td>Módulo 5B</td></tr><tr><td>Perfis do site</td><td><code>BBAud.mk_perfil</code>, <code>mk_perfilxmenu</code></td><td>13 perfis, 27 telas</td><td>Módulo 0</td></tr></tbody></table></div>
</section></div>
    </div>
  </section>

  <p class="foot">Relatório produzido pela Triumphi Corporation para a diretoria da B+ Auditoria. Os números apresentados foram apurados no levantamento de agosto e setembro de 2026, com a origem de cada um declarada no relatório completo. Este arquivo contém valores de pagamento e não deve circular fora da diretoria.</p>
</div>`
