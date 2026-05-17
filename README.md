# NovaMail

NovaMail is a next-generation email client with wallet-based identity and AI-assisted features.

---

## Features

### Wallet Identity
Connect with MetaMask or WalletConnect. Use wallet signatures instead of passwords.

### Multi-Provider Email
Unified inbox for Gmail, Outlook, iCloud, and custom SMTP/IMAP accounts.

### AI Assistant
Smart email composition with preset agents and prompt templates.

### Privacy First
End-to-end encryption via XMTP. All data stored locally encrypted.

### Offline-First
Core features work without internet. Emails queue offline and send when connected.

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Desktop | Tauri v2 |
| Frontend | React 18 + TypeScript |
| UI | Shadcn/UI + TailwindCSS |
| State | Zustand |
| Email | Nodemailer + Imapflow |
| Database | better-sqlite3 |
| AI | Vercel AI SDK |
| Chat | @xmtp/xmtp-js |

---

## Quick Start

```bash
git clone https://github.com/frankfika/dismaill.git
cd dismail
pnpm install
pnpm dev
```

---

## Download

| Platform | File |
|----------|------|
| macOS Apple Silicon | [NovaMail_1.0.0_aarch64.dmg](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_aarch64.dmg) |
| macOS Intel | [NovaMail_1.0.0_x64.dmg](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_x64.dmg) |
| Windows | [NovaMail_1.0.0_x64-setup.exe](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_x64-setup.exe) |
| Linux | [NovaMail_1.0.0_amd64.AppImage](https://github.com/frankfika/dismaill/releases/latest/download/NovaMail_1.0.0_amd64.AppImage) |

[All releases →](https://github.com/frankfika/dismaill/releases)

---

## Screenshots

| | |
|:--|:--|
| ![Login](./docs/assets/login.png) | ![Inbox](./docs/assets/inbox.png) |
| ![Compose](./docs/assets/compose.png) | ![Chat](./docs/assets/chat.png) |

---

## License

MIT