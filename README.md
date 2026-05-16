# Aura — 去中心化 AI 邮箱客户端

<p align="center">
  <strong>第一款以钱包为身份锚点的 AI 原生邮箱客户端</strong>
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#开发指南">开发指南</a> •
  <a href="#测试指南">测试指南</a> •
  <a href="#项目结构">项目结构</a> •
  <a href="#文档">文档</a>
</p>

---

## 功能特性

### 核心功能 (V1.0 MVP)
- **钱包登录** — 用钱包签名取代密码，一键恢复所有配置
- **多邮箱管理** — 支持 Gmail、Outlook、iCloud 及自定义邮箱
- **Markdown 编辑器** — 原生支持代码高亮、表格、列表
- **签名管理** — 多签名配置，一键切换
- **离线支持** — Local-First 架构，断网不影响使用

### AI 增强功能 (V1.5)
- **AI 辅助撰写** — 预设 Agent + Prompt 模板 + 对话式优化
- **智能标签** — AI 自动分类邮件，Few-shot 学习
- **智能文件夹** — 基于标签的邮件聚合

### Web3 功能 (V2.0)
- **ENS 社交** — 通过 ENS 域名发现联系人
- **钱包聊天** — 基于 XMTP 的端到端加密通信
- **插件生态** — 第三方 AI Provider、自定义 Agent 市场

---

## 快速开始

### 环境要求

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 20 LTS | 推荐使用 fnm 或 nvm 管理版本 |
| pnpm | >= 9.x | 包管理器 |
| Python | >= 3.10 | better-sqlite3 原生编译依赖 |
| Xcode CLT | latest | macOS 原生模块编译 |
| VS Build Tools | 2022 | Windows 原生模块编译 |

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/AuraEmail/aura.git
cd aura

# 2. 安装依赖
pnpm install

# 3. 配置环境变量（可选）
cp .env.example .env.local
# 编辑 .env.local 填入必要配置

# 4. 启动开发服务器
pnpm dev
```

### 环境变量

创建 `.env.local` 文件：

```bash
# AI 服务配置
VITE_DEFAULT_AI_PROVIDER=openai

# XMTP 网络环境
VITE_XMTP_ENV=production

# 以太坊 RPC (ENS 解析)
VITE_INFURA_PROJECT_ID=your-infura-project-id
```

---

## 开发指南

### 常用命令

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm dev:renderer     # 仅启动渲染进程（热更新）

# 构建
pnpm build            # 构建所有进程
pnpm build:mac        # 构建 macOS 版本
pnpm build:win        # 构建 Windows 版本

# 代码质量
pnpm lint             # ESLint 检查
pnpm lint:fix         # 自动修复 lint 问题
pnpm typecheck        # TypeScript 类型检查

# 预览
pnpm preview          # 预览构建结果
```

### 技术栈

| 类别 | 技术 |
|------|------|
| 桌面框架 | Electron (electron-vite) |
| 前端框架 | React 18 + TypeScript |
| UI 组件 | Shadcn/UI + TailwindCSS |
| 状态管理 | Zustand |
| 异步数据 | TanStack Query |
| 钱包集成 | Wagmi v2 + Viem v2 + RainbowKit |
| 邮件发送 | Nodemailer |
| 邮件接收 | Imapflow |
| 聊天协议 | @xmtp/xmtp-js |
| 本地数据库 | better-sqlite3 |
| Markdown | Milkdown |
| AI SDK | Vercel AI SDK |

---

## 测试指南

### 测试架构

本项目采用**测试金字塔**策略：

```
                    /\
                   /  \
                  / E2E\        10% - 端到端测试
                 /______\
                /        \
               / Integration\   20% - 集成测试
              /______________\
             /                \
            /    Unit Tests    \ 70% - 单元测试
           /____________________\
```

### 运行测试

```bash
# 单元测试
pnpm test                    # 运行所有单元测试
pnpm test:watch              # 监听模式运行测试
pnpm test:coverage           # 生成覆盖率报告

# 运行特定测试文件
pnpm test crypto.service     # 运行加密服务测试
pnpm test email.service      # 运行邮件服务测试
pnpm test auth.service       # 运行认证服务测试

# E2E 测试
pnpm test:e2e                # 运行 E2E 测试（headless）
pnpm test:e2e --headed       # 运行 E2E 测试（可视化）

# 运行所有测试
pnpm test:all                # 运行单元测试 + E2E 测试
```

### 测试覆盖率目标

| 模块 | 单元测试 | 集成测试 |
|------|----------|----------|
| 认证模块 | > 90% | > 80% |
| 邮件服务 | > 85% | > 75% |
| AI 服务 | > 80% | > 70% |
| 标签服务 | > 85% | > 75% |
| UI 组件 | > 75% | - |

### 测试文件组织

```
tests/
├── unit/                    # 单元测试
│   ├── services/            # 服务层测试
│   │   ├── crypto.service.test.ts
│   │   ├── email.service.test.ts
│   │   ├── auth.service.test.ts
│   │   └── ai.service.test.ts
│   └── utils/               # 工具函数测试
│       ├── provider-detector.test.ts
│       ├── error-mapper.test.ts
│       └── connection-manager.test.ts
│
├── integration/             # 集成测试
│   ├── email-ipc.integration.test.ts
│   └── auth-ipc.integration.test.ts
│
├── e2e/                     # E2E 测试
│   └── app.flow.e2e.test.ts
│
├── factories/               # 测试数据工厂
│   ├── email.factory.ts
│   └── wallet.factory.ts
│
├── mocks/                   # Mock 服务
│   ├── services.mock.ts
│   └── electron.mock.ts
│
├── helpers/                 # 测试辅助函数
│   └── electron-test-helper.ts
│
└── setup.ts                 # 测试环境配置
```

### 编写测试示例

#### 单元测试

```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('MyService', () => {
  let service: MyService

  beforeEach(() => {
    service = new MyService()
  })

  describe('methodName', () => {
    it('should do something correctly', async () => {
      const result = await service.methodName('input')

      expect(result).toBe('expected output')
    })

    it('should handle error case', async () => {
      await expect(service.methodName('invalid')).rejects.toThrow('ERROR_CODE')
    })
  })
})
```

#### 集成测试

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { registerIpcHandler, mockIpcRenderer } from '../mocks/electron.mock'

describe('IPC Integration', () => {
  beforeEach(() => {
    clearIpcHandlers()
  })

  it('should handle IPC call correctly', async () => {
    registerIpcHandler('module:action', async (request) => ({
      success: true,
      data: { result: 'ok' },
    }))

    const response = await mockIpcRenderer.invoke('module:action', { param: 'value' })

    expect(response.success).toBe(true)
  })
})
```

#### E2E 测试

```typescript
import { test, expect } from '../helpers/electron-test-helper'

test.describe('User Flow', () => {
  test('should complete login flow', async ({ page }) => {
    await page.click('[data-testid="login-btn"]')
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible()
  })
})
```

### 测试数据工厂

使用工厂函数创建测试数据：

```typescript
import { EmailFactory, AccountFactory } from '../factories/email.factory'

// 创建单个邮件
const email = EmailFactory.build({ subject: 'Test' })

// 创建多个邮件
const emails = EmailFactory.buildMany(10)

// 创建 Gmail 账户
const account = AccountFactory.buildGmail()
```

### Mock 服务

使用 Mock 服务隔离外部依赖：

```typescript
import { mockEmailService, mockAuthService, resetAllMocks } from '../mocks/services.mock'

beforeEach(() => {
  resetAllMocks()
})

it('should call email service', async () => {
  mockEmailService.sendEmail.mockResolvedValue({ messageId: '123' })

  const result = await someFunction()

  expect(mockEmailService.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
    to: ['test@example.com'],
  }))
})
```

---

## 项目结构

```
aura/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── index.ts             # 主进程入口
│   │   ├── ipc/                 # IPC Handler
│   │   │   ├── auth.handler.ts
│   │   │   ├── email.handler.ts
│   │   │   └── ...
│   │   ├── services/            # 业务逻辑
│   │   │   ├── email.service.ts
│   │   │   ├── auth.service.ts
│   │   │   └── ...
│   │   └── database/            # 数据库
│   │       ├── db.ts
│   │       ├── migrations/
│   │       └── repositories/
│   │
│   ├── preload/                 # 预加载脚本
│   │   └── index.ts
│   │
│   ├── renderer/                # React 渲染进程
│   │   ├── index.html
│   │   ├── main.tsx             # React 入口
│   │   ├── App.tsx              # 根组件
│   │   ├── routes/              # 页面路由
│   │   ├── components/          # UI 组件
│   │   ├── stores/              # Zustand 状态
│   │   ├── hooks/               # 自定义 Hooks
│   │   └── lib/                 # 工具函数
│   │
│   └── shared/                  # 共享类型和常量
│       ├── types/
│       └── constants/
│
├── tests/                       # 测试目录
├── documents/                   # 项目文档
├── resources/                   # 静态资源
└── .github/workflows/           # CI/CD
```

---

## 文档

- [产品需求文档 (PRD)](./documents/prd-aura-email-client.md)
- [技术架构文档](./documents/technical-architecture-aura.md)
- [研发计划](./documents/research-plan.md)
- [测试用例文档](./documents/test-cases.md)

---

## CI/CD

项目使用 GitHub Actions 进行持续集成：

### 测试流水线

```yaml
# .github/workflows/test.yml
lint → typecheck → unit-test → integration-test → e2e-test
```

### 触发条件

- **Push**: main, develop 分支
- **Pull Request**: main, develop 分支

### 查看测试报告

- 单元测试覆盖率: `coverage/lcov-report/index.html`
- E2E 测试报告: `playwright-report/index.html`

---

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 提交前检查

```bash
# 运行 lint
pnpm lint

# 运行类型检查
pnpm typecheck

# 运行测试
pnpm test

# 确保所有检查通过后再提交
```

---

## 许可证

MIT License

---

## 联系方式

- GitHub Issues: https://github.com/AuraEmail/aura/issues
- 官方网站: https://aura.email (待上线)
