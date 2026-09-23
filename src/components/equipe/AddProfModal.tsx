// Modal: adicionar novo profissional. Extraído de pages/Equipe.tsx.
//
// Os hospitais sob responsabilidade dele são escolhidos AQUI, no cadastro.
// Antes a escala só podia ser montada depois, na ficha, o que obrigava quem
// cadastra um auditor a fazer dois gestos para uma coisa que ele já sabe de
// cara: "este médico cuida destes hospitais". A modal acumula as escolhas
// numa lista e manda tudo num pedido só; o backend grava o profissional e os
// hospitais com o id recém-criado.
//
// A escolha é por CIDADE (ver SeletorEscala): um médico auditor costuma cobrir
// vários hospitais de uma cidade, em mais de uma operadora, e o formulário
// antigo pedia um por vez tendo a operadora como primeiro passo.
import { useMemo, useState } from 'react'
import type { ProfissionalCriado, ProfTipo } from '../../types/api'
import { Modal } from '../ui'
import { criarProfissional } from '../../services/equipe.service'
import { useTodosHospitais } from '../../hooks/useEquipe'
import type { EntradaEscala } from '../../services/escala.service'
import { SERVICO_LABEL } from './equipe.styles'
import SeletorEscala from './SeletorEscala'
import { IconX } from './icons'

const labelStyle = { display: 'block', marginBottom: 5, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 } as const

// Mensagem de conclusão: diz o que aconteceu com o profissional E com a
// escala, porque os dois podem ter destinos diferentes (não há transação: o
// cadastro fica gravado mesmo que um hospital não entre).
function mensagemDeConclusao(r: ProfissionalCriado, pedidos: number): string {
  const base = r.existing ? 'Profissional já estava cadastrado' : '✓ Profissional adicionado'
  if (pedidos === 0) return base
  const ok = r.escala_adicionada ?? 0
  const falhas = r.escala_falhas?.length ?? 0
  const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`
  if (falhas === 0) return `${base} com ${plural(ok, 'hospital', 'hospitais')} na escala`
  return `${base}, mas ${plural(falhas, 'hospital não entrou', 'hospitais não entraram')} na escala. Confira na ficha dele.`
}

export default function AddProfModal({ opsLista, onClose, onDone, onError }: {
  opsLista: Array<{ key: string; nome: string }>
  onClose: () => void
  onDone: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [tipo, setTipo] = useState<ProfTipo>('E')
  const [nome, setNome] = useState('')
  const [escala, setEscala] = useState<EntradaEscala[]>([])
  const [saving, setSaving] = useState(false)

  // Todos os hospitais de uma vez: a escolha é por cidade, não por operadora,
  // então não há um passo anterior que estreite a lista.
  const { data: hospitais, isLoading: carregandoHospitais } = useTodosHospitais()

  const nomeDaOperadora = (key: string) => opsLista.find((o) => o.key === key)?.nome ?? key

  // O que já está na lista sai do seletor: marcado e explicado, em vez de
  // aceitar de novo e recusar com um erro depois.
  const jaNaLista = useMemo(() => escala.map((e) => e.hospital_key), [escala])

  function incluirNaLista(entradas: EntradaEscala[]) {
    setEscala((prev) => {
      const vistos = new Set(prev.map((x) => `${x.hospital_key}|${x.servico}`))
      const novas = entradas.filter((e) => !vistos.has(`${e.hospital_key}|${e.servico}`))
      return [...prev, ...novas]
    })
  }

  function tirarDaLista(i: number) {
    setEscala((prev) => prev.filter((_, j) => j !== i))
  }

  async function adicionar() {
    const n = nome.trim()
    if (!n) { onError('Informe o nome do profissional'); return }
    setSaving(true)
    try {
      const r = await criarProfissional(n, tipo, escala)
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

        {/* Hospitais sob responsabilidade: o mesmo seletor da ficha, mas a
            escolha vai para uma lista local e só é gravada junto do cadastro. */}
        <div>
          <label className="uppercase t-muted" style={labelStyle}>
            Hospitais sob responsabilidade
            {escala.length > 0 && <span style={{ marginLeft: 6, color: 'var(--primary-3)' }}>{escala.length}</span>}
          </label>
          <div style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)', marginBottom: 8 }}>
            Opcional. Escolha a cidade e marque os hospitais que ficam com este profissional. Dá para ajustar depois na ficha.
          </div>
          <SeletorEscala
            hospitais={hospitais ?? []}
            opsLista={opsLista}
            jaNaEscala={jaNaLista}
            onAdicionar={incluirNaLista}
            loading={carregandoHospitais}
            rotuloBotao="Incluir na lista"
          />
          {escala.map((e, i) => (
            <div key={`${e.hospital_key}|${e.operadora_key}|${e.servico}`} className="escala-item">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="fw-6 truncate" style={{ fontSize: 'var(--t-sm)' }}>{e.hospital_nome}</div>
                <div style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)' }}>
                  {nomeDaOperadora(e.operadora_key)} · {SERVICO_LABEL[e.servico] || e.servico}
                </div>
              </div>
              <span className="servico-badge">{e.servico}</span>
              <button type="button" className="escala-remove" onClick={() => tirarDaLista(i)} title="Tirar da lista">{IconX}</button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
