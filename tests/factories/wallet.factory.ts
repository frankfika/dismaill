import type { Wallet } from '../../src/shared/types/wallet.types'

let idCounter = 0

export const WalletFactory = {
  build: (overrides: Partial<Wallet> = {}): Wallet => ({
    address: `0x${(++idCounter).toString(16).padStart(40, '0')}`,
    ensName: null,
    avatarUrl: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  }),

  buildWithENS: (ensName = 'alice.eth'): Wallet =>
    WalletFactory.build({
      ensName,
      avatarUrl: `https://metadata.ens.domains/mainnet/avatar/${ensName}`,
    }),

  buildMany: (count: number, overrides: Partial<Wallet> = {}): Wallet[] =>
    Array.from({ length: count }, () => WalletFactory.build(overrides)),
}

export const SignatureFactory = {
  build: (overrides = {}) => ({
    id: `sig-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    accountId: 'test-account',
    name: 'Default Signature',
    content: '<p>Best regards,<br>Test User</p>',
    isDefault: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  }),

  buildMany: (count: number, overrides = {}) =>
    Array.from({ length: count }, (_, i) =>
      SignatureFactory.build({
        name: `Signature ${i + 1}`,
        isDefault: i === 0,
        ...overrides,
      })
    ),
}

export const TagFactory = {
  build: (overrides = {}) => ({
    id: `tag-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: 'Work',
    color: '#8B5CF6',
    description: 'Work-related emails',
    isAiEnabled: true,
    emailCount: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  }),

  buildMany: (names: string[] = ['Work', 'Personal', 'Finance', 'Travel']): Array<ReturnType<typeof TagFactory.build>> =>
    names.map((name, i) =>
      TagFactory.build({
        name,
        color: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'][i % 4],
      })
    ),
}
