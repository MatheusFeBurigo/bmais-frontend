// Hospitais com pendência que NINGUÉM do grupo cobre (vínculo explícito), com
// atribuição rápida a uma pessoa. Só renderiza quando há algum.
import { useState } from 'react'
import type { VolumetriaGrupo } from '../../types/api'
import { useVincularVolumetria } from '../../hooks/useVolumetria'
import { OpAvatar } from '../ui'
import { fmtDias, fmtHoras, rotuloGrupo } from './volumetria.model'

export default function HospitaisSemCobertura({ grupo, onErro }: {
  grupo: VolumetriaGrupo
  onErro: (msg: string) => void
}) {
  const vincular = useVincularVolumetria()
  // Qual linha está gravando: desabilita só ela, não a lista toda.
  const [gravando, setGravando] = useState<string | null>(null)
  const rotulo = rotuloGrupo(grupo.papel)
  const lista = grupo.sem_cobertura
  if (lista.length === 0) return null

  function atribuir(hospitalKey: string, userId: string) {
    if (!userId) return
    setGravando(hospitalKey)
    vincular.mutate({ hospitalKey, userId }, {
      onError: () => onErro('Não foi possível atribuir o hospital. Tente de novo.'),
      onSettled: () => setGravando(null),
    })
  }

  return (
    <div className="card" id="vol-sem-cobertura" style={{ marginTop: 16 }}>
      <div className="card-header">
        <div>
          <div className="card-title" style={{ color: 'var(--danger)' }}>
            Hospitais sem cobertura ({lista.length})
          </div>
          <p className="card-sub">
            Têm pendência e nenhum {rotulo.singular} vinculado. Atribua a alguém para entrar na carga.
          </p>
        </div>
      </div>
      <div>
        {lista.map((h) => (
          <div className="vol-sc" key={h.hospital_key}>
            {h.operadora_key ? <OpAvatar opKey={h.operadora_key} size={28} /> : <span />}
            <span style={{ minWidth: 0 }}>
              <div className="vol-hosp-nome" title={h.hospital_nome}>{h.hospital_nome}</div>
              <div className="vol-hosp-sub">
                {grupo.role_operacional === 'administrativo'
                  ? (h.dias_sem_censo != null ? `sem censo há ${h.dias_sem_censo} ${h.dias_sem_censo === 1 ? 'dia' : 'dias'}` : 'sem censo')
                  : `${h.pendencias} ${h.pendencias === 1 ? 'caso' : 'casos'}`}
              </div>
            </span>
            <span className="vol-hosp-n" style={{ color: 'var(--danger)' }}>{fmtHoras(h.horas)}</span>
            <select
              className="bm-input bm-select"
              style={{ fontSize: 'var(--t-sm)' }}
              value=""
              disabled={gravando === h.hospital_key || grupo.pessoas.length === 0}
              onChange={(e) => atribuir(h.hospital_key, e.target.value)}
              aria-label={`Atribuir ${h.hospital_nome} a um ${rotulo.singular}`}
            >
              <option value="">
                {gravando === h.hospital_key ? 'Atribuindo…' : 'Atribuir a…'}
              </option>
              {grupo.pessoas.map((p) => (
                <option key={p.user_id} value={p.user_id}>
                  {p.nome}{p.sem_vinculo ? ' (sem área definida)' : ` · ${fmtDias(p.dias_fila)} de fila`}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
