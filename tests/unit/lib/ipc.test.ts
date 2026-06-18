import { describe, it, expect, vi, beforeEach } from 'vitest'
import { invoke, invokeWrapped, on } from '../../../src/renderer/src/lib/ipc'

// Need to import the mocked module to set mock implementations
import { invoke as tauriInvoke } from '@tauri-apps/api/core'

const mockTauriInvoke = vi.mocked(tauriInvoke)

describe('IPC Helper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('invoke', () => {
    it('成功调用应返回数据', async () => {
      mockTauriInvoke.mockResolvedValue({ id: '123', name: 'test' })

      const result = await invoke<{ id: string; name: string }>('email:list')

      expect(result).toEqual({ id: '123', name: 'test' })
      expect(mockTauriInvoke).toHaveBeenCalledWith('email_list', {})
    })

    it('失败调用应抛出错误', async () => {
      mockTauriInvoke.mockRejectedValue(new Error('SMTP connection error'))

      await expect(invoke('email:send')).rejects.toThrow('SMTP connection error')
    })

    it('应该传递参数并转换 channel 名', async () => {
      mockTauriInvoke.mockResolvedValue(null)

      await invoke('email:send', { to: ['test@example.com'], subject: 'Hi' })

      expect(mockTauriInvoke).toHaveBeenCalledWith(
        'email_send',
        { to: ['test@example.com'], subject: 'Hi' }
      )
    })

    it('rejects primitive payloads', async () => {
      mockTauriInvoke.mockResolvedValue(null)
      await invoke('email:send', 'just-a-string')
      expect(mockTauriInvoke).toHaveBeenLastCalledWith('email_send', {})
    })

    it('rejects null payloads', async () => {
      mockTauriInvoke.mockResolvedValue(null)
      await invoke('email:send', null)
      expect(mockTauriInvoke).toHaveBeenLastCalledWith('email_send', {})
    })

    it('rejects array payloads (forces object form)', async () => {
      mockTauriInvoke.mockResolvedValue(null)
      await invoke('email:send', ['a', 'b'])
      expect(mockTauriInvoke).toHaveBeenLastCalledWith('email_send', {})
    })
  })

  describe('invokeWrapped', () => {
    it('成功调用应返回 { success, data }', async () => {
      mockTauriInvoke.mockResolvedValue({ id: '123' })

      const result = await invokeWrapped<{ id: string }>('email:list')

      expect(result).toEqual({ success: true, data: { id: '123' } })
    })

    it('失败调用应返回 { success, false, error }', async () => {
      mockTauriInvoke.mockRejectedValue(new Error('Network error'))

      const result = await invokeWrapped('email:send')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INVOKE_ERROR')
      expect(result.error?.message).toBe('Network error')
    })
  })

  describe('on', () => {
    it('应返回取消订阅回调', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const callback = vi.fn()
      const unsubscribe = on('email:sync_progress', callback)

      expect(typeof unsubscribe).toBe('function')
      expect(warnSpy).toHaveBeenCalledWith('Event listening not yet implemented for channel: email:sync_progress')
      warnSpy.mockRestore()
    })
  })
})
