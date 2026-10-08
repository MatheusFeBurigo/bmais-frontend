// O relatório completo gravado (0054), em linhas curtas: classificação da
// internação, acomodações utilizadas e uma linha por bloco marcado. Aparece no
// card Relatórios da ficha e no card de aprovação do técnico, como
// `ResumoProrrogacao`.
import { dataBR } from '../../../lib/datas'
import { CARATER, TIPOS_ALTO_CUSTO, TIPOS_INTERNACAO, rotulo } from '../../../lib/relatorioDetalhes'
import type { DetalhesRelatorio, ProcedimentoRelatorio } from '../../../types/api'

const curta = (iso?: string | null) => dataBR(iso).slice(0, 5)

const periodo = (ini?: string | null, fim?: string | null) =>
  ini ? (fim ? ` (${curta(ini)} a ${curta(fim)})` : ` (desde ${curta(ini)})`) : ''

// Até 3 procedimentos por extenso; o resto vira "e mais N".
function procedimentos(ps: ProcedimentoRelatorio[]): string {
  const txt = ps.slice(0, 3).map((p) => `${p.codigo} ${p.nome}${p.qtde > 1 ? ` (${p.qtde}x)` : ''}`)
  return ps.length > 3 ? `${txt.join('; ')} e mais ${ps.length - 3}` : txt.join('; ')
}

export function ResumoDetalhes({ d }: { d: DetalhesRelatorio }) {
  const internacao = [rotulo(CARATER, d.carater), rotulo(TIPOS_INTERNACAO, d.tipo_internacao)]
    .filter(Boolean).join(' · ')
  const linhas: [string, string][] = []
  if (internacao) linhas.push(['Internação', internacao])
  if (d.acomodacoes?.length) {
    linhas.push(['Acomodações', d.acomodacoes.map((a) =>
      `${a.acomodacao} ${a.data_saida ? `${curta(a.data_entrada)} a ${curta(a.data_saida)}` : `desde ${curta(a.data_entrada)}`}`,
    ).join(' · ')])
  }
  if (d.enfermeiro) linhas.push(['Enfermeiro auditor', d.enfermeiro])
  if (d.procedimentos?.length) linhas.push(['Procedimentos', procedimentos(d.procedimentos)])
  if (d.alto_custo?.length) {
    linhas.push(['Alto custo', d.alto_custo.map((a) => {
      const extra = [a.medicacao, a.dose].filter(Boolean).join(', ')
      return `${rotulo(TIPOS_ALTO_CUSTO, a.tipo)}${extra ? ` (${extra})` : ''}${periodo(a.data_inicio, a.data_fim)}`
    }).join('; ')])
  }
  if (d.evento_adverso) {
    linhas.push([`Evento adverso em ${curta(d.evento_adverso.data)}`, d.evento_adverso.descricao])
  }
  if (d.glosas?.length) {
    linhas.push(['Glosa', d.glosas.map((g) =>
      `${g.diarias} ${g.diarias === 1 ? 'diária' : 'diárias'} de ${g.acomodacao}${periodo(g.data_inicio, g.data_fim)}`,
    ).join('; ')])
  }
  if (d.medicacoes_negadas?.length) {
    linhas.push(['Medicação negada', d.medicacoes_negadas.map((m) => {
      const qtde = [m.qtde, m.unidade].filter(Boolean).join(' ')
      return `${m.nome}${qtde ? ` (${qtde})` : ''}${periodo(m.data_inicio, m.data_fim)}`
    }).join('; ')])
  }
  if (d.procedimentos_negados?.length) {
    linhas.push(['Procedimento negado', procedimentos(d.procedimentos_negados)])
  }
  if (d.trocas_procedimento?.length) {
    linhas.push(['Troca de procedimento', d.trocas_procedimento.map((t) =>
      `${t.codigo_de} ${t.nome_de} para ${t.codigo_para} ${t.nome_para}${t.data ? ` em ${curta(t.data)}` : ''}`,
    ).join('; ')])
  }
  if (!linhas.length) return null
  return (
    <div style={{
      marginTop: 6, padding: '6px 10px', borderRadius: 8, background: 'var(--surface-2)',
      border: '1px solid var(--border)', fontSize: 'var(--t-sm)', color: 'var(--ink-2)',
      display: 'grid', gap: 2, overflowWrap: 'anywhere',
    }}>
      {linhas.map(([rot, txt]) => (
        <span key={rot}><b style={{ color: 'var(--ink)' }}>{rot}:</b> {txt}</span>
      ))}
    </div>
  )
}
