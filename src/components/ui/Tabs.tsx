interface TabItem {
  value: string
  label: string
}

interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
}

export default function Tabs({ items, value, onChange }: TabsProps) {
  return (
    <div className="ui-tabs" role="tablist">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={value === item.value}
          className={`ui-tab${value === item.value ? ' active' : ''}`}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
