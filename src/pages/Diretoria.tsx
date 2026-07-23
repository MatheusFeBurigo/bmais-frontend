import { useState } from 'react'
import { useDiretoria } from '../hooks/useDiretoria'
import { exportarRvm, inserirSeedDemo } from '../services/diretoria.service'
import { usePageHeader } from '../components/PageHeader'
import Toast from '../components/Toast'
import { LoadingState, Spinner } from '../components/ui'
import { Deferred } from '../components/Deferred'
import HeroKpis from '../components/diretoria/HeroKpis'
import StatusDonutCard from '../components/diretoria/StatusDonutCard'
import ResumoOperadoraTable from '../components/diretoria/ResumoOperadoraTable'
import BottomCharts from '../components/diretoria/BottomCharts'

export default function Diretoria() {
  const [toast, setToast] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)
  // O export é POR OPERADORA (o backend não gera consolidado). O usuário escolhe
  // qual planilha baixar — sem isso, o botão caía no default silencioso "sulamerica".
  const [expOp, setExpOp] = useState('')

  const { data, isLoading, isError, refetch, isFetching } = useDiretoria()

  async function exportar() {
    const op = (data?.por_operadora || []).find((o) => o.key === expOp)
    if (!op) {
      setToast('Selecione a operadora para exportar')
      return
    }
    try {
      await exportarRvm(op.key)
    } catch {
      setToast('Falha ao exportar')
    }
  }

  async function seedDemo() {
    setSeeding(true)
    try {
      const d = await inserirSeedDemo()
      if (d.ok) {
        setToast(`✓ Demo inserido — ${d.pacientes_inseridos} pacientes, ${d.relatorios_adicionados} relatórios`)
        refetch()
      } else {
        setToast('Erro ao inserir demo')
      }
    } catch (err) {
      setToast(`Erro: ${(err as Error).message}`)
    } finally {
      setSeeding(false)
    }
  }

  const actions = (
    <>
      <button className="btn btn-outline btn-sm" onClick={seedDemo} disabled={seeding} title="Inserir dados demo">
        {seeding ? 'Inserindo…' : 'Seed Demo'}
      </button>
      <button className="btn btn-outline btn-sm" onClick={() => refetch()} disabled={isFetching}>
        {isFetching && <Spinner size={13} />}
        {isFetching ? 'Atualizando…' : 'Atualizar'}
      </button>
    </>
  )

  const subtitle = data ? `KPIs consolidados de todas as operadoras · Ref: ${data.hoje_efetivo || '—'}` : undefined

  usePageHeader({ title: 'Dashboard da Diretoria', subtitle, actions })

  return (
    <>
      {isLoading && <LoadingState label="Carregando KPIs…" />}
      {isError && <div className="empty-state t-danger">Erro ao carregar o dashboard.</div>}

      {data && (
        <>
          <HeroKpis data={data} />

          {/* Blocos pesados (gráficos + listas) adiados para depois do primeiro
              paint dos KPIs — o cliente vê o topo instantaneamente. */}
          <Deferred
            delaySteps={2}
            minHeight={520}
            placeholder={<LoadingState label="Carregando gráficos…" style={{ minHeight: 520 }} />}
          >
            <StatusDonutCard data={data} />
            <ResumoOperadoraTable data={data} expOp={expOp} onExpOp={setExpOp} onExportar={exportar} />
            <BottomCharts data={data} />
          </Deferred>
        </>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  )
}
