// Réplica do bloco "Produtividade" da Distribuição de tarefas, com os gráficos
// reais. Arquivo próprio porque puxa o Chart.js: entra por lazy() em
// conteudoGestao, como as réplicas do Gestor, e quem não abre o passo a passo
// não baixa os gráficos.
import { ConcluidasPorDia, ProdutividadePorPessoa } from '../volumetria/ProdutividadeCharts'
import { localStyles as volumetriaStyles } from '../volumetria/volumetria.styles'
import { GRUPO } from './dadosDistribuicao'
import { Marcado } from './replica'

const nada = () => {}

export function ReplicaProdutividade({ marcas = {} }: {
  marcas?: Partial<Record<'porPessoa' | 'porDia' | 'fora', number>>
}) {
  const { dias, fora_do_grupo: fora } = GRUPO.produtividade
  return (
    <>
      <style>{volumetriaStyles}</style>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Produtividade</div>
            <p className="card-sub">Relatórios registrados nos últimos {dias} dias.</p>
          </div>
        </div>
        <div className="card-body">
          <div className="vol-prod">
            <Marcado n={marcas.porPessoa} bloco>
              <div>
                <div className="vol-sub">Por pessoa</div>
                <ProdutividadePorPessoa grupo={GRUPO} onAbrir={nada} />
              </div>
            </Marcado>
            <Marcado n={marcas.porDia} bloco>
              <div>
                <div className="vol-sub">Concluídas por dia</div>
                <ConcluidasPorDia grupo={GRUPO} />
              </div>
            </Marcado>
          </div>
          <Marcado n={marcas.fora} bloco>
            <p className="vol-prod-nota">Mais {fora} feitas por quem não é da equipe.</p>
          </Marcado>
        </div>
      </div>
    </>
  )
}
