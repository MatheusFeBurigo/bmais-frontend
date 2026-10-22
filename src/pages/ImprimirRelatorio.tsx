// Folha para imprimir ou salvar em PDF (21/10/2026: "na visão da internação, é
// preciso termos a opção de imprimir o relatório individual, ou gerar um
// documento em PDF"). Duas entradas:
//
//   - `/paciente/:id/imprimir`: o botão "Imprimir / PDF" do topo da ficha do
//     paciente (22/10/2026: a ficha do relatório só existe com relatório, e o
//     botão tem de estar na visão da internação). Sai a internação: os dados do
//     paciente e todos os relatórios, ou só um, escolhido na barra;
//   - `/paciente/:id/relatorio/:relatorioId`: o "Imprimir ou PDF" da ficha de um
//     relatório, já com ele escolhido.
//
// Cada relatório sai com as mesmas seções da ficha (`ConteudoRelatorio`), numa
// folha A4 retrato com a identificação do paciente no topo. Na impressão sai só
// a folha, como no Formulário Porto. Nada aqui é editável.
//
// Identidade visual da BMais (22/10/2026: "quero que tenha a identificação da
// BMais, só não precisa deixar tudo azul"): o topo leva a marca "B+" e o nome do
// sistema sobre o branco, com um fio no azul-marinho da marca; o rodapé repete a
// marca pequena. O resto da folha fica neutro, e nas margens da página só a
// numeração.
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { usePageHeader } from '../components/PageHeader'
import { ConteudoRelatorio } from '../components/paciente/relatorio/FichaRelatorio'
import { LoadingState } from '../components/ui'
import { useInternacaoDados, useInternacaoRelatorios } from '../hooks/useInternacao'
import { dataBR, dataHora } from '../lib/datas'
import { identificacaoPaciente } from '../lib/texto'
import type { InternacaoDados, RelatorioItem } from '../types/api'

// Na impressão sai só a folha: sem menu, sem topo, sem a barra de escolha. Fica
// num <style> da página (e não no CSS da ficha) porque o @page vale para o
// documento inteiro e só deve existir enquanto esta tela está aberta.
const estilosPagina = `
.ir-barra{display:flex;align-items:flex-end;gap:12px 16px;flex-wrap:wrap;max-width:794px;margin:0 auto 14px}
.ir-barra label{flex:0 1 420px;min-width:240px;display:grid;gap:4px}
.ir-papel{padding:2px 2px 16px}
.ir-folha{max-width:794px;margin:0 auto;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);box-shadow:var(--shadow-sm)}
.ir-corpo{padding:28px 40px 28px}
/* Topo da marca: "B+" e o nome sobre o branco; a cor da marca fica no selo e no fio. */
.ir-marca{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-bottom:14px;margin-bottom:22px;border-bottom:2px solid #062E5C}
.ir-marca-id{display:flex;align-items:center;gap:10px}
.ir-marca-b{width:34px;height:34px;border-radius:8px;display:grid;place-items:center;background:#062E5C;color:#fff;font-weight:700;font-size:15px;letter-spacing:-.02em;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.ir-marca-nome{font-size:17px;font-weight:700;letter-spacing:-.01em;line-height:1.1;color:#062E5C}
.ir-marca-sub{font-size:9.5px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin-top:2px}
.ir-marca-doc{text-align:right}
.ir-marca-tipo{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--ink-2)}
.ir-marca-emissao{font-size:var(--t-xs);color:var(--muted);margin-top:3px}
.ir-cab{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding-bottom:14px;border-bottom:1px solid var(--border)}
.ir-titulo{font-size:var(--t-xl);font-weight:700;letter-spacing:-.01em;color:var(--ink)}
.ir-data{font-size:var(--t-base);color:var(--ink-2);margin-top:2px}
.ir-situacao{font-size:var(--t-sm);font-weight:600;color:var(--ink-2);text-align:right;white-space:nowrap}
.ir-paciente{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px 16px;margin:16px 0 0}
.ir-paciente dt{font-size:var(--t-xs);font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3)}
.ir-paciente dd{margin:2px 0 0;font-size:var(--t-sm);color:var(--ink);overflow-wrap:anywhere}
.ir-paciente .ir-largo{grid-column:span 2}
.ir-meta{margin-top:12px;font-size:var(--t-sm);color:var(--muted)}
.ir-rel{margin-top:28px}
.ir-rel-cab{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:8px 12px;border-radius:8px;background:var(--surface-2);border:1px solid var(--border);break-after:avoid}
.ir-rel-tit{font-size:var(--t-lg);font-weight:700;color:var(--ink)}
.ir-vazio{margin-top:24px;font-size:var(--t-base);color:var(--muted)}
/* Rodapé com a marca, num só tom do azul-marinho da BMais. */
.ir-rodape{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:0 40px;padding:12px 0 20px;border-top:1px solid var(--border);font-size:var(--t-xs);color:var(--muted)}
.ir-rodape-marca{display:flex;align-items:center;gap:8px;font-weight:600;color:#062E5C}
.ir-rodape-b{width:18px;height:18px;border-radius:5px;display:grid;place-items:center;background:#062E5C;color:#fff;font-weight:700;font-size:9px;letter-spacing:-.02em;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@media (max-width:640px){
  .ir-corpo{padding:20px 16px}
  .ir-rodape{margin:0 16px}
  .ir-marca{flex-direction:column;align-items:flex-start}
  .ir-marca-doc{text-align:left}
  .ir-cab{flex-direction:column}
  .ir-situacao{text-align:left}
  .ir-paciente .ir-largo{grid-column:1/-1}
}
/* Número da página na margem, nos navegadores que desenham as caixas de
   margem (Chrome 131+); a marca fica no rodapé da folha. */
@page{size:A4 portrait;margin:12mm 12mm 14mm;
  @bottom-right{content:"Página " counter(page) " de " counter(pages);font-size:8pt;color:#5F7384}}
@media print{
  html,body,#root,.app,.main{background:#fff!important;min-height:0!important;height:auto!important}
  .app{display:block!important}
  .sidebar,.topbar,.ir-barra{display:none!important}
  .scope{padding:0!important;max-width:none!important}
  .ir-papel{padding:0}
  .ir-folha{max-width:none;margin:0;border:0;border-radius:0;box-shadow:none}
  .ir-corpo{padding:0 0 20px}
  .ir-rodape{margin:0;padding-bottom:0}
}
`

const IconVoltar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
)

const IconImprimir = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></svg>
)

/** Situação do relatório no papel: quem lê a folha impressa não vê a tela. */
function situacao(r: RelatorioItem): string {
  if (r.aprovacao === 'pendente') return 'Aguardando aprovação'
  return r.aprovacao_em ? `Aprovado em ${dataHora(r.aprovacao_em)}` : ''
}

/** Como o relatório aparece na escolha e no cabeçalho dele na folha. */
function rotuloRelatorio(r: RelatorioItem): string {
  const quando = dataBR(r.data_visita) || dataHora(r.criado_em) || `nº ${r.id}`
  const quem = r.medico || r.autor_nome
  return `Relatório de ${quando}${quem ? ` · ${quem}` : ''}`
}

function registradoPor(r: RelatorioItem): string {
  const quem = r.autor_nome || r.medico
  if (!quem && !r.criado_em) return ''
  return `Registrado${quem ? ` por ${quem}` : ''}${r.criado_em ? ` em ${dataHora(r.criado_em)}` : ''}`
}

/** Identificação do paciente; os campos vazios não aparecem. */
function Paciente({ d }: { d: InternacaoDados }) {
  const itens: [string, string | null | undefined, boolean?][] = [
    ['Paciente', identificacaoPaciente(d), true],
    ['Atendimento', d.atendimento],
    ['Senha', d.senha],
    ['Carteirinha', d.carteirinha],
    ['Hospital', d.hospital_nome, true],
    ['Convênio', d.convenio],
    ['Internação', dataBR(d.data_entrada)],
    ['Alta', dataBR(d.data_alta)],
    ['Acomodação', d.tipo_leito],
    ['Médico', d.medico, true],
    ['Diagnóstico', d.diagnostico, true],
  ]
  return (
    <dl className="ir-paciente">
      {itens.filter(([, v]) => v).map(([rot, v, largo]) => (
        <div key={rot} className={largo ? 'ir-largo' : undefined}><dt>{rot}</dt><dd>{v}</dd></div>
      ))}
    </dl>
  )
}

export default function ImprimirRelatorio() {
  const { id, relatorioId } = useParams<{ id: string; relatorioId?: string }>()
  const internacaoId = Number(id)
  const navigate = useNavigate()
  const location = useLocation()
  const idInvalido = !id || Number.isNaN(internacaoId)
    || (relatorioId !== undefined && Number.isNaN(Number(relatorioId)))

  const { data: d, isLoading, isError } = useInternacaoDados(internacaoId)
  const relatorios = useInternacaoRelatorios(internacaoId)
  const lista = useMemo(() => relatorios.data?.relatorios ?? [], [relatorios.data])
  // 0 = todos os relatórios da internação; senão, o id do escolhido.
  const [escolha, setEscolha] = useState(relatorioId ? Number(relatorioId) : 0)
  const umSo = escolha ? lista.find((r) => r.id === escolha) : undefined
  const imprimir = escolha ? (umSo ? [umSo] : []) : lista
  const pronto = Boolean(d) && !relatorios.isLoading && !(escolha && !umSo)

  // Nome sugerido do PDF: o navegador usa o título da página.
  useEffect(() => {
    if (!d) return
    const quando = umSo ? (dataBR(umSo.data_visita).replaceAll('/', '-') || String(umSo.id)) : ''
    const titulo = umSo
      ? `Relatório ${quando} - ${identificacaoPaciente(d)}`
      : `Relatórios da internação - ${identificacaoPaciente(d)}`
    let anterior = document.title
    const antes = () => { anterior = document.title; document.title = titulo }
    const depois = () => { document.title = anterior }
    window.addEventListener('beforeprint', antes)
    window.addEventListener('afterprint', depois)
    return () => {
      window.removeEventListener('beforeprint', antes)
      window.removeEventListener('afterprint', depois)
    }
  }, [d, umSo])

  usePageHeader(useMemo(() => ({
    title: 'Imprimir relatório',
    subtitle: d
      ? <>{identificacaoPaciente(d)}{d.hospital_nome ? ` · ${d.hospital_nome}` : ''}</>
      : 'Imprimir ou salvar em PDF',
    actions: (
      <div style={{ display: 'flex', gap: 8 }}>
        {/* Quem chega por link direto não tem para onde voltar: vai para a ficha. */}
        <button className="btn btn-outline btn-sm"
                onClick={() => (location.key === 'default' ? navigate(`/paciente/${internacaoId}`) : navigate(-1))}>
          <IconVoltar />
          Voltar
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()} disabled={!pronto}>
          <IconImprimir />
          Imprimir ou salvar em PDF
        </button>
      </div>
    ),
  }), [d, pronto, internacaoId, location.key, navigate]))

  if (idInvalido) return <div className="empty-state">Endereço inválido.</div>
  if (isLoading || relatorios.isLoading) return <LoadingState />
  if (isError || !d) return <div className="empty-state">Não foi possível carregar os dados do paciente.</div>
  if (relatorios.isError) return <div className="empty-state">Não foi possível carregar os relatórios. Tente de novo.</div>
  if (escolha && !umSo) return <div className="empty-state">Este relatório não foi encontrado.</div>

  const emitidoEm = dataHora(new Date().toISOString())
  return (
    <>
      <style>{estilosPagina}</style>
      {lista.length > 1 && (
        <div className="ir-barra">
          <label>
            <span className="form-lbl">O que imprimir</span>
            <select className="bm-input bm-select" value={escolha} onChange={(e) => setEscolha(Number(e.target.value))}>
              <option value={0}>Todos os relatórios ({lista.length})</option>
              {lista.map((r) => <option key={r.id} value={r.id}>{rotuloRelatorio(r)}</option>)}
            </select>
          </label>
        </div>
      )}
      <div className="ir-papel">
        <article className="ir-folha">
          <div className="ir-corpo">
            <div className="ir-marca">
              <div className="ir-marca-id">
                <span className="ir-marca-b" aria-hidden="true">B+</span>
                <div>
                  <div className="ir-marca-nome">BMais</div>
                  <div className="ir-marca-sub">Intelligence System</div>
                </div>
              </div>
              <div className="ir-marca-doc">
                <div className="ir-marca-tipo">Relatório de auditoria</div>
                <div className="ir-marca-emissao">Emitido em {emitidoEm}</div>
              </div>
            </div>
            <header className="ir-cab">
              <div>
                <div className="ir-titulo">{umSo ? 'Relatório de visita' : 'Relatórios da internação'}</div>
                {umSo?.data_visita && <div className="ir-data">Visita em {dataBR(umSo.data_visita)}</div>}
                {!umSo && <div className="ir-data">{imprimir.length} {imprimir.length === 1 ? 'relatório' : 'relatórios'}</div>}
              </div>
              {umSo && situacao(umSo) && <div className="ir-situacao">{situacao(umSo)}</div>}
            </header>
            <Paciente d={d} />
            {umSo && registradoPor(umSo) && <div className="ir-meta">{registradoPor(umSo)}</div>}

            {umSo && <ConteudoRelatorio r={umSo} />}
            {!umSo && imprimir.map((r) => (
              <section key={r.id} className="ir-rel">
                <div className="ir-rel-cab">
                  <span className="ir-rel-tit">{rotuloRelatorio(r)}</span>
                  <span className="ir-meta" style={{ marginTop: 0 }}>
                    {[registradoPor(r), situacao(r)].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <ConteudoRelatorio r={r} />
              </section>
            ))}
            {!umSo && !imprimir.length && (
              <p className="ir-vazio">Nenhum relatório registrado nesta internação.</p>
            )}
          </div>
          <footer className="ir-rodape">
            <span className="ir-rodape-marca">
              <span className="ir-rodape-b" aria-hidden="true">B+</span>
              BMais Intelligence System
            </span>
            <span>Documento gerado pelo sistema em {emitidoEm}</span>
          </footer>
        </article>
      </div>
    </>
  )
}
