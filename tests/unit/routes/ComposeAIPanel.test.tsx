/**
 * Tests for the extracted Compose sub-components.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ComposeAIPanel } from '../../../src/renderer/src/routes/compose/ComposeAIPanel'
import { AgentPicker } from '../../../src/renderer/src/routes/compose/AgentPicker'
import { SkillPicker } from '../../../src/renderer/src/routes/compose/SkillPicker'
import { renderMarkdown } from '../../../src/renderer/src/routes/compose/markdown'
import type { ReplyAgent, ReplySkill } from '../../../src/shared/types'

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn().mockResolvedValue([]) }))

const fakeAgent: ReplyAgent = {
  id: 'a-1',
  walletAddress: '0x0',
  name: '客服 Agent',
  description: '回复客户咨询',
  icon: 'wand',
  provider: 'openai',
  model: 'gpt-4o',
  defaultSkillId: null,
  triggerCategories: ['客户', '支持'],
  useCount: 0,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

const fakeSkill: ReplySkill = {
  id: 's-1',
  walletAddress: '0x0',
  name: '专业',
  description: '用专业语气回复',
  tone: 'professional',
  language: 'zh',
  examples: [],
  triggerCategories: ['客户'],
  useCount: 0,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

describe('ComposeAIPanel', () => {
  it('returns null when closed', () => {
    const { container } = render(
      <ComposeAIPanel
        open={false}
        onClose={() => {}}
        agents={[]}
        skills={[]}
        prompt=""
        onPromptChange={() => {}}
        isGenerating={false}
        onGenerate={() => {}}
        error={null}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows agent + skill chips when both selected', () => {
    render(
      <ComposeAIPanel
        open
        onClose={() => {}}
        agents={[fakeAgent]}
        skills={[fakeSkill]}
        selectedAgent={fakeAgent}
        selectedSkill={fakeSkill}
        prompt=""
        onPromptChange={() => {}}
        isGenerating={false}
        onGenerate={() => {}}
        error={null}
      />,
    )
    expect(screen.getByText(/客服 Agent/)).toBeInTheDocument()
    expect(screen.getByText(/专业/)).toBeInTheDocument()
  })

  it('disables the generate button when prompt is empty', () => {
    render(
      <ComposeAIPanel
        open
        onClose={() => {}}
        agents={[]}
        skills={[]}
        prompt=""
        onPromptChange={() => {}}
        isGenerating={false}
        onGenerate={() => {}}
        error={null}
      />,
    )
    expect(screen.getByRole('button', { name: /生成草稿/ })).toBeDisabled()
  })

  it('renders the error message when provided', () => {
    render(
      <ComposeAIPanel
        open
        onClose={() => {}}
        agents={[]}
        skills={[]}
        prompt="hi"
        onPromptChange={() => {}}
        isGenerating={false}
        onGenerate={() => {}}
        error="provider unavailable"
      />,
    )
    expect(screen.getByText('provider unavailable')).toBeInTheDocument()
  })
})

describe('AgentPicker', () => {
  it('shows the empty placeholder when no agent is selected', () => {
    render(<AgentPicker agents={[]} selectedId="" onChange={() => {}} />)
    expect(screen.getByText(/不指定角色/)).toBeInTheDocument()
  })

  it('opens the dropdown on click', () => {
    render(<AgentPicker agents={[fakeAgent]} selectedId="" onChange={() => {}} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText(fakeAgent.name)).toBeInTheDocument()
  })
})

describe('SkillPicker', () => {
  it('shows the empty placeholder when no skill is selected', () => {
    render(<SkillPicker skills={[]} selectedId="" onChange={() => {}} />)
    expect(screen.getByText(/不指定技能/)).toBeInTheDocument()
  })
})

describe('renderMarkdown', () => {
  it('converts headings', () => {
    expect(renderMarkdown('# Title')).toContain('<h1>')
    expect(renderMarkdown('## Sub')).toContain('<h2>')
    expect(renderMarkdown('### Tiny')).toContain('<h3>')
  })

  it('converts bold and italic', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>')
    expect(renderMarkdown('*em*')).toContain('<em>')
  })

  it('strips javascript: URLs from links', () => {
    const out = renderMarkdown('[click](javascript:alert(1))')
    expect(out).not.toContain('javascript:')
  })

  it('returns empty-ish output for empty input', () => {
    expect(renderMarkdown('').replace(/<br\s*\/?>/g, '').trim()).toBe('')
  })
})
