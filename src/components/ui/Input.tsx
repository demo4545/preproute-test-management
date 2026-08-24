import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id || props.name
  return (
    <div className={`ui-field ${className}`.trim()}>
      {label && <label htmlFor={inputId}>{label}</label>}
      <input id={inputId} className="ui-input" {...props} />
      {error && <span className="ui-field-error">{error}</span>}
    </div>
  )
}
