// Detalhes do hospital, abertos de qualquer lugar onde um hospital é citado:
// a coluna "Hospital" das listas de internados e o cabeçalho do paciente
// (drawer e ficha completa). É uma consulta de contexto no meio do trabalho
// ("quem atendo aqui? para quem eu ligo?"), então é SOMENTE LEITURA: a edição
// da ficha mora em Operações/Configurações, telas que os papéis operacionais
// nem enxergam.
//
// A listagem só carrega key/nome, por isso a ficha vem por GET /api/hospital/{key}
// quando o modal abre — antes disso nenhuma chamada é feita.
import type { Hospital, OperadoraVinculo } from '../types/api'
import { Modal, OpAvatar, LoadingState } from './ui'
import { useHospital } from '../hooks/useHospital'

/** Campos da ficha exibidos, na ordem. Ausentes viram "—", nunca somem: a
 *  lacuna é informação (o cadastro está incompleto). */
const CAMPOS: readonly { key: keyof Hospital; label: string; largura?: 'inteira' }[] = [
  { key: 'telefone', label: 'Telefone' },
  { key: 'email', label: 'E-mail' },
  { key: 'cnpj', label: 'CNPJ' },
  { key: 'regiao', label: 'Região' },
  { key: 'endereco', label: 'Endereço', largura: 'inteira' },
  { key: 'cidade', label: 'Cidade' },
  { key: 'uf', label: 'UF' },
  { key: 'cep', label: 'CEP' },
]

function texto(v: unknown): string {
  return typeof v === 'string' && v.trim() ? v : '—'
}

const rotuloStyle = {
  fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '.08em',
  fontWeight: 700 as const, color: 'var(--muted)', marginBottom: 2,
}

export interface HospitalDetalhesModalProps {
  /** Hospital clicado. `nome` vem da linha e já aparece no título enquanto carrega. */
  hospital: { key: string; nome: string }
  onClose: () => void
  /** Ausente = o usuário não tem a tela de cadastro; o atalho não é oferecido. */
  onAbrirCadastro?: (key: string) => void
  /** Aberta de dentro de outra camada (o drawer do paciente), que tem z-index
   *  maior que o backdrop padrão de modal. */
  sobreposta?: boolean
}

export default function HospitalDetalhesModal({
  hospital, onClose, onAbrirCadastro, sobreposta,
}: HospitalDetalhesModalProps) {
  const { data, isLoading, isError, error } = useHospital(hospital.key)

  const vinculadas: OperadoraVinculo[] = data?.operadoras_nomes
    ?? (data?.operadoras ?? []).map((k) => ({ key: k, nome: k }))

  return (
    <Modal
      title={data?.nome || hospital.nome}
      onClose={onClose}
      largura={560}
      sobreposta={sobreposta}
      footer={
        <>
          {onAbrirCadastro && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onAbrirCadastro(hospital.key)}
            >
              Abrir cadastro
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={onClose}>Fechar</button>
        </>
      }
    >
      {isLoading && <LoadingState label="Carregando hospital…" />}

      {isError && (
        <div style={{ fontSize: 'var(--t-sm)', color: 'var(--danger)' }}>
          Não foi possível carregar a ficha: {(error as Error)?.message || 'erro desconhecido'}
        </div>
      )}

      {data && (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Movimento atual — o motivo mais comum de abrir isto no meio do
              painel: quantos pacientes desta casa estão em aberto agora. */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[
              { label: 'Internados', valor: data.internados, tom: undefined },
              { label: 'Urgentes', valor: data.urgente, tom: 'var(--danger)' },
              { label: 'Altas', valor: data.altas, tom: undefined },
            ].map((k) => (
              <div key={k.label} className="dk">
                <div style={rotuloStyle}>{k.label}</div>
                <div className="mono" style={{ fontSize: 'var(--t-lg)', fontWeight: 700, color: k.tom }}>
                  {k.valor ?? 0}
                </div>
              </div>
            ))}
          </div>

          <div>
            <div style={rotuloStyle}>Operadoras atendidas</div>
            {vinculadas.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {vinculadas.map((o) => (
                  <span
                    key={o.key}
                    className="row"
                    style={{
                      gap: 6, alignItems: 'center', padding: '4px 8px 4px 5px',
                      background: 'var(--surface-3)', border: '1px solid var(--border)',
                      borderRadius: 'var(--r-md)', fontSize: 'var(--t-sm)', fontWeight: 600,
                    }}
                  >
                    <OpAvatar opKey={o.key} size={18} />
                    {o.nome}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
                Nenhuma operadora vinculada.
              </div>
            )}
          </div>

          <div>
            <div style={{ ...rotuloStyle, marginBottom: 6 }}>Dados cadastrais</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px 16px' }}>
              {CAMPOS.map((c) => (
                <div key={String(c.key)} style={{ gridColumn: c.largura === 'inteira' ? 'span 2' : undefined }}>
                  <div style={rotuloStyle}>{c.label}</div>
                  <div style={{ fontSize: 'var(--t-sm)' }}>{texto(data[c.key])}</div>
                </div>
              ))}
            </div>
          </div>

          {texto(data.observacoes) !== '—' && (
            <div>
              <div style={rotuloStyle}>Observações</div>
              <div style={{ fontSize: 'var(--t-sm)', whiteSpace: 'pre-wrap' }}>{data.observacoes}</div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
