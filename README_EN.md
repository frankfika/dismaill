<!-- Generated with claude-code, do not edit directly -->

# Aura

<p align="center">
  <img src="./docs/assets/inbox.png" alt="Aura" width="100%" style="border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);" />
</p>

<p align="center">
  <strong>Decentralized AI Email Client · 去中心化 AI 邮箱客户端</strong>
</p>

<p align="center">
  Wallet Sign-In · Multi-Email · AI Assistant · Offline-First
</p>

<p align="center">

[![Version](https://img.shields.io/badge/Version-1.0.4-blue?style=flat-square&color=3B82F6)](https://github.com/frankfika/dismaill/releases)
[![Platform](https://img.shields.io/badge/Platform-macOS%7CWindows%7CLinux-green?style=flat-square&color=10B981)](https://github.com/frankfika/dismaill)
[![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square&color=6B7280)](LICENSE)
[![Stars](https://img.shields.io/github/stars/frankfika/dismaill?style=flat-square&color=F59E0B)](https://github.com/frankfika/dismaill/stargazers)

</p>

---

## ✨ Features

### 1. Wallet Identity Sign-In

<div align="center">

| Feature | Description |
|:--------|:------------|
| 🔑 MetaMask / WalletConnect | One-click connection to major wallets |
| 🦄 ENS Domain Resolution | Auto-resolve wallet addresses to ENS names |
| 🔐 Signature Verification | Passwordless, phishing-proof authentication |
| 📤 One-Click Restore | Recover all configs with wallet signature |

</div>

<p align="center">
  <img src="./docs/assets/login.png" alt="Login" width="60%" style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);" />
</p>

### 2. Unified Multi-Email Management

<div align="center">

| Email Service | Support |
|:--------------|:--------|
| Gmail / Google Workspace | ✅ Full Support |
| Outlook / Microsoft 365 | ✅ Full Support |
| iCloud / Apple Mail | ✅ Full Support |
| Custom SMTP/IMAP | ✅ Full Support |

</div>

<p align="center">
  <img src="./docs/assets/inbox.png" alt="Inbox" width="60%" style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);" />
</p>

### 3. AI Smart Assistant

- 🤖 **AI-Assisted Writing** — Preset agents + prompt templates + conversational refinement
- 🏷️ **Smart Tags** — AI auto-classification with Few-shot learning
- 📁 **Smart Folders** — Tag-based email aggregation
- 🌐 **Multi-Provider** — Anthropic / OpenAI / Custom

<p align="center">
  <img src="./docs/assets/compose.png" alt="Compose" width="60%" style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);" />
</p>

### 4. Web3 Social Features

- 💬 **XMTP Wallet Chat** — End-to-end encrypted, wallet address based
- 🔗 **ENS Contact Discovery** — Find and connect friends via ENS domains
- 🌐 **Decentralized Identity** — Your wallet is your identity

<p align="center">
  <img src="./docs/assets/chat.png" alt="Chat" width="60%" style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);" />
</p>

### 5. Offline-First Architecture

- 📴 **Local-First** — Core features work without internet
- 🔄 **Offline Queue** — Emails composed offline auto-queue and send when online
- 💾 **SQLite Local Storage** — All data encrypted locally

---

## 🚀 Quick Start

### Requirements

| Tool | Version |
|:-----|:--------:|
| Node.js | ≥ 20 LTS |
| pnpm | ≥ 9.x |
| Python | ≥ 3.10 |

### Installation

```bash
# Clone project
git clone https://github.com/frankfika/dismaill.git
cd dismail

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:1420
```

### Environment Variables

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your configs
VITE_DEFAULT_AI_PROVIDER=openai
VITE_XMTP_ENV=production
VITE_INFURA_PROJECT_ID=your-infura-project-id
```

---

## 📥 Download

### macOS

| Architecture | Download |
|:-------------|:---------|
| Apple Silicon (M1/M2/M3) | [Aura_1.0.0_aarch64.dmg](https://github.com/frankfika/dismaill/releases/latest/download/Aura_1.0.0_aarch64.dmg) |
| Intel | [Aura_1.0.0_x64.dmg](https://github.com/frankfika/dismaill/releases/latest/download/Aura_1.0.0_x64.dmg) |

### Windows

| Package Format | Download |
|:---------------|:---------|
| NSIS Installer | [Aura_1.0.0_x64-setup.exe](https://github.com/frankfika/dismaill/releases/latest/download/Aura_1.0.0_x64-setup.exe) |
| MSI Package | [Aura_1.0.0_x64_en-US.msi](https://github.com/frankfika/dismaill/releases/latest/download/Aura_1.0.0_x64_en-US.msi) |

### Linux

| Distribution | Download |
|:-------------|:---------|
| Debian / Ubuntu | [Aura_1.0.0_amd64.deb](https://github.com/frankfika/dismaill/releases/latest/download/Aura_1.0.0_amd64.deb) |
| Fedora / RHEL | [Aura-1.0.0-1.x86_64.rpm](https://github.com/frankfika/dismaill/releases/latest/download/Aura-1.0.0-1.x86_64.rpm) |
| AppImage | [Aura_1.0.0_amd64.AppImage](https://github.com/frankfika/dismaill/releases/latest/download/Aura_1.0.0_amd64.AppImage) |

> 📌 View all releases: [Release Page](https://github.com/frankfika/dismaill/releases)

---

## 🏗️ Architecture

### Tech Stack

<div align="center">

| Category | Technology | Description |
|:---------|:-----------|:------------|
| Desktop Framework | **Tauri v2** | Lightweight, secure, cross-platform |
| Frontend | **React 18 + TypeScript** | Modern reactive UI |
| UI Components | **Shadcn/UI + TailwindCSS** | Clean component library |
| State Management | **Zustand** | Lightweight state |
| Data Fetching | **TanStack Query** | Powerful data sync |
| Wallet Integration | **Wagmi v2 + Viem v2 + RainbowKit** | Web3 wallet connection |
| Email Sending | **Nodemailer** | SMTP email delivery |
| Email Receiving | **Imapflow** | IMAP email sync |
| Local Database | **better-sqlite3** | SQLite local storage |
| Markdown | **Milkdown** | WYSIWYG editor |
| AI SDK | **Vercel AI SDK** | Multi-provider AI support |
| Chat Protocol | **@xmtp/xmtp-js** | XMTP end-to-end encryption |

</div>

### Project Structure

```
src/
├── main/                         # Tauri main process
│   ├── index.ts                 # Main entry
│   ├── ipc/                     # IPC Handler layer
│   │   ├── auth.handler.ts      # Authentication
│   │   ├── email.handler.ts     # Email operations
│   │   └── ai.handler.ts        # AI operations
│   ├── services/                # Business logic layer
│   │   ├── auth.service.ts      # Auth service
│   │   ├── email.service.ts     # Email service
│   │   └── ai.service.ts        # AI service
│   └── database/                # Data layer
│       ├── db.ts                # SQLite connection
│       ├── migrations/          # DB migrations
│       └── repositories/        # Data access
│
├── renderer/                    # React renderer process
│   ├── src/
│   │   ├── routes/              # Page routes (Login, Inbox, Compose, Settings, Chat)
│   │   ├── components/          # UI components
│   │   │   ├── ui/             # Shadcn base components
│   │   │   ├── wallet/          # Wallet components
│   │   │   └── editor/          # Markdown editor
│   │   ├── stores/              # Zustand stores
│   │   └── lib/                 # Utilities
│   └── index.html
│
└── shared/                      # Shared code
    ├── types/                   # TypeScript types
    └── constants/               # Constants
```

### IPC Communication

All IPC calls use a unified response format:

```typescript
interface IpcResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;      // Error code like AUTH_WALLET_REJECTED
    message: string;  // User-friendly error message
  };
}
```

---

## 🧪 Testing

```bash
# Unit tests
pnpm test

# Type check
pnpm typecheck

# ESLint
pnpm lint

# E2E tests
pnpm test:e2e

# Run all tests
pnpm test:all
```

---

## 📈 Roadmap

| Version | Status | Features |
|:--------|:-------|:---------|
| **v1.0** | ✅ Done | Wallet sign-in, email send/receive, signature management, offline support |
| **v1.5** | 🚧 In Progress | AI-assisted writing, smart tags, smart folders |
| **v2.0** | 📋 Planned | ENS chat, wallet chat, enterprise features, plugin ecosystem |

---

## 🤝 Contributing

1. **Fork** the project
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Create **Pull Request**

### Pre-submit Checklist

```bash
pnpm lint      # ESLint check
pnpm typecheck # TypeScript check
pnpm test      # Run tests
```

---

## 📄 License

This project is **MIT License** open source.

---

## 🔗 Links

- 🌐 Project: https://github.com/frankfika/dismaill
- 📖 Documentation: https://github.com/frankfika/dismaill/blob/main/README.md
- 🐛 Issues: https://github.com/frankfika/dismaill/issues
- 📦 Downloads: https://github.com/frankfika/dismaill/releases

---

<p align="center">

[简体中文](./README.md) | [English](./README_EN.md)

</p>