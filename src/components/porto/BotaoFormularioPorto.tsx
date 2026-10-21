// Atalho para o formulário de prorrogação da Porto (pages/FormularioPorto), no
// painel e na ficha do paciente. Só aparece para paciente da Porto: o
// formulário é dela, e nas outras operadoras o botão só confundiria.
import { useNavigate } from 'react-router-dom'
import type { InternacaoDados } from '../../types/api'
import { ehPorto } from './folhaPorto.model'

export function BotaoFormularioPorto({ d }: { d: InternacaoDados | undefined }) {
  const navigate = useNavigate()
  if (!d || !ehPorto(d)) return null
  return (
    <button
      className="btn btn-outline btn-sm"
      style={{ flexShrink: 0, gap: 6 }}
      onClick={() => navigate(`/paciente/${d.id}/porto`)}
      title="Gerar o formulário de solicitação de prorrogação da Porto"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></svg>
      Formulário Porto
    </button>
  )
}
