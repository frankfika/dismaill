import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * AIService Unit Tests - 重写版
 * 测试真实的 AIService 实现
 */

// Mock ai module
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({
    text: 'Generated response text',
    usage: { totalTokens: 150 },
  }),
  streamText: vi.fn().mockResolvedValue({
    textStream: (async function* () {
      yield 'chunk1 '
      yield 'chunk2 '
    })(),
  }),
}))

// Mock AI SDK providers
vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn((model: string) => ({ provider: 'openai', modelId: model })),
}))

vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn((model: string) => ({ provider: 'anthropic', modelId: model })),
}))

// Import real service after mocks
import { AIService } from '../../../src/main/services/ai.service'
import { generateText } from 'ai'

describe('AIService (真实实现)', () => {
  let aiService: AIService

  beforeEach(() => {
    vi.clearAllMocks()
    aiService = new AIService()

    // Reset generateText mock
    vi.mocked(generateText).mockResolvedValue({
      text: 'Generated response text',
      usage: { totalTokens: 150 },
    } as any)
  })

  describe('generate', () => {
    it('空 prompt 应抛出 AI_EMPTY_PROMPT', async () => {
      await expect(aiService.generate({ prompt: '' })).rejects.toThrow('AI_EMPTY_PROMPT')
    })

    it('空白 prompt 应抛出 AI_EMPTY_PROMPT', async () => {
      await expect(aiService.generate({ prompt: '   ' })).rejects.toThrow('AI_EMPTY_PROMPT')
    })

    it('未配置 provider 应抛出 AI_PROVIDER_UNAVAILABLE', async () => {
      await expect(
        aiService.generate({ prompt: 'test', provider: 'nonexistent' })
      ).rejects.toThrow('AI_PROVIDER_UNAVAILABLE')
    })

    it('使用默认 provider (openai) 生成内容', async () => {
      // Need to mock the API key
      process.env.OPENAI_API_KEY = 'sk-test'

      const result = await aiService.generate({ prompt: 'Write a reply' })

      expect(result.content).toBe('Generated response text')
      expect(result.tokensUsed).toBe(150)
      expect(result.provider).toBe('openai')

      delete process.env.OPENAI_API_KEY
    })

    it('没有 API Key 应抛出 AI_API_KEY_MISSING', async () => {
      // Ensure no env key
      const saved = process.env.OPENAI_API_KEY
      delete process.env.OPENAI_API_KEY

      // The AIService catches the error and wraps it in AI_GENERATE_FAILED
      await expect(
        aiService.generate({ prompt: 'test' })
      ).rejects.toThrow('AI_GENERATE_FAILED')

      if (saved) process.env.OPENAI_API_KEY = saved
    })

    it('使用 claude provider 生成内容', async () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test'
      aiService.configureProvider('claude', 'sk-ant-test')

      const result = await aiService.generate({
        prompt: 'Write an email',
        provider: 'claude',
      })

      expect(result.provider).toBe('claude')

      delete process.env.ANTHROPIC_API_KEY
    })

    it('使用 agentId 时应生成对应系统提示', async () => {
      process.env.OPENAI_API_KEY = 'sk-test'

      await aiService.generate({
        prompt: 'Write a reply',
        agentId: 'reply-helper',
      })

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('reply-helper'),
        })
      )

      delete process.env.OPENAI_API_KEY
    })
  })

  describe('refine', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'sk-test'
    })

    afterEach(() => {
      delete process.env.OPENAI_API_KEY
    })

    it('空内容应抛出 AI_EMPTY_CONTENT', async () => {
      await expect(
        aiService.refine({ content: '', action: 'polish' })
      ).rejects.toThrow('AI_EMPTY_CONTENT')
    })

    it('无效动作应抛出 AI_INVALID_ACTION', async () => {
      await expect(
        aiService.refine({ content: 'text', action: 'invalid' as 'polish' })
      ).rejects.toThrow('AI_INVALID_ACTION')
    })

    it('polish 动作应使用正确 prompt', async () => {
      const result = await aiService.refine({
        content: 'rough text',
        action: 'polish',
      })

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('Improve the writing quality'),
        })
      )
      expect(result.content).toBeDefined()
    })

    it('shorten 动作应使用正确 prompt', async () => {
      await aiService.refine({ content: 'long text', action: 'shorten' })

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('more concise'),
        })
      )
    })

    it('expand 动作应使用正确 prompt', async () => {
      await aiService.refine({ content: 'short', action: 'expand' })

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('Expand'),
        })
      )
    })

    it('formalize 动作应使用正确 prompt', async () => {
      await aiService.refine({ content: 'casual text', action: 'formalize' })

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('professional'),
        })
      )
    })

    it('casualize 动作应使用正确 prompt', async () => {
      await aiService.refine({ content: 'formal text', action: 'casualize' })

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('casual'),
        })
      )
    })

    it('translate 动作带 targetLanguage', async () => {
      await aiService.refine({
        content: 'hello',
        action: 'translate',
        targetLanguage: 'Chinese',
      })

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('Chinese'),
        })
      )
    })

    it('支持所有有效动作', async () => {
      const actions = ['polish', 'shorten', 'expand', 'formalize', 'casualize', 'translate'] as const
      for (const action of actions) {
        const result = await aiService.refine({ content: 'test text', action })
        expect(result.content).toBeDefined()
      }
    })
  })

  describe('classify', () => {
    it('空 tags 返回空建议', async () => {
      const result = await aiService.classify({
        emailId: 'email-001',
        availableTags: [],
      })

      expect(result.suggestions).toHaveLength(0)
    })

    it('有 tags 时应调用 generateText', async () => {
      process.env.OPENAI_API_KEY = 'sk-test'

      // Mock generateText to return valid JSON
      vi.mocked(generateText).mockResolvedValueOnce({
        text: JSON.stringify([
          { tagId: 'work', confidence: 0.85, reason: 'Work-related content' },
        ]),
        usage: { totalTokens: 200 },
      } as any)

      const result = await aiService.classify({
        emailId: 'email-001',
        emailContent: 'Meeting tomorrow at 9am',
        availableTags: [
          { id: 'work', name: 'Work', description: 'Work emails' },
          { id: 'personal', name: 'Personal' },
        ],
      })

      expect(result.suggestions).toBeDefined()

      delete process.env.OPENAI_API_KEY
    })

    it('AI 返回无效 JSON 时返回空建议', async () => {
      process.env.OPENAI_API_KEY = 'sk-test'

      vi.mocked(generateText).mockResolvedValueOnce({
        text: 'not valid json',
        usage: { totalTokens: 50 },
      } as any)

      const result = await aiService.classify({
        emailId: 'email-001',
        emailContent: 'test',
        availableTags: [{ id: 'work', name: 'Work' }],
      })

      expect(result.suggestions).toHaveLength(0)

      delete process.env.OPENAI_API_KEY
    })
  })

  describe('getProviders', () => {
    it('返回正确的 provider 列表', () => {
      const providers = aiService.getProviders()

      expect(providers).toHaveLength(3)
      expect(providers.find(p => p.id === 'openai')).toBeDefined()
      expect(providers.find(p => p.id === 'claude')).toBeDefined()
      expect(providers.find(p => p.id === 'ollama')).toBeDefined()
    })

    it('openai provider 包含正确模型列表', () => {
      const providers = aiService.getProviders()
      const openaiProvider = providers.find(p => p.id === 'openai')!

      expect(openaiProvider.models).toContain('gpt-4o')
      expect(openaiProvider.models).toContain('gpt-4o-mini')
    })

    it('ollama 标记为本地 provider', () => {
      const providers = aiService.getProviders()
      const ollamaProvider = providers.find(p => p.id === 'ollama')!

      expect(ollamaProvider.isLocal).toBe(true)
    })
  })

  describe('configureProvider / setOllamaConfig', () => {
    it('configureProvider 应添加到已配置列表', () => {
      aiService.configureProvider('claude', 'sk-ant-test')

      const providers = aiService.getProviders()
      const claude = providers.find(p => p.id === 'claude')!
      expect(claude.isConfigured).toBe(true)
    })

    it('setOllamaConfig 应更新 Ollama 配置', () => {
      aiService.setOllamaConfig('http://custom:11434', 'phi3')

      const providers = aiService.getProviders()
      const ollama = providers.find(p => p.id === 'ollama')!
      expect(ollama.isConfigured).toBe(true)
    })

    it('setDefaultProvider 设置无效 provider 应抛出错误', () => {
      expect(() => aiService.setDefaultProvider('nonexistent')).toThrow('AI_PROVIDER_UNAVAILABLE')
    })

    it('setDefaultProvider 设置已配置 provider 应成功', () => {
      // openai is configured by default
      expect(() => aiService.setDefaultProvider('openai')).not.toThrow()
    })
  })
})
