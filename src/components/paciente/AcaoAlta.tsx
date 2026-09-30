// Botão "Alta" / "Desfazer alta" do paciente, com a modal de cada um.
//
// Usado no rodapé do drawer e no topo da ficha. Quem decide se aparece é quem
// renderiza (`podeExecutar(role, 'darAlta')`); aqui se decide QUAL dos dois:
//   * internado → "Alta" (data obrigatória, hora opcional);
//   * alta manual ou inferida → "Desfazer alta";
//   * alta que veio do censo → nada: o documento do hospital não se desfaz por
//     clique (o backend recusa com 409 de qualquer forma).
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { darAlta, desfazerAlta } from '../../services/internacao.service'
import { invalidarPorEvento } from '../../lib/invalidation'
import { queryKeys } from '../../lib/queryKeys'
import { dataBR, hojeISO, paraISO } from '../../lib/datas'
import { identificacaoPaciente } from '../../lib/texto'
import type { InternacaoDados } from '../../types/api'
import { ConfirmarModal } from '../ConfirmarModal'
import { Modal, Spinner } from '../ui'

// Botão verde contornado: alta é a saída prevista da internação, não um erro,
// mas tira o paciente da lista, então não pode parecer um botão neutro.
const estilos = `
.btn-alta{color:var(--success);border-color:color-mix(in srgb,var(--success) 45%,transparent);gap:6px;font-weight:600}
.btn-alta:hover:not(:disabled){background:var(--success-bg);border-color:var(--success)}
.alta-pac{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2)}
.alta-pac-ico{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;flex-shrink:0;background:var(--success-bg);color:var(--success)}
.alta-pac-nome{font-size:var(--t-md);font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.alta-pac-meta{font-size:var(--t-sm);color:var(--muted);margin-top:2px}
.alta-aviso{display:flex;gap:8px;align-items:flex-start;padding:9px 12px;border-radius:8px;background:var(--warning-bg);color:var(--warning-2);font-size:var(--t-sm)}
`

const iconeAlta = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
)

export function estaInternado(d: InternacaoDados): boolean {
  return !d.data_alta && (!d.status || d.status === 'INTERNADO')
}

export function AcaoAlta({ d, sobreposta, onFeito, pequeno = true }: {
  d: InternacaoDados
  /** Tamanho `btn-sm` (cabeçalho da ficha); no rodapé do drawer acompanha o Fechar. */
  pequeno?: boolean
  /** Aberta sobre o drawer: a modal precisa subir o z-index. */
  sobreposta?: boolean
  onFeito: (msg: string) => void
}) {
  const qc = useQueryClient()
  const [aberta, setAberta] = useState(false)
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const internado = estaInternado(d)
  const desfazivel = !internado && (d.alta_origem === 'manual' || d.alta_origem === 'inferida')
  if (!internado && !desfazivel) return null

  function fechar() {
    if (salvando) return
    setAberta(false)
    setData('')
    setHora('')
    setErro(null)
  }

  async function executar(acao: () => Promise<unknown>, msg: string) {
    setSalvando(true)
    setErro(null)
    try {
      await acao()
      invalidarPorEvento(qc, 'altaAlterada')
      qc.invalidateQueries({ queryKey: queryKeys.internacaoDados(d.id) })
      qc.invalidateQueries({ queryKey: queryKeys.internacaoTimeline(d.id) })
      setAberta(false)
      setData('')
      setHora('')
      onFeito(msg)
    } catch (e) {
      // A mensagem do backend já é de tela ("A alta não pode ser antes da
      // internação (20/09/2026).").
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar')
    } finally {
      setSalvando(false)
    }
  }

  const botao = (
    <>
      <style>{estilos}</style>
      <button
        type="button"
        className={`btn btn-outline${pequeno ? ' btn-sm' : ''}${internado ? ' btn-alta' : ''}`}
        style={{ flexShrink: 0 }}
        onClick={() => setAberta(true)}
        title={internado ? 'Registrar a alta deste paciente' : undefined}
      >
        {internado && iconeAlta}
        {internado ? 'Alta' : 'Desfazer alta'}
      </button>
    </>
  )

  if (!internado) {
    return (
      <>
        {botao}
        {aberta && (
          <ConfirmarModal
            titulo="Desfazer alta"
            confirmar="Desfazer alta"
            ocupado={salvando}
            sobreposta={sobreposta}
            onConfirmar={() => void executar(() => desfazerAlta(d.id), '✓ Alta desfeita')}
            onCancelar={fechar}
          >
            <p style={{ margin: 0 }}>
              <strong>{identificacaoPaciente(d)}</strong> volta para a lista de internados.
            </p>
            {d.data_alta && <p style={{ margin: 0 }}>Alta registrada em {dataBR(d.data_alta)}.</p>}
            {erro && <div className="nh-erro">{erro}</div>}
          </ConfirmarModal>
        )}
      </>
    )
  }

  const entrada = paraISO(d.data_entrada)
  return (
    <>
      {botao}
      {aberta && (
        <Modal
          title="Alta"
          sobreposta={sobreposta}
          onClose={fechar}
          footer={
            <>
              <button type="button" className="btn btn-outline btn-sm" disabled={salvando} onClick={fechar}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-success btn-sm"
                disabled={salvando || !data}
                onClick={() => void executar(() => darAlta(d.id, data, hora), '✓ Alta registrada')}
              >
                {salvando && <Spinner size={12} style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.4)' }} />}
                Confirmar alta
              </button>
            </>
          }
        >
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="alta-pac">
              <span className="alta-pac-ico">{iconeAlta}</span>
              <div style={{ minWidth: 0 }}>
                <div className="alta-pac-nome">{identificacaoPaciente(d)}</div>
                <div className="alta-pac-meta">
                  {d.data_entrada ? `Internado desde ${dataBR(d.data_entrada)}` : 'Data de internação não informada'}
                  {d.dias != null && ` · ${d.dias}d`}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="nh-campo" style={{ flex: 1 }}>
                <label htmlFor="alta-data" className="form-lbl">Data da alta<span className="req">*</span></label>
                {/* Input nativo, e não o calendário da visita: o popover dele
                    ficaria cortado pela rolagem do corpo da modal. */}
                <input
                  id="alta-data"
                  type="date"
                  className="bm-input"
                  value={data}
                  min={entrada || undefined}
                  max={hojeISO()}
                  onChange={(e) => setData(e.target.value)}
                />
              </div>
              <div className="nh-campo" style={{ width: 130 }}>
                <label htmlFor="alta-hora" className="form-lbl">Horário <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--muted)' }}>(opcional)</span></label>
                <input
                  id="alta-hora"
                  type="time"
                  className="bm-input"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                />
              </div>
            </div>
            {d.visita_agendada && (
              <div className="alta-aviso">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
                A visita agendada será cancelada.
              </div>
            )}
            {erro && <div className="nh-erro">{erro}</div>}
          </div>
        </Modal>
      )}
    </>
  )
}
