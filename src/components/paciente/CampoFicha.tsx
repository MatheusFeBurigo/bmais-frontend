// Um campo da ficha do paciente: rótulo + valor, ou input no modo edição.
import { dataBR } from '../../lib/datas'
import type { InternacaoEdicao } from '../../services/internacao.service'

const ROTULO = { fontSize: 10, letterSpacing: '.08em', fontWeight: 700, marginBottom: 5 } as const

export function CampoFicha({
  label, valor, span = 1, mono = false, multiline = false,
  edit = false, campo, rascunho, onChange, opcoes, tipo = 'text', falta = false,
}: {
  label: string
  valor?: string | number | null
  span?: number
  mono?: boolean
  multiline?: boolean
  // Modo edição: `campo` liga este input a uma chave do rascunho editável.
  // Campos somente-leitura (RN, Data alta) omitem `edit`/`campo` e nunca viram input.
  edit?: boolean
  campo?: keyof InternacaoEdicao
  rascunho?: InternacaoEdicao
  onChange?: <K extends keyof InternacaoEdicao>(campo: K, valor: string) => void
  opcoes?: string[]
  tipo?: 'text' | 'date'
  /** Campo importante que chegou em branco: destaca em âmbar e pede "informar".
   *  Vem de `camposIncompletos()`: a ficha não decide sozinha o que é importante. */
  falta?: boolean
}) {
  const editavel = edit && campo != null && rascunho != null && onChange != null
  // Enquanto edita, o destaque acompanha o que a pessoa digitou: preencher o campo
  // apaga o âmbar na hora, sem esperar o salvamento. `falta` vem do dado gravado e
  // sozinho manteria o alerta aceso sobre um campo já preenchido na tela.
  const aindaFalta = falta && (!editavel || !String((rascunho?.[campo!] as string | undefined) ?? '').trim())
  const classe = aindaFalta ? 'campo-falta' : undefined
  // Em leitura, campos de data saem em dd/mm/aaaa; o <input type="date"> segue
  // exigindo o ISO cru e por isso a conversão fica só na exibição.
  const bruto = valor === null || valor === undefined || valor === '' ? '—' : String(valor)
  const texto = tipo === 'date' ? (dataBR(bruto) || bruto) : bruto

  if (editavel) {
    const val = (rascunho[campo] as string | undefined) ?? ''
    const set = (v: string) => onChange(campo, v)
    return (
      <div style={{ gridColumn: `span ${span}` }} className={classe}>
        <div className="uppercase t-muted campo-lbl" style={ROTULO}>{label}</div>
        {opcoes ? (
          <select className="bm-input" value={val} onChange={(e) => set(e.target.value)}>
            <option value="">—</option>
            {opcoes.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : multiline ? (
          <textarea
            className="bm-input" rows={3} value={val} onChange={(e) => set(e.target.value)}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
        ) : (
          <input
            type={tipo} className={`bm-input${mono ? ' mono' : ''}`} value={val}
            onChange={(e) => set(e.target.value)}
          />
        )}
      </div>
    )
  }

  return (
    <div style={{ gridColumn: `span ${span}` }} className={classe}>
      <div className="uppercase t-muted campo-lbl" style={ROTULO}>{label}</div>
      <div
        className={`campo-box${mono ? ' mono' : ''}`}
        title={aindaFalta ? `${label} não veio no censo. Use “Editar” para informar.` : undefined}
        style={{
          // Borda e fundo ficam no inline (e não na classe .campo-falta) porque
          // estilo inline vence a folha: deixá-los só no CSS faria o âmbar nunca
          // aparecer. A classe segue existindo para o rótulo e para o modo edição.
          border: `1px solid ${aindaFalta ? 'var(--warning)' : 'var(--border-strong)'}`,
          borderRadius: 8,
          padding: multiline ? '9px 11px' : '7px 11px',
          minHeight: multiline ? 60 : undefined,
          fontSize: 'var(--t-base)',
          color: aindaFalta ? 'var(--warning-2)' : texto === '—' ? 'var(--muted-2)' : 'var(--ink)',
          background: aindaFalta ? 'var(--warning-bg)' : 'var(--surface)',
          whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {texto}
      </div>
    </div>
  )
}
