// Chip que evidencia o dia selecionado (ícone de calendário + data em destaque).
// Com `onRemove`, ganha um × interno para remover o filtro de dia direto no chip.
// Extraído de pages/Gestor.tsx.
export default function DiaChip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className={`dia-chip${onRemove ? ' com-remover' : ''}`}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
      {label}
      {onRemove && (
        <button type="button" className="dia-chip-x" onClick={onRemove} aria-label="Remover filtro de dia">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      )}
    </span>
  )
}
