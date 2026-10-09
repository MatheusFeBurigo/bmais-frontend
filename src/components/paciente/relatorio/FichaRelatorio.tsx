// Ficha do relatório (08/10/2026): o que foi preenchido, só para ler. Abre ao
// clicar num relatório na timeline (ou no card Relatórios da ficha). Segue as
// seções da modal "Registrar relatório", na mesma ordem (Visita, Quadro de
// internação, Quadro clínico, No período, Prorrogação), mas só mostra o que
// tem conteúdo, em listas e tabelas simples.
//
// Os dados vêm da lista de relatórios da internação (o mesmo cache do card
// Relatórios). O evento novo traz o id do relatório; o antigo, sem id, é achado
// pela data da visita e pelo autor.
import type { ReactNode } from 'react'
import { useInternacaoRelatorios } from '../../../hooks/useInternacao'
import { dataBR, dataHora, diasNoPeriodo } from '../../../lib/datas'
import { CARATER, TIPOS_ALTO_CUSTO, TIPOS_INTERNACAO, rotulo } from '../../../lib/relatorioDetalhes'
import type { RelatorioItem } from '../../../types/api'
import { AutorChip } from '../../StatusBadge'
import { LoadingState, Modal } from '../../ui'

/** Qual relatório abrir: pelo id, ou (evento antigo) pela data e pelo autor. */
export interface AlvoRelatorio {
  relatorio_id?: number | null
  data?: string | null
  autor?: string | null
}

const ACEITES: Record<string, string> = { sim: 'Sim, carimbado', nao: 'Não', aguardando: 'Aguardando' }

const estilos = `
.fx-topo{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:var(--t-sm);color:var(--muted)}
.fx-sec{margin-top:20px}
/* Título da seção acima dos rótulos (10,5px, caixa alta), como na modal. */
.fx-sec-tit{display:flex;align-items:center;gap:10px;margin:0 0 12px;font-size:var(--t-lg);font-weight:600;letter-spacing:-.01em;color:var(--ink)}
.fx-sec-tit::after{content:"";flex:1;height:1px;background:var(--border)}
.fx-dl{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px 16px}
.fx-dl dt{font-size:var(--t-xs);font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3)}
.fx-dl dd{margin:2px 0 0;font-size:var(--t-sm);color:var(--ink);overflow-wrap:anywhere}
.fx-dl .fx-largo{grid-column:1/-1}
.fx-sub{font-size:var(--t-sm);font-weight:600;color:var(--ink);margin:12px 0 6px}
.fx-tab{width:100%;border-collapse:collapse;font-size:var(--t-sm);border:1px solid var(--border);border-radius:8px;overflow:hidden}
.fx-tab th{text-align:left;font-size:var(--t-xs);font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-3);background:var(--surface-2);padding:7px 10px}
.fx-tab td{padding:7px 10px;border-top:1px solid var(--border);color:var(--ink-2);vertical-align:top}
.fx-texto{font-size:var(--t-sm);color:var(--ink-2);white-space:pre-wrap;overflow-wrap:anywhere;padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2)}
.fx-cid{font-family:var(--font-mono);font-weight:700;color:var(--primary);margin-right:6px}
.fx-vazio{font-size:var(--t-sm);color:var(--muted)}
`

function acharRelatorio(lista: RelatorioItem[], alvo: AlvoRelatorio): RelatorioItem | undefined {
  if (alvo.relatorio_id) return lista.find((r) => r.id === alvo.relatorio_id)
  const dia = (alvo.data ?? '').slice(0, 10)
  const doDia = lista.filter((r) => (r.data_visita ?? '').slice(0, 10) === dia)
  return doDia.find((r) => r.autor === alvo.autor) ?? doDia[0]
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="fx-sec">
      <div className="fx-sec-tit">{titulo}</div>
      {children}
    </section>
  )
}

/** Pares rótulo/valor; os vazios não aparecem. */
function Dados({ itens }: { itens: [string, ReactNode, boolean?][] }) {
  const cheios = itens.filter(([, v]) => v !== null && v !== undefined && v !== '')
  if (!cheios.length) return null
  return (
    <dl className="fx-dl">
      {cheios.map(([rot, v, largo]) => (
        <div key={rot} className={largo ? 'fx-largo' : undefined}><dt>{rot}</dt><dd>{v}</dd></div>
      ))}
    </dl>
  )
}

function Tabela({ titulo, colunas, linhas }: { titulo?: string; colunas: string[]; linhas: ReactNode[][] }) {
  if (!linhas.length) return null
  return (
    <>
      {titulo && <div className="fx-sub">{titulo}</div>}
      <table className="fx-tab">
        <thead><tr>{colunas.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>
          {linhas.map((l, i) => <tr key={i}>{l.map((c, j) => <td key={j}>{c}</td>)}</tr>)}
        </tbody>
      </table>
    </>
  )
}

const d = (iso?: string | null) => dataBR(iso) || '—'

function Conteudo({ r }: { r: RelatorioItem }) {
  const det = r.detalhes ?? {}
  const prr = r.prorrogacao
  const fr = r.folha_rosa
  const principal = det.cid_principal ? r.cids?.find((c) => c.codigo === det.cid_principal) : undefined
  const secundarios = (r.cids ?? []).filter((c) => c.codigo !== principal?.codigo)
  const cid = (c: { codigo: string; descricao?: string | null }) => (
    <span key={c.codigo} style={{ display: 'block' }}><span className="fx-cid">{c.codigo}</span>{c.descricao}</span>
  )
  const temInternacao = det.carater || det.tipo_internacao || det.acomodacoes?.length
  const temPeriodo = det.procedimentos?.length || det.alto_custo?.length || det.evento_adverso
  const temNegociacao = fr || det.glosas?.length || det.medicacoes_negadas?.length
    || det.procedimentos_negados?.length || det.trocas_procedimento?.length

  return (
    <>
      <Secao titulo="Relatório de visita">
        <Dados itens={[
          ['Data da visita', d(r.data_visita)],
          ['Médico ou enfermeiro', [r.medico, det.enfermeiro].filter(Boolean).join(' · ')],
        ]} />
        {det.analise && (
          <>
            <div className="fx-sub">O que foi analisado</div>
            <div className="fx-texto">{det.analise}</div>
          </>
        )}
      </Secao>

      {temInternacao && (
        <Secao titulo="Quadro de internação">
          <Dados itens={[
            ['Caráter', rotulo(CARATER, det.carater)],
            ['Tipo de internação', rotulo(TIPOS_INTERNACAO, det.tipo_internacao)],
          ]} />
          <Tabela titulo="Acomodações utilizadas" colunas={['Acomodação', 'Entrada', 'Saída']}
                  linhas={(det.acomodacoes ?? []).map((a) => [
                    a.acomodacao, d(a.data_entrada), a.data_saida ? d(a.data_saida) : 'Atual',
                  ])} />
        </Secao>
      )}

      <Secao titulo="Quadro clínico">
        <Dados itens={[
          ['Diagnóstico principal', principal ? cid(principal) : ''],
          [principal ? 'Diagnóstico secundário' : 'Diagnósticos', secundarios.length ? secundarios.map(cid) : '', true],
        ]} />
        <div className="fx-sub">Relatório</div>
        {r.descricao ? <div className="fx-texto">{r.descricao}</div> : <div className="fx-vazio">Sem texto.</div>}
      </Secao>

      {temPeriodo && (
        <Secao titulo="No período">
          <Tabela titulo="Procedimentos realizados" colunas={['Procedimento', 'Quantidade', 'Data']}
                  linhas={(det.procedimentos ?? []).map((p) => [
                    <><span className="fx-cid">{p.codigo}</span>{p.nome}</>, p.qtde, d(p.data),
                  ])} />
          <Tabela titulo="Medicação de alto custo" colunas={['Tipo', 'Medicação', 'Dose por dia', 'Início', 'Fim']}
                  linhas={(det.alto_custo ?? []).map((a) => [
                    rotulo(TIPOS_ALTO_CUSTO, a.tipo), a.medicacao || '—', a.dose || '—', d(a.data_inicio), d(a.data_fim),
                  ])} />
          {det.evento_adverso && (
            <>
              <div className="fx-sub">Evento adverso</div>
              <Dados itens={[
                ['Data', d(det.evento_adverso.data)],
                ['O que aconteceu', det.evento_adverso.descricao, true],
              ]} />
            </>
          )}
        </Secao>
      )}

      {prr && (
        <Secao titulo="Prorrogação">
          <Tabela colunas={['Acomodação', 'Início', 'Fim', 'Dias']} linhas={prr.periodos.map((p) => [
            p.acomodacao, d(p.data_inicio), d(p.data_fim), diasNoPeriodo(p.data_inicio, p.data_fim),
          ])} />
          <div style={{ marginTop: 10 }}>
            <Dados itens={[
              ['Justificativa', prr.justificativa_desc, true],
              ['Complemento', prr.complemento, true],
              ['Situação', prr.pausada ? 'Pausada' : ''],
            ]} />
          </div>
        </Secao>
      )}

      {temNegociacao && (
        <Secao titulo="Negociação com o hospital">
          {fr && (
            <>
              <div className="fx-sub">Folha rosa</div>
              <Dados itens={[
                ['De', fr.de],
                ['Para', fr.para],
                ['Diárias negociadas', fr.diarias],
                ['Aceite do hospital', ACEITES[fr.aceite] ?? fr.aceite],
                ['Início', fr.data_inicio ? d(fr.data_inicio) : ''],
                ['Fim', fr.data_fim ? d(fr.data_fim) : ''],
                ['Observação', fr.obs, true],
              ]} />
            </>
          )}
          <Tabela titulo="Glosa de diárias" colunas={['Acomodação', 'Diárias', 'Início', 'Fim']}
                  linhas={(det.glosas ?? []).map((g) => [g.acomodacao, g.diarias, d(g.data_inicio), d(g.data_fim)])} />
          <Tabela titulo="Medicação negada" colunas={['Medicação', 'Quantidade', 'Unidade', 'Início', 'Fim']}
                  linhas={(det.medicacoes_negadas ?? []).map((m) => [
                    m.nome, m.qtde ?? '—', m.unidade || '—', d(m.data_inicio), d(m.data_fim),
                  ])} />
          <Tabela titulo="Procedimento negado" colunas={['Procedimento', 'Quantidade', 'Data']}
                  linhas={(det.procedimentos_negados ?? []).map((p) => [
                    <><span className="fx-cid">{p.codigo}</span>{p.nome}</>, p.qtde, d(p.data),
                  ])} />
          <Tabela titulo="Troca de procedimento" colunas={['De', 'Para', 'Data']}
                  linhas={(det.trocas_procedimento ?? []).map((t) => [
                    <><span className="fx-cid">{t.codigo_de}</span>{t.nome_de}</>,
                    <><span className="fx-cid">{t.codigo_para}</span>{t.nome_para}</>,
                    d(t.data),
                  ])} />
        </Secao>
      )}
    </>
  )
}

export function FichaRelatorio({ internacaoId, alvo, onFechar, sobreposta }: {
  internacaoId: number
  alvo: AlvoRelatorio
  onFechar: () => void
  /** Aberta sobre o painel lateral: sobe o z-index. */
  sobreposta?: boolean
}) {
  const relatorios = useInternacaoRelatorios(internacaoId)
  const r = relatorios.data ? acharRelatorio(relatorios.data.relatorios, alvo) : undefined
  const titulo = r?.data_visita ? `Relatório de ${dataBR(r.data_visita)}` : 'Relatório'
  return (
    <Modal title={titulo} onClose={onFechar} largura={780} sobreposta={sobreposta}
           footer={<button className="btn btn-outline" onClick={onFechar}>Fechar</button>}>
      <style>{estilos}</style>
      {relatorios.isLoading && <LoadingState label="Carregando relatório…" size={22} />}
      {relatorios.isError && <div className="fx-vazio">Não foi possível carregar o relatório. Tente de novo.</div>}
      {relatorios.data && !r && <div className="fx-vazio">Este relatório não foi encontrado.</div>}
      {r && (
        <>
          <div className="fx-topo">
            {r.autor && <AutorChip role={r.autor_role} autor={r.autor} />}
            {r.criado_em && <span>Registrado em {dataHora(r.criado_em)}</span>}
            {r.aprovacao === 'pendente' && <span className="badge info">Aguardando aprovação</span>}
            {r.aprovacao === 'devolvido' && <span className="badge danger">Devolvido</span>}
          </div>
          {r.aprovacao === 'devolvido' && r.devolucao_motivo && (
            <div className="fx-vazio" style={{ color: 'var(--danger)', marginTop: 6 }}>Motivo: {r.devolucao_motivo}</div>
          )}
          <Conteudo r={r} />
        </>
      )}
    </Modal>
  )
}
