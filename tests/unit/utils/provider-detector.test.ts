import { describe, it, expect } from 'vitest'

/**
 * Email Provider Detector Unit Tests
 * Tests automatic detection of email service providers
 */

interface ProviderConfig {
  provider: 'gmail' | 'outlook' | 'icloud' | 'yahoo' | 'custom'
  imapHost?: string
  imapPort?: number
  smtpHost?: string
  smtpPort?: number
  authType: 'password' | 'oauth2'
}

function detectProvider(email: string): ProviderConfig {
  const domain = email.split('@')[1]?.toLowerCase()

  const providers: Record<string, ProviderConfig> = {
    'gmail.com': {
      provider: 'gmail',
      imapHost: 'imap.gmail.com',
      imapPort: 993,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 465,
      authType: 'oauth2',
    },
    'googlemail.com': {
      provider: 'gmail',
      imapHost: 'imap.gmail.com',
      imapPort: 993,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 465,
      authType: 'oauth2',
    },
    'outlook.com': {
      provider: 'outlook',
      imapHost: 'outlook.office365.com',
      imapPort: 993,
      smtpHost: 'smtp.office365.com',
      smtpPort: 587,
      authType: 'oauth2',
    },
    'hotmail.com': {
      provider: 'outlook',
      imapHost: 'outlook.office365.com',
      imapPort: 993,
      smtpHost: 'smtp.office365.com',
      smtpPort: 587,
      authType: 'oauth2',
    },
    'live.com': {
      provider: 'outlook',
      imapHost: 'outlook.office365.com',
      imapPort: 993,
      smtpHost: 'smtp.office365.com',
      smtpPort: 587,
      authType: 'oauth2',
    },
    'icloud.com': {
      provider: 'icloud',
      imapHost: 'imap.mail.me.com',
      imapPort: 993,
      smtpHost: 'smtp.mail.me.com',
      smtpPort: 587,
      authType: 'password',
    },
    'me.com': {
      provider: 'icloud',
      imapHost: 'imap.mail.me.com',
      imapPort: 993,
      smtpHost: 'smtp.mail.me.com',
      smtpPort: 587,
      authType: 'password',
    },
    'yahoo.com': {
      provider: 'yahoo',
      imapHost: 'imap.mail.yahoo.com',
      imapPort: 993,
      smtpHost: 'smtp.mail.yahoo.com',
      smtpPort: 465,
      authType: 'password',
    },
  }

  if (domain && providers[domain]) {
    return providers[domain]
  }

  return {
    provider: 'custom',
    authType: 'password',
  }
}

describe('EmailProviderDetector', () => {
  describe('detectProvider', () => {
    describe('Gmail detection', () => {
      it('should detect Gmail from @gmail.com', () => {
        const config = detectProvider('user@gmail.com')

        expect(config.provider).toBe('gmail')
        expect(config.imapHost).toBe('imap.gmail.com')
        expect(config.smtpHost).toBe('smtp.gmail.com')
        expect(config.authType).toBe('oauth2')
      })

      it('should detect Gmail from @googlemail.com', () => {
        const config = detectProvider('user@googlemail.com')

        expect(config.provider).toBe('gmail')
      })
    })

    describe('Outlook detection', () => {
      it('should detect Outlook from @outlook.com', () => {
        const config = detectProvider('user@outlook.com')

        expect(config.provider).toBe('outlook')
        expect(config.imapHost).toBe('outlook.office365.com')
        expect(config.smtpHost).toBe('smtp.office365.com')
      })

      it('should detect Outlook from @hotmail.com', () => {
        const config = detectProvider('user@hotmail.com')

        expect(config.provider).toBe('outlook')
      })

      it('should detect Outlook from @live.com', () => {
        const config = detectProvider('user@live.com')

        expect(config.provider).toBe('outlook')
      })
    })

    describe('iCloud detection', () => {
      it('should detect iCloud from @icloud.com', () => {
        const config = detectProvider('user@icloud.com')

        expect(config.provider).toBe('icloud')
        expect(config.imapHost).toBe('imap.mail.me.com')
        expect(config.smtpHost).toBe('smtp.mail.me.com')
        expect(config.authType).toBe('password')
      })

      it('should detect iCloud from @me.com', () => {
        const config = detectProvider('user@me.com')

        expect(config.provider).toBe('icloud')
      })
    })

    describe('Yahoo detection', () => {
      it('should detect Yahoo from @yahoo.com', () => {
        const config = detectProvider('user@yahoo.com')

        expect(config.provider).toBe('yahoo')
        expect(config.imapHost).toBe('imap.mail.yahoo.com')
      })
    })

    describe('Custom provider', () => {
      it('should return custom for unknown domains', () => {
        const config = detectProvider('user@company.com')

        expect(config.provider).toBe('custom')
        expect(config.imapHost).toBeUndefined()
        expect(config.smtpHost).toBeUndefined()
      })

      it('should return custom for corporate domains', () => {
        const config = detectProvider('user@mycompany.org')

        expect(config.provider).toBe('custom')
      })

      it('should handle subdomains', () => {
        const config = detectProvider('user@mail.company.com')

        expect(config.provider).toBe('custom')
      })
    })

    describe('Edge cases', () => {
      it('should handle uppercase email', () => {
        const config = detectProvider('USER@GMAIL.COM')

        expect(config.provider).toBe('gmail')
      })

      it('should handle mixed case email', () => {
        const config = detectProvider('User@Gmail.com')

        expect(config.provider).toBe('gmail')
      })

      it('should handle email without @', () => {
        const config = detectProvider('notanemail')

        expect(config.provider).toBe('custom')
      })
    })
  })
})
