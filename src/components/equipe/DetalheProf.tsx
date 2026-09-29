// Painel de detalhe/edição de um profissional (dados + escala + ativar/desativar).
// Extraído de pages/Equipe.tsx.
import { useMemo, useState } from 'react'
import type { ProfTipo, ProfissionalDetalhe } from '../../types/api'
import { Badge } from '../ui'
import { atualizarProfissional, criarAcessoProfissional, definirAtivoProfissional } from '../../services/equipe.service'
import { adicionarEscala } from '../../services/escala.service'
import { useTodosHospitais } from '../../hooks/useEquipe'
import { TIPO_LABEL, isAtivo } from './equipe.styles'
import { IconPlus, IconCheck } from './icons'
import EscalaList from './EscalaList'
import SeletorEscala from './SeletorEscala'

export default function DetalheProf({ detalhe, opsLista, onToast, onChanged }: {
  detalhe: ProfissionalDetalhe
  opsLista: Array<{ key: string; nome: string }>
  onToast: (m: string) => void
  onChanged: () => void
}) {
  const p = detalhe.profissional
  const ativo = isAtivo(p)
  const [nome, setNome] = useState(p.nome)
  const [tipo, setTipo] = useState<ProfTipo>(p.tipo)
  // E-mail de acesso: `acesso` ausente = quem vê não gere contas (campo some);
  // null = sem conta, e informar o e-mail aqui cria a conta, com a senha
  // inicial. Com conta, o e-mail só é exibido (o Auth não troca e-mail por
  // aqui); a senha se redefine pelo atalho Senha da lista.
  const gereContas = detalhe.acesso !== undefined
  const [email, setEmail] = useState('')
  const [senhaInicial, setSenhaInicial] = useState('')
  const [formEscala, setFormEscala] = useState(false)
  const [saving, setSaving] = useState(false)

  // Hospitais: a escala se agrupa pela cidade de cada um, e o seletor usa a
  // mesma lista. Só busca quando há o que mostrar; o cache é o mesmo da modal
  // de cadastro e da aba de usuários.
  const { data: hospitais, isLoading: carregandoHospitais } = useTodosHospitais(formEscala || detalhe.escala.length > 0)

  const jaNaEscala = useMemo(
    () => detalhe.escala.map((e) => e.hospital_key).filter(Boolean) as string[],
    [detalhe.escala],
  )

  async function salvarEdicao() {
    const n = nome.trim()
    if (!n) { onToast('Nome não pode ser vazio'); return }
    const e = email.trim()
    if (e && !e.includes('@')) { onToast('Informe um e-mail válido'); return }
    if (e && senhaInicial.length < 6) { onToast('A senha inicial precisa de no mínimo 6 caracteres'); return }
    setSaving(true)
    try {
      await atualizarProfissional(p.id, n, tipo)
      if (e) {
        await criarAcessoProfissional(p.id, { email: e, password: senhaInicial })
        setEmail('')
        setSenhaInicial('')
      }
      onToast(e ? '✓ Dados atualizados e acesso criado' : '✓ Dados atualizados')
      onChanged()
    } catch (err) {
      onToast(`Erro: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  async function toggleAtivo() {
    const novo = !ativo
    // Com conta na plataforma, desativar também suspende o acesso: dizer antes.
    const aviso = detalhe.acesso && !novo ? ' O acesso dele à plataforma será suspenso.' : ''
    if (!confirm(`${novo ? 'Reativar' : 'Desativar'} este profissional?${aviso}`)) return
    try {
      await definirAtivoProfissional(p.id, novo)
      onToast(novo ? '✓ Profissional reativado' : 'Profissional desativado')
      onChanged()
    } catch (err) {
      onToast(`Erro: ${(err as Error).message}`)
    }
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="row" style={{ gap: 14, marginBottom: 16 }}>
        <div className={`prof-avatar ${tipo}`} style={{ width: 44, height: 44, fontSize: 15, borderRadius: 12 }}>{nome.slice(0, 2).toUpperCase()}</div>
        <div className="flex-1" style={{ minWidth: 0 }}>
          <div className="fw-7" style={{ fontSize: 'var(--t-lg)', color: 'var(--ink)', lineHeight: 1.2 }}>{p.nome}</div>
          <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', marginTop: 2 }}>{TIPO_LABEL[p.tipo]}</div>
        </div>
        {ativo ? <Badge variant="success" dot>Ativo</Badge> : <Badge variant="muted">Inativo</Badge>}
      </div>

      {/* Campos editáveis */}
      <div style={{ display: 'grid', gap: 10, marginBottom: 16, padding: 14, background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
        <div className="edit-field">
          <label>Nome completo</label>
          <input type="text" className="bm-input" style={{ fontSize: 'var(--t-sm)' }} value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="edit-field">
          <label>Cargo / Tipo</label>
          <select className="bm-input bm-select" style={{ fontSize: 'var(--t-sm)' }} value={tipo} onChange={(e) => setTipo(e.target.value as ProfTipo)}>
            <option value="E">Enfermeiro(a)</option>
            <option value="M">Médico(a) Auditor(a)</option>
          </select>
        </div>
        {gereContas && (detalhe.acesso ? (
          <div className="edit-field">
            <label>E-mail de acesso</label>
            <input type="email" className="bm-input" style={{ fontSize: 'var(--t-sm)' }} value={detalhe.acesso.email ?? ''} readOnly disabled />
          </div>
        ) : (
          <>
            <div className="edit-field">
              <label>E-mail de acesso</label>
              <input type="email" className="bm-input" style={{ fontSize: 'var(--t-sm)' }} placeholder="Sem acesso"
                value={email} onChange={(ev) => setEmail(ev.target.value)} autoComplete="off" />
            </div>
            {email.trim() && (
              <div className="edit-field">
                <label>Senha inicial</label>
                <input type="password" className="bm-input" style={{ fontSize: 'var(--t-sm)' }} placeholder="Mínimo de 6 caracteres"
                  value={senhaInicial} onChange={(ev) => setSenhaInicial(ev.target.value)} autoComplete="new-password" />
              </div>
            )}
          </>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary btn-sm" onClick={salvarEdicao} disabled={saving}>
            {IconCheck}
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Escala de Hospitais */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div className="section-label" style={{ marginBottom: 0 }}>Escala de Hospitais</div>
        <button className="btn btn-outline btn-sm" onClick={() => setFormEscala((v) => !v)}>
          {IconPlus}
          Adicionar
        </button>
      </div>

      {formEscala && (
        <SeletorEscala
          hospitais={hospitais ?? []}
          opsLista={opsLista}
          jaNaEscala={jaNaEscala}
          loading={carregandoHospitais}
          onAdicionar={async (entradas) => {
            // Um POST por entrada: a API grava uma linha de escala por vez e
            // não há transação (PostgREST). Se uma falhar, as outras já estão
            // gravadas, então o aviso conta o que entrou em vez de dizer só
            // "erro" e deixar a pessoa sem saber o que refazer.
            let ok = 0
            const falhas: string[] = []
            for (const entrada of entradas) {
              try {
                await adicionarEscala({ ...entrada, profissional_id: p.id })
                ok += 1
              } catch {
                falhas.push(entrada.hospital_nome)
              }
            }
            onChanged()
            if (falhas.length === 0) {
              onToast(`✓ ${ok} ${ok === 1 ? 'hospital adicionado' : 'hospitais adicionados'} à escala`)
              setFormEscala(false)
            } else {
              const nomes = Array.from(new Set(falhas)).join(', ')
              onToast(`${ok} ${ok === 1 ? 'hospital entrou' : 'hospitais entraram'} na escala. Não foi possível incluir: ${nomes}. Tente de novo.`)
            }
          }}
          onClose={() => setFormEscala(false)}
        />
      )}

      <div style={{ marginBottom: 16 }}>
        <EscalaList escala={detalhe.escala} hospitais={hospitais ?? []} opsLista={opsLista} profissionalId={p.id} onToast={onToast} onChanged={onChanged} />
      </div>

      {/* Ações */}
      <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${ativo ? 'btn-outline' : 'btn-primary'}`} onClick={toggleAtivo}>
          {ativo ? 'Desativar' : '✓ Reativar'}
        </button>
      </div>
    </div>
  )
}
