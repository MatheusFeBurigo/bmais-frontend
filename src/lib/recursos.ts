// Recursos de tela ocultos sem apagar o código: para religar, basta virar a
// chave, e a tela e a Ajuda voltam juntas.

/** "Registrar relatório" e "Agendar visita" no painel lateral do paciente
 *  (PacienteDrawer, a ficha rápida da Visão Geral e de Tarefas). Ocultos em
 *  08/10/2026 a pedido do usuário ("apenas oculte por enquanto"): o relatório
 *  se registra pela modal da ficha Detalhes; agendar visita fica sem entrada na
 *  tela enquanto isso (era o único lugar), e as colunas "Aguardando visita" e
 *  "Visitas atrasadas" só mostram o que já estava agendado. */
export const ACOES_NO_PAINEL = false
