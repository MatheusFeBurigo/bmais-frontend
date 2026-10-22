// Formulário de prorrogação da Porto Saúde (`/paciente/:id/porto`), aberto pelo
// botão "Formulário Porto" do painel e da ficha do paciente.
//
// A Porto pede o formulário dela junto do pedido de prorrogação (20/10/2026);
// antes ele era preenchido à mão e anexado ao relatório. Aqui ele nasce
// preenchido com o paciente e um relatório (por padrão, o último com pedido de
// prorrogação), cada campo pode ser ajustado na própria folha, e a impressão
// sai só com a folha, em A4 paisagem, pronta para salvar em PDF.
//
// O que se edita na folha NÃO é gravado: a fonte continua sendo o relatório.
// Trocar o relatório escolhido, ou "Desfazer alterações", preenche de novo.
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Alerta, alertaStyles } from '../components/Alerta'
import { usePageHeader } from '../components/PageHeader'
import { LoadingState } from '../components/ui'
import { FolhaPorto } from '../components/porto/FolhaPorto'
import { ehPorto, preencherFolha, relatorioPadrao, type FolhaPortoValores } from '../components/porto/folhaPorto.model'
import { useInternacaoDados, useInternacaoRelatorios } from '../hooks/useInternacao'
import { dataBR, dataHora } from '../lib/datas'
import { identificacaoPaciente } from '../lib/texto'
import type { InternacaoDados, RelatorioItem } from '../types/api'

// Na impressão sai só a folha: sem menu, sem topo, sem a barra de cima. Fica
// num <style> da página (e não no CSS da folha) porque o @page vale para o
// documento inteiro e só deve existir enquanto esta tela está aberta.
const estilosPagina = `
.fp-barra{display:flex;align-items:flex-end;gap:12px 16px;flex-wrap:wrap;max-width:1077px;margin:0 auto 14px}
.fp-barra label{flex:0 1 380px;min-width:240px}
.fp-barra-dica{flex:1 1 260px;margin:0;font-size:var(--t-sm);color:var(--muted)}
.fp-avisos{max-width:1077px;margin:0 auto 14px}
.fp-papel{overflow-x:auto;padding:2px 2px 8px}
@page{size:A4 landscape;margin:5mm}
@media print{
  html,body,#root,.app,.main{background:#fff!important;min-height:0!important;height:auto!important}
  .app{display:block!important}
  .sidebar,.topbar,.fp-barra,.fp-avisos{display:none!important}
  .scope{padding:0!important;max-width:none!important}
  .fp-papel{overflow:visible;padding:0}
  .fp-folha{margin:0}
}
`

const IconVoltar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
)

const IconImprimir = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></svg>
)

/** Como o relatório aparece na escolha: quando, quem e o que ele traz. */
function rotuloRelatorio(r: RelatorioItem): string {
  const partes = [dataBR(r.data_visita) || dataHora(r.criado_em) || `Relatório ${r.id}`]
  const quem = r.medico || r.autor_nome
  if (quem) partes.push(quem)
  if (r.prorrogacao?.periodos.length) partes.push('com prorrogação')
  if (r.aprovacao === 'pendente') partes.push('aguardando aprovação')
  return partes.join(' · ')
}

/** A folha com o estado dela. Montada de novo (pela `key`) quando o relatório
 *  escolhido muda, e então preenche do zero. */
function FolhaEditavel({ inicial }: { inicial: FolhaPortoValores }) {
  const [valores, setValores] = useState(inicial)
  return <FolhaPorto v={valores} onChange={setValores} />
}

export default function FormularioPorto() {
  const { id } = useParams<{ id: string }>()
  const internacaoId = Number(id)
  const navigate = useNavigate()
  const location = useLocation()
  const idInvalido = !id || Number.isNaN(internacaoId)

  const { data: d, isLoading, isError } = useInternacaoDados(internacaoId)
  const relatorios = useInternacaoRelatorios(internacaoId)
  const lista = relatorios.data?.relatorios

  // null = ainda não escolheu (vale o padrão); 0 = nenhum relatório.
  const [escolhaId, setEscolhaId] = useState<number | null>(null)
  // Sobe a cada "Desfazer alterações": muda a `key` e a folha preenche de novo.
  const [versao, setVersao] = useState(0)
  const base = escolhaId === null
    ? relatorioPadrao(lista)
    : (lista?.find((r) => r.id === escolhaId) ?? null)

  // Nome sugerido do PDF: o navegador usa o título da página.
  useEffect(() => {
    if (!d) return
    const titulo = `Prorrogação Porto - ${identificacaoPaciente(d)}`
    let anterior = document.title
    const antes = () => { anterior = document.title; document.title = titulo }
    const depois = () => { document.title = anterior }
    window.addEventListener('beforeprint', antes)
    window.addEventListener('afterprint', depois)
    return () => {
      window.removeEventListener('beforeprint', antes)
      window.removeEventListener('afterprint', depois)
    }
  }, [d])

  usePageHeader(useMemo(() => ({
    title: 'Formulário Porto',
    subtitle: d
      ? <>Solicitação de prorrogação · {identificacaoPaciente(d)}{d.hospital_nome ? ` · ${d.hospital_nome}` : ''}</>
      : 'Solicitação de prorrogação',
    actions: (
      <div style={{ display: 'flex', gap: 8 }}>
        {/* Quem chega por link direto não tem para onde voltar: vai para a ficha. */}
        <button className="btn btn-outline btn-sm"
                onClick={() => (location.key === 'default' ? navigate(`/paciente/${internacaoId}`) : navigate(-1))}>
          <IconVoltar />
          Voltar
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()} disabled={!d}>
          <IconImprimir />
          Imprimir ou salvar em PDF
        </button>
      </div>
    ),
  }), [d, internacaoId, location.key, navigate]))

  if (idInvalido) return <div className="empty-state">Paciente inválido.</div>
  if (isLoading || relatorios.isLoading) return <LoadingState />
  if (isError || !d) return <div className="empty-state">Não foi possível carregar os dados do paciente.</div>

  return (
    <>
      <style>{alertaStyles + estilosPagina}</style>
      <Avisos d={d} erroRelatorios={relatorios.isError} />
      <div className="fp-barra">
        <label>
          <span className="form-lbl">Preencher com o relatório</span>
          <select className="bm-input bm-select" value={base?.id ?? 0}
                  onChange={(e) => setEscolhaId(Number(e.target.value))}>
            <option value={0}>Nenhum (só os dados do paciente)</option>
            {lista?.map((r) => <option key={r.id} value={r.id}>{rotuloRelatorio(r)}</option>)}
          </select>
        </label>
        <p className="fp-barra-dica">
          Clique em qualquer campo da folha para ajustar antes de imprimir. As alterações valem só
          para esta impressão e não ficam gravadas no sistema.
        </p>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setVersao((n) => n + 1)}>
          Desfazer alterações
        </button>
      </div>
      <div className="fp-papel">
        <FolhaEditavel key={`${base?.id ?? 0}-${versao}`} inicial={preencherFolha(d, base)} />
      </div>
    </>
  )
}

function Avisos({ d, erroRelatorios }: { d: InternacaoDados; erroRelatorios: boolean }) {
  if (ehPorto(d) && !erroRelatorios) return null
  return (
    <div className="fp-avisos">
      {!ehPorto(d) && (
        <Alerta nivel="atencao">
          Este paciente não é da <b>Porto</b>. O formulário é o da Porto Saúde.
        </Alerta>
      )}
      {erroRelatorios && (
        <Alerta nivel="atencao">
          Não foi possível carregar os relatórios: a folha abriu só com os dados do paciente.
        </Alerta>
      )}
    </div>
  )
}
