// Regras de cobrança do hospital dentro de uma operadora: prazos de relatório e
// cobrança de censo. O que não for personalizado segue a operadora; o backend
// guarda só os campos diferentes, então salvar tudo igual desfaz a exceção.
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { RegrasCobranca, RegrasHospitalOperadora } from '../../types/api'
import { useRegrasHospital } from '../../hooks/useHospital'
import { removerRegrasHospital, salvarRegrasHospital } from '../../services/configuracoes.service'
import { invalidarPorEvento } from '../../lib/invalidation'
import { NumField, CensoIntervaloField, censoIntervaloTexto, censoIntervaloValido } from './shared'

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const LEITOS = [['ENFERMARIA', 'Enfermaria'], ['APARTAMENTO', 'Apartamento'], ['UTI', 'UTI']]

function diasTexto(dias: number[]): string {
  const d = [...dias].sort()
  if (d.length === 7) return 'todo dia'
  if (d.join() === '0,1,2,3,4') return 'de segunda a sexta'
  return d.map((i) => DIAS[i]).join(', ')
}

function resumo(r: RegrasCobranca): string {
  const rel = `Relatório a cada ${r.dias_entre_relatorios} dias`
  if (r.censo_dispensado) return `${rel} · Sem cobrança de censo`
  if (!r.censo_tolerancia_dias) return `${rel} · Censo ${diasTexto(r.censo_dias_semana)}`
  const dias = r.censo_dias_semana.length < 7 ? `, ${diasTexto(r.censo_dias_semana)}` : ''
  return `${rel} · Censo ${censoIntervaloTexto(r.censo_tolerancia_dias)}${dias}`
}

export default function RegrasHospital({ hospitalKey, opKey, onToast }: {
  hospitalKey: string
  /** Operadora aberta na tela; sem ela, a pessoa escolhe entre as vinculadas. */
  opKey?: string
  onToast: (m: string) => void
}) {
  const qc = useQueryClient()
  const { data, isLoading } = useRegrasHospital(hospitalKey)
  const lista = data?.operadoras ?? []
  const [escolhida, setEscolhida] = useState<string | undefined>(opKey)
  const entrada: RegrasHospitalOperadora | undefined =
    lista.find((o) => o.operadora_key === (opKey ?? escolhida)) ?? lista[0]

  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState<RegrasCobranca | null>(null)
  const [dirty, setDirty] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    setForm(entrada ? { ...entrada.efetiva } : null)
    setDirty(false)
  }, [entrada])

  if (isLoading || !entrada || !form) return null

  const padrao = entrada.padrao
  const personalizada = entrada.personalizados.length > 0

  function upd<K extends keyof RegrasCobranca>(k: K, v: RegrasCobranca[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f))
    setDirty(true)
  }

  /** Dica sob o campo quando o valor difere da operadora. */
  function daOperadora(k: keyof RegrasCobranca, texto?: string): string | undefined {
    if (!form || JSON.stringify(form[k]) === JSON.stringify(padrao[k])) return undefined
    return `Operadora: ${texto ?? String(padrao[k])}`
  }

  function alternarDia(i: number) {
    if (!form) return
    const dias = form.censo_dias_semana.includes(i)
      ? form.censo_dias_semana.filter((d) => d !== i)
      : [...form.censo_dias_semana, i].sort()
    upd('censo_dias_semana', dias)
  }

  async function concluir(acao: () => Promise<unknown>, msg: string) {
    setSalvando(true)
    try {
      await acao()
      onToast(msg)
      setDirty(false)
      invalidarPorEvento(qc, 'configuracaoAlterada')
    } catch (e) { onToast(`Erro: ${(e as Error).message}`) } finally { setSalvando(false) }
  }

  const semDia = !form.censo_dispensado && form.censo_dias_semana.length === 0
  const intervaloInvalido = !form.censo_dispensado && !censoIntervaloValido(form.censo_tolerancia_dias)

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div className="card-title">Regras de cobrança</div>
        {!opKey && lista.length > 1 && (
          <select className="bm-input bm-select" style={{ width: 'auto' }} value={entrada.operadora_key}
            onChange={(e) => setEscolhida(e.target.value)} aria-label="Operadora">
            {lista.map((o) => <option key={o.operadora_key} value={o.operadora_key}>{o.operadora_nome}</option>)}
          </select>
        )}
        {(opKey || lista.length === 1) && (
          <span style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>{entrada.operadora_nome}</span>
        )}
        <span className={`badge ${personalizada ? 'info' : 'muted'}`} style={{ marginLeft: 'auto' }}>
          {personalizada ? 'Personalizada' : 'Segue a operadora'}
        </span>
        <button className="btn btn-outline btn-sm" onClick={() => setAberto((v) => !v)}>
          {aberto ? 'Fechar' : personalizada ? 'Editar' : 'Personalizar'}
        </button>
      </div>

      <div className="card-body" style={{ paddingTop: aberto ? 4 : undefined }}>
        {!aberto ? (
          <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>{resumo(entrada.efetiva)}</div>
        ) : (
          <>
            <div className="config-group">
              <div className="config-group-title">Relatórios</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
                <NumField label="Gatilho UTI" value={form.dias_uti} onChange={(v) => upd('dias_uti', v)} hint={daOperadora('dias_uti')} />
                <NumField label="Gatilho apartamento" value={form.dias_apartamento} onChange={(v) => upd('dias_apartamento', v)} hint={daOperadora('dias_apartamento')} />
                <NumField label="Gatilho enfermaria" value={form.dias_enfermaria} onChange={(v) => upd('dias_enfermaria', v)} hint={daOperadora('dias_enfermaria')} />
                <div className="config-field">
                  <label>Leito não identificado</label>
                  <select className="bm-input bm-select" value={form.fallback_sem_leito} onChange={(e) => upd('fallback_sem_leito', e.target.value)}>
                    {LEITOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  {daOperadora('fallback_sem_leito') && <div className="config-hint">{daOperadora('fallback_sem_leito')}</div>}
                </div>
                <NumField label="Janela entre relatórios" value={form.dias_entre_relatorios} onChange={(v) => upd('dias_entre_relatorios', v)} hint={daOperadora('dias_entre_relatorios')} />
                <NumField label="Alerta antecipado" value={form.alerta_antecipado_dias} onChange={(v) => upd('alerta_antecipado_dias', v)} hint={daOperadora('alerta_antecipado_dias')} />
                <NumField label="Longa permanência" value={form.dias_longa_permanencia} onChange={(v) => upd('dias_longa_permanencia', v)} hint={daOperadora('dias_longa_permanencia')} />
                <NumField label="Longa avançada" value={form.dias_longa_avancada} onChange={(v) => upd('dias_longa_avancada', v)} hint={daOperadora('dias_longa_avancada')} />
              </div>
              <div className="toggle-wrap">
                <div>
                  <div className="fw-6" style={{ fontSize: 'var(--t-base)' }}>Monitorar longa permanência</div>
                  {daOperadora('usar_longa_permanencia', padrao.usar_longa_permanencia ? 'sim' : 'não') && (
                    <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>{daOperadora('usar_longa_permanencia', padrao.usar_longa_permanencia ? 'sim' : 'não')}</div>
                  )}
                </div>
                <button type="button" className={`toggle${form.usar_longa_permanencia ? ' on' : ''}`} aria-pressed={form.usar_longa_permanencia}
                  onClick={() => upd('usar_longa_permanencia', !form.usar_longa_permanencia)} title="Monitorar longa permanência">
                  <div className="toggle-knob" />
                </button>
              </div>
            </div>

            <div className="config-group">
              <div className="config-group-title">Censo</div>
              <div className="toggle-wrap">
                <div>
                  <div className="fw-6" style={{ fontSize: 'var(--t-base)' }}>Cobrar censo deste hospital</div>
                  {daOperadora('censo_dispensado', padrao.censo_dispensado ? 'não cobra' : 'cobra') && (
                    <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>{daOperadora('censo_dispensado', padrao.censo_dispensado ? 'não cobra' : 'cobra')}</div>
                  )}
                </div>
                <button type="button" className={`toggle${!form.censo_dispensado ? ' on' : ''}`} aria-pressed={!form.censo_dispensado}
                  onClick={() => upd('censo_dispensado', !form.censo_dispensado)} title="Cobrar censo deste hospital">
                  <div className="toggle-knob" />
                </button>
              </div>
              {!form.censo_dispensado && (
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, alignItems: 'start' }}>
                  <CensoIntervaloField tolerancia={form.censo_tolerancia_dias} onChange={(v) => upd('censo_tolerancia_dias', v)}
                    hint={daOperadora('censo_tolerancia_dias', censoIntervaloTexto(padrao.censo_tolerancia_dias))} />
                  <div className="config-field">
                    <label>Dias com censo</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {DIAS.map((d, i) => {
                        const on = form.censo_dias_semana.includes(i)
                        return (
                          <button key={d} type="button" aria-pressed={on} onClick={() => alternarDia(i)}
                            className={`btn btn-sm ${on ? 'btn-primary' : 'btn-outline'}`}>{d}</button>
                        )
                      })}
                    </div>
                    {semDia
                      ? <div className="config-hint" style={{ color: 'var(--danger)' }}>Escolha ao menos um dia.</div>
                      : daOperadora('censo_dias_semana', diasTexto(padrao.censo_dias_semana)) && (
                        <div className="config-hint">{daOperadora('censo_dias_semana', diasTexto(padrao.censo_dias_semana))}</div>
                      )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {personalizada && (
                <button className="btn btn-outline btn-sm" disabled={salvando}
                  onClick={() => {
                    if (!confirm(`Voltar às regras de ${entrada.operadora_nome}?`)) return
                    concluir(() => removerRegrasHospital(hospitalKey, entrada.operadora_key), 'Hospital voltou às regras da operadora')
                  }}>
                  Usar regras da operadora
                </button>
              )}
              <button className="btn btn-primary btn-sm" disabled={!dirty || salvando || semDia || intervaloInvalido}
                onClick={() => concluir(() => salvarRegrasHospital(hospitalKey, entrada.operadora_key, form), '✓ Regras salvas')}>
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
