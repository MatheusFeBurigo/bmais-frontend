// Réplicas da tela Operações (ex-Equipe), usadas nos "como fazer" de cadastro
// de pessoas: profissionais (médicos e enfermeiros) e contas de acesso da
// equipe interna.
//
// Reusam o que é puro na tela real: ProfTabela, SeletorEscala e
// MultiSelectHospitais, além dos rótulos e descrições dos papéis
// (lib/usuarioRoles) e da regra de quem tem escopo por hospital. Assim a réplica
// do formulário muda sozinha quando um papel novo entra ou muda de descrição.
// A lista de usuários e o formulário em si são páginas com busca de dados
// embutida, e por isso redesenhados aqui com as mesmas classes.
//
// Nada do perfil administrador aparece aqui: a Ajuda não descreve esse perfil
// (decisão do usuário, 25/09/2026), e a réplica mostra o que o analista vê.
import type { Hospital, Profissional, UserRole } from '../../types/api'
import { Badge } from '../ui'
import ProfTabela from '../equipe/ProfTabela'
import SeletorEscala from '../equipe/SeletorEscala'
import { SERVICOS } from '../equipe/equipe.styles'
import MultiSelectHospitais from '../MultiSelectHospitais'
import { ROLE_DESC, ROLE_LABEL, ROLE_VARIANT, temEscopoHospital } from '../../lib/usuarioRoles'
import { PAPEIS_CADASTRO } from './acessoAjuda'
import { Marcado, ModalReplica } from './replica'
import { Topo } from './exemplosOperacao'

const nada = () => {}
const rotulo = { display: 'block', marginBottom: 5, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 } as const

const IconSearch = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
)
const IconPlus = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
)
const IconKey = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.5 12.5 8.5-8.5" /><path d="m16 5 3 3" /><path d="m14 7 3 3" /></svg>
)

const HOSPITAIS: Hospital[] = [
  { key: 'santa_clara', nome: 'Hospital Santa Clara', regiao: 'Campinas', internados: 42, urgente: 3, altas: 5, operadora_key: 'careplus', operadoras: ['careplus'] },
  { key: 'sao_lucas', nome: 'Hospital São Lucas', regiao: 'Campinas', internados: 18, urgente: 1, altas: 2, operadora_key: 'porto', operadoras: ['porto'] },
  { key: 'vila_nova', nome: 'Hospital Vila Nova', regiao: 'SP - Zona Sul', internados: 27, urgente: 0, altas: 4, operadora_key: 'sulamerica', operadoras: ['sulamerica'] },
  { key: 'bela_vista', nome: 'Hospital Bela Vista', regiao: 'SP - Zona Oeste', internados: 11, urgente: 0, altas: 1, operadora_key: 'careplus', operadoras: ['careplus'] },
]
const OPERADORAS = [
  { key: 'careplus', nome: 'CarePlus' },
  { key: 'porto', nome: 'Porto Seguro' },
  { key: 'sulamerica', nome: 'SulAmérica' },
]

function Abas({ ativa }: { ativa: 'profissionais' | 'usuarios' }) {
  const abas = [
    ['profissionais', 'Profissionais', 4],
    ['usuarios', 'Usuários de acesso', null],
    ['malha', 'Hospitais e operadoras', null],
  ] as const
  return (
    <nav className="ops-nav">
      {abas.map(([a, lbl, n]) => (
        <span key={a} className={`ops-nav-btn${ativa === a ? ' active' : ''}`}>
          {lbl}
          {n != null && <span className="ops-nav-count">{n}</span>}
        </span>
      ))}
    </nav>
  )
}

// ── Aba Profissionais ─────────────────────────────────────────────────────────

const PROFISSIONAIS: Profissional[] = [
  { id: 1, nome: 'Ana Clara Souza', tipo: 'E', ativo: true, tem_acesso: true, acesso_email: 'ana.souza@exemplo.com', n_hospitais: 3 },
  { id: 2, nome: 'Paulo Mendes', tipo: 'M', ativo: true, tem_acesso: false, n_hospitais: 2 },
  { id: 3, nome: 'Renata Alves', tipo: 'M', ativo: true, tem_acesso: true, acesso_email: 'renata.alves@exemplo.com', n_hospitais: 4 },
  { id: 4, nome: 'Marcos Tavares', tipo: 'E', ativo: true, tem_acesso: true, acesso_email: 'marcos.tavares@exemplo.com', n_hospitais: 1 },
]

/** A aba Profissionais: busca, filtro por tipo, "Adicionar" e a lista. Na lista,
 *  Paulo Mendes (2ª linha) ainda não tem acesso: é o exemplo do "Senha". */
export function ReplicaProfissionais({ marcas = {} }: {
  marcas?: Partial<Record<'adicionar' | 'lista', number>>
}) {
  return (
    <>
      <Topo titulo="Operações" sub="Enfermeiros e médicos auditores da operação" />
      <Abas ativa="profissionais" />
      <div className="ops-toolbar">
        <div className="ops-search">
          {IconSearch}
          <input className="bm-input" placeholder="Buscar profissional…" readOnly />
        </div>
        <div className="ops-seg">
          <span className="ops-seg-btn active">Todos <span style={{ opacity: 0.65 }}>4</span></span>
          <span className="ops-seg-btn">Enfermeiros <span style={{ opacity: 0.65 }}>2</span></span>
          <span className="ops-seg-btn">Médicos <span style={{ opacity: 0.65 }}>2</span></span>
        </div>
        <Marcado n={marcas.adicionar}>
          <span className="btn btn-primary btn-sm">{IconPlus}Adicionar</span>
        </Marcado>
      </div>
      <div className="ops-resumo" style={{ padding: '0 2px 10px' }}><b>4</b> ativos</div>
      <Marcado n={marcas.lista} bloco>
        <ProfTabela
          lista={PROFISSIONAIS}
          vazio="Nenhum profissional."
          onAbrir={nada}
          acoes={{ onEditar: nada, onSenha: nada, onAtivo: nada }}
        />
      </Marcado>
    </>
  )
}

/** O modal "Adicionar Profissional", preenchido com um médico e dois hospitais. */
export function ReplicaAdicionarProfissional({ marcas = {} }: {
  marcas?: Partial<Record<'tipo' | 'acesso' | 'hospitais' | 'servico' | 'adicionar', number>>
}) {
  const marcados = new Set(['santa_clara', 'sao_lucas'])
  return (
    <ModalReplica
      titulo="Adicionar Profissional"
      largura={480}
      rodape={
        <>
          <span className="btn btn-outline">Cancelar</span>
          <Marcado n={marcas.adicionar}><span className="btn btn-primary">Adicionar</span></Marcado>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <Marcado n={marcas.tipo} bloco>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label className="uppercase t-muted" style={rotulo}>Tipo *</label>
              <select className="bm-input bm-select" value="M" onChange={nada}>
                <option value="M">Médico(a) Auditor(a)</option>
              </select>
            </div>
            <div>
              <label className="uppercase t-muted" style={rotulo}>Nome completo *</label>
              <input className="bm-input" readOnly value="Paulo Mendes" />
            </div>
          </div>
        </Marcado>
        <Marcado n={marcas.acesso} bloco>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label className="uppercase t-muted" style={rotulo}>E-mail de acesso *</label>
              <input className="bm-input" readOnly value="paulo.mendes@exemplo.com" />
            </div>
            <div>
              <label className="uppercase t-muted" style={rotulo}>Senha inicial *</label>
              <input className="bm-input" type="password" readOnly value="senha123" />
            </div>
          </div>
        </Marcado>
        <Marcado n={marcas.hospitais} bloco>
          <div>
            <label className="uppercase t-muted" style={rotulo}>
              Hospitais <span style={{ marginLeft: 6, color: 'var(--primary-3)' }}>2</span>
            </label>
            <SeletorEscala hospitais={HOSPITAIS} opsLista={OPERADORAS} marcados={marcados}
              onMarcar={nada} onAdicionar={nada} />
          </div>
        </Marcado>
        <Marcado n={marcas.servico} bloco>
          <div>
            <label className="uppercase t-muted" style={rotulo}>Serviço</label>
            <select className="bm-input bm-select" value="P" onChange={nada}>
              {SERVICOS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </Marcado>
      </div>
    </ModalReplica>
  )
}

/** A ficha (Editar) de quem ainda não tem conta: o e-mail de acesso se
 *  informa ali, e a senha inicial aparece junto. */
export function ReplicaCriarAcesso({ marcas = {} }: {
  marcas?: Partial<Record<'dados' | 'salvar', number>>
}) {
  return (
    <ModalReplica
      titulo="Detalhes do profissional"
      rodape={
        <>
          <span className="btn btn-outline">Cancelar</span>
          <Marcado n={marcas.salvar}><span className="btn btn-primary">Salvar</span></Marcado>
        </>
      }
    >
      <Marcado n={marcas.dados} bloco>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label className="uppercase t-muted" style={rotulo}>Nome completo</label>
            <input className="bm-input" readOnly value="Paulo Mendes" />
          </div>
          <div>
            <label className="uppercase t-muted" style={rotulo}>E-mail de acesso</label>
            <input className="bm-input" readOnly value="paulo.mendes@exemplo.com" />
          </div>
          <div>
            <label className="uppercase t-muted" style={rotulo}>Senha inicial</label>
            <input className="bm-input" type="password" readOnly value="senha123" />
          </div>
        </div>
      </Marcado>
    </ModalReplica>
  )
}

// ── Aba Usuários de acesso ────────────────────────────────────────────────────

const USUARIOS: { nome: string; email: string; role: UserRole; hospitais: string }[] = [
  { nome: 'Juliana Prado', email: 'juliana.prado@exemplo.com', role: 'tecnico', hospitais: '3 hospitais' },
  { nome: 'Rafael Nogueira', email: 'rafael.nogueira@exemplo.com', role: 'administrativo', hospitais: 'Hospital Santa Clara' },
  { nome: 'Camila Freitas', email: 'camila.freitas@exemplo.com', role: 'coordenador_tecnico', hospitais: 'Todos' },
  { nome: 'Eduardo Lins', email: 'eduardo.lins@exemplo.com', role: 'analista', hospitais: 'Todos' },
]

/** A aba Usuários de acesso: busca, filtro por papel, "Novo usuário" e a lista. */
export function ReplicaUsuarios({ marcas = {} }: {
  marcas?: Partial<Record<'novo' | 'lista', number>>
}) {
  const papeis = [...new Set(USUARIOS.map((u) => u.role))]
  return (
    <>
      <Topo titulo="Operações" sub="Contas de login e nível de acesso" />
      <Abas ativa="usuarios" />
      <div className="ops-toolbar">
        <div className="ops-search">
          {IconSearch}
          <input className="bm-input" placeholder="Buscar" readOnly />
        </div>
        <div className="ops-seg">
          <span className="ops-seg-btn active">Todos <span style={{ opacity: 0.65 }}>{USUARIOS.length}</span></span>
          {papeis.map((r) => (
            <span key={r} className="ops-seg-btn">{ROLE_LABEL[r]} <span style={{ opacity: 0.65 }}>1</span></span>
          ))}
        </div>
        <Marcado n={marcas.novo}>
          <span className="btn btn-primary btn-sm">{IconPlus}Novo usuário</span>
        </Marcado>
      </div>
      <Marcado n={marcas.lista} bloco>
        <div className="card" style={{ padding: 0 }}>
          <table className="bmais-table">
            <thead>
              <tr><th>Nome</th><th>E-mail</th><th>Nível de acesso</th><th>Hospitais</th><th style={{ width: 1 }} /></tr>
            </thead>
            <tbody>
              {USUARIOS.map((u) => (
                <tr key={u.email}>
                  <td style={{ fontWeight: 500 }}>{u.nome}</td>
                  <td>{u.email}</td>
                  <td><Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role]}</Badge></td>
                  <td>
                    <span style={u.hospitais === 'Todos'
                      ? { fontSize: 'var(--t-xs)', color: 'var(--muted-2)' }
                      : { fontSize: 'var(--t-sm)' }}>{u.hospitais}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <span className="btn btn-outline btn-sm" style={{ gap: 6 }}>{IconKey}Senha</span>
                      <span className="btn btn-outline btn-sm">Editar</span>
                      <span className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>Apagar</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Marcado>
    </>
  )
}

/** A página "Novo usuário de acesso", preenchida para o papel escolhido. O
 *  escopo de hospitais só aparece para os papéis que o têm, como na tela. */
export function ReplicaNovoUsuario({ papel, marcas = {} }: {
  papel: UserRole
  marcas?: Partial<Record<'credenciais' | 'papel' | 'escopo' | 'criar', number>>
}) {
  const comEscopo = temEscopoHospital(papel)
  return (
    <>
      <Topo titulo="Novo usuário de acesso" sub="Conta de login: e-mail, senha e nível de acesso"
        acoes={<span className="btn btn-outline btn-sm">Voltar</span>} />
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="card" style={{ padding: 20, overflow: 'visible' }}>
          <div style={{ display: 'grid', gap: 16 }}>
            <Marcado n={marcas.credenciais} bloco>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label className="uppercase t-muted" style={rotulo}>Nome</label>
                  <input className="bm-input" readOnly value="Juliana Prado" />
                </div>
                <div>
                  <label className="uppercase t-muted" style={rotulo}>E-mail *</label>
                  <input className="bm-input" readOnly value="juliana.prado@exemplo.com" />
                </div>
                <div>
                  <label className="uppercase t-muted" style={rotulo}>Senha *</label>
                  <input className="bm-input" type="password" readOnly value="senha123" />
                </div>
              </div>
            </Marcado>

            <Marcado n={marcas.papel} bloco>
              <div>
                <label className="uppercase t-muted" style={rotulo}>Nível de acesso *</label>
                <div style={{ display: 'grid', gap: 8 }}>
                  {PAPEIS_CADASTRO.map((r) => (
                    <div key={r} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 13px',
                      border: `1px solid ${papel === r ? 'var(--primary)' : 'var(--border-strong)'}`,
                      background: papel === r ? 'var(--accent-soft)' : 'var(--surface)', borderRadius: 10,
                    }}>
                      <input type="radio" readOnly checked={papel === r} style={{ marginTop: 3, accentColor: 'var(--primary)' }} />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 600, fontSize: 'var(--t-md)' }}>{ROLE_LABEL[r]}</span>
                        <span style={{ display: 'block', fontSize: 'var(--t-sm)', color: 'var(--muted)', lineHeight: 1.4 }}>{ROLE_DESC[r]}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Marcado>

            {comEscopo && (
              <Marcado n={marcas.escopo} bloco>
                <div>
                  <label className="uppercase t-muted" style={rotulo}>Cidades e hospitais (escopo de dados)</label>
                  <MultiSelectHospitais hospitais={HOSPITAIS} selecionados={['santa_clara', 'sao_lucas']} onChange={nada} />
                </div>
              </Marcado>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <span className="btn btn-outline">Cancelar</span>
            <Marcado n={marcas.criar}><span className="btn btn-primary">Criar usuário</span></Marcado>
          </div>
        </div>
      </div>
    </>
  )
}
