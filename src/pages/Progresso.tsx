// Tela Progresso: o avanço da construção do próprio BMais, módulo a módulo.
//
// Layout do documento de origem (`BMais_Avanco_Modulos.html`): cartão de
// destaque, legenda das seis etapas e um quadro único dividido pelos grupos do
// roadmap, com uma linha por módulo e a trilha de etapas visível.
//
// O que a tela cuida é da SEPARAÇÃO DOS TEXTOS: cada bloco de informação tem o
// seu lugar e o seu peso — identificação (código e nome), situação (pastilha e
// etapa atual), medida (barra e percentual) e prazos (datas por etapa). Sem
// isso tudo vira uma faixa cinza de palavras do mesmo tamanho, que é onde a
// informação se perde.
//
// Os números são de acompanhamento de obra, apurados à mão na conferência
// contra o código (e ajustáveis pela própria tela, por quem é admin).
// Restrita a administração e diretoria (screen 'progresso' em auth/permissions).
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { usePageHeader } from '../components/PageHeader'
import Toast from '../components/Toast'
import {
  ATUALIZADO_EM, ETAPAS, GRUPOS, type GrupoModulo,
} from '../components/progresso/dados'
import {
  etapasConcluidas, etapasEmCurso, faseDoPct, pctDoModulo,
} from '../components/progresso/calculo'
import {
  useDescartarProgresso, useProgresso, useSalvarProgresso, type ModuloResolvido,
} from '../hooks/useProgresso'
import type { DataEtapa } from '../services/progresso.service'
import { importRelatorio } from '../routes'
import '../components/progresso/progresso.css'

// Folha de documento com linhas de texto: o relatório da auditoria.
const IconDocumento = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6" /><path d="M9 17h6" /></svg>
)

// Tom de cada grupo. Vale para a pastilha e para o contador do topo — NÃO para
// a trilha de etapas, que tem escala própria (ver o comentário do topo).
const TOM: Record<GrupoModulo, string> = {
  'Em construção': 'build',
  Iniciados: 'started',
  'A construir': 'todo',
  'A estudar': 'study',
}

interface ModuloProps {
  m: ModuloResolvido
  /** Só para quem pode editar. Ausente = a linha é somente leitura. */
  editando?: boolean
  onEditar?: () => void
  onCancelar?: () => void
  onSalvar?: (etapasPct: number[], datas: DataEtapa[]) => void
  onDescartar?: () => void
  salvando?: boolean
}

function Modulo({
  m, editando, onEditar, onCancelar, onSalvar, onDescartar, salvando,
}: ModuloProps) {
  // Rascunho da edição. Nasce do módulo e é descartado no cancelar — o valor em
  // tela só muda quando o servidor confirma.
  const [etapasPct, setEtapasPct] = useState<number[]>(() => [...m.etapasPct])
  const [datas, setDatas] = useState<DataEtapa[]>(
    () => ETAPAS.map((_, i) => ({ ...(m.datas?.[i] ?? {}) })),
  )

  // Reabrir a edição recomeça do valor atual: sem isto, um cancelar seguido de
  // novo clique traria de volta o rascunho abandonado.
  useEffect(() => {
    if (!editando) return
    setEtapasPct([...m.etapasPct])
    setDatas(ETAPAS.map((_, i) => ({ ...(m.datas?.[i] ?? {}) })))
  }, [editando, m])

  // O que está em tela: o rascunho enquanto se edita, o gravado fora disso. É o
  // que faz o total do módulo responder a cada dígito, antes de salvar.
  const emTela = editando ? etapasPct : m.etapasPct
  const pctAtual = pctDoModulo(emTela)
  const concluidas = etapasConcluidas(emTela)
  const emCurso = etapasEmCurso(emTela)
  const comecou = concluidas > 0 || emCurso.length > 0

  const mudarData = (i: number, campo: 'inicio' | 'previsto', valor: string) => {
    setDatas((ds) => ds.map((d, j) => (j === i ? { ...d, [campo]: valor } : d)))
  }
  const mudarPct = (i: number, valor: number) => {
    // Limita na entrada: o backend também prende em 0..100, e deixar digitar
    // 300 para receber o corte depois faria a média mentir enquanto se digita.
    const n = Number.isNaN(valor) ? 0 : Math.min(100, Math.max(0, valor))
    setEtapasPct((ps) => ps.map((p, j) => (j === i ? n : p)))
  }

  // Na edição a trilha mostra as SEIS etapas, mesmo num módulo que não começou:
  // é justamente ali que se registra o cronograma de quem vai começar.
  const mostrarTrilha = editando || comecou

  // Resumo da situação, em texto: com percentual por etapa, mais de uma pode
  // estar em curso — o modelo antigo de "etapa atual" única não dizia isso.
  const resumo = (() => {
    if (concluidas === ETAPAS.length) return 'Todas as etapas concluídas'
    if (emCurso.length === 0) return `${concluidas} de ${ETAPAS.length} etapas concluídas`
    const nomes = emCurso.map((i) => ETAPAS[i]).join(' e ')
    return `Em ${nomes}`
  })()

  return (
    <article className={`prg-modulo${editando ? ' editando' : ''}`}>
      {/* 1. IDENTIFICAÇÃO — o código acima do nome, e não colado nele: são duas
          informações diferentes, e lado a lado o "Mód. 5A" era lido como parte
          do título. */}
      <div className="prg-modulo-topo">
        <div className="prg-modulo-id">
          <span className="prg-modulo-cod">{m.id}</span>
          <h3 className="prg-modulo-nome">{m.nome}</h3>
        </div>

        {/* 2. SITUAÇÃO e 3. MEDIDA. O percentual do módulo é CALCULADO das
            etapas, então não há campo para ele: editá-lo à parte criaria dois
            números para a mesma coisa. */}
        <span className={`prg-pill ${TOM[m.grupo]}`}>{m.status}</span>
        <div className="prg-track" role="img" aria-label={`${pctAtual}% concluído`}>
          <div className={`prg-fill ${TOM[m.grupo]}`} style={{ width: `${pctAtual}%` }} />
        </div>
        <span className="prg-modulo-pct">{pctAtual}%</span>

        {onEditar && !editando && (
          <button type="button" className="prg-editar" onClick={onEditar}
            title={`Editar o avanço de ${m.nome}`} aria-label={`Editar ${m.nome}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
          </button>
        )}
      </div>

      {mostrarTrilha ? (
        <div className="prg-andamento">
          {/* Fora da edição, o resumo da situação; dentro dela a frase sobraria,
              porque os campos logo abaixo dizem o mesmo com mais precisão. */}
          {!editando && (
            <p className="prg-etapa-atual">
              <span className="prg-etapa-atual-txt">
                <span className="prg-etapa-atual-n">{concluidas}/{ETAPAS.length}</span>
                <span className="prg-etapa-atual-nome">{resumo}</span>
              </span>
              {(m.ajustado || m.inferido) && (
                <span className="prg-marcas">
                  {m.ajustado && (
                    <span className="prg-ajustado"
                      title={`Ajustado manualmente${m.ajustadoPor ? ` por ${m.ajustadoPor}` : ''}`}>
                      ajustado
                    </span>
                  )}
                  {m.inferido && (
                    <span className="prg-inferido"
                      title="A conferência registrou o percentual, mas não em qual etapa o módulo está; esta posição foi deduzida do avanço.">
                      etapa estimada
                    </span>
                  )}
                </span>
              )}
            </p>
          )}

          <ol className="prg-fases" aria-label={`Etapas do módulo ${m.nome}`}>
            {ETAPAS.map((nomeEtapa, i) => {
              const valor = emTela[i] ?? 0
              const fase = faseDoPct(valor)
              const data = editando ? datas[i] : m.datas?.[i]
              return (
                <li className={`prg-fase ${fase}`} key={nomeEtapa}>
                  <span className="prg-fase-dot">
                    {fase === 'done' ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"
                        aria-hidden="true"><path d="m5 13 4.5 4.5L19 7" /></svg>
                    ) : i + 1}
                  </span>

                  <span className="prg-fase-nome">{nomeEtapa}</span>

                  {/* Avanço da etapa. Na leitura, só quando há algo a dizer: uma
                      coluna de "0%" em etapas que nem começaram seria ruído. */}
                  {editando ? (
                    <span className="prg-fase-pct-edit">
                      <input className="bm-input" type="number" min={0} max={100} value={valor}
                        disabled={salvando} aria-label={`Avanço de ${nomeEtapa}`}
                        onChange={(e) => mudarPct(i, Number(e.target.value))} />
                      <span className="prg-edit-sufixo">%</span>
                      {/* Atalho para o caso mais comum: dar a etapa por pronta
                          sem digitar 1-0-0. */}
                      <button type="button" className="prg-fase-concluir"
                        disabled={salvando || valor >= 100}
                        onClick={() => mudarPct(i, 100)}
                        title={`Marcar "${nomeEtapa}" como concluída`}>
                        concluir
                      </button>
                    </span>
                  ) : valor > 0 && (
                    <span className={`prg-fase-pct ${fase}`}>
                      {valor >= 100 ? 'concluída' : `${valor}%`}
                    </span>
                  )}

                  {/* 4. PRAZOS — na leitura, cada data rotulada; na edição, os
                      mesmos dois campos viram texto livre ("27/08", "out/26"). */}
                  {editando ? (
                    <span className="prg-fase-edit">
                      <input className="bm-input" type="text" value={data?.inicio ?? ''}
                        placeholder="início" disabled={salvando}
                        aria-label={`Início de ${nomeEtapa}`}
                        onChange={(e) => mudarData(i, 'inicio', e.target.value)} />
                      <input className="bm-input" type="text" value={data?.previsto ?? ''}
                        placeholder="até" disabled={salvando}
                        aria-label={`Previsão de ${nomeEtapa}`}
                        onChange={(e) => mudarData(i, 'previsto', e.target.value)} />
                    </span>
                  ) : (data?.inicio || data?.previsto) && (
                    <span className="prg-fase-data">
                      {/* Cada data na SUA coluna, mesmo quando a outra falta:
                          sem o espaço reservado, uma etapa só com previsão
                          jogava o valor para debaixo do "início" da etapa de
                          cima, e a coluna serrilhava. */}
                      <span className="prg-fase-quando">
                        {data?.inicio && (
                          <>
                            <span className="prg-fase-rotulo">início</span>
                            <b>{data.inicio}</b>
                          </>
                        )}
                      </span>
                      <span className="prg-fase-quando">
                        {data?.previsto && (
                          <>
                            <span className="prg-fase-rotulo">até</span>
                            <i>{data.previsto}</i>
                          </>
                        )}
                      </span>
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      ) : (
        <p className="prg-nao-iniciado">Nenhuma etapa iniciada</p>
      )}

      {editando && (
        <div className="prg-edit-acoes">
          {/* O total recalculado à vista de quem edita: é o número que a
              diretoria vai ler, e ele muda a cada dígito. */}
          <span className="prg-edit-total">
            Avanço do módulo <b>{pctAtual}%</b>
            <span className="prg-edit-total-nota">média das 6 etapas</span>
          </span>
          <div className="flex-1" />
          {/* Descartar longe do Salvar: é a ação que APAGA o ajuste, e vizinha
              do botão principal seria clicada sem querer. */}
          {m.ajustado && onDescartar && (
            <button type="button" className="btn btn-ghost" onClick={onDescartar}
              disabled={salvando} title="Remove o ajuste manual e volta ao valor de origem">
              Descartar ajuste
            </button>
          )}
          <button type="button" className="btn btn-outline" onClick={onCancelar} disabled={salvando}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" disabled={salvando}
            onClick={() => onSalvar?.(etapasPct, datas)}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      )}
    </article>
  )
}

export default function Progresso() {
  const { role } = useAuth()
  const { modulos, geral } = useProgresso()
  const salvar = useSalvarProgresso()
  const descartar = useDescartarProgresso()
  // Só a administração ajusta: os números são afirmados por quem confere o
  // código. A diretoria acompanha. O servidor aplica a mesma regra (requer_admin
  // nas rotas de ajuste), então isto aqui é conveniência, não a trava.
  const podeEditar = role === 'admin'

  // Id do módulo em edição: guardar o objeto deixaria o rascunho preso a uma
  // cópia antiga quando a lista recarregasse.
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [aviso, setAviso] = useState('')

  // O relatório da auditoria é o plano de onde estes módulos saíram: quem
  // acompanha o avanço costuma querer, em seguida, o porquê da ordem e o que
  // cada bloco entrega. Fica como ação da tela, e não como item de menu, porque
  // é leitura de apoio ao quadro — se abre a partir daqui e volta para cá.
  usePageHeader(useMemo(() => ({
    title: 'Progresso',
    subtitle: 'Avanço dos módulos do projeto',
    actions: (
      // onMouseEnter aquece o chunk do documento: ao clicar, ele já chegou.
      <Link to="/progresso/relatorio" className="btn btn-outline btn-sm"
        onMouseEnter={() => { void importRelatorio() }}>
        <IconDocumento />
        Relatório da auditoria
      </Link>
    ),
  }), []))

  // Contagens saem dos módulos RESOLVIDOS, não do catálogo: o grupo não muda no
  // ajuste, mas derivar de uma fonte só evita divergir quando mudar.
  const contagens = useMemo(
    () => GRUPOS.map((grupo) => ({ grupo, total: modulos.filter((m) => m.grupo === grupo).length })),
    [modulos],
  )

  function aoSalvar(m: ModuloResolvido, etapasPct: number[], datas: DataEtapa[]) {
    // Campos em branco viram null: o backend distingue "sem data" de "não
    // mexeu", e mandar string vazia gravaria um prazo que não existe.
    const limpas = datas.map((d) => ({
      inicio: d.inicio?.trim() || null,
      previsto: d.previsto?.trim() || null,
    }))
    // `etapa` e `pct` vão derivados das etapas: continuam gravados para um
    // servidor anterior à 0031 não ler zero, mas quem manda é a lista.
    const emCurso = etapasPct.findIndex((p) => p > 0 && p < 100)
    const ultimaFeita = etapasPct.reduce((acc, p, i) => (p >= 100 ? i + 1 : acc), 0)
    const etapa = emCurso >= 0 ? emCurso + 1 : (ultimaFeita || null)
    salvar.mutate({
      moduloId: m.id, etapa, pct: pctDoModulo(etapasPct),
      datas: limpas, etapasPct,
    }, {
      onSuccess: () => { setEditandoId(null); setAviso(`${m.nome}: avanço atualizado.`) },
      onError: () => setAviso('Não foi possível salvar. Tente de novo.'),
    })
  }

  function aoDescartar(m: ModuloResolvido) {
    descartar.mutate(m.id, {
      onSuccess: () => { setEditandoId(null); setAviso(`${m.nome}: ajuste descartado.`) },
      onError: () => setAviso('Não foi possível descartar. Tente de novo.'),
    })
  }

  return (
    <div className="prg">
      <section className="prg-destaque">
        <div className="prg-destaque-topo">
          <span className="prg-destaque-label">
            Avanço geral do projeto
            {/* Dizer de onde o número sai: antes era um valor fixo que não
                acompanhava os ajustes, e ninguém sabia como fora obtido. */}
            <span className="prg-destaque-nota">média dos {modulos.length} módulos</span>
          </span>
          <span className="prg-destaque-pct">{geral}%</span>
        </div>
        <div className="prg-track prg-track-lg" role="img"
          aria-label={`Avanço geral: ${geral}%`}>
          <div className="prg-fill build" style={{ width: `${geral}%` }} />
        </div>
        <div className="prg-contagens">
          {contagens.map(({ grupo, total }) => (
            <div className={`prg-cont ${TOM[grupo]}`} key={grupo}>
              <span className="prg-cont-n">{total}</span>
              <span className="prg-cont-label">{grupo}</span>
            </div>
          ))}
        </div>
      </section>

      {/* As seis etapas, uma vez no topo: cada módulo repete os nomes na
          própria trilha, então aqui a lista dá a visão do percurso inteiro. */}
      <section className="prg-legenda" aria-label="As seis etapas de cada módulo">
        {ETAPAS.map((etapa, i) => (
          <span className="prg-legenda-item" key={etapa}>
            <span className="prg-legenda-n">{i + 1}</span>
            {etapa}
          </span>
        ))}
      </section>

      <div className="prg-quadro">
        {GRUPOS.map((grupo) => {
          const doGrupo = modulos.filter((m) => m.grupo === grupo)
          if (doGrupo.length === 0) return null
          return (
            <section className="prg-grupo" key={grupo}>
              <h2 className="prg-grupo-titulo">
                {grupo}
                <span className="prg-grupo-total">{doGrupo.length}</span>
              </h2>
              {doGrupo.map((m) => (
                <Modulo m={m} key={m.id}
                  editando={editandoId === m.id}
                  onEditar={podeEditar ? () => setEditandoId(m.id) : undefined}
                  onCancelar={() => setEditandoId(null)}
                  onSalvar={(etapasPct, datas) => aoSalvar(m, etapasPct, datas)}
                  onDescartar={() => aoDescartar(m)}
                  salvando={salvar.isPending || descartar.isPending} />
              ))}
            </section>
          )
        })}
      </div>

      <p className="prg-fonte">
        Fonte: conferência do programador contra o código, {ATUALIZADO_EM}.
        {podeEditar && ' Os módulos ajustados por aqui trazem a marca "ajustado".'}
      </p>

      {aviso && <Toast message={aviso} onDone={() => setAviso('')} />}
    </div>
  )
}
