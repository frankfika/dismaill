import * as React from 'react'
import { cn } from '../../lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  ariaLabelledBy?: string
}

const Dialog: React.FC<DialogProps> = ({ open, onClose, children, ariaLabelledBy }) => {
  const contentRef = React.useRef<HTMLDivElement>(null)
  const previousActiveElement = React.useRef<Element | null>(null)

  React.useEffect(() => {
    if (!open) return

    previousActiveElement.current = document.activeElement
    // Focus the dialog container so Escape is captured.
    contentRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Restore focus when closing.
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus()
      }
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        tabIndex={-1}
        className="relative z-50 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-sm outline-none"
      >
        {children}
      </div>
    </div>
  )
}

const DialogHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return <div className={cn('mb-4', className)}>{children}</div>
}

const DialogTitle: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({
  children,
  className,
  id,
}) => {
  return (
    <h2 id={id} className={cn('text-lg font-semibold text-foreground', className)}>
      {children}
    </h2>
  )
}

const DialogDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>
}

const DialogFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return <div className={cn('mt-4 flex justify-end gap-2', className)}>{children}</div>
}

export { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter }
