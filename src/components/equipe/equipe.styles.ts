// Constantes, labels e CSS local da tela Equipe. Extraído de pages/Equipe.tsx.
import type { Profissional, ProfTipo } from '../../types/api'

export const TIPO_LABEL: Record<ProfTipo, string> = {
  E: 'Enfermeiro(a)', M: 'Médico(a) Auditor(a)', O: 'Operador(a) Interno(a)',
}
export const SERVICO_LABEL: Record<string, string> = {
  P: 'Análise de Conta', V: 'Aud. Concorrente', AMB: 'Ambulatório', PS: 'Pronto Socorro',
}
export const SERVICOS = [
  { key: 'P', label: 'P — Análise de Conta' },
  { key: 'V', label: 'V — Auditoria Concorrente' },
  { key: 'AMB', label: 'AMB — Ambulatório' },
  { key: 'PS', label: 'PS — Pronto Socorro' },
]

export function isAtivo(p: Profissional): boolean {
  return Boolean(p.ativo)
}

export const localStyles = `
.prof-item{display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);cursor:pointer;transition:border-color .12s,background .12s;margin-bottom:6px}
.prof-item:hover{border-color:var(--primary-3);background:var(--primary-soft)}
.prof-item.active{border-color:var(--primary);background:var(--primary-soft)}
.prof-item.inativo{opacity:.55}
.prof-item.inativo:hover{opacity:.75}
.prof-avatar{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;font-weight:700;font-size:13px;color:#fff;flex-shrink:0;font-family:var(--font-mono)}
.prof-avatar.E{background:linear-gradient(135deg,#0E7A53,#065A3D)}
.prof-avatar.M{background:linear-gradient(135deg,#1F6FBE,#0F4D9E)}
.prof-avatar.O{background:linear-gradient(135deg,#D9690C,#A84F09)}
.detail-panel{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:24px;position:sticky;top:80px;max-height:calc(100vh - 110px);overflow-y:auto}
.escala-item{display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--surface-3);border:1px solid var(--border);border-radius:var(--r-sm);margin-bottom:6px}
.servico-badge{font-family:var(--font-mono);font-size:10px;padding:2px 7px;border-radius:4px;font-weight:700;background:var(--info-bg);color:var(--info);border:1px solid rgba(30,120,200,.2)}
.tab-section{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}
.tab-sec-btn{padding:5px 14px;border-radius:99px;border:1px solid var(--border);background:var(--surface);font-size:var(--t-sm);font-weight:500;color:var(--ink-2);cursor:pointer;transition:background .12s,border-color .12s}
.tab-sec-btn.active{background:var(--ink);color:#fff;border-color:var(--ink)}
.edit-field label{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:600;color:var(--muted);margin-bottom:4px}
.inativos-toggle{font-size:var(--t-sm);color:var(--muted);cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:var(--r-sm);background:var(--surface-3);border:1px solid var(--border);margin-bottom:10px;user-select:none}
.inativos-toggle:hover{border-color:var(--border-strong)}
.escala-remove{background:none;border:none;cursor:pointer;color:var(--muted-2);padding:2px 4px;border-radius:4px;line-height:1;flex-shrink:0;display:grid;place-items:center;transition:color .12s}
.escala-remove:hover{color:var(--danger)}
.prof-lista-scroll{max-height:372px;overflow-y:auto;scrollbar-width:thin}
`
