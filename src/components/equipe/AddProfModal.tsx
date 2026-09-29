// Modal: adicionar novo profissional. Extraído de pages/Equipe.tsx.
//
// Os hospitais sob responsabilidade dele são escolhidos AQUI, no cadastro.
// Antes a escala só podia ser montada depois, na ficha, o que obrigava quem
// cadastra um auditor a fazer dois gestos para uma coisa que ele já sabe de
// cara: "este médico cuida destes hospitais". Marcar o hospital JÁ é a escolha
// (sem o passo "incluir na lista", que confundia); tudo vai num pedido só e o
// backend grava o profissional e os hospitais com o id recém-criado. Um serviço
// só vale para todos; serviço diferente por hospital se ajusta na ficha.
//
// A escolha é por CIDADE (ver SeletorEscala): um médico auditor costuma cobrir
// vários hospitais de uma cidade, em mais de uma operadora, e o formulário
// antigo pedia um por vez tendo a operadora como primeiro passo.
//
// O acesso à plataforma (e-mail + senha) nasce aqui também, como na criação de
// usuário de sistema, mas sem escolha de papel: médico ou enfermeiro sai do
// tipo. A conta leva ao portal do profissional, sem nada interno.
import { useState } from 'react'
import type { ProfissionalCriado, ProfTipo } from '../../types/api'
import { Modal } from '../ui'
import { criarProfissional } from '../../services/equipe.service'
import { useTodosHospitais } from '../../hooks/useEquipe'
import type { EntradaEscala } from '../../services/escala.service'
import { SERVICOS } from './equipe.styles'
import SeletorEscala from './SeletorEscala'

const labelStyle = { display: 'block', marginBottom: 5, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 } as const

// Mensagem de conclusão: diz o que aconteceu com o profissional E com a
// escala, porque os dois podem ter destinos diferentes (não há transação: o
// cadastro fica gravado mesmo que um hospital não entre).
function mensagemDeConclusao(r: ProfissionalCriado, pedidos: number): string {
  const base = r.existing ? 'Profissional já estava cadastrado' : '✓ Profissional adicionado'
  // O acesso tem destino próprio: o cadastro fica gravado mesmo que a conta
  // não possa ser criada (ex.: e-mail já em uso), e a ficha oferece criar depois.
  const acesso = r.acesso_erro
    ? ` O acesso à plataforma não foi criado: ${r.acesso_erro} Crie pela ficha dele.`
    : ''
  if (pedidos === 0) return `${base}${r.acesso ? ' com acesso à plataforma' : ''}.${acesso}`
  const ok = r.escala_adicionada ?? 0
  const falhas = r.escala_falhas?.length ?? 0
  const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`
  if (falhas === 0) return `${base} com ${plural(ok, 'hospital', 'hospitais')} na escala.${acesso}`
  return `${base}, mas ${plural(falhas, 'hospital não entrou', 'hospitais não entraram')} na escala. Confira na ficha dele.${acesso}`
}

// Mesma regra do backend (usuarios.validar_credenciais), checada antes de enviar
// para a pessoa corrigir no campo em vez de receber o erro depois.
function erroDoAcesso(email: string, senha: string): string | null {
  if (!email.trim()) return 'Informe o e-mail de acesso do profissional'
  if (!email.includes('@')) return 'Informe um e-mail válido'
  if (senha.length < 6) return 'A senha deve ter ao menos 6 caracteres'
  return null
}

export default function AddProfModal({ opsLista, onClose, onDone, onError }: {
  opsLista: Array<{ key: string; nome: string }>
  onClose: () => void
  onDone: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [tipo, setTipo] = useState<ProfTipo>('E')
  const [nome, setNome] = useState('')
  /** hospital_keys marcadas (uma por operadora do hospital). */
  const [marcados, setMarcados] = useState<Set<string>>(new Set())
  const [servico, setServico] = useState('P')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)

  // Todos os hospitais de uma vez: a escolha é por cidade, não por operadora,
  // então não há um passo anterior que estreite a lista.
  const { data: hospitais, isLoading: carregandoHospitais } = useTodosHospitais()

  function montarEscala(): EntradaEscala[] {
    return (hospitais ?? [])
      .filter((h) => marcados.has(h.key))
      .map((h) => ({ hospital_key: h.key, hospital_nome: h.nome, operadora_key: h.operadora_key || '', servico }))
  }

  async function adicionar() {
    const n = nome.trim()
    if (!n) { onError('Informe o nome do profissional'); return }
    const erro = erroDoAcesso(email, senha)
    if (erro) { onError(erro); return }
    setSaving(true)
    try {
      const escala = montarEscala()
      const r = await criarProfissional(n, tipo, escala, { email, password: senha })
      onDone(mensagemDeConclusao(r, escala.length))
    } catch (err) {
      onError(`Erro: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Adicionar Profissional"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={adicionar} disabled={saving}>{saving ? 'Adicionando…' : 'Adicionar'}</button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label className="uppercase t-muted" style={labelStyle}>Tipo *</label>
          <select className="bm-input bm-select" value={tipo} onChange={(e) => setTipo(e.target.value as ProfTipo)}>
            <option value="E">Enfermeiro(a)</option>
            <option value="M">Médico(a) Auditor(a)</option>
          </select>
        </div>
        <div>
          <label className="uppercase t-muted" style={labelStyle}>Nome completo *</label>
          <input type="text" className="bm-input" placeholder="Ex: Ana Clara Souza" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        </div>

        {/* Acesso à plataforma: o profissional entra com estes dados e vê só o
            portal dele (médico ou enfermeiro, conforme o tipo acima). */}
        <div>
          <label className="uppercase t-muted" style={labelStyle} htmlFor="prof-email">E-mail de acesso *</label>
          <input id="prof-email" type="email" className="bm-input" placeholder="nome@exemplo.com"
            value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
        </div>
        <div>
          <label className="uppercase t-muted" style={labelStyle} htmlFor="prof-senha">Senha inicial *</label>
          <div style={{ position: 'relative' }}>
            <input id="prof-senha" type={showPw ? 'text' : 'password'} className="bm-input" placeholder="Mínimo de 6 caracteres"
              value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer', fontSize: 'var(--t-sm)' }}>
              {showPw ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>

        <div>
          <label className="uppercase t-muted" style={labelStyle}>
            Hospitais
            {marcados.size > 0 && <span style={{ marginLeft: 6, color: 'var(--primary-3)' }}>{marcados.size}</span>}
          </label>
          <SeletorEscala
            hospitais={hospitais ?? []}
            opsLista={opsLista}
            marcados={marcados}
            onMarcar={setMarcados}
            onAdicionar={() => {}}
            loading={carregandoHospitais}
          />
        </div>
        {marcados.size > 0 && (
          <div>
            <label className="uppercase t-muted" style={labelStyle}>Serviço</label>
            <select className="bm-input bm-select" value={servico} onChange={(e) => setServico(e.target.value)}>
              {SERVICOS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        )}
      </div>
    </Modal>
  )
}
