// Bloco "Por região": quem responde por cada região e quanto ela carrega.
//
// A responsabilidade por região é DERIVADA, não atribuída: a pessoa recebe
// hospitais em Operações e cada hospital tem a sua região no cadastro. Por
// isso quem cobre duas regiões aparece nas duas, e um hospital coberto por
// duas pessoas conta uma vez só no total da região (senão a região pareceria
// maior do que é). Clicar num nome abre o drawer daquela pessoa.
import type { VolumetriaGrupo } from '../../types/api'
import { SEM_REGIAO } from '../../lib/regioes'
import { Badge } from '../ui'
import { fmtHoras } from './volumetria.model'

export default function PorRegiao({ grupo, onAbrir }: {
  grupo: VolumetriaGrupo
  onAbrir: (userId: string) => void
}) {
  const tecnico = grupo.role_operacional === 'tecnico'
  if (grupo.regioes.length === 0) return null

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-header">
        <div>
          <div className="card-title">Por região</div>
          <p className="card-sub">
            Quem responde por cada região e o que há sob a responsabilidade dela.
            A região vem do cadastro do hospital.
          </p>
        </div>
      </div>

      <div className="vol-reg-lista">
        {grupo.regioes.map((r) => (
          <div className="vol-reg-linha" key={r.regiao}>
            <div className="vol-reg-nome">
              {r.regiao}
              {r.regiao === SEM_REGIAO && (
                <span title="Estes hospitais não têm região no cadastro. Defina a região na ficha do hospital.">
                  <Badge variant="warning">sem cadastro</Badge>
                </span>
              )}
            </div>
            <div className="vol-reg-nums">
              {tecnico && (
                <span><b>{r.pacientes}</b> {r.pacientes === 1 ? 'paciente' : 'pacientes'}</span>
              )}
              <span><b>{r.hospitais}</b> {r.hospitais === 1 ? 'hospital' : 'hospitais'}</span>
              <span><b>{r.pendencias}</b> {r.pendencias === 1 ? 'demanda' : 'demandas'}</span>
              <span>{fmtHoras(r.horas)}</span>
            </div>
            <div className="vol-reg-resp">
              {r.responsaveis.map((p) => (
                <button
                  type="button"
                  key={p.user_id}
                  className="vol-reg-pessoa"
                  onClick={() => onAbrir(p.user_id)}
                  title={`Ver a área de ${p.nome}`}
                >
                  {p.nome}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
