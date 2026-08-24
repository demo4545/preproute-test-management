import type { ReactNode } from 'react'
import { IconClose } from '../icons/Icons'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'sm'
}

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  if (!open) return null

  return (
    <div className="ui-modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`ui-modal${size === 'sm' ? ' ui-modal-sm' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ui-modal-header">
          <h2>{title}</h2>
          <button type="button" className="ui-icon-btn" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>
        <div className="ui-modal-body">{children}</div>
        {footer && <div className="ui-modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
