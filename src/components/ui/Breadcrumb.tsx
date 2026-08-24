import { Link } from 'react-router-dom'

interface Crumb {
  label: string
  to?: string
}

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="ui-breadcrumb" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="ui-breadcrumb-item">
          {index > 0 && <span className="ui-breadcrumb-sep">/</span>}
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
        </span>
      ))}
    </nav>
  )
}
