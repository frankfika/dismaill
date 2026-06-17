import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSignatures } from '../../../src/renderer/src/hooks/useSignatures'

/**
 * useSignatures Hook Tests
 * 测试签名管理 hook 的 CRUD 操作
 */

// Mock ipc
vi.mock('../../../src/renderer/src/lib/ipc', () => ({
  invoke: vi.fn().mockResolvedValue([]),
}))

import { invoke } from '../../../src/renderer/src/lib/ipc'

describe('useSignatures', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(invoke).mockResolvedValue([] as any)
  })

  describe('fetchSignatures', () => {
    it('无 accountId 时应设置空数组', async () => {
      const { result } = renderHook(() => useSignatures(undefined))

      await act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      expect(result.current.signatures).toHaveLength(0)
      expect(invoke).not.toHaveBeenCalledWith('signature:list', expect.anything())
    })

    it('有 accountId 时应调用 IPC', async () => {
      const mockSigs = [
        { id: 'sig-1', emailAccountId: 'acc-1', name: 'Work', contentHtml: '<p>John</p>', isDefault: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]
      vi.mocked(invoke).mockResolvedValueOnce(mockSigs as any)

      const { result } = renderHook(() => useSignatures('acc-1'))

      await act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      expect(invoke).toHaveBeenCalledWith('signature:list', { emailAccountId: 'acc-1' })
      expect(result.current.signatures).toEqual(mockSigs)
    })
  })

  describe('createSignature', () => {
    it('应调用 IPC 并更新本地状态', async () => {
      vi.mocked(invoke).mockResolvedValueOnce([] as any) // Initial fetch
      vi.mocked(invoke).mockResolvedValueOnce({ id: 'new-sig-id' } as any) // Create

      const { result } = renderHook(() => useSignatures('acc-1'))

      await act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      let newSig: any = null
      await act(async () => {
        newSig = await result.current.createSignature({
          accountId: 'acc-1',
          name: 'Work Sig',
          content: '<p>Regards, John</p>',
          isDefault: false,
        })
      })

      expect(invoke).toHaveBeenCalledWith('signature:create', expect.objectContaining({
        name: 'Work Sig',
        emailAccountId: 'acc-1',
      }))
      expect(newSig).not.toBeNull()
      expect(newSig.name).toBe('Work Sig')
      expect(result.current.signatures).toHaveLength(1)
    })

    it('设为默认时应取消其他签名的默认状态', async () => {
      const existingSig = {
        id: 'sig-1', emailAccountId: 'acc-1', name: 'Old', contentHtml: '<p>Old</p>',
        isDefault: true, createdAt: '2024-01-01', updatedAt: '2024-01-01',
      }
      vi.mocked(invoke).mockResolvedValueOnce([existingSig] as any) // Initial fetch
      vi.mocked(invoke).mockResolvedValueOnce({ id: 'sig-2' } as any) // Create

      const { result } = renderHook(() => useSignatures('acc-1'))

      await act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      await act(async () => {
        await result.current.createSignature({
          accountId: 'acc-1',
          name: 'New Default',
          content: '<p>New</p>',
          isDefault: true,
        })
      })

      // Old signature should no longer be default
      const oldSig = result.current.signatures.find(s => s.id === 'sig-1')
      expect(oldSig?.isDefault).toBe(false)

      // New signature should be default
      const newSig = result.current.signatures.find(s => s.id === 'sig-2')
      expect(newSig?.isDefault).toBe(true)
    })
  })

  describe('updateSignature', () => {
    it('应调用 IPC 并更新本地状态', async () => {
      const existingSig = {
        id: 'sig-1', emailAccountId: 'acc-1', name: 'Old Name', contentHtml: '<p>Old</p>',
        isDefault: false, createdAt: '2024-01-01', updatedAt: '2024-01-01',
      }
      vi.mocked(invoke).mockResolvedValueOnce([existingSig] as any) // Initial fetch
      vi.mocked(invoke).mockResolvedValueOnce(undefined as any) // Update

      const { result } = renderHook(() => useSignatures('acc-1'))

      await act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      let success: boolean = false
      await act(async () => {
        success = await result.current.updateSignature({ id: 'sig-1', name: 'New Name' })
      })

      expect(success).toBe(true)
      expect(invoke).toHaveBeenCalledWith('signature:update', expect.objectContaining({ id: 'sig-1', name: 'New Name' }))
      expect(result.current.signatures[0].name).toBe('New Name')
    })
  })

  describe('deleteSignature', () => {
    it('应调用 IPC 并从本地删除', async () => {
      const existingSig = {
        id: 'sig-1', emailAccountId: 'acc-1', name: 'Test', contentHtml: '<p>Test</p>',
        isDefault: false, createdAt: '2024-01-01', updatedAt: '2024-01-01',
      }
      vi.mocked(invoke).mockResolvedValueOnce([existingSig] as any) // Initial fetch
      vi.mocked(invoke).mockResolvedValueOnce(undefined as any) // Delete

      const { result } = renderHook(() => useSignatures('acc-1'))

      await act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      expect(result.current.signatures).toHaveLength(1)

      let success: boolean = false
      await act(async () => {
        success = await result.current.deleteSignature('sig-1')
      })

      expect(success).toBe(true)
      expect(invoke).toHaveBeenCalledWith('signature:delete', { id: 'sig-1' })
      expect(result.current.signatures).toHaveLength(0)
    })
  })

  describe('getDefaultSignature', () => {
    it('应返回默认签名', async () => {
      const sigs = [
        { id: 'sig-1', emailAccountId: 'acc-1', name: 'Sig1', contentHtml: '<p>1</p>', isDefault: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'sig-2', emailAccountId: 'acc-1', name: 'Sig2', contentHtml: '<p>2</p>', isDefault: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]
      vi.mocked(invoke).mockResolvedValueOnce(sigs as any)

      const { result } = renderHook(() => useSignatures('acc-1'))

      await act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      const defaultSig = result.current.getDefaultSignature()
      expect(defaultSig?.id).toBe('sig-2')
    })

    it('无默认签名时应返回第一个', async () => {
      const sigs = [
        { id: 'sig-1', emailAccountId: 'acc-1', name: 'Sig1', contentHtml: '<p>1</p>', isDefault: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]
      vi.mocked(invoke).mockResolvedValueOnce(sigs as any)

      const { result } = renderHook(() => useSignatures('acc-1'))

      await act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      const defaultSig = result.current.getDefaultSignature()
      expect(defaultSig?.id).toBe('sig-1')
    })

    it('无签名时应返回 null', async () => {
      vi.mocked(invoke).mockResolvedValueOnce([] as any)

      const { result } = renderHook(() => useSignatures('acc-1'))

      await act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      const defaultSig = result.current.getDefaultSignature()
      expect(defaultSig).toBeNull()
    })
  })
})
