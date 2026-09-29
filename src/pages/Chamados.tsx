// Tela de Chamados: dúvidas de quem usa a plataforma, respondidas pelo suporte.
//
// A mesma tela serve os dois lados da conversa, cada um no seu endereço (ver
// RotaChamados em App.tsx). Quem atende (administrador) chega pelo item
// "Chamados" do menu Sistema, em /chamados. Os demais chegam pela Ajuda, em
// /ajuda/chamados, e a barra lateral segue no modo Ajuda. Cada pessoa vê os
// próprios chamados, e o suporte vê os de todos. Essa regra é do servidor
// (application/chamados.py); aqui só se lê `atende` para saber o que mostrar.
//
// A página orquestra: o chamado aberto e o "novo chamado" vivem na URL
// (?chamado= e ?novo=1), para o atalho da Ajuda abrir direto no formulário e
// para o endereço de uma conversa poder ser copiado.
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePageHeader } from '../components/PageHeader'
import Toast from '../components/Toast'
import { ConfirmarModal } from '../components/ConfirmarModal'
import Conversa from '../components/chamados/Conversa'
import ListaChamados, { type FiltroChamados } from '../components/chamados/ListaChamados'
import NovoChamadoModal from '../components/chamados/NovoChamadoModal'
import {
  useAbrirChamado, useCancelarChamado, useChamados, useConversa, useEncerrarChamado,
  useReabrirChamado, useResponderChamado,
} from '../hooks/useChamados'
import '../components/chamados/chamados.css'

const IconBalao = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12Z" /></svg>
)

const IconMais = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" /></svg>
)

export default function Chamados() {
  const [params, setParams] = useSearchParams()
  const idBruto = Number(params.get('chamado'))
  const abertoId = Number.isInteger(idBruto) && idBruto > 0 ? idBruto : null
  const criando = params.get('novo') === '1'

  const lista = useChamados()
  const conversa = useConversa(abertoId)
  const abrir = useAbrirChamado()
  const responder = useResponderChamado()
  const encerrar = useEncerrarChamado()
  const cancelar = useCancelarChamado()
  const reabrir = useReabrirChamado()

  const [filtro, setFiltro] = useState<FiltroChamados>('abertos')
  const [aviso, setAviso] = useState('')
  const [erroNovo, setErroNovo] = useState('')
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false)

  const atende = lista.data?.atende ?? false
  const chamados = lista.data?.chamados ?? []

  // `replace`: trocar de conversa não empilha histórico. O "voltar" do
  // navegador sai da tela, em vez de refazer chamado por chamado.
  const mudarUrl = useCallback((mudar: (p: URLSearchParams) => void) => {
    setParams((p) => {
      const novo = new URLSearchParams(p)
      mudar(novo)
      return novo
    }, { replace: true })
  }, [setParams])

  const abrirConversa = useCallback((id: number) => {
    mudarUrl((p) => { p.set('chamado', String(id)); p.delete('novo') })
  }, [mudarUrl])
  const fecharConversa = useCallback(() => mudarUrl((p) => p.delete('chamado')), [mudarUrl])
  const abrirNovo = useCallback(() => {
    setErroNovo('')
    mudarUrl((p) => p.set('novo', '1'))
  }, [mudarUrl])
  const fecharNovo = useCallback(() => mudarUrl((p) => p.delete('novo')), [mudarUrl])

  usePageHeader(useMemo(() => ({
    title: 'Chamados',
    subtitle: atende ? 'Dúvidas enviadas ao suporte' : 'Tire suas dúvidas com o suporte',
    actions: (
      <button type="button" className="btn btn-primary btn-sm" onClick={abrirNovo}>
        <IconMais />
        Novo chamado
      </button>
    ),
  }), [atende, abrirNovo]))

  function aoAbrir(assunto: string, mensagem: string) {
    setErroNovo('')
    abrir.mutate({ assunto, mensagem }, {
      onSuccess: ({ chamado }) => {
        setFiltro('abertos')
        abrirConversa(chamado.id)
      },
      onError: () => setErroNovo('Não foi possível abrir o chamado. Tente de novo.'),
    })
  }

  async function aoEnviar(texto: string): Promise<boolean> {
    if (abertoId == null) return false
    try {
      await responder.mutateAsync({ id: abertoId, texto })
      return true
    } catch {
      setAviso('Não foi possível enviar. Tente de novo.')
      return false
    }
  }

  function aoEncerrar() {
    if (abertoId == null) return
    encerrar.mutate(abertoId, {
      onSuccess: () => setAviso('Chamado encerrado'),
      onError: () => setAviso('Não foi possível encerrar. Tente de novo.'),
    })
  }

  function aoCancelar() {
    if (abertoId == null) return
    cancelar.mutate(abertoId, {
      onSuccess: () => { setConfirmandoCancelar(false); setAviso('Chamado cancelado') },
      onError: () => {
        setConfirmandoCancelar(false)
        setAviso('Não foi possível cancelar. Tente de novo.')
      },
    })
  }

  function aoReabrir() {
    if (abertoId == null) return
    reabrir.mutate(abertoId, {
      onSuccess: () => { setFiltro('abertos'); setAviso('Chamado reaberto') },
      onError: () => setAviso('Não foi possível reabrir. Tente de novo.'),
    })
  }

  return (
    <div className={`chm${abertoId != null ? ' com-conversa' : ''}`}>
      <ListaChamados chamados={chamados} atende={atende} filtro={filtro} onFiltro={setFiltro}
        abertoId={abertoId} onAbrir={abrirConversa} carregando={lista.isLoading} />

      {abertoId != null && conversa.data ? (
        // `key`: trocar de chamado remonta a conversa, e o rascunho de um não
        // vai parar no campo do outro.
        <Conversa key={conversa.data.chamado.id} conversa={conversa.data} atende={atende}
          enviando={responder.isPending}
          mudandoSituacao={encerrar.isPending || cancelar.isPending || reabrir.isPending}
          onEnviar={aoEnviar} onEncerrar={aoEncerrar}
          onCancelar={() => setConfirmandoCancelar(true)} onReabrir={aoReabrir}
          onVoltar={fecharConversa} />
      ) : (
        <div className="chm-sem-conversa">
          {abertoId != null && conversa.isLoading && <span>Carregando…</span>}
          {abertoId != null && conversa.isError && (
            <>
              <span>Não foi possível abrir este chamado.</span>
              <button type="button" className="btn btn-outline btn-sm" onClick={fecharConversa}>
                Voltar à lista
              </button>
            </>
          )}
          {abertoId == null && (
            <>
              <span className="chm-sem-conversa-icone"><IconBalao /></span>
              <span>{chamados.length > 0 ? 'Selecione um chamado' : 'Nenhum chamado ainda'}</span>
              {chamados.length === 0 && !lista.isLoading && (
                <button type="button" className="btn btn-primary btn-sm" onClick={abrirNovo}>
                  <IconMais />
                  Novo chamado
                </button>
              )}
            </>
          )}
        </div>
      )}

      {criando && (
        <NovoChamadoModal salvando={abrir.isPending} erro={erroNovo}
          onClose={fecharNovo} onAbrir={aoAbrir} />
      )}
      {/* Cancelar pede confirmação: "Cancelar" é também o nome do botão que
          desiste de uma ação, e um clique por engano tiraria o chamado da fila
          do suporte. Os rótulos dizem o que cada botão faz com o CHAMADO. */}
      {confirmandoCancelar && (
        <ConfirmarModal titulo="Cancelar chamado" confirmar="Cancelar chamado"
          cancelar="Voltar" perigo ocupado={cancelar.isPending}
          onConfirmar={aoCancelar} onCancelar={() => setConfirmandoCancelar(false)}>
          <p>O suporte deixa de atender este chamado.</p>
        </ConfirmarModal>
      )}
      {aviso && <Toast message={aviso} onDone={() => setAviso('')} />}
    </div>
  )
}
