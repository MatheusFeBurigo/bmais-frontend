import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { usePageHeader } from '../components/PageHeader'
import { LoadingState } from '../components/ui'
import { useConfiguracoes } from '../hooks/useConfiguracoes'
import { invalidarPorEvento } from '../lib/invalidation'
import OverviewView from '../components/configuracoes/OverviewView'
import OperadoraView from '../components/configuracoes/OperadoraView'
import HospitalView from '../components/configuracoes/HospitalView'

// Roteador da tela Configurações: escolhe a vista (grid geral → operadora →
// hospital) conforme os query params `op`/`hospital`. As vistas moram em
// components/configuracoes/; a página só orquestra navegação e invalidação.
export default function Configuracoes() {
  const [params, setParams] = useSearchParams()
  const op = params.get('op') || ''
  const hospital = params.get('hospital') || ''
  const [toast, setToast] = useState<string | null>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useConfiguracoes({ op, hospital })

  function go(next: Record<string, string>) {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(next)) if (v) p.set(k, v)
    setParams(p)
  }

  function invalidar() {
    invalidarPorEvento(qc, 'configuracaoAlterada')
  }

  if (isLoading || !data) {
    return <CfgLoading />
  }

  if (data.hospital_selected && data.op_selected) {
    return (
      <HospitalView
        opSel={data.op_selected}
        hosp={data.hospital_selected}
        profs={data.profs_ativos}
        onNav={go}
        onToast={setToast}
        onChanged={invalidar}
        toast={toast}
      />
    )
  }

  if (data.op_selected) {
    return (
      <OperadoraView
        opSel={data.op_selected}
        onNav={go}
        onToast={setToast}
        onChanged={invalidar}
        toast={toast}
      />
    )
  }

  return <OverviewView operadoras={data.operadoras} onNav={go} onToast={setToast} onChanged={invalidar} toast={toast} />
}

// Estado de carregamento: registra o header e mostra o spinner no miolo.
function CfgLoading() {
  usePageHeader({ title: 'Operadoras' })
  return <LoadingState />
}
