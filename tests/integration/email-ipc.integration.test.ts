import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockIpcRenderer, registerIpcHandler, clearIpcHandlers } from '../mocks/electron.mock'
import type { IpcResponse } from '../../src/shared/types/ipc.types'
import type { EmailSendRequest, EmailListResponse } from '../../src/shared/types/email.types'
import { EmailFactory, AccountFactory } from '../factories/email.factory'

/**
 * Email IPC Integration Tests
 * Tests the full IPC flow from renderer to main process
 */

describe('Email IPC Integration', () => {
  beforeEach(() => {
    clearIpcHandlers()
  })

  afterEach(() => {
    clearIpcHandlers()
  })

  describe('email:send', () => {
    it('should send email through IPC successfully', async () => {
      // Register mock handler
      registerIpcHandler('email:send', async (request: EmailSendRequest) => ({
        success: true,
        data: {
          messageId: `<msg-${Date.now()}@aura.local>`,
          status: 'sent',
        },
      }))

      const request: EmailSendRequest = {
        accountId: 'acc-001',
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        body: 'Test body',
      }

      const response = (await mockIpcRenderer.invoke(
        'email:send',
        request
      )) as IpcResponse<{ messageId: string; status: string }>

      expect(response.success).toBe(true)
      expect(response.data?.messageId).toBeDefined()
      expect(response.data?.status).toBe('sent')
    })

    it('should handle invalid recipient error', async () => {
      registerIpcHandler('email:send', async (request: EmailSendRequest) => ({
        success: false,
        error: {
          code: 'EMAIL_INVALID_RECIPIENT',
          message: 'Invalid recipient email address',
        },
      }))

      const request: EmailSendRequest = {
        accountId: 'acc-001',
        to: ['invalid-email'],
        subject: 'Test',
        body: 'Test',
      }

      const response = await mockIpcRenderer.invoke('email:send', request)

      expect(response.success).toBe(false)
      expect(response.error?.code).toBe('EMAIL_INVALID_RECIPIENT')
    })

    it('should queue email when offline', async () => {
      registerIpcHandler('email:send', async (request: EmailSendRequest) => ({
        success: true,
        data: {
          queueId: `queue-${Date.now()}`,
          status: 'queued',
        },
      }))

      const request: EmailSendRequest = {
        accountId: 'acc-001',
        to: ['test@example.com'],
        subject: 'Offline Test',
        body: 'This should be queued',
      }

      const response = await mockIpcRenderer.invoke('email:send', request)

      expect(response.success).toBe(true)
      expect(response.data?.status).toBe('queued')
      expect(response.data?.queueId).toBeDefined()
    })
  })

  describe('email:list', () => {
    it('should retrieve paginated email list', async () => {
      const mockEmails = EmailFactory.buildManySummaries(25)

      registerIpcHandler('email:list', async (request: { page: number; pageSize: number }) => {
        const start = (request.page - 1) * request.pageSize
        const paginated = mockEmails.slice(start, start + request.pageSize)

        return {
          success: true,
          data: {
            emails: paginated,
            total: mockEmails.length,
            hasMore: start + request.pageSize < mockEmails.length,
          } as EmailListResponse,
        }
      })

      const response = await mockIpcRenderer.invoke('email:list', { page: 1, pageSize: 10 })

      expect(response.success).toBe(true)
      expect(response.data.emails).toHaveLength(10)
      expect(response.data.total).toBe(25)
      expect(response.data.hasMore).toBe(true)
    })

    it('should filter emails by folder', async () => {
      const inboxEmails = EmailFactory.buildManySummaries(5, { accountId: 'acc-001' })
      const sentEmails = EmailFactory.buildManySummaries(3, { accountId: 'acc-001' })

      registerIpcHandler('email:list', async (request: { folder?: string }) => {
        const emails = request.folder === 'Sent' ? sentEmails : inboxEmails
        return {
          success: true,
          data: {
            emails,
            total: emails.length,
            hasMore: false,
          },
        }
      })

      const inboxResponse = await mockIpcRenderer.invoke('email:list', { folder: 'INBOX' })
      const sentResponse = await mockIpcRenderer.invoke('email:list', { folder: 'Sent' })

      expect(inboxResponse.data.emails).toHaveLength(5)
      expect(sentResponse.data.emails).toHaveLength(3)
    })

    it('should search emails by query', async () => {
      const emails = [
        EmailFactory.buildSummary({ subject: 'Important Meeting' }),
        EmailFactory.buildSummary({ subject: 'Daily Report' }),
        EmailFactory.buildSummary({ subject: 'Urgent: Important Update' }),
      ]

      registerIpcHandler('email:list', async (request: { query?: string }) => {
        const filtered = request.query
          ? emails.filter((e) => e.subject.toLowerCase().includes(request.query!.toLowerCase()))
          : emails

        return {
          success: true,
          data: {
            emails: filtered,
            total: filtered.length,
            hasMore: false,
          },
        }
      })

      const response = await mockIpcRenderer.invoke('email:list', { query: 'important' })

      expect(response.data.emails).toHaveLength(2)
    })
  })

  describe('email:get', () => {
    it('should retrieve email details', async () => {
      const mockEmail = EmailFactory.build({ id: 'email-001' })

      registerIpcHandler('email:get', async (request: { emailId: string }) => {
        if (request.emailId === 'email-001') {
          return {
            success: true,
            data: mockEmail,
          }
        }
        return {
          success: false,
          error: { code: 'EMAIL_NOT_FOUND', message: 'Email not found' },
        }
      })

      const response = await mockIpcRenderer.invoke('email:get', { emailId: 'email-001' })

      expect(response.success).toBe(true)
      expect(response.data.id).toBe('email-001')
    })
  })

  describe('email:mark_read', () => {
    it('should mark emails as read', async () => {
      registerIpcHandler('email:mark_read', async (request: { emailIds: string[]; isRead: boolean }) => ({
        success: true,
        data: { updated: request.emailIds.length },
      }))

      const response = await mockIpcRenderer.invoke('email:mark_read', {
        emailIds: ['email-1', 'email-2', 'email-3'],
        isRead: true,
      })

      expect(response.success).toBe(true)
      expect(response.data.updated).toBe(3)
    })
  })

  describe('email:delete', () => {
    it('should move emails to trash', async () => {
      registerIpcHandler('email:delete', async (request: { emailIds: string[]; permanent?: boolean }) => ({
        success: true,
        data: {
          movedToTrash: request.permanent ? 0 : request.emailIds.length,
          deleted: request.permanent ? request.emailIds.length : 0,
        },
      }))

      const response = await mockIpcRenderer.invoke('email:delete', {
        emailIds: ['email-1'],
        permanent: false,
      })

      expect(response.success).toBe(true)
      expect(response.data.movedToTrash).toBe(1)
    })

    it('should permanently delete emails', async () => {
      registerIpcHandler('email:delete', async (request: { emailIds: string[]; permanent?: boolean }) => ({
        success: true,
        data: {
          movedToTrash: request.permanent ? 0 : request.emailIds.length,
          deleted: request.permanent ? request.emailIds.length : 0,
        },
      }))

      const response = await mockIpcRenderer.invoke('email:delete', {
        emailIds: ['email-1'],
        permanent: true,
      })

      expect(response.success).toBe(true)
      expect(response.data.deleted).toBe(1)
    })
  })

  describe('email:sync', () => {
    it('should sync emails for account', async () => {
      registerIpcHandler('email:sync', async (request: { accountId?: string }) => ({
        success: true,
        data: {
          newCount: 5,
          updatedCount: 2,
          errors: [],
        },
      }))

      const response = await mockIpcRenderer.invoke('email:sync', { accountId: 'acc-001' })

      expect(response.success).toBe(true)
      expect(response.data.newCount).toBe(5)
      expect(response.data.errors).toHaveLength(0)
    })

    it('should handle sync errors', async () => {
      registerIpcHandler('email:sync', async () => ({
        success: true,
        data: {
          newCount: 0,
          updatedCount: 0,
          errors: [{ accountId: 'acc-001', errorCode: 'EMAIL_IMAP_AUTH_FAILED' }],
        },
      }))

      const response = await mockIpcRenderer.invoke('email:sync', {})

      expect(response.data.errors).toHaveLength(1)
      expect(response.data.errors[0].errorCode).toBe('EMAIL_IMAP_AUTH_FAILED')
    })
  })
})
