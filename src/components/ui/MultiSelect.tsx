import { useEffect, useId, useRef, useState } from 'react'
import { IconChevronDown, IconClose } from '../icons/Icons'

interface Option {
  value: string
  label: string
}

interface MultiSelectProps {
  label?: string
  error?: string
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export default function MultiSelect({
  label,
  error,
  options,
  value,
  onChange,
  placeholder = 'Choose from Drop-down',
  disabled = false,
  className = '',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const fieldId = useId()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const selectedOptions = options.filter((opt) => value.includes(opt.value))

  const toggleOption = (optionValue: string) => {
    if (disabled) return
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const removeOption = (optionValue: string) => {
    if (disabled) return
    onChange(value.filter((v) => v !== optionValue))
  }

  return (
    <div className={`ui-field ${className}`.trim()} ref={rootRef}>
      {label && (
        <label htmlFor={fieldId} id={`${fieldId}-label`}>
          {label}
        </label>
      )}
      <div className={`ui-multi-select${open ? ' open' : ''}${disabled ? ' disabled' : ''}`}>
        <div
          id={fieldId}
          role="combobox"
          tabIndex={disabled ? -1 : 0}
          className={`ui-multi-select-trigger${selectedOptions.length ? ' has-value' : ''}`}
          onClick={() => !disabled && setOpen((prev) => !prev)}
          onKeyDown={(e) => {
            if (disabled) return
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setOpen((prev) => !prev)
            }
            if (e.key === 'Escape') setOpen(false)
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={label ? `${fieldId}-label` : undefined}
          aria-disabled={disabled || undefined}
        >
          <div className="ui-multi-select-values">
            {selectedOptions.length === 0 ? (
              <span className="ui-multi-select-placeholder">{placeholder}</span>
            ) : (
              selectedOptions.map((opt) => (
                <span key={opt.value} className="ui-multi-select-chip">
                  {opt.label}
                  <button
                    type="button"
                    className="ui-multi-select-chip-remove"
                    aria-label={`Remove ${opt.label}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      removeOption(opt.value)
                    }}
                  >
                    <IconClose />
                  </button>
                </span>
              ))
            )}
          </div>
          <span className="ui-select-chevron" aria-hidden>
            <IconChevronDown />
          </span>
        </div>

        {open && !disabled ? (
          <div className="ui-multi-select-menu" role="listbox" aria-multiselectable>
            {options.length === 0 ? (
              <div className="ui-multi-select-empty">No options available</div>
            ) : (
              options.map((opt) => {
                const selected = value.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`ui-multi-select-option${selected ? ' selected' : ''}`}
                    onClick={() => toggleOption(opt.value)}
                  >
                    <span className={`ui-multi-select-check${selected ? ' checked' : ''}`} />
                    {opt.label}
                  </button>
                )
              })
            )}
          </div>
        ) : null}
      </div>
      {error && <span className="ui-field-error">{error}</span>}
    </div>
  )
}
