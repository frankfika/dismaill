import * as React from 'react'
import { cn } from '../../lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({ open, onClose, children }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg">
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

const DialogTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return <h2 className={cn('text-lg font-semibold text-foreground', className)}>{children}</h2>
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
