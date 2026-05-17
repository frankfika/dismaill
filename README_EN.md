<div align="center">

# NovaMail

**Next-Gen Email Client** · Wallet Identity · Privacy First

[![macOS](https://img.shields.io/badge/macOS-333333?style=flat-square&logo=apple)](https://github.com/frankfika/dismaill/releases)
[![Windows](https://img.shields.io/badge/Windows-333333?style=flat-square&logo=windows)](https://github.com/frankfika/dismaill/releases)
[![Linux](https://img.shields.io/badge/Linux-333333?style=flat-square&logo=linux)](https://github.com/frankfika/dismaill/releases)
[![License](https://img.shields.io/badge/License-MIT-333333?style=flat-square)](LICENSE)

[Features](#features) · [Download](#download) · [Quick Start](#quick-start)

</div>

---

## Features

### Wallet Identity
Connect with MetaMask or WalletConnect. Use wallet signatures instead of passwords. One-click recovery.

### Unified Inbox
Aggregate Gmail, Outlook, iCloud, and custom SMTP/IMAP accounts into one view.

### AI Assistant
Smart email composition with preset agents and prompt templates.

### Privacy First
End-to-end encryption via XMTP. All data stored locally encrypted.

### Offline-First
Core features work without internet. Emails queue offline and send when connected.

---

## Screenshots

| Login | Inbox |
|:-----:|:-----:|
| ![Login](./docs/assets/login.png) | ![Inbox](./docs/assets/inbox.png) |

| Compose | Chat |
|:-------:|:-----:|
| ![Compose](./docs/assets/compose.png) | ![Chat](./docs/assets/chat.png) |

---

## Download

| Platform | Download |
|:---------|:---------|
| **macOS** (Apple Silicon) | [NovaMail_1.0.0_aarch64.dmg](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_aarch64.dmg) |
| **macOS** (Intel) | [NovaMail_1.0.0_x64.dmg](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_x64.dmg) |
| **Windows** | [NovaMail_1.0.0_x64-setup.exe](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_x64-setup.exe) |
| **Linux** (Debian) | [NovaMail_1.0.0_amd64.deb](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_amd64.deb) |
| **Linux** (AppImage) | [NovaMail_1.0.0_amd64.AppImage](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_amd64.AppImage) |

→ [All releases](https://github.com/frankfika/dismaill/releases)

---

## Quick Start

```bash
git clone https://github.com/frankfika/dismaill.git
cd dismail
pnpm install
pnpm dev
```

---

## Tech Stack

| Component | Technology |
|:-----------|:-----------|
| Desktop | Tauri v2 |
| Frontend | React 18 + TypeScript |
| UI | Shadcn/UI + TailwindCSS |
| State | Zustand |
| Email | Nodemailer + Imapflow |
| Database | better-sqlite3 |
| Chat | @xmtp/xmtp-js |

---

## License

MIT