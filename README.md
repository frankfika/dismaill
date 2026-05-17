<!-- Generated with claude-code -->

# NovaMail

<p align="center">
  <img src="./docs/assets/inbox.png" alt="NovaMail" width="100%" style="border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);" />
</p>

<p align="center">
  <strong>新一代 AI 邮箱客户端 · Next-Gen AI Email Client</strong>
</p>

<p align="center">
  钱包签名登录 · 多邮箱聚合 · AI 智能辅助 · 隐私优先
</p>

<p align="center">

[![Version](https://img.shields.io/badge/Version-1.0.4-blue?style=flat-square&color=3B82F6)](https://github.com/frankfika/dismaill/releases)
[![Platform](https://img.shields.io/badge/Platform-macOS%7CWindows%7CLinux-green?style=flat-square&color=10B981)](https://github.com/frankfika/dismaill)
[![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square&color=6B7280)](LICENSE)
[![Stars](https://img.shields.io/github/stars/frankfika/dismaill?style=flat-square&color=F59E0B)](https://github.com/frankfika/dismaill/stargazers)

</p>

---

## ✨ 核心特性

### 1. 钱包身份 · Wallet Identity

<div align="center">

| 特性 | 描述 |
|:-----|:-----|
| 🔑 MetaMask / WalletConnect | 主流钱包一键连接 |
| 🦄 ENS 域名解析 | 钱包地址自动转换为 ENS 域名 |
| 🔐 签名验证 | 无密码登录，无法被钓鱼 |
| 📤 一键恢复 | 钱包签名恢复所有配置 |

</div>

<p align="center">
  <img src="./docs/assets/login.png" alt="Login" width="60%" style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);" />
</p>

### 2. 多邮箱聚合 · Unified Inbox

<div align="center">

| 邮箱服务 | 支持情况 |
|:---------|:---------|
| Gmail / Google Workspace | ✅ 完整支持 |
| Outlook / Microsoft 365 | ✅ 完整支持 |
| iCloud / Apple Mail | ✅ 完整支持 |
| 自定义 SMTP/IMAP | ✅ 完整支持 |

</div>

<p align="center">
  <img src="./docs/assets/inbox.png" alt="Inbox" width="60%" style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);" />
</p>

### 3. AI 智能 · AI Assistant

- 🤖 **AI 辅助撰写** — 预设 Agent + Prompt 模板 + 对话式优化
- 🏷️ **智能标签** — AI 自动分类邮件，Few-shot 学习
- 📁 **智能文件夹** — 基于标签的邮件聚合
- 🌐 **多 Provider** — Anthropic / OpenAI / 自定义 AI

<p align="center">
  <img src="./docs/assets/compose.png" alt="Compose" width="60%" style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);" />
</p>

### 4. 隐私安全 · Privacy First

- 💬 **XMTP 端到端加密** — 钱包地址身份，消息只有你能读
- 🔗 **ENS 联系人发现** — 通过 ENS 域名寻找和联系朋友
- 💾 **本地加密存储** — 所有数据本地加密，不经过第三方

<p align="center">
  <img src="./docs/assets/chat.png" alt="Chat" width="60%" style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);" />
</p>

### 5. 离线优先 · Offline-First

- 📴 **Local-First** — 核心功能断网也可使用
- 🔄 **离线队列** — 邮件撰写后自动排队，联网后发送
- ⚡ **极速响应** — SQLite 本地缓存，毫秒级加载

---

## 🚀 快速开始

### 环境要求

| 工具 | 版本要求 |
|:-----|:--------:|
| Node.js | ≥ 20 LTS |
| pnpm | ≥ 9.x |
| Python | ≥ 3.10 |

### 从源码运行

```bash
# 克隆项目
git clone https://github.com/frankfika/dismaill.git
cd dismail

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 访问 http://localhost:1420
```

### 环境变量

```bash
cp .env.example .env.local

# 编辑 .env.local
VITE_DEFAULT_AI_PROVIDER=openai
VITE_XMTP_ENV=production
VITE_INFURA_PROJECT_ID=your-infura-project-id
```

---

## 📥 下载安装

### macOS

| 芯片架构 | 下载文件 |
|:---------|:---------|
| Apple Silicon (M1/M2/M3) | [NovaMail_1.0.0_aarch64.dmg](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_aarch64.dmg) |
| Intel | [NovaMail_1.0.0_x64.dmg](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_x64.dmg) |

### Windows

| 安装包格式 | 下载文件 |
|:-----------|:---------|
| NSIS 安装程序 | [NovaMail_1.0.0_x64-setup.exe](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_x64-setup.exe) |
| MSI 安装包 | [NovaMail_1.0.0_x64_en-US.msi](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_x64_en-US.msi) |

### Linux

| 发行版 | 下载文件 |
|:-------|:---------|
| Debian / Ubuntu | [NovaMail_1.0.0_amd64.deb](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_amd64.deb) |
| Fedora / RHEL | [NovaMail-1.0.0-1.x86_64.rpm](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail-1.0.0-1.x86_64.rpm) |
| 通用 AppImage | [NovaMail_1.0.0_amd64.AppImage](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_amd64.AppImage) |

> 📌 查看所有版本: [Release 页面](https://github.com/frankfika/dismaill/releases)

---

## 🏗️ 技术架构

### 技术栈

<div align="center">

| 类别 | 技术 | 说明 |
|:-----|:-----|:-----|
| 桌面框架 | **Tauri v2** | 轻量、安全、跨平台 |
| 前端框架 | **React 18 + TypeScript** | 现代化响应式 UI |
| UI 组件 | **Shadcn/UI + TailwindCSS** | 简洁美观的组件库 |
| 状态管理 | **Zustand** | 轻量状态管理 |
| 数据获取 | **TanStack Query** | 强大的数据同步 |
| 钱包集成 | **Wagmi v2 + Viem v2 + RainbowKit** | Web3 钱包连接 |
| 邮件收发 | **Nodemailer + Imapflow** | SMTP/IMAP 全协议支持 |
| 本地数据库 | **better-sqlite3** | SQLite 本地存储 |
| Markdown | **Milkdown** | 所见即所得编辑器 |
| AI SDK | **Vercel AI SDK** | 多 Provider AI 支持 |
| 聊天协议 | **@xmtp/xmtp-js** | XMTP 端到端加密 |

</div>

### 项目结构

```
src/
├── main/                         # Tauri 主进程
│   ├── index.ts                 # 主进程入口
│   ├── ipc/                     # IPC Handler
│   │   ├── auth.handler.ts      # 认证相关
│   │   ├── email.handler.ts     # 邮件相关
│   │   └── ai.handler.ts        # AI 相关
│   ├── services/                # 业务逻辑层
│   │   ├── auth.service.ts      # 认证服务
│   │   ├── email.service.ts     # 邮件服务
│   │   └── ai.service.ts        # AI 服务
│   └── database/                # 数据层
│       ├── db.ts                # SQLite 连接
│       ├── migrations/          # 数据库迁移
│       └── repositories/        # 数据访问
│
├── renderer/                    # React 渲染进程
│   ├── src/
│   │   ├── routes/              # 页面路由
│   │   ├── components/          # UI 组件
│   │   ├── stores/              # Zustand 状态
│   │   └── lib/                 # 工具函数
│   └── index.html
│
└── shared/                      # 共享类型和常量
```

---

## 🧪 测试

```bash
pnpm test        # 单元测试
pnpm typecheck   # 类型检查
pnpm lint        # ESLint 检查
pnpm test:e2e    # E2E 测试
pnpm test:all    # 运行所有测试
```

---

## 📈 路线图

| 版本 | 状态 | 主要功能 |
|:-----|:-----|:---------|
| **v1.0** | ✅ 已完成 | 钱包登录、邮件收发、离线支持 |
| **v1.5** | 🚧 开发中 | AI 辅助撰写、智能标签、智能文件夹 |
| **v2.0** | 📋 计划中 | ENS 聊天、钱包聊天、插件生态 |

---

## 🤝 贡献

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送到分支: `git push origin feature/amazing-feature`
5. 创建 Pull Request

---

## 📄 许可证

MIT License

---

## 🔗 链接

- 🌐 项目地址: https://github.com/frankfika/dismaill
- 🐛 问题反馈: https://github.com/frankfika/dismaill/issues
- 📦 下载地址: https://github.com/frankfika/dismaill/releases

---

<p align="center">

[简体中文](./README.md) | [English](./README_EN.md)

</p>