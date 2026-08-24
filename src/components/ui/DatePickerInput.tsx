import { useRef } from 'react'
import { IconCalendar } from '../icons/Icons'

interface DatePickerInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function DatePickerInput({
  value,
  onChange,
  placeholder = 'Select Date',
  className = '',
}: DatePickerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isEmpty = !value

  const openPicker = () => {
    const input = inputRef.current
    if (!input) return
    if (typeof input.showPicker === 'function') {
      input.showPicker()
    } else {
      input.focus()
      input.click()
    }
  }

  return (
    <div className={`input-with-icon${isEmpty ? ' is-empty' : ''} ${className}`.trim()}>
      <input
        ref={inputRef}
        type="date"
        className="ui-input date-input-custom"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
      {isEmpty ? (
        <span className="date-input-placeholder" aria-hidden>
          {placeholder}
        </span>
      ) : null}
      <button
        type="button"
        className="input-icon-btn"
        aria-label="Open date picker"
        onClick={openPicker}
      >
        <IconCalendar />
      </button>
    </div>
  )
}
