// "Demandas x distribuição": que parte das demandas abertas do grupo cai em
// cada pessoa, contra que parte dos hospitais ela recebeu.
//
// Forma: bullet em HTML. A barra é a parcela das DEMANDAS; o traço vertical é
// a parcela dos HOSPITAIS. Barra que passa do traço = a pessoa recebeu
// hospitais mais pesados que a média; barra aquém = hospitais leves. As duas
// medidas são porcentagens do mesmo grupo, então dividem o mesmo eixo sem
// virar gráfico de dois eixos. O traço vai na cor do texto, não numa segunda
// cor de série: é referência, não outra categoria.
//
// "Sem responsável" entra como linha própria: são demandas que existem e não
// estão na carga de ninguém, e escondê-las faria a equipe parecer dividir 100%.
import type { VolumetriaGrupo } from '../../types/api'
import { COR_ABERTAS, comVinculo, rotuloGrupo } from './volumetria.model'

interface Linha {
  id: string
  nome: string
  demandas: number
  hospitais: number
  pctDemandas: number
  pctHospitais: number
  semResponsavel?: boolean
}

function pct(parte: number, todo: number): number {
  return todo > 0 ? (parte / todo) * 100 : 0
}

function linhas(grupo: VolumetriaGrupo): Linha[] {
  const pessoas = comVinculo(grupo)
  const semResp = grupo.sem_cobertura.reduce((s, h) => s + h.pendencias, 0)
  const totalDem = pessoas.reduce((s, p) => s + (p.total_pendencias ?? 0), 0) + semResp
  const totalHosp = pessoas.reduce((s, p) => s + p.hospitais_n, 0)
  const out: Linha[] = pessoas.map((p) => ({
    id: p.user_id,
    nome: p.nome,
    demandas: p.total_pendencias ?? 0,
    hospitais: p.hospitais_n,
    pctDemandas: pct(p.total_pendencias ?? 0, totalDem),
    pctHospitais: pct(p.hospitais_n, totalHosp),
  }))
  out.sort((a, b) => b.pctDemandas - a.pctDemandas || a.nome.localeCompare(b.nome))
  if (semResp > 0) {
    out.push({
      id: '__sem__', nome: 'Sem responsável', demandas: semResp, hospitais: 0,
      pctDemandas: pct(semResp, totalDem), pctHospitais: 0, semResponsavel: true,
    })
  }
  return out
}

const inteiro = (n: number) => `${Math.round(n)}%`

export default function DemandaXDistribuicao({ grupo, onAbrir }: {
  grupo: VolumetriaGrupo
  onAbrir: (userId: string) => void
}) {
  const ls = linhas(grupo)
  if (ls.length === 0) {
    return (
      <div className="vol-vazio">
        Ninguém com hospitais atribuídos ainda. Atribua hospitais para ver a distribuição.
      </div>
    )
  }
  // A escala vai até a maior parcela (das duas medidas), não até 100%: com
  // 6 pessoas ninguém passa de ~40%, e um eixo até 100 espremeria tudo.
  const teto = Math.max(1, ...ls.map((l) => Math.max(l.pctDemandas, l.pctHospitais)))
  const unidade = grupo.role_operacional === 'administrativo' ? 'hospitais sem censo' : 'casos'
  const singular = rotuloGrupo(grupo.papel).singular

  return (
    <>
      <div className="vol-dxd" role="table" aria-label="Parcela das demandas e dos hospitais por pessoa">
        <div className="vol-dxd-row vol-dxd-cab" role="row">
          <span role="columnheader">{singular[0].toUpperCase() + singular.slice(1)}</span>
          <span role="columnheader" aria-hidden="true" />
          <span role="columnheader">Demandas</span>
          <span role="columnheader">Hospitais</span>
        </div>
        {ls.map((l) => {
          const dica = l.semResponsavel
            ? `${l.demandas} ${unidade} em hospitais sem ninguém vinculado (${inteiro(l.pctDemandas)} das demandas)`
            : `${l.nome}: ${l.demandas} ${unidade} (${inteiro(l.pctDemandas)} das demandas) em ${l.hospitais} ${l.hospitais === 1 ? 'hospital' : 'hospitais'} (${inteiro(l.pctHospitais)} dos hospitais)`
          const conteudo = (
            <>
              <span className="vol-dxd-nome" role="cell">{l.nome}</span>
              <span className="vol-dxd-trilha" role="cell" aria-label={dica}>
                <span
                  className="vol-dxd-barra"
                  style={{
                    width: `${(l.pctDemandas / teto) * 100}%`,
                    background: l.semResponsavel ? 'var(--danger)' : COR_ABERTAS,
                  }}
                />
                {!l.semResponsavel && (
                  <span className="vol-dxd-traco" style={{ left: `${(l.pctHospitais / teto) * 100}%` }} />
                )}
              </span>
              <b role="cell">{inteiro(l.pctDemandas)}</b>
              <b role="cell">{l.semResponsavel ? 'Nenhum' : inteiro(l.pctHospitais)}</b>
            </>
          )
          return l.semResponsavel ? (
            <div key={l.id} className="vol-dxd-row sem" role="row" title={dica}>{conteudo}</div>
          ) : (
            <button
              key={l.id}
              type="button"
              className="vol-dxd-row"
              role="row"
              title={dica}
              onClick={() => onAbrir(l.id)}
            >
              {conteudo}
            </button>
          )
        })}
      </div>
      <div className="vol-legenda" aria-label="Legenda">
        <span><i style={{ background: COR_ABERTAS }} />Parcela das demandas abertas</span>
        <span><i className="vol-dxd-traco-leg" />Parcela dos hospitais</span>
        <span style={{ marginLeft: 'auto' }}>Barra além do traço: hospitais mais pesados que a média</span>
      </div>
    </>
  )
}
