// Drawer da pessoa: quem é, quanto carrega (indicadores), a capacidade dela
// (editável), quais hospitais cobre — cada um com a própria quebra de demandas
// — e as ações: adicionar hospital (combobox com busca) e remover (×).
// O operacional responde por OPERADORA (08/10/2026): no lugar dos hospitais
// edita as operadoras dele, e os hospitais ficam só para leitura (vêm delas).
// Mesma casca de PacienteDrawer; fecha no backdrop, no × e no Esc.
import { useEffect, useMemo, useState } from 'react'
import type { VolumetriaGrupo, VolumetriaPessoa } from '../../types/api'
import { useTodosHospitais } from '../../hooks/useEquipe'
import {
  useDesvincularOperadoraVolumetria, useDesvincularVolumetria, useSalvarParametrosVolumetria,
  useVincularOperadoraVolumetria, useVincularVolumetria,
} from '../../hooks/useVolumetria'
import { useTravarScroll } from '../../lib/travarScroll'
import { HospitalCombobox } from '../HospitalCombobox'
import { PendenciasDaPessoa } from '../pendencias/PendenciasDaPessoa'
import { Badge, OpAvatar } from '../ui'
import QuebraDemandas from './QuebraDemandas'
import TempoPorTarefa from './TempoPorTarefa'
import {
  NIVEL_BADGE, NIVEL_LABEL, NIVEL_VAR, fmt1, fmtDiaMes, fmtDias, fmtHoras, hospitaisPorRegiao, iniciais,
  linhasQuebra, nomeOperadora, operadorasDaPessoa, rotuloGrupo,
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
  const porOperadora = !!pessoa.por_operadora
  // O cadastro de hospitais só serve a quem é por hospital.
  const todos = useTodosHospitais(!porOperadora)
  const vincular = useVincularVolumetria()
  const desvincular = useDesvincularVolumetria()
  const vincularOp = useVincularOperadoraVolumetria()
  const desvincularOp = useDesvincularOperadoraVolumetria()
  const salvarParams = useSalvarParametrosVolumetria()
  const [novo, setNovo] = useState('')
  const [novaOp, setNovaOp] = useState('')
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
    setNovaOp('')
    setCap(String(pessoa.capacidade_horas_dia))
  }, [pessoa.user_id, pessoa.capacidade_horas_dia])

  const disponiveis = useMemo(() => {
    const ja = new Set(pessoa.hospitais.map((h) => h.hospital_key))
    return (todos.data ?? []).filter((h) => !ja.has(h.key))
  }, [todos.data, pessoa.hospitais])

  const opsDisponiveis = useMemo(() => {
    const ja = new Set(pessoa.operadoras ?? [])
    return (grupo.operadoras ?? []).filter((o) => !ja.has(o.operadora_key))
  }, [grupo.operadoras, pessoa.operadoras])

  const ocupado = vincular.isPending || desvincular.isPending || salvarParams.isPending
    || vincularOp.isPending || desvincularOp.isPending
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

  function adicionarOperadora() {
    if (!novaOp) return
    vincularOp.mutate({ operadoraKey: novaOp, userId: pessoa.user_id }, {
      onSuccess: () => setNovaOp(''),
      onError: () => onErro('Não foi possível adicionar a operadora. Tente de novo.'),
    })
  }

  function removerOperadora(operadoraKey: string) {
    desvincularOp.mutate({ operadoraKey, userId: pessoa.user_id }, {
      onError: () => onErro('Não foi possível remover a operadora. Tente de novo.'),
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
              <span>
                {pessoa.coordenador ? rotulo.coordenador : rotulo.singular}
                {porOperadora && <> · {operadorasDaPessoa(grupo, pessoa) || 'sem operadora'}</>}
                {' '}· {pessoa.hospitais_n} {pessoa.hospitais_n === 1 ? 'hospital' : 'hospitais'}
              </span>
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
              {porOperadora ? (
                <>
                  Esta pessoa não tem operadoras definidas e por isso vê <b>toda a rede</b>.
                  Adicione operadoras para definir a área dela — ela passa a cobrar os censos dos
                  hospitais dessas operadoras, e a carga é contada a partir daí.
                </>
              ) : (
                <>
                  Esta pessoa não tem hospitais definidos e por isso vê <b>toda a rede</b>.
                  Adicione hospitais para definir a área dela — a carga passa a ser contada a partir daí.
                </>
              )}
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

          {/* Pendências avulsas (21/10/2026): o que o gestor ou o coordenador
              pediu a esta pessoa, fora da carga em horas. */}
          <PendenciasDaPessoa pessoa={pessoa} onAviso={onErro} />

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

          {porOperadora ? (
            <>
              {/* A área do operacional: operadoras inteiras. Cada uma traz os
                  censos de todos os hospitais dela para o quadro da pessoa. */}
              <div className="vol-sub" style={{ marginTop: 16 }}>Operadoras</div>
              {(pessoa.operadoras ?? []).map((k) => {
                const outros = (grupo.operadoras ?? [])
                  .find((o) => o.operadora_key === k)?.responsaveis
                  .filter((r) => r.user_id !== pessoa.user_id) ?? []
                return (
                  <div className="vol-hosp" key={k}>
                    <OpAvatar opKey={k} size={28} />
                    <span style={{ minWidth: 0 }}>
                      <div className="vol-hosp-nome">{nomeOperadora(grupo, k)}</div>
                      <div className="vol-hosp-sub">
                        {outros.length > 0
                          ? `também com ${outros.map((r) => r.nome).join(', ')}`
                          : `só com ${pessoa.nome}`}
                      </div>
                    </span>
                    <span />
                    <button
                      type="button"
                      className="vol-x"
                      disabled={ocupado}
                      onClick={() => removerOperadora(k)}
                      title={`Remover ${nomeOperadora(grupo, k)} de ${pessoa.nome}`}
                      aria-label={`Remover ${nomeOperadora(grupo, k)}`}
                    >
                      ×
                    </button>
                  </div>
                )
              })}
              <div className="vol-add">
                <select
                  className="bm-input bm-select"
                  style={{ flex: 1, minWidth: 0 }}
                  value={novaOp}
                  disabled={ocupado || opsDisponiveis.length === 0}
                  onChange={(e) => setNovaOp(e.target.value)}
                  aria-label="Adicionar operadora"
                >
                  <option value="">
                    {opsDisponiveis.length === 0 ? 'Já tem todas as operadoras' : 'Adicionar operadora…'}
                  </option>
                  {opsDisponiveis.map((o) => (
                    <option key={o.operadora_key} value={o.operadora_key}>{o.operadora_nome}</option>
                  ))}
                </select>
                <button type="button" className="btn btn-primary btn-sm" disabled={!novaOp || ocupado} onClick={adicionarOperadora}>
                  {vincularOp.isPending ? 'Adicionando…' : 'Adicionar'}
                </button>
              </div>
              {pessoa.hospitais.length > 0 && (
                <div className="vol-sub" style={{ marginTop: 16, marginBottom: 0 }}>
                  Hospitais das operadoras dela
                </div>
              )}
            </>
          ) : (
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
          )}

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
                      {h.temporario && (
                        <> · de {h.temporario.de_nome} até {fmtDiaMes(h.temporario.fim)}</>
                      )}
                      {h.compartilhado_com > 0 && (
                        <> · compartilhado com {h.compartilhado_com} {h.compartilhado_com === 1 ? 'pessoa' : 'pessoas'}</>
                      )}
                    </div>
                    <QuebraDemandas linhas={linhasQuebra(grupo.role_operacional, h.quebra)} compacto />
                  </span>
                  {/* O maior da lista em destaque: é onde a carga desta pessoa se concentra. */}
                  <span className={`vol-hosp-n${h.horas > 0 ? '' : ' zero'}`} style={{ color: h.horas > 0 && h.horas === maxHorasHosp ? 'var(--danger)' : undefined }}>
                    {fmtHoras(h.horas)}
                  </span>
                  {/* Recebido por divisão temporária: sai sozinho ao fim do período
                      (ou ao cancelar a divisão). Remover aqui não teria efeito,
                      porque o hospital não está na área definida da pessoa. Do
                      operacional, o hospital vem da operadora: muda-se a operadora. */}
                  {h.temporario || porOperadora ? <span /> : <button
                    type="button"
                    className="vol-x"
                    disabled={ocupado}
                    onClick={() => remover(h.hospital_key)}
                    title={`Remover ${h.hospital_nome} de ${pessoa.nome}`}
                    aria-label={`Remover ${h.hospital_nome}`}
                  >
                    ×
                  </button>}
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
