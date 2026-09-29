// "Atend. 123 · Hospital X": linha de identificação da internação, com o nome do
// hospital clicável quando ele tem cadastro (abre a ficha do hospital).
import type { InternacaoDados } from '../../types/api'

export function SubtituloPaciente({ d, onAbrirHospital }: {
  d: InternacaoDados
  onAbrirHospital: () => void
}) {
  return (
    <>
      Atend. <span className="mono">{d.atendimento || '—'}</span> ·{' '}
      {d.hospital_key && d.hospital_nome ? (
        <button
          type="button"
          className="link-cell"
          title={`Ver detalhes de ${d.hospital_nome}`}
          onClick={onAbrirHospital}
        >
          {d.hospital_nome}
        </button>
      ) : (
        d.hospital_nome || '—'
      )}
    </>
  )
}
