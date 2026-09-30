// Página de criar/editar um usuário de acesso. Uma só página cobre os dois modos:
// sem :id → criar (pede e-mail/senha); com :id → editar (só papel + escopo).
// Substitui as antigas modais de UsuariosAcesso. Admin-only (guard na rota + aqui).
//
// O formulário é dividido em ETAPAS expansíveis (dados da conta → nível de
// acesso → escopo). Ao completar o obrigatório de uma etapa, ela fecha com um
// ok ao lado do título e a próxima abre sozinha; qualquer etapa pode ser
// reaberta clicando no título. Na edição tudo já vem preenchido, então as
// etapas começam concluídas e só a primeira aberta.
import { useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { podeGerirConta, podeGerirOperacoes, rotaFallback } from '../auth/permissions'
import { usePageHeader } from '../components/PageHeader'
import { LoadingState } from '../components/ui'
import Toast from '../components/Toast'
import MultiSelectHospitais from '../components/MultiSelectHospitais'
import { useUsuarios } from '../hooks/useUsuarios'
import { useTodosHospitais } from '../hooks/useEquipe'
import { criarUsuario, atualizarUsuario, redefinirSenhaUsuario } from '../services/usuarios.service'
import { invalidarPorEvento } from '../lib/invalidation'
import { ROLE_LABEL, ROLE_DESC, ROLES_ORDEM, temEscopoHospital } from '../lib/usuarioRoles'
import type { UserRole } from '../types/api'

type Passo = 'conta' | 'nivel' | 'escopo'

// Ícones (traço, herdam a cor).
const svg = (d: React.ReactNode, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
)
const IconConta = svg(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>)
const IconNivel = svg(<><path d="M12 3 4 6v6c0 4.6 3.4 8.3 8 9 4.6-.7 8-4.4 8-9V6l-8-3z" /><path d="m9 12 2 2 4-4" /></>)
const IconEscopo = svg(<><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>)
const IconOk = svg(<path d="m5 12 5 5 9-10" />, 14)
const IconSeta = svg(<path d="m6 9 6 6 6-6" />, 16)
const IconEmail = svg(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>, 16)
const IconChave = svg(<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>, 16)
const IconPessoa = svg(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>, 16)

const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

export default function UsuarioForm() {
  const { id } = useParams<{ id: string }>()
  const editando = !!id
  const navigate = useNavigate()
  // Volta para a aba/filtro de onde a pessoa veio (UsuariosAcesso manda em
  // state.voltar); acesso direto pela URL cai na aba de usuários.
  const location = useLocation()
  const voltar = (location.state as { voltar?: string } | null)?.voltar ?? '/equipe?aba=usuarios'
  const qc = useQueryClient()
  const { role: minhaRole } = useAuth()
  // Admin e analista interno gerem contas; o analista não cria nem altera
  // conta de administrador (o backend recusa com 403).
  const gestor = podeGerirOperacoes(minhaRole)
  const rolesOferecidos = ROLES_ORDEM.filter((r) => podeGerirConta(minhaRole, r))

  const { data: usuariosData, isLoading: carregandoUsuarios } = useUsuarios(gestor && editando)
  const { data: hospitais } = useTodosHospitais(gestor)
  const usuario = editando ? usuariosData?.usuarios.find((u) => u.user_id === id) : undefined

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  // Redefinição de senha na edição (admin): vazia = não altera a senha.
  const [novaSenha, setNovaSenha] = useState('')
  const [showNovaSenha, setShowNovaSenha] = useState(false)
  // Na criação o nível começa SEM escolha: marcar um já conclui a etapa. Com um
  // padrão pré-marcado, a etapa nasceria "ok" sem ninguém ter decidido nada.
  const [role, setRole] = useState<UserRole | null>(null)
  const [hospitaisSel, setHospitaisSel] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [aberto, setAberto] = useState<Passo | null>('conta')
  // Etapas pelas quais a pessoa já passou: o ok só aparece depois de sair dela.
  const [visitados, setVisitados] = useState<Set<Passo>>(() => new Set())
  const refConta = useRef<HTMLDivElement>(null)
  // Preenche o form ao carregar o usuário (edição). Guarda o id já aplicado para
  // não sobrescrever edições do usuário em re-renders.
  const [aplicado, setAplicado] = useState<string | null>(null)
  if (editando && usuario && aplicado !== usuario.user_id) {
    setNome(usuario.nome ?? '')
    setRole(usuario.role)
    setHospitaisSel(usuario.hospitais ?? [])
    setVisitados(new Set<Passo>(['conta', 'nivel', 'escopo']))
    setAplicado(usuario.user_id)
  }

  const titulo = editando ? `Editar ${usuario?.email ?? 'usuário'}` : 'Novo usuário de acesso'
  usePageHeader(
    useMemo(() => ({
      title: titulo,
      subtitle: editando ? 'Papel e escopo de dados da conta' : 'Conta de login: e-mail, senha e nível de acesso',
      actions: (
        <button className="btn btn-outline btn-sm" onClick={() => navigate(voltar)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Voltar
        </button>
      ),
    }), [titulo, editando, navigate, voltar]),
  )

  if (!gestor) return <Navigate to={rotaFallback(minhaRole)} replace />
  if (editando && carregandoUsuarios) return <LoadingState label="Carregando usuário…" />
  if (editando && !usuario) return <div className="empty-state">Usuário não encontrado.</div>
  if (editando && usuario && !podeGerirConta(minhaRole, usuario.role)) {
    return <div className="empty-state">Somente um administrador pode alterar esta conta.</div>
  }

  const temEscopo = role !== null && temEscopoHospital(role)
  const passos: Passo[] = temEscopo ? ['conta', 'nivel', 'escopo'] : ['conta', 'nivel']

  // O que conclui cada etapa (o obrigatório dela).
  const contaOk = editando
    ? (!novaSenha || novaSenha.length >= 6)
    : emailValido(email) && password.length >= 6
  const completo: Record<Passo, boolean> = {
    conta: contaOk,
    nivel: role !== null,
    // Escopo é opcional (vazio = vê tudo): conta como concluído ao passar por ela.
    escopo: true,
  }
  const mostraOk = (p: Passo) => completo[p] && visitados.has(p) && aberto !== p
  const podeSalvar = contaOk && role !== null

  /** Fecha a etapa atual marcando-a como vista e abre a seguinte. */
  function avancar(de: Passo) {
    setVisitados((v) => new Set(v).add(de))
    const i = passos.indexOf(de)
    setAberto(passos[i + 1] ?? null)
  }

  function alternar(p: Passo) {
    if (aberto) setVisitados((v) => new Set(v).add(aberto))
    setAberto(aberto === p ? null : p)
  }

  function escolherRole(r: UserRole) {
    setRole(r)
    // Um clique já é a decisão inteira da etapa: avança sozinho. A lista de
    // passos ainda é a do papel anterior, então decide pelo papel escolhido.
    setVisitados((v) => new Set(v).add('nivel'))
    setAberto(temEscopoHospital(r) ? 'escopo' : null)
  }

  // Etapa da conta: avança quando o obrigatório está completo E o foco sai
  // dela (ou Enter). Avançar no 6º caractere da senha fecharia a etapa no meio
  // da digitação de quem usa uma senha mais longa.
  function saiuDaConta(e: React.FocusEvent) {
    const destino = e.relatedTarget as HTMLElement | null
    if (refConta.current?.contains(destino)) return
    // Foi para o título de uma etapa: o clique nele decide o que abre.
    if (destino?.closest('.uf-etapa-topo')) return
    if (contaOk && aberto === 'conta' && !editando) avancar('conta')
  }

  async function salvar() {
    if (!editando) {
      if (!emailValido(email)) { setToast('Informe um e-mail válido'); setAberto('conta'); return }
      if (password.length < 6) { setToast('A senha deve ter ao menos 6 caracteres'); setAberto('conta'); return }
    } else if (novaSenha && novaSenha.length < 6) {
      setToast('A nova senha deve ter ao menos 6 caracteres'); setAberto('conta'); return
    }
    if (!role) { setToast('Escolha o nível de acesso'); setAberto('nivel'); return }
    setSaving(true)
    try {
      // Só os papéis operacionais (administrativo/técnico) têm escopo por hospital;
      // os demais veem tudo (envia vazio para não deixar uma restrição "invisível" gravada).
      const escopo = temEscopoHospital(role) ? hospitaisSel : []
      if (editando) {
        await atualizarUsuario(id!, { role, hospitais: escopo, nome: nome.trim() })
        // Só redefine a senha se o admin preencheu o campo (vazio = mantém a atual).
        if (novaSenha) await redefinirSenhaUsuario(id!, novaSenha)
      } else {
        await criarUsuario(email, password, role, escopo, nome)
      }
      // Evento de domínio (não a key crua): criar/editar usuário também muda a
      // trilha de auditoria, e o evento já invalida `auditoria`+`auditoriaResumo`.
      invalidarPorEvento(qc, 'usuariosAlterados')
      navigate(voltar)  // volta à aba de onde veio, com a lista atualizada
    } catch (err) {
      setToast(`Erro: ${(err as Error).message}`)
      setSaving(false)
    }
  }

  // Resumo que aparece no título da etapa fechada.
  const resumo: Record<Passo, string> = {
    conta: editando ? (nome.trim() || usuario?.email || '') : (email.trim() || 'E-mail e senha'),
    nivel: role ? ROLE_LABEL[role] : 'Escolha um nível',
    escopo: hospitaisSel.length ? `${new Set(hospitaisSel).size} vínculo(s) de hospital` : 'Todos os hospitais',
  }
  const cabecalho: Record<Passo, { titulo: string; icone: React.ReactNode }> = {
    conta: { titulo: editando ? 'Dados da conta' : 'Dados de acesso', icone: IconConta },
    nivel: { titulo: 'Nível de acesso', icone: IconNivel },
    escopo: { titulo: 'Cidades e hospitais', icone: IconEscopo },
  }

  function Etapa({ p, children }: { p: Passo; children: React.ReactNode }) {
    const n = passos.indexOf(p) + 1
    const aberta = aberto === p
    const ok = mostraOk(p)
    return (
      <section className={`uf-etapa${aberta ? ' aberta' : ''}${ok ? ' ok' : ''}`}>
        <button type="button" className="uf-etapa-topo" aria-expanded={aberta} onClick={() => alternar(p)}>
          <span className="uf-etapa-num" aria-hidden="true">{ok ? IconOk : n}</span>
          <span className="uf-etapa-icone">{cabecalho[p].icone}</span>
          <span className="uf-etapa-textos">
            <span className="uf-etapa-titulo">{cabecalho[p].titulo}</span>
            {!aberta && <span className="uf-etapa-resumo">{resumo[p]}</span>}
          </span>
          {ok && <span className="uf-etapa-selo">{IconOk}Concluído</span>}
          <span className="uf-etapa-seta">{IconSeta}</span>
        </button>
        {aberta && <div className="uf-etapa-corpo">{children}</div>}
      </section>
    )
  }

  const botaoOlho = (mostrar: boolean, alternarOlho: () => void) => (
    <button type="button" className="uf-olho" onClick={alternarOlho}>{mostrar ? 'ocultar' : 'mostrar'}</button>
  )

  return (
    <>
      <div className="uf">
        {/* Etapa é chamada como função (não <Etapa/>): declarada no corpo do
            componente, como elemento ela seria um TIPO novo a cada render e o
            React remontaria os campos, perdendo o foco a cada tecla. */}
        {Etapa({
          p: 'conta',
          children: (
            <div className="uf-grade" ref={refConta} onBlur={saiuDaConta}
              onKeyDown={(e) => { if (e.key === 'Enter' && contaOk && !editando) { e.preventDefault(); avancar('conta') } }}>
              <div className="nh-campo">
                <label htmlFor="uf-nome">Nome</label>
                <div className="nh-input">
                  {IconPessoa}
                  <input id="uf-nome" type="text" className="bm-input" placeholder="Nome do usuário"
                    value={nome} onChange={(e) => setNome(e.target.value)}
                    autoFocus={!editando} autoComplete="off" />
                </div>
              </div>

              {!editando && (
                <>
                  <div className={`nh-campo${email && !emailValido(email) ? ' com-erro' : ''}`}>
                    <label htmlFor="uf-email">E-mail *</label>
                    <div className="nh-input">
                      {IconEmail}
                      <input id="uf-email" type="email" className="bm-input" placeholder="usuario@empresa.com"
                        value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
                    </div>
                  </div>
                  <div className={`nh-campo${password && password.length < 6 ? ' com-erro' : ''}`}>
                    <label htmlFor="uf-senha">Senha *</label>
                    <div className="nh-input uf-com-olho">
                      {IconChave}
                      <input id="uf-senha" type={showPw ? 'text' : 'password'} className="bm-input" placeholder="Mínimo de 6 caracteres"
                        value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                      {botaoOlho(showPw, () => setShowPw((v) => !v))}
                    </div>
                  </div>
                </>
              )}

              {/* Redefinir senha — só na edição (admin define a nova senha da conta). */}
              {editando && (
                <div className={`nh-campo${novaSenha && novaSenha.length < 6 ? ' com-erro' : ''}`}>
                  <label htmlFor="uf-nova-senha">Redefinir senha</label>
                  <div className="nh-input uf-com-olho">
                    {IconChave}
                    <input id="uf-nova-senha" type={showNovaSenha ? 'text' : 'password'} className="bm-input"
                      placeholder="Em branco mantém a senha atual"
                      value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} autoComplete="new-password" />
                    {botaoOlho(showNovaSenha, () => setShowNovaSenha((v) => !v))}
                  </div>
                </div>
              )}

              <div className="uf-etapa-acoes">
                <button type="button" className="btn btn-primary btn-sm" disabled={!contaOk} onClick={() => avancar('conta')}>
                  Continuar
                </button>
              </div>
            </div>
          ),
        })}

        {Etapa({
          p: 'nivel',
          children: (
            <div className="uf-niveis" role="radiogroup" aria-label="Nível de acesso">
              {rolesOferecidos.map((r) => (
                <label key={r} className={`uf-nivel${role === r ? ' marcado' : ''}`}>
                  <input type="radio" name="user-role" value={r} checked={role === r}
                    onChange={() => escolherRole(r)} />
                  <span className="uf-nivel-textos">
                    <span className="uf-nivel-nome">{ROLE_LABEL[r]}</span>
                    <span className="uf-nivel-desc">{ROLE_DESC[r]}</span>
                  </span>
                  <span className="uf-nivel-marca" aria-hidden="true">{role === r && IconOk}</span>
                </label>
              ))}
            </div>
          ),
        })}

        {/* Escopo de dados — só para papéis operacionais (gestor/diretor/admin veem tudo). */}
        {temEscopo && Etapa({
          p: 'escopo',
          children: (
            <MultiSelectHospitais hospitais={hospitais ?? []} selecionados={hospitaisSel} onChange={setHospitaisSel} />
          ),
        })}

        <div className="uf-rodape">
          <button className="btn btn-outline" onClick={() => navigate(voltar)}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={saving || !podeSalvar}>
            {saving ? (editando ? 'Salvando…' : 'Criando…') : (editando ? 'Salvar' : 'Criar usuário')}
          </button>
        </div>
      </div>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  )
}
