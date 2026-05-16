/// <reference types="vite/client" />

interface Window {
  electron: {
    process: {
      versions: {
        node: string
        chrome: string
        electron: string
      }
    }
  }
  api: {
    auth: {
      connect: (request: { walletType: 'metamask' | 'walletconnect' | 'coinbase' }) => Promise<{
        success: boolean
        data?: {
          address: string
          ensName?: string
          avatarUrl?: string
          isNewUser: boolean
        }
        error?: { code: string; message: string }
      }>
      sign: (request: { message: string; purpose: 'decrypt' | 'verify' | 'export' }) => Promise<{
        success: boolean
        data?: { signature: string }
        error?: { code: string; message: string }
      }>
      disconnect: () => Promise<{ success: boolean; error?: { code: string; message: string } }>
    }
    account: {
      add: (request: unknown) => Promise<{ success: boolean; data?: unknown; error?: { code: string; message: string } }>
      list: () => Promise<{ success: boolean; data?: unknown[]; error?: { code: string; message: string } }>
      update: (id: string, updates: unknown) => Promise<{ success: boolean; error?: { code: string; message: string } }>
      delete: (id: string) => Promise<{ success: boolean; error?: { code: string; message: string } }>
      verify: (email: string) => Promise<{ success: boolean; data?: unknown; error?: { code: string; message: string } }>
    }
    email: {
      send: (request: {
        accountId: string
        to: string[]
        cc?: string[]
        bcc?: string[]
        subject: string
        body: string
        bodyHtml?: string
        attachments?: unknown[]
      }) => Promise<{
        success: boolean
        data?: { messageId: string; status: 'sent' | 'queued'; queueId?: string }
        error?: { code: string; message: string }
      }>
      list: (request: {
        accountId?: string
        folder?: string
        tagId?: string
        query?: string
        page: number
        pageSize: number
      }) => Promise<{
        success: boolean
        data?: { emails: unknown[]; total: number; hasMore: boolean }
        error?: { code: string; message: string }
      }>
      get: (emailId: string) => Promise<{ success: boolean; data?: unknown; error?: { code: string; message: string } }>
      getFolders: (accountId: string) => Promise<{ success: boolean; data?: unknown[]; error?: { code: string; message: string } }>
      markRead: (emailIds: string[], isRead: boolean) => Promise<{ success: boolean; error?: { code: string; message: string } }>
      delete: (emailIds: string[], permanent?: boolean) => Promise<{ success: boolean; error?: { code: string; message: string } }>
      sync: (accountId?: string, fullSync?: boolean) => Promise<{ success: boolean; data?: { newCount: number; updatedCount: number; errors: unknown[] }; error?: { code: string; message: string } }>
    }
    signature: {
      create: (request: { accountId: string; name: string; content: string; isDefault?: boolean }) => Promise<{ success: boolean; data?: { id: string }; error?: { code: string; message: string } }>
      list: (accountId?: string) => Promise<{ success: boolean; data?: unknown[]; error?: { code: string; message: string } }>
      update: (request: { id: string; name?: string; content?: string; isDefault?: boolean }) => Promise<{ success: boolean; error?: { code: string; message: string } }>
      delete: (id: string) => Promise<{ success: boolean; error?: { code: string; message: string } }>
    }
    tag: {
      create: (request: { name: string; color: string; description?: string; isAiEnabled?: boolean }) => Promise<{ success: boolean; data?: { id: string }; error?: { code: string; message: string } }>
      list: () => Promise<{ success: boolean; data?: unknown[]; error?: { code: string; message: string } }>
      apply: (emailIds: string[], tagId: string) => Promise<{ success: boolean; error?: { code: string; message: string } }>
      autoApply: (emailIds: string[]) => Promise<{ success: boolean; data?: { results: unknown[] }; error?: { code: string; message: string } }>
      smartFolders: () => Promise<{ success: boolean; data?: unknown[]; error?: { code: string; message: string } }>
    }
    ai: {
      generate: (request: unknown) => Promise<{ success: boolean; data?: unknown; error?: { code: string; message: string } }>
      refine: (request: unknown) => Promise<{ success: boolean; data?: unknown; error?: { code: string; message: string } }>
      classifyEmail: (request: unknown) => Promise<{ success: boolean; data?: unknown; error?: { code: string; message: string } }>
      providers: () => Promise<{ success: boolean; data?: unknown[]; error?: { code: string; message: string } }>
    }
  }
}
