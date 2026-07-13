// Abas simples controladas. Espelha o padrão de tabs (tab-pills) do design system.
// Usado no Upload (Censos / Relatórios) e reaproveitável em outras telas.

export interface TabDef {
  key: string
  label: string
  count?: number
}

interface Props {
  tabs: TabDef[]
  active: string
  onChange: (key: string) => void
}

export default function Tabs({ tabs, active, onChange }: Props) {
  return (
    <div className="tab-pills">
      {tabs.map((t) => (
        <button
          key={t.key}
          className={`tab-pill${t.key === active ? ' active' : ''}`}
          onClick={() => onChange(t.key)}
          type="button"
        >
          {t.label}
          {t.count != null && (
            <span className={`tab-count${t.count === 0 ? ' zero' : ''}`}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}
