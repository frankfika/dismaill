import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '../../../src/renderer/src/stores/auth.store'

vi.mock('../../../src/renderer/src/lib/ipc', () => ({
  invokeWrapped: vi.fn().mockResolvedValue({ success: true, data: null }),
}))

import { invokeWrapped } from '../../../src/renderer/src/lib/ipc'

describe('auth.store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      wallet: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    })
  })

  describe('verifySession', () => {
    it('后端会话有效时应保持登录状态', async () => {
      useAuthStore.setState({
        wallet: { address: '0x1234567890abcdef1234567890abcdef12345678' },
        isConnected: false,
      })

      vi.mocked(invokeWrapped).mockResolvedValueOnce({
        success: true,
        data: { address: '0x1234567890abcdef1234567890abcdef12345678' },
      } as any)

      await useAuthStore.getState().verifySession()

      expect(useAuthStore.getState().isConnected).toBe(true)
      expect(useAuthStore.getState().wallet).not.toBeNull()
    })

    it('后端会话无效时应登出', async () => {
      useAuthStore.setState({
        wallet: { address: '0x1234567890abcdef1234567890abcdef12345678' },
        isConnected: true,
      })

      vi.mocked(invokeWrapped).mockResolvedValueOnce({
        success: true,
        data: { address: '0x0000000000000000000000000000000000000000' },
      } as any)

      await useAuthStore.getState().verifySession()

      expect(useAuthStore.getState().isConnected).toBe(false)
      expect(useAuthStore.getState().wallet).toBeNull()
    })

    it('无持久化钱包时应直接登出', async () => {
      await useAuthStore.getState().verifySession()

      expect(useAuthStore.getState().isConnected).toBe(false)
      expect(invokeWrapped).not.toHaveBeenCalled()
    })
  })
})
