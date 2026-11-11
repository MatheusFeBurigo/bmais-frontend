// Nova versão publicada: a aba aberta roda o código de quando foi carregada, e
// só um recarregamento traz o deploy novo. Sem aviso, o usuário fica dias na
// versão velha (e um chunk lazy que sumiu no deploy quebra a tela ao abrir).
//
// O build grava a sua identidade no app e em /version.json (vite.config.ts).
// Aqui comparamos as duas: a do app é a desta aba; a do arquivo, a do deploy
// atual (servido sem cache, ver vercel.json).
//
// Recarga automática (11/11/2026, pedido do usuário: "toda vez que eu subir algo
// pro sistema ele automaticamente já carregar"). Antes a aba só avisava e
// esperava o clique em "Atualizar agora". Agora ela recarrega sozinha, mas só
// num momento SEGURO, porque um F5 no meio do trabalho apaga o que não foi
// gravado (o relatório sendo escrito, a conferência de um envio):
//
//   - nada aberto: modal, gaveta, campo em foco, campo digitado que ainda está
//     na tela, gravação em andamento, ou uma tela que pediu para segurar
//     (`useSegurarAtualizacao`, como a de Envio com arquivo ou resultado);
//   - e a pessoa não está no meio de um gesto: acabou de trocar de tela, a aba
//     está em segundo plano, ou ela está parada há `OCIOSO_MS`.
//
// Enquanto não dá, o cartão fica na tela com "Atualizar agora". Se a aba já
// recarregou uma vez para esta versão e continua velha (cache no caminho), não
// insiste: fica só o cartão, para não entrar em laço.
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const VERSAO_DA_ABA = import.meta.env.VITE_APP_VERSAO as string | undefined
const INTERVALO_MS = 2 * 60 * 1000
// Com versão nova à espera, de quanto em quanto tempo a aba confere se já pode.
const TIQUE_MS = 5 * 1000
// Sem clicar, digitar nem rolar há este tempo: a pessoa não está no meio de nada.
const OCIOSO_MS = 60 * 1000
const CHAVE_RECARGA = 'bmais_recarga_versao'
const CHAVE_CHUNK = 'bmais_recarga_chunk'
const EVENTO_NOVA = 'bmais:versao-nova'

async function versaoPublicada(): Promise<string | null> {
  try {
    const r = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!r.ok) return null
    const dados = (await r.json()) as { versao?: string }
    return dados.versao ?? null
  } catch {
    // Rede caiu: não é versão nova. Tenta de novo no próximo ciclo.
    return null
  }
}

// ── O que segura a recarga ───────────────────────────────────────────────────

let segurando = 0

/** Segura a recarga automática até a função devolvida ser chamada (uma gravação
 *  em andamento, uma tela com trabalho que não sobrevive a um F5). */
export function segurarAtualizacao(): () => void {
  segurando += 1
  let solto = false
  return () => {
    if (solto) return
    solto = true
    segurando -= 1
  }
}

/** Segura a recarga automática enquanto `ativo` for verdadeiro. */
export function useSegurarAtualizacao(ativo: boolean): void {
  useEffect(() => (ativo ? segurarAtualizacao() : undefined), [ativo])
}

// Campos em que a pessoa digitou ou escolheu algo. Saem quando somem da tela
// (a modal fechou, o formulário salvou e desmontou) ou quando ficam vazios.
const mexidos = new Set<Element>()
let ultimoGesto = Date.now()

if (typeof document !== 'undefined') {
  const marcar = (e: Event) => {
    if (e.target instanceof Element) mexidos.add(e.target)
  }
  document.addEventListener('input', marcar, true)
  document.addEventListener('change', marcar, true)
  const gesto = () => { ultimoGesto = Date.now() }
  for (const tipo of ['pointerdown', 'keydown', 'wheel', 'touchstart']) {
    document.addEventListener(tipo, gesto, { capture: true, passive: true })
  }
}

function editavel(el: Element | null): boolean {
  if (!el) return false
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true
  if (el instanceof HTMLInputElement) {
    return !['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color'].includes(el.type)
  }
  return el instanceof HTMLElement && el.isContentEditable
}

function temConteudo(el: Element): boolean {
  if (el instanceof HTMLInputElement) {
    if (el.type === 'file') return (el.files?.length ?? 0) > 0
    // Caixa e opção marcadas: mudou de propósito, e a tela ainda mostra a escolha.
    if (el.type === 'checkbox' || el.type === 'radio') return true
    return el.value.trim() !== ''
  }
  if (el instanceof HTMLTextAreaElement) return el.value.trim() !== ''
  if (el instanceof HTMLSelectElement) return true
  return el instanceof HTMLElement && (el.textContent ?? '').trim() !== ''
}

/** Há trabalho na tela que um recarregamento perderia? */
export function haTrabalhoAberto(): boolean {
  if (segurando > 0) return true
  if (document.querySelector('[aria-modal="true"], [role="dialog"], .modal-backdrop, .drawer-backdrop')) {
    return true
  }
  if (editavel(document.activeElement)) return true
  for (const el of mexidos) {
    if (!el.isConnected) {
      mexidos.delete(el)
      continue
    }
    if (temConteudo(el)) return true
  }
  return false
}

// ── Recarregar ───────────────────────────────────────────────────────────────

function lerSessao(chave: string): string | null {
  try {
    return sessionStorage.getItem(chave)
  } catch {
    return null
  }
}

function gravarSessao(chave: string, valor: string): void {
  try {
    sessionStorage.setItem(chave, valor)
  } catch {
    // Storage bloqueado: sem a trava de laço, mas a recarga segue valendo.
  }
}

/** Esta aba já recarregou sozinha para `versao` e continua velha? */
function jaTentou(versao: string): boolean {
  return lerSessao(CHAVE_RECARGA) === versao
}

function recarregarPara(versao: string): void {
  gravarSessao(CHAVE_RECARGA, versao)
  window.location.reload()
}

/** `vite:preloadError`: um pedaço da tela não carregou, quase sempre porque o
 *  deploy novo apagou os arquivos da versão desta aba. Recarrega se não há
 *  trabalho aberto (e se não acabou de fazer isso, para não entrar em laço);
 *  senão, mostra o cartão. Devolve true quando vai recarregar. */
export function aoFalharCarregamento(): boolean {
  window.dispatchEvent(new Event(EVENTO_NOVA))
  if (haTrabalhoAberto()) return false
  const ultima = Number(lerSessao(CHAVE_CHUNK) || 0)
  if (Date.now() - ultima < 30_000) return false
  gravarSessao(CHAVE_CHUNK, String(Date.now()))
  window.location.reload()
  return true
}

// ── Hooks ────────────────────────────────────────────────────────────────────

/** A versão publicada quando ela é mais nova que a desta aba; null se não.
 *  Em dev nunca dispara. */
export function useVersaoNova(): string | null {
  const [nova, setNova] = useState<string | null>(null)

  useEffect(() => {
    if (import.meta.env.DEV || !VERSAO_DA_ABA || nova) return
    let vivo = true
    async function conferir() {
      const publicada = await versaoPublicada()
      if (vivo && publicada && publicada !== VERSAO_DA_ABA) setNova(publicada)
    }
    // Voltar à aba depois de horas é o caso típico de versão velha: confere na hora.
    function aoVoltar() {
      if (document.visibilityState === 'visible') conferir()
    }
    conferir()
    const id = window.setInterval(conferir, INTERVALO_MS)
    document.addEventListener('visibilitychange', aoVoltar)
    window.addEventListener(EVENTO_NOVA, conferir)
    return () => {
      vivo = false
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', aoVoltar)
      window.removeEventListener(EVENTO_NOVA, conferir)
    }
  }, [nova])

  return nova
}

/** Recarrega a aba sozinha quando há versão nova e o momento é seguro (ver o
 *  topo). Devolve se a recarga automática ainda vai acontecer: falso quando a
 *  aba já tentou para esta versão e o cartão fica só com o botão. */
export function useAtualizacaoAutomatica(nova: string | null): boolean {
  const { key } = useLocation()
  const [rotaNoAviso, setRotaNoAviso] = useState<string | null>(null)
  const automatica = nova != null && !jaTentou(nova)

  // A rota em que a versão nova foi notada. Trocar de tela depois disso é o
  // momento mais natural para a recarga: o que estava na tela anterior já se foi.
  useEffect(() => {
    if (nova && rotaNoAviso == null) setRotaNoAviso(key)
  }, [nova, key, rotaNoAviso])

  useEffect(() => {
    if (!nova || !automatica || rotaNoAviso == null) return
    const versao = nova
    const trocouDeTela = key !== rotaNoAviso
    function tentar(motivoExtra = false) {
      if (haTrabalhoAberto()) return
      const parado = Date.now() - ultimoGesto >= OCIOSO_MS
      if (motivoExtra || document.visibilityState === 'hidden' || parado) recarregarPara(versao)
    }
    tentar(trocouDeTela)
    const id = window.setInterval(() => tentar(), TIQUE_MS)
    const aoMudarVisibilidade = () => tentar()
    document.addEventListener('visibilitychange', aoMudarVisibilidade)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', aoMudarVisibilidade)
    }
  }, [nova, automatica, key, rotaNoAviso])

  return automatica
}
