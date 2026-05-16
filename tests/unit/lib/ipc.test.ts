import { describe, it, expect, vi, beforeEach } from 'vitest'
import { invoke, on } from '../../../src/renderer/src/lib/ipc'

/**
 * IPC Helper Tests
 * 测试 IPC 封装的行为
 */

describe('IPC Helper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('invoke', () => {
    it('成功调用应返回 response.data', async () => {
      window.aura.invoke = vi.fn().mockResolvedValue({
        success: true,
        data: { id: '123', name: 'test' },
      })

      const result = await invoke<{ id: string; name: string }>('email:list')

      expect(result).toEqual({ id: '123', name: 'test' })
    })

    it('失败调用应抛出 response.error.code', async () => {
      window.aura.invoke = vi.fn().mockResolvedValue({
        success: false,
        error: { code: 'EMAIL_SEND_FAILED', message: 'SMTP connection error' },
      })

      await expect(invoke('email:send')).rejects.toThrow('EMAIL_SEND_FAILED')
    })

    it('失败但无 error.code 时应抛出 "Unknown error"', async () => {
      window.aura.invoke = vi.fn().mockResolvedValue({
        success: false,
      })

      await expect(invoke('email:send')).rejects.toThrow('Unknown error')
    })

    it('应该传递参数给 window.aura.invoke', async () => {
      window.aura.invoke = vi.fn().mockResolvedValue({
        success: true,
        data: null,
      })

      await invoke('email:send', { to: ['test@example.com'], subject: 'Hi' })

      expect(window.aura.invoke).toHaveBeenCalledWith(
        'email:send',
        { to: ['test@example.com'], subject: 'Hi' }
      )
    })
  })

  describe('on', () => {
    it('应返回取消订阅回调', () => {
      const mockUnsubscribe = vi.fn()
      window.aura.on = vi.fn().mockReturnValue(mockUnsubscribe)

      const callback = vi.fn()
      const unsubscribe = on('email:sync_progress', callback)

      expect(window.aura.on).toHaveBeenCalledWith('email:sync_progress', callback)
      expect(typeof unsubscribe).toBe('function')

      unsubscribe()
      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })
})
