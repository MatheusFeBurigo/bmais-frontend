// Card "Dados do Paciente": leitura e edição da ficha.
import type { CampoFicha as CampoIncompleto } from '../../lib/fichaIncompleta'
import { nomeProprio } from '../../lib/texto'
import type { InternacaoDados } from '../../types/api'
import { CampoFicha } from './CampoFicha'
import { LEITO_HOMECARE, LEITO_OPCOES, STATUS_OPCOES, rnLabel, textoDataAlta } from './paciente.model'
import type { EdicaoFicha } from './useEdicaoFicha'

export function CardDadosPaciente({ d, edicao, faltaCampo, podeHomecare }: {
  d: InternacaoDados
  edicao: EdicaoFicha
  faltaCampo: Set<CampoIncompleto>
  podeHomecare: boolean
}) {
  const { editando, rascunho, setCampo, salvando, erro } = edicao
  // Props comuns a todo campo editável.
  const ed = { edit: editando, rascunho, onChange: setCampo }
  // Quem não decide o homecare não vê a opção, e não mexe no leito de quem já está nele.
  const emHomecare = d.tipo_leito === LEITO_HOMECARE
  const leitoEditavel = podeHomecare || !emHomecare
  const leitoOpcoes = podeHomecare ? [...LEITO_OPCOES, LEITO_HOMECARE] : LEITO_OPCOES

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <div className="card-title">Dados do Paciente</div>
          <div className="card-sub">
            {d.status === 'INTERNADO' || !d.status ? 'Internação ativa' : d.status}
          </div>
        </div>
        {editando ? (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button className="btn btn-outline btn-sm" onClick={edicao.cancelar} disabled={salvando}>
              Cancelar
            </button>
            <button className="btn btn-primary btn-sm" onClick={edicao.salvar} disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        ) : (
          <button className="btn btn-outline btn-sm" style={{ flexShrink: 0, gap: 6 }} onClick={edicao.abrir}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            Editar
          </button>
        )}
      </div>
      <div className="card-body">
        {erro && (
          <div className="badge danger" style={{ padding: '8px 10px', textTransform: 'none', letterSpacing: 0, marginBottom: 12 }}>
            {erro}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          <CampoFicha label="Nome do segurado" valor={editando ? d.nome : nomeProprio(d.nome)} span={2} falta={faltaCampo.has('nome')} campo="nome" {...ed} />
          {/* Censos sem coluna de paciente identificam a internação pela senha
              de autorização: é o único identificador que esses pacientes têm,
              então ela precisa aparecer (e ser corrigível) na ficha. */}
          <CampoFicha label="Senha de autorização" valor={d.senha} mono campo="senha" {...ed} />
          <CampoFicha label="Status" valor={d.status || 'INTERNADO'} campo="status" opcoes={STATUS_OPCOES} {...ed} />
          <CampoFicha label="RN" valor={rnLabel(d)} />
          <CampoFicha label="Data de nascimento" valor={d.data_nascimento} mono />

          <CampoFicha label="Atendimento" valor={d.atendimento} mono falta={faltaCampo.has('atendimento')} campo="atendimento" {...ed} />
          {/* Ao lado do atendimento porque são o mesmo tipo de dado visto de
              dois lados: o número do paciente no HOSPITAL e o número dele na
              OPERADORA. É a carteirinha que se informa ao ligar para o convênio. */}
          <CampoFicha label="Carteirinha" valor={d.carteirinha} mono campo="carteirinha" {...ed} />
          {/* O convênio como o censo trouxe: é ele que diz a modalidade
              ("Bradesco Operadora de Planos"), que a operadora sozinha não diz.
              Só leitura aqui; a correção é na conferência do envio, onde o
              convênio é escolhido junto da operadora. */}
          <CampoFicha label="Operadora / convênio" valor={d.convenio} span={2} />
          <CampoFicha label="Tipo de leito" valor={d.tipo_leito} campo="tipo_leito" opcoes={leitoOpcoes} {...ed} edit={editando && leitoEditavel} />
          <CampoFicha label="Leito / código" valor={d.leito_codigo} falta={faltaCampo.has('leito_codigo')} campo="leito_codigo" {...ed} />
          <CampoFicha label="Data internação" valor={d.data_entrada} mono falta={faltaCampo.has('data_entrada')} campo="data_entrada" tipo="date" {...ed} />
          <CampoFicha label="Hora internação" valor={d.hora_entrada ? d.hora_entrada.slice(0, 5) : null} mono />

          <CampoFicha label="Data alta" valor={textoDataAlta(d)} />
          <CampoFicha label="Médico" valor={d.medico} campo="medico" {...ed} />
          <CampoFicha label="Especialidade" valor={d.especialidade} span={2} campo="especialidade" {...ed} />

          <CampoFicha label="Diagnóstico" valor={d.diagnostico} span={4} campo="diagnostico" {...ed} />
          <CampoFicha label="Observações" valor={d.obs} span={4} multiline campo="obs" {...ed} />
        </div>
      </div>
    </div>
  )
}
