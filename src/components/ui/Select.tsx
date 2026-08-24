import type { SelectHTMLAttributes } from 'react'
import { IconChevronDown } from '../icons/Icons'

interface Option {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Option[]
  placeholder?: string
}

export default function Select({
  label,
  error,
  id,
  options,
  placeholder = 'Choose from Drop-down',
  className = '',
  ...props
}: SelectProps) {
  const selectId = id || props.name
  const hasValue = Boolean(props.value)

  return (
    <div className={`ui-field ${className}`.trim()}>
      {label && <label htmlFor={selectId}>{label}</label>}
      <div className={`ui-select-wrap${hasValue ? ' has-value' : ''}`}>
        <select id={selectId} className="ui-input ui-select" {...props}>
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="ui-select-chevron" aria-hidden>
          <IconChevronDown />
        </span>
      </div>
      {error && <span className="ui-field-error">{error}</span>}
    </div>
  )
}
