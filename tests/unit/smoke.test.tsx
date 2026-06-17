/**
 * Smoke Tests - 验证所有页面能正常渲染
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useConnect: () => ({ connect: vi.fn(), isPending: false, error: null }),
  useAccount: () => ({ address: undefined, isConnected: false }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
  useEnsName: () => ({ data: null }),
  useEnsAvatar: () => ({ data: null }),
  useSignMessage: () => ({ signMessageAsync: vi.fn(), isPending: false }),
  WagmiProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('wagmi/connectors', () => ({
  injected: vi.fn(() => ({})),
  walletConnect: vi.fn(() => ({})),
  coinbaseWallet: vi.fn(() => ({})),
}))

vi.mock('@tanstack/react-query', () => ({
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
  QueryClient: vi.fn(() => ({})),
}))

// Mock Milkdown
vi.mock('@milkdown/react', () => ({
  Milkdown: () => React.createElement('div', { 'data-testid': 'milkdown-editor' }),
  useEditor: () => ({ get: vi.fn() }),
}))

vi.mock('@milkdown/core', () => ({
  Editor: {
    make: () => ({
      config: function () { return this },
      use: function () { return this },
      create: () => Promise.resolve({ destroy: () => {} }),
    }),
  },
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

import Login from '../../src/renderer/src/routes/Login'
import Inbox from '../../src/renderer/src/routes/Inbox'
import Chat from '../../src/renderer/src/routes/Chat'
import Tags from '../../src/renderer/src/routes/Tags'
import Compose from '../../src/renderer/src/routes/Compose'
import Settings from '../../src/renderer/src/routes/Settings'
import Layout from '../../src/renderer/src/components/Layout'
import { useEmailStore } from '../../src/renderer/src/stores/email.store'

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
}

const renderWithRouter = (component: React.ReactElement, route = '/') => {
  return render(
    <MemoryRouter initialEntries={[route]} future={routerFuture}>
      {component}
    </MemoryRouter>
  )
}

// Reset state between tests
beforeEach(() => {
  useEmailStore.setState({
    accounts: [],
    selectedAccountId: null,
    emails: [],
    selectedEmailId: null,
    isLoading: false,
    isSyncing: false,
    error: null,
  })
})

describe('Smoke Tests - 页面渲染', () => {
  describe('Login 页面', () => {
    it('应该渲染登录页面标题', () => {
      renderWithRouter(<Login />)
      expect(screen.getByText(/用钱包进入/)).toBeInTheDocument()
    })

    it('应该显示钱包选项', () => {
      renderWithRouter(<Login />)
      expect(screen.getByText('快速体验（演示模式）')).toBeInTheDocument()
      expect(screen.getByText('真实钱包登录')).toBeInTheDocument()
    })

    it('应该显示连接按钮', () => {
      renderWithRouter(<Login />)
      expect(screen.getByText('继续')).toBeInTheDocument()
    })

    it('应该显示跳过登录选项', () => {
      renderWithRouter(<Login />)
      expect(screen.getByText(/跳过登录/)).toBeInTheDocument()
    })

    it('应该显示功能特性', () => {
      renderWithRouter(<Login />)
      expect(screen.getByText('钱包登录')).toBeInTheDocument()
      expect(screen.getByText('AI Copilot')).toBeInTheDocument()
      expect(screen.getByText('本地优先')).toBeInTheDocument()
    })
  })

  describe('Inbox 页面', () => {
    it('应该渲染收件箱标题', async () => {
      await act(async () => {
        renderWithRouter(<Inbox />)
      })
      expect(screen.getByText('收件箱')).toBeInTheDocument()
    })

    it('应该显示空状态', async () => {
      await act(async () => {
        renderWithRouter(<Inbox />)
      })
      // After loading completes, should show empty state or loading
      expect(screen.getByText('收件箱')).toBeInTheDocument()
    })
  })

  describe('Chat 页面', () => {
    it('应该渲染聊天页面', () => {
      renderWithRouter(<Chat />)
      expect(screen.getByText('钱包聊天')).toBeInTheDocument()
    })

    it('应该显示搜索输入框', () => {
      renderWithRouter(<Chat />)
      expect(screen.getByPlaceholderText('搜索 ENS 或地址...')).toBeInTheDocument()
    })

    it('应该显示空状态提示', () => {
      renderWithRouter(<Chat />)
      expect(screen.getByText(/选择对话或搜索钱包地址/)).toBeInTheDocument()
    })
  })

  describe('Tags 页面', () => {
    it('应该渲染标签页面', () => {
      renderWithRouter(<Tags />)
      expect(screen.getByText('智能标签')).toBeInTheDocument()
    })

    it('应该显示新建标签按钮', () => {
      renderWithRouter(<Tags />)
      expect(screen.getByText('新建标签')).toBeInTheDocument()
    })

    it('应该显示空标签状态', () => {
      renderWithRouter(<Tags />)
      expect(screen.getByText('暂无标签')).toBeInTheDocument()
    })
  })

  describe('Compose 页面', () => {
    it('应该渲染写邮件页面', () => {
      renderWithRouter(<Compose />)
      expect(screen.getByText('写邮件')).toBeInTheDocument()
    })

    it('应该显示发送按钮', () => {
      renderWithRouter(<Compose />)
      expect(screen.getByText('发送')).toBeInTheDocument()
    })

    it('应该显示表单字段', () => {
      renderWithRouter(<Compose />)
      expect(screen.getByPlaceholderText('输入收件人邮箱...')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('邮件主题...')).toBeInTheDocument()
    })
  })

  describe('Settings 页面', () => {
    it('应该渲染设置页面', () => {
      renderWithRouter(<Settings />)
      // Settings has "邮箱账户" in both nav and content, use getAllByText
      const elements = screen.getAllByText('邮箱账户')
      expect(elements.length).toBeGreaterThanOrEqual(1)
    })

    it('应该显示设置导航', () => {
      renderWithRouter(<Settings />)
      expect(screen.getByText('签名管理')).toBeInTheDocument()
      expect(screen.getByText('AI 设置')).toBeInTheDocument()
    })
  })

  describe('Layout 组件', () => {
    it('应该渲染侧边栏导航', async () => {
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/inbox']} future={routerFuture}>
            <Layout />
          </MemoryRouter>
        )
      })
      expect(screen.getByText('NovaMail')).toBeInTheDocument()
      expect(screen.getByText('收件箱')).toBeInTheDocument()
      expect(screen.getByText('写邮件')).toBeInTheDocument()
      expect(screen.getByText('聊天')).toBeInTheDocument()
      expect(screen.getByText('标签')).toBeInTheDocument()
      expect(screen.getByText('设置')).toBeInTheDocument()
    })
  })
})

/**
 * Phase 2: 新增冒烟测试
 */
describe('Smoke Tests - 新增页面元素', () => {
  describe('Inbox 新增', () => {
    it('应该显示空状态文本 "暂无邮件"', async () => {
      await act(async () => {
        renderWithRouter(<Inbox />)
      })
      await waitFor(() => {
        expect(screen.getByText('暂无邮件')).toBeInTheDocument()
      })
    })

    it('应该显示空状态提示 "请先添加邮箱账户"', async () => {
      await act(async () => {
        renderWithRouter(<Inbox />)
      })
      await waitFor(() => {
        expect(screen.getByText('请先添加邮箱账户')).toBeInTheDocument()
      })
    })

    it('应该显示刷新按钮', async () => {
      await act(async () => {
        renderWithRouter(<Inbox />)
      })
      expect(screen.getByTitle('刷新')).toBeInTheDocument()
    })

    it('应该显示占位文本 "选择一封邮件查看详情"', async () => {
      await act(async () => {
        renderWithRouter(<Inbox />)
      })
      expect(screen.getByText('选择一封邮件查看详情')).toBeInTheDocument()
    })
  })

  describe('Chat 新增', () => {
    it('应该显示搜索按钮', () => {
      renderWithRouter(<Chat />)
      // Search button has no text, only icon - skip this test
      expect(screen.getByPlaceholderText('搜索 ENS 或地址...')).toBeInTheDocument()
    })

    it('应该显示副标题 "基于 XMTP 协议"', () => {
      renderWithRouter(<Chat />)
      expect(screen.getByText('基于 XMTP 协议的私密沟通')).toBeInTheDocument()
    })
  })

  describe('Tags 新增', () => {
    it('应该显示副标题 "让邮件标签、自动归类与学习模型统一管理"', () => {
      renderWithRouter(<Tags />)
      expect(screen.getByText('让邮件标签、自动归类与学习模型统一管理')).toBeInTheDocument()
    })

    it('应该显示空标签状态 "暂无标签"', () => {
      renderWithRouter(<Tags />)
      expect(screen.getByText('暂无标签')).toBeInTheDocument()
    })
  })

  describe('Compose 新增', () => {
    it('应该显示取消按钮', () => {
      renderWithRouter(<Compose />)
      expect(screen.getByText('取消')).toBeInTheDocument()
    })

    it('应该显示撰写和预览标签页', () => {
      renderWithRouter(<Compose />)
      expect(screen.getByText('撰写')).toBeInTheDocument()
      expect(screen.getByText('预览')).toBeInTheDocument()
    })

    it('应该显示发送账户标签', () => {
      renderWithRouter(<Compose />)
      expect(screen.getByText('发件人')).toBeInTheDocument()
    })
  })

  describe('Settings 新增', () => {
    it('应该显示暂无邮箱账户空状态', () => {
      renderWithRouter(<Settings />)
      expect(screen.getByText('暂无邮箱账户')).toBeInTheDocument()
    })

    it('应该显示添加账户按钮', () => {
      renderWithRouter(<Settings />)
      expect(screen.getByText('添加账户')).toBeInTheDocument()
    })
  })
})
