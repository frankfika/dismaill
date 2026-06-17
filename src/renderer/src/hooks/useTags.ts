import { useState, useEffect, useCallback } from 'react'
import { invoke } from '../lib/ipc'
import { useAuthStore } from '../stores/auth.store'

export interface Tag {
  id: string
  name: string
  color: string
  description?: string
  isAiEnabled: boolean
  emailCount: number
  createdAt: string
}

export interface CreateTagInput {
  name: string
  color: string
  description?: string
  isAiEnabled?: boolean
}

export interface UpdateTagInput {
  id: string
  name?: string
  color?: string
  description?: string
  isAiEnabled?: boolean
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isConnected } = useAuthStore()

  const fetchTags = useCallback(async () => {
    if (!isConnected) {
      setTags([])
      setError(null)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const result = await invoke<Tag[]>('tag:list')
      setTags(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tags')
      console.error('Failed to fetch tags:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isConnected])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const createTag = useCallback(async (input: CreateTagInput): Promise<Tag | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await invoke<{ id: string }>('tag:create', {
        name: input.name,
        color: input.color,
        description: input.description ?? null,
        isAiEnabled: input.isAiEnabled ?? false,
      })
      const newTag: Tag = {
        id: result.id,
        name: input.name,
        color: input.color,
        description: input.description,
        isAiEnabled: input.isAiEnabled ?? false,
        emailCount: 0,
        createdAt: new Date().toISOString(),
      }
      setTags((prev) => [...prev, newTag])
      return newTag
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag')
      console.error('Failed to create tag:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateTag = useCallback(
    async (input: UpdateTagInput): Promise<boolean> => {
      try {
        await invoke('tag:update', {
          id: input.id,
          name: input.name ?? null,
          color: input.color ?? null,
          description: input.description ?? null,
          isAiEnabled: input.isAiEnabled ?? null,
        })
        setTags((prev) =>
          prev.map((t) =>
            t.id === input.id
              ? {
                  ...t,
                  name: input.name ?? t.name,
                  color: input.color ?? t.color,
                  description: input.description ?? t.description,
                  isAiEnabled: input.isAiEnabled ?? t.isAiEnabled,
                }
              : t,
          ),
        )
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update tag')
        console.error('Failed to update tag:', err)
        return false
      }
    },
    [],
  )

  const deleteTag = useCallback(async (tagId: string): Promise<boolean> => {
    try {
      await invoke('tag:delete', { id: tagId })
      setTags((prev) => prev.filter((tag) => tag.id !== tagId))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tag')
      console.error('Failed to delete tag:', err)
      return false
    }
  }, [])

  const applyTag = useCallback(async (emailIds: string[], tagId: string): Promise<boolean> => {
    try {
      await invoke('tag:apply', { emailIds, tagId })
      return true
    } catch (err) {
      console.error('Failed to apply tag:', err)
      return false
    }
  }, [])

  const getSmartFolders = useCallback(async () => {
    try {
      const result = await invoke<Array<{ tagId: string; tagName: string; tagColor: string; unreadCount: number; totalCount: number }>>(
        'tag:smart_folders',
      )
      return result
    } catch (err) {
      console.error('Failed to get smart folders:', err)
      return []
    }
  }, [])

  return {
    tags,
    isLoading,
    error,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    applyTag,
    getSmartFolders,
  }
}
