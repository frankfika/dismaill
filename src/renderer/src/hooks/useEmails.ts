/**
 * useEmails Hook
 * 邮件数据获取和操作
 */

import { useCallback } from 'react'
import { useEmailStore } from '../stores/email.store'
import { invoke } from '../lib/ipc'
import type { EmailListResponse, EmailSendRequest } from '@shared/types/email.types'

export function useEmails() {
  const {
    emails,
    selectedAccountId,
    selectedFolder,
    isLoading,
    isSyncing,
    error,
    setEmails,
    setLoading,
    setSyncing,
    setError,
    markEmailAsRead,
  } = useEmailStore()

  const fetchEmails = useCallback(
    async (page = 1, pageSize = 50) => {
      if (!selectedAccountId) return

      setLoading(true)
      setError(null)

      try {
        const result = await invoke<EmailListResponse>('email:list', {
          accountId: selectedAccountId,
          folder: selectedFolder,
          page,
          pageSize,
        })
        setEmails(result.emails)
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch emails'
        setError(errorMessage)
        throw err
      }
    },
    [selectedAccountId, selectedFolder, setEmails, setLoading, setError]
  )

  const syncEmails = useCallback(async () => {
    setSyncing(true)
    setError(null)

    try {
      const result = await invoke<{ newCount: number; updatedCount: number }>('email:sync', {
        accountId: selectedAccountId,
      })

      // 同步完成后刷新邮件列表
      await fetchEmails()

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed'
      setError(errorMessage)
      throw err
    }
  }, [selectedAccountId, fetchEmails, setSyncing, setError])

  const sendEmail = useCallback(async (request: EmailSendRequest) => {
    try {
      const result = await invoke<{ messageId: string; status: string }>('email:send', request)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email'
      setError(errorMessage)
      throw err
    }
  }, [setError])

  const markAsRead = useCallback(
    async (emailId: string, isRead = true) => {
      try {
        await invoke('email:mark_read', { emailIds: [emailId], isRead })
        markEmailAsRead(emailId)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to mark as read'
        setError(errorMessage)
        throw err
      }
    },
    [markEmailAsRead, setError]
  )

  const deleteEmail = useCallback(
    async (emailId: string, permanent = false) => {
      try {
        await invoke('email:delete', { emailIds: [emailId], permanent })
        setEmails(emails.filter((e) => e.id !== emailId))
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete email'
        setError(errorMessage)
        throw err
      }
    },
    [emails, setEmails, setError]
  )

  return {
    emails,
    isLoading,
    isSyncing,
    error,
    fetchEmails,
    syncEmails,
    sendEmail,
    markAsRead,
    deleteEmail,
  }
}
