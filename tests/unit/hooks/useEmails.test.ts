import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEmails } from '../../../src/renderer/src/hooks/useEmails'
import { useEmailStore } from '../../../src/renderer/src/stores/email.store'

vi.mock('../../../src/renderer/src/lib/ipc', () => ({
  invoke: vi.fn().mockResolvedValue({}),
}))

import { invoke } from '../../../src/renderer/src/lib/ipc'

describe('useEmails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useEmailStore.setState({
      emails: [],
      selectedAccountId: 'acc-1',
      selectedFolder: 'INBOX',
      isLoading: false,
      isSyncing: false,
      error: null,
    })
  })

  describe('deleteEmail', () => {
    it('应基于最新状态删除邮件（避免闭包过期）', async () => {
      // 初始化两封邮件
      useEmailStore.setState({
        emails: [
          { id: 'e1', accountId: 'acc-1', messageId: 'm1', subject: 'A', sender: 'a', snippet: '', receivedAt: '', isRead: false, isStarred: false, tags: [] },
          { id: 'e2', accountId: 'acc-1', messageId: 'm2', subject: 'B', sender: 'b', snippet: '', receivedAt: '', isRead: false, isStarred: false, tags: [] },
        ] as any,
      })

      vi.mocked(invoke).mockResolvedValue({ deleted: 1 } as any)

      const { result } = renderHook(() => useEmails())

      // 连续删除两封邮件
      await act(async () => {
        await result.current.deleteEmail('e1')
      })
      await act(async () => {
        await result.current.deleteEmail('e2')
      })

      expect(result.current.emails).toHaveLength(0)
      expect(invoke).toHaveBeenCalledWith('email:delete', { ids: ['e1'], permanent: false })
      expect(invoke).toHaveBeenCalledWith('email:delete', { ids: ['e2'], permanent: false })
    })
  })

  describe('fetchEmails', () => {
    it('应根据 selectedAccountId 调用 email:list', async () => {
      vi.mocked(invoke).mockResolvedValueOnce({ emails: [], total: 0, hasMore: false } as any)

      const { result } = renderHook(() => useEmails())

      await act(async () => {
        await result.current.fetchEmails()
      })

      expect(invoke).toHaveBeenCalledWith('email:list', {
        accountId: 'acc-1',
        folder: 'INBOX',
        page: 1,
        pageSize: 50,
      })
    })
  })
})
