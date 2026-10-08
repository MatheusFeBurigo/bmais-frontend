// Modal "Registrar relatório" da ficha "Detalhes" (08/10/2026).
//
// Leva tudo o que o portal antigo (Márcia) registrava na visita, sem copiar as
// 9 abas dele. A ordem é a do pedido: o relatório existe, na maioria das vezes,
// para pedir prorrogação (65% no Márcia), e o resto é o que sustenta o pedido:
//   0. Paciente: os dados do alto, só leitura.
//   1. Prorrogação: o pedido (períodos por acomodação e justificativa).
//   2. Visita: quem e quando.
//   3. Internação: caráter, tipo e as acomodações utilizadas, vindos do último
//      relatório.
//   4. Quadro clínico: diagnóstico principal e secundário e o texto do
//      relatório (o único texto obrigatório).
//   5. No período: procedimentos, alto custo, evento adverso.
//   6. Negociação com o hospital: folha rosa (a troca de acomodação do portal),
//      glosa, medicação negada, procedimento negado, troca de procedimento.
// Os blocos opcionais ficam fechados até serem marcados (no lugar dos "Tem X?
// Sim/Não" do portal). Os relatórios anteriores ficam na timeline da ficha.
// A alta não é bloco: é o botão "Alta" do rodapé, ao lado de "Registrar
// relatório" (o mesmo do topo da ficha), e vale na hora, sem esperar o relatório.
// As perguntas de home care ficam nela, com o motivo Homecare.
// Com "Pedir prorrogação" marcado, o rodapé ganha "Pausar prorrogação" (admin e
// operacional): a pausa vai no pedido e vale quando o relatório vale.
//
// Sem a 0054 no banco, só aparece o que já existia (visita, CID, relatório,
// prorrogação, folha rosa).
import { useAuth } from '../../../auth/AuthContext'
import { podeExecutar } from '../../../auth/permissions'
import { useCatalogosProrrogacao } from '../../../hooks/useKanban'
import { dataBR, paraISO } from '../../../lib/datas'
import { identificacaoPaciente } from '../../../lib/texto'
import type { InternacaoDados } from '../../../types/api'
import { Modal } from '../../ui'
import { AcaoAlta } from '../AcaoAlta'
import { SecaoFolhaRosa } from '../SecaoFolhaRosa'
import { SecaoProrrogacao } from '../SecaoProrrogacao'
import type { FormRelatorio } from '../useFormRelatorio'
import { BlocoOpcional } from './BlocoOpcional'
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
.rr-ctx{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:10px 14px;margin-bottom:4px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2)}
.rr-ctx-dados{flex:1;min-width:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px 16px}
.rr-ctx-dados div{min-width:0}
.rr-ctx-dados dt{font-size:var(--t-xs);font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3)}
.rr-ctx-dados dd{margin:2px 0 0;font-size:var(--t-sm);color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rr-ctx-dados .rr-dado-nome{grid-column:span 2}
.rr-ctx-dados .rr-dado-nome dd{font-size:var(--t-md);font-weight:600}
.rr-form{min-width:0}
.rr-form .bm-input:not(textarea),.rr-form .cal-campo{height:36px;padding-top:0;padding-bottom:0}
.rr-sec .rr-titulo{margin:18px 0 10px}
.rr-titulo-nota{font-size:var(--t-xs);font-weight:500;letter-spacing:0;text-transform:none;color:var(--muted-2)}
.rr-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 12px;align-items:end}
.rr-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px 12px;align-items:end}
.rr-g-topo{align-items:start}
.rr-g-evento{display:grid;grid-template-columns:150px minmax(0,1fr);gap:10px 12px;align-items:end}
.rr-pilha{display:grid;gap:12px}
.rr-campo{min-width:0;display:block}
.rr-campo .bm-input{width:100%;min-width:0}
.rr-nota{font-size:var(--t-sm);color:var(--muted);margin-top:6px}
.rr-seg{display:flex;height:36px;border:1px solid var(--border-strong);border-radius:8px;overflow:hidden;width:max-content}
.rr-seg-op{position:relative;display:inline-flex;align-items:center;padding:0 16px;font-size:var(--t-sm);color:var(--ink-2);cursor:pointer;background:var(--surface)}
.rr-seg-op+.rr-seg-op{border-left:1px solid var(--border-strong)}
.rr-seg-op input{position:absolute;opacity:0;pointer-events:none}
.rr-seg-op.on{background:var(--primary-soft);color:var(--primary);font-weight:600}
.rr-seg-op:focus-within{outline:2px solid var(--accent);outline-offset:-2px}
.rr-chips{display:flex;flex-wrap:wrap;gap:6px}
.rr-chip{position:relative;display:inline-flex;align-items:center;height:36px;padding:0 14px;border:1px solid var(--border-strong);border-radius:999px;font-size:var(--t-sm);color:var(--ink-2);cursor:pointer;background:var(--surface)}
.rr-chip input{position:absolute;opacity:0;pointer-events:none}
.rr-chip.on{background:var(--primary-soft);color:var(--primary);border-color:var(--primary-3);font-weight:600}
.rr-chip:focus-within{outline:2px solid var(--accent);outline-offset:1px}
.rr-roteiro{padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2)}
.rr-roteiro-tit{font-size:var(--t-sm);font-weight:600;color:var(--ink)}
.rr-roteiro ol{margin-top:4px;list-style:none;display:flex;flex-wrap:wrap;gap:4px 18px;counter-reset:rot}
.rr-roteiro li{counter-increment:rot;font-size:var(--t-sm);color:var(--ink-2)}
.rr-roteiro li::before{content:counter(rot) ". ";font-weight:700;color:var(--primary)}
.rr-blocos{display:grid;gap:8px}
.rr-bloco{border:1px solid var(--border);border-radius:10px;background:var(--surface)}
.rr-bloco.on{border-color:var(--border-strong);background:var(--surface-2)}
.rr-bloco-tg{display:flex;align-items:center;gap:10px;padding:9px 12px;font-weight:600;font-size:var(--t-base);color:var(--ink);cursor:pointer}
.rr-bloco-tg input{width:15px;height:15px;accent-color:var(--accent);margin:0;flex-shrink:0}
.rr-bloco.rosa .rr-bloco-tg input{accent-color:var(--rosa)}
.rr-bloco.rosa.on{background:var(--rosa-bg)}
.rr-bloco-fixo{cursor:default}
.rr-bloco-extra{margin-left:auto;font-size:var(--t-sm);font-weight:500;color:var(--muted)}
.rr-bloco-corpo{padding:0 12px 12px}
.rr-lista-wrap{display:grid;gap:8px}
.rr-lista-entrada{display:grid;gap:10px;align-items:end}
.rr-lista-add{grid-column:-2/-1;height:36px;width:100%;justify-content:center}
.rr-resto{grid-column:2/-1}
.rr-linha{grid-column:1/-1}
.rr-dupla{grid-column:1/3}
.rr-lista{border:1px solid var(--border);border-radius:8px;background:var(--surface);overflow:hidden}
.rr-lista-linha{display:grid;column-gap:10px;row-gap:3px;align-items:center;padding:7px 0;font-size:var(--t-sm);color:var(--ink-2)}
.rr-lista-linha+.rr-lista-linha{border-top:1px solid var(--border)}
.rr-cel{min-width:0;padding:0 11px;overflow-wrap:anywhere}
.rr-cel-nota{margin-left:6px;color:var(--muted)}
.rr-acoes{grid-column:-2/-1;display:flex;justify-content:flex-end;gap:2px;padding-right:6px}
.rr-x{all:unset;display:inline-grid;place-items:center;width:24px;height:24px;border-radius:6px;font-size:11px;color:var(--muted);cursor:pointer;flex-shrink:0}
.rr-x:hover{background:var(--surface-3);color:var(--ink)}
.rr-x:focus-visible{outline:2px solid var(--accent)}
.rr-erro{font-size:var(--t-sm);color:var(--danger);margin-right:auto;align-self:center}
.rr-pausa{gap:6px;color:var(--caution);border-color:color-mix(in srgb,var(--caution) 45%,transparent);font-weight:600}
.rr-pausa:hover:not(:disabled){background:var(--caution-bg);border-color:var(--caution)}
.rr-pausa.on{background:var(--caution-bg);border-color:var(--caution)}
@media (max-width:900px){
  .rr-g3{grid-template-columns:repeat(2,minmax(0,1fr))}
  .rr-ctx-dados{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:620px){
  .rr-g2,.rr-g3,.rr-g-evento{grid-template-columns:minmax(0,1fr)}
  .rr-lista-entrada,.rr-lista-linha{grid-template-columns:minmax(0,1fr) !important}
  .rr-resto,.rr-linha,.rr-dupla{grid-column:auto}
  .rr-ctx{flex-direction:column}
}
`

/** Dias desde a internação, contando o dia de hoje como o último. */
function diasInternado(entrada?: string | null): number | null {
  const t = Date.parse(`${paraISO(entrada)}T00:00:00`)
  return Number.isNaN(t) ? null : Math.max(0, Math.floor((Date.now() - t) / 864e5))
}

const SEXO: Record<string, string> = { M: 'Masculino', F: 'Feminino' }

/** Os dados do paciente que o portal mostrava no alto do relatório, só leitura
 *  (corrigir é na ficha). */
function DadosPaciente({ p }: { p: InternacaoDados }) {
  const dias = diasInternado(p.data_entrada)
  const internacao = [
    dataBR(p.data_entrada),
    p.hora_entrada ? p.hora_entrada.slice(0, 5) : '',
    dias != null ? `${dias} ${dias === 1 ? 'dia' : 'dias'}` : '',
  ].filter(Boolean).join(' · ')
  const sexo = (p.sexo ?? '').trim().toUpperCase()
  const dados: [string, string][] = [
    ['Operadora', p.convenio || '—'],
    ['Hospital', p.hospital_nome || '—'],
    ['Sexo', SEXO[sexo] ?? (p.sexo || '—')],
    ['Nascimento', dataBR(p.data_nascimento) || '—'],
    ['Carteirinha', p.carteirinha || '—'],
    ['Internação', internacao || '—'],
  ]
  return (
    <dl className="rr-ctx-dados">
      <div className="rr-dado-nome"><dt>Paciente</dt><dd>{identificacaoPaciente(p)}</dd></div>
      {dados.map(([rot, valor]) => (
        <div key={rot}><dt>{rot}</dt><dd title={valor}>{valor}</dd></div>
      ))}
    </dl>
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
      {temProrrogacao && form.prorrogacao?.ativa && podeExecutar(role, 'controlarProrrogacao') && (
        <button
          type="button"
          className={`btn btn-outline rr-pausa${form.prorrogacao.pausada ? ' on' : ''}`}
          aria-pressed={form.prorrogacao.pausada}
          disabled={desab}
          title={form.prorrogacao.pausada
            ? 'A prorrogação vai pausada. Clique para pedir sem pausa.'
            : 'Pede a prorrogação já pausada'}
          onClick={() => form.prorrogacao?.setPausada(!form.prorrogacao.pausada)}
        >
          {form.prorrogacao.pausada ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z" /></svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
          )}
          {form.prorrogacao.pausada ? 'Retomar prorrogação' : 'Pausar prorrogação'}
        </button>
      )}
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
      <div className="rr-ctx">
        <DadosPaciente p={paciente} />
      </div>

      <div className="rr-form">
        {temProrrogacao && (
          <section className="rr-sec">
            <div className="section-label rr-titulo">Prorrogação</div>
            <SecaoProrrogacao form={form} />
          </section>
        )}
        <SecaoVisita form={form} medicos={medicos} enfermeiros={enfermeiros} />
        <SecaoInternacao
          form={form}
          acomodacoes={acomodacoes}
          acomodacaoPaciente={paciente.prorrogacao_acomodacao || paciente.tipo_leito}
        />
        <SecaoQuadroClinico form={form} />

        {c && novos && (
          <section className="rr-sec">
            <div className="section-label rr-titulo">No período</div>
            <div className="rr-blocos">
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
            </div>
          </section>
        )}

        {(temFolhaRosa || (c && novos)) && (
          <section className="rr-sec">
            <div className="section-label rr-titulo">Negociação com o hospital</div>
            <div className="rr-blocos">
              <SecaoFolhaRosa form={form} />
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
          </section>
        )}
      </div>
    </Modal>
  )
}
