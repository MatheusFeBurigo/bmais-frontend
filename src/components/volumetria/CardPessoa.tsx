// O bloco de um funcionário: quem é, quanto carrega e as demandas quebradas
// como no quadro de Tarefas dele. Clique em qualquer ponto abre o drawer; o ⋮
// no canto abre as ações sobre a pessoa (dividir a carga).
//
// O ⋮ é IRMÃO do cartão, não filho: o cartão é um <button> e botão dentro de
// botão não é HTML válido (o clique no ⋮ também abriria o drawer).
import { useEffect, useRef, useState } from 'react'
import type { VolumetriaGrupo, VolumetriaPessoa } from '../../types/api'
import { Badge, ProgressBar } from '../ui'
import QuebraDemandas from './QuebraDemandas'
import TempoPorTarefa from './TempoPorTarefa'
import {
  NIVEL_BADGE, NIVEL_LABEL, NIVEL_VAR, divisoesDe, fmtDiaMes, fmtDias, fmtHoras, iniciais, linhasQuebra,
  resumoRegiao, rotuloGrupo,
} from './volumetria.model'

const IconMais = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
  </svg>
)

function MenuPessoa({ nome, podeDividir, onDividir }: {
  nome: string
  podeDividir: boolean
  onDividir: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)

  // Fecha no clique fora e no Esc, como qualquer menu suspenso.
  useEffect(() => {
    if (!aberto) return
    function fora(e: MouseEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false)
    }
    function esc(e: KeyboardEvent) { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberto])

  return (
    <div className="vol-menu" ref={raiz}>
      <button
        type="button"
        className="vol-menu-btn"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label={`Ações de ${nome}`}
        title="Ações"
        onClick={() => setAberto((v) => !v)}
      >
        {IconMais}
      </button>
      {aberto && (
        <div className="vol-menu-lista" role="menu">
          <button
            type="button"
            role="menuitem"
            disabled={!podeDividir}
            title={podeDividir ? undefined : 'Precisa de ao menos dois hospitais e de um colega com área definida'}
            onClick={() => { setAberto(false); onDividir() }}
          >
            Dividir a carga
          </button>
        </div>
      )}
    </div>
  )
}

export default function CardPessoa({ pessoa, grupo, maxHoras, onAbrir, onDividir }: {
  pessoa: VolumetriaPessoa
  grupo: VolumetriaGrupo
  maxHoras: number
  onAbrir: (userId: string) => void
  onDividir: (userId: string) => void
}) {
  const rotulo = rotuloGrupo(grupo.papel)
  const nivel = pessoa.nivel ?? 'normal'
  const tecnico = grupo.role_operacional === 'tecnico'
  const demandas = pessoa.total_pendencias ?? 0
  const divisoes = divisoesDe(grupo, pessoa.user_id)
  const vigente = divisoes.find((d) => d.vigente)
  const recebidos = pessoa.hospitais.filter((h) => h.temporario).length
  const colegas = grupo.pessoas.some((p) => p.user_id !== pessoa.user_id && !p.sem_vinculo)
  const podeDividir = !pessoa.sem_vinculo && colegas
    && pessoa.hospitais.filter((h) => !h.temporario).length >= 2

  return (
    <div className="vol-card-wrap">
      <button
        type="button"
        className={`vol-card${pessoa.sem_vinculo ? ' sem-area' : ''}`}
        onClick={() => onAbrir(pessoa.user_id)}
        aria-label={`${pessoa.nome}: ${pessoa.sem_vinculo ? 'definir área' : 'ver hospitais'}`}
      >
        <header className="vol-card-head">
          <span className="vol-av" aria-hidden="true">{iniciais(pessoa.nome)}</span>
          <div className="vol-card-id">
            {/* O e-mail fica só no tooltip: a identidade na tela é o NOME. */}
            <div className="vol-card-nome" title={pessoa.email}>{pessoa.nome}</div>
            <div className="vol-card-sub">
              <span>{rotulo.singular} · {pessoa.hospitais_n} {pessoa.hospitais_n === 1 ? 'hospital' : 'hospitais'}</span>
              {pessoa.sem_nome && (
                <span title="O perfil não tem nome cadastrado: este veio do e-mail. Preencha o nome em Operações.">
                  <Badge variant="warning">sem nome</Badge>
                </span>
              )}
            </div>
          </div>
          {!pessoa.sem_vinculo && <Badge variant={NIVEL_BADGE[nivel]} dot>{NIVEL_LABEL[nivel]}</Badge>}
        </header>

        {/* Divisão temporária em curso: quem olha o cartão precisa saber que os
            números já refletem a divisão, e até quando. */}
        {(vigente || recebidos > 0) && (
          <div className="vol-card-div">
            {vigente
              ? `Carga dividida até ${fmtDiaMes(vigente.fim)}`
              : `Ajudando com ${recebidos} ${recebidos === 1 ? 'hospital' : 'hospitais'} de colegas`}
          </div>
        )}

        {pessoa.sem_vinculo ? (
          <div className="vol-card-vazio">
            Sem área definida: vê toda a rede. Defina os hospitais para a carga ser contada.
          </div>
        ) : (
          <>
            <div className="vol-card-carga">
              <b>{demandas}</b>
              <span>{demandas === 1 ? 'demanda' : 'demandas'} · {fmtHoras(pessoa.horas)}</span>
            </div>
            <div className="vol-card-bar">
              <ProgressBar pct={maxHoras > 0 ? ((pessoa.horas ?? 0) / maxHoras) * 100 : 0} color={NIVEL_VAR[nivel]} />
              <span>{fmtDias(pessoa.dias_fila)} de fila</span>
            </div>
            <QuebraDemandas linhas={linhasQuebra(grupo.role_operacional, pessoa.quebra)} compacto />
            {/* A mesma fila em TEMPO: dois cartões com a mesma contagem podem
                ter semanas bem diferentes, e a barra mostra isso de relance. */}
            <TempoPorTarefa
              role={grupo.role_operacional}
              minutosCategoria={pessoa.minutos_categoria}
              compacto
            />
            {/* Por onde a área da pessoa se espalha. As duas mais pesadas
                cabem no cartão; o resto fica no drawer, que tem espaço. */}
            {pessoa.regioes.length > 0 && (
              <div className="vol-card-reg">
                {pessoa.regioes.slice(0, 2).map((r) => (
                  <span key={r.regiao} className="vol-reg-chip" title={resumoRegiao(r, tecnico)}>
                    {r.regiao} <b>{tecnico ? r.pacientes : r.hospitais}</b>
                  </span>
                ))}
                {pessoa.regioes.length > 2 && (
                  <span className="vol-reg-chip mais">+{pessoa.regioes.length - 2}</span>
                )}
              </div>
            )}
          </>
        )}

        <footer className="vol-card-foot">
          <span>
            {pessoa.sem_vinculo
              ? 'Vê toda a rede'
              : tecnico
                ? `${pessoa.pacientes ?? 0} ${pessoa.pacientes === 1 ? 'paciente' : 'pacientes'} sob responsabilidade`
                : `${pessoa.hospitais_n} ${pessoa.hospitais_n === 1 ? 'hospital' : 'hospitais'} sob responsabilidade`}
          </span>
          <span className="vol-card-cta">{pessoa.sem_vinculo ? 'Definir área →' : 'Ver hospitais →'}</span>
        </footer>
      </button>
      <MenuPessoa nome={pessoa.nome} podeDividir={podeDividir} onDividir={() => onDividir(pessoa.user_id)} />
    </div>
  )
}
