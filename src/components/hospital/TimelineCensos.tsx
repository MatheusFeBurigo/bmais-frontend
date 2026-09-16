// Timeline de censos de um hospital: em que dias ele mandou, e quem veio.
//
// Duas leituras na mesma lista, e a ordem entre elas é deliberada:
//
//   1. COBERTURA — a coluna de datas responde "este hospital tem mandado?" de
//      relance. É a pergunta mais frequente, então ela não custa um clique: os
//      dias ficam visíveis já na abertura, e os buracos aparecem sozinhos.
//   2. CONTEÚDO — quem estava no censo daquele dia. Isso vem recolhido: um censo
//      tem dezenas de nomes, e abrir todos empurraria a lista de dias para fora
//      da tela, matando a leitura 1.
//
// O eixo é a DATA DO CENSO (o dia a que o relatório se refere), não a do upload:
// quem manda o censo de sexta na segunda cobre a sexta. A data de envio fica no
// título do arquivo, para quem precisa saber quando chegou.
import { useState } from 'react'
import type { CensoDia, TimelineHospital } from '../../types/api'
import { dataHora } from '../../lib/datas'
import { identificacaoPaciente, nomeProprio } from '../../lib/texto'
import { LoadingState } from '../ui'

export const timelineStyles = `
.tl{display:grid;gap:0}
/* Cada dia é uma linha com um trilho à esquerda: o ponto marca o dia e a linha
   liga um ao outro, que é o que faz a sequência ser lida como tempo e não como
   uma lista qualquer. */
.tl-dia{display:grid;grid-template-columns:auto 1fr;gap:10px}
.tl-trilho{position:relative;width:12px;display:flex;justify-content:center}
.tl-trilho::before{content:"";position:absolute;top:0;bottom:0;width:1px;background:var(--border)}
.tl-dia:first-child .tl-trilho::before{top:9px}
.tl-dia:last-child .tl-trilho::before{bottom:calc(100% - 9px)}
.tl-ponto{position:relative;width:7px;height:7px;border-radius:50%;background:var(--primary-3);margin-top:6px;box-shadow:0 0 0 3px var(--surface)}
/* Dia cujo envio foi desfeito: o ponto fica vazado — aconteceu, mas não vale. */
.tl-ponto.revertido{background:var(--surface);border:1.5px solid var(--muted-2)}
.tl-corpo{min-width:0;padding-bottom:12px}
.tl-cab{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;width:100%;border:0;background:none;padding:0;font-family:inherit;text-align:left;cursor:pointer}
.tl-cab:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(21,92,168,.18);border-radius:var(--r-xs)}
.tl-data{font-family:var(--font-mono);font-size:var(--t-base);font-weight:700;color:var(--ink)}
.tl-data.sem{font-family:inherit;font-weight:600;color:var(--muted)}
.tl-resumo{font-size:var(--t-sm);color:var(--muted)}
.tl-novos{color:var(--success-2);font-weight:600}
.tl-seta{margin-left:auto;display:grid;place-items:center;color:var(--muted-2);transition:transform .18s}
.tl-cab[aria-expanded="true"] .tl-seta{transform:rotate(180deg)}
/* Arquivos do dia: nome do PDF e quando chegou. Mono porque se compara entre
   linhas (é o mesmo nome repetido todo dia na maioria dos hospitais). */
.tl-arq{font-family:var(--font-mono);font-size:var(--t-xs);color:var(--muted);margin-top:2px}
.tl-arq .rev{color:var(--warning-2);font-weight:600}
.tl-pacientes{margin-top:7px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface-2);max-height:240px;overflow:auto}
.tl-pac-tabela{font-size:var(--t-sm);width:100%}
.tl-pac-tabela thead th{padding:5px 8px;background:var(--surface-3);position:sticky;top:0}
.tl-pac-tabela tbody td{padding:4px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tl-pac-nome{max-width:0;width:100%}
.tl-tag-novo{font-size:9px;text-transform:uppercase;letter-spacing:.06em;font-weight:700;color:var(--success-2);background:var(--success-bg);padding:1px 5px;border-radius:99px;margin-left:6px}
.tl-vazio{font-size:var(--t-sm);color:var(--muted);padding:8px 0}
`

const IcoSeta = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 9l6 6 6-6" />
  </svg>
)

/** ISO `AAAA-MM-DD` → `dd/mm/aaaa`. */
function dataBr(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : iso
}

function DiaDaTimeline({ dia }: { dia: CensoDia }) {
  const [aberto, setAberto] = useState(false)
  // Dia inteiro desfeito: todos os arquivos revertidos. Um dia com dois arquivos
  // em que só um foi desfeito continua valendo — o outro cobriu o dia.
  const tudoRevertido = dia.arquivos.every((a) => a.revertido_em)

  return (
    <div className="tl-dia">
      <div className="tl-trilho">
        <span className={`tl-ponto${tudoRevertido ? ' revertido' : ''}`} />
      </div>
      <div className="tl-corpo">
        <button
          type="button"
          className="tl-cab"
          aria-expanded={aberto}
          onClick={() => setAberto((v) => !v)}
        >
          <span className={`tl-data${dia.data ? '' : ' sem'}`}>
            {dia.data ? dataBr(dia.data) : 'Sem data no relatório'}
          </span>
          <span className="tl-resumo">
            {dia.total_pacientes} {dia.total_pacientes === 1 ? 'paciente' : 'pacientes'}
            {dia.novos > 0 && <> · <span className="tl-novos">{dia.novos} {dia.novos === 1 ? 'novo' : 'novos'}</span></>}
            {dia.arquivos.length > 1 && <> · {dia.arquivos.length} arquivos</>}
          </span>
          <span className="tl-seta">{IcoSeta}</span>
        </button>

        {dia.arquivos.map((a) => (
          <div className="tl-arq" key={a.censo_id}>
            {a.arquivo || '—'}
            {a.processado_em && <> · enviado {dataHora(a.processado_em)}</>}
            {a.revertido_em && <span className="rev"> · envio desfeito</span>}
          </div>
        ))}

        {aberto && (
          dia.pacientes.length > 0 ? (
            <div className="tl-pacientes">
              <table className="bmais-table tl-pac-tabela">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Atendimento</th>
                    <th>Leito</th>
                    <th>Convênio</th>
                  </tr>
                </thead>
                <tbody>
                  {dia.pacientes.map((p) => (
                    <tr key={p.id}>
                      <td className="tl-pac-nome" title={p.nome ?? undefined}>
                        {/* `identificacaoPaciente` cobre o censo sem coluna de
                            nome, em que a internação se identifica pela senha. */}
                        {p.nome ? nomeProprio(p.nome) : identificacaoPaciente(p)}
                        {p.origem === 'novo' && <span className="tl-tag-novo">novo</span>}
                      </td>
                      <td className="mono">{p.atendimento || '—'}</td>
                      <td>{p.leito_codigo || '—'}</td>
                      <td title={p.convenio ?? undefined}>{p.convenio || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="tl-vazio">
              Este envio não registrou os pacientes individualmente (censo anterior a
              este histórico).
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default function TimelineCensos({ data, isLoading, isError }: {
  data?: TimelineHospital
  isLoading: boolean
  isError: boolean
}) {
  if (isLoading) return <LoadingState label="Carregando histórico…" />
  if (isError) {
    return (
      <div style={{ fontSize: 'var(--t-sm)', color: 'var(--danger)' }}>
        Não foi possível carregar o histórico de censos.
      </div>
    )
  }
  if (!data || !data.dias.length) {
    return (
      <div className="tl-vazio">
        Nenhum censo recebido deste hospital ainda.
      </div>
    )
  }
  return (
    <>
      <style>{timelineStyles}</style>
      <div className="tl">
        {data.dias.map((dia) => (
          <DiaDaTimeline key={dia.data ?? 'sem-data'} dia={dia} />
        ))}
      </div>
    </>
  )
}
