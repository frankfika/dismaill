import { describe, it, expect, beforeEach } from 'vitest'
import { AuthService } from '../../../src/main/services/auth.service'

/**
 * AuthService Unit Tests
 * Tests wallet authentication and signature verification
 */

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    authService = new AuthService()
  })

  describe('connectWallet', () => {
    it('should connect MetaMask wallet successfully', async () => {
      const result = await authService.connectWallet({ walletType: 'metamask' })

      expect(result.address).toBeDefined()
      expect(result.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
      expect(result.ensName).toBe('test.eth')
      expect(result.isNewUser).toBe(true)
    })

    it('should connect WalletConnect wallet successfully', async () => {
      const result = await authService.connectWallet({ walletType: 'walletconnect' })

      expect(result.address).toBeDefined()
      expect(result.isNewUser).toBe(true)
    })

    it('should connect Coinbase wallet successfully', async () => {
      const result = await authService.connectWallet({ walletType: 'coinbase' })

      expect(result.address).toBeDefined()
    })

    it('should throw error for invalid wallet type', async () => {
      await expect(authService.connectWallet({ walletType: 'invalid' as 'metamask' })).rejects.toThrow('AUTH_WALLET_NOT_FOUND')
    })

    it('should set current wallet after connection', async () => {
      await authService.connectWallet({ walletType: 'metamask' })

      expect(authService.isConnected()).toBe(true)
      expect(authService.getCurrentWallet()).toBeDefined()
    })
  })

  describe('verifySignature', () => {
    it('should verify valid signature', async () => {
      const message = 'Sign this message to verify your identity'
      const address = '0x1234567890abcdef1234567890abcdef12345678'
      const signature = '0xvalidsignature1234567890abcdef1234567890abcdef1234567890abcdef1234'

      const result = await authService.verifySignature(message, address, signature)

      expect(result.success).toBe(true)
      expect(result.address).toBe(address)
    })

    it('should reject invalid signature', async () => {
      const result = await authService.verifySignature('message', '0x1234...', 'invalid')

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('AUTH_SIGN_FAILED')
    })

    it('should reject empty signature', async () => {
      const result = await authService.verifySignature('message', '0x1234...', '')

      expect(result.success).toBe(false)
    })

    it('should reject empty message', async () => {
      const result = await authService.verifySignature('', '0x1234...', 'signature')

      expect(result.success).toBe(false)
    })
  })

  describe('signMessage', () => {
    it('should sign message successfully when wallet connected', async () => {
      await authService.connectWallet({ walletType: 'metamask' })

      const result = await authService.signMessage('Test message', 'verify')

      expect(result.signature).toBeDefined()
      expect(result.signature).toMatch(/^0x[a-fA-F0-9]+$/)
      expect(result.timestamp).toBeDefined()
      expect(result.nonce).toBeDefined()
    })

    it('should throw error when no wallet connected', async () => {
      await expect(authService.signMessage('Test', 'verify')).rejects.toThrow(
        'AUTH_NO_WALLET_CONNECTED'
      )
    })

    it('should support different purposes', async () => {
      await authService.connectWallet({ walletType: 'metamask' })

      const decryptResult = await authService.signMessage('Test', 'decrypt')
      const verifyResult = await authService.signMessage('Test', 'verify')
      const exportResult = await authService.signMessage('Test', 'export')

      expect(decryptResult.signature).toBeDefined()
      expect(verifyResult.signature).toBeDefined()
      expect(exportResult.signature).toBeDefined()
    })

    it('should generate different signatures for same message', async () => {
      await authService.connectWallet({ walletType: 'metamask' })

      const result1 = await authService.signMessage('Test message', 'verify')
      const result2 = await authService.signMessage('Test message', 'verify')

      // Due to timestamp and entropy, signatures should differ
      expect(result1.signature).not.toBe(result2.signature)
      expect(result1.nonce).not.toBe(result2.nonce)
    })
  })

  describe('disconnect', () => {
    it('should disconnect wallet successfully', async () => {
      await authService.connectWallet({ walletType: 'metamask' })
      expect(authService.isConnected()).toBe(true)

      const result = await authService.disconnect()

      expect(result.success).toBe(true)
      expect(authService.isConnected()).toBe(false)
      expect(authService.getCurrentWallet()).toBeNull()
    })

    it('should handle disconnect when not connected', async () => {
      const result = await authService.disconnect()

      expect(result.success).toBe(true)
    })
  })

  describe('connection state', () => {
    it('should return false for isConnected initially', () => {
      expect(authService.isConnected()).toBe(false)
    })

    it('should return null for getCurrentWallet initially', () => {
      expect(authService.getCurrentWallet()).toBeNull()
    })
  })

  describe('setWallet', () => {
    it('应该设置钱包信息', () => {
      authService.setWallet({
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
        ensName: 'custom.eth',
        avatarUrl: 'https://example.com/avatar.png',
      })

      expect(authService.isConnected()).toBe(true)
      const wallet = authService.getCurrentWallet()
      expect(wallet?.address).toBe('0xabcdef1234567890abcdef1234567890abcdef12')
      expect(wallet?.ensName).toBe('custom.eth')
      expect(wallet?.avatarUrl).toBe('https://example.com/avatar.png')
    })

    it('设置钱包后应能调用 signMessage', async () => {
      authService.setWallet({
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
      })

      const result = await authService.signMessage('Test', 'verify')
      expect(result.signature).toBeDefined()
    })
  })

  describe('signMessage 签名内容验证', () => {
    it('签名应包含 purpose/timestamp/nonce', async () => {
      await authService.connectWallet({ walletType: 'metamask' })

      const result = await authService.signMessage('Test message', 'decrypt')

      // 验证返回值包含 timestamp 和 nonce
      expect(result.timestamp).toBeGreaterThan(0)
      expect(result.nonce).toBeDefined()
      expect(result.nonce!.length).toBeGreaterThan(0)
      // 签名应该是以 0x 开头的 hex 字符串
      expect(result.signature).toMatch(/^0x[a-fA-F0-9]+$/)
    })
  })
})
