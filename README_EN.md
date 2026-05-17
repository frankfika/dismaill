<!-- Generated with claude-code -->

# NovaMail

<p align="center">
  <img src="./docs/assets/inbox.png" alt="NovaMail" width="100%" style="border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);" />
</p>

<p align="center">
  <strong>Next-Gen AI Email Client · 新一代 AI 邮箱客户端</strong>
</p>

<p align="center">
  Wallet Sign-In · Unified Inbox · AI Assistant · Privacy First
</p>

<p align="center">

[![Version](https://img.shields.io/badge/Version-1.0.4-blue?style=flat-square&color=3B82F6)](https://github.com/frankfika/dismaill/releases)
[![Platform](https://img.shields.io/badge/Platform-macOS%7CWindows%7CLinux-green?style=flat-square&color=10B981)](https://github.com/frankfika/dismaill)
[![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square&color=6B7280)](LICENSE)
[![Stars](https://img.shields.io/github/stars/frankfika/dismaill?style=flat-square&color=F59E0B)](https://github.com/frankfika/dismaill/stargazers)

</p>

---

## ✨ Core Features

### 1. Wallet Identity

<div align="center">

| Feature | Description |
|:--------|:------------|
| 🔑 MetaMask / WalletConnect | One-click wallet connection |
| 🦄 ENS Domain Resolution | Auto-resolve wallet to ENS names |
| 🔐 Signature Verification | Passwordless, phishing-proof |
| 📤 One-Click Restore | Recover all configs with wallet signature |

</div>

<p align="center">
  <img src="./docs/assets/login.png" alt="Login" width="60%" style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);" />
</p>

### 2. Unified Inbox

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

### 3. AI Assistant

- 🤖 **AI-Assisted Writing** — Preset agents + prompt templates + conversational refinement
- 🏷️ **Smart Tags** — AI auto-classification with Few-shot learning
- 📁 **Smart Folders** — Tag-based email aggregation
- 🌐 **Multi-Provider** — Anthropic / OpenAI / Custom AI

<p align="center">
  <img src="./docs/assets/compose.png" alt="Compose" width="60%" style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);" />
</p>

### 4. Privacy First

- 💬 **XMTP End-to-End Encryption** — Wallet identity, only you can read your messages
- 🔗 **ENS Contact Discovery** — Find and connect friends via ENS domains
- 💾 **Local Encrypted Storage** — All data encrypted locally, no third-party

<p align="center">
  <img src="./docs/assets/chat.png" alt="Chat" width="60%" style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);" />
</p>

### 5. Offline-First

- 📴 **Local-First** — Core features work without internet
- 🔄 **Offline Queue** — Emails auto-queue when offline, send when online
- ⚡ **Lightning Fast** — SQLite local cache, millisecond loading

---

## 🚀 Quick Start

### Requirements

| Tool | Version |
|:-----|:--------:|
| Node.js | ≥ 20 LTS |
| pnpm | ≥ 9.x |
| Python | ≥ 3.10 |

### Run from Source

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
cp .env.example .env.local

# Edit .env.local
VITE_DEFAULT_AI_PROVIDER=openai
VITE_XMTP_ENV=production
VITE_INFURA_PROJECT_ID=your-infura-project-id
```

---

## 📥 Download

### macOS

| Architecture | Download |
|:-------------|:---------|
| Apple Silicon (M1/M2/M3) | [NovaMail_1.0.0_aarch64.dmg](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_aarch64.dmg) |
| Intel | [NovaMail_1.0.0_x64.dmg](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_x64.dmg) |

### Windows

| Package Format | Download |
|:---------------|:---------|
| NSIS Installer | [NovaMail_1.0.0_x64-setup.exe](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_x64-setup.exe) |
| MSI Package | [NovaMail_1.0.0_x64_en-US.msi](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_x64_en-US.msi) |

### Linux

| Distribution | Download |
|:-------------|:---------|
| Debian / Ubuntu | [NovaMail_1.0.0_amd64.deb](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_amd64.deb) |
| Fedora / RHEL | [NovaMail-1.0.0-1.x86_64.rpm](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail-1.0.0-1.x86_64.rpm) |
| AppImage | [NovaMail_1.0.0_amd64.AppImage](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_amd64.AppImage) |

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
| Email | **Nodemailer + Imapflow** | SMTP/IMAP full protocol support |
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
│   ├── ipc/                     # IPC Handler
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
│   │   ├── routes/              # Page routes
│   │   ├── components/          # UI components
│   │   ├── stores/              # Zustand stores
│   │   └── lib/                 # Utilities
│   └── index.html
│
└── shared/                      # Shared types and constants
```

---

## 🧪 Testing

```bash
pnpm test        # Unit tests
pnpm typecheck   # Type check
pnpm lint        # ESLint
pnpm test:e2e    # E2E tests
pnpm test:all    # Run all tests
```

---

## 📈 Roadmap

| Version | Status | Features |
|:--------|:-------|:---------|
| **v1.0** | ✅ Done | Wallet sign-in, email send/receive, offline support |
| **v1.5** | 🚧 In Progress | AI-assisted writing, smart tags, smart folders |
| **v2.0** | 📋 Planned | ENS chat, wallet chat, plugin ecosystem |

---

## 🤝 Contributing

1. Fork the project
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Create Pull Request

---

## 📄 License

MIT License

---

## 🔗 Links

- 🌐 Project: https://github.com/frankfika/dismaill
- 🐛 Issues: https://github.com/frankfika/dismaill/issues
- 📦 Downloads: https://github.com/frankfika/dismaill/releases

---

<p align="center">

[简体中文](./README.md) | [English](./README_EN.md)

</p>