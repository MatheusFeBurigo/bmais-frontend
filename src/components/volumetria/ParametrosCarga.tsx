// Card recolhível "Parâmetros de carga": o que a tela chama de sobrecarga é
// uma ESTIMATIVA (minutos por caso, capacidade, limiares), e o coordenador
// calibra aqui. Salvar manda só os campos do grupo; `capacidade_por_pessoa`
// não passa por este formulário (é editada no painel da pessoa) e por isso
// fica intacta. Restaurar apaga a calibração inteira do grupo, inclusive as
// capacidades próprias — por isso pede confirmação.
import { useEffect, useState } from 'react'
import type { VolumetriaGrupo, VolumetriaParametrosCorpo } from '../../types/api'
import { useRestaurarParametrosVolumetria, useSalvarParametrosVolumetria } from '../../hooks/useVolumetria'

type Campos = Record<string, string>

function daTela(g: VolumetriaGrupo): Campos {
  const p = g.parametros
  const c: Campos = {
    capacidade_horas_dia: String(p.capacidade_horas_dia),
    fila_atencao_dias: String(p.limiares.fila_atencao_dias),
    fila_sobrecarga_dias: String(p.limiares.fila_sobrecarga_dias),
  }
  if (g.role_operacional === 'tecnico') {
    c.UTI = String(p.minutos_leito?.UTI ?? '')
    c.APARTAMENTO = String(p.minutos_leito?.APARTAMENTO ?? '')
    c.ENFERMARIA = String(p.minutos_leito?.ENFERMARIA ?? '')
    c.fator_longa_10 = String(p.fator_longa_10 ?? '')
    c.fator_longa_30 = String(p.fator_longa_30 ?? '')
    c.fator_reanalise = String(p.fator_reanalise ?? '')
    c.prazo_dias = String(p.prazo_dias)
    c.pressao_atencao_pct = String(p.limiares.pressao_atencao_pct)
    c.pressao_sobrecarga_pct = String(p.limiares.pressao_sobrecarga_pct)
  } else {
    c.minutos_cobranca = String(p.minutos_cobranca ?? '')
  }
  return c
}

function num(v: string): number | undefined {
  const n = Number(String(v).replace(',', '.'))
  return v.trim() === '' || Number.isNaN(n) ? undefined : n
}

function paraCorpo(g: VolumetriaGrupo, c: Campos): VolumetriaParametrosCorpo {
  const corpo: VolumetriaParametrosCorpo = {
    capacidade_horas_dia: num(c.capacidade_horas_dia),
    limiares: {
      fila_atencao_dias: num(c.fila_atencao_dias),
      fila_sobrecarga_dias: num(c.fila_sobrecarga_dias),
    },
  }
  if (g.role_operacional === 'tecnico') {
    corpo.minutos_leito = { UTI: num(c.UTI), APARTAMENTO: num(c.APARTAMENTO), ENFERMARIA: num(c.ENFERMARIA) }
    corpo.fator_longa_10 = num(c.fator_longa_10)
    corpo.fator_longa_30 = num(c.fator_longa_30)
    corpo.fator_reanalise = num(c.fator_reanalise)
    corpo.prazo_dias = num(c.prazo_dias)
    corpo.limiares = {
      ...corpo.limiares,
      pressao_atencao_pct: num(c.pressao_atencao_pct),
      pressao_sobrecarga_pct: num(c.pressao_sobrecarga_pct),
    }
  } else {
    corpo.minutos_cobranca = num(c.minutos_cobranca)
  }
  return corpo
}

function Campo({ id, label, campos, onChange, step = 1, min = 0, sufixo }: {
  id: string; label: string; campos: Campos; onChange: (id: string, v: string) => void
  step?: number; min?: number; sufixo?: string
}) {
  return (
    <div className="vol-param">
      <label htmlFor={`vp-${id}`}>{label}{sufixo ? ` (${sufixo})` : ''}</label>
      <input id={`vp-${id}`} className="bm-input" type="number" step={step} min={min}
        value={campos[id] ?? ''} onChange={(e) => onChange(id, e.target.value)} />
    </div>
  )
}

export default function ParametrosCarga({ grupo, onErro, onAviso }: {
  grupo: VolumetriaGrupo
  onErro: (msg: string) => void
  onAviso: (msg: string) => void
}) {
  const [aberto, setAberto] = useState(false)
  const [campos, setCampos] = useState<Campos>(() => daTela(grupo))
  const [confirmando, setConfirmando] = useState(false)
  const salvar = useSalvarParametrosVolumetria()
  const restaurar = useRestaurarParametrosVolumetria()
  const ocupado = salvar.isPending || restaurar.isPending
  const tecnico = grupo.role_operacional === 'tecnico'
  const meta = grupo.parametros_meta

  // O servidor confirmou (ou trocou o grupo): o formulário volta a espelhar o
  // que vale, descartando qualquer rascunho.
  useEffect(() => {
    setCampos(daTela(grupo))
    setConfirmando(false)
  }, [grupo.papel, meta.atualizado_em, meta.personalizado])

  const mudar = (id: string, v: string) => setCampos((c) => ({ ...c, [id]: v }))

  function aoSalvar() {
    salvar.mutate({ grupo: grupo.role_operacional, corpo: paraCorpo(grupo, campos) }, {
      onSuccess: () => onAviso('Parâmetros salvos. A carga foi recalculada.'),
      onError: (e) => onErro(e instanceof Error && e.message ? e.message : 'Não foi possível salvar os parâmetros.'),
    })
  }

  function aoRestaurar() {
    if (!confirmando) { setConfirmando(true); return }
    restaurar.mutate(grupo.role_operacional, {
      onSuccess: () => onAviso('Parâmetros restaurados ao padrão.'),
      onError: () => onErro('Não foi possível restaurar. Tente de novo.'),
      onSettled: () => setConfirmando(false),
    })
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-header">
        <div>
          <div className="card-title">Parâmetros de carga</div>
          <p className="card-sub">
            {meta.personalizado
              ? `Calibrado${meta.atualizado_por ? ` por ${meta.atualizado_por}` : ''}${meta.atualizado_em ? ` em ${new Date(meta.atualizado_em).toLocaleDateString('pt-BR')}` : ''}.`
              : 'Padrões do sistema.'}
            {' '}O tempo de cada caso é uma estimativa: ajuste até a carga bater com a realidade da equipe.
          </p>
        </div>
        <button type="button" className="vol-toggle" onClick={() => setAberto((v) => !v)} aria-expanded={aberto}>
          {aberto ? 'Recolher' : 'Ajustar'}
        </button>
      </div>

      {aberto && (
        <div>
          {tecnico ? (
            <>
              <div className="vol-param-sec primeira">Minutos por caso, pelo tipo de leito</div>
              <div className="vol-param-grid">
                <Campo id="UTI" label="UTI" sufixo="min" campos={campos} onChange={mudar} min={1} />
                <Campo id="APARTAMENTO" label="Apartamento" sufixo="min" campos={campos} onChange={mudar} min={1} />
                <Campo id="ENFERMARIA" label="Enfermaria" sufixo="min" campos={campos} onChange={mudar} min={1} />
              </div>
              <div className="vol-param-sec">Multiplicadores</div>
              <div className="vol-param-grid">
                <Campo id="fator_longa_10" label="Longa permanência (10+ dias)" sufixo="×" campos={campos} onChange={mudar} step={0.1} min={0.1} />
                <Campo id="fator_longa_30" label="Longa permanência (30+ dias)" sufixo="×" campos={campos} onChange={mudar} step={0.1} min={0.1} />
                <Campo id="fator_reanalise" label="Reanálise (já tem relatório)" sufixo="×" campos={campos} onChange={mudar} step={0.1} min={0.1} />
              </div>
            </>
          ) : (
            <>
              <div className="vol-param-sec primeira">Minutos por hospital sem censo</div>
              <div className="vol-param-grid">
                <Campo id="minutos_cobranca" label="Por hospital a cobrar" sufixo="min" campos={campos} onChange={mudar} min={1} />
              </div>
            </>
          )}

          <div className="vol-param-sec">Capacidade e limiares</div>
          <div className="vol-param-grid">
            <Campo id="capacidade_horas_dia" label="Capacidade padrão" sufixo="h/dia" campos={campos} onChange={mudar} step={0.5} min={0.5} />
            <Campo id="fila_atencao_dias" label="Atenção a partir de" sufixo="dias de fila" campos={campos} onChange={mudar} step={0.5} />
            <Campo id="fila_sobrecarga_dias" label="Sobrecarga a partir de" sufixo="dias de fila" campos={campos} onChange={mudar} step={0.5} />
            {tecnico && (
              <>
                <Campo id="prazo_dias" label="Janela de prazo" sufixo="dias" campos={campos} onChange={mudar} min={1} />
                <Campo id="pressao_atencao_pct" label="Atenção no prazo" sufixo="%" campos={campos} onChange={mudar} />
                <Campo id="pressao_sobrecarga_pct" label="Sobrecarga no prazo" sufixo="%" campos={campos} onChange={mudar} />
              </>
            )}
          </div>

          <div className="vol-param-acoes">
            <button type="button" className="btn btn-primary btn-sm" disabled={ocupado} onClick={aoSalvar}>
              {salvar.isPending ? 'Salvando…' : 'Salvar parâmetros'}
            </button>
            <button type="button" className="btn btn-outline btn-sm" disabled={ocupado} onClick={() => setCampos(daTela(grupo))}>
              Desfazer
            </button>
            {meta.personalizado && (
              <button type="button" className={`btn btn-sm ${confirmando ? 'btn-outline' : 'btn-ghost'}`}
                style={confirmando ? { color: 'var(--danger)', borderColor: 'var(--danger)' } : undefined}
                disabled={ocupado} onClick={aoRestaurar}
                title="Apaga a calibração do grupo, inclusive as capacidades próprias das pessoas">
                {restaurar.isPending ? 'Restaurando…' : confirmando ? 'Confirmar: voltar ao padrão' : 'Restaurar padrão'}
              </button>
            )}
            {confirmando && !ocupado && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmando(false)}>Cancelar</button>
            )}
            <span className="vol-param-meta">Dias corridos. Casos que vencem dentro da janela de prazo contam na pressão.</span>
          </div>
        </div>
      )}
    </div>
  )
}
