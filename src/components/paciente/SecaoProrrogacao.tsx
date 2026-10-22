// Seção "Prorrogar" da modal "Registrar relatório" (ficha "Detalhes"). Até
// 21/10/2026 se chamava "Pedir prorrogação" (pedido do usuário: "Fazer
// prorrogação ou Prorrogar").
//
// Vem no topo da modal: pedir prorrogação é o motivo de ser da maioria dos
// relatórios (65% no Márcia), e o resto da modal é o que sustenta o pedido.
// Fechada até ser marcada; os períodos seguem o padrão do portal (acomodação,
// data inicial, data final e "Adicionar"), como as outras listas da modal;
// justificativa escolhida numa lista (os motivos do Márcia) e complemento
// livre. A prorrogação só vale com o relatório aprovado, e não muda o prazo do
// próximo relatório.
//
// Pausar e retomar ficam fora daqui (08/10/2026: "o pausar prorrogação só deve
// aparecer quando eu registrar o relatório"): no topo da ficha, depois que a
// prorrogação vale (`AcaoPausarProrrogacao`), e no card da coluna "Em
// prorrogação" de Tarefas. Admin e operacional.
//
// O pedido leva um documento da operadora, opcional (20/10/2026: a Porto Seguro
// pede o formulário de prorrogação dela). Vai como anexo do relatório.
import { useRef, useState } from 'react'
import { useCatalogosProrrogacao } from '../../hooks/useKanban'
import { dataBR, diariasNoPeriodo } from '../../lib/datas'
import { EXTENSOES_ANEXO, MAX_BYTES_ANEXO } from '../../services/internacao.service'
import type { PedidoProrrogacao } from '../../types/api'
import { BlocoOpcional } from './relatorio/BlocoOpcional'
import { SecaoPeriodos } from './relatorio/SecoesListas'
import type { FormRelatorio } from './useFormRelatorio'

export function SecaoProrrogacao({ form }: { form: FormRelatorio }) {
  const prr = form.prorrogacao
  const catalogos = useCatalogosProrrogacao(Boolean(prr))
  // Sem a migration os catálogos vêm vazios: a seção não aparece.
  if (!prr || !catalogos.data?.acomodacoes.length) return null
  const { acomodacoes, justificativas } = catalogos.data
  const total = prr.periodos.finais().reduce((n, p) => n + diariasNoPeriodo(p.data_inicio, p.data_fim), 0)

  return (
    <BlocoOpcional titulo="Prorrogar" marcado={prr.ativa} onMarcar={prr.alternar}
                   desabilitado={form.salvando}
                   extra={total > 0 ? `${total} ${total === 1 ? 'diária' : 'diárias'}` : ''}>
      <div className="rr-pilha">
        <SecaoPeriodos lista={prr.periodos} acomodacoes={acomodacoes} desabilitado={form.salvando} />
        <label className="rr-campo">
          <span className="form-lbl">Justificativa<span className="req">*</span></span>
          <select className="bm-input bm-select" value={prr.justificativa}
                  onChange={(e) => prr.setJustificativa(e.target.value)}>
            <option value="">Escolher o motivo clínico</option>
            {justificativas.map((j) => <option key={j.codigo} value={j.codigo}>{j.descricao}</option>)}
          </select>
        </label>
        <label className="rr-campo">
          <span className="form-lbl">Complemento</span>
          <input className="bm-input" maxLength={1000} value={prr.complemento}
                 onChange={(e) => prr.setComplemento(e.target.value)} />
        </label>
        <CampoAnexo prr={prr} desabilitado={form.salvando} />
      </div>
    </BlocoOpcional>
  )
}

type Prorrogacao = NonNullable<FormRelatorio['prorrogacao']>

/** O documento do pedido: escolher, trocar e tirar. Na correção, começa com o
 *  que o relatório já tem (`anexoAtual`). Estilos `rr-anexo*` em ModalRelatorio. */
function CampoAnexo({ prr, desabilitado }: { prr: Prorrogacao; desabilitado: boolean }) {
  const entrada = useRef<HTMLInputElement>(null)
  const [erro, setErro] = useState<string | null>(null)
  const nome = prr.anexo?.name ?? (prr.anexoAtual && !prr.removerAnexo ? prr.anexoAtual : null)

  // O backend confere de novo; aqui é para avisar antes de enviar o relatório.
  function escolher(f: File | undefined) {
    if (!f) return
    const ext = f.name.includes('.') ? f.name.slice(f.name.lastIndexOf('.')).toLowerCase() : ''
    if (!EXTENSOES_ANEXO.includes(ext)) {
      setErro('Envie um PDF ou uma foto (JPG, PNG, WEBP ou HEIC).')
      return
    }
    if (f.size > MAX_BYTES_ANEXO) {
      setErro(`O arquivo passa de ${MAX_BYTES_ANEXO / (1024 * 1024)} MB.`)
      return
    }
    setErro(null)
    prr.setAnexo(f)
  }

  function remover() {
    setErro(null)
    prr.setAnexo(null)
    if (prr.anexoAtual) prr.setRemoverAnexo(true)
  }

  return (
    <div className="rr-campo">
      <span className="form-lbl">Documento da operadora</span>
      <p className="rr-bloco-dica rr-anexo-dica">
        Opcional. Por exemplo, o formulário de prorrogação da Porto Seguro. PDF ou foto, até{' '}
        {MAX_BYTES_ANEXO / (1024 * 1024)} MB.
      </p>
      {nome ? (
        <div className="rr-anexo">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          <span className="rr-anexo-nome" title={nome}>{nome}</span>
          <button type="button" className="btn btn-ghost btn-sm" disabled={desabilitado}
                  onClick={() => entrada.current?.click()}>Trocar</button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={desabilitado}
                  onClick={remover}>Tirar</button>
        </div>
      ) : (
        <button type="button" className="btn btn-outline btn-sm" disabled={desabilitado}
                onClick={() => entrada.current?.click()}>
          Anexar documento
        </button>
      )}
      <input ref={entrada} type="file" hidden accept={EXTENSOES_ANEXO.join(',')}
             onChange={(e) => { escolher(e.target.files?.[0]); e.target.value = '' }} />
      {erro && <div className="t-danger" role="alert" style={{ fontSize: 'var(--t-sm)', marginTop: 6 }}>{erro}</div>}
    </div>
  )
}

/** O pedido de prorrogação gravado num relatório: períodos e justificativa. */
export function ResumoProrrogacao({ p, compacto = false }: { p: PedidoProrrogacao; compacto?: boolean }) {
  const total = p.periodos.reduce((s, x) => s + diariasNoPeriodo(x.data_inicio, x.data_fim), 0)
  return (
    <div style={{
      marginTop: 6, padding: '6px 10px', borderRadius: 8, background: 'var(--info-bg)',
      fontSize: 'var(--t-sm)', color: 'var(--ink-2)', display: 'grid', gap: 2,
    }}>
      <b style={{ color: 'var(--info)' }}>
        Prorrogação: {total} {total === 1 ? 'diária' : 'diárias'}{p.pausada ? ' (pausada)' : ''}
      </b>
      {p.periodos.map((x, i) => (
        <span key={i}>{x.acomodacao}: {dataBR(x.data_inicio)} a {dataBR(x.data_fim)}</span>
      ))}
      {!compacto && p.justificativa_desc && <span>{p.justificativa_desc}{p.complemento ? `. ${p.complemento}` : ''}</span>}
    </div>
  )
}
