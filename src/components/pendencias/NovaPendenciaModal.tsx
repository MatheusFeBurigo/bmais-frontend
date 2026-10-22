// Nova pendência avulsa (21/10/2026): o gestor ou o coordenador pede algo a
// alguém da equipe ("um nome de paciente, algum email urgente, ou alguma tarefa
// específica"). Só o título e quem recebe são obrigatórios. Aberta pelo painel
// de Tarefas (escolhe a pessoa) ou pela pessoa na Distribuição (já escolhida).
//
// Erro do backend aparece aqui dentro e a modal continua aberta: fechar
// perderia o que foi digitado.
import { useState } from 'react'
import { useCriarPendencia, useEquipePendencias } from '../../hooks/usePendencias'
import { hojeISO } from '../../lib/datas'
import { ROLE_LABEL } from '../../lib/usuarioRoles'
import { Modal, Spinner } from '../ui'

const TITULO_MAX = 200
const DESCRICAO_MAX = 2000
const PACIENTE_MAX = 200

export function NovaPendenciaModal({ responsavel, onFeito, onClose, sobreposta }: {
  /** Pessoa já escolhida (Distribuição); sem ela, a modal lista a equipe. */
  responsavel?: { user_id: string; nome: string }
  onFeito: (aviso: string) => void
  onClose: () => void
  sobreposta?: boolean
}) {
  const equipe = useEquipePendencias(!responsavel)
  const criar = useCriarPendencia()
  const [para, setPara] = useState(responsavel?.user_id ?? '')
  const [titulo, setTitulo] = useState('')
  const [paciente, setPaciente] = useState('')
  const [descricao, setDescricao] = useState('')
  const [prazo, setPrazo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const pronto = Boolean(para) && titulo.trim().length > 0

  function salvar() {
    if (!pronto || criar.isPending) return
    setErro(null)
    criar.mutate({ responsavel: para, titulo, paciente, descricao, prazo }, {
      onSuccess: (r) => {
        onFeito(`✓ Pendência enviada para ${r.pendencia.responsavel_nome || responsavel?.nome || 'a pessoa'}`)
        onClose()
      },
      onError: (e) => setErro((e as Error).message || 'Não foi possível salvar. Tente de novo.'),
    })
  }

  return (
    <Modal
      title="Nova pendência"
      onClose={criar.isPending ? () => {} : onClose}
      sobreposta={sobreposta}
      largura={520}
      footer={
        <>
          <button type="button" className="btn btn-outline btn-sm" disabled={criar.isPending} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary btn-sm" disabled={!pronto || criar.isPending} onClick={salvar}>
            {criar.isPending && <Spinner size={12} />}
            Enviar pendência
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <label className="pd-campo">
          <span className="form-lbl">Para<span className="req">*</span></span>
          {responsavel ? (
            <input className="bm-input" value={responsavel.nome} readOnly />
          ) : (
            <select className="bm-input bm-select" value={para} onChange={(e) => setPara(e.target.value)}
                    disabled={equipe.isLoading}>
              <option value="">{equipe.isLoading ? 'Carregando a equipe…' : 'Escolher a pessoa'}</option>
              {equipe.data?.pessoas.map((p) => (
                <option key={p.user_id} value={p.user_id}>{p.nome} · {ROLE_LABEL[p.role] ?? p.role}</option>
              ))}
            </select>
          )}
          {equipe.isError && <span className="t-danger pd-erro">Não foi possível carregar a equipe.</span>}
        </label>
        <label className="pd-campo">
          <span className="form-lbl">O que fazer<span className="req">*</span></span>
          <input className="bm-input" autoFocus maxLength={TITULO_MAX} value={titulo}
                 placeholder="Ex.: Responder o e-mail urgente da operadora"
                 onChange={(e) => setTitulo(e.target.value)} />
        </label>
        <div className="pd-par">
          <label className="pd-campo">
            <span className="form-lbl">Paciente</span>
            <input className="bm-input" maxLength={PACIENTE_MAX} value={paciente}
                   placeholder="Nome ou atendimento" onChange={(e) => setPaciente(e.target.value)} />
          </label>
          <label className="pd-campo">
            <span className="form-lbl">Prazo</span>
            <input className="bm-input" type="date" min={hojeISO()} value={prazo}
                   onChange={(e) => setPrazo(e.target.value)} />
          </label>
        </div>
        <label className="pd-campo">
          <span className="form-lbl">Detalhes</span>
          <textarea className="bm-input" rows={4} maxLength={DESCRICAO_MAX} value={descricao}
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    onChange={(e) => setDescricao(e.target.value)} />
        </label>
        {erro && <div className="t-danger" role="alert" style={{ fontSize: 'var(--t-sm)' }}>{erro}</div>}
      </div>
    </Modal>
  )
}
