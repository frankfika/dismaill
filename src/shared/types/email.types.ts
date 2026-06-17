// Email Types
export interface Email {
  id: string
  emailAccountId: string
  messageId: string
  folder: string
  subject: string | null
  sender: string
  senderName: string | null
  recipientsTo: string | null
  recipientsCc: string | null
  recipientsBcc: string | null
  bodyText: string | null
  bodyHtml: string | null
  snippet: string | null
  receivedAt: string
  isRead: boolean
  isStarred: boolean
  isDeleted: boolean
  hasAttachments: boolean
}

export interface EmailAccount {
  id: string
  walletAddress: string
  emailAddress: string
  displayName: string | null
  provider: string
  imapHost: string
  imapPort: number
  smtpHost: string
  smtpPort: number
  authType: string
  isActive: boolean
  lastSyncAt: string | null
}

export interface EmailSendRequest {
  accountId: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  bodyHtml?: string
  signatureId?: string
  replyTo?: string
  attachments?: EmailAttachment[]
}

export interface EmailAttachment {
  filename: string
  path: string
  contentType: string
}

export interface EmailListRequest {
  accountId?: string
  folder?: string
  tagId?: string
  query?: string
  page: number
  pageSize: number
}

export interface EmailListResponse {
  emails: EmailSummary[]
  total: number
  hasMore: boolean
}

export interface EmailSummary {
  id: string
  accountId: string
  messageId: string
  subject: string
  sender: string
  senderName?: string
  snippet: string
  receivedAt: string
  isRead: boolean
  isStarred: boolean
  tags: TagSummary[]
}

export interface TagSummary {
  id: string
  name: string
  color: string
}

/**
 * Preset of mainstream email providers used to quick-fill the IMAP/SMTP
 * fields on the add-account form. Mirrors `ProviderPreset` in
 * `src-tauri/src/services/email_providers.rs`.
 */
export interface ProviderPreset {
  id: string
  name: string
  /** 'global' | 'cn' */
  region: string
  domains: string[]
  imapHost: string
  imapPort: number
  smtpHost: string
  smtpPort: number
  supportsOauth: boolean
  passwordHint: string
  helpUrl: string
}
