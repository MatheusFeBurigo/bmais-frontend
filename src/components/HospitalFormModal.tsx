// Cadastro de hospital (criar e editar), com a ficha inteira e as operadoras
// que ele atende. Criar e editar usam a MESMA janela: antes a edição era outra
// modal, com Região em vez de Cidade e sem as operadoras, e as duas divergiam.
//
// Antes o hospital nascia só com o nome, preso à operadora de onde o botão foi
// clicado, e o resto (localização, contatos, outras operadoras) ficava para uma
// edição posterior que ninguém fazia. Aqui tudo vem aberto de uma vez: no topo o
// que é obrigatório, abaixo o complementar. Usado em Operações (analista) e em
// Configurações (gestor/diretor).
//
// A localização é pedida por CIDADE, não por região: é a pergunta que quem
// cadastra sabe responder. A região é gravada com o mesmo valor, porque as telas
// que agrupam hospitais derivam a cidade de `regiao` (lib/cidades.ts) e um
// hospital sem ela cairia em "Sem cidade".
import { useEffect, useMemo, useState } from 'react'
import { LoadingState, Modal, OpAvatar } from './ui'
import {
  criarHospital, salvarFichaHospital, vincularOperadora, desvincularOperadora,
} from '../services/configuracoes.service'
import { useHospital } from '../hooks/useHospital'
import { useTodosHospitais } from '../hooks/useEquipe'
import { cidadeDaRegiao, CIDADE_A_DEFINIR, SEM_CIDADE } from '../lib/cidades'
import { REGIOES } from '../lib/regioes'

// ── Ícones (traço, 24×24, herdam a cor) ─────────────────────────────────────
const svg = (d: React.ReactNode, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
)
const Icon = {
  predio: (s?: number) => svg(<><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M16 9h2a2 2 0 0 1 2 2v10" /><path d="M3 21h18" /><path d="M9 7h2M9 11h2M9 15h2" /></>, s),
  pino: (s?: number) => svg(<><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>, s),
  escudo: (s?: number) => svg(<><path d="M12 3 4 6v6c0 4.6 3.4 8.3 8 9 4.6-.7 8-4.4 8-9V6l-8-3z" /><path d="m9 12 2 2 4-4" /></>, s),
  contato: (s?: number) => svg(<><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M6 16c.6-1.4 1.7-2 3-2s2.4.6 3 2M15 10h3M15 13h3" /></>, s),
  doc: (s?: number) => svg(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>, s),
  fone: (s?: number) => svg(<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />, s),
  email: (s?: number) => svg(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>, s),
  casa: (s?: number) => svg(<><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10" /></>, s),
  cep: (s?: number) => svg(<><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" /></>, s),
  nota: (s?: number) => svg(<><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>, s),
  check: (s?: number) => svg(<path d="m5 12 5 5 9-10" />, s),
  mais: (s?: number) => svg(<path d="M12 5v14M5 12h14" />, s),
}

type CampoComplementar = 'cnpj' | 'telefone' | 'email' | 'endereco' | 'cep' | 'uf'
// (UF não está na lista abaixo: fica ao lado da cidade, que a preenche.)

// `col` = trilhas ocupadas numa grade de 6 (vira uma coluna no celular).
const COMPLEMENTARES: readonly {
  key: CampoComplementar; label: string; placeholder?: string; tipo?: string
  col: 2 | 3 | 4 | 6; icone: (s?: number) => React.ReactNode
}[] = [
  { key: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0000-00', col: 3, icone: Icon.doc },
  { key: 'telefone', label: 'Telefone', placeholder: '(00) 0000-0000', tipo: 'tel', col: 3, icone: Icon.fone },
  { key: 'email', label: 'E-mail', placeholder: 'contato@hospital.com.br', tipo: 'email', col: 4, icone: Icon.email },
  { key: 'cep', label: 'CEP', placeholder: '00000-000', col: 2, icone: Icon.cep },
  { key: 'endereco', label: 'Endereço', placeholder: 'Rua, número, bairro', col: 6, icone: Icon.casa },
]

// UF das cidades já conhecidas: escolher a cidade preenche a UF sozinha.
const UF_DA_CIDADE: Record<string, string> = {
  'Rio de Janeiro': 'RJ', 'Niterói': 'RJ', 'Barra Mansa': 'RJ',
  'Curitiba': 'PR', 'Florianópolis': 'SC', 'Joinville': 'SC',
  'Porto Alegre': 'RS', 'Campo Grande': 'MS',
}
const CIDADES_SP = new Set([
  'São Paulo', 'Guarulhos', 'Osasco', 'Caieiras', 'Itapevi', 'Mogi das Cruzes', 'Suzano',
  'Taboão da Serra', 'Arujá', 'Campinas', 'Sorocaba', 'Jundiaí', 'Americana', 'Rio Claro',
  'Bragança Paulista', 'Grande ABC', 'Vale do Paraíba', 'Litoral',
])
function ufDaCidade(c: string): string {
  return UF_DA_CIDADE[c] ?? (CIDADES_SP.has(c) ? 'SP' : '')
}

// Comparação sem acento nem caixa: "sao paulo" acha "São Paulo".
function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

// Nome → key: a mesma regra de sempre (minúsculas, só [a-z0-9_], truncado),
// para o mesmo nome gerar a mesma key em qualquer tela.
export function paraKey(nome: string): string {
  return nome.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)
}

interface Props {
  /** Todas as operadoras cadastradas (origem da escolha). */
  operadoras: readonly { key: string; nome: string }[]
  /** Operadora de onde o cadastro foi aberto ("+ Hospital" do cartão dela).
   *  Num hospital novo ela é FIXA: o hospital nasce só nela e a escolha de
   *  operadoras nem aparece. Para várias operadoras, o caminho é "Novo +". */
  opInicial?: string
  /** Key do hospital a editar. Ausente = hospital novo. */
  hospitalKey?: string
  onClose: () => void
  onToast: (m: string) => void
  onDone: () => void
}

export default function HospitalFormModal({ operadoras, opInicial, hospitalKey, onClose, onToast, onDone }: Props) {
  const editando = Boolean(hospitalKey)
  const opFixa = !editando && opInicial
    ? (operadoras.find((o) => o.key === opInicial) ?? { key: opInicial, nome: opInicial })
    : null
  const { data: hospitais } = useTodosHospitais()
  // Na edição, a listagem só tem key/nome: a ficha completa vem daqui.
  const { data: ficha, isLoading: carregando, isError: erroFicha } = useHospital(hospitalKey ?? null)
  const [preenchido, setPreenchido] = useState(false)
  const [nome, setNome] = useState('')
  const [ops, setOps] = useState<string[]>(opInicial ? [opInicial] : [])
  const [cidade, setCidade] = useState('')
  const [listaCidades, setListaCidades] = useState(false)
  const [campos, setCampos] = useState<Record<CampoComplementar, string>>(
    { cnpj: '', telefone: '', email: '', endereco: '', cep: '', uf: '' },
  )
  const [ufManual, setUfManual] = useState(false)
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)
  const [tentou, setTentou] = useState(false)

  // Cidades já usadas no cadastro + as do catálogo, para a pessoa escolher em vez
  // de digitar (grafias diferentes da mesma cidade viram grupos diferentes).
  const cidades = useMemo(() => {
    const todas = new Set<string>()
    for (const r of REGIOES) todas.add(cidadeDaRegiao(r))
    for (const h of hospitais ?? []) todas.add(h.cidade?.trim() || cidadeDaRegiao(h.regiao))
    todas.delete(SEM_CIDADE)
    todas.delete(CIDADE_A_DEFINIR)
    return [...todas].sort((a, b) => a.localeCompare(b))
  }, [hospitais])

  // Preenche o formulário uma vez, quando a ficha chega. Depois disso o que
  // vale é o que a pessoa digita (um refetch não pode apagar a edição).
  useEffect(() => {
    if (!ficha || preenchido) return
    const cidadeAtual = ficha.cidade?.trim() || cidadeDaRegiao(ficha.regiao)
    setNome(ficha.nome)
    setOps(ficha.operadoras ?? (ficha.operadora_key ? [ficha.operadora_key] : []))
    setCidade(cidadeAtual === SEM_CIDADE || cidadeAtual === CIDADE_A_DEFINIR ? '' : cidadeAtual)
    setCampos({
      cnpj: ficha.cnpj ?? '', telefone: ficha.telefone ?? '', email: ficha.email ?? '',
      endereco: ficha.endereco ?? '', cep: ficha.cep ?? '', uf: ficha.uf ?? '',
    })
    setUfManual(Boolean(ficha.uf))
    setObservacoes(ficha.observacoes ?? '')
    setPreenchido(true)
  }, [ficha, preenchido])

  const qCidade = normalizar(cidade)
  const sugestoes = cidades.filter((c) => !qCidade || normalizar(c).includes(qCidade)).slice(0, 8)

  const faltaNome = !nome.trim()
  const faltaOp = ops.length === 0
  const faltaCidade = !cidade.trim()
  const incompleto = faltaNome || faltaOp || faltaCidade

  function alternarOp(key: string) {
    setOps((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]))
  }

  function escolherCidade(c: string) {
    setCidade(c)
    setListaCidades(false)
    if (!ufManual) setCampos((cur) => ({ ...cur, uf: ufDaCidade(c) }))
  }

  async function salvar() {
    setTentou(true)
    if (incompleto) return
    const n = nome.trim()
    // Digitou uma cidade que já existe com outra grafia: grava a conhecida.
    const c = cidades.find((x) => normalizar(x) === normalizar(cidade)) ?? cidade.trim()
    const vazioViraNull = (v: string) => v.trim() || null
    const dados = {
      cnpj: vazioViraNull(campos.cnpj), telefone: vazioViraNull(campos.telefone),
      email: vazioViraNull(campos.email), endereco: vazioViraNull(campos.endereco),
      uf: vazioViraNull(campos.uf.toUpperCase()), cep: vazioViraNull(campos.cep),
      observacoes: vazioViraNull(observacoes),
    }
    setSaving(true)
    try {
      if (hospitalKey && ficha) {
        // A região só muda se a cidade mudou: "SP - Zona Sul" já é São Paulo,
        // e trocá-la por "São Paulo" perderia a zona que o escopo usa.
        const regiao = cidadeDaRegiao(ficha.regiao) === c ? ficha.regiao : c
        await salvarFichaHospital(hospitalKey, { nome: n, cidade: c, regiao, ...dados })
        // Vincula antes de desvincular: o hospital nunca fica sem operadora.
        const antes = ficha.operadoras ?? []
        for (const k of ops.filter((k) => !antes.includes(k))) await vincularOperadora(hospitalKey, k)
        for (const k of antes.filter((k) => !ops.includes(k))) await desvincularOperadora(hospitalKey, k)
        onToast('✓ Hospital atualizado')
        onDone()
        return
      }
      // A operadora de onde se abriu, se marcada, vai primeiro: vira a principal.
      const ordenadas = opInicial && ops.includes(opInicial)
        ? [opInicial, ...ops.filter((k) => k !== opInicial)]
        : ops
      await criarHospital({ key: paraKey(n), nome: n, operadoras: ordenadas, cidade: c, regiao: c, ...dados })
      onToast('✓ Hospital adicionado')
      onDone()
    } catch (e) {
      onToast(`Erro: ${(e as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  const erro = (falta: boolean) => tentou && falta
  const classeCampo = (col: number, falta = false) => `nh-campo c${col}${erro(falta) ? ' com-erro' : ''}`
  const msgErro = (falta: boolean, texto: string) => erro(falta) && <div className="nh-erro">{texto}</div>

  return (
    <Modal title={editando ? 'Editar hospital' : 'Novo hospital'} onClose={onClose} largura={780} footer={
      <>
        <button className="btn btn-outline btn-sm" onClick={onClose} disabled={saving}>Cancelar</button>
        <button className="btn btn-primary btn-sm" onClick={salvar}
          disabled={saving || (tentou && incompleto) || (editando && !preenchido)}>
          {Icon.check(14)}
          {editando
            ? (saving ? 'Salvando…' : 'Salvar alterações')
            : (saving ? 'Adicionando…' : 'Adicionar hospital')}
        </button>
      </>
    }>
      {editando && erroFicha ? (
        <p className="nh-aviso">Não foi possível abrir a ficha. Feche e tente de novo.</p>
      ) : editando && (carregando || !preenchido) ? (
        <LoadingState />
      ) : (
      <div className="nh">
        {/* ── Identificação ─────────────────────────────────────────────── */}
        <section className="nh-secao">
          <header className="nh-secao-topo">
            <span className="nh-secao-icone">{Icon.predio(18)}</span>
            <div>
              <div className="nh-secao-titulo">Identificação</div>
              <div className="nh-secao-sub">Obrigatório</div>
            </div>
            {opFixa && (
              <span className="nh-op-fixa" title={`O hospital será criado em ${opFixa.nome}`}>
                <OpAvatar opKey={opFixa.key} size={22} />
                {opFixa.nome}
              </span>
            )}
          </header>
          <div className="nh-grade">
            <div className={classeCampo(3, faltaNome)}>
              <label htmlFor="nh-nome">Nome do hospital</label>
              <div className="nh-input">
                {Icon.predio()}
                <input id="nh-nome" type="text" className="bm-input" placeholder="Ex.: Hospital São Luiz Itaim"
                  value={nome} onChange={(e) => setNome(e.target.value)} autoFocus={!editando} />
              </div>
              {msgErro(faltaNome, 'Informe o nome.')}
            </div>

            <div className={`${classeCampo(2, faltaCidade)} nh-cidade`}>
              <label htmlFor="nh-cidade">Cidade</label>
              <div className="nh-input">
                {Icon.pino()}
                <input
                  id="nh-cidade" type="text" className="bm-input" placeholder="Buscar cidade"
                  autoComplete="off" role="combobox" aria-expanded={listaCidades && sugestoes.length > 0}
                  aria-controls="nh-cidade-lista"
                  value={cidade}
                  onFocus={() => setListaCidades(true)}
                  onBlur={() => setListaCidades(false)}
                  onChange={(e) => { setCidade(e.target.value); setListaCidades(true) }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && listaCidades && sugestoes[0]) { e.preventDefault(); escolherCidade(sugestoes[0]) }
                    if (e.key === 'Escape') setListaCidades(false)
                  }}
                />
              </div>
              {listaCidades && sugestoes.length > 0 && (
                <ul id="nh-cidade-lista" className="nh-sugestoes" role="listbox">
                  {sugestoes.map((c) => (
                    // mousedown + preventDefault: escolhe antes do blur fechar a lista.
                    <li key={c} role="option" aria-selected={c === cidade}
                      onMouseDown={(e) => { e.preventDefault(); escolherCidade(c) }}>
                      {Icon.pino(13)}
                      <span>{c}</span>
                      {ufDaCidade(c) && <em>{ufDaCidade(c)}</em>}
                    </li>
                  ))}
                </ul>
              )}
              {msgErro(faltaCidade, 'Informe a cidade.')}
            </div>
            <div className={classeCampo(1)}>
              <label htmlFor="nh-uf">UF</label>
              <div className="nh-input nh-input-sem-icone">
                <input id="nh-uf" type="text" className="bm-input" placeholder="SP" maxLength={2}
                  value={campos.uf}
                  onChange={(e) => { setUfManual(true); setCampos((cur) => ({ ...cur, uf: e.target.value.toUpperCase() })) }} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Operadoras (só em "Novo +" e na edição) ──────────────────── */}
        {!opFixa && (
        <section className={`nh-secao${erro(faltaOp) ? ' com-erro' : ''}`}>
          <header className="nh-secao-topo">
            <span className="nh-secao-icone">{Icon.escudo(18)}</span>
            <div>
              <div className="nh-secao-titulo">Operadoras atendidas</div>
              <div className="nh-secao-sub">Marque todas. O hospital aparece em cada uma delas.</div>
            </div>
            <span className={`nh-contador${ops.length ? ' ativo' : ''}`}>
              {ops.length} {ops.length === 1 ? 'marcada' : 'marcadas'}
            </span>
          </header>
          <div className="nh-ops">
            {operadoras.map((o) => {
              const marcada = ops.includes(o.key)
              return (
                <button key={o.key} type="button" className="nh-op" aria-pressed={marcada}
                  onClick={() => alternarOp(o.key)}>
                  <OpAvatar opKey={o.key} size={28} />
                  <span className="nh-op-nome">{o.nome}</span>
                  <span className="nh-op-marca">{marcada ? Icon.check(13) : Icon.mais(13)}</span>
                </button>
              )
            })}
          </div>
          {msgErro(faltaOp, 'Marque ao menos uma operadora.')}
        </section>
        )}

        {/* ── Contato e endereço ────────────────────────────────────────── */}
        <section className="nh-secao">
          <header className="nh-secao-topo">
            <span className="nh-secao-icone">{Icon.contato(18)}</span>
            <div>
              <div className="nh-secao-titulo">Contato e endereço</div>
              <div className="nh-secao-sub">Opcional</div>
            </div>
          </header>
          <div className="nh-grade">
            {COMPLEMENTARES.map((c) => (
              <div key={c.key} className={classeCampo(c.col)}>
                <label htmlFor={`nh-${c.key}`}>{c.label}</label>
                <div className="nh-input">
                  {c.icone()}
                  <input
                    id={`nh-${c.key}`} type={c.tipo || 'text'} className="bm-input" placeholder={c.placeholder}
                    value={campos[c.key]}
                    onChange={(e) => setCampos((cur) => ({ ...cur, [c.key]: e.target.value }))}
                  />
                </div>
              </div>
            ))}
            <div className={classeCampo(6)}>
              <label htmlFor="nh-obs">Observações</label>
              <div className="nh-input nh-input-area">
                {Icon.nota()}
                <textarea id="nh-obs" className="bm-input" rows={2} value={observacoes}
                  placeholder="Contato do faturamento, particularidades do censo…"
                  onChange={(e) => setObservacoes(e.target.value)} />
              </div>
            </div>
          </div>
        </section>
      </div>
      )}
    </Modal>
  )
}
