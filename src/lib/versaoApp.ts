// Nova versão publicada: a aba aberta roda o código de quando foi carregada, e
// só um recarregamento traz o deploy novo. Sem aviso, o usuário fica dias na
// versão velha (e um chunk lazy que sumiu no deploy quebra a tela ao abrir).
//
// O build grava a sua identidade no app e em /version.json (vite.config.ts).
// Aqui comparamos as duas: a do app é a desta aba; a do arquivo, a do deploy
// atual (servido sem cache, ver vercel.json).
import { useEffect, useState } from 'react'

const VERSAO_DA_ABA = import.meta.env.VITE_APP_VERSAO as string | undefined
const INTERVALO_MS = 5 * 60 * 1000

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

/** True quando há um deploy mais novo que o desta aba. Em dev nunca dispara. */
export function useNovaVersao(): boolean {
  const [nova, setNova] = useState(false)

  useEffect(() => {
    if (import.meta.env.DEV || !VERSAO_DA_ABA || nova) return
    let vivo = true
    async function conferir() {
      const publicada = await versaoPublicada()
      if (vivo && publicada && publicada !== VERSAO_DA_ABA) setNova(true)
    }
    // Voltar à aba depois de horas é o caso típico de versão velha: confere na hora.
    function aoVoltar() {
      if (document.visibilityState === 'visible') conferir()
    }
    conferir()
    const id = window.setInterval(conferir, INTERVALO_MS)
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      vivo = false
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [nova])

  return nova
}
