import type { ReactNode } from 'react'

type Tone = 'blue' | 'green' | 'teal' | 'yellow' | 'navy' | 'gray'

interface BadgeProps {
  children: ReactNode
  tone?: Tone
  className?: string
}

export default function Badge({ children, tone = 'blue', className = '' }: BadgeProps) {
  return <span className={`ui-badge ui-badge-${tone} ${className}`.trim()}>{children}</span>
}
