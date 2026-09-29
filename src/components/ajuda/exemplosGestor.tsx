// Réplicas do Painel do Gestor, usadas nos "como fazer" do módulo.
//
// Tudo aqui é o componente REAL da tela, alimentado com um período fictício:
// os indicadores (KpiCard), as pastilhas de operadora e de filtros ativos, o
// cartão de fluxo com os dois gráficos, as médias da janela, os gráficos de
// permanência, hospital e região, e a tabela de pacientes. Se a tela mudar, a
// réplica muda junto.
//
// Este arquivo puxa o Chart.js. Por isso o módulo do Gestor o carrega sob
// demanda (lazy): o mesmo pacote de conteúdo atende a Distribuição de tarefas,
// e o coordenador que abre só aquele módulo não precisa baixar os gráficos.
import type { GestorGrupo, GestorMetrics, PacienteDia, SerieDia } from '../../types/api'
import { KpiCard } from '../ui'
import { localStyles as gestorStyles, COR } from '../gestor/gestor.styles'
import { ChipsAtivos, OperadoraPills } from '../gestor/FiltrosBar'
import FluxoCard from '../gestor/FluxoCard'
import MediasJanelaCard from '../gestor/MediasJanelaCard'
import TabelaPacientes from '../gestor/TabelaPacientes'
import { FaixasDonut, HospBar, RegBar } from '../gestor/charts'
import { Marcado } from './replica'
import { Topo } from './exemplosOperacao'

const nada = () => {}

// 30 dias terminando em 25/09/2026, com uma ocupação que sobe e desce de leve.
// Os números são determinísticos (sem Math.random): a réplica é a mesma a cada
// abertura, e os prints da documentação batem com o que a pessoa vê.
const SERIE: SerieDia[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 7, 27 + i))
  const iso = d.toISOString().slice(0, 10)
  const entradas = 4 + ((i * 7) % 6)
  const altas = 3 + ((i * 5) % 6)
  const internados = 80 + Math.round(6 * Math.sin(i / 4)) + (i % 3)
  return {
    dia: iso, ini: iso, fim: iso, label: `${iso.slice(8, 10)}/${iso.slice(5, 7)}`,
    internados, entradas, altas,
    f0_9: Math.round(internados * 0.6), f10_29: Math.round(internados * 0.3), f30: Math.round(internados * 0.1),
  }
})

const HOSPITAIS: GestorGrupo[] = [
  { key: 'santa_clara', nome: 'Hospital Santa Clara', internados: 24, altas: 3 },
  { key: 'sao_lucas', nome: 'Hospital São Lucas', internados: 18, altas: 1 },
  { key: 'vila_nova', nome: 'Hospital Vila Nova', internados: 15, altas: 1 },
  { key: 'bela_vista', nome: 'Hospital Bela Vista', internados: 12, altas: 0 },
  { key: 'santa_rita', nome: 'Hospital Santa Rita', internados: 11, altas: 0 },
  { key: 'modelo', nome: 'Hospital Modelo', internados: 8, altas: 0 },
]

const PACIENTES: PacienteDia[] = [
  { id: 1, nome: 'Ana Beatriz Moura', atendimento: '771204', hospital_nome: 'Hospital Santa Clara', operadora_key: 'careplus', dias: 34, faixa: '30p', situacao: 'INTERNADO', data_entrada: '22/08/2026' },
  { id: 2, nome: 'Carlos Eduardo Lima', atendimento: '552318', hospital_nome: 'Hospital São Lucas', operadora_key: 'porto', dias: 31, faixa: '30p', situacao: 'INTERNADO', data_entrada: '25/08/2026' },
  { id: 3, nome: 'Helena Duarte', atendimento: '771388', hospital_nome: 'Hospital Santa Clara', operadora_key: 'careplus', dias: 18, faixa: '10_29', situacao: 'INTERNADO', data_entrada: '07/09/2026' },
  { id: 4, nome: 'Roberto Nunes', atendimento: '190547', hospital_nome: 'Hospital Vila Nova', operadora_key: 'sulamerica', dias: 12, faixa: '10_29', situacao: 'INTERNADO', data_entrada: '13/09/2026' },
  { id: 5, nome: 'Lúcia Ferraz', atendimento: '771430', hospital_nome: 'Hospital Santa Clara', operadora_key: 'careplus', dias: 4, faixa: '0_9', situacao: 'INTERNADO', data_entrada: '21/09/2026' },
  { id: 6, nome: 'Pedro Henrique Sales', atendimento: '770988', hospital_nome: 'Hospital Santa Clara', operadora_key: 'careplus', dias: 9, faixa: '0_9', situacao: 'ALTA', data_entrada: '15/09/2026' },
]

const ULTIMO = SERIE[SERIE.length - 1]

const M: GestorMetrics = {
  dia: ULTIMO.dia,
  dia_label: '25/09/2026',
  dia_inicio: ULTIMO.dia,
  dia_fim: ULTIMO.dia,
  modo_intervalo: false,
  hoje: { internados: 88, f0_9: 52, f10_29: 27, f30: 9, entradas: 7, altas: 5 },
  serie_30d: SERIE,
  media_mes: { internados_media: 84, altas_total: 131, entradas_total: 139, altas_dia: 4.4 },
  media_semestre: { internados_media: 81, altas_total: 760, entradas_total: 772, altas_dia: 4.2 },
  media_ano: { internados_media: 79, altas_total: 1510, entradas_total: 1528, altas_dia: 4.1 },
  media_janela: { internados_media: 84, altas_total: 131, entradas_total: 139, altas_dia: 4.4 },
  media_janela_dias: 30,
  por_operadora: [
    { key: 'careplus', nome: 'CarePlus', internados: 47, altas: 3, hospitais: 3 },
    { key: 'porto', nome: 'Porto Seguro', internados: 26, altas: 1, hospitais: 2 },
    { key: 'sulamerica', nome: 'SulAmérica', internados: 15, altas: 1, hospitais: 1 },
  ],
  por_hospital: HOSPITAIS,
  por_regiao: [
    { key: 'Campinas', nome: 'Campinas', internados: 42, altas: 4 },
    { key: 'SP - Zona Sul', nome: 'SP - Zona Sul', internados: 27, altas: 1 },
    { key: 'SP - Zona Oeste', nome: 'SP - Zona Oeste', internados: 19, altas: 0 },
  ],
  pacientes_dia: PACIENTES,
}

const OPERADORAS = [
  { key: 'careplus', nome: 'CarePlus' },
  { key: 'porto', nome: 'Porto Seguro' },
  { key: 'sulamerica', nome: 'SulAmérica' },
]

function Cabecalho() {
  return <Topo titulo="Painel do Gestor" sub="Todas as operadoras · 25/09/2026" />
}

/** Os cinco indicadores do dia, como a tela os monta no modo geral. */
function Indicadores({ marcas = {} }: {
  marcas?: Partial<Record<'internados' | 'faixas' | 'altas', number>>
}) {
  return (
    <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 16 }}>
      <Marcado n={marcas.internados} bloco>
        <KpiCard variant="primary-kpi" label="Internados até o momento" value={M.hoje.internados}
          meta="total ativo agora" active onClick={nada} />
      </Marcado>
      <KpiCard variant="info" label="Até 9 dias" value={M.hoje.f0_9} meta="permanência curta" onClick={nada} />
      <KpiCard variant="warning" label="10 a 29 dias" value={M.hoje.f10_29} meta="permanência prolongada" onClick={nada} />
      <Marcado n={marcas.faixas} bloco>
        <KpiCard variant="danger" label="30+ dias" value={M.hoje.f30} meta="permanência crítica" onClick={nada} />
      </Marcado>
      <Marcado n={marcas.altas} bloco>
        <KpiCard variant="success" label="Altas do Dia" value={M.hoje.altas}
          meta={`${M.hoje.entradas} novas entradas`} onClick={nada} />
      </Marcado>
    </div>
  )
}

/** Topo da tela: operadoras, os cinco indicadores e as médias da janela. */
export function ReplicaMovimento({ marcas = {} }: {
  marcas?: Partial<Record<'internados' | 'faixas' | 'altas' | 'medias', number>>
}) {
  return (
    <>
      <style>{gestorStyles}</style>
      <Cabecalho />
      <OperadoraPills operadoras={OPERADORAS} ativa="" onSelecionar={nada} />
      <Indicadores marcas={marcas} />
      <Marcado n={marcas.medias} bloco>
        <MediasJanelaCard media={M.media_janela} janelaTitulo="últimos 30 dias" />
      </Marcado>
    </>
  )
}

/** O cartão de fluxo. Aberto: os dois gráficos. Fechado com período: o chip
 *  "Analisando o período" e o atalho de voltar ao período completo. */
export function ReplicaFluxo({ aberto }: { aberto: boolean }) {
  const m = aberto ? M : { ...M, dia: '2026-09-18', dia_label: '18/09/2026', dia_inicio: '2026-09-18', dia_fim: '2026-09-18' }
  return (
    <>
      <style>{gestorStyles}</style>
      <FluxoCard
        m={m}
        aberto={aberto}
        onAbertoChange={nada}
        janelaTitulo="últimos 30 dias"
        periodoAtivo={!aberto}
        fJanela=""
        onJanela={nada}
        onBucket={nada}
        onData={nada}
        onLimparPeriodo={nada}
      />
    </>
  )
}

/** Operadora escolhida, filtros ativos e os gráficos de permanência, hospital
 *  e região, com o Hospital Santa Clara selecionado. */
export function ReplicaFiltros() {
  return (
    <>
      <style>{gestorStyles}</style>
      <Cabecalho />
      <OperadoraPills operadoras={OPERADORAS} ativa="careplus" onSelecionar={nada} />
      <ChipsAtivos
        chips={[
          { tipo: 'Operadora', label: 'CarePlus', onRemove: nada },
          { tipo: 'Hospital', label: 'Hospital Santa Clara', onRemove: nada },
        ]}
        onLimparTudo={nada}
      />
      <div className="aj-graficos" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="chart-card">
          <div className="chart-title">Internados por hospital · CarePlus</div>
          <div className="chart-hint">Principais hospitais de CarePlus · clique numa barra para filtrar</div>
          <div style={{ height: 240 }}><HospBar m={M} selKey="santa_clara" onHosp={nada} /></div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Internados por região</div>
          <div className="chart-hint">Clique numa barra para filtrar; clique de novo para desfazer</div>
          <div style={{ height: 240 }}><RegBar m={M} selNome="" onReg={nada} /></div>
        </div>
      </div>
    </>
  )
}

/** Gráfico de permanência e a lista de pacientes com as pastilhas de faixa. */
export function ReplicaPacientes() {
  const pill = (rotulo: string, cor: string | null, ativa = false) => (
    <span className={`pill-faixa${ativa ? ' active' : ''}`}>
      {cor && <span className="faixa-dot" style={{ background: cor }} />}{rotulo}
    </span>
  )
  const trinta = PACIENTES.filter((p) => p.faixa === '30p')
  return (
    <>
      <style>{gestorStyles}</style>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
        <div className="chart-card">
          <div className="chart-title">Permanência por período</div>
          <div className="chart-hint">Clique numa faixa para listar os internados dela abaixo</div>
          <div style={{ height: 240 }}><FaixasDonut m={M} onFaixa={nada} /></div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Pacientes internados · <span>{trinta.length}</span></div>
            <div className="aj-pills-faixa" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {pill('Todos', null)}
              {pill('Até 9d', COR.azul)}
              {pill('10–29d', COR.laranja)}
              {pill('30+d', COR.vermelho, true)}
              {pill('Altas', COR.verde)}
            </div>
          </div>
          <TabelaPacientes pacientes={trinta} onSelecionar={nada} />
        </div>
      </div>
    </>
  )
}
