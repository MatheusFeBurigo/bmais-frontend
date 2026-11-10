// Descartar um convênio inteiro na conferência do envio (10/11/2026).
//
// A lixeira da linha tira UM paciente do censo. Quando o hospital manda no mesmo
// PDF dezenas de pacientes de um convênio que não devia estar ali, isso eram
// dezenas de cliques e confirmações. Aqui o usuário marca o convênio, como veio
// impresso no censo, e todos os pacientes dele saem de uma vez, pela mesma regra
// da lixeira: quem nasceu deste censo é excluído; quem já existia só sai da lista.
//
// O agrupamento segue as abas do cartão: o convênio aparece sob a operadora em
// que os pacientes foram gravados (ou em Outros, quando não é homologado). O
// mesmo convênio sob duas operadoras vira duas linhas: alguém corrigiu parte dos
// pacientes na modal de edição, e descartar uma parte não pode levar a outra.
//
// Nada nasce marcado. É uma ação destrutiva, e o botão só diz quantos pacientes
// saem depois que o usuário escolhe.

import { useMemo, useState } from 'react'
import type { PacienteGravado } from '../../types/api'
import { varsOperadora } from '../../lib/coresOperadora'
import { Modal, Spinner } from '../ui'
import { ABA_OUTROS, type GrupoOperadora } from './AbasOperadora'
import { plural } from './comuns'

const estilos = `
.dc-corpo{display:grid;gap:12px;font-size:var(--t-base);color:var(--ink-2);line-height:1.5}
.dc-secoes{display:grid;gap:12px}
.dc-secao-tit{display:flex;align-items:center;gap:7px;margin-bottom:4px;font-size:var(--t-xs);font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}
.dc-cor{width:7px;height:7px;border-radius:50%;background:var(--op-cor);flex-shrink:0}
.dc-linhas{display:grid;border:1px solid var(--border);border-radius:var(--r-sm);overflow:hidden}
.dc-linha{display:flex;align-items:center;gap:10px;padding:8px 11px;cursor:pointer;background:var(--surface)}
.dc-linha + .dc-linha{border-top:1px solid var(--border-soft)}
.dc-linha:hover{background:var(--surface-3)}
.dc-linha.marcada{background:var(--danger-bg)}
.dc-linha input{flex-shrink:0;width:15px;height:15px;margin:0;accent-color:var(--danger)}
.dc-conv{flex:1;min-width:0}
.dc-conv-nome{display:block;font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dc-conv-nome i{font-weight:500;color:var(--muted)}
.dc-conv-sub{display:block;font-size:var(--t-xs);color:var(--muted)}
.dc-n{flex-shrink:0;font-family:var(--font-mono);font-weight:700;font-size:var(--t-sm);padding:1px 8px;border-radius:99px;background:var(--surface-3);color:var(--ink-3)}
.dc-linha.marcada .dc-n{background:var(--danger);color:#fff}
.dc-regra{font-size:var(--t-sm);color:var(--muted)}
.dc-erro{font-size:var(--t-sm);color:var(--danger-2)}
.btn-perigo{background:var(--danger);color:#fff;border-color:var(--danger)}
.btn-perigo:hover:not(:disabled){background:var(--danger-2);border-color:var(--danger-2)}
`

/** A forma de comparar dois nomes de convênio, a mesma do backend
 *  (`normalizar_convenio`): sem caixa e sem espaço repetido. */
function chaveConvenio(convenio?: string | null): string {
  return (convenio ?? '').split(/\s+/).filter(Boolean).join(' ').toUpperCase()
}

interface LinhaConvenio {
  /** Operadora + convênio: o mesmo convênio sob duas operadoras são duas linhas. */
  chave: string
  /** Como veio impresso no censo; '' = o censo não trouxe convênio. */
  convenio: string
  /** Só quem tem id: sem ele não há o que mandar ao servidor. */
  pacientes: PacienteGravado[]
  internados: number
  altas: number
}

interface SecaoOperadora {
  key: string
  nome: string
  linhas: LinhaConvenio[]
}

function montarSecoes(grupos: GrupoOperadora[]): SecaoOperadora[] {
  return grupos.map((g) => {
    const porConvenio = new Map<string, LinhaConvenio>()
    for (const p of [...g.emLeito, ...g.comAlta]) {
      if (p.id == null) continue
      const k = chaveConvenio(p.convenio)
      let linha = porConvenio.get(k)
      if (!linha) {
        linha = { chave: `${g.key}\u0000${k}`, convenio: (p.convenio ?? '').trim(),
                  pacientes: [], internados: 0, altas: 0 }
        porConvenio.set(k, linha)
      }
      linha.pacientes.push(p)
      if (p.situacao === 'ALTA') linha.altas += 1
      else linha.internados += 1
    }
    // O maior convênio primeiro; quem veio sem convênio fecha a seção.
    const linhas = [...porConvenio.values()].sort(
      (a, b) => Number(!a.convenio) - Number(!b.convenio) || b.pacientes.length - a.pacientes.length,
    )
    return {
      key: g.key,
      nome: g.key === ABA_OUTROS ? 'Outros · convênio não homologado' : g.nome,
      linhas,
    }
  }).filter((s) => s.linhas.length > 0)
}

export function DescartarConvenioModal({ grupos, ocupado, erro, onConfirmar, onCancelar }: {
  /** Os grupos das abas do cartão, já com as edições e remoções da tela. */
  grupos: GrupoOperadora[]
  ocupado?: boolean
  erro?: string | null
  /** `convenios` são os nomes como vieram no censo, para a trilha de auditoria. */
  onConfirmar: (pacientes: PacienteGravado[], convenios: string[]) => void
  onCancelar: () => void
}) {
  const secoes = useMemo(() => montarSecoes(grupos), [grupos])
  const [marcadas, setMarcadas] = useState<Set<string>>(() => new Set())
  const alternar = (chave: string) => setMarcadas((atual) => {
    const nova = new Set(atual)
    if (nova.has(chave)) nova.delete(chave)
    else nova.add(chave)
    return nova
  })

  const escolhidas = secoes.flatMap((s) => s.linhas).filter((l) => marcadas.has(l.chave))
  const pacientes = escolhidas.flatMap((l) => l.pacientes)
  const convenios = [...new Set(escolhidas.map((l) => l.convenio || 'sem convênio'))]
  const n = pacientes.length

  return (
    <Modal
      title="Descartar por convênio"
      largura={520}
      onClose={ocupado ? () => {} : onCancelar}
      footer={
        <>
          <button type="button" className="btn btn-outline btn-sm"
                  disabled={ocupado} onClick={onCancelar}>
            Manter
          </button>
          <button type="button" className="btn btn-sm btn-perigo"
                  disabled={ocupado || n === 0}
                  onClick={() => onConfirmar(pacientes, convenios)}>
            {ocupado && <Spinner size={12} style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.4)' }} />}
            {n === 0 ? 'Descartar' : `Descartar ${n} ${plural(n, 'paciente')}`}
          </button>
        </>
      }
    >
      <style>{estilos}</style>
      <div className="dc-corpo">
        <div>Marque os convênios cujos pacientes saem deste censo.</div>
        <div className="dc-secoes">
          {secoes.map((s) => (
            <div key={s.key || 'sem-operadora'}>
              <div className="dc-secao-tit"
                   style={s.key && s.key !== ABA_OUTROS ? varsOperadora(s.key) : undefined}>
                {s.key && s.key !== ABA_OUTROS && <i className="dc-cor" />}
                {s.nome}
              </div>
              <div className="dc-linhas">
                {s.linhas.map((l) => {
                  const marcada = marcadas.has(l.chave)
                  const total = l.pacientes.length
                  return (
                    <label key={l.chave} className={`dc-linha${marcada ? ' marcada' : ''}`}>
                      <input type="checkbox" checked={marcada} disabled={ocupado}
                             onChange={() => alternar(l.chave)} />
                      <span className="dc-conv">
                        <span className="dc-conv-nome" title={l.convenio || undefined}>
                          {l.convenio || <i>Sem convênio no censo</i>}
                        </span>
                        <span className="dc-conv-sub">
                          {[
                            l.internados > 0 && `${l.internados} ${plural(l.internados, 'internação', 'internações')}`,
                            l.altas > 0 && `${l.altas} ${plural(l.altas, 'alta')}`,
                          ].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <span className="dc-n" aria-label={`${total} ${plural(total, 'paciente')}`}>{total}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="dc-regra">
          A regra é a mesma da lixeira: quem nasceu deste censo é excluído do
          sistema; quem já existia só sai da lista deste censo, com relatórios e
          histórico. Dá para desfazer logo em seguida.
        </div>
        {erro && <div className="dc-erro">{erro}</div>}
      </div>
    </Modal>
  )
}
