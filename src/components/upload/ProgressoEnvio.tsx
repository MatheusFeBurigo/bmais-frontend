// Quanto do envio já foi lido, enquanto ele acontece.
//
// Ler um censo é lento: um PDF de 600 linhas leva segundos, e um lote de dez
// arquivos passa de um minuto. Antes a tela só trocava o botão por "Enviando…",
// e nesse intervalo não havia como distinguir "está trabalhando" de "travou" —
// a dúvida que faz o usuário recarregar a página no meio do processamento e
// perder o envio.
//
// A porcentagem é REAL, não uma animação por tempo: cada passo só avança quando
// um arquivo de fato terminou de ser lido pelo backend (ver `processar` em
// Upload.tsx, que envia um arquivo por vez). Uma barra que anda sozinha por
// cronômetro mente nos dois sentidos — trava em 90% quando o arquivo é grande e
// corre até o fim quando é pequeno —, e é exatamente a confiança que este
// componente existe para dar.

import { plural } from './comuns'

export const progressoStyles = `
.up-prog{display:grid;gap:9px;padding:14px;border:1px solid var(--primary-2);border-radius:var(--r-md);background:var(--primary-soft);animation:up-pop .28s cubic-bezier(.2,.7,.2,1)}
.up-prog-topo{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
/* O título diz a FASE ("Enviando arquivos" x "Lendo censos"): as duas levam
   tempo e falham por motivos diferentes, e saber em qual está é o que permite ao
   usuário entender uma demora (conexão lenta x PDF pesado). */
.up-prog-fase{flex:1;min-width:140px;font-size:var(--t-md);font-weight:600;color:var(--ink);letter-spacing:-.01em}
/* A porcentagem em mono e grande: é o número que se olha de relance, e em fonte
   proporcional ele "pula" de largura a cada mudança de dígito. */
.up-prog-pct{font-family:var(--font-mono);font-size:var(--t-xl);font-weight:700;color:var(--primary-3);font-variant-numeric:tabular-nums}
/* Trilho e preenchimento. A transição suaviza o salto entre um arquivo e o
   seguinte (que é um degrau, não um fluxo contínuo) sem fingir progresso: ela
   dura menos que o menor passo real. */
.up-prog-trilho{height:8px;border-radius:99px;background:var(--surface-3);overflow:hidden;box-shadow:inset 0 0 0 1px var(--border-soft)}
.up-prog-barra{height:100%;border-radius:99px;background:var(--primary);transition:width .25s cubic-bezier(.2,.7,.2,1)}
/* Faixa listrada em movimento enquanto NÃO há progresso mensurável (o envio dos
   bytes, onde o fetch não reporta bytes). Diz "trabalhando" sem afirmar um
   número que o código não sabe. */
.up-prog-barra.indeterminada{width:35%;background:linear-gradient(90deg,var(--primary-2),var(--primary),var(--primary-2));animation:up-prog-desliza 1.1s ease-in-out infinite}
@keyframes up-prog-desliza{0%{margin-left:-35%}100%{margin-left:100%}}
/* Rodapé: a contagem à esquerda e o arquivo da vez à direita, truncado. */
.up-prog-pe{display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:var(--t-sm);color:var(--muted)}
.up-prog-conta{flex-shrink:0}
.up-prog-conta b{font-family:var(--font-mono);color:var(--ink-2);font-variant-numeric:tabular-nums}
.up-prog-arq{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--font-mono);font-size:var(--t-xs);color:var(--muted-2);text-align:right}
@media (prefers-reduced-motion:reduce){
  .up-prog-barra{transition:none}
  .up-prog-barra.indeterminada{animation:none;width:100%;opacity:.5}
}
`

export interface EstadoProgresso {
  /** `enviando` = subindo os bytes (sem progresso mensurável);
   *  `lendo` = o backend está lendo os PDFs, um a um. */
  fase: 'enviando' | 'lendo'
  /** Arquivos já concluídos. */
  feitos: number
  total: number
  /** Nome do que está sendo lido agora (só na fase `lendo`). */
  atual?: string | null
}

export function ProgressoEnvio({ estado }: { estado: EstadoProgresso }) {
  const { fase, feitos, total, atual } = estado
  // Na fase de envio não há número honesto a mostrar: o `fetch` não reporta
  // bytes enviados. A barra fica indeterminada em vez de exibir um palpite.
  const medindo = fase === 'lendo' && total > 0
  const pct = medindo ? Math.round((feitos / total) * 100) : 0

  return (
    <div className="up-prog" role="status" aria-live="polite">
      <div className="up-prog-topo">
        <span className="up-prog-fase">
          {fase === 'enviando' ? 'Enviando arquivos…' : 'Lendo censos…'}
        </span>
        {medindo && <span className="up-prog-pct">{pct}%</span>}
      </div>
      <div
        className="up-prog-trilho"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        // Sem `aria-valuenow` na fase indeterminada: é assim que um leitor de
        // tela anuncia "em progresso" em vez de cantar um número inventado.
        {...(medindo ? { 'aria-valuenow': pct } : {})}
        aria-label={fase === 'enviando' ? 'Enviando arquivos' : 'Lendo censos'}
      >
        <div
          className={`up-prog-barra${medindo ? '' : ' indeterminada'}`}
          style={medindo ? { width: `${pct}%` } : undefined}
        />
      </div>
      <div className="up-prog-pe">
        <span className="up-prog-conta">
          {medindo
            ? <><b>{feitos}</b> de <b>{total}</b> {plural(total, 'arquivo')}</>
            : <>{total} {plural(total, 'arquivo')}</>}
        </span>
        {/* O nome do arquivo da vez: num lote grande é o que permite perceber
            QUAL deles está demorando. */}
        {atual && <span className="up-prog-arq" title={atual}>{atual}</span>}
      </div>
    </div>
  )
}
