import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'
type Size = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const sizeClass = size === 'lg' ? 'ui-btn-lg' : ''
  return (
    <button
      type={type}
      className={`ui-btn ui-btn-${variant} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}
