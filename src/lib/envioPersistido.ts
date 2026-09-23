// As escolhas do passo 1 do envio (operadora e hospital) sobrevivem a um F5.
//
// APENAS elas. Houve uma versão que guardava o resultado inteiro do envio —
// cartões, lista de pacientes, avisos e as correções já feitas — para a
// conferência não se perder num recarregamento. A ideia era boa e o efeito foi
// ruim: o resultado é um RETRATO do processamento, e guardá-lo criava um estado
// velho que sobrevivia a mudanças no código e discordava do que a tela sabia
// calcular. Um alerta já resolvido voltava a aparecer, e não havia como saber se
// o que estava em tela vinha do envio ou do cache. Diagnosticar isso custava
// mais do que o recarregamento custava ao usuário.
//
// O que ficou é o que não tem esse defeito: operadora e hospital são ESCOLHAS,
// não resultado. Não há o que recalcular nem com o que divergir, e repetí-las a
// cada envio do mesmo hospital era o atrito real do dia a dia.
//
// Nenhum dado de paciente é gravado. `sessionStorage` (não `localStorage`) pelo
// mesmo princípio de sempre: some quando a aba fecha.

const CHAVE = 'bmais_envio_passo1'

/** A chave da versão que guardava o ENVIO INTEIRO (com nomes de pacientes).
 *
 *  Apagada na carga deste módulo: quem estava com a tela aberta quando a versão
 *  nova subiu tem esse payload preso na aba, e ele só sumiria ao fechá-la. Como
 *  são dados de saúde que este código deixou de querer guardar, o certo é
 *  removê-los na primeira oportunidade, não esperar. */
const CHAVE_ANTIGA = 'bmais_envio_atual'

try {
  sessionStorage.removeItem(CHAVE_ANTIGA)
} catch {
  // Storage bloqueado: não há o que limpar nem como.
}

/** Versão do formato: mudou a forma? Suba o número e o que estava guardado é
 *  descartado, em vez de ser lido errado. */
const VERSAO = 2

export interface Passo1Persistido {
  versao: number
  operadora: string
  hospital: string
}

/** Lê as escolhas guardadas nesta aba, ou null.
 *
 *  Nunca lança: storage bloqueado (janela anônima, site data desativado) e JSON
 *  corrompido devolvem null, e a tela abre como sempre abriu. */
export function lerPasso1(): Passo1Persistido | null {
  try {
    const cru = sessionStorage.getItem(CHAVE)
    if (!cru) return null
    const dados = JSON.parse(cru) as Passo1Persistido
    if (dados?.versao !== VERSAO) return null
    return dados
  } catch {
    return null
  }
}

/** Guarda operadora e hospital. Best-effort, pelo mesmo motivo de `lerPasso1`. */
export function salvarPasso1(operadora: string, hospital: string): void {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify({ versao: VERSAO, operadora, hospital }))
  } catch {
    // Storage bloqueado. Silencioso de propósito: não conseguir guardar uma
    // conveniência não pode atrapalhar o envio, que é o que o usuário veio fazer.
  }
}
