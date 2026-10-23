// Formulário de prorrogação da Porto Saúde (`/paciente/:id/porto`), aberto pelo
// botão "Formulário Porto" do painel e da ficha do paciente.
//
// A Porto pede o formulário dela junto do pedido de prorrogação (20/10/2026);
// antes ele era preenchido à mão e anexado ao relatório. Aqui ele nasce
// preenchido com o paciente e um relatório (por padrão, o último com pedido de
// prorrogação), cada campo pode ser ajustado na própria folha, e "Baixar PDF"
// gera o PDF no modelo exato da Porto (22/10/2026: backend
// infrastructure/formulario_porto.py) com os valores que estão na folha. A
// seção "Prorrogar" da modal do relatório baixa o mesmo PDF antes de registrar.
//
// O que se edita na folha NÃO é gravado: a fonte continua sendo o relatório.
// Trocar o relatório escolhido, ou "Desfazer alterações", preenche de novo.
import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Alerta, alertaStyles } from '../components/Alerta'
import { usePageHeader } from '../components/PageHeader'
import { LoadingState } from '../components/ui'
import { FolhaPorto } from '../components/porto/FolhaPorto'
import {
  ehPorto, nomeArquivoPorto, preencherFolha, relatorioPadrao, type FolhaPortoValores,
} from '../components/porto/folhaPorto.model'
import { useExportarFormularioPorto, useInternacaoDados, useInternacaoRelatorios } from '../hooks/useInternacao'
import { dataBR, dataHora } from '../lib/datas'
import { identificacaoPaciente } from '../lib/texto'
import type { InternacaoDados, RelatorioItem } from '../types/api'

const estilosPagina = `
.fp-barra{display:flex;align-items:flex-end;gap:12px 16px;flex-wrap:wrap;max-width:1077px;margin:0 auto 14px}
.fp-barra label{flex:0 1 380px;min-width:240px}
.fp-barra-dica{flex:1 1 260px;margin:0;font-size:var(--t-sm);color:var(--muted)}
.fp-avisos{max-width:1077px;margin:0 auto 14px}
.fp-papel{overflow-x:auto;padding:2px 2px 8px}
`

const IconVoltar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
)

const IconBaixar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M12 18v-6" /><path d="m9 15 3 3 3-3" /></svg>
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

export default function FormularioPorto() {
  const { id } = useParams<{ id: string }>()
  const internacaoId = Number(id)
  const navigate = useNavigate()
  const location = useLocation()
  const idInvalido = !id || Number.isNaN(internacaoId)

  const { data: d, isLoading, isError } = useInternacaoDados(internacaoId)
  const relatorios = useInternacaoRelatorios(internacaoId)
  const lista = relatorios.data?.relatorios
  const { mutate: baixarPdf, isPending: gerando, isError: erroExportar } = useExportarFormularioPorto()

  // null = ainda não escolheu (vale o padrão); 0 = nenhum relatório.
  const [escolhaId, setEscolhaId] = useState<number | null>(null)
  // Sobe a cada "Desfazer alterações": a folha preenche de novo.
  const [versao, setVersao] = useState(0)
  const base = escolhaId === null
    ? relatorioPadrao(lista)
    : (lista?.find((r) => r.id === escolhaId) ?? null)

  // As edições valem para a folha em que foram feitas: mudou o relatório (ou
  // desfez), a chave muda e a folha volta a sair do relatório.
  const chave = `${base?.id ?? 0}-${versao}`
  const [edicao, setEdicao] = useState<{ chave: string; valores: FolhaPortoValores } | null>(null)
  const inicial = useMemo(() => (d ? preencherFolha(d, base) : null), [d, base])
  const valores = edicao?.chave === chave ? edicao.valores : inicial

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
        <button className="btn btn-primary btn-sm" disabled={!d || !valores || gerando}
                onClick={() => d && valores && baixarPdf({ folha: valores, nomeArquivo: nomeArquivoPorto(d) })}>
          <IconBaixar />
          {gerando ? 'Gerando…' : 'Baixar PDF'}
        </button>
      </div>
    ),
  }), [d, valores, gerando, baixarPdf, internacaoId, location.key, navigate]))

  if (idInvalido) return <div className="empty-state">Paciente inválido.</div>
  if (isLoading || relatorios.isLoading) return <LoadingState />
  if (isError || !d || !valores) return <div className="empty-state">Não foi possível carregar os dados do paciente.</div>

  return (
    <>
      <style>{alertaStyles + estilosPagina}</style>
      <Avisos d={d} erroRelatorios={relatorios.isError} erroExportar={erroExportar} />
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
          Clique em qualquer campo da folha para ajustar antes de baixar. O PDF sai no modelo da
          Porto com o que estiver na folha; as alterações não ficam gravadas no sistema.
        </p>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setVersao((n) => n + 1)}>
          Desfazer alterações
        </button>
      </div>
      <div className="fp-papel">
        <FolhaPorto v={valores} onChange={(v) => setEdicao({ chave, valores: v })} />
      </div>
    </>
  )
}

function Avisos({ d, erroRelatorios, erroExportar }: {
  d: InternacaoDados
  erroRelatorios: boolean
  erroExportar: boolean
}) {
  if (ehPorto(d) && !erroRelatorios && !erroExportar) return null
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
      {erroExportar && (
        <Alerta nivel="atencao">
          Não foi possível gerar o PDF. Tente de novo.
        </Alerta>
      )}
    </div>
  )
}
