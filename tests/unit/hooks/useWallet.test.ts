import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWallet } from '../../../src/renderer/src/hooks/useWallet'
import { useAuthStore } from '../../../src/renderer/src/stores/auth.store'

vi.mock('../../../src/renderer/src/lib/ipc', () => ({
  invoke: vi.fn().mockResolvedValue({}),
  invokeWrapped: vi.fn().mockResolvedValue({ success: true }),
}))

import { invoke } from '../../../src/renderer/src/lib/ipc'

describe('useWallet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      wallet: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    })
  })

  describe('connect', () => {
    it('成功连接后应重置 isConnecting', async () => {
      vi.mocked(invoke).mockResolvedValueOnce({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        ensName: null,
        avatarUrl: null,
      } as any)

      const { result } = renderHook(() => useWallet())

      await act(async () => {
        await result.current.connect({
          walletType: 'metamask',
          address: '0x1234567890abcdef1234567890abcdef12345678',
          signature: 'sig',
          message: 'msg',
        })
      })

      expect(useAuthStore.getState().isConnecting).toBe(false)
      expect(useAuthStore.getState().isConnected).toBe(true)
      expect(useAuthStore.getState().wallet?.address).toBe('0x1234567890abcdef1234567890abcdef12345678')
    })

    it('连接失败后应重置 isConnecting 并设置错误', async () => {
      vi.mocked(invoke).mockRejectedValueOnce(new Error('Connection refused'))

      const { result } = renderHook(() => useWallet())

      await act(async () => {
        try {
          await result.current.connect({
            walletType: 'metamask',
            address: '0x1234567890abcdef1234567890abcdef12345678',
            signature: 'sig',
            message: 'msg',
          })
        } catch {
          // expected
        }
      })

      expect(useAuthStore.getState().isConnecting).toBe(false)
      expect(useAuthStore.getState().error).toBe('Connection refused')
    })
  })

  describe('disconnect', () => {
    it('应清空钱包状态', async () => {
      useAuthStore.setState({
        wallet: { address: '0x123' },
        isConnected: true,
      })

      vi.mocked(invoke).mockResolvedValueOnce({} as any)

      const { result } = renderHook(() => useWallet())

      await act(async () => {
        await result.current.disconnect()
      })

      expect(useAuthStore.getState().wallet).toBeNull()
      expect(useAuthStore.getState().isConnected).toBe(false)
    })
  })
})
