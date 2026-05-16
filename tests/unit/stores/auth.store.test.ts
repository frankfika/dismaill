/**
 * Unit Tests - Auth Store
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { invoke as tauriInvoke } from '@tauri-apps/api/core'
import { useAuthStore } from '../../../src/renderer/src/stores/auth.store'

const mockInvoke = vi.mocked(tauriInvoke)

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      wallet: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    })
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const state = useAuthStore.getState()
      expect(state.wallet).toBeNull()
      expect(state.isConnected).toBe(false)
      expect(state.isConnecting).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('setWallet', () => {
    it('应该设置钱包并标记为已连接', () => {
      const wallet = { address: '0x1234', ensName: 'test.eth' }
      useAuthStore.getState().setWallet(wallet)

      const state = useAuthStore.getState()
      expect(state.wallet).toEqual(wallet)
      expect(state.isConnected).toBe(true)
    })

    it('设置 null 应该标记为未连接', () => {
      useAuthStore.getState().setWallet({ address: '0x1234' })
      useAuthStore.getState().setWallet(null)

      const state = useAuthStore.getState()
      expect(state.wallet).toBeNull()
      expect(state.isConnected).toBe(false)
    })
  })

  describe('setConnecting', () => {
    it('应该更新连接中状态', () => {
      useAuthStore.getState().setConnecting(true)
      expect(useAuthStore.getState().isConnecting).toBe(true)

      useAuthStore.getState().setConnecting(false)
      expect(useAuthStore.getState().isConnecting).toBe(false)
    })
  })

  describe('setError / clearError', () => {
    it('应该设置错误信息', () => {
      useAuthStore.getState().setError('Connection failed')
      expect(useAuthStore.getState().error).toBe('Connection failed')
    })

    it('应该清除错误信息', () => {
      useAuthStore.getState().setError('Error')
      useAuthStore.getState().clearError()
      expect(useAuthStore.getState().error).toBeNull()
    })
  })

  describe('connect', () => {
    it('成功连接应该更新钱包状态', async () => {
      mockInvoke.mockResolvedValue({
        address: '0xabcdef',
        ensName: 'alice.eth',
        avatarUrl: 'https://example.com/avatar.png',
      })

      await useAuthStore.getState().connect('metamask')

      const state = useAuthStore.getState()
      expect(state.wallet?.address).toBe('0xabcdef')
      expect(state.wallet?.ensName).toBe('alice.eth')
      expect(state.isConnected).toBe(true)
      expect(state.isConnecting).toBe(false)
      expect(state.error).toBeNull()
    })

    it('连接失败应该设置错误', async () => {
      mockInvoke.mockRejectedValue(new Error('User rejected'))

      await useAuthStore.getState().connect('metamask')

      const state = useAuthStore.getState()
      expect(state.wallet).toBeNull()
      expect(state.isConnected).toBe(false)
      expect(state.error).toBe('User rejected')
    })

    it('连接异常应该捕获错误', async () => {
      mockInvoke.mockRejectedValue(new Error('Network error'))

      await useAuthStore.getState().connect('metamask')

      expect(useAuthStore.getState().isConnecting).toBe(false)
      expect(useAuthStore.getState().error).toBe('Network error')
    })
  })

  describe('disconnect', () => {
    it('应该清除钱包状态', async () => {
      useAuthStore.setState({ wallet: { address: '0x1234' }, isConnected: true })

      mockInvoke.mockResolvedValue(undefined)
      await useAuthStore.getState().disconnect()

      expect(useAuthStore.getState().wallet).toBeNull()
      expect(useAuthStore.getState().isConnected).toBe(false)
    })

    it('即使 IPC 失败也应该清除状态', async () => {
      useAuthStore.setState({ wallet: { address: '0x1234' }, isConnected: true })
      mockInvoke.mockRejectedValue(new Error('IPC error'))

      await useAuthStore.getState().disconnect()

      expect(useAuthStore.getState().wallet).toBeNull()
      expect(useAuthStore.getState().isConnected).toBe(false)
    })
  })
})
