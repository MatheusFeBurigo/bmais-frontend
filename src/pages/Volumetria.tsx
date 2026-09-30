// Tela "Distribuição de tarefas" (rota /volumetria, ids técnicos mantidos):
// o quadro de Tarefas de cada funcionário, resumido para o coordenador — em
// blocos.
//
// Um membro da equipe herda hospitais em Operações; tudo que chega neles vira
// demanda dele. Aqui o coordenador vê, um cartão por pessoa, quem são os
// funcionários e quantas demandas cada um tem agora (com os mesmos nomes das
// colunas de Tarefas), e é avisado de quem passou da capacidade. Clicar no
// cartão abre o drawer para ver e ajustar a área da pessoa.
//
// Blocos: resumo (KPIs) → equipe (cartões) → demandas x distribuição →
// produtividade (e, para o admin, entre as equipes) → onde o tempo está indo
// (barra por tipo de tarefa) → por região (quem responde por cada uma) → hospitais sem
// cobertura (se houver) → comparativo (gráfico, recolhido) → parâmetros
// (recolhido).
// Admin vê os dois grupos num seletor; cada coordenador vê só o seu.
import { useEffect, useMemo, useState } from 'react'
import { usePageHeader } from '../components/PageHeader'
import { KpiCard, LoadingState } from '../components/ui'
import Toast from '../components/Toast'
import { useVolumetria } from '../hooks/useVolumetria'
import ComparativoCarga from '../components/volumetria/ComparativoCarga'
import DemandaXDistribuicao from '../components/volumetria/DemandaXDistribuicao'
import DividirCarga from '../components/volumetria/DividirCarga'
import DrawerPessoa from '../components/volumetria/DrawerPessoa'
import GradePessoas from '../components/volumetria/GradePessoas'
import HospitaisSemCobertura from '../components/volumetria/HospitaisSemCobertura'
import ParametrosCarga from '../components/volumetria/ParametrosCarga'
import { ConcluidasPorDia, EntreEquipes, ProdutividadePorPessoa } from '../components/volumetria/ProdutividadeCharts'
import PorRegiao from '../components/volumetria/PorRegiao'
import TempoPorTarefa from '../components/volumetria/TempoPorTarefa'
import { localStyles } from '../components/volumetria/volumetria.styles'
import { comVinculo, hospitaisCobertos, rotuloGrupo } from '../components/volumetria/volumetria.model'

const O_QUE_CONTA: Record<string, string> = {
  coordenador_tecnico: 'Sem relatório, aguardando visita, vencidos e a vencer',
  coordenador_administrativo: 'Hospitais com paciente internado e sem censo',
}

export default function Volumetria() {
  const { data, isLoading } = useVolumetria()
  const [grupoIdx, setGrupoIdx] = useState(0)
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
  const [dividirId, setDividirId] = useState<string | null>(null)
  const [aviso, setAviso] = useState('')

  usePageHeader(useMemo(() => ({
    title: 'Distribuição de tarefas',
    subtitle: 'Quem está na equipe e quantas demandas cada um tem agora',
  }), []))

  const grupos = data?.grupos ?? []
  const grupo = grupos[Math.min(grupoIdx, Math.max(grupos.length - 1, 0))] ?? null
  const pessoasComVinculo = useMemo(() => (grupo ? comVinculo(grupo) : []), [grupo])
  const pessoa = grupo?.pessoas.find((p) => p.user_id === selecionadoId) ?? null
  const pessoaDividir = grupo?.pessoas.find((p) => p.user_id === dividirId) ?? null

  // A pessoa selecionada pode sumir do grupo (mudou de papel, foi apagada):
  // solta a seleção em vez de deixar o drawer apontando para ninguém.
  useEffect(() => {
    if (selecionadoId && grupo && !grupo.pessoas.some((p) => p.user_id === selecionadoId)) {
      setSelecionadoId(null)
    }
  }, [grupo, selecionadoId])

  function trocarGrupo(i: number) {
    setGrupoIdx(i)
    setSelecionadoId(null)
    setDividirId(null)
  }

  if (isLoading || !data) {
    return <LoadingState style={{ minHeight: '60vh' }} />
  }
  if (!grupo) {
    return <div className="card"><div className="vol-vazio">Nenhum grupo para mostrar.</div></div>
  }

  const tecnico = grupo.role_operacional === 'tecnico'
  const semCobertura = grupo.sem_cobertura.length
  const sobrecarregados = pessoasComVinculo.filter((p) => p.nivel === 'sobrecarga').length
  const atencao = pessoasComVinculo.filter((p) => p.nivel === 'atencao').length

  return (
    <>
      <style>{localStyles}</style>

      {grupos.length > 1 && (
        <div className="vol-seg" role="tablist" aria-label="Grupo">
          {grupos.map((g, i) => (
            <button
              type="button"
              role="tab"
              key={g.papel}
              aria-selected={i === grupoIdx}
              className={i === grupoIdx ? 'active' : ''}
              onClick={() => trocarGrupo(i)}
            >
              {rotuloGrupo(g.papel).plural}
            </button>
          ))}
        </div>
      )}

      {/* Bloco 1: resumo */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <KpiCard
          label="Equipe"
          value={grupo.pessoas.length}
          variant={sobrecarregados > 0 ? 'danger' : atencao > 0 ? 'warning' : 'neutral'}
          meta={sobrecarregados > 0
            ? `${sobrecarregados} em sobrecarga${atencao > 0 ? ` · ${atencao} em atenção` : ''}`
            : atencao > 0
              ? `${atencao} em atenção · ${pessoasComVinculo.length} com área definida`
              : `${pessoasComVinculo.length} com área definida`}
        />
        {tecnico ? (
          <KpiCard
            label="Pacientes sob responsabilidade"
            value={grupo.total_pacientes ?? 0}
            meta={`Internados nos hospitais da equipe · ${grupo.quebra.em_monitoramento ?? 0} em monitoramento`}
          />
        ) : (
          <KpiCard
            label="Hospitais sob responsabilidade"
            value={hospitaisCobertos(grupo)}
            meta="Com pelo menos um administrativo vinculado"
          />
        )}
        <KpiCard
          label="Demandas abertas"
          value={grupo.total_pendencias}
          variant="info"
          meta={O_QUE_CONTA[grupo.papel] ?? 'Pendências em aberto'}
        />
        <KpiCard
          label="Hospitais sem cobertura"
          value={semCobertura}
          variant={semCobertura > 0 ? 'danger' : 'success'}
          meta={semCobertura > 0 ? 'Com demanda e ninguém vinculado · clique para atribuir' : 'Todos com alguém'}
          onClick={semCobertura > 0
            ? () => document.getElementById('vol-sem-cobertura')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            : undefined}
        />
      </div>

      {/* Bloco 2: equipe */}
      <GradePessoas grupo={grupo} onAbrir={setSelecionadoId} onDividir={setDividirId} />

      {/* Bloco 3: demandas x distribuição e produtividade */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Demandas x distribuição</div>
            <p className="card-sub">Parte das demandas abertas e parte dos hospitais de cada pessoa.</p>
          </div>
        </div>
        <div className="card-body">
          <DemandaXDistribuicao grupo={grupo} onAbrir={setSelecionadoId} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Produtividade</div>
            <p className="card-sub">
              {tecnico ? 'Relatórios registrados' : 'Cobranças de censo feitas'} nos últimos {grupo.produtividade.dias} dias.
            </p>
          </div>
        </div>
        <div className="card-body">
          <div className="vol-prod">
            <div>
              <div className="vol-sub">Por pessoa</div>
              <ProdutividadePorPessoa grupo={grupo} onAbrir={setSelecionadoId} />
            </div>
            <div>
              <div className="vol-sub">Concluídas por dia</div>
              <ConcluidasPorDia grupo={grupo} />
            </div>
          </div>
          {grupo.produtividade.fora_do_grupo > 0 && (
            <p className="vol-prod-nota">
              Mais {grupo.produtividade.fora_do_grupo} feitas por quem não é da equipe (administrador ou coordenador).
            </p>
          )}
        </div>
      </div>

      {grupos.length > 1 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Entre as equipes</div>
              <p className="card-sub">Demandas abertas e concluídas de cada equipe.</p>
            </div>
          </div>
          <div className="card-body">
            <EntreEquipes grupos={grupos} />
          </div>
        </div>
      )}

      {/* Bloco 4: onde o tempo da equipe está indo */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Onde o tempo está indo</div>
            <p className="card-sub">
              O tempo estimado da fila repartido por tipo de tarefa. A quebra dos cartões
              conta casos; esta conta horas, e as duas podem discordar.
            </p>
          </div>
        </div>
        <div className="card-body">
          <TempoPorTarefa role={grupo.role_operacional} minutosCategoria={grupo.minutos_categoria} />
        </div>
      </div>

      {/* Bloco 4: quem responde por cada região */}
      <PorRegiao grupo={grupo} onAbrir={setSelecionadoId} />

      {/* Bloco 5: hospitais sem cobertura (só quando houver) */}
      <HospitaisSemCobertura grupo={grupo} onErro={setAviso} />

      {/* Blocos 6 e 7: apoio, recolhidos */}
      <ComparativoCarga grupo={grupo} onAbrir={setSelecionadoId} />
      <ParametrosCarga grupo={grupo} onErro={setAviso} onAviso={setAviso} />

      {pessoa && (
        <DrawerPessoa pessoa={pessoa} grupo={grupo} onClose={() => setSelecionadoId(null)} onErro={setAviso} />
      )}

      {pessoaDividir && (
        <DividirCarga
          pessoa={pessoaDividir}
          grupo={grupo}
          onClose={() => setDividirId(null)}
          onErro={setAviso}
          onAviso={setAviso}
        />
      )}

      {aviso && <Toast message={aviso} onDone={() => setAviso('')} />}
    </>
  )
}
