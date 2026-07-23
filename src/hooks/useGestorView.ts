// Hook de VIEW-STATE da tela Gestor: casa os filtros por URL (react-router) com
// os dados (useGestor) e deriva o view-model (chips, rótulos, lista visível).
// Separado do useGestor (dados) — a página só compõe, não calcula.
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useGestor } from './useGestor'
import { ehHoje, labelCurto } from '../lib/datas'
import { FAIXA_INFO, JANELAS, type FaixaFiltro } from '../components/gestor/gestor.model'
import type { ChipFiltro } from '../components/gestor/FiltrosBar'

export function useGestorView() {
  const [params, setParams] = useSearchParams()
  const fData = params.get('data') || ''
  const fOperadora = params.get('operadora') || ''
  const fHospital = params.get('hospital') || ''
  const fRegiao = params.get('regiao') || ''
  const fJanela = params.get('janela') || '30d'
  // Intervalo (clique numa coluna do gráfico): ancora o painel no período do
  // bucket. Ambos presentes = modo intervalo; têm precedência sobre `data`.
  const fInicio = params.get('inicio') || ''
  const fFim = params.get('fim') || ''

  const [faixa, setFaixa] = useState<FaixaFiltro>('')

  // O backend devolve métricas e opções de filtro num único payload aninhado
  // ({ metrics, filtros }) — não há rota /gestor/filtros separada.
  const { data: payload, isLoading, isError, isFetching } = useGestor({
    data: fData, operadora: fOperadora, hospital: fHospital, regiao: fRegiao, janela: fJanela,
    inicio: fInicio, fim: fFim,
  })
  const m = payload?.metrics
  const filtros = payload?.filtros
  // Refetch com dados anteriores em tela (troca de dia/filtro): não mostramos o
  // loading de tela cheia — só atenuamos levemente enquanto os novos dados chegam.
  const atualizando = isFetching && !isLoading

  // Atualiza um conjunto de query params de uma vez (equivale ao urlCom do template).
  function setFiltro(patch: Record<string, string>) {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    setParams(next)
  }

  // Escopo de dados: `filtros.operadoras`/`filtros.hospitais` já vêm recortados
  // ao que o usuário pode ver. Se a URL trouxer uma operadora/hospital fora do
  // escopo (?operadora=X direto), limpa o filtro — não fica preso num recorte
  // vazio de dados que não são dele (o backend já não retorna essas linhas).
  useEffect(() => {
    if (!filtros) return
    const patch: Record<string, string> = {}
    if (fOperadora && !filtros.operadoras.some((o) => o.key === fOperadora)) patch.operadora = ''
    if (fHospital && !filtros.hospitais.some((h) => h.key === fHospital)) patch.hospital = ''
    if (Object.keys(patch).length > 0) setFiltro(patch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros, fOperadora, fHospital])

  function toggleFaixa(f: FaixaFiltro) {
    setFaixa((cur) => (cur === f ? '' : f))
  }

  // Modo intervalo: painel ancorado no período de um bucket do gráfico (clique
  // numa coluna agrupada — semana no 6m, mês no 1a, ou 1 dia no 30d/90d).
  const modoIntervalo = !!m && m.modo_intervalo
  // "Dia histórico": uma data única anterior a hoje está selecionada. Baseia-se
  // no `m.dia` resolvido pelo backend (não em fData, que pode estar vazio = hoje).
  const diaHistorico = !!m && !modoIntervalo && !ehHoje(m.dia)
  // "Período ativo": um recorte temporal específico (dia OU intervalo) está em
  // foco — controla acordeão, ocultação de médias e rótulos "do período".
  const periodoAtivo = diaHistorico || modoIntervalo
  // Sufixo curto p/ rótulos dos KPIs: "em 19/07" (dia) ou "no período" (intervalo).
  const sufixoDia = modoIntervalo ? ' no período' : diaHistorico ? ` em ${labelCurto(m!.dia)}` : ''
  // Nome da operadora filtrada (via clique no gráfico de operadora ou chip) —
  // deixa explícito no título "por hospital" que a lista é daquela operadora.
  const nomeOpFiltrada = fOperadora ? (filtros?.operadoras.find((o) => o.key === fOperadora)?.nome || fOperadora) : ''
  // Nome do hospital filtrado (via clique no gráfico de hospital ou chip) —
  // deixa explícito no título da lista que ela é só daquele hospital.
  const nomeHospFiltrado = fHospital ? (filtros?.hospitais.find((h) => h.key === fHospital)?.nome || fHospital) : ''
  // Janela do gráfico de fluxo: título descritivo. Todas as janelas são
  // clicáveis — cada coluna ancora o painel no seu período (dia/semana/mês).
  const janelaTitulo = (JANELAS.find((j) => j.key === fJanela) ?? JANELAS[0]).titulo

  // O gráfico de 30 dias funciona como acordeão: aberto por padrão (é por ele
  // que se escolhe o dia clicando); ao selecionar um dia específico ele colapsa
  // para dar espaço às métricas daquele dia. O usuário pode reabrir para trocar.
  const [graficoAberto, setGraficoAberto] = useState(true)
  // Sincroniza o padrão quando o modo muda: período selecionado → colapsa; hoje → abre.
  useEffect(() => { setGraficoAberto(!periodoAtivo) }, [periodoAtivo])

  const visiveis = useMemo(() => {
    const lista = m?.pacientes_dia ?? []
    if (!faixa) return lista
    if (faixa === 'altas') return lista.filter((p) => p.situacao === 'ALTA')
    return lista.filter((p) => p.faixa === faixa && p.situacao === 'INTERNADO')
  }, [m, faixa])

  // Todos os recortes ativos como chips removíveis — incluindo o dia. Cada clique
  // num gráfico (operadora/hospital/região/faixa) ou num dia gera o chip aqui.
  // Resolve os nomes de operadora/hospital a partir das opções; região e faixa
  // já têm rótulo. Lista pequena e barata — calculada a cada render (sem useMemo).
  const chipsFiltros: ChipFiltro[] = []
  {
    const faixaLabel = faixa === 'altas' ? 'Altas'
      : faixa && faixa in FAIXA_INFO ? FAIXA_INFO[faixa as keyof typeof FAIXA_INFO].label : ''
    if (modoIntervalo) chipsFiltros.push({ tipo: 'Período', label: m!.dia_label, onRemove: () => setFiltro({ inicio: '', fim: '' }) })
    else if (diaHistorico) chipsFiltros.push({ tipo: 'Dia', label: m!.dia_label, onRemove: () => setFiltro({ data: '' }) })
    if (fOperadora) chipsFiltros.push({ tipo: 'Operadora', label: nomeOpFiltrada, onRemove: () => setFiltro({ operadora: '', hospital: '' }) })
    if (fHospital) chipsFiltros.push({ tipo: 'Hospital', label: nomeHospFiltrado, onRemove: () => setFiltro({ hospital: '' }) })
    if (fRegiao) chipsFiltros.push({ tipo: 'Região', label: fRegiao, onRemove: () => setFiltro({ regiao: '' }) })
    if (faixa) chipsFiltros.push({ tipo: 'Permanência', label: faixaLabel, onRemove: () => setFaixa('') })
  }

  // Desfaz TUDO de uma vez e restaura o estado inicial: zera os recortes
  // (operadora/hospital/região/faixa) E limpa o dia — assim o gráfico volta a
  // expandir (30 dias) e as médias reaparecem, como no "Ver todo o período".
  const limparTudo = () => {
    setFaixa('')
    setFiltro({ operadora: '', hospital: '', regiao: '', data: '', inicio: '', fim: '' })
  }

  const subtitle = m
    ? modoIntervalo
      ? `Período · ${m.dia_label}`
      : `${diaHistorico ? 'Dia' : 'Fluxo diário de internações ·'} ${m.dia_label}`
    : undefined

  // Ancora o painel no período de um bucket do gráfico (clique numa coluna).
  // Seta inicio/fim e limpa `data` (intervalo tem precedência, mas mantemos a
  // URL limpa — só um dos dois recortes por vez).
  const setPeriodo = (ini: string, fim: string) => setFiltro({ inicio: ini, fim, data: '' })
  // Volta a um dia único (via <input type=date>): limpa o intervalo.
  const setDia = (data: string) => setFiltro({ data, inicio: '', fim: '' })

  return {
    // filtros crus (URL)
    fOperadora, fHospital, fRegiao, fJanela,
    // dados
    m, filtros, isLoading, isError, atualizando,
    // estado de faixa + acordeão
    faixa, toggleFaixa, graficoAberto, setGraficoAberto,
    // derivações de view
    diaHistorico, modoIntervalo, periodoAtivo, sufixoDia, nomeOpFiltrada, nomeHospFiltrado,
    janelaTitulo, visiveis, chipsFiltros, subtitle,
    // ações
    setFiltro, setPeriodo, setDia, limparTudo,
  }
}
