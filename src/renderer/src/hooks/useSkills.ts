/**
 * useSkills Hook
 * Reply-skill CRUD. Each skill is a user-trained template that gets
 * injected into AI generation / refinement calls.
 */
import { useCallback, useEffect, useState } from 'react'
import { invoke } from '../lib/ipc'
import { useAuthStore } from '../stores/auth.store'
import type {
  CreateReplySkillInput,
  ReplySkill,
  UpdateReplySkillInput,
} from '@shared/types/skill.types'

export function useSkills() {
  const [skills, setSkills] = useState<ReplySkill[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isConnected } = useAuthStore()

  const fetchSkills = useCallback(async () => {
    if (!isConnected) {
      setSkills([])
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const result = await invoke<ReplySkill[]>('skill:list')
      setSkills(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch skills')
      console.error('Failed to fetch skills:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isConnected])

  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  const createSkill = useCallback(
    async (input: CreateReplySkillInput): Promise<ReplySkill | null> => {
      setIsLoading(true)
      setError(null)
      try {
        const created = await invoke<ReplySkill>('skill:create', {
          name: input.name,
          description: input.description,
          triggerCategories: input.triggerCategories,
          tone: input.tone,
          language: input.language,
          maxLength: input.maxLength,
          includeSignature: input.includeSignature,
          systemPrompt: input.systemPrompt,
          examples: input.examples,
          replyTemplate: input.replyTemplate,
        })
        setSkills((prev) => [...prev, created])
        return created
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create skill')
        console.error('Failed to create skill:', err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const updateSkill = useCallback(
    async (input: UpdateReplySkillInput): Promise<ReplySkill | null> => {
      setIsLoading(true)
      setError(null)
      try {
        const updated = await invoke<ReplySkill>('skill:update', {
          id: input.id,
          name: input.name,
          description: input.description,
          triggerCategories: input.triggerCategories,
          tone: input.tone,
          language: input.language,
          maxLength: input.maxLength,
          includeSignature: input.includeSignature,
          systemPrompt: input.systemPrompt,
          examples: input.examples,
          replyTemplate: input.replyTemplate,
        })
        setSkills((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
        return updated
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update skill')
        console.error('Failed to update skill:', err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const deleteSkill = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      await invoke('skill:delete', { id })
      setSkills((prev) => prev.filter((s) => s.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete skill')
      console.error('Failed to delete skill:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  /** Load a single skill (e.g. when the compose view wants to render the
   *  current selection). */
  const getSkill = useCallback(async (id: string): Promise<ReplySkill | null> => {
    try {
      const skill = await invoke<ReplySkill | null>('skill:get', { id })
      return skill
    } catch (err) {
      console.error('Failed to get skill:', err)
      return null
    }
  }, [])

  /** Tell the backend this skill was actually used. */
  const recordUse = useCallback(async (id: string): Promise<void> => {
    try {
      await invoke('skill:incr_use', { id })
      setSkills((prev) =>
        prev.map((s) => (s.id === id ? { ...s, useCount: (s.useCount || 0) + 1 } : s)),
      )
    } catch (err) {
      console.warn('Failed to record skill use:', err)
    }
  }, [])

  return {
    skills,
    isLoading,
    error,
    fetchSkills,
    createSkill,
    updateSkill,
    deleteSkill,
    getSkill,
    recordUse,
  }
}
