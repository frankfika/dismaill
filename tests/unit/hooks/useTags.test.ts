import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTags } from '../../../src/renderer/src/hooks/useTags'

/**
 * useTags Hook Tests
 * 测试标签管理 hook 的行为
 * 发现的 BUG 用 // BUG: 标注
 */

// Mock ipc
vi.mock('../../../src/renderer/src/lib/ipc', () => ({
  invoke: vi.fn().mockResolvedValue([]),
}))

// Mock auth store
const mockAuthStore = {
  isConnected: true,
}

vi.mock('../../../src/renderer/src/stores/auth.store', () => ({
  useAuthStore: () => mockAuthStore,
}))

import { invoke } from '../../../src/renderer/src/lib/ipc'

describe('useTags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.isConnected = true
    vi.mocked(invoke).mockResolvedValue([] as any)
  })

  describe('fetchTags', () => {
    it('应调用 invoke("tag:list")', async () => {
      const mockTags = [
        { id: '1', name: 'Work', color: '#6366F1', isAiEnabled: false, emailCount: 5, createdAt: '2024-01-01' },
      ]
      vi.mocked(invoke).mockResolvedValueOnce(mockTags as any)

      renderHook(() => useTags())

      // useEffect 会自动调用 fetchTags
      await act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      expect(invoke).toHaveBeenCalledWith('tag:list')
    })

    it('未连接时应设置空标签', async () => {
      mockAuthStore.isConnected = false

      const { result } = renderHook(() => useTags())

      await act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      expect(result.current.tags).toHaveLength(0)
    })
  })

  describe('createTag', () => {
    it('应调用 IPC 并更新本地状态', async () => {
      vi.mocked(invoke).mockResolvedValueOnce([] as any) // Initial fetchTags
      vi.mocked(invoke).mockResolvedValueOnce({ id: 'new-tag-id' } as any)

      const { result } = renderHook(() => useTags())

      await act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      let newTag: any = null
      await act(async () => {
        newTag = await result.current.createTag({
          name: 'New Tag',
          color: '#FF0000',
          description: 'A test tag',
          isAiEnabled: true,
        })
      })

      expect(invoke).toHaveBeenCalledWith('tag:create', expect.objectContaining({
        name: 'New Tag',
        color: '#FF0000',
      }))
      expect(newTag).not.toBeNull()
      expect(result.current.tags).toHaveLength(1)
      expect(result.current.tags[0].name).toBe('New Tag')
    })

    it('IPC 失败时应返回 null', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(invoke).mockResolvedValueOnce([] as any) // Initial fetchTags
      vi.mocked(invoke).mockRejectedValueOnce(new Error('Create failed'))

      const { result } = renderHook(() => useTags())

      await act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      let newTag: any = 'initial'
      await act(async () => {
        newTag = await result.current.createTag({ name: 'Fail', color: '#000' })
      })

      expect(newTag).toBeNull()
      expect(result.current.error).toBe('Create failed')
      errorSpy.mockRestore()
    })
  })

  describe('updateTag', () => {
    it('应调用 IPC 更新后端并更新本地状态', async () => {
      const mockTags = [
        { id: '1', name: 'Work', color: '#6366F1', isAiEnabled: false, emailCount: 5, createdAt: '2024-01-01' },
      ]
      vi.mocked(invoke).mockResolvedValueOnce(mockTags as any)
      vi.mocked(invoke).mockResolvedValueOnce(undefined as any)

      const { result } = renderHook(() => useTags())

      await act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      await act(async () => {
        await result.current.updateTag({ id: '1', name: 'Updated' })
      })

      expect(invoke).toHaveBeenCalledWith('tag:update', expect.objectContaining({
        id: '1',
        name: 'Updated',
      }))

      expect(result.current.tags[0].name).toBe('Updated')
    })
  })

  describe('deleteTag', () => {
    it('应调用 IPC 删除后端并更新本地状态', async () => {
      const mockTags = [
        { id: '1', name: 'Work', color: '#6366F1', isAiEnabled: false, emailCount: 5, createdAt: '2024-01-01' },
      ]
      vi.mocked(invoke).mockResolvedValueOnce(mockTags as any)
      vi.mocked(invoke).mockResolvedValueOnce(undefined as any)

      const { result } = renderHook(() => useTags())

      await act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      await act(async () => {
        await result.current.deleteTag('1')
      })

      expect(invoke).toHaveBeenCalledWith('tag:delete', { id: '1' })

      expect(result.current.tags).toHaveLength(0)
    })
  })

  describe('applyTag', () => {
    it('应调用 IPC 应用标签', async () => {
      vi.mocked(invoke).mockResolvedValueOnce([] as any) // Initial fetchTags
      vi.mocked(invoke).mockResolvedValueOnce(undefined as any)

      const { result } = renderHook(() => useTags())

      await act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      let success: boolean = false
      await act(async () => {
        success = await result.current.applyTag(['email-1', 'email-2'], 'tag-1')
      })

      expect(success).toBe(true)
      expect(invoke).toHaveBeenCalledWith('tag:apply', { emailIds: ['email-1', 'email-2'], tagId: 'tag-1' })
    })
  })
})
