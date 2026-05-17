<div align="center">

# Aura
> 去中心化 AI 邮箱客户端 · Decentralized AI Email Client

![主界面](./docs/assets/inbox.png)

### 钱包签名登录 · 多邮箱管理 · AI 智能辅助

[![Version](https://img.shields.io/badge/Version-1.0.4-blue?style=flat-square)](https://github.com/frankfika/dismaill/releases)
[![Platform](https://img.shields.io/badge/Platform-macOS|Windows|Linux-green?style=flat-square)](https://github.com/frankfika/dismaill)
[![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square)](LICENSE)

[功能特性](#-功能特性) • [界面预览](#-界面预览) • [快速开始](#-快速开始) • [下载安装](#-下载安装) • [技术架构](#-技术架构)

[English](./README_EN.md) | __简体中文__

---
</div>

## 项目简介

Aura 是第一款以**钱包为身份锚点**的 AI 原生邮箱客户端，支持：

- **钱包签名登录** — 用钱包签名取代密码，一键恢复所有配置
- **多邮箱管理** — 支持 Gmail、Outlook、iCloud 及自定义邮箱
- **AI 辅助撰写** — 预设 Agent + Prompt 模板 + 对话式优化
- **离线优先架构** — Local-First，断网不影响核心功能
- **ENS 域名解析** — 通过 ENS 域名发现联系人
- **XMTP 钱包聊天** — 基于钱包的端到端加密通信

### 核心区别

| 传统邮箱 | Aura |
|---------|------|
| 密码易泄露 | 钱包签名，无法被钓鱼 |
| 多账号难管理 | 钱包身份锚点，一键切换 |
| 手动整理邮件 | AI 自动分类打标 |
| 中心化服务 | 去中心化身份，数据自主 |

## 功能特性

### 1. 钱包身份登录

- 支持 MetaMask 和 WalletConnect
- 钱包签名验证，无需密码
- ENS 域名自动解析和显示
- 一键恢复所有邮件配置

![登录界面](./docs/assets/login.png)

### 2. 多邮箱统一管理

- Gmail / Outlook / iCloud / 自定义 SMTP/IMAP
- 统一的收件箱聚合视图
- 邮箱账号分组管理
- 离线邮件队列，断网也可撰写

![收件箱](./docs/assets/inbox.png)

### 3. Markdown 邮件编辑器

- Milkdown 所见即所得编辑器
- 原生支持代码高亮、表格、列表
- 签名模板管理
- 支持图片粘贴和拖拽

![撰写邮件](./docs/assets/compose.png)

### 4. AI 智能辅助

- AI 辅助邮件撰写和优化
- 智能标签自动分类
- 智能文件夹聚合
- 支持 Anthropic / OpenAI 多 Provider

### 5. Web3 社交功能

- ENS 域名联系人发现
- XMTP 钱包端到端加密聊天
- 去中心化身份体系

![聊天界面](./docs/assets/chat.png)

## 界面预览

| 登录页 | 收件箱 | 撰写邮件 |
|:------:|:------:|:--------:|
| ![登录](./docs/assets/login.png) | ![收件箱](./docs/assets/inbox.png) | ![撰写](./docs/assets/compose.png) |

| 设置页 | 聊天 |
|:------:|:---:|
| ![设置](./docs/assets/settings.png) | ![聊天](./docs/assets/chat.png) |

## 快速开始

### 环境要求

| 工具 | 版本 |
|------|------|
| Node.js | >= 20 LTS |
| pnpm | >= 9.x |
| Python | >= 3.10 |

### 从源码运行

```bash
# 克隆项目
git clone https://github.com/frankfika/dismaill.git
cd dismail

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 环境变量配置

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```bash
# AI 服务
VITE_DEFAULT_AI_PROVIDER=openai

# XMTP 环境
VITE_XMTP_ENV=production

# 以太坊 RPC
VITE_INFURA_PROJECT_ID=your-infura-project-id
```

## 下载安装

### macOS

- Apple Silicon: [Aura_1.0.0_aarch64.dmg](https://github.com/frankfika/dismaill/releases/latest/download/Aura_1.0.0_aarch64.dmg)
- Intel: [Aura_1.0.0_x64.dmg](https://github.com/frankfika/dismaill/releases/latest/download/Aura_1.0.0_x64.dmg)

### Windows

- 安装包: [Aura_1.0.0_x64-setup.exe](https://github.com/frankfika/dismaill/releases/latest/download/Aura_1.0.0_x64-setup.exe)
- MSI: [Aura_1.0.0_x64_en-US.msi](https://github.com/frankfika/dismaill/releases/latest/download/Aura_1.0.0_x64_en-US.msi)

### Linux

- Debian/Ubuntu: [Aura_1.0.0_amd64.deb](https://github.com/frankfika/dismaill/releases/latest/download/Aura_1.0.0_amd64.deb)
- Fedora/RHEL: [Aura-1.0.0-1.x86_64.rpm](https://github.com/frankfika/dismaill/releases/latest/download/Aura-1.0.0-1.x86_64.rpm)
- AppImage: [Aura_1.0.0_amd64.AppImage](https://github.com/frankfika/dismaill/releases/latest/download/Aura_1.0.0_amd64.AppImage)

查看所有版本: [Release 页面](https://github.com/frankfika/dismaill/releases)

## 技术架构

### 技术栈

| 类别 | 技术 |
|------|------|
| 桌面框架 | Tauri v2 |
| 前端 | React 18 + TypeScript |
| UI | Shadcn/UI + TailwindCSS |
| 状态管理 | Zustand |
| 数据获取 | TanStack Query |
| 钱包集成 | Wagmi v2 + Viem v2 + RainbowKit |
| 邮件收发 | Nodemailer + Imapflow |
| 本地数据库 | better-sqlite3 |
| Markdown | Milkdown |
| AI SDK | Vercel AI SDK |
| 聊天协议 | @xmtp/xmtp-js |

### 项目结构

```
src/
├── main/                    # Tauri 主进程
│   ├── index.ts             # 主进程入口
│   ├── ipc/                 # IPC Handler
│   ├── services/            # 业务逻辑
│   └── database/            # SQLite 数据库
│
├── renderer/                # React 渲染进程
│   ├── src/
│   │   ├── routes/          # 页面路由
│   │   ├── components/       # UI 组件
│   │   ├── stores/          # Zustand 状态
│   │   └── lib/             # 工具函数
│   └── index.html
│
└── shared/                  # 共享类型和常量
```

### IPC 通信

所有 IPC 调用使用统一响应格式：

```typescript
interface IpcResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

## 版本规划

| 版本 | 功能 |
|------|------|
| v1.0 | 钱包登录、邮件收发、签名管理、离线支持 |
| v1.5 | AI 辅助撰写、智能标签、智能文件夹 |
| v2.0 | ENS 聊天、钱包聊天、企业功能、插件生态 |

## 测试

```bash
# 单元测试
pnpm test

# 类型检查
pnpm typecheck

# ESLint
pnpm lint

# E2E 测试
pnpm test:e2e

# 运行所有测试
pnpm test:all
```

## CI/CD

项目使用 GitHub Actions 进行持续集成：

- **Push** 到 main/develop 分支自动运行
- **PR** 自动运行 lint + typecheck + 单元测试
- **Release** 自动构建全平台安装包

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

- GitHub Issues: https://github.com/frankfika/dismaill/issues
- 官方网站: https://aura.email (待上线)