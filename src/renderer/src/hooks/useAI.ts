/**
 * useAI Hook
 * AI 服务调用
 */

import { useState, useCallback } from 'react'
import { invoke } from '../lib/ipc'
import type { AiGenerateResponse, AiRefineResponse, AiClassifyResponse, AiProvider } from '@shared/types/ai.types'

export function useAI() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (request: {
    prompt: string
    agentId?: string
    templateId?: string
    provider?: string
  }) => {
    setIsGenerating(true)
    setError(null)

    try {
      const result = await invoke<AiGenerateResponse>('ai:generate', request)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI generation failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const refine = useCallback(async (request: {
    content: string
    action: 'polish' | 'shorten' | 'expand' | 'formalize' | 'casualize' | 'translate'
    targetLanguage?: string
    instructions?: string
  }) => {
    setIsGenerating(true)
    setError(null)

    try {
      const result = await invoke<AiRefineResponse>('ai:refine', request)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI refinement failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const classify = useCallback(async (emailId: string, availableTags: Array<{ id: string; name: string; description?: string }>) => {
    setIsGenerating(true)
    setError(null)

    try {
      const result = await invoke<AiClassifyResponse>('ai:classify_email', {
        emailId,
        availableTags,
      })
      return result.suggestions
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI classification failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const getProviders = useCallback(async () => {
    try {
      const result = await invoke<{ providers: AiProvider[] }>('ai:providers')
      return result.providers
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get providers'
      setError(errorMessage)
      throw err
    }
  }, [])

  return {
    isGenerating,
    error,
    generate,
    refine,
    classify,
    getProviders,
  }
}
