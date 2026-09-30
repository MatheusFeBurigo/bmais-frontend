// Catálogo da Ajuda: quais módulos existem, em que ordem, sob qual seção e
// presos a qual tela.
//
// O `screen` de cada módulo é o que faz a documentação herdar a hierarquia de
// acesso da aplicação: `modulosVisiveis` filtra por `leSobre`, que para quase
// todo papel é o `podeVer` que esconde o item no menu e bloqueia a rota. Um
// papel novo, ou uma mudança de escopo em auth/permissions.ts, reflete aqui sem
// edição. As exceções (admin e analista interno) vivem em acessoAjuda.ts.
import { lazy, type ComponentType } from 'react'
import type { UserRole } from '../../types/api'
import {
  IconAjustes, IconBalanca, IconEnvio, IconEquilibrio, IconFluxo,
  IconGrafico, IconHistorico, IconObra, IconPaciente, IconPerfis, IconPulso,
  IconQuadro, IconRede, IconVisao,
} from './modulos'
import type { ModuloAjuda } from './tipos'
import { leSobre } from './acessoAjuda'
// Os CORPOS entram por lazy(): a Sidebar consome este catálogo em toda tela (é
// ela que vira o índice na Ajuda), e importar o texto dos 16 módulos aqui
// colocaria a documentação inteira no bundle inicial do app. Assim a barra
// carrega só títulos, ícones e o gating; o texto baixa ao abrir a Ajuda.
const lazyCorpo = (
  carregar: () => Promise<Record<string, ComponentType<{ irPara: (id: string) => void }>>>,
  nome: string,
) => lazy(async () => ({ default: (await carregar())[nome] }))

const introducao = () => import('./conteudoIntroducao')
const operacao = () => import('./conteudoOperacao')
const gestao = () => import('./conteudoGestao')
const administracao = () => import('./conteudoAdministracao')

export const MODULOS: readonly ModuloAjuda[] = [
  // ── Introdução: valem para todos os papéis ────────────────────────────────
  {
    id: 'visao-geral-do-sistema',
    titulo: 'Visão geral do sistema',
    subtitulo: 'O que é a plataforma, do que ela é feita e o que ela entrega',
    secao: 'Introdução',
    icone: IconVisao,
    corpo: lazyCorpo(introducao, 'ModuloVisao'),
  },
  {
    id: 'perfis-de-acesso',
    titulo: 'Perfis de acesso e permissões',
    subtitulo: 'Quais telas cada perfil acessa e o que pode fazer em cada uma',
    secao: 'Introdução',
    icone: IconPerfis,
    corpo: lazyCorpo(introducao, 'ModuloNavegacao'),
  },

  // ── Operação ──────────────────────────────────────────────────────────────
  {
    id: 'painel-operacional',
    titulo: 'Painel Operacional',
    subtitulo: 'A tela de trabalho diário do controle de relatórios',
    secao: 'Operação',
    screen: 'operacional',
    icone: IconPulso,
    corpo: lazyCorpo(operacao, 'ModuloOperacional'),
  },
  {
    // A ficha do paciente é alcançada a partir da Visão Geral e do Kanban, e a
    // rota não é gated por papel. Fica presa a 'operacional' porque é ali que
    // ela começa: quem não vê a lista não chega à ficha por navegação.
    id: 'ficha-do-paciente',
    titulo: 'Ficha do Paciente',
    subtitulo: 'Ficha completa e editável de uma internação',
    secao: 'Operação',
    screen: 'operacional',
    icone: IconPaciente,
    corpo: lazyCorpo(operacao, 'ModuloPaciente'),
  },
  {
    id: 'tarefas',
    titulo: 'Tarefas',
    subtitulo: 'As pendências da equipe, separadas por tipo',
    secao: 'Operação',
    screen: 'kanban',
    icone: IconQuadro,
    corpo: lazyCorpo(operacao, 'ModuloKanban'),
  },
  {
    id: 'envio-de-censos',
    titulo: 'Envio de Censos',
    subtitulo: 'A porta de entrada de todos os dados de internação',
    secao: 'Operação',
    screen: 'upload',
    icone: IconEnvio,
    corpo: lazyCorpo(operacao, 'ModuloUpload'),
  },

  // ── Gestão: números consolidados, restritos à hierarquia de gestão ────────
  {
    id: 'dashboard-da-diretoria',
    titulo: 'Dashboard da Diretoria',
    subtitulo: 'Visão consolidada de desempenho, para decisão',
    secao: 'Gestão',
    screen: 'diretoria',
    icone: IconGrafico,
    corpo: lazyCorpo(gestao, 'ModuloDiretoria'),
  },
  {
    id: 'painel-do-gestor',
    titulo: 'Painel do Gestor',
    subtitulo: 'Fluxo de internações e permanência, com recorte por período',
    secao: 'Gestão',
    screen: 'gestor',
    icone: IconFluxo,
    corpo: lazyCorpo(gestao, 'ModuloGestor'),
  },

  {
    id: 'distribuicao-de-tarefas',
    titulo: 'Distribuição de tarefas',
    subtitulo: 'A carga de trabalho de cada pessoa da equipe',
    secao: 'Gestão',
    screen: 'volumetria',
    icone: IconEquilibrio,
    corpo: lazyCorpo(gestao, 'ModuloVolumetria'),
  },

  // ── Administração: manutenção do sistema ──────────────────────────────────
  {
    id: 'operacoes',
    titulo: 'Operações',
    subtitulo: 'Profissionais, contas de acesso, hospitais e operadoras',
    secao: 'Administração',
    screen: 'equipe',
    icone: IconRede,
    corpo: lazyCorpo(administracao, 'ModuloOperacoes'),
  },
  // Sem módulo para o perfil Admin (25/09/2026, a pedido do usuário): a Ajuda
  // não documenta nada exclusivo dele. O cadastro de contas entra no módulo de
  // Operações porque o analista também o faz (só a conta de administrador é
  // exclusiva do admin, e essa a Ajuda não mostra).
  {
    id: 'configuracoes',
    titulo: 'Configurações de Operadoras',
    subtitulo: 'As regras de prazo que definem o que é devido de cada paciente',
    secao: 'Administração',
    screen: 'configuracoes',
    icone: IconAjustes,
    corpo: lazyCorpo(administracao, 'ModuloConfiguracoes'),
  },
  {
    id: 'movimentacoes',
    titulo: 'Movimentações',
    subtitulo: 'Trilha de auditoria: quem fez o quê e quando',
    secao: 'Administração',
    screen: 'logs',
    icone: IconHistorico,
    corpo: lazyCorpo(administracao, 'ModuloMovimentacoes'),
  },

  {
    id: 'progresso',
    titulo: 'Progresso',
    subtitulo: 'O avanço da construção da plataforma, módulo a módulo',
    secao: 'Administração',
    screen: 'progresso',
    icone: IconObra,
    corpo: lazyCorpo(administracao, 'ModuloProgresso'),
  },

  // ── Referência ────────────────────────────────────────────────────────────
  {
    // Transversal de propósito: a pastilha de status aparece em quase toda tela,
    // então todo papel precisa poder consultar o que ela significa.
    id: 'calculo-do-status',
    titulo: 'Anexo: como o status é calculado',
    subtitulo: 'A regra central do sistema, visível em quase todas as telas',
    secao: 'Referência',
    icone: IconBalanca,
    corpo: lazyCorpo(administracao, 'ModuloRegras'),
  },
]

/** Ids antigos → atuais. O id vai para a URL (`/ajuda?modulo=`), e até
 *  25/09/2026 vários não batiam com o nome da tela (`kanban` para Tarefas,
 *  `upload` para Envio de Censos). Links salvos com o id antigo continuam
 *  abrindo o módulo certo, e a URL é trocada pela atual. */
export const IDS_ANTIGOS: Readonly<Record<string, string>> = {
  visao: 'visao-geral-do-sistema',
  navegacao: 'perfis-de-acesso',
  operacional: 'painel-operacional',
  paciente: 'ficha-do-paciente',
  kanban: 'tarefas',
  upload: 'envio-de-censos',
  diretoria: 'dashboard-da-diretoria',
  gestor: 'painel-do-gestor',
  volumetria: 'distribuicao-de-tarefas',
  regras: 'calculo-do-status',
  usuario: 'operacoes',
}

/** Módulos que o papel pode ler. Transversais (sem `screen`) entram sempre. */
export function modulosVisiveis(role: UserRole | null): ModuloAjuda[] {
  return MODULOS.filter((m) => !m.screen || leSobre(role, m.screen))
}
