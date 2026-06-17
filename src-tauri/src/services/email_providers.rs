//! Preset catalog of mainstream email providers.
//!
//! Used by `account:list_providers` / `account:detect_provider` so the
//! renderer can show a quick-pick UI for Gmail / Outlook / iCloud / QQ /
//! 163 / 126 / Sina / Sohu / Yahoo / Fastmail / ProtonMail and a custom
//! fallback. `add_account.rs` reads the same presets when auto-filling the
//! IMAP/SMTP fields the user typed in.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderPreset {
    /// Stable identifier, lowercase. Used as the `provider` column value.
    pub id: String,
    /// Human-facing display name.
    pub name: String,
    /// Region hint for the renderer ("global" | "cn").
    pub region: String,
    /// Domain fragments used by `detect`. A bare email matches when its
    /// domain ends with one of these.
    pub domains: Vec<String>,
    /// IMAP settings.
    pub imap_host: String,
    pub imap_port: u16,
    /// SMTP settings.
    pub smtp_host: String,
    pub smtp_port: u16,
    /// Whether the recommended auth flow is an OAuth grant (true) or a
    /// password / app password (false).
    pub supports_oauth: bool,
    /// Password / app-password guidance shown in the UI.
    pub password_hint: String,
    /// Setup URL the user can open in their browser for the auth flow.
    pub help_url: String,
}

fn p(
    id: &str,
    name: &str,
    region: &str,
    domains: &[&str],
    imap_host: &str,
    imap_port: u16,
    smtp_host: &str,
    smtp_port: u16,
    supports_oauth: bool,
    password_hint: &str,
    help_url: &str,
) -> ProviderPreset {
    ProviderPreset {
        id: id.to_string(),
        name: name.to_string(),
        region: region.to_string(),
        domains: domains.iter().map(|s| s.to_string()).collect(),
        imap_host: imap_host.to_string(),
        imap_port,
        smtp_host: smtp_host.to_string(),
        smtp_port,
        supports_oauth,
        password_hint: password_hint.to_string(),
        help_url: help_url.to_string(),
    }
}

/// Returns the full preset catalog. Order is the order the renderer should
/// show the options in.
pub fn all() -> Vec<ProviderPreset> {
    vec![
        p("gmail", "Gmail", "global", &["gmail.com", "googlemail.com"],
          "imap.gmail.com", 993, "smtp.gmail.com", 465,
          true,
          "请使用 Google 账户 → 安全性 → 应用专用密码（16 位）",
          "https://myaccount.google.com/apppasswords"),
        p("outlook", "Outlook / Microsoft 365", "global",
          &["outlook.com", "hotmail.com", "live.com", "msn.com", "office365.com"],
          "outlook.office365.com", 993, "smtp.office365.com", 587,
          true,
          "Microsoft 账户可直接使用账户密码；如启用 2FA，请使用应用密码",
          "https://account.microsoft.com/security"),
        p("icloud", "iCloud Mail", "global", &["icloud.com", "me.com", "mac.com"],
          "imap.mail.me.com", 993, "smtp.mail.me.com", 587,
          false,
          "必须使用 Apple ID 专属应用专用密码（账户 → 安全性 → 应用专用密码）",
          "https://appleid.apple.com/account/manage"),
        p("yahoo", "Yahoo Mail", "global", &["yahoo.com", "ymail.com", "rocketmail.com"],
          "imap.mail.yahoo.com", 993, "smtp.mail.yahoo.com", 465,
          true,
          "账户 → 账户安全性 → 生成应用密码",
          "https://login.yahoo.com/account/security"),
        p("qq", "QQ 邮箱", "cn", &["qq.com", "vip.qq.com", "foxmail.com"],
          "imap.qq.com", 993, "smtp.qq.com", 465,
          false,
          "设置 → 账户 → 开启 IMAP/SMTP 服务并获取授权码（16 位）",
          "https://service.mail.qq.com/detail/0/75"),
        p("163", "网易 163 邮箱", "cn", &["163.com"],
          "imap.163.com", 993, "smtp.163.com", 465,
          false,
          "设置 → POP3/SMTP/IMAP → 开启并扫码获取授权码（不是登录密码）",
          "https://mail.163.com/client/mobile/login.htm"),
        p("126", "网易 126 邮箱", "cn", &["126.com"],
          "imap.126.com", 993, "smtp.126.com", 465,
          false,
          "设置 → POP3/SMTP/IMAP → 开启并扫码获取授权码",
          "https://mail.126.com/client/mobile/login.htm"),
        p("yeah", "网易 yeah 邮箱", "cn", &["yeah.net"],
          "imap.yeah.net", 993, "smtp.yeah.net", 465,
          false,
          "设置 → POP3/SMTP/IMAP → 开启并扫码获取授权码",
          "https://mail.yeah.net/client/mobile/login.htm"),
        p("sina", "新浪邮箱", "cn", &["sina.com", "sina.cn"],
          "imap.sina.com", 993, "smtp.sina.com", 465,
          false,
          "设置 → 账户 → 开启 IMAP/SMTP 服务并获取授权码",
          "https://mail.sina.com.cn/"),
        p("sohu", "搜狐邮箱", "cn", &["sohu.com"],
          "imap.sohu.com", 993, "smtp.sohu.com", 465,
          false,
          "设置 → 客户端授权密码，开启后使用授权码登录",
          "https://mail.sohu.com/"),
        p("fastmail", "Fastmail", "global", &["fastmail.com", "fastmail.fm", "messagingengine.com"],
          "imap.fastmail.com", 993, "smtp.fastmail.com", 465,
          true,
          "设置 → 账户安全 → 应用专用密码",
          "https://app.fastmail.com/settings/security"),
        p("proton", "Proton Mail", "global", &["proton.me", "protonmail.com", "pm.me"],
          "127.0.0.1", 1143, "127.0.0.1", 1025,
          false,
          "需要先在桌面安装 Proton Mail Bridge；用户名与密码为 Bridge 分配的专用凭据",
          "https://proton.me/mail/bridge"),
    ]
}

/// Look up the preset whose `domains` list matches the email's domain.
/// Returns the first match (the catalog lists more specific providers
/// first, e.g. `qq.com` before generic fallbacks).
pub fn detect(email: &str) -> Option<ProviderPreset> {
    let domain = email.trim().rsplit('@').next()?.to_ascii_lowercase();
    all().into_iter().find(|p| p.domains.iter().any(|d| d.eq_ignore_ascii_case(&domain)))
}
