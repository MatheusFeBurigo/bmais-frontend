// O que está acontecendo com o lote, enquanto acontece.
//
// Ler um censo é lento: um PDF de 600 linhas leva segundos, e um lote de dez
// arquivos passa de um minuto. Sem um sinal de avanço não há como distinguir
// "está trabalhando" de "travou" — a dúvida que faz o usuário recarregar a
// página no meio do processamento e perder o envio.
//
// O andamento acontece DENTRO DA CAIXA DE ARRASTAR, no lugar exato onde os
// arquivos foram soltos. A caixa não sai da tela nem é substituída por outro
// bloco: ela troca o conteúdo e continua ali, com a mesma borda e a mesma
// posição. É a diferença entre "o lugar onde eu soltei os arquivos está
// trabalhando neles" e "apareceu um painel em outro canto da página".
//
// Por isso este arquivo exporta CONTEÚDO, não um cartão: quem desenha a moldura
// é a própria DropZone (ver FormularioEnvio.tsx), que passa a ter dois estados.
//
// A cor é a da OPERADORA do envio (ver lib/coresOperadora.ts): o anel, a barra e
// o realce do arquivo da vez. A cor nunca é o único sinal — a fase e a contagem
// estão escritas ao lado dela.
//
// A porcentagem é REAL, medida em duas frentes: os bytes que de fato subiram
// (XMLHttpRequest, o único que reporta isso) e os arquivos que de fato foram
// lidos pelo backend. A barra NUNCA anda por cronômetro: uma barra por tempo
// trava em 90% quando o arquivo é grande e corre até o fim quando é pequeno, que
// é exatamente a confiança que este componente existe para dar.
//
// O tempo aparece em outro papel: um cronômetro do arquivo da vez e, quando a
// espera passa dos segundos esperados, um recado que RECONHECE a demora (ver
// useDemora.ts). A barra responde "quanto falta"; o recado responde "isto é
// normal?" — a pergunta que faz alguém recarregar a página no meio do envio.

import { useEffect, useRef } from 'react'
import { formatarEspera, recadoDaDemora, useSegundosNoPasso } from './useDemora'
import { plural } from './comuns'

export const progressoStyles = `
/* ── Andamento dentro da caixa de arrastar ──────────────────────────────────── */
/* Sem fundo, sem borda e sem padding próprios: a moldura é a da DropZone, que
   continua sendo a mesma caixa. Qualquer cartão aqui desenharia uma segunda
   borda dentro da primeira. */
.up-run{display:grid;gap:13px;text-align:left}

.up-run-topo{display:flex;align-items:center;gap:14px}
/* Anel girando na cor da operadora: o sinal de "vivo" que não depende do
   número. Quando a fração fica parada (um PDF grande sendo lido), o anel
   continua girando e diz que o processo não morreu. */
.up-run-anel{flex-shrink:0;width:34px;height:34px;border-radius:50%;border:2.5px solid var(--op-fundo,var(--primary-soft));border-top-color:var(--op-cor,var(--primary-3));animation:up-gira .8s linear infinite}
@keyframes up-gira{to{transform:rotate(360deg)}}
.up-run-txt{flex:1;min-width:0}
.up-run-fase{font-size:var(--t-md);font-weight:600;color:var(--ink);letter-spacing:-.015em}
.up-run-sub{margin-top:2px;font-size:var(--t-sm);color:var(--muted)}
/* A porcentagem grande, à direita: é o número que se olha de relance. Em mono e
   tabular-nums porque em fonte proporcional ele muda de largura a cada dígito,
   e um número que treme chama mais atenção que o próprio avanço. */
.up-run-pct{flex-shrink:0;font-family:var(--font-mono);font-size:var(--t-2xl);font-weight:700;color:var(--op-ink,var(--primary-3));font-variant-numeric:tabular-nums;line-height:1;letter-spacing:-.03em}

.up-run-trilho{height:6px;border-radius:99px;background:var(--surface);overflow:hidden;box-shadow:inset 0 0 0 1px var(--border)}
/* A transição suaviza o degrau entre um arquivo e o seguinte sem fingir
   progresso: ela dura menos que o menor passo real. */
.up-run-barra{height:100%;border-radius:99px;background:var(--op-cor,var(--primary-3));transition:width .3s cubic-bezier(.2,.7,.2,1)}
.up-run-conta{display:flex;justify-content:space-between;gap:12px;font-size:var(--t-sm);color:var(--muted);margin-top:-5px}
.up-run-conta b{font-family:var(--font-mono);color:var(--ink-2);font-variant-numeric:tabular-nums}
/* Cronômetro do arquivo da vez, ao lado do nome dele na fila. É o sinal mais
   barato de que a tela está VIVA: ele anda de segundo em segundo mesmo quando a
   barra fica parada esperando um PDF grande terminar. */
.up-fila-tempo{flex-shrink:0;font-family:var(--font-mono);font-size:var(--t-xs);color:var(--op-ink,var(--primary-3));font-variant-numeric:tabular-nums;opacity:.75}

/* Recado sobre a demora. Nasce só depois de alguns segundos: aparecer sempre o
   transformaria em enfeite e ninguém o leria quando importasse. */
.up-run-recado{display:flex;align-items:flex-start;gap:7px;font-size:var(--t-sm);line-height:1.45;border-radius:var(--r-sm);padding:8px 10px;animation:up-recado-entra .3s ease}
.up-run-recado.nota{background:var(--surface);color:var(--ink-3)}
.up-run-recado.atencao{background:var(--warning-bg);color:var(--warning-2)}
.up-run-recado svg{flex-shrink:0;margin-top:1px}
@keyframes up-recado-entra{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}

/* ── Fila de arquivos ───────────────────────────────────────────────────────── */
/* Teto de altura: um lote de 40 arquivos não pode esticar a caixa até empurrar
   o botão de enviar para fora da vista. A linha da vez é trazida ao campo
   visível por scrollIntoView. */
.up-fila{border-top:1px solid var(--border);padding-top:9px;max-height:188px;overflow-y:auto}
.up-fila-item{display:flex;align-items:center;gap:9px;padding:6px 9px;border-radius:var(--r-sm)}
.up-fila-nome{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--t-sm);color:var(--ink-2)}
/* O que ainda não começou fica apagado: a lista inteira em peso igual não deixa
   ver onde está a frente de trabalho. */
.up-fila-item.fila .up-fila-nome{color:var(--muted-2)}
.up-fila-item.lendo{background:var(--surface)}
.up-fila-item.lendo .up-fila-nome{color:var(--op-ink,var(--primary-3));font-weight:600}
.up-fila-marca{flex-shrink:0;width:15px;height:15px;display:grid;place-items:center}
.up-fila-marca.lido{color:var(--success)}
.up-fila-marca.lendo{color:var(--op-cor,var(--primary-3))}
/* Círculo vazio = ainda não chegou a vez. */
.up-fila-espera{width:9px;height:9px;border-radius:50%;border:1.5px solid var(--muted-3)}
.up-fila-ponto{width:8px;height:8px;border-radius:50%;background:currentColor;animation:up-pulsa 1s ease-in-out infinite}
@keyframes up-pulsa{0%,100%{opacity:1}50%{opacity:.3}}
.up-fila-tag{flex-shrink:0;font-size:var(--t-xs);font-weight:700;color:var(--op-ink,var(--primary-3));text-transform:uppercase;letter-spacing:.06em}

@media (prefers-reduced-motion:reduce){
  .up-run-barra{transition:none}
  .up-run-anel,.up-fila-ponto,.up-run-recado{animation:none}
}
`

export interface EstadoProgresso {
  /** `enviando` = subindo os bytes; `lendo` = o backend lê os PDFs, um a um. */
  fase: 'enviando' | 'lendo'
  /** Arquivos já lidos. */
  feitos: number
  total: number
  /** Progresso real do lote, de 0 a 1 (bytes enviados + arquivos lidos). */
  fracao: number
  /** Nome do que está sendo lido agora (só na fase `lendo`). */
  atual?: string | null
}

const IcoOk = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const IcoInfo = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.5h.01" />
  </svg>
)

/** Em que pé está cada arquivo do lote. */
function estadoDoArquivo(indice: number, p: EstadoProgresso): 'fila' | 'lendo' | 'lido' {
  // Durante o envio dos bytes nenhum arquivo foi lido ainda: todos na fila.
  if (p.fase === 'enviando') return 'fila'
  if (indice < p.feitos) return 'lido'
  if (indice === p.feitos) return 'lendo'
  return 'fila'
}

/** Andamento do lote. Desenha só o CONTEÚDO — a moldura é a da caixa de
 *  arrastar, que é onde isto é renderizado. */
export function ProgressoEnvio({ estado, arquivos }: {
  estado: EstadoProgresso
  /** Nomes na ordem em que serão lidos, para a fila. */
  arquivos: string[]
}) {
  const { fase, feitos, total, fracao } = estado
  const pct = Math.max(0, Math.min(100, Math.round(fracao * 100)))

  // Tempo do passo ATUAL, não do lote: o relógio zera a cada arquivo concluído.
  // É o que permite dizer "este arquivo está demorando" em vez de "o envio está
  // demorando", que num lote de dez seria verdade e inútil ao mesmo tempo.
  const segundos = useSegundosNoPasso(`${fase}:${feitos}`, true)
  const recado = recadoDaDemora(segundos)

  // A fila tem teto de altura: num lote grande o arquivo da vez sairia do campo
  // visível e a caixa mostraria uma lista parada enquanto o trabalho anda.
  const lendoRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    lendoRef.current?.scrollIntoView({ block: 'nearest' })
  }, [feitos])

  return (
    <div className="up-run" role="status" aria-live="polite">
      <div className="up-run-topo">
        <div className="up-run-anel" aria-hidden />
        <div className="up-run-txt">
          <div className="up-run-fase">
            {fase === 'enviando' ? 'Enviando os arquivos' : 'Lendo os censos'}
          </div>
          <div className="up-run-sub">
            {fase === 'enviando'
              ? <>Mandando {total} {plural(total, 'arquivo')} para o servidor.</>
              : 'Cada arquivo é lido e gravado, um por vez.'}
          </div>
        </div>
        <div className="up-run-pct">{pct}%</div>
      </div>

      <div
        className="up-run-trilho"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={fase === 'enviando' ? 'Enviando arquivos' : 'Lendo censos'}
      >
        <div className="up-run-barra" style={{ width: `${pct}%` }} />
      </div>
      <div className="up-run-conta">
        <span>
          {fase === 'enviando'
            ? 'Preparando o envio'
            : <><b>{feitos}</b> de <b>{total}</b> {plural(total, 'arquivo')} {plural(feitos, 'lido')}</>}
        </span>
        {fase === 'lendo' && feitos < total && <span>Faltam {total - feitos}</span>}
      </div>

      {/* O recado da demora. `aria-live` fica no contêiner de cima (a região
          inteira é polite), então ele é anunciado quando aparece sem precisar de
          região própria. */}
      {recado && (
        <div className={`up-run-recado ${recado.nivel}`}>
          {IcoInfo}
          <span>{recado.texto}</span>
        </div>
      )}

      {/* A fila: uma linha por arquivo, na ordem em que serão lidos. É o que
          permite perceber QUAL arquivo está segurando o lote. */}
      <div className="up-fila">
        {arquivos.map((nome, i) => {
          const est = estadoDoArquivo(i, estado)
          return (
            <div
              className={`up-fila-item ${est}`}
              key={`${nome}-${i}`}
              ref={est === 'lendo' ? lendoRef : undefined}
            >
              <span className={`up-fila-marca ${est}`}>
                {est === 'lido' ? IcoOk
                  : est === 'lendo' ? <i className="up-fila-ponto" />
                  : <i className="up-fila-espera" />}
              </span>
              <span className="up-fila-nome mono" title={nome}>{nome}</span>
              {/* O cronômetro só na linha da vez, e só depois de 3s: num arquivo
                  rápido ele piscaria "1s" e sumiria, virando tremor visual. */}
              {est === 'lendo' && segundos >= 3 && (
                <span className="up-fila-tempo">{formatarEspera(segundos)}</span>
              )}
              {est === 'lendo' && <span className="up-fila-tag">Lendo</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
