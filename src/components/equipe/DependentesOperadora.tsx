// O que a exclusao de uma operadora leva junto, para ler ANTES de confirmar
// (04/11/2026): de qual hospital e de qual arquivo vieram os pacientes, quem sao
// eles e o que acontece com cada hospital. Os pacientes so sao buscados ao abrir o
// hospital: a contagem e leve e a lista, com nomes, vem de uma operadora inteira.
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dataBR } from '../../lib/datas'
import { queryKeys } from '../../lib/queryKeys'
import { identificacaoPaciente } from '../../lib/texto'
import { pacientesDaOperadora } from '../../services/configuracoes.service'
import type { DependenteHospital, DependentesOperadora } from '../../types/api'
import { LoadingState } from '../ui'

const SITUACAO: Record<string, string> = {
  INTERNADO: 'Internado',
  ALTA: 'Alta',
  ALTA_AUTO: 'Alta automática',
}

function qtd(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`
}

const IconSeta = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
)

function PacientesDoHospital({ operadoraKey, hospitalKey }: { operadoraKey: string; hospitalKey: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.pacientesDaOperadora(operadoraKey, hospitalKey),
    queryFn: () => pacientesDaOperadora(operadoraKey, hospitalKey),
  })
  if (isLoading) return <LoadingState label="Carregando pacientes…" />
  if (isError || !data) return <p className="malha-dep-nota">Não foi possível carregar os pacientes deste hospital.</p>
  return (
    <div className="malha-dep-tabela">
      <table>
        <thead>
          <tr>
            <th>Paciente</th><th>Atendimento</th><th>Convênio</th><th>Situação</th>
            <th>Entrada</th><th>Alta</th><th>Relatórios</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.id}>
              <td>{identificacaoPaciente(p)}</td>
              <td>{p.atendimento}</td>
              <td>{p.convenio || '—'}</td>
              <td>{SITUACAO[p.status ?? ''] ?? p.status}</td>
              <td>{dataBR(p.data_entrada) || '—'}</td>
              <td>{dataBR(p.data_alta) || '—'}</td>
              <td className={p.relatorios > 0 ? 'malha-dep-perde' : undefined}>{p.relatorios}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function destinoDoHospital(h: DependenteHospital): string {
  if (h.exclusivo) return 'Só atende esta operadora: o hospital é excluído.'
  if (h.vinculado) return 'Atende outras operadoras: fica no cadastro e só perde este vínculo.'
  return 'Não atende esta operadora no cadastro: saem só os pacientes dela.'
}

function LinhaHospital({ h, operadoraKey, aberto, onAlternar }: {
  h: DependenteHospital
  operadoraKey: string
  aberto: boolean
  onAlternar: () => void
}) {
  return (
    <div className="malha-dep-hosp">
      <button type="button" className={`malha-dep-cab${aberto ? ' aberto' : ''}`} onClick={onAlternar}
        disabled={h.pacientes === 0} aria-expanded={h.pacientes > 0 ? aberto : undefined}>
        {h.pacientes > 0 && IconSeta}
        <span className="malha-dep-nome">{h.nome}</span>
        <span className="malha-dep-qtd">
          {h.pacientes > 0 ? qtd(h.pacientes, 'paciente', 'pacientes') : 'sem pacientes'}
          {h.com_relatorio > 0 && (
            <span className="malha-dep-perde"> · {qtd(h.com_relatorio, 'com relatório', 'com relatório')}</span>
          )}
        </span>
      </button>
      <p className="malha-dep-nota">
        {destinoDoHospital(h)}
        {h.outros_pacientes > 0 && (
          <> {qtd(h.outros_pacientes, 'paciente de outra operadora passa', 'pacientes de outras operadoras passam')} para <strong>Sem hospital</strong>.</>
        )}
      </p>
      {h.censos.length > 0 && (
        <p className="malha-dep-nota">
          Trazidos por:{' '}
          {h.censos.map((c, i) => (
            <span key={c.id}>
              {i > 0 && '; '}
              <strong>{c.arquivo}</strong> ({dataBR(c.data)}, {qtd(c.pacientes, 'paciente', 'pacientes')})
            </span>
          ))}
        </p>
      )}
      {aberto && <PacientesDoHospital operadoraKey={operadoraKey} hospitalKey={h.key} />}
    </div>
  )
}

export default function DependentesOperadoraPainel({ operadora, dep }: {
  operadora: { key: string; nome: string }
  dep: DependentesOperadora
}) {
  // Um hospital aberto de cada vez: a lista de um deles pode ter centenas de linhas.
  const [aberto, setAberto] = useState<string | null>(null)
  const exclusivos = dep.hospitais.filter((h) => h.exclusivo).length
  const compartilhados = dep.hospitais.filter((h) => h.vinculado && !h.exclusivo).length
  return (
    <div className="malha-dep">
      <div className="malha-dep-alerta" role="alert">
        {dep.pacientes > 0 && (
          <p>
            <strong>{qtd(dep.pacientes, 'paciente é apagado', 'pacientes são apagados')} de vez</strong>, com
            eventos, CIDs e prorrogações. Não há como desfazer.{' '}
            {dep.relatorios > 0
              ? <strong>Sai junto: {qtd(dep.relatorios, 'relatório', 'relatórios')} de {qtd(dep.com_relatorio, 'paciente', 'pacientes')}.</strong>
              : 'Nenhum deles tem relatório.'}
          </p>
        )}
        {exclusivos > 0 && (
          <p><strong>{qtd(exclusivos, 'hospital é excluído', 'hospitais são excluídos')}</strong> por só atender {operadora.nome}.</p>
        )}
        {compartilhados > 0 && (
          <p>{qtd(compartilhados, 'hospital atende', 'hospitais atendem')} outras operadoras e só perde{compartilhados > 1 ? 'm' : ''} o vínculo.</p>
        )}
        {(dep.escala > 0 || dep.cobrancas > 0) && (
          <p>
            Também {dep.escala + dep.cobrancas > 1 ? 'saem' : 'sai'}{' '}
            {[
              dep.escala > 0 && qtd(dep.escala, 'vínculo de escala', 'vínculos de escala'),
              dep.cobrancas > 0 && qtd(dep.cobrancas, 'cobrança de censo', 'cobranças de censo'),
            ].filter(Boolean).join(' e ')}.
          </p>
        )}
        {dep.operacionais_so_nela > 0 && (
          <p>
            <strong>{qtd(dep.operacionais_so_nela, 'operacional responde', 'operacionais respondem')} só por ela</strong> e
            {dep.operacionais_so_nela > 1 ? ' passam' : ' passa'} a ver todas as operadoras. Ajuste esse acesso depois.
          </p>
        )}
        {dep.pacientes > 0 && (
          <p>Censo que ainda trouxer paciente deste convênio passa a registrá-lo na operadora escolhida no envio.</p>
        )}
      </div>
      <div className="malha-dep-lista">
        {dep.hospitais.map((h) => (
          <LinhaHospital key={h.key} h={h} operadoraKey={operadora.key} aberto={aberto === h.key}
            onAlternar={() => setAberto((a) => (a === h.key ? null : h.key))} />
        ))}
      </div>
    </div>
  )
}
