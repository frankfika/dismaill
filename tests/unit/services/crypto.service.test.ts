import { describe, it, expect, beforeEach } from 'vitest'
import crypto from 'crypto'
import { CryptoService } from '../../../src/main/services/crypto.service'

/**
 * CryptoService Unit Tests
 * Tests encryption, decryption, and key derivation functionality
 */

describe('CryptoService', () => {
  let cryptoService: CryptoService

  beforeEach(() => {
    cryptoService = new CryptoService()
  })

  describe('deriveKeyFromSignature', () => {
    it('should derive consistent key from same signature', () => {
      const signature = '0xabc123def4567890123456789012345678901234'
      const key1 = cryptoService.deriveKeyFromSignature(signature)
      const key2 = cryptoService.deriveKeyFromSignature(signature)

      expect(key1).toEqual(key2)
      expect(key1.length).toBe(32)
    })

    it('should derive different keys for different signatures', () => {
      const key1 = cryptoService.deriveKeyFromSignature('0xabc123def4567890abcd')
      const key2 = cryptoService.deriveKeyFromSignature('0xdef456abc1237890abcd')

      expect(key1).not.toEqual(key2)
    })

    it('should throw error for empty signature', () => {
      expect(() => cryptoService.deriveKeyFromSignature('')).toThrow('Invalid signature')
    })

    it('should throw error for short signature', () => {
      expect(() => cryptoService.deriveKeyFromSignature('short')).toThrow('Invalid signature')
    })
  })

  describe('generateKey', () => {
    it('should generate a 32-byte key', () => {
      const key = cryptoService.generateKey()
      expect(key.length).toBe(32)
    })

    it('should generate different keys on each call', () => {
      const key1 = cryptoService.generateKey()
      const key2 = cryptoService.generateKey()
      expect(key1).not.toEqual(key2)
    })
  })

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt data correctly', () => {
      const plaintext = 'sensitive password'
      const key = crypto.randomBytes(32)

      const encrypted = cryptoService.encrypt(plaintext, key)
      const decrypted = cryptoService.decrypt(encrypted, key)

      expect(decrypted).toBe(plaintext)
      expect(encrypted).not.toBe(plaintext)
    })

    it('should produce different ciphertext for same plaintext', () => {
      const plaintext = 'same content'
      const key = crypto.randomBytes(32)

      const encrypted1 = cryptoService.encrypt(plaintext, key)
      const encrypted2 = cryptoService.encrypt(plaintext, key)

      // With GCM, IV is random so ciphertext should differ
      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should fail decryption with wrong key', () => {
      const encrypted = cryptoService.encrypt('secret data', crypto.randomBytes(32))
      const wrongKey = crypto.randomBytes(32)

      expect(() => cryptoService.decrypt(encrypted, wrongKey)).toThrow('Decryption failed')
    })

    it('should throw error for empty plaintext', () => {
      expect(() => cryptoService.encrypt('', crypto.randomBytes(32))).toThrow('Invalid input')
    })

    it('should throw error for invalid key length', () => {
      expect(() => cryptoService.encrypt('test', Buffer.from('short'))).toThrow('Invalid key length')
    })

    it('should throw error for invalid encrypted data', () => {
      expect(() => cryptoService.decrypt('invalid-base64!!!', crypto.randomBytes(32))).toThrow('Decryption failed')
    })
  })

  describe('hash', () => {
    it('should produce consistent hash for same input', () => {
      const data = 'test data'
      const hash1 = cryptoService.hash(data)
      const hash2 = cryptoService.hash(data)

      expect(hash1).toBe(hash2)
      expect(hash1.length).toBe(64) // SHA-256 hex length
    })

    it('should produce different hash for different input', () => {
      const hash1 = cryptoService.hash('input1')
      const hash2 = cryptoService.hash('input2')

      expect(hash1).not.toBe(hash2)
    })

    it('should throw error for empty input', () => {
      expect(() => cryptoService.hash('')).toThrow('Invalid input')
    })
  })

  describe('encryptCredentials / decryptCredentials', () => {
    it('should encrypt and decrypt credentials', () => {
      const credentials = { password: 'secret123', token: 'token456' }
      const key = crypto.randomBytes(32)

      const encrypted = CryptoService.encryptCredentials(credentials, key)
      const decrypted = CryptoService.decryptCredentials(encrypted, key)

      expect(decrypted).toEqual(credentials)
    })

    it('should produce different encryption for same credentials', () => {
      const credentials = { password: 'secret123' }
      const key = crypto.randomBytes(32)

      const encrypted1 = CryptoService.encryptCredentials(credentials, key)
      const encrypted2 = CryptoService.encryptCredentials(credentials, key)

      expect(encrypted1).not.toBe(encrypted2)
    })
  })
})
