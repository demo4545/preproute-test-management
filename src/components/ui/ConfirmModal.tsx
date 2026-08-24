import type { ReactNode } from 'react'
import Modal from './Modal'
import Button from './Button'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: ReactNode
  onClose: () => void
  onConfirm: () => void | Promise<void>
  confirmLabel?: string
  cancelLabel?: string
  confirming?: boolean
  confirmVariant?: 'danger' | 'primary'
}

export default function ConfirmModal({
  open,
  title,
  message,
  onClose,
  onConfirm,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  confirming = false,
  confirmVariant = 'danger',
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      title={title}
      size="sm"
      onClose={confirming ? () => undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={confirming}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={confirming}>
            {confirming ? 'Please wait...' : confirmLabel}
          </Button>
        </>
      }
    >
      {typeof message === 'string' ? <p>{message}</p> : message}
    </Modal>
  )
}
