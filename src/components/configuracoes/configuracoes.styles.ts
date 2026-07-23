// Constantes e CSS local da tela Configurações. Extraído de pages/Configuracoes.tsx.

export const SERVICO_LABEL: Record<string, string> = {
  P: 'Análise de Conta', V: 'Auditoria Concorrente', AMB: 'Ambulatório', PS: 'Pronto Socorro',
}
export const SERVICOS = ['P', 'V', 'AMB', 'PS']

export const localStyles = `
.cfg-num-wrap{display:flex;align-items:stretch;border:1px solid var(--border-strong);border-radius:8px;overflow:hidden;background:var(--surface)}
.cfg-num-field{border:none;outline:none;padding:7px 10px;font-family:var(--font-mono);font-size:18px;font-weight:600;color:var(--ink);width:72px;text-align:center;background:transparent}
.cfg-num-suffix{background:var(--surface-3);border-left:1px solid var(--border);padding:7px 10px;font-size:var(--t-sm);color:var(--muted);display:flex;align-items:center}
.config-group{background:var(--surface-3);border:1px solid var(--border);border-radius:var(--r-md);padding:16px 18px;display:flex;flex-direction:column;gap:14px;margin-bottom:12px}
.config-group-title{font-size:var(--t-md);font-weight:600;color:var(--ink);margin-bottom:2px}
.config-field label{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:600;color:var(--muted);margin-bottom:5px}
.config-hint{font-size:var(--t-xs);color:var(--muted-2);font-style:italic;margin-top:4px}
.resp-chip{display:inline-flex;align-items:center;gap:7px;padding:4px 10px 4px 6px;background:var(--surface);border:1px solid var(--border);border-radius:99px;font-size:var(--t-sm);font-weight:500}
.resp-avatar{width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--primary));color:#fff;font-size:10px;font-weight:700;display:grid;place-items:center;flex-shrink:0}
.toggle-wrap{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--success-bg);border:1px solid rgba(14,122,83,.15);border-radius:var(--r-md)}
.toggle{width:36px;height:20px;border-radius:99px;background:var(--muted-3);position:relative;cursor:pointer;transition:background .15s;flex-shrink:0;border:none}
.toggle.on{background:var(--success)}
.toggle-knob{width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:2px;left:2px;transition:transform .15s}
.toggle.on .toggle-knob{transform:translateX(16px)}
.stat-mini{background:var(--surface-3);border:1px solid var(--border);border-radius:var(--r-md);padding:10px 14px;text-align:center}
.stat-mini-val{font-family:var(--font-mono);font-size:22px;font-weight:700;color:var(--ink);line-height:1}
.stat-mini-label{font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:600;color:var(--muted);margin-top:3px}

/* ── Accordion de operadoras (visão geral) ── */
.op-acc{display:flex;flex-direction:column;gap:8px}
.op-acc-item{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);overflow:hidden;transition:border-color .12s,box-shadow .12s}
.op-acc-item.open{border-color:var(--border-strong);box-shadow:var(--shadow-sm)}
.op-acc-item.alert{border-color:var(--danger)}
.op-acc-head{display:flex;align-items:center;gap:14px;padding:12px 16px;cursor:pointer;user-select:none;width:100%;background:transparent;border:none;text-align:left}
.op-acc-head:hover{background:var(--surface-3)}
.op-acc-chevron{flex-shrink:0;color:var(--muted-2);transition:transform .2s cubic-bezier(.2,.7,.2,1)}
.op-acc-item.open .op-acc-chevron{transform:rotate(90deg);color:var(--primary-3)}
.op-acc-name{font-weight:600;font-size:var(--t-md);color:var(--ink);line-height:1.2}
.op-acc-resp{font-size:var(--t-sm);color:var(--muted);margin-top:1px}
.op-acc-body{padding:0 16px 16px 46px;display:flex;flex-direction:column;gap:14px;animation:op-acc-in .22s cubic-bezier(.2,.7,.2,1)}
.op-acc-rules{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:var(--t-sm);color:var(--muted)}
.op-acc-actions{display:flex;gap:8px;flex-wrap:wrap}
@keyframes op-acc-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
@media (max-width:640px){.op-acc-body{padding-left:16px}}
`
