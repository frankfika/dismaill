import { create } from 'zustand'
import { invokeWrapped } from '../lib/ipc'
import type { EmailAccount, EmailSummary } from '@shared/types'

interface EmailListResponse {
  emails: EmailSummary[]
  total: number
  hasMore: boolean
}

interface EmailState {
  accounts: EmailAccount[]
  selectedAccountId: string | null
  selectedFolder: string
  emails: EmailSummary[]
  selectedEmailId: string | null
  isLoading: boolean
  isSyncing: boolean
  error: string | null

  // Actions for hooks
  setEmails: (emails: EmailSummary[] | ((prev: EmailSummary[]) => EmailSummary[])) => void
  setLoading: (loading: boolean) => void
  setSyncing: (syncing: boolean) => void
  setError: (error: string | null) => void
  markEmailAsRead: (emailId: string) => void

  // Actions
  loadAccounts: () => Promise<void>
  selectAccount: (id: string | null) => void
  loadEmails: (params?: { folder?: string; page?: number; pageSize?: number }) => Promise<void>
  selectEmail: (id: string | null) => void
  sendEmail: (data: {
    accountId: string
    to: string[]
    subject: string
    body: string
  }) => Promise<boolean>
}

export const useEmailStore = create<EmailState>((set, get) => ({
  accounts: [],
  selectedAccountId: null,
  selectedFolder: 'INBOX',
  emails: [],
  selectedEmailId: null,
  isLoading: false,
  isSyncing: false,
  error: null,

  // Actions for hooks
  setEmails: (emails) => set((state) => ({
    emails: typeof emails === 'function' ? emails(state.emails) : emails,
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setError: (error) => set({ error }),
  markEmailAsRead: (emailId) => {
    const { emails } = get()
    set({
      emails: emails.map((e) =>
        e.id === emailId ? { ...e, isRead: true } : e
      ),
    })
  },

  loadAccounts: async () => {
    set({ isLoading: true })
    try {
      const response = await invokeWrapped<EmailAccount[]>('account:list')
      if (response.success && response.data) {
        const accounts = response.data
        set({
          accounts: accounts,
          isLoading: false,
        })
        // Auto-select first account
        if (accounts.length > 0 && !get().selectedAccountId) {
          set({ selectedAccountId: accounts[0].id })
        }
      } else {
        set({ error: response.error?.message, isLoading: false })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load accounts',
        isLoading: false,
      })
    }
  },

  selectAccount: (id) => set({ selectedAccountId: id }),

  loadEmails: async (params = {}) => {
    const { selectedAccountId } = get()
    set({ isLoading: true })

    try {
      const response = await invokeWrapped<EmailListResponse>('email:list', {
        accountId: selectedAccountId || undefined,
        folder: params.folder || 'INBOX',
        page: params.page || 1,
        pageSize: params.pageSize || 50,
      })

      if (response.success && response.data) {
        const data = response.data
        set({
          emails: data.emails || [],
          isLoading: false,
        })
      } else {
        set({ error: response.error?.message, isLoading: false })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load emails',
        isLoading: false,
      })
    }
  },

  selectEmail: (id) => set({ selectedEmailId: id }),

  sendEmail: async (data) => {
    try {
      const response = await invokeWrapped('email:send', {
        accountId: data.accountId,
        to: data.to,
        cc: [],
        bcc: [],
        subject: data.subject,
        body: data.body,
      })

      return response.success
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  },
}))
