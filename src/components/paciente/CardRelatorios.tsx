// Card "Relatórios" da ficha: lista dos relatórios e o "Registrar", que abre a
// modal do relatório completo (08/10/2026; antes era um formulário inline). Só
// quem pode registrar (técnico, administrativo e admin) vê o botão; o relatório
// do administrativo vai para aprovação do técnico. Os demais veem o card
// somente-leitura.
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AutorChip, roleVisual } from '../StatusBadge'
import { LoadingState } from '../ui'
import { dataBR, dataHora, hojeISO, paraISO } from '../../lib/datas'
import { queryKeys } from '../../lib/queryKeys'
import { acomodacoesDoCenso, ultimaClassificacao } from '../../lib/relatorioDetalhes'
import type { InternacaoDados, RelatorioItem, TimelineEvento } from '../../types/api'
import { ModalRelatorio } from './relatorio/ModalRelatorio'
import { ResumoDetalhes } from './relatorio/ResumoDetalhes'
import { ResumoFolhaRosa } from './SecaoFolhaRosa'
import { ResumoProrrogacao } from './SecaoProrrogacao'
import { useFormRelatorio, type ContextoFolhaRosa, type ContextoProrrogacao } from './useFormRelatorio'

// Situação na aprovação do técnico. Aprovado não leva etiqueta: é o normal.
function EtiquetaAprovacao({ r }: { r: RelatorioItem }) {
  if (r.aprovacao === 'pendente') return <span className="badge info">Aguardando aprovação</span>
  if (r.aprovacao === 'devolvido') return <span className="badge danger">Devolvido</span>
  return null
}

// Um CID do relatório, com o rótulo do papel dele (principal ou secundário).
function ChipCid({ c, rotulo }: { c: { codigo: string; descricao?: string | null }; rotulo?: string }) {
  return (
    <span
      className="badge muted"
      style={{ textTransform: 'none', letterSpacing: 0, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      title={c.descricao ? `${c.codigo} ${c.descricao}` : c.codigo}
    >
      {rotulo && <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{rotulo}: </span>}
      <b className="mono">{c.codigo}</b>{c.descricao ? ` ${c.descricao}` : ''}
    </span>
  )
}

// Um relatório: quando/quem registrou e o resumo do que foi preenchido, com a
// borda na cor do papel de quem registrou. O texto do relatório fica só na
// ficha (pedido de 08/10/2026), aberta pelo clique.
function RelatorioCard({ r, onAbrir }: { r: RelatorioItem; onAbrir?: () => void }) {
  const cids = r.cids ?? []
  const principal = cids.find((c) => c.codigo === r.detalhes?.cid_principal)
  const secundarios = cids.filter((c) => c !== principal)
  return (
    <div
      role={onAbrir ? 'button' : undefined}
      tabIndex={onAbrir ? 0 : undefined}
      title={onAbrir ? 'Abrir o relatório' : undefined}
      onClick={onAbrir}
      onKeyDown={onAbrir ? (e) => { if (e.key === 'Enter') onAbrir() } : undefined}
      style={{
        cursor: onAbrir ? 'pointer' : undefined,
        border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px',
        borderLeft: `3px solid ${roleVisual(r.autor_role).color}`, background: 'var(--surface)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--t-sm)', fontWeight: 600, color: 'var(--ink)' }}>
          {dataHora(r.criado_em) || dataBR(r.data_visita) || '—'}
        </span>
        {r.autor && <AutorChip role={r.autor_role} autor={r.autor} />}
        <EtiquetaAprovacao r={r} />
      </div>
      {r.aprovacao === 'devolvido' && r.devolucao_motivo && (
        <div style={{ fontSize: 'var(--t-sm)', color: 'var(--danger)', marginTop: 4 }}>
          Motivo: {r.devolucao_motivo}
        </div>
      )}
      {r.data_visita && (
        <div style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)', marginTop: 2 }}>
          Visita: {dataBR(r.data_visita)}{r.medico ? ` · ${r.medico}` : ''}
        </div>
      )}
      {/* Principal numa linha e os secundários na de baixo. Relatório sem
          principal marcado mostra os CIDs sem rótulo, como antes. */}
      {principal && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          <ChipCid c={principal} rotulo="Principal" />
        </div>
      )}
      {secundarios.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: principal ? 4 : 6 }}>
          {secundarios.map((c) => (
            <ChipCid key={c.codigo} c={c} rotulo={principal ? 'Secundário' : undefined} />
          ))}
        </div>
      )}
      {r.detalhes && <ResumoDetalhes d={r.detalhes} />}
      {r.prorrogacao && <ResumoProrrogacao p={r.prorrogacao} />}
      {r.folha_rosa && <ResumoFolhaRosa f={r.folha_rosa} />}
    </div>
  )
}

export function CardRelatorios({
  internacaoId, paciente, relatorios, carregando, erro, podeRegistrar, medicos, enfermeiros,
  onRegistrado, onAviso, onAbrirRelatorio, eventos, prorrogacao, folhaRosa,
}: {
  internacaoId: number
  /** Cabeçalho da modal, botão de alta e acomodação sugerida. */
  paciente: InternacaoDados
  relatorios: RelatorioItem[] | undefined
  carregando: boolean
  erro: boolean
  podeRegistrar: boolean
  medicos: string[]
  enfermeiros: string[]
  onRegistrado: (pendente: boolean) => void
  /** Mensagem da ficha (toast): a alta dada pelo botão da modal. */
  onAviso: (msg: string) => void
  /** Clique num relatório da lista: abre a ficha dele. */
  onAbrirRelatorio?: (relatorioId: number) => void
  /** Eventos da timeline: as mudanças de acomodação do censo montam as
   *  acomodações utilizadas da modal. */
  eventos?: TimelineEvento[]
  /** Prorrogação vigente do paciente: sugere o 1º período do novo pedido. */
  prorrogacao: ContextoProrrogacao
  /** Onde o paciente está: sugere a acomodação "de" da folha rosa. */
  folhaRosa: ContextoFolhaRosa
}) {
  const [registrando, setRegistrando] = useState(false)
  const form = useFormRelatorio(internacaoId, {
    dataInicial: hojeISO,
    prorrogacao,
    folhaRosa,
    completo: {
      ultimo: ultimaClassificacao(relatorios),
      dataEntrada: paraISO(paciente.data_entrada),
      censo: acomodacoesDoCenso(eventos, paciente.data_entrada, paciente.tipo_leito),
    },
    onRegistrado: (pendente) => { setRegistrando(false); onRegistrado(pendente) },
  })

  const qc = useQueryClient()
  function abrir() {
    form.limpar()
    setRegistrando(true)
    // Médicos e enfermeiros recém-cadastrados (em outra aba, p. ex.) entram na
    // lista sem atualizar a página: a ficha não recarrega a equipe sozinha.
    qc.invalidateQueries({ queryKey: queryKeys.equipe() })
  }

  return (
    <div className="card" style={{ flexShrink: 0 }}>
      <div className="card-header">
        <div className="card-title">Relatórios</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge muted">{relatorios?.length ?? 0}</span>
          {podeRegistrar && (
            <button className="btn btn-primary btn-sm" style={{ gap: 6 }} onClick={abrir}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
              Registrar
            </button>
          )}
        </div>
      </div>
      <div className="card-body">
        {podeRegistrar && registrando && (
          <ModalRelatorio
            form={form}
            paciente={paciente}
            medicos={medicos}
            enfermeiros={enfermeiros}
            onAviso={onAviso}
            onFechar={() => setRegistrando(false)}
          />
        )}
        {carregando && <LoadingState label="Carregando relatórios…" size={22} style={{ padding: '24px 8px' }} />}
        {erro && (
          <div className="t-muted" style={{ fontSize: 'var(--t-sm)' }}>Não foi possível carregar os relatórios.</div>
        )}
        {relatorios && relatorios.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--muted-2)' }}>
            <div style={{ fontWeight: 600, color: 'var(--muted)' }}>Nenhum relatório</div>
            <div style={{ fontSize: 'var(--t-sm)', marginTop: 4 }}>
              {podeRegistrar ? 'Use “Registrar” para adicionar o primeiro.' : 'Nenhum registro ainda.'}
            </div>
          </div>
        )}
        {relatorios && relatorios.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {relatorios.map((r) => (
              <RelatorioCard key={r.id} r={r}
                             onAbrir={onAbrirRelatorio ? () => onAbrirRelatorio(r.id) : undefined} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
