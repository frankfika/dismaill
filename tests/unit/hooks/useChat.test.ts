import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChat } from '../../../src/renderer/src/hooks/useChat'

/**
 * useChat Hook Tests
 * 测试钱包聊天 hook 的行为
 * 发现的 BUG 用 // BUG: 标注
 */

// Mock ipc
vi.mock('../../../src/renderer/src/lib/ipc', () => ({
  invoke: vi.fn().mockResolvedValue([]),
}))

// Mock auth store
const mockAuthStore = {
  isConnected: false,
  wallet: null as { address: string } | null,
  getState: () => mockAuthStore,
}

vi.mock('../../../src/renderer/src/stores/auth.store', () => ({
  useAuthStore: () => mockAuthStore,
}))

import { invoke } from '../../../src/renderer/src/lib/ipc'

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.isConnected = false
    mockAuthStore.wallet = null
  })

  describe('fetchConversations', () => {
    it('未连接时应返回空数组', async () => {
      mockAuthStore.isConnected = false

      const { result } = renderHook(() => useChat())

      await act(async () => {
        await result.current.fetchConversations()
      })

      expect(result.current.conversations).toHaveLength(0)
      expect(invoke).not.toHaveBeenCalledWith('chat:get_conversations')
    })

    it('已连接时应调用 IPC 获取对话', async () => {
      mockAuthStore.isConnected = true

      const mockConversations = [
        { address: '0x123', ensName: 'test.eth', unreadCount: 0 },
      ]
      // First call is consumed by initializeChat() in useEffect (chat:init)
      // Second call is for fetchConversations (chat:get_conversations)
      vi.mocked(invoke)
        .mockResolvedValueOnce(undefined as any) // chat:init
        .mockResolvedValueOnce(mockConversations as any) // chat:get_conversations

      const { result } = renderHook(() => useChat())

      // Wait for initializeChat() useEffect to complete
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0))
      })

      await act(async () => {
        await result.current.fetchConversations()
      })

      expect(invoke).toHaveBeenCalledWith('chat:get_conversations')
      expect(result.current.conversations).toEqual(mockConversations)
    })

    it('IPC 调用失败时应设置错误', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockAuthStore.isConnected = true
      // First call is consumed by initializeChat() in useEffect
      vi.mocked(invoke)
        .mockResolvedValueOnce(undefined as any) // chat:init
        .mockRejectedValueOnce(new Error('Network error')) // chat:get_conversations

      const { result } = renderHook(() => useChat())

      // Wait for initializeChat() useEffect to complete
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0))
      })

      await act(async () => {
        await result.current.fetchConversations()
      })

      expect(result.current.error).toBe('Network error')
      errorSpy.mockRestore()
    })
  })

  describe('sendMessage', () => {
    it('未连接时应返回 false', async () => {
      mockAuthStore.isConnected = false

      const { result } = renderHook(() => useChat())

      let success: boolean = true
      await act(async () => {
        success = await result.current.sendMessage('0x123', 'hello')
      })

      expect(success).toBe(false)
    })

    it('空消息应返回 false', async () => {
      mockAuthStore.isConnected = true

      const { result } = renderHook(() => useChat())

      let success: boolean = true
      await act(async () => {
        success = await result.current.sendMessage('0x123', '   ')
      })

      expect(success).toBe(false)
    })

    it('sendMessage 应从 auth store 读取钱包地址', async () => {
      mockAuthStore.isConnected = true
      mockAuthStore.wallet = { address: '0xRealAddress' }

      vi.mocked(invoke)
        .mockResolvedValueOnce(undefined as any) // chat:init from useEffect
        .mockResolvedValueOnce(undefined as any) // chat:send

      const { result } = renderHook(() => useChat())

      // Wait for initializeChat() useEffect to complete
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0))
      })

      await act(async () => {
        await result.current.sendMessage('0x123', 'hello')
      })

      // 修复后: senderAddress 应该是真实钱包地址
      const lastMessage = result.current.messages[result.current.messages.length - 1]
      if (lastMessage) {
        expect(lastMessage.senderAddress).toBe('0xRealAddress')
      }
    })

    it('发送失败时应回滚乐观更新', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockAuthStore.isConnected = true
      mockAuthStore.wallet = { address: '0xRealAddress' }

      vi.mocked(invoke)
        .mockResolvedValueOnce(undefined as any) // chat:init from useEffect
        .mockRejectedValueOnce(new Error('Send failed')) // chat:send

      const { result } = renderHook(() => useChat())

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0))
      })

      await act(async () => {
        await result.current.sendMessage('0x123', 'hello')
      })

      expect(result.current.messages).toHaveLength(0)
      expect(result.current.error).toBe('Send failed')
      errorSpy.mockRestore()
    })
  })

  describe('searchUser', () => {
    it('应验证 ETH 地址格式 (0x + 40 hex chars)', async () => {
      const { result } = renderHook(() => useChat())

      let searchResult: any = null
      await act(async () => {
        searchResult = await result.current.searchUser('0x' + '1'.repeat(40))
      })

      expect(searchResult).not.toBeNull()
      expect(searchResult.address).toBe('0x' + '1'.repeat(40))
    })

    it('应拒绝无效地址', async () => {
      const { result } = renderHook(() => useChat())

      let searchResult: any = 'initial'
      await act(async () => {
        searchResult = await result.current.searchUser('invalid')
      })

      expect(searchResult).toBeNull()
    })

    it('应解析 .eth ENS 名', async () => {
      const { result } = renderHook(() => useChat())

      let searchResult: any = null
      await act(async () => {
        searchResult = await result.current.searchUser('vitalik.eth')
      })

      expect(searchResult).not.toBeNull()
      expect(searchResult.ensName).toBe('vitalik.eth')
      expect(searchResult.address).toMatch(/^0x/)
    })

    it('空查询应返回 null', async () => {
      const { result } = renderHook(() => useChat())

      let searchResult: any = 'initial'
      await act(async () => {
        searchResult = await result.current.searchUser('')
      })

      expect(searchResult).toBeNull()
    })
  })

  describe('fetchMessages', () => {
    it('未连接时应返回空数组', async () => {
      mockAuthStore.isConnected = false

      const { result } = renderHook(() => useChat())

      await act(async () => {
        await result.current.fetchMessages('0x123')
      })

      expect(result.current.messages).toHaveLength(0)
    })

    it('已连接时应调用 IPC 获取消息', async () => {
      mockAuthStore.isConnected = true

      const mockMessages = [
        { id: '1', senderAddress: '0x123', content: 'hello', timestamp: Date.now(), status: 'sent' },
      ]
      vi.mocked(invoke).mockResolvedValueOnce(mockMessages as any)

      const { result } = renderHook(() => useChat())

      await act(async () => {
        await result.current.fetchMessages('0x123')
      })

      expect(invoke).toHaveBeenCalledWith('chat:get_messages', {
        conversationId: null,
        limit: 50,
        peerAddress: '0x123',
      })
    })
  })
})
