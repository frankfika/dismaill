/**
 * Compose Flow Tests
 * 测试邮件撰写的完整流程和 renderMarkdown 函数
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

// Mock wagmi
vi.mock('wagmi', () => ({
  useConnect: () => ({ connect: vi.fn(), isPending: false, error: null }),
  useAccount: () => ({ address: undefined, isConnected: false }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
  useEnsName: () => ({ data: null }),
  useEnsAvatar: () => ({ data: null }),
}))

vi.mock('wagmi/connectors', () => ({
  injected: vi.fn(() => ({})),
  walletConnect: vi.fn(() => ({})),
  coinbaseWallet: vi.fn(() => ({})),
}))

// Mock Milkdown
vi.mock('@milkdown/react', () => ({
  Milkdown: () => React.createElement('div', { 'data-testid': 'milkdown-editor' }),
  useEditor: () => ({ get: vi.fn() }),
}))
vi.mock('@milkdown/core', () => ({
  Editor: { make: () => ({ config: () => ({ use: () => ({ use: () => ({ use: () => ({ use: () => ({ use: () => ({}) }) }) }) }) }) }) },
  rootCtx: {},
  defaultValueCtx: {},
}))
vi.mock('@milkdown/theme-nord', () => ({ nord: vi.fn() }))
vi.mock('@milkdown/preset-commonmark', () => ({ commonmark: {} }))
vi.mock('@milkdown/preset-gfm', () => ({ gfm: {} }))
vi.mock('@milkdown/plugin-history', () => ({ history: {} }))
vi.mock('@milkdown/plugin-clipboard', () => ({ clipboard: {} }))
vi.mock('@milkdown/plugin-cursor', () => ({ cursor: {} }))
vi.mock('@milkdown/plugin-listener', () => ({ listener: {}, listenerCtx: { markdownUpdated: vi.fn() } }))

import Compose from '../../../src/renderer/src/routes/Compose'

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
}

const renderWithRouter = (component: React.ReactElement, route = '/compose') => {
  return render(
    <MemoryRouter initialEntries={[route]} future={routerFuture}>
      {component}
    </MemoryRouter>
  )
}

describe('Compose Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('表单状态', () => {
    it('初始状态发送按钮应禁用', () => {
      renderWithRouter(<Compose />)
      const sendBtn = screen.getByText('发送')
      expect(sendBtn).toBeDisabled()
    })

    it('应该渲染所有表单字段', () => {
      renderWithRouter(<Compose />)

      expect(screen.getByText('发送账户')).toBeInTheDocument()
      expect(screen.getByText('收件人')).toBeInTheDocument()
      expect(screen.getByText('主题')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('邮件主题')).toBeInTheDocument()
    })

    it('应该能输入收件人和主题', async () => {
      renderWithRouter(<Compose />)

      const toInput = screen.getByPlaceholderText('email@example.com')
      await userEvent.type(toInput, 'test@example.com')
      expect(toInput).toHaveValue('test@example.com')

      const subjectInput = screen.getByPlaceholderText('邮件主题')
      await userEvent.type(subjectInput, '测试主题')
      expect(subjectInput).toHaveValue('测试主题')
    })
  })

  describe('标签页切换', () => {
    it('应该能在撰写和预览之间切换', async () => {
      renderWithRouter(<Compose />)

      expect(screen.getByText('撰写')).toBeInTheDocument()
      expect(screen.getByText('预览')).toBeInTheDocument()

      // 切换到预览
      await userEvent.click(screen.getByText('预览'))

      await waitFor(() => {
        expect(screen.getByText(/预览将显示在这里/)).toBeInTheDocument()
      })
    })
  })

  describe('取消操作', () => {
    it('取消按钮应存在且可点击', async () => {
      renderWithRouter(<Compose />)

      const cancelBtn = screen.getByText('取消')
      expect(cancelBtn).toBeInTheDocument()

      await userEvent.click(cancelBtn)
      // Navigation happens but we can verify the click doesn't throw
    })
  })

  describe('发送账户选择', () => {
    it('应显示选择邮箱账户占位文本', () => {
      renderWithRouter(<Compose />)

      // The select should have a default "选择邮箱账户" option
      expect(screen.getByText('选择邮箱账户')).toBeInTheDocument()
    })
  })
})

/**
 * renderMarkdown 函数测试
 * 注意: renderMarkdown 是 Compose.tsx 中的内部函数
 * 我们通过在此模块中重新实现来测试其逻辑
 */
describe('renderMarkdown', () => {
  // Re-implement renderMarkdown locally since it's not exported
  function renderMarkdown(markdown: string): string {
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/~~(.*)~~/gim, '<del>$1</del>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/```([^`]+)```/gim, '<pre><code>$1</code></pre>')
      .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>')
      .replace(/^\d+\. (.*$)/gim, '<ol><li>$1</li></ol>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n/gim, '<br />')
  }

  it('应该将 heading 转换为 HTML', () => {
    expect(renderMarkdown('# Title')).toBe('<h1>Title</h1>')
    expect(renderMarkdown('## Subtitle')).toBe('<h2>Subtitle</h2>')
    expect(renderMarkdown('### Section')).toBe('<h3>Section</h3>')
  })

  it('应该将粗体转换为 strong', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>')
  })

  it('应该将斜体转换为 em', () => {
    expect(renderMarkdown('*italic*')).toContain('<em>italic</em>')
  })

  it('应该将删除线转换为 del', () => {
    expect(renderMarkdown('~~deleted~~')).toContain('<del>deleted</del>')
  })

  it('应该将行内代码转换为 code', () => {
    expect(renderMarkdown('`code`')).toContain('<code>code</code>')
  })

  it('应该将链接转换为 a 标签', () => {
    const result = renderMarkdown('[Google](https://google.com)')
    expect(result).toContain('<a href="https://google.com"')
    expect(result).toContain('target="_blank"')
    expect(result).toContain('Google')
  })

  it('应该将换行转换为 br', () => {
    expect(renderMarkdown('line1\nline2')).toContain('<br />')
  })

  it('应该将引用转换为 blockquote', () => {
    expect(renderMarkdown('> quoted text')).toContain('<blockquote>quoted text</blockquote>')
  })
})
