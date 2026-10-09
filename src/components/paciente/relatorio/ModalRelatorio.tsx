// Modal "Registrar relatório" da ficha "Detalhes" (08/10/2026).
//
// Leva tudo o que o portal antigo (Márcia) registrava na visita, sem copiar as
// 9 abas dele. Ordem (revista em 08/10/2026):
//   0. Paciente: os dados do alto, só leitura.
//   1. Relatório de visita: quem e quando. Abre aberto e pode ser reduzido.
//   2. Quadro de internação: caráter, tipo e as acomodações utilizadas, do
//      censo e do último relatório; cada troca adicionada aqui (ex.: passou
//      pela UTI e voltou) vira card na timeline quando o relatório vale.
//   3. Quadro clínico: diagnóstico principal e secundário e o texto do
//      relatório (o único texto obrigatório).
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
// Sem a 0054 no banco, só aparece o que já existia (visita, CID, relatório,
// prorrogação, folha rosa).
import { useEffect, useState } from 'react'
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
import type { FormRelatorio } from '../useFormRelatorio'
import { BlocoOpcional } from './BlocoOpcional'
import { GrupoRecolhivel } from './GrupoRecolhivel'
import { SecaoInternacao, SecaoQuadroClinico, SecaoVisita } from './SecoesPrincipais'
import {
  SecaoAltoCusto, SecaoGlosa, SecaoMedicacaoNegada, SecaoProcedimentos, SecaoTrocaProcedimento,
} from './SecoesListas'
import { SecaoEventoAdverso } from './SecoesOcorrencias'

// Alinhamento: todo campo da modal tem 36px de altura. Sem isso o campo de
// data (com o ícone do calendário), a data da visita e o Caráter ficavam
// alguns pixels maiores ou menores que os vizinhos, e as grades alinham pela
// base (`align-items:end`) para que um rótulo mais alto não empurre o campo.
// Nas listas, cada valor adicionado fica na coluna do seu campo, com o texto
// no mesmo recuo do texto do campo (12px = borda + padding do .bm-input).
const estilos = `
/* Textos e campos da modal refeitos em 08/10/2026 ("as informações estão
   amontoadas"). Tudo vale só aqui dentro (.rr-raiz): os mesmos campos em outras
   telas (drawer, ficha) seguem o padrão da casa.
   Hierarquia: título da seção 15px > título de bloco 13,5px > valor do campo
   13,5px > rótulo do campo 11,5px (cinza, sem caixa alta) > resumo/dica 11,5px. */
.rr-raiz{min-width:0}
.rr-raiz .form-lbl{font-size:var(--t-sm);font-weight:500;text-transform:none;letter-spacing:0;color:var(--ink-3);margin-bottom:6px}
.rr-raiz .bm-input{font-size:var(--t-md);color:var(--ink)}
.rr-raiz .bm-input::placeholder{color:var(--muted-2)}
.rr-raiz .bm-input:not(textarea),.rr-raiz .cal-campo{height:38px;padding-top:0;padding-bottom:0;padding-left:12px}
.rr-raiz textarea.bm-input{padding:10px 12px;line-height:1.6}

/* Cabeçalho do paciente: o nome, e os dados numa linha com rótulo próprio. */
.rr-ctx{padding:14px 16px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2)}
.rr-ctx-topo{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.rr-ctx-nome{font-size:var(--t-lg);font-weight:600;letter-spacing:-.01em;color:var(--ink)}
.rr-ctx-linha{font-size:var(--t-sm);color:var(--ink-2);margin-top:2px}
.rr-ctx-fatos{display:flex;flex-wrap:wrap;gap:6px 22px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);font-size:var(--t-sm);color:var(--ink)}
.rr-ctx-fatos span{white-space:nowrap}
.rr-ctx-fatos b{font-weight:400;color:var(--muted);margin-right:6px}

/* Seções: lista com divisórias. Fechada, título e o resumo embaixo. */
.rr-grupos{margin-top:8px}
.rr-grupo{border-bottom:1px solid var(--border)}
.rr-grupo-cab{all:unset;box-sizing:border-box;display:flex;align-items:flex-start;gap:10px;width:100%;padding:16px 2px;cursor:pointer;border-radius:6px}
.rr-grupo-cab:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.rr-grupo-seta{flex-shrink:0;width:16px;height:16px;margin-top:2px;color:var(--muted);transition:transform .15s;transform:rotate(-90deg)}
.rr-grupo.aberto .rr-grupo-seta{transform:none}
.rr-grupo-textos{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.rr-grupo-linha1{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.rr-grupo-tit{font-size:var(--t-lg);font-weight:600;letter-spacing:-.01em;color:var(--ink)}
.rr-grupo-cab:hover .rr-grupo-tit,.rr-grupo-cab:hover .rr-grupo-seta{color:var(--primary)}
.rr-grupo-nota{font-size:var(--t-xs);font-weight:500;color:var(--muted);background:var(--surface-2);border:1px solid var(--border);border-radius:999px;padding:1px 9px}
.rr-grupo-resumo{font-size:var(--t-sm);color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rr-grupo-corpo{padding:2px 2px 24px}

/* Grades de campos. */
.rr-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:end}
.rr-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:end}
.rr-g-topo{align-items:start}
.rr-g-evento{display:grid;grid-template-columns:150px minmax(0,1fr);gap:16px;align-items:end}
.rr-pilha{display:grid;gap:18px}
.rr-campo{min-width:0;display:block}
.rr-campo .bm-input{width:100%;min-width:0}
.rr-nota{font-size:var(--t-sm);color:var(--muted);margin-top:8px}
.rr-seg{display:flex;height:38px;border:1px solid var(--border-strong);border-radius:8px;overflow:hidden;width:max-content}
.rr-seg-op{position:relative;display:inline-flex;align-items:center;padding:0 18px;font-size:var(--t-base);color:var(--ink-2);cursor:pointer;background:var(--surface)}
.rr-seg-op+.rr-seg-op{border-left:1px solid var(--border-strong)}
.rr-seg-op input{position:absolute;opacity:0;pointer-events:none}
.rr-seg-op.on{background:var(--primary-soft);color:var(--primary);font-weight:600}
.rr-seg-op:focus-within{outline:2px solid var(--accent);outline-offset:-2px}
.rr-chips{display:flex;flex-wrap:wrap;gap:8px}
.rr-chip{position:relative;display:inline-flex;align-items:center;height:36px;padding:0 14px;border:1px solid var(--border-strong);border-radius:999px;font-size:var(--t-base);color:var(--ink-2);cursor:pointer;background:var(--surface)}
.rr-chip input{position:absolute;opacity:0;pointer-events:none}
.rr-chip.on{background:var(--primary-soft);color:var(--primary);border-color:var(--primary-3);font-weight:600}
.rr-chip:focus-within{outline:2px solid var(--accent);outline-offset:1px}

/* Roteiro do relatório. */
.rr-roteiro{padding:12px 14px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2)}
.rr-roteiro-tit{font-size:var(--t-sm);font-weight:600;color:var(--ink-2)}
.rr-roteiro ol{margin-top:6px;list-style:none;display:flex;flex-wrap:wrap;gap:6px 22px;counter-reset:rot}
.rr-roteiro li{counter-increment:rot;font-size:var(--t-sm);color:var(--ink-2)}
.rr-roteiro li::before{content:counter(rot) ". ";font-weight:600;color:var(--primary)}

/* Blocos que abrem ao marcar, e o painel das acomodações. */
.rr-blocos{display:grid;gap:10px}
.rr-bloco{border:1px solid var(--border);border-radius:10px;background:var(--surface)}
.rr-bloco.on{border-color:var(--border-strong);background:var(--surface-2)}
.rr-bloco-tg{display:flex;align-items:center;gap:10px;padding:12px 16px;font-weight:600;font-size:var(--t-md);color:var(--ink);cursor:pointer}
.rr-bloco-tg input{width:16px;height:16px;accent-color:var(--accent);margin:0;flex-shrink:0}
.rr-bloco.rosa .rr-bloco-tg input{accent-color:var(--rosa)}
.rr-bloco.rosa.on{background:var(--rosa-bg)}
.rr-bloco-fixo{cursor:default}
.rr-bloco-extra{margin-left:auto;font-size:var(--t-sm);font-weight:500;color:var(--muted)}
.rr-bloco-dica{font-size:var(--t-sm);color:var(--muted);margin:-4px 0 14px}
.rr-bloco-corpo{padding:2px 16px 18px}

/* Listas: linha de entrada, respiro, e os itens nas mesmas colunas. */
.rr-lista-wrap{display:grid;gap:14px}
.rr-lista-entrada{display:grid;gap:14px;align-items:end}
.rr-lista-add{grid-column:-2/-1;height:38px;width:100%;justify-content:center}
.rr-resto{grid-column:2/-1}
.rr-linha{grid-column:1/-1}
.rr-dupla{grid-column:1/3}
.rr-lista{border:1px solid var(--border);border-radius:8px;background:var(--surface);overflow:hidden}
.rr-lista-linha{display:grid;column-gap:14px;row-gap:4px;align-items:center;padding:10px 0;font-size:var(--t-base);color:var(--ink)}
.rr-lista-linha+.rr-lista-linha{border-top:1px solid var(--border)}
.rr-cel{min-width:0;padding:0 12px;overflow-wrap:anywhere}
.rr-cel-nota{margin-left:6px;color:var(--muted)}
.rr-acoes{grid-column:-2/-1;display:flex;justify-content:flex-end;gap:2px;padding-right:8px}
.rr-x{all:unset;display:inline-grid;place-items:center;width:26px;height:26px;border-radius:6px;font-size:11px;color:var(--muted);cursor:pointer;flex-shrink:0}
.rr-x:hover{background:var(--surface-3);color:var(--ink)}
.rr-x:focus-visible{outline:2px solid var(--accent)}
/* Movimentação: cabeçalho das colunas e o Cancelar ao lado do Adicionar. */
.rr-lista-cab{padding:8px 0;background:var(--surface-2);font-size:var(--t-sm);font-weight:500;color:var(--muted)}
.rr-mov-cancelar{grid-column:-3/-2;justify-self:end;height:38px}

.rr-erro{font-size:var(--t-sm);color:var(--danger);margin-right:auto;align-self:center}
@media (max-width:900px){
  .rr-g3{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:620px){
  .rr-g2,.rr-g3,.rr-g-evento{grid-template-columns:minmax(0,1fr)}
  .rr-lista-entrada,.rr-lista-linha{grid-template-columns:minmax(0,1fr) !important}
  .rr-resto,.rr-linha,.rr-dupla,.rr-mov-cancelar{grid-column:auto}
}
`

/** Dias desde a internação, contando o dia de hoje como o último. */
function diasInternado(entrada?: string | null): number | null {
  const t = Date.parse(`${paraISO(entrada)}T00:00:00`)
  return Number.isNaN(t) ? null : Math.max(0, Math.floor((Date.now() - t) / 864e5))
}

const SEXO: Record<string, string> = { M: 'Masculino', F: 'Feminino' }

type Grupo = 'prorrogacao' | 'visita' | 'internacao' | 'quadro' | 'periodo' | 'negociacao'

/** A seção do campo que barrou o registro, pela mensagem (as mensagens são as
 *  de useFormRelatorio, useDetalhesRelatorio e do backend). */
function grupoDoErro(erro: string | null): Grupo | null {
  const e = (erro ?? '').toLowerCase()
  if (!e) return null
  if (e.includes('prorrogação')) return 'prorrogacao'
  if (e.includes('relatório da visita') || e.includes('diagnóstico')) return 'quadro'
  if (e.includes('data da visita')) return 'visita'
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

export function ModalRelatorio({ form, paciente, medicos, enfermeiros, onAviso, onFechar }: {
  form: FormRelatorio
  paciente: InternacaoDados
  medicos: string[]
  enfermeiros: string[]
  /** Mensagem da ficha (toast) quando a alta é dada pelo botão do rodapé. */
  onAviso: (msg: string) => void
  onFechar: () => void
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
      {podeExecutar(role, 'darAlta') && (
        <AcaoAlta d={paciente} sobreposta pequeno={false} onFeito={onAviso} />
      )}
      <button className="btn btn-primary" onClick={form.salvar} disabled={desab}>
        {desab ? 'Enviando…' : form.vaiParaAprovacao ? 'Enviar para aprovação' : 'Registrar relatório'}
      </button>
    </>
  )

  return (
    <Modal title="Registrar relatório" onClose={fechar} largura={940} footer={rodape}>
      <style>{estilos}</style>
      <div className="rr-raiz">
      <DadosPaciente p={paciente} />

      <div className="rr-grupos">
        <GrupoRecolhivel titulo="Relatório de visita" resumo={resumo.visita}
                         aberto={abertos.has('visita')} onAlternar={() => alternar('visita')}>
          <SecaoVisita form={form} medicos={medicos} enfermeiros={enfermeiros}
                       dataEntrada={paraISO(paciente.data_entrada) || undefined} />
        </GrupoRecolhivel>
        {c && novos && (
          <GrupoRecolhivel titulo="Quadro de internação" resumo={resumo.internacao}
                           nota={c.doUltimo ? 'Como no último relatório' : undefined}
                           aberto={abertos.has('internacao')} onAlternar={() => alternar('internacao')}>
            <SecaoInternacao
              form={form}
              acomodacoes={acomodacoes}
              acomodacaoPaciente={paciente.prorrogacao_acomodacao || paciente.tipo_leito}
            />
          </GrupoRecolhivel>
        )}
        <GrupoRecolhivel titulo="Quadro clínico" resumo={resumo.quadro}
                         aberto={abertos.has('quadro')} onAlternar={() => alternar('quadro')}>
          <SecaoQuadroClinico form={form} />
        </GrupoRecolhivel>

        {((c && novos) || temFolhaRosa) && (
          <GrupoRecolhivel titulo="No período" resumo={resumo.periodo}
                           aberto={abertos.has('periodo')} onAlternar={() => alternar('periodo')}>
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
        )}

        {temProrrogacao && (
          <GrupoRecolhivel titulo="Prorrogação" resumo={resumo.prorrogacao}
                           aberto={abertos.has('prorrogacao')} onAlternar={() => alternar('prorrogacao')}>
            <SecaoProrrogacao form={form} />
          </GrupoRecolhivel>
        )}

        {NEGOCIACAO_NO_RELATORIO && c && novos && (
          <GrupoRecolhivel titulo="Negociação com o hospital" resumo={resumo.negociacao}
                           aberto={abertos.has('negociacao')} onAlternar={() => alternar('negociacao')}>
            <div className="rr-blocos">
              {c && novos && (
                <>
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
                </>
              )}
            </div>
          </GrupoRecolhivel>
        )}
      </div>
      </div>
    </Modal>
  )
}
