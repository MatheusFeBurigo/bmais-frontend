// As três seções que todo relatório tem: Visita (quem e quando), Internação
// (como entrou e as acomodações utilizadas, vindas do último relatório) e
// Quadro clínico (diagnósticos e a evolução, o único texto obrigatório). Só
// apresentação: o estado vem de `useFormRelatorio`.
import { useEffect } from 'react'
import MedicoCombobox from '../../MedicoCombobox'
import { CalendarioVisita } from '../../kanban/CalendarioVisita'
import { CARATER, TIPOS_INTERNACAO } from '../../../lib/relatorioDetalhes'
import { CampoCidRelatorio } from '../CampoCidRelatorio'
import type { FormRelatorio } from '../useFormRelatorio'
import { SecaoAcomodacoes } from './SecoesListas'

// O leito vem em caixa alta ("APARTAMENTO") e o catálogo em nome próprio.
const chave = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()

// O que o portal antigo pedia no texto do relatório.
const ROTEIRO = [
  'Motivo da internação',
  'Antecedentes e comorbidades relevantes',
  'Procedimentos realizados',
  'Evolução atual',
  'Plano terapêutico',
]

export function SecaoVisita({ form, medicos, enfermeiros }: {
  form: FormRelatorio
  medicos: string[]
  enfermeiros: string[]
}) {
  const c = form.completo
  return (
    <section className="rr-sec">
      <div className="section-label rr-titulo">Visita</div>
      <div className="rr-g3">
        <div className="rr-campo">
          {/* Visita que já aconteceu: a PREVISTA tem campo próprio (Agendar visita). */}
          <span className="form-lbl">Data da visita<span className="req">*</span></span>
          <CalendarioVisita valor={form.dataVisita} onEscolher={form.setDataVisita} limite="passado" placeholder="Escolher data" />
        </div>
        <div className="rr-campo">
          <span className="form-lbl">Médico auditor</span>
          <MedicoCombobox value={form.medico} onChange={form.setMedico} nomes={medicos} />
        </div>
        {c?.noBanco && (
          <div className="rr-campo">
            <span className="form-lbl">Enfermeiro auditor</span>
            <MedicoCombobox value={c.enfermeiro} onChange={c.setEnfermeiro} nomes={enfermeiros}
                            placeholder="Digite ou selecione o enfermeiro…" />
          </div>
        )}
      </div>
    </section>
  )
}

export function SecaoInternacao({ form, acomodacoes, acomodacaoPaciente }: {
  form: FormRelatorio
  acomodacoes: { id: number; nome: string }[]
  /** Onde a ficha diz que o paciente está (prorrogação vigente ou leito). */
  acomodacaoPaciente?: string | null
}) {
  const c = form.completo
  const sugerida = acomodacaoPaciente
    ? acomodacoes.find((a) => chave(a.nome) === chave(acomodacaoPaciente))?.nome
    : undefined
  const sugerir = c?.sugerirAcomodacao

  // Sem acomodações no último relatório, a linha de entrada já vem com a da ficha.
  useEffect(() => {
    if (sugerida && sugerir) sugerir(sugerida)
  }, [sugerida]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!c?.noBanco) return null
  return (
    <section className="rr-sec">
      <div className="section-label rr-titulo">
        Internação
        {c.doUltimo && <span className="rr-titulo-nota">Como no último relatório</span>}
      </div>
      <div className="rr-pilha">
        <div className="rr-g3">
          <div className="rr-campo">
            <span className="form-lbl">Caráter</span>
            <div className="rr-seg" role="radiogroup" aria-label="Caráter">
              {CARATER.map((o) => (
                <label key={o.key} className={`rr-seg-op${c.carater === o.key ? ' on' : ''}`}>
                  <input type="radio" name="rr-carater" value={o.key} checked={c.carater === o.key}
                         onChange={() => c.setCarater(o.key)} />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
          <label className="rr-campo">
            <span className="form-lbl">Tipo de internação</span>
            <select className="bm-input bm-select" value={c.tipoInternacao} onChange={(e) => c.setTipoInternacao(e.target.value)}>
              <option value="">Escolher</option>
              {TIPOS_INTERNACAO.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </label>
        </div>
        {/* Mesmo painel dos blocos: as listas da modal ficam com a mesma
            largura, e as colunas de data caem na mesma vertical. */}
        <div className="rr-bloco on">
          <div className="rr-bloco-tg rr-bloco-fixo">Acomodações utilizadas</div>
          <div className="rr-bloco-corpo">
            <SecaoAcomodacoes lista={c.acomodacoes} acomodacoes={acomodacoes} desabilitado={form.salvando} />
          </div>
        </div>
      </div>
    </section>
  )
}

export function SecaoQuadroClinico({ form }: { form: FormRelatorio }) {
  const principal = form.cidPrincipal
  return (
    <section className="rr-sec">
      <div className="section-label rr-titulo">Quadro clínico</div>
      <div className="rr-pilha">
        {/* O CID é do técnico: relatório que vai para aprovação não leva. */}
        {!form.vaiParaAprovacao && (
          <div className="rr-g2 rr-g-topo">
            <CampoCidRelatorio
              form={form}
              rotulo="Diagnóstico principal"
              selecao={{
                escolhidos: principal ? [principal] : [],
                adicionar: form.definirCidPrincipal,
                remover: () => form.definirCidPrincipal(null),
              }}
            />
            <CampoCidRelatorio
              form={form}
              rotulo="Diagnóstico secundário"
              selecao={{
                escolhidos: form.cids,
                adicionar: form.adicionarCid,
                remover: form.removerCid,
                ocultar: principal ? [principal.codigo] : [],
              }}
            />
          </div>
        )}
        <div className="rr-roteiro">
          <span className="rr-roteiro-tit">O relatório deve trazer</span>
          <ol>{ROTEIRO.map((t) => <li key={t}>{t}</li>)}</ol>
        </div>
        <label className="rr-campo">
          <span className="form-lbl">Relatório<span className="req">*</span></span>
          <textarea
            className="bm-input" rows={8}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
            value={form.obs} onChange={(e) => form.setObs(e.target.value)}
          />
        </label>
      </div>
    </section>
  )
}
