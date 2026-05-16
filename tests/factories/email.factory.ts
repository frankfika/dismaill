import { vi } from 'vitest'
import type { Email, EmailAccount, EmailSummary } from '../../src/shared/types/email.types'

let idCounter = 0

const generateId = (prefix = 'id') => `${prefix}-${++idCounter}-${Date.now()}`

export const EmailFactory = {
  build: (overrides: Partial<Email> = {}): Email => ({
    id: generateId('email'),
    emailAccountId: 'test-account',
    messageId: `<${generateId('msg')}@test.com>`,
    folder: 'INBOX',
    subject: 'Test Subject',
    sender: 'sender@test.com',
    senderName: 'Test Sender',
    recipientsTo: 'recipient@test.com',
    recipientsCc: null,
    recipientsBcc: null,
    bodyText: 'Test body content',
    bodyHtml: '<p>Test body content</p>',
    snippet: 'Test body content',
    receivedAt: new Date().toISOString(),
    isRead: false,
    isStarred: false,
    isDeleted: false,
    hasAttachments: false,
    ...overrides,
  }),

  buildMany: (count: number, overrides: Partial<Email> = {}): Email[] =>
    Array.from({ length: count }, () => EmailFactory.build(overrides)),

  buildSummary: (overrides: Partial<EmailSummary> = {}): EmailSummary => ({
    id: generateId('email'),
    accountId: 'test-account',
    messageId: `<${generateId('msg')}@test.com>`,
    subject: 'Test Subject',
    sender: 'sender@test.com',
    senderName: 'Test Sender',
    snippet: 'Test snippet...',
    receivedAt: new Date().toISOString(),
    isRead: false,
    isStarred: false,
    tags: [],
    ...overrides,
  }),

  buildManySummaries: (count: number, overrides: Partial<EmailSummary> = {}): EmailSummary[] =>
    Array.from({ length: count }, () => EmailFactory.buildSummary(overrides)),
}

export const AccountFactory = {
  build: (overrides: Partial<EmailAccount> = {}): EmailAccount => ({
    id: generateId('account'),
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    emailAddress: `test${Date.now()}@gmail.com`,
    displayName: 'Test User',
    provider: 'gmail',
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    authType: 'oauth2',
    isActive: true,
    lastSyncAt: null,
    ...overrides,
  }),

  buildGmail: (overrides: Partial<EmailAccount> = {}): EmailAccount =>
    AccountFactory.build({
      provider: 'gmail',
      imapHost: 'imap.gmail.com',
      smtpHost: 'smtp.gmail.com',
      ...overrides,
    }),

  buildOutlook: (overrides: Partial<EmailAccount> = {}): EmailAccount =>
    AccountFactory.build({
      provider: 'outlook',
      emailAddress: `test${Date.now()}@outlook.com`,
      imapHost: 'outlook.office365.com',
      smtpHost: 'smtp.office365.com',
      ...overrides,
    }),

  buildCustom: (overrides: Partial<EmailAccount> = {}): EmailAccount =>
    AccountFactory.build({
      provider: 'custom',
      emailAddress: `test${Date.now()}@company.com`,
      ...overrides,
    }),
}

export const resetFactoryCounters = () => {
  idCounter = 0
}
