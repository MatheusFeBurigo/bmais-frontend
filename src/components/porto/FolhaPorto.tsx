// A folha "Solicitação de prorrogação" da Porto Saúde, na estrutura do
// formulário original: mesmas faixas, colunas e textos (inclusive a grafia
// impressa nele). Cada campo é editável; o que abre preenchido vem de
// `preencherFolha` (./folhaPorto.model).
//
// Componente controlado: quem monta guarda os valores. A página
// (pages/FormularioPorto) baixa o PDF com eles.
import type { ReactNode } from 'react'
import type { FolhaPortoValores, ListaFolha, SimNao } from './folhaPorto.model'
import './folhaPorto.css'

// Larguras medidas na folha original, que tem 1775 de largura: 955 para o lado
// da solicitação e 820 para o da validação. Viram porcentagens da folha.
const LARGURA = 1775
const pct = (w: number) => `${(w / LARGURA) * 100}%`

const COLS_PERIODOS = [103, 103, 342, 136, 134, 137, 104, 101, 273, 68, 137, 137]
const COLS_TUSS = [206, 546, 66, 137, 205, 306, 103, 103, 103]
const COLS_MEDICAMENTOS = [240, 238, 239, 238, 205, 205, 204, 206]
const COLS_LADOS = [955, 820]

function Colunas({ larguras }: { larguras: number[] }) {
  return <colgroup>{larguras.map((w, i) => <col key={i} style={{ width: pct(w) }} />)}</colgroup>
}

function Segmento({ w, fim, className, children }: { w: number; fim?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={['fp-seg', fim && 'fim', className].filter(Boolean).join(' ')} style={{ width: pct(w) }}>
      {children}
    </div>
  )
}

function Texto({ valor, onChange, rotulo, className }: {
  valor: string
  onChange: (v: string) => void
  rotulo: string
  className?: string
}) {
  return (
    <input className={className ? `fp-in ${className}` : 'fp-in'} value={valor} aria-label={rotulo}
           onChange={(e) => onChange(e.target.value)} />
  )
}

function Area({ valor, onChange, rotulo }: { valor: string; onChange: (v: string) => void; rotulo: string }) {
  return <textarea className="fp-area" value={valor} aria-label={rotulo} onChange={(e) => onChange(e.target.value)} />
}

/** "( ) SIM ( ) NÃO". Clicar na opção marcada desmarca. */
function SimOuNao({ valor, onChange, rotulo }: { valor: SimNao; onChange: (v: SimNao) => void; rotulo: string }) {
  return (
    <span className="fp-sn" role="group" aria-label={rotulo}>
      {(['sim', 'nao'] as const).map((op) => (
        <button key={op} type="button" className="fp-sn-op" aria-pressed={valor === op}
                onClick={() => onChange(valor === op ? null : op)}>
          (<span className="fp-sn-x">{valor === op ? 'X' : ''}</span>) {op === 'sim' ? 'SIM' : 'NÃO'}
        </button>
      ))}
    </span>
  )
}

type Linha<K extends ListaFolha> = FolhaPortoValores[K][number]

export function FolhaPorto({ v, onChange }: { v: FolhaPortoValores; onChange: (v: FolhaPortoValores) => void }) {
  const ano = new Date().getFullYear()

  const campo = <K extends keyof FolhaPortoValores>(k: K) =>
    (valor: FolhaPortoValores[K]) => onChange({ ...v, [k]: valor })

  // Muda um campo de uma linha de tabela: `linha('tussSolicitados', 2)('qtd')`.
  const linha = <K extends ListaFolha>(k: K, i: number) =>
    <C extends keyof Linha<K>>(c: C) => (valor: Linha<K>[C]) => {
      const lista = v[k] as Linha<K>[]
      onChange({ ...v, [k]: lista.map((l, j) => (j === i ? { ...l, [c]: valor } : l)) })
    }

  return (
    <div className="fp-folha">
      <div className="fp-faixa fp-topo">
        <Segmento w={823} className="fp-marca"><span>Porto</span><span>Saúde</span></Segmento>
        <Segmento w={132} className="fp-solic"><span>SOLICITAÇÃO DE<br />PRORROGAÇÃO</span></Segmento>
        <Segmento w={820}>
          <Texto className="fp-hospital" valor={v.hospital} onChange={campo('hospital')} rotulo="Hospital" />
        </Segmento>
      </div>

      <div className="fp-faixa">
        <Segmento w={823}>
          <span className="fp-rot">NOME DO PACIENTE</span>
          <Texto valor={v.nome} onChange={campo('nome')} rotulo="Nome do paciente" />
        </Segmento>
        <Segmento w={312} fim>
          <span className="fp-rot">DIARIA DA MADRUGADA</span>
          <SimOuNao valor={v.madrugada} onChange={campo('madrugada')} rotulo="Diária da madrugada" />
        </Segmento>
        <Segmento w={640}>
          <span className="fp-rot">JUSTIFICATIVA</span>
          <Texto valor={v.madrugadaJustificativa} onChange={campo('madrugadaJustificativa')}
                 rotulo="Justificativa da diária da madrugada" />
        </Segmento>
      </div>

      <div className="fp-faixa">
        <Segmento w={445}>
          <span className="fp-rot">NUMERO DA SENHA PORTO</span>
          <Texto valor={v.senha} onChange={campo('senha')} rotulo="Número da senha Porto" />
        </Segmento>
        <Segmento w={378}>
          <span className="fp-rot">CARTEIRINHA</span>
          <Texto valor={v.carteirinha} onChange={campo('carteirinha')} rotulo="Carteirinha" />
        </Segmento>
        <Segmento w={312} fim>
          <span className="fp-rot">ALTA TARDIA</span>
          <SimOuNao valor={v.altaTardia} onChange={campo('altaTardia')} rotulo="Alta tardia" />
        </Segmento>
        <Segmento w={640}>
          <span className="fp-rot">JUSTIFICATIVA</span>
          <Texto valor={v.altaTardiaJustificativa} onChange={campo('altaTardiaJustificativa')}
                 rotulo="Justificativa da alta tardia" />
        </Segmento>
      </div>

      <div className="fp-faixa">
        <Segmento w={343}>
          <span className="fp-rot">DATA DA INTERNAÇÃO</span>
          <Texto valor={v.dataInternacao} onChange={campo('dataInternacao')} rotulo="Data da internação" />
        </Segmento>
        <Segmento w={172}>
          <span className="fp-rot">HORA</span>
          <Texto valor={v.horaInternacao} onChange={campo('horaInternacao')} rotulo="Hora da internação" />
        </Segmento>
        <Segmento w={340}>
          <span className="fp-rot">DATA DE ALTA</span>
          <Texto valor={v.dataAlta} onChange={campo('dataAlta')} rotulo="Data de alta" />
        </Segmento>
        <Segmento w={920}>
          <span className="fp-rot">HORA</span>
          <Texto valor={v.horaAlta} onChange={campo('horaAlta')} rotulo="Hora da alta" />
        </Segmento>
      </div>

      <table className="fp-t fp-aviso">
        <Colunas larguras={COLS_LADOS} />
        <tbody>
          <tr>
            <th className="fp-cinza fp-2l">
              CAMPO EXCLUSIVO DE SOLICITAÇÃO e CONSENSO<br />
              <span className="fp-sub">Usado para solicitação do hospital e discussão quando necessario</span><br />
              <span className="fp-sub">Não tem validade para oficializar a prorrogação</span>
            </th>
            <th className="fp-cinza fp-2l">
              CAMPO EXCLUSIVO DE VALIDAÇÃO DO AUDITOR DA PORTO<br />
              <span className="fp-sub">( Este campo contem o que sera efetivamente prorrogado, não podendo ser rasurado)</span><br />
              <span className="fp-sub">Este formulario passa ter validade apenas com carimbo do auditor porto e data da finalização</span>
            </th>
          </tr>
        </tbody>
      </table>

      <table className="fp-t">
        <Colunas larguras={COLS_PERIODOS} />
        <thead>
          <tr>
            <th>DE:</th><th>ATÉ:</th><th>LEITO</th>
            <th className="fp-mini">DIARIA GLOBALIZADA?</th><th className="fp-mini">ISOLAMENTO?</th>
            <th className="fp-mini">CONSENSO?</th>
            <th>DE:</th><th>ATÉ:</th><th>LEITO</th><th>QTD</th>
            <th className="fp-mini">DIARIA GLOBALIZADA?</th><th className="fp-mini">ISOLAMENTO?</th>
          </tr>
        </thead>
        <tbody>
          {v.periodosSolicitados.map((s, i) => {
            const sol = linha('periodosSolicitados', i)
            const val = linha('periodosValidados', i)
            const p = v.periodosValidados[i]
            const n = i + 1
            return (
              <tr key={i}>
                <td className="fp-campo"><Texto valor={s.de} onChange={sol('de')} rotulo={`Solicitação, de, linha ${n}`} /></td>
                <td className="fp-campo"><Texto valor={s.ate} onChange={sol('ate')} rotulo={`Solicitação, até, linha ${n}`} /></td>
                <td className="fp-campo"><Texto valor={s.leito} onChange={sol('leito')} rotulo={`Solicitação, leito, linha ${n}`} /></td>
                <td className="fp-campo"><SimOuNao valor={s.globalizada} onChange={sol('globalizada')} rotulo={`Solicitação, diária globalizada, linha ${n}`} /></td>
                <td className="fp-campo"><SimOuNao valor={s.isolamento} onChange={sol('isolamento')} rotulo={`Solicitação, isolamento, linha ${n}`} /></td>
                <td className="fp-campo"><SimOuNao valor={s.consenso} onChange={sol('consenso')} rotulo={`Solicitação, consenso, linha ${n}`} /></td>
                <td className="fp-campo"><Texto valor={p.de} onChange={val('de')} rotulo={`Validação, de, linha ${n}`} /></td>
                <td className="fp-campo"><Texto valor={p.ate} onChange={val('ate')} rotulo={`Validação, até, linha ${n}`} /></td>
                <td className="fp-campo"><Texto valor={p.leito} onChange={val('leito')} rotulo={`Validação, leito, linha ${n}`} /></td>
                <td className="fp-campo"><Texto valor={p.qtd} onChange={val('qtd')} rotulo={`Validação, quantidade, linha ${n}`} /></td>
                <td className="fp-campo"><SimOuNao valor={p.globalizada} onChange={val('globalizada')} rotulo={`Validação, diária globalizada, linha ${n}`} /></td>
                <td className="fp-campo"><SimOuNao valor={p.isolamento} onChange={val('isolamento')} rotulo={`Validação, isolamento, linha ${n}`} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <table className="fp-t">
        <Colunas larguras={COLS_LADOS} />
        <tbody>
          <tr>
            <th className="fp-cinza">NEGOCIAÇÃO DE CODIGOS E DIARIAS</th>
            <th className="fp-cinza">RESULTADO DAS NEGOCIAÇÕES DE CODIGOS E DIARIAS</th>
          </tr>
          <tr className="fp-negociacao">
            <td className="fp-campo"><Area valor={v.negociacao} onChange={campo('negociacao')} rotulo="Negociação de códigos e diárias" /></td>
            <td className="fp-campo"><Area valor={v.resultado} onChange={campo('resultado')} rotulo="Resultado das negociações de códigos e diárias" /></td>
          </tr>
        </tbody>
      </table>

      <table className="fp-t">
        <Colunas larguras={COLS_TUSS} />
        <thead>
          <tr>
            <th className="fp-cinza fp-mini fp-2l">CÓDIGOS TUSS SOLICITADOS<br />E CONSTANTES NO ROL</th>
            <th className="fp-cinza">DESCRIÇÃO</th>
            <th className="fp-cinza">QTD</th>
            <th className="fp-cinza fp-mini">CONSENSO?</th>
            <th className="fp-cinza fp-mini fp-2l">CÓDIGOS TUSS AUTORIZADOS<br />E CONSTANTES NO ROL</th>
            <th className="fp-cinza">DESCRIÇÃO</th>
            <th className="fp-cinza fp-2l">QTD<br />AUTORIZDA</th>
            <th className="fp-cinza fp-2l">DATA DE<br />REALIZAÇÃO</th>
            <th className="fp-cinza">COM DUT?</th>
          </tr>
        </thead>
        <tbody>
          {v.tussSolicitados.map((s, i) => {
            const sol = linha('tussSolicitados', i)
            const aut = linha('tussAutorizados', i)
            const a = v.tussAutorizados[i]
            const n = i + 1
            return (
              <tr key={i}>
                <td className="fp-campo"><Texto valor={s.codigo} onChange={sol('codigo')} rotulo={`Código TUSS solicitado, linha ${n}`} /></td>
                <td className="fp-campo"><Texto valor={s.descricao} onChange={sol('descricao')} rotulo={`Descrição do solicitado, linha ${n}`} /></td>
                <td className="fp-campo"><Texto valor={s.qtd} onChange={sol('qtd')} rotulo={`Quantidade solicitada, linha ${n}`} /></td>
                <td className="fp-campo"><SimOuNao valor={s.consenso} onChange={sol('consenso')} rotulo={`Consenso, linha ${n}`} /></td>
                <td className="fp-campo"><Texto valor={a.codigo} onChange={aut('codigo')} rotulo={`Código TUSS autorizado, linha ${n}`} /></td>
                <td className="fp-campo"><Texto valor={a.descricao} onChange={aut('descricao')} rotulo={`Descrição do autorizado, linha ${n}`} /></td>
                <td className="fp-campo"><Texto valor={a.qtd} onChange={aut('qtd')} rotulo={`Quantidade autorizada, linha ${n}`} /></td>
                <td className="fp-campo"><Texto valor={a.data} onChange={aut('data')} rotulo={`Data de realização, linha ${n}`} /></td>
                <td className="fp-campo"><Texto valor={a.dut} onChange={aut('dut')} rotulo={`Com DUT, linha ${n}`} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <table className="fp-t">
        <Colunas larguras={COLS_MEDICAMENTOS} />
        <thead>
          <tr>
            <th className="fp-cinza">MEDICAMENTO SOLICITADO</th>
            <th className="fp-cinza">DOSE PRESCRITA</th>
            <th className="fp-cinza">DATA DE ADMINISTRAÇÃO</th>
            <th className="fp-cinza">TEMPO DE TRATAMENTO</th>
            <th className="fp-cinza">MEDICAMENTO SOLICITADO</th>
            <th className="fp-cinza">DOSE PRESCRITA</th>
            <th className="fp-cinza">DATA DE ADMINISTRAÇÃO</th>
            <th className="fp-cinza">TEMPO DE TRATAMENTO</th>
          </tr>
        </thead>
        <tbody>
          {v.medSolicitados.map((s, i) => {
            const sol = linha('medSolicitados', i)
            const val = linha('medValidados', i)
            const m = v.medValidados[i]
            const n = i + 1
            return (
              <tr key={i}>
                <td className="fp-campo"><Texto valor={s.medicamento} onChange={sol('medicamento')} rotulo={`Medicamento solicitado, linha ${n}`} /></td>
                <td className="fp-campo"><Texto valor={s.dose} onChange={sol('dose')} rotulo={`Dose prescrita, linha ${n}`} /></td>
                <td className="fp-campo"><Texto valor={s.data} onChange={sol('data')} rotulo={`Data de administração, linha ${n}`} /></td>
                <td className="fp-campo"><Texto valor={s.tempo} onChange={sol('tempo')} rotulo={`Tempo de tratamento, linha ${n}`} /></td>
                <td className="fp-campo"><Texto valor={m.medicamento} onChange={val('medicamento')} rotulo={`Validação, medicamento, linha ${n}`} /></td>
                <td className="fp-campo"><Texto valor={m.dose} onChange={val('dose')} rotulo={`Validação, dose, linha ${n}`} /></td>
                <td className="fp-campo"><Texto valor={m.data} onChange={val('data')} rotulo={`Validação, data de administração, linha ${n}`} /></td>
                <td className="fp-campo"><Texto valor={m.tempo} onChange={val('tempo')} rotulo={`Validação, tempo de tratamento, linha ${n}`} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <table className="fp-t">
        <tbody>
          <tr><th className="fp-cinza">CAMPO DE OBSERVAÇÕES GERAIS</th></tr>
          <tr className="fp-obs">
            <td className="fp-campo"><Area valor={v.observacoes} onChange={campo('observacoes')} rotulo="Observações gerais" /></td>
          </tr>
        </tbody>
      </table>

      <table className="fp-t">
        <Colunas larguras={COLS_LADOS} />
        <tbody>
          <tr>
            <th className="fp-cinza">DATA, CARIMBO E ASSINATURA DO AUDITOR DO HOSPITAL (Sem validade sem preenchimento)</th>
            <th className="fp-cinza">DATA, CARIMBO E ASSINATURA DO AUDITOR OPERADORA (Sem validade sem carimbo)</th>
          </tr>
          <tr className="fp-assinatura">
            <td>{`/      /  ${ano}`}</td>
            <td>{`/      /  ${ano}`}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
