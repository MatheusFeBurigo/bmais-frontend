// Aviso de pendência nova, em qualquer tela (27/10/2026). Pedido do usuário:
// "conseguimos colocar algum Pop-up quando essa pendência for gerada?".
//
// Avisa QUEM RECEBEU: as pendências que ainda não viu (GET /pendencias/novas,
// consultado de minuto em minuto, como o aviso de chamado). "Ver pendências"
// leva à aba, e abrir a aba marca tudo como visto no servidor. "Depois" só adia
// nesta sessão do navegador: sem abrir a aba, a pendência volta a avisar no
// próximo acesso, e uma pendência nova avisa na hora.
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { podeVer } from '../../auth/permissions'
import { usePendenciasNovas } from '../../hooks/usePendencias'
import { dataBR } from '../../lib/datas'
import type { Pendencia } from '../../types/api'
import { Modal } from '../ui'

const CHAVE_ADIADAS = 'bmais_pendencias_adiadas'

function lerAdiadas(): number[] {
  try {
    const v = JSON.parse(sessionStorage.getItem(CHAVE_ADIADAS) || '[]')
    return Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number') : []
  } catch {
    return []
  }
}

function gravarAdiadas(ids: number[]) {
  try {
    sessionStorage.setItem(CHAVE_ADIADAS, JSON.stringify(ids))
  } catch {
    /* sem storage: o aviso volta na próxima consulta, que é o comportamento seguro */
  }
}

export function AvisoPendencias() {
  const { role, perfilCarregando } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const ativo = !perfilCarregando && podeVer(role, 'kanban')
  const { data } = usePendenciasNovas(ativo)
  const [adiadas, setAdiadas] = useState<number[]>(lerAdiadas)

  // Na própria aba Pendências o aviso não aparece: ela já mostra tudo e marca como visto.
  const naAba = location.pathname === '/tarefas'
    && new URLSearchParams(location.search).get('aba') === 'pendencias'
  const novas = (data?.pendencias ?? []).filter((p) => !adiadas.includes(p.id))
  if (!ativo || naAba || novas.length === 0) return null

  function depois() {
    const ids = [...adiadas, ...novas.map((p) => p.id)]
    gravarAdiadas(ids)
    setAdiadas(ids)
  }

  function ver() {
    depois()
    navigate('/tarefas?aba=pendencias')
  }

  const uma = novas.length === 1
  return (
    <Modal
      title={uma ? 'Você recebeu uma pendência' : `Você recebeu ${novas.length} pendências`}
      onClose={depois}
      footer={(
        <>
          <button type="button" className="btn btn-ghost" onClick={depois}>Depois</button>
          <button type="button" className="btn btn-primary" onClick={ver}>Ver pendências</button>
        </>
      )}
    >
      <ListaPendenciasNovas pendencias={novas} />
    </Modal>
  )
}

/** O corpo do aviso, sem dados: também é o da réplica da Ajuda. */
export function ListaPendenciasNovas({ pendencias }: { pendencias: Pendencia[] }) {
  return (
    <>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
        {pendencias.slice(0, 5).map((p) => (
          <li key={p.id}>
            <strong>{p.titulo}</strong>
            <div className="t-muted" style={{ fontSize: 'var(--t-sm)' }}>
              {[p.criado_por_nome && `Pedida por ${p.criado_por_nome}`,
                p.paciente && `Paciente: ${p.paciente}`,
                p.prazo && `${p.vencida ? 'Venceu' : 'Prazo'} ${dataBR(p.prazo).slice(0, 5)}`]
                .filter(Boolean).join(' · ')}
            </div>
          </li>
        ))}
      </ul>
      {pendencias.length > 5 && (
        <p className="t-muted" style={{ marginTop: 8, fontSize: 'var(--t-sm)' }}>
          E mais {pendencias.length - 5}. Todas estão na aba Pendências de Tarefas.
        </p>
      )}
    </>
  )
}
