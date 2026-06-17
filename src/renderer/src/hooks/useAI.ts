/**
 * useAI Hook
 * AI 服务调用
 */
import { useCallback } from 'react'
import { invoke } from '../lib/ipc'
import type {
  AiGenerateResponse,
  AiRefineResponse,
  AiClassifyResponse,
  AiProvider,
} from '@shared/types/ai.types'
import type { ReplySkill } from '@shared/types/skill.types'

export function useAI() {
  const generate = useCallback(async (request: {
    prompt: string
    agentId?: string
    templateId?: string
    provider?: string
    skill?: ReplySkill | null
  }) => {
    try {
      const result = await invoke<AiGenerateResponse>('ai:generate', {
        prompt: request.prompt,
        agentId: request.agentId ?? null,
        templateId: request.templateId ?? null,
        context: null,
        provider: request.provider ?? null,
        model: null,
        maxTokens: null,
        stream: null,
        requestId: null,
        skill: request.skill ?? null,
      })
      return result
    } catch (err) {
      throw err instanceof Error ? err : new Error('AI generation failed')
    }
  }, [])

  const refine = useCallback(async (request: {
    content: string
    action: 'polish' | 'shorten' | 'expand' | 'formalize' | 'casualize' | 'translate'
    targetLanguage?: string
    instructions?: string
    provider?: string
    skill?: ReplySkill | null
  }) => {
    try {
      const result = await invoke<AiRefineResponse>('ai:refine', {
        content: request.content,
        action: request.action,
        targetLanguage: request.targetLanguage ?? null,
        instructions: request.instructions ?? null,
        provider: request.provider ?? null,
        model: null,
        skill: request.skill ?? null,
      })
      return result
    } catch (err) {
      throw err instanceof Error ? err : new Error('AI refinement failed')
    }
  }, [])

  const classify = useCallback(
    async (
      emailId: string,
      availableTags: Array<{ id: string; name: string; description?: string }>,
      emailContent?: string,
    ) => {
      try {
        const result = await invoke<AiClassifyResponse>('ai:classify_email', {
          emailId,
          emailContent: emailContent ?? null,
          availableTags,
          provider: null,
          model: null,
        })
        return result.suggestions
      } catch (err) {
        throw err instanceof Error ? err : new Error('AI classification failed')
      }
    },
    [],
  )

  const getProviders = useCallback(async () => {
    try {
      const result = await invoke<{ providers: AiProvider[] }>('ai:providers')
      return result.providers
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to get providers')
    }
  }, [])

  return { generate, refine, classify, getProviders }
}
