// Corrigir um paciente direto da lista de conferência do envio.
//
// O momento de achar o erro é este: o usuário está com o PDF ao lado, lendo
// linha a linha. Até aqui, notar que um nome veio truncado ou uma data errada
// obrigava a sair da tela, ir à Visão Geral, procurar o paciente e abrir a ficha
// — o suficiente para a correção ficar para depois, e depois não acontecer.
//
// Só os campos que a LISTA mostra. A ficha completa (diagnóstico, médico,
// especialidade, observações) continua na Visão Geral: aqui o objetivo é
// consertar o que se acabou de conferir, não substituir a ficha.

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Operadora, PacienteGravado } from '../../types/api'
import { editarInternacao, type InternacaoEdicao } from '../../services/internacao.service'
import { useConvenios, useCriarConvenio } from '../../hooks/useInternacao'
import { ConvenioCombobox } from '../ConvenioCombobox'
import { Modal, Spinner } from '../ui'
import { paraISO } from '../../lib/datas'
import { useAuth } from '../../auth/AuthContext'
import { podeExecutar } from '../../auth/permissions'

export const editarPacienteStyles = `
.up-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 14px}
.up-edit-campo{display:grid;gap:4px;min-width:0}
.up-edit-campo.inteira{grid-column:span 2}
.up-edit-lbl{font-size:var(--t-xs);text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:var(--muted)}
.up-edit-erro{margin-top:10px;font-size:var(--t-sm);color:var(--danger-2);background:var(--danger-bg);border-radius:var(--r-sm);padding:7px 10px}
/* Cadastro de convenio, INLINE sob o campo. Nao e outra modal de proposito: o
   usuario esta no meio de uma correcao, e empilhar uma segunda camada sobre a
   que ja esta sobreposta ao resultado do envio faz perder de vista o paciente
   que se estava consertando. */
.up-edit-novo{margin-top:8px;padding:10px;border:1px solid var(--primary-2);border-radius:var(--r-md);background:var(--primary-soft);display:grid;gap:8px}
.up-edit-novo-tit{font-size:var(--t-sm);font-weight:700;color:var(--ink-1)}
.up-edit-novo-txt{font-size:var(--t-xs);color:var(--ink-2);line-height:1.45}
.up-edit-novo-linha{display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center}
.up-edit-novo-erro{font-size:var(--t-xs);color:var(--danger-2)}
`

/** O que a modal edita — subconjunto de `InternacaoEdicao` (os campos da lista). */
interface Rascunho {
  nome: string
  atendimento: string
  /** Número do paciente na operadora. Editável porque é o campo que o parser
   *  erra por um dígito: vários geradores imprimem a carteirinha quebrada em
   *  duas linhas, e quem está com o PDF aberto conserta na hora. */
  carteirinha: string
  leito_codigo: string
  convenio: string
  /** Key do cadastro, ou '' quando o paciente está sem operadora. */
  operadora_key: string
  data_entrada: string
  data_alta: string
}

function doPaciente(p: PacienteGravado): Rascunho {
  return {
    nome: p.nome ?? '',
    atendimento: p.atendimento ?? '',
    carteirinha: p.carteirinha ?? '',
    leito_codigo: p.leito_codigo ?? '',
    convenio: p.convenio ?? '',
    operadora_key: p.operadora_key ?? '',
    // As datas entram em ISO porque o <input type="date"> só exibe esse
    // formato: o banco guarda "17/08/2026" (3.823 das 3.900 internações) e o
    // campo recebia isso, não reconhecia e ficava EM BRANCO — a modal parecia
    // ter perdido a data de internação, que é obrigatória para o paciente.
    data_entrada: paraISO(p.data_entrada),
    data_alta: paraISO(p.data_alta),
  }
}

/** O valor a ENVIAR para uma data: o cru quando o usuário não mexeu.
 *
 *  Sem isto, toda edição reescreveria a data em ISO só por ter aberto a modal —
 *  e o estrago seria nas que o `<input type="date">` não consegue exibir (ano de
 *  2 dígitos, "31/08/26": 74 registros). Nelas `paraISO` devolve '', o campo
 *  abre vazio, e salvar mandaria vazio, APAGANDO a data. Mesma regra do
 *  `valorData` do assistente de complemento. */
function valorData(original: string | null | undefined, editado: string): string {
  return editado === paraISO(original) ? (original ?? '') : editado
}

export function EditarPacienteModal({ paciente, operadoras = [], onFechar, onSalvo,
                                     posicaoNaFila, totalNaFila, onProximo }: {
  paciente: PacienteGravado
  /** Cadastro de operadoras, para escolher a certa quando o convênio do PDF não
   *  foi reconhecido. Vazio = a tela não carregou o cadastro; o campo vira só
   *  leitura em vez de oferecer uma lista vazia que não resolve nada. */
  operadoras?: Operadora[]
  onFechar: () => void
  /** Devolve o paciente já com os campos novos, para a linha se atualizar sem
   *  refazer o envio inteiro. */
  onSalvo: (atualizado: PacienteGravado) => void
  /** Posição deste paciente na fila de marcados da aba (1-based), e o tamanho
   *  dela. Servem só ao rótulo "3 de 11": quem está corrigindo em série precisa
   *  saber quanto falta, senão o botão pede uma travessia de tamanho
   *  desconhecido. Ausentes = a modal foi aberta fora de uma fila. */
  posicaoNaFila?: number
  totalNaFila?: number
  /** Avança para o próximo marcado da fila SEM fechar a modal. Ausente quando
   *  não há próximo (último da fila, ou aberto fora de uma fila): o botão some,
   *  em vez de virar um clique que não faz nada. */
  onProximo?: () => void
}) {
  const [r, setR] = useState<Rascunho>(() => doPaciente(paciente))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)


  // A lista só é buscada com a modal aberta: varre o histórico de internações, e
  // a maioria dos envios nunca abre a edição de um paciente.
  const convQ = useConvenios(true)
  const convenios = convQ.data?.convenios ?? []
  const carregandoConvenios = convQ.isLoading

  // Cadastrar convênio é ação de CADASTRO (diretor/admin), não de operação: o
  // nome passa a existir para todas as telas e leva junto a operadora que o
  // cobre. Quem não pode continua escolhendo da lista e digitando texto livre,
  // exatamente como antes — nada foi tirado de ninguém.
  const { role } = useAuth()
  const podeCriarConvenio = podeExecutar(role, 'criarConvenio')
  const criarConv = useCriarConvenio()
  // O nome que está sendo cadastrado. `null` = o painel está fechado.
  const [novoConvenio, setNovoConvenio] = useState<string | null>(null)
  // A operadora do convênio novo, escolhida à parte da do paciente: são decisões
  // diferentes. "Este convênio pertence à Bradesco" vale para o cadastro
  // inteiro; "este paciente é Bradesco" vale para uma internação. Confundi-las
  // faria cadastrar um convênio na operadora errada só porque o paciente que
  // estava aberto estava errado — que é justamente o caso que se corrige aqui.
  const [novoOperadora, setNovoOperadora] = useState('')
  const [erroNovo, setErroNovo] = useState<string | null>(null)

  // Trocar de paciente SEM fechar a modal (o "Salvar e próximo") remonta TUDO o
  // que é daquele paciente: o rascunho dos campos, o erro do salvamento e o
  // painel de cadastro de convênio.
  //
  // Fica DEPOIS de todas as declarações de propósito: os estados do cadastro
  // (`novoConvenio`, `novoOperadora`, `erroNovo`) são declarados acima, e com o
  // reset lá em cima eles não podiam ser alcançados — o painel aberto num
  // paciente continuava aberto no seguinte, com o nome do convênio do anterior
  // dentro, e um clique em "Cadastrar" criaria o convênio errado.
  //
  // Comparar por `paciente.id` guardado, e não um `useEffect` com dependência:
  // o efeito rodaria DEPOIS da renderização, então haveria um quadro com o nome
  // novo no título e os valores velhos nos campos — tempo de sobra para um
  // clique rápido salvar a mistura. Aqui o estado é corrigido durante a própria
  // renderização, que é o padrão do React para estado derivado de props.
  const [idAberto, setIdAberto] = useState(paciente.id ?? null)
  if ((paciente.id ?? null) !== idAberto) {
    setIdAberto(paciente.id ?? null)
    setR(doPaciente(paciente))
    setErro(null)
    setNovoConvenio(null)
    setNovoOperadora('')
    setErroNovo(null)
  }

  const original = doPaciente(paciente)
  // Só o que MUDOU vai para o backend: mandar o resto faria a trilha de
  // auditoria registrar campos "alterados" que ninguém tocou.
  const mudancas: InternacaoEdicao = {}
  for (const k of Object.keys(r) as (keyof Rascunho)[]) {
    // A comparação é ISO contra ISO: `original` também passou por `doPaciente`.
    if (r[k] === original[k]) continue
    // Mas o que se ENVIA é o valor cru quando a data não foi tocada — ver
    // `valorData`. Serve às datas que o input não exibe (ano de 2 dígitos): ali
    // `paraISO` devolve '', o campo abre vazio, e mandar esse vazio apagaria a
    // data que está no banco.
    mudancas[k] = (k === 'data_entrada' || k === 'data_alta')
      ? valorData(paciente[k], r[k])
      : r[k]
  }
  const temMudanca = Object.keys(mudancas).length > 0

  function campo(k: keyof Rascunho, v: string) {
    setR((atual) => ({ ...atual, [k]: v }))
  }

  /** O convênio escolhido, quando é um dos que os censos já trouxeram.
   *  Compara sem caixa e sem espaço repetido — a mesma normalização que o
   *  backend usa para agrupar, senão "BRADESCO  SAUDE" digitado à mão não
   *  casaria com a entrada da lista. */
  const casado = useMemo(() => {
    const alvo = r.convenio.trim().replace(/\s+/g, ' ').toUpperCase()
    if (!alvo) return null
    const achado = convenios.find(
      (c) => c.convenio.trim().replace(/\s+/g, ' ').toUpperCase() === alvo)
    return achado?.operadora_key ? achado : null
  }, [convenios, r.convenio])

  // Duas formas de resolver, porque o alerta tem duas causas:
  //   * escolher a operadora certa (o caso do convênio que não casou);
  //   * corrigir o TEXTO do convênio para um que o sistema reconhece, estando o
  //     paciente já na operadora certa. Aqui `mudancas.operadora_key` vem vazio
  //     (nada a trocar), e exigir a troca deixaria o alerta na tela depois de o
  //     usuário ter corrigido exatamente o que ele apontava.
  const operadoraNova = mudancas.operadora_key
    && operadoras.some((o) => o.key === mudancas.operadora_key)
  const convenioCorrigido = Boolean(mudancas.convenio && casado
    && casado.operadora_key === r.operadora_key)
  const resolve = Boolean(paciente.problema && (operadoraNova || convenioCorrigido))

  /** O alerta da linha já não se sustenta no estado ATUAL dos campos.
   *
   *  O resultado do envio é um retrato do momento do processamento: ele guarda
   *  o `problema` que o paciente tinha AO ENTRAR. Se o dado foi corrigido depois
   *  — por outra edição, por outro censo do mesmo lote, ou pela padronização de
   *  convênios — a ficha no banco já está certa e o alerta da linha ficou velho.
   *
   *  É o caso que deixava a tela sem saída: a linha acusa "o censo não trouxe o
   *  convênio", a modal abre com o convênio preenchido (veio do banco), e salvar
   *  devolve "Nada mudou" em vermelho. O usuário não tem o que corrigir e não
   *  consegue tirar o aviso. */
  const jaEstaResolvido = useMemo(() => {
    const tipo = paciente.problema?.tipo
    if (!tipo) return false
    // Só vale para o alerta que os campos desta modal conseguem desmentir, e
    // apenas quando o dado está REALMENTE bom. Um convênio preenchido mas que o
    // cadastro não reconhece continua sendo um alerta legítimo: esconder aqui
    // devolveria o silêncio que o aviso existe para quebrar.
    if (tipo === 'sem_convenio') {
      return Boolean(r.convenio.trim() && r.operadora_key && casado
        && casado.operadora_key === r.operadora_key)
    }
    if (tipo === 'convenio_nao_reconhecido') {
      // Passou a ser reconhecido (outro censo do lote o cadastrou, ou a
      // padronização o reescreveu para um nome que casa).
      return Boolean(casado && casado.operadora_key === r.operadora_key)
    }
    // `outra_operadora` não se resolve sozinho: só some quando alguém DECIDE
    // qual é a operadora certa, e isso é sempre uma mudança de campo.
    return false
  }, [paciente.problema, r.convenio, r.operadora_key, casado])

  /** Escolher um convênio conhecido já traz a operadora dele.
   *
   *  É o que faz a correção ser UM passo: o usuário reconhece o nome do PDF, e a
   *  operadora — que é o que de fato conserta o registro — vem junto. Ele ainda
   *  pode trocar no campo de baixo; isto preenche, não tranca.
   *
   *  `op` só vem quando a escolha saiu da LISTA. Digitando à mão, o texto pode
   *  bater com um convênio conhecido, e aí a operadora vem do `casado` — a mesma
   *  normalização dos dois lados, senão "BRADESCO  SAUDE" digitado não casaria
   *  com a entrada da lista.
   */
  function escolherConvenio(v: string, op?: string | null) {
    const alvo = v.trim().replace(/\s+/g, ' ').toUpperCase()
    const achado = convenios.find(
      (c) => c.convenio.trim().replace(/\s+/g, ' ').toUpperCase() === alvo)
    setR((atual) => ({
      ...atual,
      convenio: v,
      operadora_key: op || achado?.operadora_key || atual.operadora_key,
    }))
  }

  /** Abre o painel de cadastro com o que estava escrito no campo. */
  function abrirCadastro(nome: string) {
    setNovoConvenio(nome)
    // Sugere a operadora do paciente: na correção típica o convênio novo é dela
    // mesmo. É sugestão, não trava — o select fica editável logo ao lado.
    setNovoOperadora(r.operadora_key || '')
    setErroNovo(null)
  }

  function fecharCadastro() {
    setNovoConvenio(null)
    setErroNovo(null)
  }

  /** Cadastra o convênio e já o aplica ao paciente que está aberto.
   *
   *  Aplicar é o ponto: o usuário abriu a modal para consertar ESTE paciente, e
   *  cadastrar sem preencher o campo o deixaria com o trabalho feito pela
   *  metade — o convênio existiria na lista e o paciente continuaria errado. */
  async function salvarCadastro() {
    const nome = (novoConvenio || '').trim()
    if (!nome || !novoOperadora) {
      setErroNovo('Informe o nome e a operadora do convênio.')
      return
    }
    setErroNovo(null)
    try {
      const resp = await criarConv.mutateAsync({ nome, operadoraKey: novoOperadora })
      const criado = resp.convenio
      setR((atual) => ({
        ...atual,
        convenio: criado.convenio,
        operadora_key: criado.operadora_key || novoOperadora,
      }))
      fecharCadastro()
    } catch (e) {
      // A mensagem do backend já diz o que houve (409 nomeia a operadora em que
      // o convênio existe), então vai inteira para a tela.
      setErroNovo((e as Error).message || 'Não foi possível cadastrar o convênio.')
    }
  }

  /** Salva e então FECHA, ou salva e vai para o próximo da fila.
   *
   *  O `seguir` decide só o destino; o caminho de gravação é o mesmo, e é de
   *  propósito: duas funções de salvar divergiriam na primeira correção de
   *  regra, e a que fosse menos usada ficaria para trás. */
  async function salvar(seguir = false) {
    // Seguir para o próximo mantém a MODAL ABERTA, então o estado de "salvando"
    // tem de ser desligado aqui — o caminho de fechar se safava por desmontar o
    // componente, e sem isto o botão ficava preso em "Salvando…" para sempre,
    // parecendo que o salvamento não terminou (ele terminou; o retorno é que
    // não voltava).
    const concluir = seguir && onProximo
      ? () => { setSalvando(false); onProximo() }
      : onFechar
    // Guarda de segurança: o botão já está desabilitado nestes casos. Antes ele
    // ficava ATIVO sem `id` e o clique caía aqui em silêncio — a modal não
    // fechava, nada era salvo e nenhuma mensagem explicava o porquê.
    if (!paciente.id) return
    // Sem mudança E sem alerta velho a limpar não há o que fazer. Com o alerta,
    // segue adiante: o backend responde "nada mudou" (é verdade, a ficha já está
    // certa) e o tratamento abaixo usa isso para apagar o aviso da linha.
    if (!temMudanca && !jaEstaResolvido) return
    setSalvando(true)
    setErro(null)
    try {
      // Sem diff nenhum, nem chama a API: não há o que gravar, e a resposta
      // seria a mesma "nada mudou" que o caminho abaixo já sabe tratar.
      if (!temMudanca) {
        onSalvo({ ...paciente, ...r, problema: null, resolvido: true })
        concluir()
        return
      }
      const resposta = await editarInternacao(paciente.id, mudancas)
      // O backend responde 200 com `atualizado: false` quando NADA foi gravado
      // (o diff dele ficou vazio: o valor enviado é igual ao que já está lá).
      // Tratar isso como sucesso fechava a modal e marcava o alerta como
      // resolvido — a tela dizia que corrigiu, e o banco continuava igual.
      if (resposta && resposta.atualizado === false) {
        // "Nada mudou" só é ERRO quando ainda há um problema de verdade. Quando
        // a ficha no banco já está correta, o que sobrou é o alerta velho do
        // retrato do envio: aí isto é sucesso, e o certo é limpar o aviso da
        // linha em vez de acusar o usuário por um dado que já está bom.
        if (jaEstaResolvido) {
          onSalvo({ ...paciente, ...r, problema: null, resolvido: true })
          concluir()
          return
        }
        setErro(resposta.mensagem || 'Nada mudou: os valores já eram esses.')
        setSalvando(false)
        return
      }
      // `problema: null` quando a escolha resolveu: o alerta da linha tem de
      // sumir com o salvamento. Mantê-lo faria a tela continuar acusando um
      // problema que o usuário acabou de corrigir — e o próximo passo dele
      // seria abrir a modal de novo para consertar o que já está certo.
      onSalvo({ ...paciente, ...r, ...(resolve ? { problema: null, resolvido: true } : {}) })
      concluir()
    } catch (e) {
      setErro((e as Error).message || 'Não foi possível salvar.')
      setSalvando(false)
    }
  }

  const texto = (k: keyof Rascunho, rotulo: string, tipo = 'text', inteira = false) => (
    <div className={`up-edit-campo${inteira ? ' inteira' : ''}`}>
      <label className="up-edit-lbl" htmlFor={`edit-${k}`}>{rotulo}</label>
      <input
        id={`edit-${k}`}
        type={tipo}
        className="bm-input"
        value={r[k]}
        disabled={salvando}
        onChange={(e) => campo(k, e.target.value)}
      />
    </div>
  )

  return (
    <Modal
      title="Editar paciente"
      onClose={onFechar}
      largura={560}
      // Aberta por cima do resultado do envio, que já tem camadas próprias.
      sobreposta
      footer={
        <>
          <button type="button" className="btn btn-outline btn-sm"
                  onClick={onFechar} disabled={salvando}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            // `jaEstaResolvido` libera o botão SEM mudança nenhuma: o paciente
            // cujo dado já está certo no banco não tem o que alterar, e travar o
            // botão deixaria o alerta velho na tela para sempre — o usuário
            // abriria a modal, veria tudo preenchido e não teria como confirmar.
            disabled={salvando || (!temMudanca && !jaEstaResolvido) || !paciente.id}
            // Seta explícita: `onClick={salvar}` passaria o EVENTO como
            // primeiro argumento, e um objeto é verdadeiro — todo "Salvar"
            // seguiria para o próximo.
            onClick={() => salvar(false)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title={!paciente.id
              ? 'Este paciente não pode ser editado por aqui'
              : (temMudanca || jaEstaResolvido ? undefined : 'Nenhum campo foi alterado')}
          >
            {salvando && <Spinner size={12} style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.4)' }} />}
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
          {/* Corrigir em série: salva ESTE e já abre o próximo marcado da aba,
              sem voltar à lista para caçar o próximo lápis. É o caminho real de
              quem tem 11 pacientes com o mesmo convênio fora do cadastro.

              O rótulo diz o que o clique FAZ agora: sem nada a salvar ele é só
              "Próximo" (o usuário está percorrendo para conferir, e obrigá-lo a
              alterar algo em cada um seria pior), e com mudança pendente é
              "Salvar e próximo". A contagem some junto quando não há fila.

              Some no ÚLTIMO da fila (`onProximo` ausente): ali o que resta é
              salvar e fechar, e um botão "próximo" sem próximo seria um clique
              que não leva a lugar nenhum. */}
          {onProximo && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={salvando || !paciente.id}
              onClick={() => salvar(true)}
              title={temMudanca || jaEstaResolvido
                ? 'Salva este paciente e abre o próximo que precisa de conferência'
                : 'Abre o próximo paciente que precisa de conferência'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {temMudanca || jaEstaResolvido ? 'Salvar e próximo' : 'Próximo'}
              {posicaoNaFila && totalNaFila ? (
                <span style={{ opacity: .75, fontVariantNumeric: 'tabular-nums' }}>
                  {posicaoNaFila} de {totalNaFila}
                </span>
              ) : null}
              <span aria-hidden>›</span>
            </button>
          )}
        </>
      }
    >
      <div className="up-edit-grid">
        {texto('nome', 'Nome do paciente', 'text', true)}
        {texto('atendimento', 'Atendimento')}
        {texto('carteirinha', 'Carteirinha')}
        {texto('leito_codigo', 'Leito')}
        {/* Convênio escolhido de uma lista real (ConvenioCombobox), não de um
            `datalist`: o menu nativo não aceita estilo e ignora o rótulo da
            opção, então a operadora de cada convênio — que é a informação que
            motiva a lista — não aparecia. */}
        <div className="up-edit-campo inteira">
          <label className="up-edit-lbl" htmlFor="edit-convenio">Convênio</label>
          {/* O recorte sai da operadora DO PACIENTE, não da escolhida no envio:
              o censo é misto, e cada paciente entra na operadora do seu próprio
              convênio. Filtrar pela do envio mostraria a lista errada justamente
              nas linhas que divergem — que são as que a tela marca com alerta.
              Trocar a operadora no campo abaixo reabre a lista já recortada para
              a nova. */}
          <ConvenioCombobox
            id="edit-convenio"
            convenios={convenios}
            value={r.convenio}
            disabled={salvando}
            carregando={carregandoConvenios}
            operadora={r.operadora_key}
            operadoraNome={operadoras.find((o) => o.key === r.operadora_key)?.nome}
            onChange={escolherConvenio}
            // Sem operadoras carregadas não há a que vincular o convênio novo, e
            // o cadastro exige uma: oferecer o botão levaria a um painel sem
            // escolha possível.
            onCadastrar={podeCriarConvenio && operadoras.length > 0 && !salvando
              ? abrirCadastro : undefined}
          />
          {/* Cadastro do convênio novo. O nome fica editável: o que vem do PDF
              costuma ser a grafia do sistema do hospital ("BRADESCO SEGUR"), e o
              cadastro é justamente a chance de gravar o nome certo uma vez. */}
          {novoConvenio !== null && (
            <div className="up-edit-novo">
              <div className="up-edit-novo-tit">Cadastrar convênio</div>
              <div className="up-edit-novo-txt">
                O convênio passa a aparecer na lista para todos, ligado à operadora
                escolhida. Ele também é aplicado a este paciente.
              </div>
              <div className="up-edit-novo-linha">
                <input
                  className="bm-input"
                  aria-label="Nome do convênio"
                  value={novoConvenio}
                  disabled={criarConv.isPending}
                  onChange={(e) => setNovoConvenio(e.target.value)}
                />
                <select
                  className="bm-input"
                  aria-label="Operadora do convênio"
                  value={novoOperadora}
                  disabled={criarConv.isPending}
                  onChange={(e) => setNovoOperadora(e.target.value)}
                >
                  <option value="">Operadora…</option>
                  {operadoras.map((o) => (
                    <option key={o.key} value={o.key}>{o.nome}</option>
                  ))}
                </select>
                <span style={{ display: 'inline-flex', gap: 6 }}>
                  <button type="button" className="btn btn-primary btn-sm"
                          disabled={criarConv.isPending || !novoConvenio.trim() || !novoOperadora}
                          onClick={salvarCadastro}>
                    {criarConv.isPending ? 'Cadastrando…' : 'Cadastrar'}
                  </button>
                  <button type="button" className="btn btn-outline btn-sm"
                          disabled={criarConv.isPending} onClick={fecharCadastro}>
                    Cancelar
                  </button>
                </span>
              </div>
              {erroNovo && <div className="up-edit-novo-erro">{erroNovo}</div>}
            </div>
          )}
        </div>

        {/* A operadora é o que de fato conserta o problema da linha. Corrigir só
            o texto do convênio trocaria a palavra e deixaria o paciente na
            operadora errada: as regras de avaliação (dias_uti, prazo de
            relatório) saem da operadora, não do nome do convênio.
            Fica ao lado do convênio, e não no fim, porque os dois são o mesmo
            assunto — o convênio é o que o PDF trouxe, a operadora é quem o
            cobre. */}
        <div className="up-edit-campo inteira">
          <label className="up-edit-lbl" htmlFor="edit-operadora">Operadora</label>
          {operadoras.length > 0 ? (
            <select
              id="edit-operadora"
              className="bm-input"
              value={r.operadora_key}
              disabled={salvando}
              onChange={(e) => campo('operadora_key', e.target.value)}
            >
              {/* A opção vazia só existe enquanto o paciente ESTÁ sem operadora.
                  Mantê-la depois ofereceria "tirar a operadora" como escolha de
                  rotina, que é o estado com problema, não um destino. */}
              {!original.operadora_key && <option value="">Escolha a operadora</option>}
              {operadoras.map((o) => (
                <option key={o.key} value={o.key}>{o.nome}</option>
              ))}
            </select>
          ) : (
            <input id="edit-operadora" type="text" className="bm-input"
                   value={r.operadora_key || 'sem operadora'} disabled readOnly />
          )}
        </div>
        {texto('data_entrada', 'Data de internação', 'date')}
        {texto('data_alta', 'Data de alta', 'date')}
      </div>

      {/* Sem `id` não há o que editar: o backend identifica a internação por ele.
          Acontece com resultado de envio antigo (processado antes de o id ser
          devolvido) e com o paciente que o censo repetiu mas NÃO gravou, por já
          ter alta. O botão fica desabilitado; esta frase diz por quê e para onde
          ir — sem ela, a tela só mostrava um botão que não responde. */}
      {!paciente.id && (
        <div className="up-edit-erro">
          Este paciente não pode ser editado por aqui. Abra a ficha dele na{' '}
          <Link to="/">Visão Geral</Link> para corrigir.
        </div>
      )}

      {erro && <div className="up-edit-erro">{erro}</div>}
    </Modal>
  )
}
