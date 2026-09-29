// Regras de acesso por papel (role) — fonte única de verdade da UI.
//
// Mapeia cada papel às telas que ele NÃO pode ver. Sidebar e roteamento
// consultam `podeVer(role, screen)` para esconder o menu e bloquear a rota.
// Este gating é de UI/conveniência; a autorização definitiva é do backend.
//
// Para adicionar uma regra: inclua a screen em BLOQUEADAS[role]. Papéis sem
// entrada (ou role null) veem tudo por padrão.
import type { UserRole } from '../types/api'

// Identificador estável de cada tela navegável (independe da rota/label).
export type Screen =
  | 'operacional'
  | 'diretoria'
  | 'gestor'
  | 'configuracoes'
  | 'equipe'
  | 'upload'
  | 'kanban'
  | 'logs'
  | 'progresso'
  | 'volumetria'

// Telas que cada papel NÃO pode ver. Ausência de entrada = vê tudo.
const BLOQUEADAS: Partial<Record<UserRole, readonly Screen[]>> = {
  // Diretor vê tudo, exceto Equipe.
  diretor: ['equipe'],
  // Gestor: Gestor/Fluxo + Configurações, MAIS as visões do técnico e do
  // administrativo (Visão Geral e Tarefas), para acompanhar quem ele gerencia.
  // Fora Equipe e o envio de censos (espelha ROLES_ENVIO_CENSO no backend);
  // Diretoria sai pela allowlist EXCLUSIVAS, não daqui.
  gestor: ['equipe', 'upload'],
  // Administrativo: Operacional + Upload + Kanban (suas tarefas). Sem Diretoria, Gestor, Equipe, Configurações.
  administrativo: ['diretoria', 'gestor', 'equipe', 'configuracoes'],
  // Técnico: mesmo recorte do administrativo (segundo papel operacional básico).
  tecnico: ['diretoria', 'gestor', 'equipe', 'configuracoes'],
  // Analista interno: observa o Operacional, o Kanban e as Movimentações, e mantém
  // o cadastro da malha de atendimento em Operações (hospitais e operadoras) —
  // a exceção do papel, espelhada em ROLES_ESCRITA_CADASTRO no backend. Fora:
  // Diretoria e Gestor (decisão do produto), Upload e Configurações — telas cujo
  // conteúdo É a escrita que ele não pode executar (subir censo, regras da operadora).
  analista: ['diretoria', 'gestor', 'upload', 'configuracoes'],
  // Coordenadores: só a Operacional (contexto) + Volumetria (allowlist abaixo).
  // Fora tudo que é operação/gestão. A única escrita deles (vincular pessoa a
  // hospital) vive dentro da Volumetria — ver ROLES_ATRIBUIR_VOLUMETRIA no backend.
  coordenador_administrativo: ['diretoria', 'gestor', 'equipe', 'configuracoes', 'upload', 'kanban', 'logs'],
  coordenador_tecnico: ['diretoria', 'gestor', 'equipe', 'configuracoes', 'upload', 'kanban', 'logs'],
}

// Telas EXCLUSIVAS de papéis específicos (allowlist). Mais forte que a lista de
// bloqueio: quem não estiver aqui NÃO vê. Use para telas que pertencem à visão de
// papéis específicos — o Kanban é dos papéis operacionais (admin também vê, p/ supervisão).
const EXCLUSIVAS: Partial<Record<Screen, readonly UserRole[]>> = {
  // Diretoria e Gestor: o cargo MAIS o admin, que vê todas as telas (voltou em
  // 27/09/2026, depois de ficar fora desde 23/09). Allowlist, e não BLOQUEADAS,
  // para nenhum papel novo herdar estas telas por omissão. Espelha
  // ROLES_TELA_DIRETORIA/GESTOR no backend.
  diretoria: ['diretor', 'admin'],
  gestor: ['gestor', 'diretor', 'admin'],
  kanban: ['administrativo', 'tecnico', 'admin', 'analista', 'gestor'],
  // Operações (ex-Equipe): administrador e analista interno. Nem o diretor entra
  // — allowlist, para o papel novo não herdar a tela por omissão.
  equipe: ['admin', 'analista'],
  // Movimentações (auditoria): administrador e analista interno. Nem o diretor vê.
  // Espelha ROLES_AUDITORIA do backend (interface/authz.py).
  logs: ['admin', 'analista'],
  // Progresso (avanço da construção do produto): administração e diretoria.
  // É informação sobre o CONTRATO — o que já foi entregue e o que falta —, não
  // sobre a operação, então não chega a quem trabalha na assistência.
  progresso: ['admin', 'diretor'],
  // Volumetria: carga de trabalho por hospital, para os coordenadores decidirem
  // como dividir hospitais entre administrativos/técnicos. Admin vê para supervisão.
  volumetria: ['coordenador_administrativo', 'coordenador_tecnico', 'admin'],
}

// Papéis SOMENTE LEITURA: veem as telas, mas nenhuma ação que altera dados.
// Espelha ROLES_SOMENTE_LEITURA do backend, que é quem de fato barra (403) —
// aqui só escondemos os controles para não oferecer o que vai falhar.
const SOMENTE_LEITURA: ReadonlySet<UserRole> = new Set<UserRole>([
  'analista', 'coordenador_administrativo', 'coordenador_tecnico',
])

// Papéis dos PROFISSIONAIS da equipe assistencial (médico, enfermeiro). Não veem
// nenhuma tela interna: o RequireAuth os leva ao portal do profissional, fora do
// AppLayout. Espelha ROLES_PROFISSIONAL do backend, que os deixa fora de todo
// guard (403 em qualquer rota de dados).
const PROFISSIONAL: ReadonlySet<UserRole> = new Set<UserRole>(['medico', 'enfermeiro'])

/** True se a conta é de um médico/enfermeiro (portal próprio, sem telas internas). */
export function ehProfissional(role: UserRole | null): role is 'medico' | 'enfermeiro' {
  return !!role && PROFISSIONAL.has(role)
}

/** True se o papel não pode alterar dado nenhum (perfil de observação). */
export function ehSomenteLeitura(role: UserRole | null): boolean {
  return !!role && SOMENTE_LEITURA.has(role)
}

/** True se o papel pode ver a tela. `role` null/desconhecido não restringe. */
export function podeVer(role: UserRole | null, screen: Screen): boolean {
  if (!role) return true
  // Antes de tudo: as telas sem restrição (BLOQUEADAS vazia) liberariam o
  // profissional por omissão.
  if (PROFISSIONAL.has(role)) return false
  // Telas exclusivas: só os papéis listados veem (allowlist vence tudo).
  const exclusiva = EXCLUSIVAS[screen]
  if (exclusiva) return exclusiva.includes(role)
  const bloqueadas = BLOQUEADAS[role]
  return !bloqueadas?.includes(screen)
}

// Rota de cada tela navegável, para calcular o destino de fallback por papel.
const ROTA_DA_SCREEN: Record<Screen, string> = {
  operacional: '/',
  diretoria: '/diretoria',
  gestor: '/gestor',
  equipe: '/equipe',
  configuracoes: '/configuracoes',
  upload: '/upload',
  kanban: '/tarefas',
  logs: '/logs',
  progresso: '/progresso',
  volumetria: '/volumetria',
}

// Ordem de preferência ao escolher a "tela inicial" de um papel barrado.
const ORDEM_FALLBACK: readonly Screen[] = [
  'operacional', 'gestor', 'diretoria', 'kanban', 'logs', 'upload', 'configuracoes', 'equipe',
  'volumetria',
  // Progresso fica por último de propósito: é tela de acompanhamento, e cair
  // nela ao ser barrado em outra não ajudaria ninguém a trabalhar.
  'progresso',
]

// Ações do domínio protegidas por papel (não são telas, mas operações dentro de
// uma tela — ex.: um botão/formulário no drawer). Allowlist: só os papéis
// listados podem executar. Este gating é de UI; a autorização final é do backend.
const ACOES: Record<AcaoProtegida, readonly UserRole[]> = {
  // Registrar relatório no drawer: exclusivo do perfil técnico (admin supervisiona).
  registrarRelatorio: ['tecnico', 'admin'],
  // Cadastrar convênio na modal de edição do paciente. É cadastro, não operação:
  // o nome passa a existir para TODAS as telas e leva junto a operadora que o
  // cobre. Espelha `requer_diretor` na rota POST /api/convenios — os papéis
  // operacionais continuam escolhendo da lista e digitando texto livre.
  criarConvenio: ['diretor', 'admin'],
  // Agendar a visita: é o gatilho que move o card para "Aguardando visita", e
  // pertence a quem vai fazer a visita. Mesmo par de `registrarRelatorio`, mas em
  // constante própria — as duas podem divergir (ex.: liberar o agendamento ao
  // administrativo) sem reabrir quem registra relatório.
  agendarVisita: ['tecnico', 'admin'],
  // Atribuir o CID do paciente: trabalho do técnico (admin supervisiona). Os
  // demais papéis VEEM o CID no drawer, só não o alteram.
  atribuirCid: ['tecnico', 'admin'],
}

export type AcaoProtegida = 'registrarRelatorio' | 'criarConvenio' | 'agendarVisita' | 'atribuirCid'

/** True se o papel pode executar a ação. `role` null/desconhecido NÃO libera:
 *  ação sensível exige papel resolvido (diferente de `podeVer`, que é permissivo). */
export function podeExecutar(role: UserRole | null, acao: AcaoProtegida): boolean {
  if (!role || PROFISSIONAL.has(role)) return false
  // Perfil de observação não executa ação alguma — vale para as ações atuais e
  // para as futuras, sem precisar excluí-lo de cada allowlist.
  if (SOMENTE_LEITURA.has(role)) return false
  return ACOES[acao].includes(role)
}

// Tela Operações completa (profissionais, escala, acesso à plataforma e contas):
// administrador e analista interno. Espelha ROLES_GESTAO_OPERACOES do backend.
// A única parte fora do analista são as contas de ADMINISTRADOR (criar, promover,
// editar, suspender, trocar senha, apagar), que o backend recusa com 403.
const GESTAO_OPERACOES: ReadonlySet<UserRole> = new Set<UserRole>(['admin', 'analista'])

/** True se o papel gere a tela Operações inteira (inclusive contas de login). */
export function podeGerirOperacoes(role: UserRole | null): boolean {
  return !!role && GESTAO_OPERACOES.has(role)
}

/** True se o papel pode criar ou alterar uma conta com o papel informado.
 *  Conta de administrador é só do administrador. */
export function podeGerirConta(role: UserRole | null, alvo: UserRole | null | undefined): boolean {
  if (!podeGerirOperacoes(role)) return false
  return alvo !== 'admin' || role === 'admin'
}

/** True se o papel abre a ficha completa do paciente ("Detalhes"). O analista
 *  interno não abre (espelha ROLES_DETALHE_PACIENTE); o drawer segue aberto a ele. */
export function podeVerFichaPaciente(role: UserRole | null): boolean {
  return role !== 'analista'
}

/** Rota de destino ao barrar o acesso: a 1ª tela que o papel PODE ver.
 *  Ex.: coordenador barrado em "/kanban" cai em "/" (operacional). */
export function rotaFallback(role: UserRole | null): string {
  const primeira = ORDEM_FALLBACK.find((s) => podeVer(role, s))
  return primeira ? ROTA_DA_SCREEN[primeira] : '/'
}

// Rota de fallback padrão (papel sem restrições). Mantida para compatibilidade;
// prefira `rotaFallback(role)` quando o papel puder não ver a Operacional.
export const ROTA_FALLBACK = '/'
