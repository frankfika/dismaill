import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mockIpcRenderer, registerIpcHandler, clearIpcHandlers } from '../mocks/electron.mock'
import type { IpcResponse } from '../../src/shared/types/ipc.types'
import type { AuthConnectResponse, AuthSignResponse } from '../../src/shared/types/wallet.types'
import { WalletFactory } from '../factories/wallet.factory'

/**
 * Auth IPC Integration Tests
 * Tests the full authentication flow through IPC
 */

describe('Auth IPC Integration', () => {
  beforeEach(() => {
    clearIpcHandlers()
  })

  afterEach(() => {
    clearIpcHandlers()
  })

  describe('auth:connect', () => {
    it('should connect MetaMask wallet successfully', async () => {
      const mockWallet = WalletFactory.buildWithENS('test.eth')

      registerIpcHandler('auth:connect', async (request: { walletType: string }) => {
        if (request.walletType === 'metamask') {
          return {
            success: true,
            data: {
              address: mockWallet.address,
              ensName: mockWallet.ensName,
              avatarUrl: mockWallet.avatarUrl,
              isNewUser: true,
            } as AuthConnectResponse,
          }
        }
        return {
          success: false,
          error: { code: 'AUTH_WALLET_NOT_FOUND', message: 'Wallet not found' },
        }
      })

      const response = (await mockIpcRenderer.invoke('auth:connect', {
        walletType: 'metamask',
      })) as IpcResponse<AuthConnectResponse>

      expect(response.success).toBe(true)
      expect(response.data?.address).toBe(mockWallet.address)
      expect(response.data?.ensName).toBe('test.eth')
      expect(response.data?.isNewUser).toBe(true)
    })

    it('should connect WalletConnect successfully', async () => {
      const mockWallet = WalletFactory.build()

      registerIpcHandler('auth:connect', async (request: { walletType: string }) => ({
        success: true,
        data: {
          address: mockWallet.address,
          isNewUser: true,
        },
      }))

      const response = await mockIpcRenderer.invoke('auth:connect', {
        walletType: 'walletconnect',
      })

      expect(response.success).toBe(true)
      expect(response.data.address).toBeDefined()
    })

    it('should handle wallet not found error', async () => {
      registerIpcHandler('auth:connect', async () => ({
        success: false,
        error: {
          code: 'AUTH_WALLET_NOT_FOUND',
          message: 'No wallet extension detected',
        },
      }))

      const response = await mockIpcRenderer.invoke('auth:connect', {
        walletType: 'metamask',
      })

      expect(response.success).toBe(false)
      expect(response.error?.code).toBe('AUTH_WALLET_NOT_FOUND')
    })

    it('should handle user rejection', async () => {
      registerIpcHandler('auth:connect', async () => ({
        success: false,
        error: {
          code: 'AUTH_WALLET_REJECTED',
          message: 'User rejected the connection request',
        },
      }))

      const response = await mockIpcRenderer.invoke('auth:connect', {
        walletType: 'metamask',
      })

      expect(response.success).toBe(false)
      expect(response.error?.code).toBe('AUTH_WALLET_REJECTED')
    })

    it('should detect returning users', async () => {
      registerIpcHandler('auth:connect', async () => ({
        success: true,
        data: {
          address: '0x1234...',
          isNewUser: false,
        },
      }))

      const response = await mockIpcRenderer.invoke('auth:connect', {
        walletType: 'metamask',
      })

      expect(response.data.isNewUser).toBe(false)
    })
  })

  describe('auth:sign', () => {
    it('should sign message successfully', async () => {
      registerIpcHandler('auth:sign', async (request: { message: string; purpose: string }) => ({
        success: true,
        data: {
          signature: '0x' + 'a'.repeat(130),
        } as AuthSignResponse,
      }))

      const response = await mockIpcRenderer.invoke('auth:sign', {
        message: 'Sign to verify your identity',
        purpose: 'verify',
      })

      expect(response.success).toBe(true)
      expect(response.data?.signature).toMatch(/^0x[a-fA-F0-9]+$/)
    })

    it('should handle sign rejection', async () => {
      registerIpcHandler('auth:sign', async () => ({
        success: false,
        error: {
          code: 'AUTH_SIGN_FAILED',
          message: 'User rejected signing request',
        },
      }))

      const response = await mockIpcRenderer.invoke('auth:sign', {
        message: 'Test message',
        purpose: 'verify',
      })

      expect(response.success).toBe(false)
      expect(response.error?.code).toBe('AUTH_SIGN_FAILED')
    })

    it('should support different signing purposes', async () => {
      const purposes = ['decrypt', 'verify', 'export']

      registerIpcHandler('auth:sign', async (request: { purpose: string }) => ({
        success: true,
        data: {
          signature: `signature-for-${request.purpose}`,
        },
      }))

      for (const purpose of purposes) {
        const response = await mockIpcRenderer.invoke('auth:sign', {
          message: 'Test',
          purpose,
        })

        expect(response.success).toBe(true)
        expect(response.data.signature).toBe(`signature-for-${purpose}`)
      }
    })
  })

  describe('auth:disconnect', () => {
    it('should disconnect wallet successfully', async () => {
      registerIpcHandler('auth:disconnect', async () => ({
        success: true,
        data: undefined,
      }))

      const response = await mockIpcRenderer.invoke('auth:disconnect')

      expect(response.success).toBe(true)
    })
  })

  describe('Full auth flow', () => {
    it('should complete full authentication flow', async () => {
      // Step 1: Connect wallet
      registerIpcHandler('auth:connect', async () => ({
        success: true,
        data: {
          address: '0xabcdef1234567890',
          ensName: 'user.eth',
          isNewUser: true,
        },
      }))

      const connectResponse = await mockIpcRenderer.invoke('auth:connect', {
        walletType: 'metamask',
      })
      expect(connectResponse.success).toBe(true)

      // Step 2: Sign message
      registerIpcHandler('auth:sign', async () => ({
        success: true,
        data: {
          signature: '0xsigned',
        },
      }))

      const signResponse = await mockIpcRenderer.invoke('auth:sign', {
        message: 'Sign to continue',
        purpose: 'verify',
      })
      expect(signResponse.success).toBe(true)
      expect(signResponse.data.signature).toBeDefined()
    })
  })
})
