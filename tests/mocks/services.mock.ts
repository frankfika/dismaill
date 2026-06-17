import { vi } from 'vitest'

// Mock Crypto Service
export const mockCryptoService = {
  deriveKeyFromSignature: vi.fn((signature: string) => {
    if (!signature) throw new Error('Invalid signature')
    return `derived-key-${signature.slice(0, 8)}`
  }),

  generateKey: vi.fn(() => 'generated-key-32-bytes-long-here!!'),

  encrypt: vi.fn((plaintext: string, key: string) => {
    if (!plaintext || !key) throw new Error('Invalid input')
    return Buffer.from(plaintext).toString('base64')
  }),

  decrypt: vi.fn((encrypted: string, key: string) => {
    if (!encrypted || !key) throw new Error('Invalid input')
    try {
      return Buffer.from(encrypted, 'base64').toString('utf-8')
    } catch {
      throw new Error('Decryption failed')
    }
  }),

  hash: vi.fn((data: string) => `hash-${data.slice(0, 8)}`),
}

// Mock Email Service
export const mockEmailService = {
  sendEmail: vi.fn(async (request) => {
    if (!request.to || request.to.length === 0) {
      throw new Error('EMAIL_INVALID_RECIPIENT')
    }
    if (!request.subject) {
      throw new Error('EMAIL_MISSING_SUBJECT')
    }
    return {
      messageId: `<msg-${Date.now()}@aura.local>`,
      status: 'sent',
    }
  }),

  syncEmails: vi.fn(async (_options) => {
    return {
      newCount: 5,
      updatedCount: 2,
      errors: [],
    }
  }),

  listEmails: vi.fn(async (_options) => {
    return {
      emails: [],
      total: 0,
      hasMore: false,
    }
  }),

  getEmail: vi.fn(async (id: string) => {
    return {
      id,
      subject: 'Test Email',
      body: 'Test content',
    }
  }),

  markAsRead: vi.fn(async (ids: string[], _isRead: boolean) => {
    return { updated: ids.length }
  }),

  deleteEmail: vi.fn(async (ids: string[], _permanent: boolean) => {
    return { deleted: ids.length }
  }),
}

// Mock Auth Service
export const mockAuthService = {
  connectWallet: vi.fn(async (walletType: string) => {
    if (walletType === 'invalid') {
      throw new Error('AUTH_WALLET_NOT_FOUND')
    }
    return {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      ensName: 'test.eth',
      isNewUser: true,
    }
  }),

  verifySignature: vi.fn(async (message: string, address: string, signature: string) => {
    if (signature === 'invalid') {
      return { success: false, errorCode: 'AUTH_SIGN_FAILED' }
    }
    return { success: true, address }
  }),

  disconnect: vi.fn(async () => {
    return { success: true }
  }),
}

// Mock ENS Service
export const mockENSService = {
  resolveENS: vi.fn(async (name: string) => {
    if (!name.endsWith('.eth')) {
      return null
    }
    if (name === 'nonexistent.eth') {
      return null
    }
    return {
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      avatar: `https://metadata.ens.domains/mainnet/avatar/${name}`,
    }
  }),

  reverseResolve: vi.fn(async (address: string) => {
    if (address === '0x0000000000000000000000000000000000000000') {
      return null
    }
    return 'resolved.eth'
  }),
}

// Mock AI Service
export const mockAIService = {
  generate: vi.fn(async (request) => {
    if (!request.prompt) {
      throw new Error('AI_EMPTY_PROMPT')
    }
    return {
      content: `Generated content for: ${request.prompt}`,
      tokensUsed: 150,
      provider: request.provider || 'openai',
    }
  }),

  generateStream: async function* (request) {
    const content = `Generated content for: ${request.prompt}`
    const words = content.split(' ')
    for (const word of words) {
      yield word + ' '
      await new Promise((r) => setTimeout(r, 10))
    }
  },

  refine: vi.fn(async (request) => {
    return {
      content: `Refined (${request.action}): ${request.content}`,
      diff: 'Minor changes made',
      tokensUsed: 50,
    }
  }),

  classify: vi.fn(async (_request) => {
    return {
      suggestions: [
        {
          tagId: 'work',
          tagName: 'Work',
          confidence: 0.92,
          reason: 'Contains work-related keywords',
        },
      ],
    }
  }),

  getProviders: vi.fn(async () => ({
    providers: [
      { id: 'openai', name: 'OpenAI', isConfigured: true, isLocal: false, models: ['gpt-4', 'gpt-3.5-turbo'] },
      { id: 'claude', name: 'Claude', isConfigured: true, isLocal: false, models: ['claude-3-opus', 'claude-3-sonnet'] },
      { id: 'ollama', name: 'Ollama', isConfigured: false, isLocal: true, models: [] },
    ],
  })),
}

// Mock Connection Manager
export const mockConnectionManager = {
  connect: vi.fn(async () => true),
  disconnect: vi.fn(async () => {}),
  isConnected: vi.fn(() => true),
  healthCheck: vi.fn(async () => true),
  reconnect: vi.fn(async () => true),
  getBackoffDelay: vi.fn((attempt: number) => Math.min(1000 * Math.pow(2, attempt), 30000)),
}

// Mock Network Service
export const mockNetworkService = {
  isOnline: vi.fn(() => true),
  onStatusChange: vi.fn((callback) => {
    callback(true)
    return () => {}
  }),
}

// Reset all mocks
export const resetAllMocks = () => {
  Object.values(mockCryptoService).forEach((mock) => mock.mockClear?.())
  Object.values(mockEmailService).forEach((mock) => mock.mockClear?.())
  Object.values(mockAuthService).forEach((mock) => mock.mockClear?.())
  Object.values(mockENSService).forEach((mock) => mock.mockClear?.())
  Object.values(mockAIService).forEach((mock) => mock.mockClear?.())
  Object.values(mockConnectionManager).forEach((mock) => mock.mockClear?.())
  Object.values(mockNetworkService).forEach((mock) => mock.mockClear?.())
}
