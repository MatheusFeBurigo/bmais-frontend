// Modal "Novo chamado": o assunto e a primeira mensagem, juntos. Abrir só com
// o assunto obrigaria o suporte a perguntar qual é a dúvida antes de ajudar.
import { useState } from 'react'
import { Modal } from '../ui'
import { ASSUNTO_MAX, MENSAGEM_MAX } from './rotulos'

const rotulo = { display: 'block', marginBottom: 5, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 as const }

// Mesmo piso do servidor (schemas.AbrirChamado).
const ASSUNTO_MIN = 3

interface Props {
  salvando: boolean
  erro: string
  onClose: () => void
  onAbrir: (assunto: string, mensagem: string) => void
}

export default function NovoChamadoModal({ salvando, erro, onClose, onAbrir }: Props) {
  const [assunto, setAssunto] = useState('')
  const [mensagem, setMensagem] = useState('')
  const pronto = assunto.trim().length >= ASSUNTO_MIN && mensagem.trim() !== ''

  return (
    <Modal
      title="Novo chamado"
      onClose={onClose}
      largura={520}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" disabled={salvando || !pronto}
            onClick={() => onAbrir(assunto.trim(), mensagem.trim())}>
            {salvando ? 'Abrindo…' : 'Abrir chamado'}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label className="uppercase t-muted" style={rotulo} htmlFor="chm-assunto">Assunto</label>
          <input id="chm-assunto" className="bm-input" type="text" value={assunto} autoFocus
            maxLength={ASSUNTO_MAX} disabled={salvando}
            onChange={(e) => setAssunto(e.target.value)} />
        </div>
        <div>
          <label className="uppercase t-muted" style={rotulo} htmlFor="chm-mensagem">Mensagem</label>
          <textarea id="chm-mensagem" className="bm-input chm-campo" rows={6} value={mensagem}
            maxLength={MENSAGEM_MAX} disabled={salvando}
            onChange={(e) => setMensagem(e.target.value)} />
        </div>
        {erro && <p className="chm-erro" role="alert">{erro}</p>}
      </div>
    </Modal>
  )
}
