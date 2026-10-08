// Réplicas da tela Operações (ex-Equipe), usadas nos "como fazer" de cadastro:
// auditores (médicos e enfermeiros), contas de acesso da equipe interna e a
// malha de hospitais e operadoras.
//
// Reusam o que é puro na tela real: ProfTabela, MenuAcoes, SeletorEscala,
// MultiSelectHospitais e SeletorOperadoras, além dos rótulos e descrições dos
// papéis (lib/usuarioRoles) e da regra de quem tem escopo por hospital ou por
// operadora. Assim a réplica
// do formulário muda sozinha quando um papel novo entra ou muda de descrição.
// A lista de usuários, o formulário em etapas, a lista da malha e o cadastro de
// hospital são páginas/modais com busca de dados embutida, e por isso
// redesenhados aqui com as mesmas classes (uac-*, uf-*, malha-*, nh-*).
//
// Nada do perfil administrador aparece aqui: a Ajuda não descreve esse perfil
// (decisão do usuário, 25/09/2026), e a réplica mostra o que o analista vê.
import type { ReactNode } from 'react'
import type { Hospital, Profissional, UserRole } from '../../types/api'
import { Badge, OpAvatar } from '../ui'
import ProfTabela from '../equipe/ProfTabela'
import SeletorEscala from '../equipe/SeletorEscala'
import { SERVICOS } from '../equipe/equipe.styles'
import MenuAcoes, { IconesAcao } from '../MenuAcoes'
import MultiSelectHospitais from '../MultiSelectHospitais'
import SeletorOperadoras from '../SeletorOperadoras'
import { ROLE_DESC, ROLE_LABEL, ROLE_VARIANT, temEscopoHospital, temEscopoOperadora } from '../../lib/usuarioRoles'
import { PAPEIS_CADASTRO } from './acessoAjuda'
import { Marcado, ModalReplica } from './replica'
import { Topo } from './exemplosOperacao'

const nada = () => {}
const rotulo = { display: 'block', marginBottom: 5, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 } as const

const svg = (d: ReactNode, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
)
const IconSearch = svg(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>, 13)
const IconPlus = svg(<path d="M12 5v14M5 12h14" />, 14)
const IconKey = svg(<><circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.5 12.5 8.5-8.5" /><path d="m16 5 3 3" /><path d="m14 7 3 3" /></>, 14)
const IconOk = svg(<path d="m5 12 5 5 9-10" />, 14)
const IconSeta = svg(<path d="m6 9 6 6 6-6" />)
const IconConta = svg(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>, 18)
const IconNivel = svg(<><path d="M12 3 4 6v6c0 4.6 3.4 8.3 8 9 4.6-.7 8-4.4 8-9V6l-8-3z" /><path d="m9 12 2 2 4-4" /></>, 18)
const IconPino = (s = 13) => svg(<><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>, s)
const IconMaleta = svg(<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 13h18" /></>, 18)
const IconPredio = (s = 13) => svg(<><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M16 9h2a2 2 0 0 1 2 2v10" /><path d="M3 21h18" /><path d="M9 7h2M9 11h2M9 15h2" /></>, s)
const IconEscudo = (s = 16) => svg(<><path d="M12 3 4 6v6c0 4.6 3.4 8.3 8 9 4.6-.7 8-4.4 8-9V6l-8-3z" /><path d="m9 12 2 2 4-4" /></>, s)
const IconContato = svg(<><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M6 16c.6-1.4 1.7-2 3-2s2.4.6 3 2M15 10h3M15 13h3" /></>, 18)
const IconFone = svg(<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />)
const IconEmail = svg(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>)
const IconCog = svg(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>, 14)
const IconLixeira = svg(<><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></>, 13)

const HOSPITAIS: Hospital[] = [
  { key: 'santa_clara', nome: 'Hospital Santa Clara', regiao: 'Campinas', cidade: 'Campinas', internados: 42, urgente: 3, altas: 5, operadora_key: 'careplus', operadoras: ['careplus'] },
  { key: 'sao_lucas', nome: 'Hospital São Lucas', regiao: 'Campinas', cidade: 'Campinas', internados: 18, urgente: 1, altas: 2, operadora_key: 'porto', operadoras: ['porto'] },
  { key: 'vila_nova', nome: 'Hospital Vila Nova', regiao: 'SP - Zona Sul', internados: 27, urgente: 0, altas: 4, operadora_key: 'sulamerica', operadoras: ['sulamerica'] },
  { key: 'bela_vista', nome: 'Hospital Bela Vista', regiao: 'SP - Zona Oeste', internados: 11, urgente: 0, altas: 1, operadora_key: 'careplus', operadoras: ['careplus'] },
]
const OPERADORAS = [
  { key: 'careplus', nome: 'CarePlus' },
  { key: 'porto', nome: 'Porto Seguro' },
  { key: 'sulamerica', nome: 'SulAmérica' },
]
// Os mesmos hospitais com o nome das operadoras, como a API manda: é dele que
// o seletor de operadoras tira o nome e a contagem de cada uma.
const HOSPITAIS_COM_OPS: Hospital[] = HOSPITAIS.map((h) => ({
  ...h,
  operadoras_nomes: (h.operadoras ?? []).map((k) => OPERADORAS.find((o) => o.key === k) ?? { key: k, nome: k }),
}))

type AbaOps = 'profissionais' | 'usuarios' | 'malha'

function Abas({ ativa }: { ativa: AbaOps }) {
  const abas = [
    ['profissionais', 'Auditores', 4],
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

/** A lista do menu ⋮ já aberta. Na tela ela é `position: fixed` e calculada a
 *  partir do botão; aqui fica ancorada no canto da linha. */
function MenuAberto({ itens, marcas = [] }: {
  itens: { rotulo: string; icone: ReactNode; perigo?: boolean }[]
  marcas?: (number | undefined)[]
}) {
  return (
    <div className="menu-acoes-lista" style={{ position: 'absolute', right: 12, top: 76 }}>
      {itens.map((it, i) => (
        <Marcado key={it.rotulo} n={marcas[i]} bloco>
          <button type="button" className={it.perigo ? 'perigo' : undefined}>{it.icone}{it.rotulo}</button>
        </Marcado>
      ))}
    </div>
  )
}

// ── Aba Auditores ─────────────────────────────────────────────────────────────

const PROFISSIONAIS: Profissional[] = [
  { id: 1, nome: 'Ana Clara Souza', tipo: 'E', ativo: true, tem_acesso: true, acesso_email: 'ana.souza@exemplo.com', n_hospitais: 3 },
  { id: 2, nome: 'Paulo Mendes', tipo: 'M', ativo: true, tem_acesso: false, n_hospitais: 2 },
  { id: 3, nome: 'Renata Alves', tipo: 'M', ativo: true, tem_acesso: true, acesso_email: 'renata.alves@exemplo.com', n_hospitais: 4 },
  { id: 4, nome: 'Marcos Tavares', tipo: 'E', ativo: true, tem_acesso: true, acesso_email: 'marcos.tavares@exemplo.com', n_hospitais: 1 },
]

/** A aba Auditores: busca, filtro por tipo, "Adicionar" e a lista. Na lista,
 *  Paulo Mendes (2ª linha) ainda não tem acesso: é o exemplo do "Editar".
 *  `menuAberto` mostra o ⋮ da 1ª linha aberto, com as marcas pedidas. */
export function ReplicaProfissionais({ marcas = {}, menuAberto }: {
  marcas?: Partial<Record<'adicionar' | 'lista', number>>
  menuAberto?: { desativar?: number; excluir?: number }
}) {
  return (
    <>
      <Topo titulo="Operações" sub="Enfermeiros e médicos auditores da operação" />
      <Abas ativa="profissionais" />
      <div className="ops-toolbar">
        <div className="ops-search">
          {IconSearch}
          <input className="bm-input" placeholder="Buscar auditor…" readOnly />
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
        <div style={{ position: 'relative' }}>
          <ProfTabela
            lista={PROFISSIONAIS}
            vazio="Nenhum auditor cadastrado."
            onAbrir={nada}
            acoes={{ onEditar: nada, onSenha: nada, onAtivo: nada, onExcluir: nada }}
          />
          {menuAberto && (
            <MenuAberto
              itens={[
                { rotulo: 'Desativar acesso', icone: IconesAcao.desativar },
                { rotulo: 'Excluir auditor', icone: IconesAcao.excluir, perigo: true },
              ]}
              marcas={[menuAberto.desativar, menuAberto.excluir]}
            />
          )}
        </div>
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
      titulo="Detalhes do auditor"
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

/** A confirmação que o menu ⋮ abre antes de excluir um auditor. */
export function ReplicaConfirmarExclusao({ marcas = {} }: {
  marcas?: Partial<Record<'confirmar', number>>
}) {
  return (
    <ModalReplica
      titulo="Excluir auditor"
      largura={460}
      rodape={
        <>
          <span className="btn btn-outline btn-sm">Cancelar</span>
          <Marcado n={marcas.confirmar}>
            <span className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff', borderColor: 'var(--danger)' }}>
              Excluir definitivamente
            </span>
          </Marcado>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 10, fontSize: 'var(--t-base)', color: 'var(--ink-2)', lineHeight: 1.55 }}>
        <p style={{ margin: 0 }}>Excluir <strong>Ana Clara Souza</strong>? Esta ação é <strong>irreversível</strong>.</p>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 'var(--t-sm)' }}>
          Sai o cadastro, a escala de hospitais e a conta de login. Relatórios e visitas já
          registrados com o nome dela continuam no histórico. Para só tirar o acesso, use
          Desativar acesso.
        </p>
      </div>
    </ModalReplica>
  )
}

// ── Aba Usuários de acesso ────────────────────────────────────────────────────

const USUARIOS: { nome: string; email: string; role: UserRole; hospitais: string }[] = [
  { nome: 'Camila Freitas', email: 'camila.freitas@exemplo.com', role: 'coordenador_tecnico', hospitais: 'Todos' },
  { nome: 'Eduardo Lins', email: 'eduardo.lins@exemplo.com', role: 'analista', hospitais: 'Todos' },
  { nome: 'Juliana Prado', email: 'juliana.prado@exemplo.com', role: 'tecnico', hospitais: '3 hospitais' },
  { nome: 'Rafael Nogueira', email: 'rafael.nogueira@exemplo.com', role: 'administrativo', hospitais: 'CarePlus' },
]

/** A aba Usuários de acesso: busca, "Novo usuário", a linha de filtros e a lista. */
export function ReplicaUsuarios({ marcas = {} }: {
  marcas?: Partial<Record<'novo' | 'filtros' | 'lista', number>>
}) {
  const papeis = [...new Set(USUARIOS.map((u) => u.role))]
  return (
    <>
      <Topo titulo="Operações" sub="Contas de login e nível de acesso" />
      <Abas ativa="usuarios" />
      <div className="ops-toolbar">
        <div className="ops-search">
          {IconSearch}
          <input className="bm-input" placeholder="Buscar por nome, e-mail ou nível" readOnly />
        </div>
        <Marcado n={marcas.novo}>
          <span className="btn btn-primary btn-sm">{IconPlus}Novo usuário</span>
        </Marcado>
      </div>
      <Marcado n={marcas.filtros} bloco>
        <div className="uac-filtros">
          <div className="uac-filtro">
            <span className="uac-filtro-rotulo">Nível</span>
            <div className="ops-seg">
              <span className="ops-seg-btn active">Todos <span style={{ opacity: 0.65 }}>{USUARIOS.length}</span></span>
              {papeis.map((r) => (
                <span key={r} className="ops-seg-btn">{ROLE_LABEL[r]} <span style={{ opacity: 0.65 }}>1</span></span>
              ))}
            </div>
          </div>
        </div>
      </Marcado>
      <div className="ops-resumo uac-resumo"><b>{USUARIOS.length}</b> usuários</div>
      <Marcado n={marcas.lista} bloco>
        <div className="card" style={{ padding: 0 }}>
          <table className="bmais-table">
            <thead>
              <tr><th>Nome</th><th>E-mail</th><th>Nível de acesso</th><th>Área</th><th style={{ width: 1 }} /></tr>
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
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <span className="btn btn-outline btn-sm" style={{ gap: 6 }}>{IconKey}Senha</span>
                      <span className="btn btn-outline btn-sm">Editar</span>
                      <MenuAcoes rotulo={`Mais ações para ${u.nome}`} itens={[]} />
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

type EtapaUsuario = 'conta' | 'nivel' | 'escopo'

/** A página "Novo usuário de acesso", em etapas, para o papel escolhido. Só a
 *  etapa `aberta` mostra os campos; as anteriores aparecem fechadas com o ok,
 *  como ficam na tela depois de concluídas. O escopo só existe para os papéis
 *  que o têm: cidades e hospitais para o técnico, operadoras para o operacional. */
export function ReplicaNovoUsuario({ papel, aberta, marcas = {} }: {
  papel: UserRole
  aberta: EtapaUsuario
  marcas?: Partial<Record<'credenciais' | 'papel' | 'escopo' | 'criar', number>>
}) {
  const porOperadora = temEscopoOperadora(papel)
  const comEscopo = temEscopoHospital(papel) || porOperadora
  const etapas: EtapaUsuario[] = comEscopo ? ['conta', 'nivel', 'escopo'] : ['conta', 'nivel']
  const iAberta = etapas.indexOf(aberta)
  const cab: Record<EtapaUsuario, { titulo: string; icone: ReactNode; resumo: string }> = {
    conta: { titulo: 'Dados de acesso', icone: IconConta, resumo: 'juliana.prado@exemplo.com' },
    nivel: { titulo: 'Nível de acesso', icone: IconNivel, resumo: iAberta > 1 ? ROLE_LABEL[papel] : 'Escolha um nível' },
    escopo: porOperadora
      ? { titulo: 'Operadoras', icone: IconMaleta, resumo: 'CarePlus' }
      : { titulo: 'Cidades e hospitais', icone: IconPino(18), resumo: '2 vínculo(s) de hospital' },
  }

  const corpo: Record<EtapaUsuario, ReactNode> = {
    conta: (
      <Marcado n={marcas.credenciais} bloco>
        <div className="uf-grade">
          <div className="nh-campo">
            <label>Nome</label>
            <div className="nh-input">{IconConta}<input className="bm-input" readOnly value="Juliana Prado" /></div>
          </div>
          <div className="nh-campo">
            <label>E-mail *</label>
            <div className="nh-input">{IconEmail}<input className="bm-input" readOnly value="juliana.prado@exemplo.com" /></div>
          </div>
          <div className="nh-campo">
            <label>Senha *</label>
            <div className="nh-input">{IconKey}<input className="bm-input" type="password" readOnly value="senha123" /></div>
          </div>
          <div className="uf-etapa-acoes"><span className="btn btn-primary btn-sm">Continuar</span></div>
        </div>
      </Marcado>
    ),
    nivel: (
      <Marcado n={marcas.papel} bloco>
        <div className="uf-niveis">
          {PAPEIS_CADASTRO.map((r) => (
            <label key={r} className={`uf-nivel${papel === r ? ' marcado' : ''}`}>
              <input type="radio" readOnly checked={papel === r} />
              <span className="uf-nivel-textos">
                <span className="uf-nivel-nome">{ROLE_LABEL[r]}</span>
                <span className="uf-nivel-desc">{ROLE_DESC[r]}</span>
              </span>
              <span className="uf-nivel-marca" aria-hidden="true">{papel === r && IconOk}</span>
            </label>
          ))}
        </div>
      </Marcado>
    ),
    escopo: (
      <Marcado n={marcas.escopo} bloco>
        {porOperadora
          ? <SeletorOperadoras hospitais={HOSPITAIS_COM_OPS} selecionados={['careplus']} onChange={nada} />
          : <MultiSelectHospitais hospitais={HOSPITAIS} selecionados={['santa_clara', 'sao_lucas']} onChange={nada} />}
      </Marcado>
    ),
  }

  return (
    <>
      <Topo titulo="Novo usuário de acesso" sub="Conta de login: e-mail, senha e nível de acesso"
        acoes={<span className="btn btn-outline btn-sm">Voltar</span>} />
      <div className="uf">
        {etapas.map((p, i) => {
          const ok = i < iAberta
          const estaAberta = p === aberta
          return (
            <section key={p} className={`uf-etapa${estaAberta ? ' aberta' : ''}${ok ? ' ok' : ''}`}>
              <div className="uf-etapa-topo">
                <span className="uf-etapa-num" aria-hidden="true">{ok ? IconOk : i + 1}</span>
                <span className="uf-etapa-icone">{cab[p].icone}</span>
                <span className="uf-etapa-textos">
                  <span className="uf-etapa-titulo">{cab[p].titulo}</span>
                  {!estaAberta && <span className="uf-etapa-resumo">{cab[p].resumo}</span>}
                </span>
                {ok && <span className="uf-etapa-selo">{IconOk}Concluído</span>}
                <span className="uf-etapa-seta">{IconSeta}</span>
              </div>
              {estaAberta && <div className="uf-etapa-corpo">{corpo[p]}</div>}
            </section>
          )
        })}
        <div className="uf-rodape">
          <span className="btn btn-outline">Cancelar</span>
          <Marcado n={marcas.criar}><span className="btn btn-primary">Criar usuário</span></Marcado>
        </div>
      </div>
    </>
  )
}

// ── Aba Hospitais e operadoras ────────────────────────────────────────────────

const MALHA_CAREPLUS: [string, string[]][] = [
  ['Campinas', ['Hospital Santa Clara', 'Hospital São Lucas']],
  ['São Paulo', ['Hospital Bela Vista', 'Hospital Vila Nova', 'Hospital Jardins']],
]

/** A aba Hospitais e operadoras: "Novo +" (aberto, se pedido), um cartão por
 *  operadora e a CarePlus expandida, com os hospitais agrupados por cidade. */
export function ReplicaMalha({ marcas = {}, novoAberto }: {
  marcas?: Partial<Record<'novo' | 'novoHospital' | 'cartao' | 'maisHospital' | 'engrenagem' | 'hospital' | 'excluir', number>>
  novoAberto?: boolean
}) {
  const cartao = (op: { key: string; nome: string }, hospitais: number, cidades: number, aberta: boolean) => (
    <section key={op.key} className={`malha-op${aberta ? ' aberta' : ''}`}>
      <div className="malha-op-topo">
        <OpAvatar opKey={op.key} size={38} />
        <div className="malha-op-info">
          <Marcado n={aberta ? marcas.cartao : undefined}>
            <div className="malha-op-nome">{op.nome}</div>
          </Marcado>
          <div className="malha-op-sub">
            <span>{IconPredio()}{hospitais} hospitais</span>
            <span>{IconPino()}{cidades} {cidades === 1 ? 'cidade' : 'cidades'}</span>
          </div>
        </div>
        <Marcado n={aberta ? marcas.maisHospital : undefined}>
          <span className="btn btn-outline btn-sm" style={{ flexShrink: 0 }}>{IconPlus}Hospital</span>
        </Marcado>
        <Marcado n={aberta ? marcas.engrenagem : undefined}>
          <span className="malha-op-icone">{IconCog}</span>
        </Marcado>
        <span className="malha-op-seta" aria-hidden="true">{IconSeta}</span>
      </div>
      {aberta && (
        <div className="malha-op-corpo">
          {MALHA_CAREPLUS.map(([cidade, lista], ci) => (
            <div key={cidade} className="malha-cidade">
              <div className="malha-cidade-topo">{IconPino()}<span>{cidade}</span><em>{lista.length}</em></div>
              <div className="malha-cidade-grade">
                {lista.map((h, hi) => (
                  <div key={h} className="malha-hosp-row">
                    <span className="malha-hosp-icone">{IconPredio()}</span>
                    <Marcado n={ci === 0 && hi === 0 ? marcas.hospital : undefined}>
                      <span className="malha-hosp-nome botao">{h}</span>
                    </Marcado>
                    <Marcado n={ci === 0 && hi === 0 ? marcas.excluir : undefined}>
                      <span className="malha-hosp-x">{IconLixeira}</span>
                    </Marcado>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
  return (
    <>
      <Topo titulo="Operações" sub="Operadoras e os hospitais que cada uma atende" />
      <Abas ativa="malha" />
      <div className="ops-toolbar">
        <div className="ops-search">
          {IconSearch}
          <input className="bm-input" placeholder="Buscar operadora ou hospital…" readOnly />
        </div>
        <div className="malha-novo">
          <Marcado n={marcas.novo}>
            <span className="btn btn-primary btn-sm">Novo{IconPlus}</span>
          </Marcado>
          {novoAberto && (
            <div className="malha-novo-lista">
              <button type="button">Operadora</button>
              <Marcado n={marcas.novoHospital} bloco><button type="button">Hospital</button></Marcado>
            </div>
          )}
        </div>
      </div>
      <div className="malha-resumo"><b>3</b> operadoras<span aria-hidden="true">·</span><b>9</b> hospitais</div>
      <div className="malha-lista">
        {cartao(OPERADORAS[0], 5, 2, true)}
        {cartao(OPERADORAS[1], 3, 2, false)}
        {cartao(OPERADORAS[2], 4, 1, false)}
      </div>
    </>
  )
}

/** O cadastro de hospital (o mesmo de editar), aberto pelo "Novo +". `opFixa`
 *  mostra como ele abre pelo "+ Hospital" de uma operadora: a escolha de
 *  operadoras some e o selo dela fica no topo. */
export function ReplicaNovoHospital({ marcas = {}, opFixa }: {
  marcas?: Partial<Record<'nome' | 'cidade' | 'operadoras' | 'contato' | 'salvar', number>>
  opFixa?: boolean
}) {
  const marcadas = new Set(['careplus', 'porto'])
  return (
    <ModalReplica
      titulo="Novo hospital"
      largura={780}
      rodape={
        <>
          <span className="btn btn-outline btn-sm">Cancelar</span>
          <Marcado n={marcas.salvar}><span className="btn btn-primary btn-sm" style={{ gap: 6 }}>{IconOk}Adicionar hospital</span></Marcado>
        </>
      }
    >
      <div className="nh">
        <section className="nh-secao">
          <header className="nh-secao-topo">
            <span className="nh-secao-icone">{IconPredio(18)}</span>
            <div>
              <div className="nh-secao-titulo">Identificação</div>
              <div className="nh-secao-sub">Obrigatório</div>
            </div>
            {opFixa && (
              <span className="nh-op-fixa"><OpAvatar opKey="careplus" size={22} />CarePlus</span>
            )}
          </header>
          <div className="nh-grade">
            <div className="nh-campo c3">
              <label>Nome do hospital</label>
              <Marcado n={marcas.nome} bloco>
                <div className="nh-input">{IconPredio(16)}<input className="bm-input" readOnly value="Hospital Jardins" /></div>
              </Marcado>
            </div>
            <div className="nh-campo c2 nh-cidade">
              <label>Cidade</label>
              <Marcado n={marcas.cidade} bloco>
                <div className="nh-input">{IconPino(16)}<input className="bm-input" readOnly value="São Paulo" /></div>
              </Marcado>
            </div>
            <div className="nh-campo c1">
              <label>UF</label>
              <div className="nh-input nh-input-sem-icone"><input className="bm-input" readOnly value="SP" /></div>
            </div>
          </div>
        </section>

        {!opFixa && (
          <Marcado n={marcas.operadoras} bloco>
            <section className="nh-secao">
              <header className="nh-secao-topo">
                <span className="nh-secao-icone">{IconEscudo(18)}</span>
                <div>
                  <div className="nh-secao-titulo">Operadoras atendidas</div>
                  <div className="nh-secao-sub">Marque todas. O hospital aparece em cada uma delas.</div>
                </div>
                <span className="nh-contador ativo">2 marcadas</span>
              </header>
              <div className="nh-ops">
                {OPERADORAS.map((o) => (
                  <span key={o.key} className="nh-op" aria-pressed={marcadas.has(o.key)}>
                    <OpAvatar opKey={o.key} size={28} />
                    <span className="nh-op-nome">{o.nome}</span>
                    <span className="nh-op-marca">{marcadas.has(o.key) ? IconOk : IconPlus}</span>
                  </span>
                ))}
              </div>
            </section>
          </Marcado>
        )}

        <Marcado n={marcas.contato} bloco>
          <section className="nh-secao">
            <header className="nh-secao-topo">
              <span className="nh-secao-icone">{IconContato}</span>
              <div>
                <div className="nh-secao-titulo">Contato e endereço</div>
                <div className="nh-secao-sub">Opcional</div>
              </div>
            </header>
            <div className="nh-grade">
              <div className="nh-campo c3">
                <label>Telefone</label>
                <div className="nh-input">{IconFone}<input className="bm-input" readOnly value="(11) 3000-0000" /></div>
              </div>
              <div className="nh-campo c3">
                <label>E-mail</label>
                <div className="nh-input">{IconEmail}<input className="bm-input" readOnly value="censo@hospitaljardins.com.br" /></div>
              </div>
            </div>
          </section>
        </Marcado>
      </div>
    </ModalReplica>
  )
}
