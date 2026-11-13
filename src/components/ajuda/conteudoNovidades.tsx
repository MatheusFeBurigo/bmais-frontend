// Conteúdo do módulo "O que há de novo" (13/11/2026, pedido do usuário): as
// funcionalidades recentes, de forma visual. Cada novidade tem um cartão na
// grade do topo e um bloco com onde fica, quem usa, o que muda e uma miniatura
// do elemento novo da tela. Todos os papéis leem o módulo; uma novidade com
// `papeis` só aparece para eles e para o admin (a do Painel do Gestor: analista
// interno e gestora, pedido do usuário em 13/11/2026).
//
// As miniaturas são retratos, não a tela de verdade: ficam `inert` e escondidas
// do leitor de tela (o texto ao lado diz o mesmo), e os nomes são fictícios.
//
// Ao publicar uma novidade, acrescente um item em NOVIDADES e o bloco dela; ao
// ficar antiga, ela pode sair (o módulo da tela continua sendo a referência).
import type { ReactNode } from 'react'
import { useAuth } from '../../auth/AuthContext'
import type { UserRole } from '../../types/api'
import { veTudo } from './acessoAjuda'
import { modulosVisiveis } from './catalogo'

interface Props {
  irPara: (id: string) => void
}

type Cor = 'primary' | 'info' | 'success' | 'warning' | 'rosa' | 'indigo' | 'danger'

interface Novidade {
  id: string
  titulo: string
  resumo: string
  onde: string
  quem: string
  cor: Cor
  icone: ReactNode
  /** Só estes papéis veem a novidade (além do admin). Ausente = todos. */
  papeis?: readonly UserRole[]
}

const svg = (d: ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
)

const NOVIDADES: readonly Novidade[] = [
  {
    id: 'nv-todos', titulo: 'Todos os pacientes', cor: 'primary',
    resumo: 'Técnico consulta a rede inteira, só para leitura fora da área',
    onde: 'Painel Operacional', quem: 'Técnico e coordenador técnico',
    icone: svg(<><circle cx="12" cy="12" r="9" /><path d="M3.6 9h16.8M3.6 15h16.8" /><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" /></>),
  },
  {
    id: 'nv-autorizacao', titulo: 'Autorização de relatório', cor: 'indigo',
    resumo: 'Relatório fora da área só com aprovação, na nova tela Aprovações',
    onde: 'Ficha do paciente e Aprovações', quem: 'Técnico e coordenador técnico pedem; coordenação técnica, gestão e administração decidem',
    icone: svg(<><path d="M9 4h6v3H9z" /><path d="M7 5.5H5.5v15h13v-15H17" /><path d="m9 13.5 2 2 4-4" /></>),
  },
  {
    id: 'nv-homecare', titulo: 'Home care no relatório', cor: 'success',
    resumo: 'Deixa de ser alta e passa a ser registrado no relatório',
    onde: 'Registrar relatório', quem: 'Quem registra relatório',
    icone: svg(<><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v10h13V10" /><path d="M12 13v4M10 15h4" /></>),
  },
  {
    id: 'nv-acompanhamento', titulo: 'Aba Acompanhamento', cor: 'warning',
    resumo: 'Prorrogados, negociação, aceite e home care em colunas',
    onde: 'Tarefas', quem: 'Todos os perfis com Tarefas',
    icone: svg(<><rect x="3.5" y="4.5" width="5" height="15" rx="1.2" /><rect x="9.5" y="4.5" width="5" height="10" rx="1.2" /><rect x="15.5" y="4.5" width="5" height="12.5" rx="1.2" /></>),
  },
  {
    id: 'nv-gestor', titulo: 'Filtros de situação', cor: 'rosa',
    resumo: 'Prorrogados, negociação, aceite e home care no Painel do Gestor',
    onde: 'Painel do Gestor', quem: 'Quem acessa o Painel do Gestor',
    papeis: ['analista', 'gestor'],
    icone: svg(<><path d="M4 5h16l-6 7.5V19l-4-2v-4.5z" /></>),
  },
  {
    id: 'nv-previa', titulo: 'Desfazer com prévia', cor: 'danger',
    resumo: 'Mostra quem sai e quem fica antes de desfazer um envio',
    onde: 'Movimentações', quem: 'Quem desfaz envios',
    icone: svg(<><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></>),
  },
  {
    id: 'nv-analista', titulo: 'Analista desfaz envio', cor: 'info',
    resumo: 'O analista interno passa a desfazer envios de censo',
    onde: 'Movimentações', quem: 'Analista interno',
    icone: svg(<><circle cx="12" cy="8" r="3.6" /><path d="M5 20a7 7 0 0 1 14 0" /></>),
  },
]

const CSS = `
.nv-intro{color:var(--ink-2)}
.nv-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin:14px 0 26px}
.nv-cartao{display:flex;flex-direction:column;gap:6px;text-align:left;padding:12px 13px;border:1px solid var(--border);
  border-radius:10px;background:var(--surface);cursor:pointer;font:inherit;color:inherit;transition:border-color .15s,box-shadow .15s,transform .15s}
.nv-cartao:hover{border-color:var(--border-strong);box-shadow:var(--shadow-sm);transform:translateY(-1px)}
.nv-cartao:focus-visible{outline:2px solid var(--primary);outline-offset:2px}
.nv-cartao-tit{font-weight:600;color:var(--ink);font-size:var(--t-base)}
.nv-cartao-res{font-size:var(--t-sm);color:var(--muted);line-height:1.45}
.nv-cartao-onde{font-size:var(--t-xs);color:var(--muted-2);margin-top:auto}
.nv-ico{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;flex-shrink:0}
.nv-c-primary{background:var(--primary-soft);color:var(--primary)}
.nv-c-info{background:var(--info-bg);color:var(--info)}
.nv-c-success{background:var(--success-bg);color:var(--success-2)}
.nv-c-warning{background:var(--warning-bg);color:var(--warning-2)}
.nv-c-rosa{background:var(--rosa-bg);color:var(--rosa)}
.nv-c-indigo{background:var(--indigo-bg);color:var(--indigo)}
.nv-c-danger{background:var(--danger-bg);color:var(--danger-2)}
.nv-bloco{border:1px solid var(--border);border-radius:12px;background:var(--surface);padding:18px;margin:0 0 18px;scroll-margin-top:16px}
.nv-bloco-cab{display:flex;gap:12px;align-items:flex-start;margin-bottom:12px}
.aj-body .nv-bloco-tit{margin:0;font-size:var(--t-lg);color:var(--ink);font-weight:650}
/* O subtítulo da Ajuda tem uma barra à esquerda; aqui o ícone já marca o bloco. */
.aj-body .nv-bloco-tit::before{display:none}
.nv-etqs{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.nv-etq{font-size:var(--t-xs);padding:3px 8px;border-radius:999px;background:var(--surface-2);color:var(--ink-2);border:1px solid var(--border-soft)}
.nv-etq b{color:var(--ink);font-weight:600}
.nv-corpo{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:18px;align-items:start}
@media (max-width:760px){.nv-corpo{grid-template-columns:1fr}}
.nv-pontos{margin:0;padding-left:18px;display:grid;gap:7px;color:var(--ink-2);line-height:1.5}
.nv-ver{margin-top:10px;font-size:var(--t-sm);color:var(--muted)}
.nv-palco{background:var(--bg-2);border:1px dashed var(--border-strong);border-radius:10px;padding:14px;position:relative}
.nv-palco-rot{position:absolute;top:-9px;left:12px;background:var(--surface);padding:0 6px;font-size:var(--t-xs);
  color:var(--muted-2);text-transform:uppercase;letter-spacing:.06em}
.nv-antes-agora{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:stretch;margin:4px 0 14px}
@media (max-width:560px){.nv-antes-agora{grid-template-columns:1fr}.nv-seta{transform:rotate(90deg);justify-self:center}}
.nv-aa{border-radius:9px;padding:9px 11px;font-size:var(--t-sm);line-height:1.45}
.nv-aa span{display:block;font-size:var(--t-xs);text-transform:uppercase;letter-spacing:.06em;font-weight:700;margin-bottom:3px}
.nv-antes{background:var(--surface-2);color:var(--muted);border:1px solid var(--border-soft)}
.nv-agora{background:var(--success-bg);color:var(--ink-2);border:1px solid var(--success)}
.nv-agora span{color:var(--success-2)}
.nv-seta{align-self:center;color:var(--muted-2);font-size:18px}
/* ── miniaturas ── */
.nv-m{font-size:var(--t-sm);color:var(--ink-2)}
.nv-m-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:9px 10px}
.nv-m-row{display:flex;align-items:center;gap:8px}
.nv-m-esp{display:flex;justify-content:space-between;align-items:center;gap:8px}
.nv-seg{display:inline-flex;border:1px solid var(--border-strong);border-radius:8px;overflow:hidden;background:var(--surface)}
.nv-seg span{padding:5px 11px;font-size:var(--t-sm);color:var(--muted)}
.nv-seg .on{background:var(--primary);color:#fff;font-weight:600}
.nv-linha{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:7px 9px;border-bottom:1px solid var(--border-soft)}
.nv-linha:last-child{border-bottom:0}
.nv-fraco{color:var(--muted);font-size:var(--t-xs)}
.nv-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:7px;font-size:var(--t-sm);font-weight:500;
  border:1px solid var(--border-strong);background:var(--surface);color:var(--ink);white-space:nowrap}
.nv-btn.pri{background:var(--primary);border-color:var(--primary);color:#fff}
.nv-btn.per{background:var(--danger);border-color:var(--danger);color:#fff}
.nv-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;border:1px solid var(--border);
  background:var(--surface);font-size:var(--t-sm);color:var(--ink-2)}
.nv-pill b{font-weight:700;color:var(--ink)}
.nv-pill.on{border-color:var(--rosa);background:var(--rosa-bg);color:var(--rosa)}
.nv-pill.on b{color:var(--rosa)}
.nv-cont{display:inline-flex;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--danger);color:#fff;
  font-size:11px;font-weight:700;align-items:center;justify-content:center}
.nv-abas{display:flex;gap:4px;border-bottom:1px solid var(--border);margin-bottom:10px}
.nv-abas span{padding:6px 10px;font-size:var(--t-sm);color:var(--muted);border-bottom:2px solid transparent;margin-bottom:-1px}
.nv-abas .on{color:var(--ink);font-weight:600;border-bottom-color:var(--primary)}
.nv-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:6px}
.nv-col{background:var(--surface);border:1px solid var(--border);border-radius:7px;padding:6px}
.nv-col-tit{font-size:11px;font-weight:700;color:var(--ink-2);display:flex;justify-content:space-between;gap:6px;margin-bottom:5px}
.nv-col-tit span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nv-col-tit span:last-child{color:var(--muted);flex-shrink:0}
.nv-mini{height:22px;border-radius:5px;background:var(--surface-2);border:1px solid var(--border-soft);margin-top:4px}
.nv-check{display:inline-flex;width:15px;height:15px;border-radius:4px;background:var(--primary);color:#fff;align-items:center;justify-content:center;font-size:11px}
.nv-campo{border:1px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--muted-2);font-size:var(--t-xs)}
.nv-aviso{background:var(--warning-bg);border:1px solid var(--warning);border-radius:7px;padding:7px 9px;font-size:var(--t-xs);color:var(--ink-2)}
.nv-info{background:var(--info-bg);border-radius:7px;padding:7px 9px;font-size:var(--t-xs);color:var(--ink-2)}
`

/** O retrato de um pedaço da tela: só para ver, nada nele responde ao clique. */
function Palco({ children }: { children: ReactNode }) {
  return (
    <div className="nv-palco" aria-hidden="true" inert>
      <span className="nv-palco-rot">Como aparece</span>
      <div className="nv-m">{children}</div>
    </div>
  )
}

function AntesAgora({ antes, agora }: { antes: ReactNode; agora: ReactNode }) {
  return (
    <div className="nv-antes-agora">
      <div className="nv-aa nv-antes"><span>Antes</span>{antes}</div>
      <div className="nv-seta" aria-hidden="true">→</div>
      <div className="nv-aa nv-agora"><span>Agora</span>{agora}</div>
    </div>
  )
}

export function ModuloNovidades({ irPara }: Props) {
  const { role } = useAuth()
  // Módulo fora do índice do papel vira texto: o link abriria o primeiro módulo
  // do índice, e o clique só voltaria ao topo desta página.
  const legiveis = new Set(modulosVisiveis(role).map((m) => m.id))
  const Link = ({ para, children }: { para: string; children: string }) => (
    legiveis.has(para)
      ? <button type="button" className="aj-link" onClick={() => irPara(para)}>{children}</button>
      : <>{children}</>
  )
  const visiveis = NOVIDADES.filter((nv) =>
    !nv.papeis || veTudo(role) || (role != null && nv.papeis.includes(role)))
  const ve = (id: string) => visiveis.some((nv) => nv.id === id)
  const n = (id: string) => NOVIDADES.find((x) => x.id === id) as Novidade
  const irAoBloco = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  function Bloco({ id, children, palco, antesAgora, ver }: {
    id: string; children: ReactNode; palco: ReactNode; antesAgora?: ReactNode; ver: ReactNode
  }) {
    const nv = n(id)
    return (
      <section id={id} className="nv-bloco" aria-labelledby={`${id}-t`}>
        <div className="nv-bloco-cab">
          <span className={`nv-ico nv-c-${nv.cor}`}>{nv.icone}</span>
          <div>
            <h3 id={`${id}-t`} className="nv-bloco-tit">{nv.titulo}</h3>
            <div className="nv-etqs">
              <span className="nv-etq">Onde: <b>{nv.onde}</b></span>
              <span className="nv-etq">Quem usa: <b>{nv.quem}</b></span>
            </div>
          </div>
        </div>
        {antesAgora}
        <div className="nv-corpo">
          <div>
            <ul className="nv-pontos">{children}</ul>
            <p className="nv-ver">Detalhes em {ver}.</p>
          </div>
          <Palco>{palco}</Palco>
        </div>
      </section>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <p className="nv-intro">
        As funcionalidades mais recentes da plataforma, cada uma com <strong>onde fica</strong>,{' '}
        <strong>quem usa</strong>, o que muda e como ela aparece na tela. Clique num cartão para ir
        direto ao detalhe.
      </p>

      <div className="nv-grade">
        {visiveis.map((nv) => (
          <button key={nv.id} type="button" className="nv-cartao" onClick={() => irAoBloco(nv.id)}>
            <span className={`nv-ico nv-c-${nv.cor}`}>{nv.icone}</span>
            <span className="nv-cartao-tit">{nv.titulo}</span>
            <span className="nv-cartao-res">{nv.resumo}</span>
            <span className="nv-cartao-onde">{nv.onde}</span>
          </button>
        ))}
      </div>

      <Bloco id="nv-todos" ver={<Link para="painel-operacional">Painel Operacional</Link>}
        palco={
          <>
            <div className="nv-m-esp" style={{ marginBottom: 10 }}>
              <span className="nv-seg"><span>Minha área</span><span className="on">Todos os pacientes</span></span>
              <span className="nv-fraco">Rede inteira</span>
            </div>
            <div className="nv-m-card" style={{ padding: 0 }}>
              <div className="nv-linha"><span>Maria Souza · <span className="nv-fraco">Hospital da sua área</span></span><span className="badge success">Sua área</span></div>
              <div className="nv-linha"><span>José Lima · <span className="nv-fraco">Outro hospital</span></span><span className="badge caution">Só leitura</span></div>
            </div>
          </>
        }>
        <li>O técnico e o coordenador técnico trocam a lista entre <strong>Minha área</strong> e <strong>Todos os pacientes</strong>.</li>
        <li>Fora da área a ficha abre <strong>só para leitura</strong>: dá para consultar, mas não editar nem registrar relatório.</li>
        <li>Tarefas e ações do dia continuam pela área de cada um.</li>
      </Bloco>

      <Bloco id="nv-autorizacao" ver={<Link para="ficha-do-paciente">Ficha do Paciente</Link>}
        palco={
          <div style={{ display: 'grid', gap: 10 }}>
            <div className="nv-info">
              Paciente fora da sua área.
              <div style={{ marginTop: 6 }}><span className="nv-btn">Pedir autorização para relatório</span></div>
            </div>
            <div className="nv-m-card">
              <div className="nv-m-esp" style={{ marginBottom: 6 }}>
                <strong>Aprovações</strong><span className="nv-cont">2</span>
              </div>
              <div className="nv-fraco" style={{ marginBottom: 6 }}>José Lima · pedido por Ana (técnica) · "cobrindo a colega"</div>
              <div className="nv-m-row" style={{ justifyContent: 'flex-end' }}>
                <span className="nv-btn">Recusar</span><span className="nv-btn pri">Aprovar</span>
              </div>
            </div>
          </div>
        }>
        <li>O técnico ou o coordenador técnico pede pela ficha, em <strong>Pedir autorização para relatório</strong>, dizendo o motivo.</li>
        <li>O pedido cai na tela <strong>Aprovações</strong> (com contador no menu), para coordenação técnica, gestão e administração decidirem. Ninguém aprova o próprio pedido.</li>
        <li><strong>Cada aprovação vale para um relatório.</strong> Sem aprovação, o sistema não aceita o registro.</li>
      </Bloco>

      <Bloco id="nv-homecare" ver={<Link para="ficha-do-paciente">Ficha do Paciente</Link>}
        antesAgora={<AntesAgora antes="Home care era um motivo de alta: o paciente saía da lista de internados."
                                agora="Home care é registrado no relatório, como a prorrogação. O paciente segue internado." />}
        palco={
          <div style={{ display: 'grid', gap: 8 }}>
            <div className="nv-m-card nv-fraco">Prorrogação</div>
            <div className="nv-m-card">
              <div className="nv-m-row" style={{ marginBottom: 8 }}><span className="nv-check">✓</span><strong>Registrar home care</strong></div>
              <div style={{ display: 'grid', gap: 6 }}>
                <span className="nv-campo">Tipo de atendimento (opcional)</span>
                <span className="nv-campo">Empresa de home care (opcional)</span>
              </div>
            </div>
          </div>
        }>
        <li>Em <strong>Registrar relatório</strong>, depois de Prorrogação, marque <strong>Registrar home care</strong>.</li>
        <li>As perguntas são as de antes e <strong>nenhuma é obrigatória</strong>: marcar já registra.</li>
        <li>Vale o do relatório aprovado mais recente. Aparece na coluna Home care das Tarefas{ve('nv-gestor') ? ' e no filtro do Gestor' : ''}.</li>
      </Bloco>

      <Bloco id="nv-acompanhamento" ver={<Link para="tarefas">Tarefas</Link>}
        palco={
          <>
            <div className="nv-abas"><span>Pacientes</span><span>Censos</span><span className="on">Acompanhamento</span></div>
            <div className="nv-cols">
              {[['Prorrogados', 3], ['Negociação', 2], ['Aguard. aceite', 1], ['Home care', 2]].map(([t, q]) => (
                <div key={t} className="nv-col">
                  <div className="nv-col-tit"><span>{t}</span><span>{q}</span></div>
                  {Array.from({ length: Number(q) }, (_, i) => <div key={i} className="nv-mini" />)}
                </div>
              ))}
            </div>
          </>
        }>
        <li>Nova aba <strong>Acompanhamento</strong>, para todos os perfis, ao lado de Pacientes e Censos.</li>
        <li>Colunas <strong>Prorrogados</strong>, <strong>Negociação</strong>, <strong>Aguardando aceite</strong> e <strong>Home care</strong>.</li>
        <li>É acompanhamento, não pendência: o paciente pode estar em dia. O topo das Tarefas também foi reorganizado num só cartão.</li>
      </Bloco>

      {ve('nv-gestor') && <Bloco id="nv-gestor" ver={<Link para="painel-do-gestor">Painel do Gestor</Link>}
        palco={
          <>
            <div className="nv-fraco" style={{ marginBottom: 8 }}>Situação</div>
            <div className="nv-m-row" style={{ flexWrap: 'wrap' }}>
              <span className="nv-pill on">Prorrogados <b>12</b></span>
              <span className="nv-pill">Negociação <b>4</b></span>
              <span className="nv-pill">Aguardando aceite <b>2</b></span>
              <span className="nv-pill">Homecare <b>3</b></span>
            </div>
          </>
        }>
        <li>A lista de pacientes do Gestor ganhou filtros de situação: <strong>Prorrogados</strong>, <strong>Negociação</strong>, <strong>Aguardando aceite</strong> e <strong>Homecare</strong>.</li>
        <li>Cada filtro mostra quantos pacientes do período estão naquela situação.</li>
        <li>Dá para decidir pelo próprio painel, sem abrir paciente por paciente.</li>
      </Bloco>}

      <Bloco id="nv-previa" ver={<Link para="movimentacoes">Movimentações</Link>}
        antesAgora={<AntesAgora antes={'Desfazer o reenvio de um arquivo dizia "Lote desfeito" mesmo sem tirar ninguém.'}
                                agora="A confirmação mostra quem sai e quem fica, e oferece desfazer o envio de origem." />}
        palco={
          <div className="nv-m-card" style={{ boxShadow: 'var(--shadow-md)' }}>
            <strong>Desfazer este lote?</strong>
            <div className="nv-fraco" style={{ margin: '6px 0' }}>Este arquivo não criou nenhum paciente: desfazer só ele não tira ninguém do sistema. 101 já existiam antes.</div>
            <div className="nv-aviso">É o mesmo arquivo do envio de 11/11 13:53, que criou 101 pacientes.</div>
            <div className="nv-m-row" style={{ justifyContent: 'flex-end', marginTop: 10, flexWrap: 'wrap' }}>
              <span className="nv-btn">Manter</span><span className="nv-btn">Só este</span>
              <span className="nv-btn per">Desfazer os dois (101)</span>
            </div>
          </div>
        }>
        <li>Antes de desfazer, a confirmação diz <strong>quantos pacientes saem e quantos ficam</strong> (os que já existiam antes do envio).</li>
        <li>Se é o <strong>reenvio do mesmo arquivo</strong>, ela aponta o envio de origem e oferece <strong>Desfazer os dois</strong>.</li>
        <li>Quando ninguém sai, a tela diz <strong>Nenhum paciente removido</strong>.</li>
      </Bloco>

      <Bloco id="nv-analista" ver={<Link para="movimentacoes">Movimentações</Link>}
        palco={
          <div className="nv-m-card" style={{ padding: 0 }}>
            <div className="nv-linha">
              <span>Censo processado · 101 pacientes<br /><span className="nv-fraco">Santa Tereza · 13:53</span></span>
              <span className="nv-btn">Desfazer lote</span>
            </div>
            <div className="nv-linha">
              <span>Censo processado · 22 pacientes<br /><span className="nv-fraco">Vila Nova Star · 11:08</span></span>
              <span className="badge">Lote desfeito</span>
            </div>
          </div>
        }>
        <li>O <strong>analista interno</strong> passa a desfazer envios de censo em Movimentações, com a mesma confirmação com prévia.</li>
        <li>Os envios feitos pela administração continuam fora da visão dele.</li>
      </Bloco>
    </>
  )
}
