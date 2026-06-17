// Reply-agent types. Mirrors `models::agent` in the Rust backend.
//
// An **agent** is a named "persona" / scenario preset that controls
// *what* the AI thinks it is (system prompt) and *how* it generates
// (provider / model / temperature). It is independent of — but
// composable with — a **skill** (style + few-shot training).

export type AgentIcon =
  | 'wand'
  | 'briefcase'
  | 'message-circle'
  | 'phone'
  | 'megaphone'
  | 'shield'
  | 'heart'
  | 'sparkles'
  | 'book'
  | 'flask'

export interface ReplyAgent {
  id: string
  walletAddress: string
  name: string
  description: string
  icon: AgentIcon
  systemPrompt: string
  provider: string | null
  model: string | null
  temperature: number
  maxTokens: number
  defaultSkillId: string | null
  triggerCategories: string[]
  useCount: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CreateReplyAgentInput {
  name: string
  description?: string
  icon?: AgentIcon
  systemPrompt: string
  provider?: string | null
  model?: string | null
  temperature?: number
  maxTokens?: number
  defaultSkillId?: string | null
  triggerCategories?: string[]
}

export interface UpdateReplyAgentInput {
  id: string
  name?: string
  description?: string
  icon?: AgentIcon
  systemPrompt?: string
  provider?: string | null
  model?: string | null
  temperature?: number
  maxTokens?: number
  defaultSkillId?: string | null
  triggerCategories?: string[]
}

export const AGENT_ICON_PRESETS: Array<{ value: AgentIcon; label: string }> = [
  { value: 'wand', label: '通用' },
  { value: 'briefcase', label: '商务' },
  { value: 'message-circle', label: '客服' },
  { value: 'phone', label: '销售' },
  { value: 'megaphone', label: '市场' },
  { value: 'shield', label: '法务' },
  { value: 'heart', label: '个人' },
  { value: 'sparkles', label: '创意' },
  { value: 'book', label: '教育' },
  { value: 'flask', label: '研发' },
]

/**
 * Built-in agent presets the user can install with one click. They cover
 * the common "different person for different email" use case the user
 * asked for: each agent has a distinct persona + provider preference.
 */
export const STARTER_AGENTS: CreateReplyAgentInput[] = [
  {
    name: '客户支持',
    description: '耐心倾听、共情优先、解决导向的客服回复',
    icon: 'message-circle',
    systemPrompt:
      '你是一位经验丰富的客户支持负责人。面对客户来信，要先表达共情与歉意（如果适用），然后清晰说明已采取的措施和后续时间表。永远不要推卸责任或辩解。',
    temperature: 0.4,
    triggerCategories: ['投诉', '反馈', '求助', '服务', 'support', 'help'],
  },
  {
    name: '销售拓展',
    description: '专业、有说服力、把握节奏的 B2B 销售邮件',
    icon: 'phone',
    systemPrompt:
      '你是一位顶级 B2B 销售。写邮件时要：(1) 一句话直击对方痛点，(2) 用具体数据或案例证明价值，(3) 给出明确的低门槛下一步（如 15 分钟通话）。避免空话和过度热情。',
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.6,
    triggerCategories: ['合作', '报价', 'demo', '商务', 'sales', 'outreach'],
  },
  {
    name: '法务沟通',
    description: '严谨、保留立场、不承诺的对外沟通',
    icon: 'shield',
    systemPrompt:
      '你是法务顾问助理。回复务必措辞严谨、客观中性，避免承认任何可能的法律义务。不要主动给出数字、日期或承诺。涉及具体案件请引导至法务团队。',
    temperature: 0.2,
    triggerCategories: ['合同', '法务', '律师', '法律', 'legal', 'compliance'],
  },
  {
    name: '同事协作',
    description: '友好、简洁、信息密度高的内部沟通',
    icon: 'briefcase',
    systemPrompt:
      '你是写给同事的工作邮件。语气友好但不啰嗦，开门见山说清背景 + 当前状态 + 需要对方做什么 + 截止时间。必要时用 bullet 列表。',
    temperature: 0.5,
    triggerCategories: ['同事', '内部', 'team', 'internal'],
  },
  {
    name: '催款财务',
    description: '克制专业的应收款催收',
    icon: 'megaphone',
    systemPrompt:
      '你是专业财务联络人。礼貌地提醒对方有款项逾期，附上金额与到期日，给出明确截止时间和付款方式。不要情绪化或指责。',
    temperature: 0.3,
    triggerCategories: ['催款', '账单', '付款', 'invoice', 'payment', 'overdue'],
  },
  {
    name: '私人往来',
    description: '自然、温暖、带人情味的私人信件',
    icon: 'heart',
    systemPrompt:
      '你是给朋友、家人或老同事写私人邮件。语气自然、可以带一点幽默或情感，不要过度礼貌或商务腔。',
    temperature: 0.8,
    triggerCategories: ['朋友', '家人', '私人', 'personal', 'friend'],
  },
]
