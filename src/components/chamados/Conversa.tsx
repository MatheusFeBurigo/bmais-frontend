// A conversa de um chamado: cabeçalho, mensagens e o campo de resposta.
// Componente puro: recebe a conversa pronta e devolve as ações por callback.
import { useEffect, useRef, useState } from 'react'
import { Badge } from '../ui'
import { ROLE_LABEL } from '../../lib/usuarioRoles'
import type { ConversaChamado } from '../../services/chamados.service'
import { MENSAGEM_MAX, STATUS_LABEL, STATUS_VARIANT, finalizado, quando } from './rotulos'

interface Props {
  conversa: ConversaChamado
  /** Quem lê é do suporte (mostra de quem é o chamado). */
  atende: boolean
  enviando: boolean
  mudandoSituacao: boolean
  /** Devolve true se a mensagem foi aceita: só então o campo é limpo. */
  onEnviar: (texto: string) => Promise<boolean>
  onEncerrar: () => void
  onCancelar: () => void
  onReabrir: () => void
  onVoltar: () => void
}

const IconVoltar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M11 18l-6-6 6-6" /></svg>
)

const IconEnviar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4Z" /></svg>
)

export default function Conversa({
  conversa, atende, enviando, mudandoSituacao, onEnviar, onEncerrar, onCancelar, onReabrir,
  onVoltar,
}: Props) {
  const { chamado, mensagens } = conversa
  const [texto, setTexto] = useState('')
  const fim = useRef<HTMLDivElement>(null)
  const terminou = finalizado(chamado.status)

  // Mensagem nova (minha ou do outro lado) rola para o fim. Depende da
  // QUANTIDADE, e não da lista: a revalidação devolve uma lista nova a cada
  // 10s, e rolar nela arrancaria a pessoa do trecho antigo que está relendo.
  useEffect(() => {
    fim.current?.scrollIntoView({ block: 'end' })
  }, [chamado.id, mensagens.length])

  async function enviar() {
    const limpo = texto.trim()
    if (!limpo || enviando) return
    if (await onEnviar(limpo)) setTexto('')
  }

  return (
    <section className="chm-conversa" aria-label={`Chamado: ${chamado.assunto}`}>
      <header className="chm-conv-topo">
        <button type="button" className="btn btn-ghost btn-sm chm-conv-voltar"
          onClick={onVoltar} aria-label="Voltar à lista" title="Voltar à lista">
          <IconVoltar />
        </button>
        <div className="chm-conv-titulos">
          <h2 className="chm-conv-assunto">{chamado.assunto}</h2>
          <p className="chm-conv-meta">
            <Badge variant={STATUS_VARIANT[chamado.status]} dot>{STATUS_LABEL[chamado.status]}</Badge>
            {atende && !chamado.meu && (
              <span>
                {chamado.autor_nome}
                {chamado.autor_role && <> · {ROLE_LABEL[chamado.autor_role] ?? chamado.autor_role}</>}
              </span>
            )}
            <span>Aberto em {quando(chamado.criado_em)}</span>
          </p>
        </div>
        {/* O servidor diz o que esta pessoa pode fazer: cancelar é de quem
            abriu, encerrar é do suporte. Cancelar vem primeiro e sem destaque,
            longe do botão que o suporte mais usa. */}
        {chamado.pode_cancelar && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelar}
            disabled={mudandoSituacao}>
            Cancelar chamado
          </button>
        )}
        {chamado.pode_encerrar && (
          <button type="button" className="btn btn-outline btn-sm" onClick={onEncerrar}
            disabled={mudandoSituacao}>
            Encerrar
          </button>
        )}
      </header>

      <div className="chm-mensagens">
        {mensagens.map((m) => (
          <div key={m.id} className={`chm-msg${m.minha ? ' minha' : ''}`}>
            <div className="chm-msg-quem">
              <span className="chm-msg-nome">{m.minha ? 'Você' : (m.autor_nome ?? 'Sem nome')}</span>
              {m.do_suporte && <span className="chm-msg-selo">Suporte</span>}
              <span className="chm-msg-hora">{quando(m.criado_em)}</span>
            </div>
            <div className="chm-msg-texto">{m.texto}</div>
          </div>
        ))}
        <div ref={fim} />
      </div>

      {terminou ? (
        <div className="chm-encerrado">
          <span>{chamado.status === 'cancelado' ? 'Chamado cancelado' : 'Chamado encerrado'}</span>
          {chamado.pode_reabrir && (
            <button type="button" className="btn btn-outline btn-sm" onClick={onReabrir}
              disabled={mudandoSituacao}>
              Reabrir
            </button>
          )}
        </div>
      ) : (
        <form className="chm-escrever" onSubmit={(e) => { e.preventDefault(); void enviar() }}>
          <textarea className="bm-input chm-campo" rows={2} value={texto}
            maxLength={MENSAGEM_MAX} placeholder="Escreva sua mensagem"
            aria-label="Mensagem" disabled={enviando}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              // Enter envia, Shift+Enter quebra a linha. Durante a composição
              // (acento, teclado de outro idioma) o Enter confirma a letra.
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                void enviar()
              }
            }} />
          <button type="submit" className="btn btn-primary" disabled={enviando || !texto.trim()}>
            <IconEnviar />
            {enviando ? 'Enviando…' : 'Enviar'}
          </button>
        </form>
      )}
    </section>
  )
}
