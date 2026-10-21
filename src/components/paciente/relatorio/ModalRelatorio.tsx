// Modal "Registrar relatório" da ficha "Detalhes" (08/10/2026).
//
// Leva tudo o que o portal antigo (Márcia) registrava na visita, sem copiar as
// 9 abas dele. Ordem de prioridade de preenchimento (20/10/2026): as seções com
// campo obrigatório primeiro, as opcionais depois (a ordem vem de etapas.ts):
//   0. Paciente: os dados do alto, só leitura.
//   1. Relatório de visita: quem e quando (a data é obrigatória). Abre aberto e
//      pode ser reduzido.
//   2. Quadro clínico: diagnóstico principal e secundário e o texto do
//      relatório (o único texto obrigatório).
//   3. Quadro de internação: caráter, tipo e as acomodações utilizadas, do
//      censo e do último relatório; cada troca adicionada aqui (ex.: passou
//      pela UTI e voltou) vira card na timeline quando o relatório vale.
//   4. No período: procedimentos, alto custo, evento adverso e a folha rosa (a
//      troca de acomodação do portal; voltou da Negociação em 09/10/2026).
//   5. Prorrogação: o pedido (períodos por acomodação e justificativa). Pausar
//      e retomar ficam fora da modal: no topo da ficha, depois de valer.
//   6. Negociação com o hospital (OCULTA desde 08/10/2026, `NEGOCIACAO_NO_RELATORIO`
//      em lib/recursos): glosa, medicação negada, procedimento negado, troca
//      de procedimento.
// Os blocos opcionais ficam fechados até serem marcados (no lugar dos "Tem X?
// Sim/Não" do portal). Os relatórios anteriores ficam na timeline da ficha.
//
// Cada seção reduz e expande (`GrupoRecolhivel`, 08/10/2026). A modal abre
// simples: só o Relatório de visita aberto; as demais fechadas, com o
// resumo do que já está preenchido. Se o registro esbarra num campo de uma
// seção fechada, ela abre sozinha.
// A alta não é bloco: é o botão "Alta" do rodapé, ao lado de "Registrar
// relatório" (o mesmo do topo da ficha), e vale na hora, sem esperar o relatório.
// As perguntas de home care ficam nela, com o motivo Homecare.
// Com "Pedir prorrogação" marcado, o rodapé ganha "Pausar prorrogação" (admin e
// operacional): a pausa vai no pedido e vale quando o relatório vale.
//
// Cada seção termina num "OK" (20/10/2026): confere os campos dela, fecha e abre
// a seguinte, rolando até ela. Registrar continua valendo de qualquer ponto.
// A mesma modal corrige o relatório pendente (20/10/2026): quem aprova a abre já
// preenchida pela ficha do relatório, e o rodapé vira "Salvar e aprovar".
//
// Sem a 0054 no banco, só aparece o que já existia (visita, CID, relatório,
// prorrogação, folha rosa).
import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import { podeExecutar } from '../../../auth/permissions'
import { useCatalogosProrrogacao } from '../../../hooks/useKanban'
import { dataBR, diasNoPeriodo, paraISO } from '../../../lib/datas'
import { CARATER, TIPOS_INTERNACAO, rotulo } from '../../../lib/relatorioDetalhes'
import { NEGOCIACAO_NO_RELATORIO } from '../../../lib/recursos'
import { identificacaoPaciente } from '../../../lib/texto'
import type { InternacaoDados } from '../../../types/api'
import { Modal } from '../../ui'
import { AcaoAlta } from '../AcaoAlta'
import { SecaoFolhaRosa } from '../SecaoFolhaRosa'
import { SecaoProrrogacao } from '../SecaoProrrogacao'
import type { FormRelatorio, SecaoRelatorio } from '../useFormRelatorio'
import { BlocoOpcional } from './BlocoOpcional'
import { ETAPA, ETAPAS } from './etapas'
import { estilosRelatorio } from './relatorio.styles'
import { GrupoRecolhivel } from './GrupoRecolhivel'
import { SecaoInternacao, SecaoQuadroClinico, SecaoVisita } from './SecoesPrincipais'
import {
  SecaoAltoCusto, SecaoGlosa, SecaoMedicacaoNegada, SecaoProcedimentos, SecaoTrocaProcedimento,
} from './SecoesListas'
import { SecaoEventoAdverso } from './SecoesOcorrencias'


/** Dias desde a internação, contando o dia de hoje como o último. */
function diasInternado(entrada?: string | null): number | null {
  const t = Date.parse(`${paraISO(entrada)}T00:00:00`)
  return Number.isNaN(t) ? null : Math.max(0, Math.floor((Date.now() - t) / 864e5))
}

const SEXO: Record<string, string> = { M: 'Masculino', F: 'Feminino' }

type Grupo = SecaoRelatorio

/** A seção do campo que barrou o registro, pela mensagem (as mensagens são as
 *  de useFormRelatorio, useDetalhesRelatorio e do backend). */
function grupoDoErro(erro: string | null): Grupo | null {
  const e = (erro ?? '').toLowerCase()
  if (!e) return null
  if (e.includes('prorrogação')) return 'prorrogacao'
  if (e.includes('relatório da visita') || e.includes('diagnóstico')) return 'quadro'
  if (e.includes('data da visita') || e.includes('médico auditor')) return 'visita'
  if (e.includes('acomodações utilizadas') || e.includes('acomodação utilizada') || e.includes('movimentação')
      || e.includes('caráter') || e.includes('tipo de internação')) return 'internacao'
  if (e.includes('procedimento realizado') || e.includes('alto custo') || e.includes('evento adverso')) return 'periodo'
  if (e.includes('folha rosa')) return 'periodo'
  if (e.includes('glosa') || e.includes('medicação negada')
      || e.includes('procedimento negado') || e.includes('troca de procedimento')) return 'negociacao'
  return null
}

const comQtde = (rot: string, n: number) => (n > 1 ? `${rot} (${n})` : rot)

/** O resumo de uma linha de cada seção, para ler com ela fechada. */
function resumos(form: FormRelatorio): Record<Grupo, string> {
  const c = form.completo
  const prr = form.prorrogacao
  const dias = prr ? prr.periodos.finais().reduce((n, p) => n + diasNoPeriodo(p.data_inicio, p.data_fim), 0) : 0
  const atual = c ? [...c.acomodacoesFinais()].reverse().find((a) => !a.data_saida) : undefined
  const marcados = (pares: [boolean, string][]) => pares.filter(([on]) => on).map(([, t]) => t).join(' · ') || 'Nada marcado'
  return {
    prorrogacao: prr?.ativa
      ? `Pedida${dias ? `: ${dias} ${dias === 1 ? 'dia' : 'dias'}` : ''}`
        + (prr.anexo || (prr.anexoAtual && !prr.removerAnexo) ? ' · com documento' : '')
      : 'Não pedida',
    visita: [dataBR(form.dataVisita) || 'Sem data', form.medico, c?.enfermeiro].filter(Boolean).join(' · '),
    internacao: c
      ? [rotulo(CARATER, c.carater), rotulo(TIPOS_INTERNACAO, c.tipoInternacao),
         atual ? `${atual.acomodacao} (atual)` : ''].filter(Boolean).join(' · ') || 'Nada preenchido'
      : '',
    quadro: [
      form.cidPrincipal ? `Principal ${form.cidPrincipal.codigo}` : '',
      form.cids.length ? comQtde('Secundário', form.cids.length) : '',
      form.obs.trim() ? 'Relatório escrito' : 'Relatório em branco',
    ].filter(Boolean).join(' · '),
    periodo: marcados([
      [Boolean(c?.ligado('procedimentos')), comQtde('Procedimentos', c?.procedimentos.finais().length ?? 0)],
      [Boolean(c?.ligado('altoCusto')), comQtde('Alto custo', c?.altoCusto.finais().length ?? 0)],
      [Boolean(c?.ligado('evento')), 'Evento adverso'],
      [Boolean(form.folhaRosa?.ativa), 'Folha rosa'],
    ]),
    negociacao: marcados([
      [Boolean(c?.ligado('glosas')), comQtde('Glosa', c?.glosas.finais().length ?? 0)],
      [Boolean(c?.ligado('medNegadas')), comQtde('Medicação negada', c?.medNegadas.finais().length ?? 0)],
      [Boolean(c?.ligado('negados')), comQtde('Procedimento negado', c?.negados.finais().length ?? 0)],
      [Boolean(c?.ligado('trocas')), comQtde('Troca de procedimento', c?.trocas.finais().length ?? 0)],
    ]),
  }
}

/** Idade em anos completos na data de hoje, ou null. */
function idade(nascimento?: string | null): number | null {
  const iso = paraISO(nascimento)
  if (!iso) return null
  const [a, m, d] = iso.split('-').map(Number)
  const hoje = new Date()
  let anos = hoje.getFullYear() - a
  if (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) anos -= 1
  return anos >= 0 && anos < 130 ? anos : null
}

/** Os dados do paciente que o portal mostrava no alto do relatório, só leitura
 *  (corrigir é na ficha): o nome em destaque, operadora e hospital, e os demais
 *  dados numa linha, cada um com o seu rótulo. */
function DadosPaciente({ p }: { p: InternacaoDados }) {
  const dias = diasInternado(p.data_entrada)
  const anos = idade(p.data_nascimento)
  const sexo = (p.sexo ?? '').trim().toUpperCase()
  const internacao = p.data_entrada
    ? `${dataBR(p.data_entrada)}${p.hora_entrada ? `, ${p.hora_entrada.slice(0, 5)}` : ''}`
      + (dias != null ? ` (${dias} ${dias === 1 ? 'dia' : 'dias'})` : '')
    : ''
  const fatos: [string, string][] = [
    ['Internado desde', internacao],
    ['Nascimento', p.data_nascimento ? `${dataBR(p.data_nascimento)}${anos != null ? ` (${anos} anos)` : ''}` : ''],
    ['Sexo', SEXO[sexo] ?? (p.sexo || '')],
    ['Carteirinha', p.carteirinha || ''],
  ]
  return (
    <div className="rr-ctx">
      <div className="rr-ctx-nome">{identificacaoPaciente(p)}</div>
      <div className="rr-ctx-linha">{[p.convenio, p.hospital_nome].filter(Boolean).join(' · ')}</div>
      <div className="rr-ctx-fatos">
        {fatos.filter(([, v]) => v).map(([rot, v]) => <span key={rot}><b>{rot}</b>{v}</span>)}
      </div>
    </div>
  )
}

export function ModalRelatorio({ form, paciente, medicos, enfermeiros, onAviso, onFechar, sobreposta }: {
  form: FormRelatorio
  paciente: InternacaoDados
  medicos: string[]
  enfermeiros: string[]
  /** Mensagem da ficha (toast) quando a alta é dada pelo botão do rodapé. */
  onAviso: (msg: string) => void
  onFechar: () => void
  /** Aberta por cima de outra modal (a correção, sobre a ficha do relatório). */
  sobreposta?: boolean
}) {
  const { role } = useAuth()
  const catalogos = useCatalogosProrrogacao(true)
  const acomodacoes = catalogos.data?.acomodacoes ?? []
  // As seções somem sem a migration delas; o título do grupo some junto.
  const temProrrogacao = Boolean(form.prorrogacao) && acomodacoes.length > 0
  const temFolhaRosa = Boolean(form.folhaRosa) && Boolean(catalogos.data?.folha_rosa) && acomodacoes.length > 0
  const c = form.completo
  const novos = Boolean(c?.noBanco)
  const desab = form.salvando

  // Abre simples: o Relatório de visita aberto (pedido de 08/10/2026: "pode
  // ser expansivo, mas com a possibilidade de reduzir"); o resto, fechado com
  // o resumo à vista.
  const [abertos, setAbertos] = useState<Set<Grupo>>(() => new Set<Grupo>(['visita']))
  const alternar = (g: Grupo) => setAbertos((atual) => {
    const novo = new Set(atual)
    if (novo.has(g)) novo.delete(g)
    else novo.add(g)
    return novo
  })
  // O registro esbarrou num campo de uma seção fechada: ela abre sozinha.
  useEffect(() => {
    const g = grupoDoErro(form.erro)
    if (g) setAbertos((atual) => (atual.has(g) ? atual : new Set(atual).add(g)))
  }, [form.erro])

  const resumo = resumos(form)

  // As seções à mostra, na ordem de prioridade de preenchimento (etapas.ts: as
  // obrigatórias primeiro). O "OK" abre a seguinte desta lista.
  const visivel: Record<Grupo, boolean> = {
    visita: true,
    internacao: Boolean(c && novos),
    quadro: true,
    periodo: Boolean(c && novos) || temFolhaRosa,
    prorrogacao: temProrrogacao,
    negociacao: NEGOCIACAO_NO_RELATORIO && Boolean(c && novos),
  }
  const ordem: Grupo[] = ETAPAS.map((e) => e.secao).filter((g) => visivel[g])
  const proxima = (g: Grupo): Grupo | undefined => ordem[ordem.indexOf(g) + 1]
  // Seções finalizadas no "OK": o título ganha o "Concluída" verde enquanto a
  // seção seguir em ordem (apagar o campo exigido depois tira a marca).
  const [finalizadas, setFinalizadas] = useState<Set<Grupo>>(() => new Set())
  // A seção que o último "OK" abriu: a modal rola até ela.
  const [foco, setFoco] = useState<Grupo | null>(null)
  useEffect(() => {
    if (!foco) return
    const el = document.getElementById(`rr-grupo-${foco}`)
    el?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    el?.querySelector<HTMLButtonElement>('.rr-grupo-cab')?.focus({ preventScroll: true })
    setFoco(null)
  }, [foco])

  function concluir(g: Grupo) {
    if (!form.concluirSecao(g)) return
    setFinalizadas((atual) => new Set(atual).add(g))
    const seguinte = proxima(g)
    setAbertos((atual) => {
      const novo = new Set(atual)
      novo.delete(g)
      if (seguinte) novo.add(seguinte)
      return novo
    })
    if (seguinte) setFoco(seguinte)
  }

  /** As props de cada seção: abrir/fechar, o "OK", a âncora e a marca de
   *  concluída. */
  const grupo = (g: Grupo) => ({
    id: `rr-grupo-${g}`,
    titulo: ETAPA[g].titulo,
    concluida: finalizadas.has(g) && !form.conferirSecao(g),
    aberto: abertos.has(g),
    onAlternar: () => alternar(g),
    onOk: () => concluir(g),
    proxima: proxima(g) && ETAPA[proxima(g)!].titulo,
  })

  function fechar() {
    if (!desab) onFechar()
  }

  const rodape = (
    <>
      {form.erro && <span className="rr-erro" role="alert">{form.erro}</span>}
      {form.vaiParaAprovacao && !form.erro && (
        <span className="rr-erro" style={{ color: 'var(--muted)' }}>O relatório vai para aprovação do técnico.</span>
      )}
      <button className="btn btn-outline" onClick={fechar} disabled={desab}>Cancelar</button>
      {/* O mesmo botão do topo da ficha: abre a janela da alta por cima desta
          (data, hora e motivo) e vale na hora. Depois da alta manual vira
          "Desfazer alta"; alta que veio do censo não mostra nada. */}
      {podeExecutar(role, 'darAlta') && !form.editando && (
        <AcaoAlta d={paciente} sobreposta pequeno={false} onFeito={onAviso} />
      )}
      <button className="btn btn-primary" onClick={form.salvar} disabled={desab}>
        {desab ? 'Enviando…'
          : form.editando ? 'Salvar e aprovar'
          : form.vaiParaAprovacao ? 'Enviar para aprovação' : 'Registrar relatório'}
      </button>
    </>
  )

  // Cada seção, montada na ordem de `ordem` (prioridade de preenchimento). As
  // que a migration esconde nem entram em `ordem` (ver `visivel`).
  const secoes: Record<Grupo, ReactNode> = {
    visita: (
      <GrupoRecolhivel {...grupo('visita')} resumo={resumo.visita}>
        <SecaoVisita form={form} medicos={medicos} enfermeiros={enfermeiros}
                     dataEntrada={paraISO(paciente.data_entrada) || undefined} />
      </GrupoRecolhivel>
    ),
    quadro: (
      <GrupoRecolhivel {...grupo('quadro')} resumo={resumo.quadro}>
        <SecaoQuadroClinico form={form} />
      </GrupoRecolhivel>
    ),
    internacao: c && (
      <GrupoRecolhivel {...grupo('internacao')} resumo={resumo.internacao}
                       nota={c.doUltimo ? 'Como no último relatório' : undefined}>
        <SecaoInternacao
          form={form}
          acomodacoes={acomodacoes}
          acomodacaoPaciente={paciente.prorrogacao_acomodacao || paciente.tipo_leito}
        />
      </GrupoRecolhivel>
    ),
    periodo: (
      <GrupoRecolhivel {...grupo('periodo')} resumo={resumo.periodo}>
        <div className="rr-blocos">
          {c && novos && (
            <>
              <BlocoOpcional titulo="Procedimentos realizados" marcado={c.ligado('procedimentos')}
                             onMarcar={(l) => c.marcar('procedimentos', l)} desabilitado={desab}
                             extra={c.procedimentos.itens.length || ''}>
                <SecaoProcedimentos lista={c.procedimentos} desabilitado={desab} />
              </BlocoOpcional>
              <BlocoOpcional titulo="Medicação de alto custo" marcado={c.ligado('altoCusto')}
                             onMarcar={(l) => c.marcar('altoCusto', l)} desabilitado={desab}
                             extra={c.altoCusto.itens.length || ''}>
                <SecaoAltoCusto lista={c.altoCusto} desabilitado={desab} />
              </BlocoOpcional>
              <BlocoOpcional titulo="Evento adverso" marcado={c.ligado('evento')}
                             onMarcar={(l) => c.marcar('evento', l)} desabilitado={desab}>
                <SecaoEventoAdverso c={c} />
              </BlocoOpcional>
            </>
          )}
          {/* Sai da Negociação (oculta) e volta aqui (pedido de 09/10/2026). */}
          <SecaoFolhaRosa form={form} />
        </div>
      </GrupoRecolhivel>
    ),
    prorrogacao: (
      <GrupoRecolhivel {...grupo('prorrogacao')} resumo={resumo.prorrogacao}>
        <SecaoProrrogacao form={form} />
      </GrupoRecolhivel>
    ),
    negociacao: c && (
      <GrupoRecolhivel {...grupo('negociacao')} resumo={resumo.negociacao}>
        <div className="rr-blocos">
          <BlocoOpcional titulo="Glosa de diárias" marcado={c.ligado('glosas')}
                         onMarcar={(l) => c.marcar('glosas', l)} desabilitado={desab}
                         extra={c.glosas.itens.length || ''}>
            <SecaoGlosa lista={c.glosas} acomodacoes={acomodacoes} desabilitado={desab} />
          </BlocoOpcional>
          <BlocoOpcional titulo="Medicação negada" marcado={c.ligado('medNegadas')}
                         onMarcar={(l) => c.marcar('medNegadas', l)} desabilitado={desab}
                         extra={c.medNegadas.itens.length || ''}>
            <SecaoMedicacaoNegada lista={c.medNegadas} desabilitado={desab} />
          </BlocoOpcional>
          <BlocoOpcional titulo="Procedimento negado" marcado={c.ligado('negados')}
                         onMarcar={(l) => c.marcar('negados', l)} desabilitado={desab}
                         extra={c.negados.itens.length || ''}>
            <SecaoProcedimentos lista={c.negados} desabilitado={desab} />
          </BlocoOpcional>
          <BlocoOpcional titulo="Troca de procedimento" marcado={c.ligado('trocas')}
                         onMarcar={(l) => c.marcar('trocas', l)} desabilitado={desab}
                         extra={c.trocas.itens.length || ''}>
            <SecaoTrocaProcedimento lista={c.trocas} desabilitado={desab} />
          </BlocoOpcional>
        </div>
      </GrupoRecolhivel>
    ),
  }

  return (
    <Modal title={form.editando ? 'Corrigir relatório' : 'Registrar relatório'} onClose={fechar}
           largura={940} footer={rodape} sobreposta={sobreposta}>
      <style>{estilosRelatorio}</style>
      <div className="rr-raiz">
      <DadosPaciente p={paciente} />
      <div className="rr-grupos">{ordem.map((g) => <Fragment key={g}>{secoes[g]}</Fragment>)}</div>
      </div>
    </Modal>
  )
}
