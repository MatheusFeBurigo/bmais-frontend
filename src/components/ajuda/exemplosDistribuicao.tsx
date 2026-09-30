// Réplicas da tela Distribuição de tarefas (rota /volumetria), usadas nos
// "como fazer" do coordenador.
//
// Reusam o que é puro na tela real: os indicadores (KpiCard), a grade de
// cartões (GradePessoas), a quebra de demandas, a barra de tempo por tarefa, o
// bloco por região e a lista de hospitais sem cobertura. O painel da pessoa é
// redesenhado aqui com as mesmas classes: o real busca a lista de hospitais e
// trava a rolagem da página ao abrir, e o bloco de parâmetros real abre
// recolhido, sem como mostrar os campos.
//
// O modal "Dividir a carga" também é redesenhado: o real grava ao confirmar e
// trava a rolagem da página. As classes e o CSS são os dele (dividirStyles).
//
// A equipe é fictícia (dadosDistribuicao.ts).
import type { ReactNode } from 'react'
import type { VolumetriaGrupo } from '../../types/api'
import { Badge, KpiCard, OpAvatar } from '../ui'
import { HospitalCombobox } from '../HospitalCombobox'
import DemandaXDistribuicao from '../volumetria/DemandaXDistribuicao'
import GradePessoas from '../volumetria/GradePessoas'
import HospitaisSemCobertura from '../volumetria/HospitaisSemCobertura'
import PorRegiao from '../volumetria/PorRegiao'
import QuebraDemandas from '../volumetria/QuebraDemandas'
import TempoPorTarefa from '../volumetria/TempoPorTarefa'
import { dividirStyles, localStyles as volumetriaStyles } from '../volumetria/volumetria.styles'
import { NIVEL_VAR, fmtDias, fmtHoras, iniciais, linhasQuebra } from '../volumetria/volumetria.model'
import {
  BEATRIZ, GRUPO, GRUPO_DIVIDIDO, HOSPITAIS_DA_JULIANA, JULIANA, MARCOS, PESSOAS,
} from './dadosDistribuicao'
import { Marcado, ModalReplica } from './replica'
import { Topo } from './exemplosOperacao'

const nada = () => {}

/** Os quatro indicadores do topo, como a tela os monta para o grupo técnico. */
function Indicadores({ marcas = {} }: { marcas?: Partial<Record<'equipe' | 'semCobertura', number>> }) {
  return (
    <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
      <Marcado n={marcas.equipe} bloco>
        <KpiCard label="Equipe" value={PESSOAS.length} variant="danger"
          meta="1 em sobrecarga · 1 em atenção" />
      </Marcado>
      <KpiCard label="Pacientes sob responsabilidade" value={GRUPO.total_pacientes ?? 0}
        meta={`Internados nos hospitais da equipe · ${GRUPO.quebra.em_monitoramento} em monitoramento`} />
      <KpiCard label="Demandas abertas" value={GRUPO.total_pendencias} variant="info"
        meta="Sem relatório, aguardando visita, vencidos e a vencer" />
      <Marcado n={marcas.semCobertura} bloco>
        <KpiCard label="Hospitais sem cobertura" value={GRUPO.sem_cobertura.length} variant="danger"
          meta="Com demanda e ninguém vinculado · clique para atribuir" />
      </Marcado>
    </div>
  )
}

function Cabecalho() {
  return <Topo titulo="Distribuição de tarefas" sub="Quem está na equipe e quantas demandas cada um tem agora" />
}

/** Topo da tela: indicadores e a grade de cartões da equipe. `dividida`
 *  mostra o grupo durante a divisão de carga do exemplo. */
export function ReplicaEquipe({ marcas = {}, dividida }: {
  marcas?: Partial<Record<'equipe' | 'semCobertura', number>>
  dividida?: boolean
}) {
  const grupo: VolumetriaGrupo = dividida ? GRUPO_DIVIDIDO : GRUPO
  return (
    <>
      <style>{volumetriaStyles}</style>
      <Cabecalho />
      <Indicadores marcas={marcas} />
      <GradePessoas grupo={grupo} onAbrir={nada} onDividir={nada} />
    </>
  )
}

/** O bloco "Demandas x distribuição", com o componente real. */
export function ReplicaDemandaXDistribuicao() {
  return (
    <>
      <style>{volumetriaStyles}</style>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Demandas x distribuição</div>
            <p className="card-sub">Parte das demandas abertas e parte dos hospitais de cada pessoa.</p>
          </div>
        </div>
        <div className="card-body">
          <DemandaXDistribuicao grupo={GRUPO} onAbrir={nada} />
        </div>
      </div>
    </>
  )
}

/** O modal "Dividir a carga" de Juliana, com Beatriz escolhida e "Hoje e
 *  amanhã". A prévia repete a conta da tela:
 *  Juliana cede 12 h (2 dias de fila) a Beatriz. */
export function ReplicaDividirCarga({ marcas = {} }: {
  marcas?: Partial<Record<'colegas' | 'periodo' | 'previa' | 'dividir', number>>
}) {
  const colegas = [
    { p: MARCOS, marcado: false },
    { p: BEATRIZ, marcado: true },
  ]
  const previa = [
    { nome: JULIANA.nome, hospitais: 2, antes: 4.6, depois: 2.6 },
    { nome: BEATRIZ.nome, hospitais: 4, antes: 1.0, depois: 3.0 },
  ]
  return (
    <ModalReplica
      titulo={`Dividir a carga de ${JULIANA.nome}`}
      largura={520}
      rodape={
        <>
          <span className="btn btn-outline btn-sm">Cancelar</span>
          <Marcado n={marcas.dividir}><span className="btn btn-primary btn-sm">Dividir em 2</span></Marcado>
        </>
      }
    >
      <style>{dividirStyles}</style>
      <Marcado n={marcas.colegas} bloco>
        <div className="dv-sec">
          <div className="dv-lbl">Dividir com<span>2 partes</span></div>
          <div className="dv-lista">
            {colegas.map(({ p, marcado }) => (
              <span key={p.user_id} className="dv-colega" aria-pressed={marcado}>
                <input type="checkbox" checked={marcado} readOnly tabIndex={-1} aria-hidden="true" />
                <span className="dv-colega-nome">{p.nome}</span>
                {p.nivel === 'atencao' && (
                  <span className="dv-colega-nivel" style={{ color: NIVEL_VAR.atencao }}>Atenção</span>
                )}
                <span className="dv-colega-fila">{fmtDias(p.dias_fila)} de fila</span>
              </span>
            ))}
          </div>
        </div>
      </Marcado>

      <Marcado n={marcas.periodo} bloco>
        <div className="dv-sec">
          <div className="dv-lbl">Período<span>26/09 a 27/09</span></div>
          <div className="dv-periodo">
            <span className="dv-chip">Só hoje</span>
            <span className="dv-chip" aria-pressed="true">Hoje e amanhã</span>
            <span className="dv-chip">7 dias</span>
            <span className="dv-chip">Outro</span>
          </div>
        </div>
      </Marcado>

      <div className="dv-sec">
        <Marcado n={marcas.previa} bloco>
          <div>
            <div className="dv-lbl">Como fica<span>Fila no período</span></div>
            <div className="dv-prev">
              {previa.map((l) => (
                <div className="dv-prev-item" key={l.nome}>
                  <span className="dv-prev-nome">{l.nome}</span>
                  <span className="dv-prev-num">{l.hospitais} hospitais</span>
                  <span className="dv-prev-num">
                    {fmtDias(l.antes)} → <b style={{ color: NIVEL_VAR.atencao }}>{fmtDias(l.depois)}</b>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Marcado>
      </div>
    </ModalReplica>
  )
}

/** Indicadores e a lista de hospitais sem cobertura, com o "Atribuir a…". */
export function ReplicaSemCobertura({ marcas = {} }: {
  marcas?: Partial<Record<'semCobertura', number>>
}) {
  return (
    <>
      <style>{volumetriaStyles}</style>
      <Cabecalho />
      <Indicadores marcas={marcas} />
      <HospitaisSemCobertura grupo={GRUPO} onErro={nada} />
    </>
  )
}

/** O bloco "Por região". */
export function ReplicaPorRegiao() {
  return (
    <>
      <style>{volumetriaStyles}</style>
      <PorRegiao grupo={GRUPO} onAbrir={nada} />
    </>
  )
}

/** O painel lateral de uma pessoa (Juliana, em sobrecarga): indicadores,
 *  quebra, tempo, capacidade, adicionar hospital e a lista dos hospitais dela. */
export function ReplicaPainelPessoa({ marcas = {} }: {
  marcas?: Partial<Record<'indicadores' | 'capacidade' | 'adicionar' | 'remover', number>>
}) {
  const p = JULIANA
  return (
    <>
      <style>{volumetriaStyles}</style>
      <div className="aj-drawer-palco">
        <div className="aj-drawer-fundo" aria-hidden>
          {Array.from({ length: 9 }, (_, i) => <i key={i} style={{ width: `${55 + ((i * 17) % 40)}%` }} />)}
        </div>
        <div className="aj-drawer">
          <div className="vol-drawer-head">
            <span className="vol-av" aria-hidden="true">{iniciais(p.nome)}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="card-title">{p.nome}</div>
              <div className="card-sub" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span>técnico · {p.hospitais_n} hospitais</span>
                <Badge variant="danger" dot>Sobrecarga</Badge>
              </div>
            </div>
            <span className="vol-drawer-x">×</span>
          </div>
          <div className="vol-drawer-body">
            <Marcado n={marcas.indicadores} bloco>
              <div className="vol-ind">
                <div><b>{p.total_pendencias}</b><span>demandas</span></div>
                <div><b>{p.pacientes}</b><span>pacientes</span></div>
                <div><b>{fmtHoras(p.horas)}</b><span>estimadas</span></div>
                <div><b style={{ color: 'var(--danger)' }}>{fmtDias(p.dias_fila)}</b><span>de fila</span></div>
                <div><b style={{ color: 'var(--danger)' }}>{p.pressao_pct}%</b><span>prazo (3 d)</span></div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <QuebraDemandas linhas={linhasQuebra('tecnico', p.quebra)} />
              </div>
              <TempoPorTarefa role="tecnico" minutosCategoria={p.minutos_categoria} titulo="Onde o tempo está indo" />
            </Marcado>

            <div style={{ marginTop: 16 }}>
              <Marcado n={marcas.capacidade} bloco>
                <div className="vol-cap" style={{ margin: 0 }}>
                  <span>Capacidade:</span>
                  <input className="bm-input" type="number" readOnly value={6} />
                  <span>h/dia</span>
                  <span>(padrão do grupo)</span>
                </div>
              </Marcado>
            </div>

            <div style={{ marginTop: 12 }}>
              <Marcado n={marcas.adicionar} bloco>
                <div className="vol-add" style={{ margin: 0 }}>
                  <HospitalCombobox hospitais={[]} value="" onChange={nada} placeholder="Adicionar hospital…" />
                  <span className="btn btn-primary btn-sm">Adicionar</span>
                </div>
              </Marcado>
            </div>

            {HOSPITAIS_DA_JULIANA.map((h, i) => {
              const botao: ReactNode = <span className="vol-x">×</span>
              return (
                <div className="vol-hosp" key={h.key}>
                  <OpAvatar opKey={h.op} size={28} />
                  <span style={{ minWidth: 0 }}>
                    <div className="vol-hosp-nome">{h.nome}</div>
                    <div className="vol-hosp-sub">
                      {h.pacientes} pacientes
                      {h.compartilhado > 0 && <> · compartilhado com {h.compartilhado} pessoa</>}
                    </div>
                    <QuebraDemandas linhas={linhasQuebra('tecnico', h.quebra)} compacto />
                  </span>
                  <span className="vol-hosp-n" style={{ color: i === 0 ? 'var(--danger)' : undefined }}>
                    {fmtHoras(h.horas)}
                  </span>
                  {i === 1 ? <Marcado n={marcas.remover}>{botao}</Marcado> : botao}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

/** O bloco "Parâmetros de carga" aberto (o real abre recolhido), no grupo técnico. */
export function ReplicaParametros({ marcas = {} }: {
  marcas?: Partial<Record<'ajustar' | 'minutos' | 'fatores' | 'limiares' | 'salvar' | 'restaurar', number>>
}) {
  const campo = (label: string, valor: string | number) => (
    <div className="vol-param">
      <label>{label}</label>
      <input className="bm-input" type="number" readOnly value={valor} />
    </div>
  )
  const p = GRUPO.parametros
  return (
    <>
      <style>{volumetriaStyles}</style>
      <div className="card" style={{ overflow: 'visible' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Parâmetros de carga</div>
            <p className="card-sub">
              Calibrado por Camila Freitas em 22/09/2026. O tempo de cada caso é uma estimativa:
              ajuste até a carga bater com a realidade da equipe.
            </p>
          </div>
          <Marcado n={marcas.ajustar}><span className="vol-toggle">Recolher</span></Marcado>
        </div>
        <div className="card-body">
          <Marcado n={marcas.minutos} bloco>
            <div className="vol-param-sec primeira">Minutos por caso, pelo tipo de leito</div>
            <div className="vol-param-grid">
              {campo('UTI (min)', p.minutos_leito?.UTI ?? '')}
              {campo('Apartamento (min)', p.minutos_leito?.APARTAMENTO ?? '')}
              {campo('Enfermaria (min)', p.minutos_leito?.ENFERMARIA ?? '')}
            </div>
          </Marcado>
          <Marcado n={marcas.fatores} bloco>
            <div className="vol-param-sec">Multiplicadores</div>
            <div className="vol-param-grid">
              {campo('Longa permanência (10+ dias) (×)', p.fator_longa_10 ?? '')}
              {campo('Longa permanência (30+ dias) (×)', p.fator_longa_30 ?? '')}
              {campo('Reanálise (já tem relatório) (×)', p.fator_reanalise ?? '')}
            </div>
          </Marcado>
          <Marcado n={marcas.limiares} bloco>
            <div className="vol-param-sec">Capacidade e limiares</div>
            <div className="vol-param-grid">
              {campo('Capacidade padrão (h/dia)', p.capacidade_horas_dia)}
              {campo('Atenção a partir de (dias de fila)', p.limiares.fila_atencao_dias)}
              {campo('Sobrecarga a partir de (dias de fila)', p.limiares.fila_sobrecarga_dias)}
              {campo('Janela de prazo (dias)', p.prazo_dias)}
              {campo('Atenção no prazo (%)', p.limiares.pressao_atencao_pct)}
              {campo('Sobrecarga no prazo (%)', p.limiares.pressao_sobrecarga_pct)}
            </div>
          </Marcado>
          <div className="vol-param-acoes">
            <Marcado n={marcas.salvar}><span className="btn btn-primary btn-sm">Salvar parâmetros</span></Marcado>
            <span className="btn btn-outline btn-sm">Desfazer</span>
            <Marcado n={marcas.restaurar}><span className="btn btn-ghost btn-sm">Restaurar padrão</span></Marcado>
          </div>
        </div>
      </div>
    </>
  )
}
