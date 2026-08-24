interface NumberStepperProps {
  label: string
  value: number
  onChange: (value: number) => void
  step?: number
  format?: (value: number) => string
  className?: string
  disabled?: boolean
}

function ChevronUp() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function NumberStepper({
  label,
  value,
  onChange,
  step = 1,
  format = (v) => (v > 0 ? `+${v}` : `${v}`),
  className = '',
  disabled = false,
}: NumberStepperProps) {
  return (
    <div className={`ui-stepper ${className}`.trim()}>
      <label>{label}</label>
      <div className={`ui-stepper-control${disabled ? ' is-disabled' : ''}`}>
        <input type="text" readOnly value={format(value)} className="ui-input" disabled={disabled} />
        <div className="ui-stepper-btns">
          <button
            type="button"
            aria-label="Increase"
            disabled={disabled}
            onClick={() => onChange(value + step)}
          >
            <ChevronUp />
          </button>
          <button
            type="button"
            aria-label="Decrease"
            disabled={disabled}
            onClick={() => onChange(value - step)}
          >
            <ChevronDown />
          </button>
        </div>
      </div>
    </div>
  )
}
