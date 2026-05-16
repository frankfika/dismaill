import { describe, it, expect } from 'vitest'

/**
 * Error Mapper Unit Tests
 * Tests conversion of technical errors to user-friendly messages
 */

interface ErrorMapping {
  code: string
  userMessage: string
  suggestedAction?: string
}

const errorMappings: Record<string, ErrorMapping> = {
  AUTH_WALLET_REJECTED: {
    code: 'AUTH_WALLET_REJECTED',
    userMessage: '您拒绝了钱包连接请求',
    suggestedAction: '请点击重试并批准连接',
  },
  AUTH_WALLET_NOT_FOUND: {
    code: 'AUTH_WALLET_NOT_FOUND',
    userMessage: '未检测到钱包扩展',
    suggestedAction: '请安装 MetaMask 或其他钱包扩展',
  },
  AUTH_SIGN_FAILED: {
    code: 'AUTH_SIGN_FAILED',
    userMessage: '签名验证失败',
    suggestedAction: '请重试签名操作',
  },
  EMAIL_IMAP_AUTH_FAILED: {
    code: 'EMAIL_IMAP_AUTH_FAILED',
    userMessage: '邮箱登录失败',
    suggestedAction: '请检查用户名和密码',
  },
  EMAIL_SMTP_AUTH_FAILED: {
    code: 'EMAIL_SMTP_AUTH_FAILED',
    userMessage: '邮件发送认证失败',
    suggestedAction: '请检查发件箱设置',
  },
  EMAIL_SEND_FAILED: {
    code: 'EMAIL_SEND_FAILED',
    userMessage: '邮件发送失败',
    suggestedAction: '请检查网络连接后重试',
  },
  EMAIL_INVALID_RECIPIENT: {
    code: 'EMAIL_INVALID_RECIPIENT',
    userMessage: '收件人地址格式无效',
    suggestedAction: '请检查邮箱地址是否正确',
  },
  EMAIL_RATE_LIMITED: {
    code: 'EMAIL_RATE_LIMITED',
    userMessage: '操作过于频繁',
    suggestedAction: '请稍后再试',
  },
  AI_PROVIDER_UNAVAILABLE: {
    code: 'AI_PROVIDER_UNAVAILABLE',
    userMessage: 'AI 服务暂时不可用',
    suggestedAction: '请检查 AI 服务配置',
  },
  AI_API_KEY_INVALID: {
    code: 'AI_API_KEY_INVALID',
    userMessage: 'AI API 密钥无效',
    suggestedAction: '请检查 API 密钥设置',
  },
  AI_RATE_LIMITED: {
    code: 'AI_RATE_LIMITED',
    userMessage: 'AI 请求次数已达上限',
    suggestedAction: '请稍后再试或升级套餐',
  },
  NET_OFFLINE: {
    code: 'NET_OFFLINE',
    userMessage: '网络连接已断开',
    suggestedAction: '请检查网络连接',
  },
  NET_TIMEOUT: {
    code: 'NET_TIMEOUT',
    userMessage: '网络请求超时',
    suggestedAction: '请检查网络后重试',
  },
}

function mapErrorToUserMessage(error: Error, context?: string): ErrorMapping {
  // Try to find error code in message
  for (const [code, mapping] of Object.entries(errorMappings)) {
    if (error.message.includes(code)) {
      return mapping
    }
  }

  // Context-based mapping
  if (context === 'IMAP' && (error.message.toLowerCase().includes('auth') || error.message.toLowerCase().includes('credential') || error.message.toLowerCase().includes('login'))) {
    return errorMappings.EMAIL_IMAP_AUTH_FAILED
  }
  if (context === 'SMTP' && error.message.toLowerCase().includes('auth')) {
    return errorMappings.EMAIL_SMTP_AUTH_FAILED
  }
  if (error.message.toLowerCase().includes('rate limit') || error.message.includes('Too many')) {
    return errorMappings.EMAIL_RATE_LIMITED
  }
  if (error.message.toLowerCase().includes('timeout')) {
    return errorMappings.NET_TIMEOUT
  }
  if (error.message.toLowerCase().includes('network') || error.message.includes('offline')) {
    return errorMappings.NET_OFFLINE
  }

  // Default fallback
  return {
    code: 'UNKNOWN_ERROR',
    userMessage: '操作失败，请稍后重试',
  }
}

function formatErrorForUser(mapping: ErrorMapping): string {
  let message = mapping.userMessage
  if (mapping.suggestedAction) {
    message += `。${mapping.suggestedAction}。`
  }
  return message
}

describe('ErrorMapper', () => {
  describe('mapErrorToUserMessage', () => {
    describe('Auth errors', () => {
      it('should map wallet rejected error', () => {
        const error = new Error('AUTH_WALLET_REJECTED: User rejected')
        const mapping = mapErrorToUserMessage(error)

        expect(mapping.code).toBe('AUTH_WALLET_REJECTED')
        expect(mapping.userMessage).toBe('您拒绝了钱包连接请求')
        expect(mapping.suggestedAction).toBeDefined()
      })

      it('should map wallet not found error', () => {
        const error = new Error('AUTH_WALLET_NOT_FOUND')
        const mapping = mapErrorToUserMessage(error)

        expect(mapping.code).toBe('AUTH_WALLET_NOT_FOUND')
        expect(mapping.userMessage).toBe('未检测到钱包扩展')
      })

      it('should map sign failed error', () => {
        const error = new Error('AUTH_SIGN_FAILED: Invalid signature')
        const mapping = mapErrorToUserMessage(error)

        expect(mapping.code).toBe('AUTH_SIGN_FAILED')
      })
    })

    describe('Email errors', () => {
      it('should map IMAP auth error', () => {
        const error = new Error('Invalid credentials')
        const mapping = mapErrorToUserMessage(error, 'IMAP')

        expect(mapping.code).toBe('EMAIL_IMAP_AUTH_FAILED')
        expect(mapping.userMessage).toBe('邮箱登录失败')
      })

      it('should map SMTP auth error', () => {
        const error = new Error('Authentication failed')
        const mapping = mapErrorToUserMessage(error, 'SMTP')

        expect(mapping.code).toBe('EMAIL_SMTP_AUTH_FAILED')
      })

      it('should map send failed error', () => {
        const error = new Error('EMAIL_SEND_FAILED: Connection refused')
        const mapping = mapErrorToUserMessage(error)

        expect(mapping.code).toBe('EMAIL_SEND_FAILED')
      })

      it('should map invalid recipient error', () => {
        const error = new Error('EMAIL_INVALID_RECIPIENT')
        const mapping = mapErrorToUserMessage(error)

        expect(mapping.code).toBe('EMAIL_INVALID_RECIPIENT')
      })
    })

    describe('Rate limiting', () => {
      it('should detect rate limit from message', () => {
        const error = new Error('Too many requests')
        const mapping = mapErrorToUserMessage(error)

        expect(mapping.code).toBe('EMAIL_RATE_LIMITED')
      })

      it('should detect rate limit with explicit code', () => {
        const error = new Error('EMAIL_RATE_LIMITED')
        const mapping = mapErrorToUserMessage(error)

        expect(mapping.code).toBe('EMAIL_RATE_LIMITED')
        expect(mapping.userMessage).toBe('操作过于频繁')
      })
    })

    describe('AI errors', () => {
      it('should map AI provider unavailable', () => {
        const error = new Error('AI_PROVIDER_UNAVAILABLE')
        const mapping = mapErrorToUserMessage(error)

        expect(mapping.code).toBe('AI_PROVIDER_UNAVAILABLE')
        expect(mapping.userMessage).toBe('AI 服务暂时不可用')
      })

      it('should map AI API key invalid', () => {
        const error = new Error('AI_API_KEY_INVALID: Key expired')
        const mapping = mapErrorToUserMessage(error)

        expect(mapping.code).toBe('AI_API_KEY_INVALID')
      })
    })

    describe('Network errors', () => {
      it('should map offline error', () => {
        const error = new Error('Network is offline')
        const mapping = mapErrorToUserMessage(error)

        expect(mapping.code).toBe('NET_OFFLINE')
      })

      it('should map timeout error', () => {
        const error = new Error('Request timeout after 30s')
        const mapping = mapErrorToUserMessage(error)

        expect(mapping.code).toBe('NET_TIMEOUT')
      })
    })

    describe('Unknown errors', () => {
      it('should return generic message for unknown error', () => {
        const error = new Error('Some random error')
        const mapping = mapErrorToUserMessage(error)

        expect(mapping.code).toBe('UNKNOWN_ERROR')
        expect(mapping.userMessage).toBe('操作失败，请稍后重试')
      })

      it('should handle empty error message', () => {
        const error = new Error('')
        const mapping = mapErrorToUserMessage(error)

        expect(mapping.code).toBe('UNKNOWN_ERROR')
      })
    })
  })

  describe('formatErrorForUser', () => {
    it('should format error with suggested action', () => {
      const mapping = errorMappings.AUTH_WALLET_NOT_FOUND
      const formatted = formatErrorForUser(mapping)

      expect(formatted).toContain('未检测到钱包扩展')
      expect(formatted).toContain('请安装')
    })

    it('should format error without suggested action', () => {
      const mapping: ErrorMapping = {
        code: 'TEST_ERROR',
        userMessage: '测试错误',
      }
      const formatted = formatErrorForUser(mapping)

      expect(formatted).toBe('测试错误')
    })
  })
})
