// Drawer da pessoa: quem é, quanto carrega (indicadores), a capacidade dela
// (editável), quais hospitais cobre — cada um com a própria quebra de demandas
// — e as ações: adicionar hospital (combobox com busca) e remover (×).
// Mesma casca de PacienteDrawer; fecha no backdrop, no × e no Esc.
import { useEffect, useMemo, useState } from 'react'
import type { VolumetriaGrupo, VolumetriaPessoa } from '../../types/api'
import { useTodosHospitais } from '../../hooks/useEquipe'
import {
  useDesvincularVolumetria, useSalvarParametrosVolumetria, useVincularVolumetria,
} from '../../hooks/useVolumetria'
import { useTravarScroll } from '../../lib/travarScroll'
import { HospitalCombobox } from '../HospitalCombobox'
import { Badge, OpAvatar } from '../ui'
import QuebraDemandas from './QuebraDemandas'
import TempoPorTarefa from './TempoPorTarefa'
import {
  NIVEL_BADGE, NIVEL_LABEL, NIVEL_VAR, fmt1, fmtDias, fmtHoras, hospitaisPorRegiao, iniciais,
  linhasQuebra, rotuloGrupo,
} from './volumetria.model'

export default function DrawerPessoa({ pessoa, grupo, onClose, onErro }: {
  pessoa: VolumetriaPessoa
  grupo: VolumetriaGrupo
  onClose: () => void
  onErro: (msg: string) => void
}) {
  useTravarScroll(true)
  const rotulo = rotuloGrupo(grupo.papel)
  const tecnico = grupo.role_operacional === 'tecnico'
  const todos = useTodosHospitais(true)
  const vincular = useVincularVolumetria()
  const desvincular = useDesvincularVolumetria()
  const salvarParams = useSalvarParametrosVolumetria()
  const [novo, setNovo] = useState('')
  const [cap, setCap] = useState(String(pessoa.capacidade_horas_dia))

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Trocou de pessoa (ou a capacidade dela mudou no servidor): a escolha
  // pendente no combobox e o rascunho de capacidade eram da anterior.
  useEffect(() => {
    setNovo('')
    setCap(String(pessoa.capacidade_horas_dia))
  }, [pessoa.user_id, pessoa.capacidade_horas_dia])

  const disponiveis = useMemo(() => {
    const ja = new Set(pessoa.hospitais.map((h) => h.hospital_key))
    return (todos.data ?? []).filter((h) => !ja.has(h.key))
  }, [todos.data, pessoa.hospitais])

  const ocupado = vincular.isPending || desvincular.isPending || salvarParams.isPending
  const nivel = pessoa.nivel ?? 'normal'
  const maxHorasHosp = Math.max(0, ...pessoa.hospitais.map((h) => h.horas))
  const grupos = useMemo(() => hospitaisPorRegiao(pessoa), [pessoa])
  const capMudou = cap !== '' && Number(cap) !== pessoa.capacidade_horas_dia

  function adicionar() {
    if (!novo) return
    vincular.mutate({ hospitalKey: novo, userId: pessoa.user_id }, {
      onSuccess: () => setNovo(''),
      onError: () => onErro('Não foi possível adicionar o hospital. Tente de novo.'),
    })
  }

  function remover(hospitalKey: string) {
    desvincular.mutate({ hospitalKey, userId: pessoa.user_id }, {
      onError: () => onErro('Não foi possível remover o hospital. Tente de novo.'),
    })
  }

  function salvarCapacidade(valor: number | null) {
    salvarParams.mutate(
      { grupo: grupo.role_operacional, corpo: { capacidade_por_pessoa: { [pessoa.user_id]: valor } } },
      { onError: (e) => onErro(e instanceof Error && e.message ? e.message : 'Não foi possível salvar a capacidade.') },
    )
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" role="dialog" aria-modal="true" aria-label={pessoa.nome}>
        <div className="vol-drawer-head">
          <span className="vol-av" aria-hidden="true">{iniciais(pessoa.nome)}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="card-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }} title={pessoa.email}>
              {pessoa.nome}
            </div>
            <div className="card-sub" style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span>{rotulo.singular} · {pessoa.hospitais_n} {pessoa.hospitais_n === 1 ? 'hospital' : 'hospitais'}</span>
              {!pessoa.sem_vinculo && <Badge variant={NIVEL_BADGE[nivel]} dot>{NIVEL_LABEL[nivel]}</Badge>}
              {pessoa.sem_nome && (
                <span title="O perfil não tem nome cadastrado: este veio do e-mail. Preencha o nome em Operações.">
                  <Badge variant="warning">sem nome cadastrado</Badge>
                </span>
              )}
            </div>
          </div>
          <button type="button" className="vol-drawer-x" onClick={onClose} aria-label="Fechar">×</button>
        </div>

        <div className="vol-drawer-body">
          {pessoa.sem_vinculo ? (
            <div className="vol-nota">
              Esta pessoa não tem hospitais definidos e por isso vê <b>toda a rede</b>.
              Adicione hospitais para definir a área dela — a carga passa a ser contada a partir daí.
            </div>
          ) : (
            <div className="vol-ind">
              <div><b>{pessoa.total_pendencias ?? 0}</b><span>demandas</span></div>
              {tecnico && <div><b>{pessoa.pacientes ?? 0}</b><span>pacientes</span></div>}
              <div><b>{fmtHoras(pessoa.horas)}</b><span>estimadas</span></div>
              <div><b style={{ color: NIVEL_VAR[nivel] }}>{fmtDias(pessoa.dias_fila)}</b><span>de fila</span></div>
              {pessoa.pressao_pct != null && (
                <div><b style={{ color: NIVEL_VAR[nivel] }}>{pessoa.pressao_pct}%</b><span>prazo ({grupo.parametros.prazo_dias} d)</span></div>
              )}
            </div>
          )}

          {!pessoa.sem_vinculo && (
            <div style={{ marginBottom: 14 }}>
              <QuebraDemandas linhas={linhasQuebra(grupo.role_operacional, pessoa.quebra)} />
            </div>
          )}

          {/* Contagem acima, TEMPO aqui: é o que mostra em que tipo de tarefa
              a semana da pessoa está presa, que a contagem não revela. */}
          {!pessoa.sem_vinculo && (
            <div style={{ marginBottom: 16 }}>
              <TempoPorTarefa
                role={grupo.role_operacional}
                minutosCategoria={pessoa.minutos_categoria}
                titulo="Onde o tempo está indo"
              />
            </div>
          )}

          {/* Capacidade: a referência dos "dias de fila". Própria da pessoa ou a do grupo. */}
          <div className="vol-cap">
            <span>Capacidade:</span>
            <input
              className="bm-input"
              type="number" min={0.5} max={12} step={0.5}
              value={cap}
              disabled={ocupado}
              onChange={(e) => setCap(e.target.value)}
              aria-label="Horas de análise por dia"
            />
            <span>h/dia</span>
            {capMudou ? (
              <button type="button" className="btn btn-outline btn-sm" disabled={ocupado}
                onClick={() => salvarCapacidade(Number(cap))}>
                {salvarParams.isPending ? 'Salvando…' : 'Salvar'}
              </button>
            ) : pessoa.capacidade_propria ? (
              <>
                <span>(própria)</span>
                <button type="button" className="btn btn-ghost btn-sm" disabled={ocupado}
                  onClick={() => salvarCapacidade(null)}
                  title={`Voltar ao padrão do grupo (${fmt1(grupo.parametros.capacidade_horas_dia)} h/dia)`}>
                  Usar padrão do grupo
                </button>
              </>
            ) : (
              <span>(padrão do grupo)</span>
            )}
          </div>

          <div className="vol-add">
            <HospitalCombobox
              hospitais={disponiveis}
              value={novo}
              onChange={setNovo}
              disabled={ocupado || todos.isLoading}
              placeholder={todos.isLoading ? 'Carregando hospitais…' : 'Adicionar hospital…'}
              mostrarOperadora
            />
            <button type="button" className="btn btn-primary btn-sm" disabled={!novo || ocupado} onClick={adicionar}>
              {vincular.isPending ? 'Adicionando…' : 'Adicionar'}
            </button>
          </div>

          {/* Hospitais agrupados pela REGIÃO do cadastro, com o subtotal de
              cada uma: é como o coordenador pensa a área da pessoa. Uma
              região só (o caso comum) não ganha cabeçalho, que seria ruído. */}
          {grupos.map(({ regiao, hospitais }) => (
            <div key={regiao.regiao}>
              {grupos.length > 1 && (
                <div className="vol-reg-head">
                  <span>{regiao.regiao}</span>
                  <span>
                    {tecnico && <>{regiao.pacientes} {regiao.pacientes === 1 ? 'paciente' : 'pacientes'} · </>}
                    {regiao.hospitais} {regiao.hospitais === 1 ? 'hospital' : 'hospitais'} · {fmtHoras(regiao.horas)}
                  </span>
                </div>
              )}
              {hospitais.map((h) => (
                <div className="vol-hosp" key={h.hospital_key}>
                  {h.operadora_key ? <OpAvatar opKey={h.operadora_key} size={28} /> : <span />}
                  <span style={{ minWidth: 0 }}>
                    <div className="vol-hosp-nome" title={h.hospital_nome}>{h.hospital_nome}</div>
                    <div className="vol-hosp-sub">
                      {tecnico
                        ? `${h.internados ?? 0} ${h.internados === 1 ? 'paciente' : 'pacientes'}`
                        : (h.dias_sem_censo != null ? `sem censo há ${h.dias_sem_censo} ${h.dias_sem_censo === 1 ? 'dia' : 'dias'}` : 'sem censo')}
                      {h.compartilhado_com > 0 && (
                        <> · compartilhado com {h.compartilhado_com} {h.compartilhado_com === 1 ? 'pessoa' : 'pessoas'}</>
                      )}
                    </div>
                    <QuebraDemandas linhas={linhasQuebra(grupo.role_operacional, h.quebra)} compacto />
                  </span>
                  {/* O maior da lista em destaque: é onde a carga desta pessoa se concentra. */}
                  <span className="vol-hosp-n" style={{ color: h.horas > 0 && h.horas === maxHorasHosp ? 'var(--danger)' : undefined }}>
                    {fmtHoras(h.horas)}
                  </span>
                  <button
                    type="button"
                    className="vol-x"
                    disabled={ocupado}
                    onClick={() => remover(h.hospital_key)}
                    title={`Remover ${h.hospital_nome} de ${pessoa.nome}`}
                    aria-label={`Remover ${h.hospital_nome}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="vol-drawer-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </>
  )
}
