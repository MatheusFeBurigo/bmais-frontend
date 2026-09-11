// Política de atualização automática ("quase tempo real") da Visão Geral.
//
// O backend roda serverless (Vercel) e não mantém conexões abertas (SSE/WebSocket),
// então a forma viável de refletir ajustes feitos por OUTRAS sessões/usuários —
// upload de censo por outro analista, relatório do técnico, cron de cobranças,
// correções diretas no banco — é o próprio React Query revalidar em background:
// polling enquanto a aba está visível + refetch ao voltar o foco/reconectar.
// Mutações desta mesma aba já são cobertas pela invalidação por evento
// (lib/invalidation); esta política cobre o que acontece FORA dela.
//
// Intervalo: o backend cacheia os agregados por 30s (CACHE_TTL_SEGUNDOS) e só os
// recomputa antes disso quando uma mutação passa pelo middleware. Pollar mais
// rápido que o TTL devolveria o mesmo payload — 30s é o piso útil. Configurável
// em build por VITE_AUTO_REFRESH_MS (0 desliga o polling; foco/reconexão,
// invalidação por evento e o botão "Atualizar" continuam funcionando).

const PADRAO_MS = 30_000

function lerIntervalo(): number {
  const raw = import.meta.env.VITE_AUTO_REFRESH_MS as string | undefined
  if (raw === undefined || raw === '') return PADRAO_MS
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : PADRAO_MS
}

/** Intervalo efetivo do polling (ms). 0 = polling desligado. */
export const AUTO_REFRESH_MS = lerIntervalo()

/**
 * Opções de useQuery que ligam a revalidação automática. Espalhar (`...`) no
 * useQuery de cada dado que deve acompanhar o backend sem ação do usuário.
 */
export const opcoesAutoRefresh = {
  // Polling só com a aba visível (refetchIntervalInBackground=false é o default):
  // aba em segundo plano não gasta invocações; ao voltar, o foco revalida.
  refetchInterval: AUTO_REFRESH_MS > 0 ? AUTO_REFRESH_MS : false,
  // O default global (main.tsx) é false, para não "piscar" telas estáticas ao
  // alternar janelas. Aqui o dado é operacional e muda por fora — voltar à aba
  // deve trazer o estado atual (só refaz se passou do staleTime).
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  // Fresco pelo mesmo intervalo: renavegar para a tela dentro dele serve o cache
  // na hora; passado o intervalo, foco/montagem refazem em background.
  staleTime: AUTO_REFRESH_MS > 0 ? AUTO_REFRESH_MS : 60_000,
} as const
