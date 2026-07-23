// Invalidação de cache centralizada, orientada a EVENTOS de domínio.
//
// Em vez de cada tela decidir quais queryKeys invalidar após uma mutação (fácil
// esquecer uma), declaramos aqui o que cada evento de negócio torna obsoleto.
// As telas só dizem "aconteceu X"; o mapeamento evento→chaves mora num lugar só.

import type { QueryClient } from '@tanstack/react-query'
import { queryRoots, type QueryRoot } from './queryKeys'

// Eventos de domínio que tornam dados derivados obsoletos, e quais raízes de
// query cada um invalida. Adicionar um novo consumidor = adicionar a raiz aqui,
// não caçar invalidateQueries pelas telas.
const EVENTO_INVALIDA: Record<string, QueryRoot[]> = {
  // Upload de censo/relatório recomputa quase tudo que é agregado (inclui o Kanban:
  // novos censos geram pendências e mudam quem está sem relatório).
  dadosAlterados: ['dashboard', 'dashboardOverview', 'diretoria', 'gestor', 'sidebar', 'equipe', 'kanban'],
  // Relatório adicionado a um paciente muda seu status_relatorio → sai das colunas
  // "Sem relatório"/"Vencidos" do Kanban e recomputa os agregados por status.
  relatorioAdicionado: ['kanban', 'dashboard', 'dashboardOverview', 'diretoria', 'gestor', 'sidebar'],
  // Mudança de configuração de operadora/hospital afeta stats e sidebar.
  configuracaoAlterada: ['configuracoes', 'sidebar', 'dashboard', 'dashboardOverview', 'diretoria'],
  // Mudança na equipe (profissionais/escala) afeta a contagem do sidebar.
  equipeAlterada: ['equipe', 'sidebar'],
  // Gestão de usuários.
  usuariosAlterados: ['usuarios'],
}

export type EventoDominio = keyof typeof EVENTO_INVALIDA

/**
 * Invalida todas as queries afetadas por um evento de domínio. O React Query
 * casa por prefixo, então invalidar a raiz cobre todas as variações de filtro.
 */
export function invalidarPorEvento(qc: QueryClient, evento: EventoDominio): void {
  for (const root of EVENTO_INVALIDA[evento]) {
    qc.invalidateQueries({ queryKey: queryRoots[root] })
  }
}
