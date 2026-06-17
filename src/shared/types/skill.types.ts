// Reply-skill types. Mirrors `models::skill` in the Rust backend.
export type SkillTone =
  | 'formal'
  | 'casual'
  | 'friendly'
  | 'firm'
  | 'apologetic'
  | 'enthusiastic'
  | 'concise'

export type SkillLanguage = 'auto' | 'zh' | 'en' | string

export interface ReplySkillExample {
  incoming: string
  outgoing: string
}

export interface ReplySkill {
  id: string
  walletAddress: string
  name: string
  description: string
  triggerCategories: string[]
  tone: SkillTone
  language: SkillLanguage
  maxLength: number
  includeSignature: boolean
  systemPrompt: string
  examples: ReplySkillExample[]
  replyTemplate: string
  useCount: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CreateReplySkillInput {
  name: string
  description?: string
  triggerCategories?: string[]
  tone?: SkillTone
  language?: SkillLanguage
  maxLength?: number
  includeSignature?: boolean
  systemPrompt?: string
  examples?: ReplySkillExample[]
  replyTemplate?: string
}

export interface UpdateReplySkillInput {
  id: string
  name?: string
  description?: string
  triggerCategories?: string[]
  tone?: SkillTone
  language?: SkillLanguage
  maxLength?: number
  includeSignature?: boolean
  systemPrompt?: string
  examples?: ReplySkillExample[]
  replyTemplate?: string
}

export const SKILL_TONE_PRESETS: Array<{ value: SkillTone; label: string; desc: string }> = [
  { value: 'formal', label: '正式', desc: '严谨、礼貌、商务语气' },
  { value: 'casual', label: '随意', desc: '口语化、轻松自然' },
  { value: 'friendly', label: '友好', desc: '热情、有温度、易亲近' },
  { value: 'firm', label: '坚定', desc: '立场明确、不卑不亢' },
  { value: 'apologetic', label: '致歉', desc: '诚恳、承担责任、表达歉意' },
  { value: 'enthusiastic', label: '积极', desc: '正向上、鼓舞、推动' },
  { value: 'concise', label: '简洁', desc: '言简意赅、不啰嗦' },
]

export const SKILL_LANGUAGE_PRESETS: Array<{ value: SkillLanguage; label: string }> = [
  { value: 'auto', label: '自动检测' },
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
]
