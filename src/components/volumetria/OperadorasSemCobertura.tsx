// Grupo operacional: hospitais com censo atrasado que ninguém cobra,
// agrupados pela OPERADORA. O operacional responde por operadora (08/10/2026),
// então é ela que se atribui: dar a Bradesco a alguém cobre todos os hospitais
// dela de uma vez. Só renderiza quando há alguma.
import { useState } from 'react'
import type { VolumetriaGrupo } from '../../types/api'
import { useVincularOperadoraVolumetria } from '../../hooks/useVolumetria'
import { OpAvatar } from '../ui'

// Quantos hospitais aparecem por extenso antes de "+N".
const NOMES_VISIVEIS = 3

export default function OperadorasSemCobertura({ grupo, onErro }: {
  grupo: VolumetriaGrupo
  onErro: (msg: string) => void
}) {
  const vincular = useVincularOperadoraVolumetria()
  // Qual linha está gravando: desabilita só ela, não a lista toda.
  const [gravando, setGravando] = useState<string | null>(null)
  const lista = grupo.operadoras_sem_cobertura ?? []
  // Só quem responde por operadora recebe operadora (o coordenador segue por hospital).
  const operacionais = grupo.pessoas.filter((p) => p.por_operadora)
  if (lista.length === 0) return null
  const hospitais = new Set(lista.flatMap((o) => o.hospitais.map((h) => h.hospital_key))).size

  function atribuir(operadoraKey: string, userId: string) {
    if (!userId) return
    setGravando(operadoraKey)
    vincular.mutate({ operadoraKey, userId }, {
      onError: () => onErro('Não foi possível atribuir a operadora. Tente de novo.'),
      onSettled: () => setGravando(null),
    })
  }

  return (
    <div className="card" id="vol-sem-cobertura" style={{ marginTop: 16 }}>
      <div className="card-header">
        <div>
          <div className="card-title" style={{ color: 'var(--danger)' }}>
            Operadoras sem cobertura ({lista.filter((o) => o.operadora_key).length})
          </div>
          <p className="card-sub">
            {hospitais} {hospitais === 1 ? 'hospital está' : 'hospitais estão'} com censo atrasado e nenhum
            operacional responde pela operadora. Atribua a operadora a alguém para entrar na carga.
          </p>
        </div>
      </div>
      <div className="card-body">
        {lista.map((o) => {
          const nomes = o.hospitais.map((h) => h.hospital_nome)
          const resumo = nomes.slice(0, NOMES_VISIVEIS).join(', ')
            + (nomes.length > NOMES_VISIVEIS ? ` +${nomes.length - NOMES_VISIVEIS}` : '')
          const chave = o.operadora_key ?? '__sem_operadora__'
          return (
            <div className="vol-sc" key={chave}>
              {o.operadora_key ? <OpAvatar opKey={o.operadora_key} size={28} /> : <span />}
              <span style={{ minWidth: 0 }}>
                <div className="vol-hosp-nome">
                  {o.operadora_nome ?? 'Sem operadora no cadastro'} · {o.hospitais.length} {o.hospitais.length === 1 ? 'hospital' : 'hospitais'}
                </div>
                <div className="vol-hosp-sub" title={nomes.join(', ')}>{resumo}</div>
              </span>
              {o.operadora_key ? (
                <select
                  className="bm-input bm-select"
                  style={{ fontSize: 'var(--t-sm)' }}
                  value=""
                  disabled={gravando === o.operadora_key || operacionais.length === 0}
                  onChange={(e) => atribuir(o.operadora_key as string, e.target.value)}
                  aria-label={`Atribuir ${o.operadora_nome} a um operacional`}
                >
                  <option value="">
                    {gravando === o.operadora_key ? 'Atribuindo…' : 'Atribuir a…'}
                  </option>
                  {operacionais.map((p) => (
                    <option key={p.user_id} value={p.user_id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="vol-hosp-sub">Sem operadora para atribuir: falta no cadastro do hospital</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
