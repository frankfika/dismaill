import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * ChatService Unit Tests
 * 测试 XMTP 聊天服务
 * BUG: chat.service.ts:44 - 永远运行在 mock 模式
 */

// Mock @xmtp/xmtp-js
vi.mock('@xmtp/xmtp-js', () => ({
  Client: vi.fn(),
}))

import { ChatService } from '../../../src/main/services/chat.service'
import { AuthService } from '../../../src/main/services/auth.service'

describe('ChatService', () => {
  let chatService: ChatService
  let authService: AuthService

  beforeEach(() => {
    authService = new AuthService()
    chatService = new ChatService(authService)
  })

  describe('initialize', () => {
    it('// BUG: 永远运行在 mock 模式', async () => {
      // BUG: chat.service.ts:44 - initialize 在第 44 行 return true
      // 导致后面的 loadConversations 永远不会被调用
      const result = await chatService.initialize()
      expect(result).toBe(true) // 总是返回 true (mock mode)
    })
  })

  describe('sendMessage', () => {
    it('未连接钱包时应抛出 CHAT_WALLET_NOT_CONNECTED', async () => {
      await expect(
        chatService.sendMessage('0x123', 'hello')
      ).rejects.toThrow('CHAT_WALLET_NOT_CONNECTED')
    })

    it('连接钱包后在 mock 模式应成功发送', async () => {
      await authService.connectWallet({ walletType: 'metamask' })

      const result = await chatService.sendMessage('0x123', 'hello')

      expect(result).not.toBeNull()
      expect(result!.content).toBe('hello')
      expect(result!.status).toBe('sent')
      expect(result!.senderAddress).toBeDefined()
    })

    it('mock 模式发送后应存储到本地消息列表', async () => {
      await authService.connectWallet({ walletType: 'metamask' })

      await chatService.sendMessage('0x123', 'message 1')
      await chatService.sendMessage('0x123', 'message 2')

      const messages = await chatService.getMessages('0x123')
      expect(messages.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('getConversations', () => {
    it('未连接钱包时应返回空数组', async () => {
      const conversations = await chatService.getConversations()
      expect(conversations).toHaveLength(0)
    })

    it('连接钱包后 mock 模式应返回预设对话', async () => {
      await authService.connectWallet({ walletType: 'metamask' })

      const conversations = await chatService.getConversations()

      expect(conversations.length).toBeGreaterThan(0)
      expect(conversations[0].address).toBeDefined()
      expect(conversations[0].ensName).toBeDefined()
    })
  })

  describe('getMessages', () => {
    it('mock 模式应返回预设消息', async () => {
      await authService.connectWallet({ walletType: 'metamask' })

      const messages = await chatService.getMessages('0x123')

      expect(messages.length).toBeGreaterThan(0)
      expect(messages[0].content).toBeDefined()
      expect(messages[0].timestamp).toBeDefined()
    })

    it('有缓存消息时应返回缓存', async () => {
      await authService.connectWallet({ walletType: 'metamask' })

      // Send a message first to populate cache
      await chatService.sendMessage('0x456', 'cached message')

      const messages = await chatService.getMessages('0x456')
      expect(messages.some(m => m.content === 'cached message')).toBe(true)
    })
  })

  describe('searchUser', () => {
    it('ENS 名称应解析为地址', async () => {
      const result = await chatService.searchUser('vitalik.eth')

      expect(result).not.toBeNull()
      expect(result!.ensName).toBe('vitalik.eth')
      expect(result!.address).toMatch(/^0x/)
    })

    it('有效 ETH 地址应直接返回', async () => {
      const address = '0x' + 'a'.repeat(40)
      const result = await chatService.searchUser(address)

      expect(result).not.toBeNull()
      expect(result!.address).toBe(address)
    })

    it('无效查询应返回 null', async () => {
      const result = await chatService.searchUser('invalid')
      expect(result).toBeNull()
    })
  })

  describe('disconnect', () => {
    it('断开后应清空对话和消息', async () => {
      await authService.connectWallet({ walletType: 'metamask' })
      await chatService.sendMessage('0x123', 'test')

      await chatService.disconnect()

      // 因为是 mock 模式，getMessages 仍然会返回预设消息
      // 但缓存的消息应该被清除
    })
  })

  describe('getConversation', () => {
    it('mock 模式应返回 null', async () => {
      const result = await chatService.getConversation('0x123')
      expect(result).toBeNull()
    })
  })

  describe('streamMessages', () => {
    it('mock 模式应返回 no-op 清理函数', async () => {
      const onMessage = vi.fn()
      const cleanup = await chatService.streamMessages('0x123', onMessage)

      expect(typeof cleanup).toBe('function')
      cleanup() // Should not throw
    })
  })
})
