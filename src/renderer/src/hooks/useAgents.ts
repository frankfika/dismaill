/**
 * useAgents Hook
 * Reply-agent CRUD. Each agent is a named "persona" the user can switch
 * between when composing an email — independent from but composable with
 * a reply-skill.
 */
import { useCallback, useEffect, useState } from 'react'
import { invoke } from '../lib/ipc'
import { useAuthStore } from '../stores/auth.store'
import type {
  CreateReplyAgentInput,
  ReplyAgent,
  UpdateReplyAgentInput,
} from '@shared/types/agent.types'

export function useAgents() {
  const [agents, setAgents] = useState<ReplyAgent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isConnected } = useAuthStore()

  const fetchAgents = useCallback(async () => {
    if (!isConnected) {
      setAgents([])
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const result = await invoke<ReplyAgent[]>('agent:list')
      setAgents(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents')
      console.error('Failed to fetch agents:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isConnected])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const createAgent = useCallback(
    async (input: CreateReplyAgentInput): Promise<ReplyAgent | null> => {
      setIsLoading(true)
      setError(null)
      try {
        const created = await invoke<ReplyAgent>('agent:create', {
          name: input.name,
          description: input.description,
          icon: input.icon,
          systemPrompt: input.systemPrompt,
          provider: input.provider,
          model: input.model,
          temperature: input.temperature,
          maxTokens: input.maxTokens,
          defaultSkillId: input.defaultSkillId,
          triggerCategories: input.triggerCategories,
        })
        setAgents((prev) => [...prev, created])
        return created
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create agent')
        console.error('Failed to create agent:', err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const updateAgent = useCallback(
    async (input: UpdateReplyAgentInput): Promise<ReplyAgent | null> => {
      setIsLoading(true)
      setError(null)
      try {
        const updated = await invoke<ReplyAgent>('agent:update', {
          id: input.id,
          name: input.name,
          description: input.description,
          icon: input.icon,
          systemPrompt: input.systemPrompt,
          provider: input.provider,
          model: input.model,
          temperature: input.temperature,
          maxTokens: input.maxTokens,
          defaultSkillId: input.defaultSkillId,
          triggerCategories: input.triggerCategories,
        })
        setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
        return updated
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update agent')
        console.error('Failed to update agent:', err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const deleteAgent = useCallback(async (id: string): Promise<boolean> => {
    try {
      await invoke('agent:delete', { id })
      setAgents((prev) => prev.filter((a) => a.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent')
      console.error('Failed to delete agent:', err)
      return false
    }
  }, [])

  const getAgent = useCallback(async (id: string): Promise<ReplyAgent | null> => {
    try {
      const agent = await invoke<ReplyAgent | null>('agent:get', { id })
      return agent
    } catch (err) {
      console.error('Failed to get agent:', err)
      return null
    }
  }, [])

  const recordUse = useCallback(async (id: string) => {
    try {
      await invoke('agent:incr_use', { id })
      setAgents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, useCount: (a.useCount || 0) + 1 } : a)),
      )
    } catch (err) {
      console.warn('Failed to record agent use:', err)
    }
  }, [])

  return {
    agents,
    isLoading,
    error,
    fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    getAgent,
    recordUse,
  }
}
