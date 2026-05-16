# Aura — 去中心化 AI 邮箱客户端

## 项目概述

Aura 是第一款以**钱包为身份锚点**的 AI 原生邮箱客户端，支持：
- 钱包签名登录（MetaMask/WalletConnect）
- 多邮箱管理（Gmail/Outlook/iCloud/自定义）
- AI 辅助邮件撰写
- 离线优先架构
- ENS 域名和 XMTP 钱包聊天

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Electron (electron-vite) |
| 前端 | React 18 + TypeScript |
| UI | Shadcn/UI + TailwindCSS |
| 状态管理 | Zustand |
| 数据获取 | TanStack Query |
| 钱包 | Wagmi v2 + Viem v2 + RainbowKit |
| 邮件 | Nodemailer (SMTP) + Imapflow (IMAP) |
| 数据库 | better-sqlite3 |
| AI | Vercel AI SDK |
| 聊天 | @xmtp/xmtp-js |

## 项目结构

```
aura/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── index.ts             # 主进程入口
│   │   ├── ipc/                 # IPC Handler
│   │   │   ├── auth.handler.ts  # 认证相关
│   │   │   ├── email.handler.ts # 邮件相关
│   │   │   ├── ai.handler.ts    # AI 相关
│   │   │   └── tag.handler.ts   # 标签相关
│   │   ├── services/            # 业务逻辑层
│   │   │   ├── email.service.ts # 邮件收发
│   │   │   ├── auth.service.ts  # 认证逻辑
│   │   │   ├── ai.service.ts    # AI 集成
│   │   │   ├── crypto.service.ts # 加密解密
│   │   │   └── connection.manager.ts # 连接管理
│   │   └── database/            # 数据库层
│   │       ├── db.ts            # SQLite 连接
│   │       ├── migrations/      # 迁移脚本
│   │       └── repositories/    # 数据访问
│   │
│   ├── preload/                 # 预加载脚本
│   │   └── index.ts             # contextBridge API
│   │
│   ├── renderer/                # React 渲染进程
│   │   ├── main.tsx             # React 入口
│   │   ├── App.tsx              # 根组件
│   │   ├── routes/              # 页面组件
│   │   │   ├── Login.tsx        # 登录页
│   │   │   ├── Inbox.tsx        # 收件箱
│   │   │   ├── Compose.tsx      # 撰写邮件
│   │   │   ├── Settings.tsx     # 设置页
│   │   │   └── Chat.tsx         # 聊天页
│   │   ├── components/          # UI 组件
│   │   │   ├── ui/              # Shadcn 基础组件
│   │   │   ├── email/           # 邮件组件
│   │   │   ├── editor/          # 编辑器组件
│   │   │   └── ai/              # AI 组件
│   │   ├── stores/              # Zustand 状态
│   │   ├── hooks/               # 自定义 Hooks
│   │   └── lib/                 # 工具函数
│   │
│   └── shared/                  # 共享代码
│       ├── types/               # TypeScript 类型
│       └── constants/           # 常量定义
│
├── tests/                       # 测试目录
│   ├── unit/                    # 单元测试
│   ├── integration/             # 集成测试
│   └── e2e/                     # E2E 测试
│
└── documents/                   # 项目文档
    ├── prd-aura-email-client.md        # PRD
    ├── technical-architecture-aura.md  # 技术架构
    ├── research-plan.md                # 研发计划
    └── test-cases.md                   # 测试用例
```

## 核心模块说明

### 1. 认证模块 (auth)
- **文件**: `src/main/services/auth.service.ts`, `src/main/ipc/auth.handler.ts`
- **功能**: 钱包连接、签名验证、ENS 解析
- **IPC Channels**: `auth:connect`, `auth:sign`, `auth:disconnect`

### 2. 邮件模块 (email)
- **文件**: `src/main/services/email.service.ts`, `src/main/ipc/email.handler.ts`
- **功能**: 邮件收发、同步、搜索、离线队列
- **IPC Channels**: `email:send`, `email:list`, `email:get`, `email:sync`

### 3. AI 模块 (ai)
- **文件**: `src/main/services/ai.service.ts`, `src/main/ipc/ai.handler.ts`
- **功能**: 内容生成、文本优化、邮件分类
- **IPC Channels**: `ai:generate`, `ai:refine`, `ai:classify_email`

### 4. 数据库模块 (database)
- **文件**: `src/main/database/`
- **功能**: SQLite 存储、数据迁移、CRUD 操作
- **主要表**: wallet, email_account, email, signature, tag, chat_message

## IPC 通信规范

所有 IPC 调用遵循统一响应格式：

```typescript
interface IpcResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;      // 错误码，如 "AUTH_WALLET_REJECTED"
    message: string;   // 用户可读的错误描述
  };
}
```

Channel 命名规范: `模块:动作` (如 `email:send`, `ai:generate`)

## 错误码表

| 前缀 | 模块 | 示例 |
|------|------|------|
| `AUTH_` | 认证 | `AUTH_WALLET_REJECTED`, `AUTH_SIGN_FAILED` |
| `EMAIL_` | 邮件 | `EMAIL_IMAP_AUTH_FAILED`, `EMAIL_SEND_FAILED` |
| `AI_` | AI | `AI_PROVIDER_UNAVAILABLE`, `AI_RATE_LIMITED` |
| `NET_` | 网络 | `NET_OFFLINE`, `NET_TIMEOUT` |

## 常用命令

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm build            # 构建项目

# 测试
pnpm test             # 运行单元测试
pnpm test:coverage    # 运行测试并生成覆盖率
pnpm test:e2e         # 运行 E2E 测试

# 代码质量
pnpm lint             # ESLint 检查
pnpm typecheck        # TypeScript 类型检查
```

## 开发规范

### 1. IPC Handler 开发
```typescript
// src/main/ipc/example.handler.ts
import { ipcMain } from 'electron';

export function registerExampleHandler() {
  ipcMain.handle('module:action', async (_event, request) => {
    try {
      const result = await service.doSomething(request);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: { code: 'ERROR_CODE', message: error.message }
      };
    }
  });
}
```

### 2. Service 开发
```typescript
// src/main/services/example.service.ts
export class ExampleService {
  async doSomething(request: RequestType): Promise<ResultType> {
    // 1. 参数验证
    // 2. 业务逻辑
    // 3. 数据库操作
    // 4. 返回结果
  }
}
```

### 3. 测试开发
```typescript
// tests/unit/services/example.service.test.ts
describe('ExampleService', () => {
  it('should do something correctly', async () => {
    const result = await service.doSomething(input);
    expect(result).toBe(expected);
  });
});
```

## 版本规划

| 版本 | 功能 |
|------|------|
| V1.0 MVP | 钱包登录、邮件收发、签名管理、离线支持 |
| V1.5 | AI 辅助撰写、智能标签、智能文件夹 |
| V2.0 | ENS 聊天、企业功能、插件生态 |

## 注意事项

1. **安全**: 所有凭证加密存储，敏感数据通过 keytar 保护
2. **离线**: Local-First 架构，断网不影响核心功能
3. **性能**: 邮件列表使用虚拟滚动，搜索使用 FTS5
4. **测试**: 单元测试覆盖率目标 > 80%
