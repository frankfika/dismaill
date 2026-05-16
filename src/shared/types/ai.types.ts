// AI Types
export interface AiGenerateRequest {
  agentId?: string
  templateId?: string
  prompt: string
  context?: {
    replyTo?: string
    threadHistory?: string[]
  }
  provider?: string
  model?: string
  maxTokens?: number
  stream?: boolean
}

export interface AiGenerateResponse {
  content: string
  tokensUsed: number
  provider: string
}

export interface AiRefineRequest {
  content: string
  action: 'polish' | 'shorten' | 'expand' | 'formalize' | 'casualize' | 'translate'
  targetLanguage?: string
  instructions?: string
}

export interface AiRefineResponse {
  content: string
  diff?: string
  tokensUsed: number
}

export interface AiClassifyRequest {
  emailId: string
  emailContent?: string
  availableTags: Array<{ id: string; name: string; description?: string }>
}

export interface AiClassifyResponse {
  suggestions: Array<{
    tagId: string
    tagName: string
    confidence: number
    reason: string
  }>
}

export interface AiProvider {
  id: string
  name: string
  isConfigured: boolean
  isLocal: boolean
  models: string[]
}
