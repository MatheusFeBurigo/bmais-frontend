// "Rede por Operadora": quantos hospitais cada operadora atende, do maior para o
// menor.
//
// Por que um card próprio, e não mais uma coluna na tabela: a tabela "Resumo por
// Operadora" responde "como está o SLA de cada uma" e já tem 12 colunas de
// métrica, todas comparáveis entre si. Tamanho de rede é outra pergunta — é
// estrutura, não desempenho —, e a resposta que interessa é a ORDEM ("quem tem
// mais"), que uma coluna no meio de onze não entrega: o olho teria de percorrer
// a coluna inteira comparando números.
//
// A barra faz esse trabalho: o comprimento relativo já diz quem lidera, e a
// ordenação decrescente põe a resposta na primeira linha.
//
// De onde vem o número: do vínculo hospital↔operadora (N-N). Ele é alimentado em
// boa parte pelos CENSOS — quando um censo de um hospital traz pacientes de um
// convênio, o sistema registra que aquele hospital atende aquela operadora. Por
// isso a contagem cresce à medida que os censos chegam, sem depender de alguém
// lembrar de cadastrar o vínculo à mão.
import type { DiretoriaPayload } from '../../types/api'
import { OpAvatar } from '../ui'

export default function RedeOperadorasCard({ data }: { data: DiretoriaPayload }) {
  // Só operadoras que já têm rede: uma linha "0 hospitais" não informa nada aqui
  // (a tabela acima já lista todas), e zeraria a escala das barras.
  const ops = (data.por_operadora || [])
    .filter((o) => (o.hospitais ?? 0) > 0)
    .sort((a, b) => (b.hospitais ?? 0) - (a.hospitais ?? 0))

  if (!ops.length) return null

  // Escala pelo MAIOR da lista, não pelo total: o que se lê aqui é a comparação
  // entre operadoras, e usar o total deixaria todas as barras curtas.
  const maior = ops[0].hospitais ?? 0
  const totalVinculos = ops.reduce((n, o) => n + (o.hospitais ?? 0), 0)

  return (
    <div className="card" style={{ marginTop: 10 }}>
      <div className="card-header">
        <div>
          <div className="card-title">Rede por Operadora</div>
          <p className="card-sub">
            Hospitais vinculados a cada operadora · {totalVinculos} {totalVinculos === 1 ? 'vínculo' : 'vínculos'} no total.
            O vínculo é criado pelo cadastro e pelos censos recebidos.
          </p>
        </div>
      </div>
      <div className="card-body" style={{ display: 'grid', gap: 8, paddingBottom: 16 }}>
        {ops.map((o) => {
          const n = o.hospitais ?? 0
          const ativos = o.hospitais_ativos
          // Barra sempre visível mesmo para o menor da lista: 4% de piso evita
          // que uma operadora com 1 hospital some contra outra com 60.
          const pct = maior > 0 ? Math.max(4, Math.round((n / maior) * 100)) : 0
          return (
            <div key={o.key} className="row" style={{ gap: 10 }}>
              <OpAvatar opKey={o.key} size={22} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
                  <span className="fw-6" style={{
                    fontSize: 'var(--t-sm)', flex: 1, minWidth: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {o.nome}
                  </span>
                  <span className="mono fw-7" style={{ fontSize: 'var(--t-base)' }}>{n}</span>
                  {/* Quantos da rede têm paciente agora. Fica ao lado do total, em
                      tom menor, porque é um recorte dele — não um segundo número
                      a comparar entre operadoras. */}
                  {ativos != null && (
                    <span
                      style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)', minWidth: 68, textAlign: 'right' }}
                      title={`${ativos} de ${n} com pacientes no momento`}
                    >
                      {ativos} {ativos === 1 ? 'ativo' : 'ativos'}
                    </span>
                  )}
                </div>
                <div style={{
                  height: 6, borderRadius: 99, background: 'var(--surface-3)',
                  overflow: 'hidden', marginTop: 3,
                }}>
                  <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: 99,
                    background: 'var(--primary-3)',
                  }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
