// Bloco recolhível com o gráfico de barras por pessoa. É apoio, não a
// resposta da tela (os cartões são) — por isso nasce fechado.
import { useState } from 'react'
import type { VolumetriaGrupo } from '../../types/api'
import CargaPorPessoaChart from './CargaPorPessoaChart'
import { comVinculo, rotuloGrupo } from './volumetria.model'

export default function ComparativoCarga({ grupo, onAbrir }: {
  grupo: VolumetriaGrupo
  onAbrir: (userId: string) => void
}) {
  const [aberto, setAberto] = useState(false)
  const rotulo = rotuloGrupo(grupo.papel)
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-header">
        <div>
          <div className="card-title">Comparativo de carga</div>
          <p className="card-sub">Horas estimadas de análise por {rotulo.singular}, lado a lado. Clique numa barra para abrir a pessoa.</p>
        </div>
        <button type="button" className="vol-toggle" onClick={() => setAberto((v) => !v)} aria-expanded={aberto}>
          {aberto ? 'Recolher' : 'Mostrar gráfico'}
        </button>
      </div>
      {aberto && (
        <CargaPorPessoaChart
          grupo={grupo}
          pessoas={comVinculo(grupo)}
          selecionadoId={null}
          onSelecionar={onAbrir}
        />
      )}
    </div>
  )
}
