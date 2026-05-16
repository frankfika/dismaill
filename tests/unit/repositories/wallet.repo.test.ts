import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * EmailAccountRepository Unit Tests
 * Tests email account CRUD operations using mocked database
 * Note: better-sqlite3 native module is compiled for Electron and cannot
 * be loaded in the test Node.js runtime, so we mock the database layer.
 */

// Mock better-sqlite3
const mockRun = vi.fn()
const mockGet = vi.fn()
const mockAll = vi.fn()
const mockPrepare = vi.fn(() => ({
  run: mockRun,
  get: mockGet,
  all: mockAll,
}))

vi.mock('better-sqlite3', () => {
  return {
    default: vi.fn(() => ({
      prepare: mockPrepare,
      exec: vi.fn(),
    })),
  }
})

import { EmailAccountRepository } from '../../../src/main/database/repositories/email-account.repo'

describe('EmailAccountRepository', () => {
  let repo: EmailAccountRepository

  beforeEach(() => {
    vi.clearAllMocks()
    const db = { prepare: mockPrepare, exec: vi.fn() } as any
    repo = new EmailAccountRepository(db)
  })

  const mockAccountRow = {
    id: 'acc-1',
    wallet_address: '0x123',
    email_address: 'test@example.com',
    display_name: 'Test Account',
    provider: 'gmail',
    imap_host: 'imap.gmail.com',
    imap_port: 993,
    smtp_host: 'smtp.gmail.com',
    smtp_port: 465,
    auth_type: 'password',
    credentials: 'encrypted',
    is_active: 1,
    last_sync_at: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  }

  describe('create', () => {
    it('should create a new account', () => {
      mockGet.mockReturnValue(mockAccountRow)

      const account = repo.create({
        id: 'acc-1',
        wallet_address: '0x123',
        email_address: 'test@example.com',
        display_name: 'Test Account',
        provider: 'gmail',
        imap_host: 'imap.gmail.com',
        imap_port: 993,
        smtp_host: 'smtp.gmail.com',
        smtp_port: 465,
        auth_type: 'password',
        credentials: 'encrypted',
        is_active: 1,
        last_sync_at: null,
      })

      expect(mockRun).toHaveBeenCalled()
      expect(account.id).toBe('acc-1')
      expect(account.emailAddress).toBe('test@example.com')
    })
  })

  describe('findById', () => {
    it('should find account by id', () => {
      mockGet.mockReturnValue(mockAccountRow)

      const found = repo.findById('acc-1')
      expect(found).toBeDefined()
      expect(found?.id).toBe('acc-1')
    })

    it('should return null for non-existent account', () => {
      mockGet.mockReturnValue(undefined)

      const found = repo.findById('non-existent')
      expect(found).toBeNull()
    })
  })

  describe('findByWallet', () => {
    it('should find accounts by wallet address', () => {
      mockAll.mockReturnValue([
        mockAccountRow,
        {
          ...mockAccountRow,
          id: 'acc-2',
          email_address: 'test2@example.com',
          provider: 'outlook',
          imap_host: 'outlook.office365.com',
          smtp_host: 'smtp.office365.com',
          smtp_port: 587,
        },
      ])

      const accounts = repo.findByWallet('0x123')
      expect(accounts).toHaveLength(2)
    })
  })
})
