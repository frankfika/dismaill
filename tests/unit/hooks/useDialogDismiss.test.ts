/**
 * Unit Tests - useDialogDismiss
 */
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDialogDismiss } from '../../../src/renderer/src/hooks/useDialogDismiss'

describe('useDialogDismiss', () => {
  it('returns a ref pointing at a div', () => {
    const { result } = renderHook(() => useDialogDismiss(() => {}, true))
    expect(result.current).toEqual({ current: null })
  })

  it('does not bind listener when inactive', () => {
    const onClose = vi.fn()
    const addSpy = vi.spyOn(document, 'addEventListener')
    renderHook(() => useDialogDismiss(onClose, false))
    const keyHandler = addSpy.mock.calls.find(([type]) => type === 'keydown')
    expect(keyHandler).toBeUndefined()
    addSpy.mockRestore()
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    renderHook(() => useDialogDismiss(onClose, true))
    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    document.dispatchEvent(event)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ignores non-Escape keys', () => {
    const onClose = vi.fn()
    renderHook(() => useDialogDismiss(onClose, true))
    const event = new KeyboardEvent('keydown', { key: 'Enter' })
    document.dispatchEvent(event)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('removes the keydown listener on unmount', () => {
    const onClose = vi.fn()
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const { unmount } = renderHook(() => useDialogDismiss(onClose, true))
    unmount()
    const removed = removeSpy.mock.calls.find(([type]) => type === 'keydown')
    expect(removed).toBeDefined()
    removeSpy.mockRestore()
  })
})
