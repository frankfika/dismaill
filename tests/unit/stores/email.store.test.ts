/**
 * Unit Tests - Email Store
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useEmailStore } from '../../../src/renderer/src/stores/email.store'

describe('Email Store', () => {
  beforeEach(() => {
    useEmailStore.setState({
      accounts: [],
      selectedAccountId: null,
      selectedFolder: 'INBOX',
      emails: [],
      selectedEmailId: null,
      isLoading: false,
      isSyncing: false,
      error: null,
    })
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const state = useEmailStore.getState()
      expect(state.accounts).toEqual([])
      expect(state.selectedAccountId).toBeNull()
      expect(state.selectedFolder).toBe('INBOX')
      expect(state.emails).toEqual([])
      expect(state.isLoading).toBe(false)
    })
  })

  describe('setEmails', () => {
    it('应该设置邮件列表', () => {
      const emails = [
        { id: '1', subject: 'Test', sender: 'a@b.com', senderName: 'A', snippet: 'hi', receivedAt: '2024-01-01', isRead: false, isStarred: false, tags: [], accountId: 'acc1', messageId: 'msg1' },
      ]
      useEmailStore.getState().setEmails(emails as any)
      expect(useEmailStore.getState().emails).toHaveLength(1)
    })
  })

  describe('setLoading / setSyncing', () => {
    it('应该更新加载状态', () => {
      useEmailStore.getState().setLoading(true)
      expect(useEmailStore.getState().isLoading).toBe(true)
    })

    it('应该更新同步状态', () => {
      useEmailStore.getState().setSyncing(true)
      expect(useEmailStore.getState().isSyncing).toBe(true)
    })
  })

  describe('markEmailAsRead', () => {
    it('应该标记邮件为已读', () => {
      useEmailStore.setState({
        emails: [
          { id: '1', isRead: false, subject: 'Test', sender: 'a@b.com', senderName: 'A', snippet: '', receivedAt: '', isStarred: false, tags: [], accountId: 'acc1', messageId: 'msg1' },
          { id: '2', isRead: false, subject: 'Test2', sender: 'b@c.com', senderName: 'B', snippet: '', receivedAt: '', isStarred: false, tags: [], accountId: 'acc1', messageId: 'msg2' },
        ] as any,
      })

      useEmailStore.getState().markEmailAsRead('1')

      const emails = useEmailStore.getState().emails
      expect(emails[0].isRead).toBe(true)
      expect(emails[1].isRead).toBe(false)
    })
  })

  describe('selectAccount', () => {
    it('应该选择账户', () => {
      useEmailStore.getState().selectAccount('acc-1')
      expect(useEmailStore.getState().selectedAccountId).toBe('acc-1')
    })

    it('应该取消选择', () => {
      useEmailStore.getState().selectAccount('acc-1')
      useEmailStore.getState().selectAccount(null)
      expect(useEmailStore.getState().selectedAccountId).toBeNull()
    })
  })

  describe('selectEmail', () => {
    it('应该选择邮件', () => {
      useEmailStore.getState().selectEmail('email-1')
      expect(useEmailStore.getState().selectedEmailId).toBe('email-1')
    })
  })

  describe('loadAccounts', () => {
    it('成功加载应该更新账户列表', async () => {
      const accounts = [
        { id: 'acc-1', emailAddress: 'test@gmail.com', provider: 'gmail', isActive: true },
      ]
      window.aura.invoke = vi.fn().mockResolvedValue({ success: true, data: accounts })

      await useEmailStore.getState().loadAccounts()

      const state = useEmailStore.getState()
      expect(state.accounts).toHaveLength(1)
      expect(state.selectedAccountId).toBe('acc-1')
      expect(state.isLoading).toBe(false)
    })

    it('加载失败应该设置错误', async () => {
      window.aura.invoke = vi.fn().mockResolvedValue({
        success: false,
        error: { code: 'NET_OFFLINE', message: 'Network error' },
      })

      await useEmailStore.getState().loadAccounts()

      expect(useEmailStore.getState().error).toBe('Network error')
      expect(useEmailStore.getState().isLoading).toBe(false)
    })

    it('异常应该被捕获', async () => {
      window.aura.invoke = vi.fn().mockRejectedValue(new Error('IPC failed'))

      await useEmailStore.getState().loadAccounts()

      expect(useEmailStore.getState().error).toBe('IPC failed')
    })
  })

  describe('loadEmails', () => {
    it('成功加载应该更新邮件列表', async () => {
      useEmailStore.setState({ selectedAccountId: 'acc-1' })
      window.aura.invoke = vi.fn().mockResolvedValue({
        success: true,
        data: { emails: [{ id: '1', subject: 'Test' }], total: 1, hasMore: false },
      })

      await useEmailStore.getState().loadEmails()

      expect(useEmailStore.getState().emails).toHaveLength(1)
      expect(useEmailStore.getState().isLoading).toBe(false)
    })
  })

  describe('sendEmail', () => {
    it('成功发送应该返回 true', async () => {
      window.aura.invoke = vi.fn().mockResolvedValue({ success: true })

      const result = await useEmailStore.getState().sendEmail({
        accountId: 'acc-1',
        to: ['test@example.com'],
        subject: 'Test',
        body: 'Hello',
      })

      expect(result).toBe(true)
    })

    it('发送失败应该返回 false', async () => {
      window.aura.invoke = vi.fn().mockResolvedValue({ success: false })

      const result = await useEmailStore.getState().sendEmail({
        accountId: 'acc-1',
        to: ['test@example.com'],
        subject: 'Test',
        body: 'Hello',
      })

      expect(result).toBe(false)
    })

    it('异常应该返回 false', async () => {
      window.aura.invoke = vi.fn().mockRejectedValue(new Error('Send failed'))

      const result = await useEmailStore.getState().sendEmail({
        accountId: 'acc-1',
        to: ['test@example.com'],
        subject: 'Test',
        body: 'Hello',
      })

      expect(result).toBe(false)
    })
  })
})
