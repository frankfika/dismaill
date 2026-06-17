import * as React from 'react'

/**
 * Escape-to-close + focus management for inline modals that don't use the
 * <Dialog> component (e.g. settings sub-routes with custom layouts).
 * Pairs with `role="dialog"` + `aria-modal="true"` on the modal root.
 */
export function useDialogDismiss(
  onClose: () => void,
  active: boolean
): React.RefObject<HTMLDivElement> {
  const ref = React.useRef<HTMLDivElement>(null)
  const previousActiveElement = React.useRef<Element | null>(null)

  React.useEffect(() => {
    if (!active) return
    previousActiveElement.current = document.activeElement
    ref.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus()
      }
    }
  }, [active, onClose])

  return ref
}
