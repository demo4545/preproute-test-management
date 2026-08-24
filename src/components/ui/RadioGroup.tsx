interface RadioOption {
  value: string
  label: string
}

interface RadioGroupProps {
  label?: string
  name: string
  value: string
  options: RadioOption[]
  onChange: (value: string) => void
}

export default function RadioGroup({ label, name, value, options, onChange }: RadioGroupProps) {
  return (
    <div className="ui-field">
      {label && <span className="ui-field-label">{label}</span>}
      <div className="ui-radio-group">
        {options.map((opt) => (
          <label key={opt.value} className="ui-radio">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <span className="ui-radio-mark" />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
