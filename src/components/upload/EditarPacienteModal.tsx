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
import { useConvenios } from '../../hooks/useInternacao'
import { ConvenioCombobox } from '../ConvenioCombobox'
import { Modal, Spinner } from '../ui'
import { nomeProprio } from '../../lib/texto'
import { paraISO } from '../../lib/datas'

const IcoCheck = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export const editarPacienteStyles = `
.up-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 14px}
.up-edit-campo{display:grid;gap:4px;min-width:0}
.up-edit-campo.inteira{grid-column:span 2}
.up-edit-lbl{font-size:var(--t-xs);text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:var(--muted)}
.up-edit-erro{margin-top:10px;font-size:var(--t-sm);color:var(--danger-2);background:var(--danger-bg);border-radius:var(--r-sm);padding:7px 10px}
/* Lembra QUEM está sendo editado: a lista pode ter 99 nomes e a modal cobre a
   tela, então sem isto o usuário perde a referência do que abriu. */
.up-edit-quem{font-size:var(--t-sm);color:var(--muted);margin-bottom:12px}
.up-edit-quem b{color:var(--ink-2)}
/* Aviso de que a ficha ja esta correta e so falta salvar para limpar o alerta
   velho da linha. Verde e discreto, abaixo do campo. */
.up-edit-resolve{display:inline-flex;align-items:center;gap:5px;margin-top:5px;font-size:var(--t-xs);font-weight:600;color:var(--success-2)}
/* Dica sob o campo de convenio: diz o que a escolha vai fazer com a operadora,
   antes de o usuario salvar. */
.up-edit-dica{margin-top:5px;font-size:var(--t-xs);color:var(--muted);line-height:1.4}
.up-edit-dica b{color:var(--ink-2);font-weight:600}
`

/** O que a modal edita — subconjunto de `InternacaoEdicao` (os campos da lista). */
interface Rascunho {
  nome: string
  atendimento: string
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

export function EditarPacienteModal({ paciente, operadoras = [], onFechar, onSalvo }: {
  paciente: PacienteGravado
  /** Cadastro de operadoras, para escolher a certa quando o convênio do PDF não
   *  foi reconhecido. Vazio = a tela não carregou o cadastro; o campo vira só
   *  leitura em vez de oferecer uma lista vazia que não resolve nada. */
  operadoras?: Operadora[]
  onFechar: () => void
  /** Devolve o paciente já com os campos novos, para a linha se atualizar sem
   *  refazer o envio inteiro. */
  onSalvo: (atualizado: PacienteGravado) => void
}) {
  const [r, setR] = useState<Rascunho>(() => doPaciente(paciente))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // A lista só é buscada com a modal aberta: varre o histórico de internações, e
  // a maioria dos envios nunca abre a edição de um paciente.
  const convQ = useConvenios(true)
  const convenios = convQ.data?.convenios ?? []
  const carregandoConvenios = convQ.isLoading

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

  async function salvar() {
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
        onFechar()
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
          onFechar()
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
      onFechar()
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
            onClick={salvar}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title={!paciente.id
              ? 'Este paciente não pode ser editado por aqui'
              : (temMudanca || jaEstaResolvido ? undefined : 'Nenhum campo foi alterado')}
          >
            {salvando && <Spinner size={12} style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.4)' }} />}
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </>
      }
    >
      <div className="up-edit-quem">
        Corrigindo <b>{nomeProprio(original.nome) || original.atendimento || 'este registro'}</b>
        {'. '}A alteração vale para a ficha do paciente, não só para esta tela.
      </div>

      <div className="up-edit-grid">
        {texto('nome', 'Nome do paciente', 'text', true)}
        {texto('atendimento', 'Atendimento')}
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
          />
          {casado && (
            <span className="up-edit-dica">
              Convênio conhecido: entra em <b>{casado.operadora_nome || casado.operadora_key}</b>.
            </span>
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
          {/* O alerta ficou velho: a ficha no banco já está correta e não há o
              que alterar. Sem esta frase, a modal abre inteira preenchida e o
              usuário fica procurando o que corrigir. */}
          {jaEstaResolvido && !temMudanca && (
            <span className="up-edit-resolve">
              {IcoCheck}
              A ficha deste paciente já está correta. Salve para tirar o aviso da linha.
            </span>
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
