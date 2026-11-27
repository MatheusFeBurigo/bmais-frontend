// Confirmação do envio de censo, antes de gravar (25/11/2026).
//
// Pedido do usuário depois do envio de 25/11 em produção ("um dos usuários acabou
// subindo múltiplos censos várias vezes, de hospitais diferentes"): toda vez que se
// sobe um censo, é preciso SALVAR, e ao salvar aparece em qual hospital. E quando o
// arquivo tem pacientes de mais de um hospital, a tela mostra os hospitais
// encontrados e pergunta se são hospitais diferentes, para distribuir cada paciente
// no hospital certo.
//
// O que se mostra vem da prévia do servidor (`/upload/previa`), que lê o arquivo
// como o processamento leria, mas não grava nada.
//
// 26/11/2026, dupla checagem: o próprio botão diz onde os pacientes vão entrar
// ("Salvar 42 pacientes em Hospital X"), e o destino abre a modal em destaque. Quem
// clica em Salvar lê o hospital no lugar do clique, não só num quadro acima dele.
// Por isso a modal monta o próprio rodapé em vez de usar o `ConfirmarModal`, cujo
// botão é pequeno e de uma linha (nomes de hospital passam de 50 letras).
import { useMemo, useState } from 'react'
import { Modal, Spinner } from '../ui'
import type { PreviaCenso } from '../../services/censos.service'
import { nomeDoGrupo, plural } from './comuns'

/** O que o usuário decidiu para um arquivo com mais de um hospital. */
export interface DecisaoArquivo {
  modo: 'distribuir' | 'escolhido'
  /** Por grupo (na ordem de `hospitais_encontrados`): a key do hospital. */
  hospitais: (string | null)[]
}

function dataBr(iso?: string | null): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '')
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null
}

const estilos = `
.ce-corpo{display:grid;gap:12px;font-size:var(--t-base);color:var(--ink-2);line-height:1.55}
/* O destino é a primeira coisa da modal e a mais forte: borda grossa, nome grande. */
.ce-topo{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border:2px solid var(--primary-3);border-radius:var(--r-md);background:var(--primary-soft)}
.ce-topo-ico{flex-shrink:0;width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:var(--primary);color:#fff}
.ce-topo-txt{display:grid;gap:3px;min-width:0}
.ce-topo small{font-size:var(--t-xs);color:var(--ink-3);text-transform:uppercase;letter-spacing:.06em;font-weight:700}
.ce-topo b{font-size:var(--t-xl);line-height:1.25;color:var(--primary);font-weight:700;word-break:break-word}
.ce-topo-op{font-size:var(--t-sm);color:var(--ink-2)}
.ce-destinos{margin:2px 0 0;padding-left:18px;display:grid;gap:2px}
.ce-destinos li{font-size:var(--t-md);font-weight:700;color:var(--primary)}
/* Botão de salvar com o destino escrito nele: maior que o padrão e com quebra de
   linha, para o nome do hospital caber inteiro. */
.ce-pe{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:flex-end;width:100%}
.ce-pe-aviso{flex:1 1 200px;font-size:var(--t-sm);color:var(--warning-2)}
.ce-salvar{white-space:normal;text-align:left;max-width:100%;padding:10px 16px;font-size:var(--t-md);font-weight:600;line-height:1.3}
.ce-salvar strong{font-weight:800}
.ce-lista{display:grid;gap:10px;max-height:min(52vh,480px);overflow:auto;padding-right:2px}
.ce-arq{border:1px solid var(--border);border-radius:var(--r-md);padding:10px 12px;display:grid;gap:6px;background:var(--surface)}
.ce-nome{font-weight:600;color:var(--ink);font-size:var(--t-sm);word-break:break-word}
.ce-linha{font-size:var(--t-sm);color:var(--ink-2)}
.ce-linha strong{color:var(--ink)}
.ce-aviso{font-size:var(--t-sm);border-radius:var(--r-xs);padding:7px 9px;line-height:1.45}
.ce-aviso.atencao{background:var(--warning-bg);color:var(--ink)}
.ce-aviso.erro{background:var(--danger-bg);color:var(--ink)}
.ce-multi{border-top:1px solid var(--border-soft);padding-top:8px;display:grid;gap:8px}
.ce-grupos{margin:0;padding-left:18px;display:grid;gap:4px;font-size:var(--t-sm);color:var(--ink-2)}
.ce-grupos li::marker{color:var(--ink-3)}
.ce-grupos select{margin-left:6px;max-width:100%;font:inherit;font-size:var(--t-sm);padding:2px 6px;border:1px solid var(--border-strong);border-radius:var(--r-xs);background:var(--surface);color:var(--ink)}
.ce-pergunta{font-weight:600;color:var(--ink);font-size:var(--t-sm)}
.ce-ops{display:grid;gap:4px}
.ce-ops label{display:flex;gap:8px;align-items:flex-start;font-size:var(--t-sm);color:var(--ink-2);cursor:pointer}
.ce-ops input{margin-top:3px}
`

export function ConfirmarEnvio({
  previas, hospitalNome, operadoraNome, hospitaisOpcoes, ocupado, onSalvar, onCancelar,
}: {
  previas: PreviaCenso[]
  /** O hospital escolhido no passo 2 (o do lote). */
  hospitalNome: string
  operadoraNome?: string | null
  /** Hospitais da operadora, para o grupo que o cadastro não reconheceu. */
  hospitaisOpcoes: { key: string; nome: string }[]
  ocupado?: boolean
  onSalvar: (decisoes: Record<string, DecisaoArquivo>) => void
  onCancelar: () => void
}) {
  const multiplos = useMemo(
    () => previas.filter((p) => !p.erro && (p.hospitais_encontrados?.length ?? 0) > 0),
    [previas])
  const [decisoes, setDecisoes] = useState<Record<string, DecisaoArquivo>>({})

  function escolherModo(p: PreviaCenso, modo: DecisaoArquivo['modo']) {
    setDecisoes((d) => ({
      ...d,
      [p.arquivo]: { modo, hospitais: d[p.arquivo]?.hospitais ?? (p.hospitais_encontrados ?? []).map((g) => g.hospital) },
    }))
  }
  function escolherHospital(p: PreviaCenso, i: number, key: string) {
    setDecisoes((d) => {
      const atual = d[p.arquivo] ?? { modo: 'distribuir' as const, hospitais: (p.hospitais_encontrados ?? []).map((g) => g.hospital) }
      const hospitais = [...atual.hospitais]
      hospitais[i] = key || null
      return { ...d, [p.arquivo]: { ...atual, hospitais } }
    })
  }

  // Salvar só com a pergunta respondida em todo arquivo de vários hospitais e, ao
  // distribuir, com um hospital para cada grupo.
  const pronto = multiplos.every((p) => {
    const d = decisoes[p.arquivo]
    return d && (d.modo === 'escolhido' || d.hospitais.every(Boolean))
  })
  const salvaveis = previas.filter((p) => !p.erro).length

  // Pacientes que o Salvar grava agora (os "para completar" ficam de fora: viram
  // pendência) e os hospitais em que eles entram, na ordem em que aparecem. Segue
  // a mesma regra do `salvarConferido` de Upload.tsx: distribuído vai para o
  // hospital de cada grupo; o resto, para o hospital do lote.
  const { quantos, destinos } = useMemo(() => {
    const nomes: string[] = []
    const somar = (nome: string) => { if (!nomes.includes(nome)) nomes.push(nome) }
    let n = 0
    for (const p of previas) {
      if (p.erro || p.precisa_hospital) continue
      n += p.total ?? 0
      const grupos = p.hospitais_encontrados ?? []
      const d = decisoes[p.arquivo]
      if (grupos.length && d?.modo === 'distribuir') {
        grupos.forEach((g, i) => {
          const key = d.hospitais[i] ?? g.hospital
          if (!key) return
          somar(hospitaisOpcoes.find((h) => h.key === key)?.nome || g.hospital_nome || nomeDoGrupo(g))
        })
      } else {
        somar(hospitalNome)
      }
    }
    return { quantos: n, destinos: nomes }
  }, [previas, decisoes, hospitaisOpcoes, hospitalNome])

  const variosDestinos = destinos.length > 1
  const pacientesTxt = quantos > 0 ? <><strong>{quantos}</strong> {plural(quantos, 'paciente')} </> : null
  const rotuloSalvar = !salvaveis
    ? 'Fechar'
    : !pronto
      ? 'Responda acima para salvar'
      : variosDestinos
        ? <>Salvar {pacientesTxt}em <strong>{destinos.length} hospitais</strong></>
        : <>Salvar {pacientesTxt}em <strong>{destinos[0] ?? hospitalNome}</strong></>

  return (
    <Modal
      title="Confirme o hospital antes de salvar"
      largura={620}
      onClose={ocupado ? () => {} : onCancelar}
      footer={
        <div className="ce-pe">
          {salvaveis > 0 && !pronto && (
            <span className="ce-pe-aviso">Responda “São hospitais diferentes?” em cada arquivo.</span>
          )}
          <button type="button" className="btn btn-outline btn-sm" disabled={ocupado} onClick={onCancelar}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary ce-salvar"
            disabled={ocupado || !pronto}
            onClick={() => (salvaveis ? onSalvar(decisoes) : onCancelar())}
          >
            {ocupado && <Spinner size={12} style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.4)' }} />}
            <span>{rotuloSalvar}</span>
          </button>
        </div>
      }
    >
      <style>{estilos}</style>
      <div className="ce-corpo">
      <div className="ce-topo">
        <span className="ce-topo-ico" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M12 9v6M9 12h6" />
          </svg>
        </span>
        <div className="ce-topo-txt">
          <small>Os pacientes serão adicionados em</small>
          {variosDestinos ? (
            <ul className="ce-destinos">
              {destinos.map((nome) => <li key={nome}>{nome}</li>)}
            </ul>
          ) : (
            <b>{destinos[0] ?? hospitalNome}</b>
          )}
          {operadoraNome && <span className="ce-topo-op">Operadora {operadoraNome}</span>}
        </div>
      </div>
      <div className="ce-lista">
        {previas.map((p) => {
          const data = dataBr(p.data_censo)
          const inicio = dataBr(p.periodo_inicio)
          const grupos = p.hospitais_encontrados ?? []
          const d = decisoes[p.arquivo]
          return (
            <div key={p.arquivo} className="ce-arq">
              <div className="ce-nome">{p.arquivo}</div>
              {p.erro ? (
                <div className="ce-aviso erro"><strong>Não será salvo.</strong> {p.erro}</div>
              ) : p.precisa_hospital ? (
                <div className="ce-aviso atencao">O hospital deste arquivo não foi reconhecido: depois de salvar, você escolhe o hospital.</div>
              ) : (
                <>
                  <div className="ce-linha">
                    {data
                      ? <>Censo de <strong>{inicio && inicio !== data ? `${inicio} a ${data}` : data}</strong></>
                      : 'O arquivo não informa a data do censo'}
                    {' · '}
                    <strong>{p.total ?? 0}</strong> {plural(p.total ?? 0, 'paciente')}
                    {(p.total ?? 0) > 0 && <> ({p.internados ?? 0} {plural(p.internados ?? 0, 'internado')}, {p.altas ?? 0} {plural(p.altas ?? 0, 'alta')})</>}
                    {(p.pendentes ?? 0) > 0 && <> · {p.pendentes} para completar</>}
                  </div>
                  {p.hospital_divergente && grupos.length === 0 && (
                    <div className="ce-aviso atencao">
                      O arquivo indica <strong>{p.hospital_divergente}</strong>, não {hospitalNome}. Confira se é o hospital certo antes de salvar.
                    </div>
                  )}
                  {grupos.length > 0 && (
                    <div className="ce-multi">
                      <div className="ce-aviso atencao">
                        Este arquivo tem pacientes de <strong>{grupos.length} {plural(grupos.length, 'hospital', 'hospitais')}</strong>:
                      </div>
                      <ul className="ce-grupos">
                        {grupos.map((g, i) => (
                          <li key={`${g.unidade ?? '-'}-${i}`}>
                            <strong>{nomeDoGrupo(g)}</strong>: {g.pacientes} {plural(g.pacientes, 'paciente')}
                            {d?.modo === 'distribuir' && !g.hospital && (
                              <select aria-label={`Hospital de ${nomeDoGrupo(g)}`} value={d.hospitais[i] ?? ''}
                                      onChange={(e) => escolherHospital(p, i, e.target.value)}>
                                <option value="">Escolha o hospital…</option>
                                {hospitaisOpcoes.map((h) => <option key={h.key} value={h.key}>{h.nome}</option>)}
                              </select>
                            )}
                          </li>
                        ))}
                      </ul>
                      <div className="ce-pergunta">São hospitais diferentes?</div>
                      <div className="ce-ops" role="radiogroup" aria-label={`Hospitais de ${p.arquivo}`}>
                        <label>
                          <input type="radio" name={`ce-${p.arquivo}`} checked={d?.modo === 'distribuir'}
                                 onChange={() => escolherModo(p, 'distribuir')} />
                          <span>Sim: salvar cada paciente no seu hospital</span>
                        </label>
                        <label>
                          <input type="radio" name={`ce-${p.arquivo}`} checked={d?.modo === 'escolhido'}
                                 onChange={() => escolherModo(p, 'escolhido')} />
                          <span>Não: salvar todos em {hospitalNome}</span>
                        </label>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
      </div>
    </Modal>
  )
}
