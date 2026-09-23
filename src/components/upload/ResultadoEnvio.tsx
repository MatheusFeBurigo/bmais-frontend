// Resultado do envio: o placar do lote, as faixas de ação e um cartão por arquivo.
//
// O placar é uma FRASE, não uma fila de campos: "Hospital: AACD teve 14 pacientes
// registrados: 5 internações, 9 altas, no censo do dia 02/09 — total de 4
// arquivos." Lida como sentença, ela se explica sozinha; como lista de valores
// separados por "·", cada pedaço exigia que o leitor deduzisse o que era.
//
// As contagens repetem, sim, o que o cartão de um envio de arquivo único diz —
// e aqui isso é aceitável: a frase precisa estar completa para ser lida, e um
// resumo que muda de forma conforme o número de arquivos confunde mais do que a
// repetição custa.
//
// Quando aparece, o placar é o índice do lote: diz o total, a quebra por situação,
// as datas e — a parte nova — quantos arquivos pedem CADA tipo de providência. Os
// avisos críticos dos leitores sobem para cá, porque eram justamente eles que se
// perdiam lá embaixo: "faltaram 2 dos 677 pacientes" ficava numa linha cinza de
// 10px, do mesmo tamanho e da mesma cor de "clique para ver os nomes".

import { useCallback, useMemo, useState } from 'react'
import { classificarAvisos } from '../../lib/avisosCenso'
import type { Operadora, UploadCensoResult } from '../../types/api'
import {
  CartaoArquivo, cartaoArquivoStyles, ordenarPorUrgencia, urgenciaDe,
} from './CartaoArquivo'
import { alertaStyles } from '../Alerta'
import { listaPacientesStyles } from './ListaPacientes'
import { contadorAvisosStyles } from './ContadorAvisos'
import { editarPacienteStyles } from './EditarPacienteModal'
import { avisoDesfazerStyles } from './AvisoDesfazer'
import { ddmm, IcoAtencaoPlacar, IcoCheck, plural } from './comuns'

export const resultadoStyles = `
.up-resultado{border:1px solid var(--border);border-radius:var(--r-md);background:var(--surface);overflow:hidden;animation:up-pop .28s cubic-bezier(.2,.7,.2,1)}

/* Placar: só aparece quando resume algo além do que a linha do arquivo já diz. */
.up-placar{display:flex;align-items:center;gap:10px;padding:11px 14px;background:var(--surface-3);border-bottom:1px solid var(--border);flex-wrap:wrap}
.up-placar-ico{flex-shrink:0;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;color:#fff}
.up-placar-ico.ok{background:var(--success)}
.up-placar-ico.atencao{background:var(--warning)}
.up-placar-ico.critico{background:var(--danger)}
.up-placar-txt{flex:1;min-width:180px;font-size:var(--t-sm);color:var(--ink-2)}
.up-placar-txt strong{font-family:var(--font-mono);font-size:var(--t-md);color:var(--ink)}
.up-placar-alertas{display:flex;gap:6px;flex-wrap:wrap}
/* A mesma dupla de cores do resto da tela, para o placar e a lista falarem a
   mesma língua: azul = internações, verde = altas. */
/* Hospital do lote: abre a linha do placar, no tom mais escuro — é o contexto de
   todos os números que vêm depois. */
.up-placar-hosp{color:var(--ink);font-weight:600}
/* "Hospital:" é rótulo, não dado: fica um tom abaixo do nome que apresenta —
   a mesma relação de "Censo de" com a data. */
.up-placar-rot{color:var(--muted)}
.up-cor-internado{color:var(--info);font-weight:600}
.up-cor-alta{color:var(--success-2);font-weight:600}


/* Faixa de ação (completar / desfazer): mesma estrutura para as duas. */
.up-faixa{display:flex;align-items:center;gap:12px;padding:10px 14px;border-top:1px solid var(--border-soft);flex-wrap:wrap}
.up-faixa.atencao{background:var(--warning-bg)}
.up-faixa-txt{flex:1;min-width:220px;font-size:var(--t-sm);color:var(--ink-2);line-height:1.45}
.up-faixa:not(.atencao) .up-faixa-txt{color:var(--muted)}

@keyframes up-pop{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
`

/** Todo o CSS da área de resultado, para a página injetar de uma vez. */
export const estilosResultado = [
  alertaStyles, contadorAvisosStyles, listaPacientesStyles, cartaoArquivoStyles,
  editarPacienteStyles, avisoDesfazerStyles, resultadoStyles,
].join('\n')

export function ResultadoEnvio({
  resultados, pendentes, semHospital, criados, atualizados,
  podeDesfazer, desfazendo, onCompletar, onDesfazer, onIgnorar, somenteLeitura,
  onDesfazerArquivo, desfazendoArquivo, podeExcluir, operadoras,
}: {
  resultados: UploadCensoResult[]
  pendentes: number
  semHospital: number
  /** Pacientes que este envio criou — o que o desfazer apaga. */
  criados: number
  /** Já existiam e foram atualizados: o desfazer NÃO os toca. */
  atualizados: number
  podeDesfazer: boolean
  desfazendo: boolean
  /** Ausente quando não há nada a completar. */
  onCompletar?: () => void
  onDesfazer: () => void
  onIgnorar: (arquivo: string) => void
  /** Perfil de observação: esconde as ações que alteram dados. */
  somenteLeitura?: boolean
  /** Desfaz um arquivo do lote (sem tocar nos demais). */
  onDesfazerArquivo?: (arquivo: string) => void
  /** Nome do arquivo cuja reversão está em andamento. */
  desfazendoArquivo?: string | null
  /** Só admin apaga paciente (a rota exige). */
  podeExcluir?: boolean
  /** Cadastro de operadoras, repassado ate a modal de edicao do paciente. */
  operadoras?: Operadora[]
}) {
  // Digitalizados não são "erro": o arquivo chegou certo, o hospital é que o
  // mandou como imagem. Contar junto os pintaria de vermelho no placar,
  // contradizendo o cartão do arquivo — que pede uma AÇÃO (cadastrar à mão), e
  // não uma correção.
  const digitalizados = resultados.filter((r) => r.erro_tipo === 'imagem').length
  const falhas = resultados.filter((r) => r.erro && r.erro_tipo !== 'imagem').length
  const totalPacientes = resultados.reduce((s, r) => s + (r.total || 0), 0)
  const emLeito = resultados.reduce((s, r) => s + (r.internados || 0), 0)
  const comAlta = resultados.reduce((s, r) => s + (r.altas || 0), 0)

  // Avisos críticos dos leitores (divergência de contagem, hospital divergente):
  // o único caso em que o sistema SABE que pode ter ficado dado de fora. Antes
  // viviam só no rodapé do cartão; aqui viram um número no placar, que é onde o
  // olho pousa primeiro.
  const arquivosCriticos = useMemo(
    () => resultados.filter((r) => classificarAvisos(r.avisos ?? [])
      .some((a) => a.nivel === 'critico')).length,
    [resultados],
  )

  // Pacientes em outra operadora NÃO entram mais no placar.
  //
  // Era um badge ("90 pacientes em outras operadoras") e, por tabela, um dos
  // gatilhos que pintavam o placar de âmbar. Saiu porque as abas por operadora
  // passaram a mostrar o caso inteiro, uma aba por destino com a contagem de
  // cada uma: o badge repetia no topo, em número solto, o que está desenhado e
  // navegável logo abaixo — e, pior, anunciava como pendência o que é o
  // funcionamento NORMAL de um censo de hospital (cada paciente entra na
  // operadora do seu convênio). Com ele, um envio perfeito de censo misto abria
  // alaranjado, pedindo uma providência que não existe.
  //
  // Com o badge foi junto a fiação que o mantinha vivo (`onDivergentesMudaram`,
  // que o cartão usava para avisar o placar a cada correção): sem número no
  // topo, não há o que sincronizar.

  // Pacientes (não arquivos) que entraram sob a operadora escolhida porque o
  // convênio impresso não está no cadastro.
  // Quantos convênios cada arquivo já teve corrigidos na sua lista. O cartão
  // avisa (ver `onConveniosResolvidos`): o placar é somado aqui, a partir do
  // resultado do processamento, e sozinho não enxerga as correções feitas lá
  // dentro — o badge continuava dizendo "1 convênio não reconhecido" depois de
  // o usuário ter corrigido o convênio.
  const [resolvidosPorArquivo, setResolvidosPorArquivo] = useState<Record<string, number>>({})
  const marcarResolvidos = useCallback((arquivo: string, quantos: number) => {
    setResolvidosPorArquivo((atual) => ({
      ...atual, [arquivo]: (atual[arquivo] ?? 0) + quantos,
    }))
  }, [])

  const semConvenioCasado = useMemo(
    () => resultados.reduce((n, r) => n + Math.max(0,
      (r.convenios_nao_reconhecidos ?? []).length - (resolvidosPorArquivo[r.arquivo] ?? 0)), 0),
    [resultados, resolvidosPorArquivo],
  )

  // Hospital do lote. Fica AQUI, e não na linha de cada arquivo: o envio é de um
  // hospital só (escolhido no passo 1), então repeti-lo por arquivo gastava a
  // linha com o dado que menos varia. No placar ele é dito uma vez e vale para
  // tudo o que está abaixo.
  //
  // A lista existe porque o lote PODE ter mais de um: um arquivo cujo hospital
  // veio do PDF (não do passo 1) pode divergir, e nesse caso o placar não pode
  // afirmar um hospital só — diz quantos são, e cada arquivo se explica no seu
  // próprio cartão.
  const hospitais = useMemo(() => [...new Set(
    resultados.map((r) => r.hospital_nome || r.hospital).filter(Boolean),
  )] as string[], [resultados])

  // Datas distintas entre os arquivos do lote. Quase sempre é UMA (o envio do
  // dia); mais de uma é justamente o que o usuário precisa notar — subiu o censo
  // de ontem junto com o de hoje.
  const datas = [...new Set(resultados.map((r) => r.data_censo).filter(Boolean))].sort()
  const problemas = pendentes > 0 || semHospital > 0 || falhas > 0
    || digitalizados > 0 || arquivosCriticos > 0
    || semConvenioCasado > 0
  // O placar só ganha espaço se realmente somar algo além do que a linha já diz.
  //
  // Com UM arquivo e nada a resolver, ele ainda aparece — porque desde que o
  // hospital saiu da linha de cada arquivo, o placar é o ÚNICO lugar que diz de
  // que hospital é o envio. Sem isto, um envio limpo de um arquivo só ficaria
  // sem essa informação em tela nenhuma.
  const vaiResumir = resultados.length > 1 || problemas || hospitais.length > 0
  // Falha de leitura e divergência de contagem são as duas perdas de dado — o
  // ícone do placar passa a vermelho para não empatar com uma pendência, que é
  // só trabalho a fazer.
  const grave = falhas > 0 || arquivosCriticos > 0

  // Quem pede decisão primeiro; os limpos por último (e recolhidos, pelo cartão).
  const ordenados = useMemo(() => ordenarPorUrgencia(resultados), [resultados])
  // "Sem pendência" é o arquivo que não pede nada E não exibe nenhum aviso —
  // mais estrito que a urgência, que ignora o nível `atencao` de propósito.
  const limpos = ordenados.filter(
    (r) => urgenciaDe(r) === 'ok'
      && !classificarAvisos(r.avisos ?? []).some((a) => a.nivel !== 'nota'),
  ).length

  return (
    <div className="up-resultado">
      {vaiResumir && (
        <div className="up-placar">
          <span className={`up-placar-ico ${grave ? 'critico' : problemas ? 'atencao' : 'ok'}`}>
            {problemas ? IcoAtencaoPlacar : IcoCheck}
          </span>
          <div className="up-placar-txt">
            {/* Frase corrida, não uma sequência de campos separados por "·". O
                placar responde a uma pergunta única — "o que este envio fez?" —
                e lida como sentença ela se explica sozinha: quem é o hospital,
                quantos pacientes entraram, de que dia é o censo e de quantos
                arquivos veio. Cada parte some quando não há o que dizer (envio
                sem data declarada, arquivo único), e a frase continua correta
                porque nada aqui depende de um separador para fazer sentido. */}
            {hospitais.length === 1 && (
              <><span className="up-placar-rot">Hospital:</span>{' '}
                <b className="up-placar-hosp">{hospitais[0]}</b>{' '}</>
            )}
            {hospitais.length > 1 && (
              <><b className="up-placar-hosp">{hospitais.length} hospitais</b>{' '}</>
            )}
            {/* Concorda com o sujeito: "AACD teve" x "2 hospitais tiveram". */}
            {hospitais.length === 1 && 'teve '}
            {hospitais.length > 1 && 'tiveram '}
            <strong>{totalPacientes}</strong>{' '}
            {plural(totalPacientes, 'paciente')}{' '}
            {plural(totalPacientes, 'registrado')}
            {/* A quebra sai com QUALQUER das duas situações presente, não só
                com as duas: um envio só de altas mostrava "9 pacientes
                registrados" e engolia justamente o que eles são. */}
            {(emLeito > 0 || comAlta > 0) && (
              <>
                {': '}
                {emLeito > 0 && (
                  <b className="up-cor-internado">
                    {emLeito} {plural(emLeito, 'internação', 'internações')}
                  </b>
                )}
                {emLeito > 0 && comAlta > 0 && ', '}
                {comAlta > 0 && (
                  <b className="up-cor-alta">{comAlta} {plural(comAlta, 'alta')}</b>
                )}
              </>
            )}
            {/* Uma data ou várias: "no censo do dia 02/09" x "nos censos dos
                dias 01/09, 02/09" — mais de uma data é justamente o que o
                usuário precisa notar (subiu o censo de ontem junto com o de
                hoje). */}
            {datas.length === 1 && (
              <>, no censo do dia <b>{ddmm(datas[0] as string)}</b></>
            )}
            {datas.length > 1 && (
              <>, nos censos dos dias{' '}
                <b>{datas.map((d) => ddmm(d as string)).join(', ')}</b></>
            )}
            {resultados.length > 1 && (
              <>, num total de <b>{resultados.length}</b> arquivos</>
            )}
            {'.'}
            {/* Com vários arquivos, dizer quantos estão limpos evita que o
                usuário releia os que não precisam de nada. */}
            {resultados.length > 1 && limpos > 0 && problemas && (
              <> {limpos} sem {plural(limpos, 'pendência')}.</>
            )}
          </div>
          {problemas && (
            <div className="up-placar-alertas">
              {/* Vem primeiro: é o único que significa dado possivelmente perdido. */}
              {arquivosCriticos > 0 && (
                <span className="badge danger">
                  {arquivosCriticos} {plural(arquivosCriticos, 'arquivo')} a conferir
                </span>
              )}
              {semConvenioCasado > 0 && (
                <span className="badge warning">
                  {semConvenioCasado} {plural(semConvenioCasado, 'convênio')} não {plural(semConvenioCasado, 'reconhecido')}
                </span>
              )}
              {pendentes > 0 && <span className="badge warning">{pendentes} a completar</span>}
              {semHospital > 0 && <span className="badge warning">{semHospital} sem hospital</span>}
              {digitalizados > 0 && (
                <span className="badge warning">
                  {digitalizados} {plural(digitalizados, 'digitalizado')}: cadastrar à mão
                </span>
              )}
              {falhas > 0 && <span className="badge danger">{falhas} com erro</span>}
            </div>
          )}
        </div>
      )}

      {onCompletar && (
        <div className="up-faixa atencao">
          <span className="up-faixa-txt">
            {pendentes > 0
              ? <>{pendentes} {plural(pendentes, 'paciente')} {plural(pendentes, 'veio', 'vieram')} com dado faltando e {plural(pendentes, 'aguarda', 'aguardam')} sua decisão.</>
              : <>{semHospital} {plural(semHospital, 'arquivo')} sem hospital. Nada foi gravado.</>}
          </span>
          <button type="button" className="btn btn-primary btn-sm" onClick={onCompletar}>
            Completar agora
          </button>
        </div>
      )}

      {ordenados.map((res) => (
        // A key é o NOME do arquivo, não a posição: a lista é reordenada por
        // urgência, e um arquivo muda de lugar quando deixa de pedir decisão
        // (ao completar a última pendência pelo assistente, por exemplo). Com a
        // posição na key, o React reaproveitaria o cartão do vizinho e o estado
        // de expansão saltaria de um arquivo para outro.
        <CartaoArquivo key={res.arquivo} res={res} onIgnorar={onIgnorar}
                       somenteLeitura={somenteLeitura} podeExcluir={podeExcluir}
                       operadoras={operadoras}
                       onDesfazer={somenteLeitura ? undefined : onDesfazerArquivo}
                       onConveniosResolvidos={marcarResolvidos}
                       desfazendo={desfazendoArquivo === res.arquivo} />
      ))}

      {podeDesfazer && (
        <div className="up-faixa">
          <span className="up-faixa-txt">
            Hospital errado? Desfazer apaga os {criados} {plural(criados, 'paciente')} que este envio criou.
            {atualizados > 0 && (
              <> {atualizados} já {plural(atualizados, 'existia', 'existiam')} antes e {plural(atualizados, 'permanece', 'permanecem')}.</>
            )}
          </span>
          <button type="button" className="btn btn-outline btn-sm"
                  disabled={desfazendo} onClick={onDesfazer}>
            {desfazendo ? 'Desfazendo…' : 'Desfazer envio'}
          </button>
        </div>
      )}
    </div>
  )
}
