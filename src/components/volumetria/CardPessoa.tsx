// O bloco de um funcionário: quem é, quanto carrega e as demandas quebradas
// como no quadro de Tarefas dele. Clique em qualquer ponto abre o drawer.
import type { VolumetriaGrupo, VolumetriaPessoa } from '../../types/api'
import { Badge, ProgressBar } from '../ui'
import QuebraDemandas from './QuebraDemandas'
import {
  NIVEL_BADGE, NIVEL_LABEL, NIVEL_VAR, fmtDias, fmtHoras, iniciais, linhasQuebra,
  resumoRegiao, rotuloGrupo,
} from './volumetria.model'

export default function CardPessoa({ pessoa, grupo, maxHoras, onAbrir }: {
  pessoa: VolumetriaPessoa
  grupo: VolumetriaGrupo
  maxHoras: number
  onAbrir: (userId: string) => void
}) {
  const rotulo = rotuloGrupo(grupo.papel)
  const nivel = pessoa.nivel ?? 'normal'
  const tecnico = grupo.role_operacional === 'tecnico'
  const demandas = pessoa.total_pendencias ?? 0

  return (
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
  )
}
