//! Email service — SMTP send + IMAP sync.

use lettre::message::{Mailbox, MessageBuilder};
use lettre::transport::smtp::authentication::Credentials as SmtpCredentials;
use lettre::{AsyncSmtpTransport, AsyncTransport, Tokio1Executor};

use crate::database::repositories::email::{CreateEmail, EmailRepo};
use crate::database::repositories::email_account::EmailAccountRepo;
use crate::database::SharedPool;
use crate::error::{AppError, AppResult};
use crate::models::{
    AccountConfig, EmailAccount, EmailSendRequest, EmailSyncOptions,
    SendResult, SyncError, SyncResult,
};
use crate::services::crypto::decrypt_credentials;
use crate::state::AppState;

pub struct EmailService {
    pool: SharedPool,
}

impl EmailService {
    pub fn new(pool: SharedPool) -> Self {
        Self { pool }
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    fn account_repo(&self) -> EmailAccountRepo {
        EmailAccountRepo::new(self.pool.clone())
    }

    fn email_repo(&self) -> EmailRepo {
        EmailRepo::new(self.pool.clone())
    }

    /// Decrypt stored credentials using the session master key.
    fn decrypt_creds(
        &self,
        state: &AppState,
        account: &EmailAccount,
    ) -> AppResult<(String, String)> {
        let (_wallet, master_key) = super::auth::AuthService::require_session(state)?;
        let repo = self.account_repo();
        let encrypted = repo
            .get_credentials(&account.id)?
            .ok_or_else(|| AppError::EmailAccountNotFound)?;
        let creds = decrypt_credentials(&encrypted, &master_key)?;
        let username = account.email_address.clone();
        let password = creds.password.unwrap_or_default();
        Ok((username, password))
    }

    // ── SMTP Send ────────────────────────────────────────────────────────

    pub async fn send_email(
        &self,
        state: &AppState,
        request: EmailSendRequest,
    ) -> AppResult<SendResult> {
        if request.to.is_empty() {
            return Err(AppError::EmailInvalidRecipient);
        }
        let email_regex = regex::Regex::new(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
            .map_err(|e| AppError::Internal(e.to_string()))?;
        for r in &request.to {
            if !email_regex.is_match(r) {
                return Err(AppError::EmailInvalidRecipient);
            }
        }

        let repo = self.account_repo();
        let account = repo
            .find_by_id(&request.account_id)?
            .ok_or(AppError::EmailAccountNotFound)?;
        let (username, password) = self.decrypt_creds(state, &account)?;

        let transport: AsyncSmtpTransport<Tokio1Executor> = match account.smtp_port {
            587 => AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&account.smtp_host)
                .map_err(|e| {
                    tracing::warn!("smtp starttls relay failed: {e}");
                    AppError::EmailSmtpAuthFailed
                })?
                .credentials(SmtpCredentials::new(username.clone(), password.clone()))
                .port(account.smtp_port)
                .build(),
            465 => AsyncSmtpTransport::<Tokio1Executor>::relay(&account.smtp_host)
                .map_err(|e| {
                    tracing::warn!("smtp relay failed: {e}");
                    AppError::EmailSmtpAuthFailed
                })?
                .credentials(SmtpCredentials::new(username.clone(), password.clone()))
                .port(account.smtp_port)
                .build(),
            _ => {
                // For custom ports, try STARTTLS first, fallback to plain relay
                match AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&account.smtp_host) {
                    Ok(builder) => builder.credentials(SmtpCredentials::new(username.clone(), password.clone())).port(account.smtp_port).build(),
                    Err(_) => AsyncSmtpTransport::<Tokio1Executor>::relay(&account.smtp_host)
                        .map_err(|_| AppError::EmailSmtpAuthFailed)?
                        .credentials(SmtpCredentials::new(username.clone(), password.clone()))
                        .port(account.smtp_port)
                        .build(),
                }
            }
        };

        let from_mb: Mailbox = format!("{} <{}>", account.display_name.as_deref().unwrap_or(&account.email_address), account.email_address)
            .parse()
            .map_err(|_e: lettre::address::AddressError| AppError::EmailInvalidRecipient)?;

        let mut mb = MessageBuilder::new()
            .from(from_mb.clone())
            .subject(request.subject.clone());
        for to in &request.to {
            let m: Mailbox = to.parse().map_err(|_| AppError::EmailInvalidRecipient)?;
            mb = mb.to(m);
        }
        if let Some(cc) = &request.cc {
            for c in cc {
                let m: Mailbox = c.parse().map_err(|_| AppError::EmailInvalidRecipient)?;
                mb = mb.cc(m);
            }
        }
        if let Some(bcc) = &request.bcc {
            for b in bcc {
                let m: Mailbox = b.parse().map_err(|_| AppError::EmailInvalidRecipient)?;
                mb = mb.bcc(m);
            }
        }

        let msg = if let Some(html) = &request.body_html {
            mb.multipart(
                lettre::message::MultiPart::alternative()
                    .singlepart(
                        lettre::message::SinglePart::builder()
                            .header(lettre::message::header::ContentType::TEXT_PLAIN)
                            .body(request.body),
                    )
                    .singlepart(
                        lettre::message::SinglePart::builder()
                            .header(lettre::message::header::ContentType::TEXT_HTML)
                            .body(html.clone()),
                    ),
            )
        } else {
            mb.body(request.body)
        }
        .map_err(|_| AppError::EmailSendFailed)?;

        let _resp = transport
            .send(msg)
            .await
            .map_err(|_| AppError::EmailSendFailed)?;

        Ok(SendResult {
            message_id: Some(format!("<{}@aura.local>", chrono::Utc::now().timestamp_millis())),
            status: "sent".into(),
        })
    }

    // ── IMAP Sync ────────────────────────────────────────────────────────

    pub async fn sync_emails(
        &self,
        state: &AppState,
        options: EmailSyncOptions,
    ) -> AppResult<SyncResult> {
        let (wallet, _master_key) = super::auth::AuthService::require_session(state)?;
        let account_repo = self.account_repo();
        let email_repo = self.email_repo();

        let accounts = if let Some(ref id) = options.account_id {
            match account_repo.find_by_id(id)? {
                Some(acc) => vec![acc],
                None => return Err(AppError::EmailAccountNotFound),
            }
        } else {
            account_repo.list_by_wallet(&wallet)?
        };

        let mut new_count = 0;
        let mut errors = vec![];

        for account in accounts {
            if !account.is_active {
                continue;
            }
            match self
                .sync_account_imap(state, &account, &email_repo, options.full_sync.unwrap_or(false))
                .await
            {
                Ok(n) => new_count += n,
                Err(e) => {
                    errors.push(SyncError {
                        account_id: account.id.clone(),
                        error_code: e.code().to_string(),
                    });
                }
            }
        }

        Ok(SyncResult {
            new_count,
            updated_count: 0,
            errors,
        })
    }

    async fn sync_account_imap(
        &self,
        state: &AppState,
        account: &EmailAccount,
        _email_repo: &EmailRepo,
        full_sync: bool,
    ) -> AppResult<u32> {
        let (username, password) = self.decrypt_creds(state, account)?;
        let account_id = account.id.clone();
        let imap_host = account.imap_host.clone();
        let imap_port = account.imap_port;
        let pool = self.pool.clone();

        let inserted = tokio::task::spawn_blocking(move || {
            let tls = native_tls::TlsConnector::new()
                .map_err(|e| AppError::Internal(format!("tls init: {e}")))?;
            let client = imap::connect((imap_host.as_str(), imap_port), imap_host.as_str(), &tls)
                .map_err(|e| {
                    tracing::warn!("imap connect failed: {e}");
                    AppError::EmailImapAuthFailed
                })?;

            let mut session = client
                .login(&username, &password)
                .map_err(|(e, _)| {
                    tracing::warn!("imap login failed: {e}");
                    AppError::EmailImapAuthFailed
                })?;

            let mailbox = session.select("INBOX").map_err(|_| AppError::EmailFolderNotFound)?;
            let total = mailbox.exists as u32;
            if total == 0 {
                return Ok::<u32, AppError>(0);
            }

            let range = if full_sync {
                "1:*".to_string()
            } else {
                let start = total.saturating_sub(49).max(1);
                format!("{start}:{total}")
            };

            // Fetch full RFC822 to get both headers and body
            let messages = session
                .fetch(&range, "RFC822")
                .map_err(|e| {
                    tracing::warn!("imap fetch failed: {e}");
                    AppError::EmailSyncFailed
                })?;

            let repo = EmailRepo::new(pool);
            let mut inserted = 0u32;
            for msg in messages.iter() {
                let body_bytes = msg.body().unwrap_or_default();
                if body_bytes.is_empty() {
                    continue;
                }
                let body_str = String::from_utf8_lossy(body_bytes);

                // Parse headers and body from full RFC822 content
                let (headers, body) = split_headers_body(&body_str);

                let message_id = extract_header(&headers, "Message-ID")
                    .unwrap_or_else(|| format!("<{}@local>", chrono::Utc::now().timestamp_millis()));

                // Skip duplicates
                if repo
                    .find_by_message_id(&account_id, &message_id)
                    .unwrap_or(None)
                    .is_some()
                {
                    continue;
                }

                let subject = extract_header(&headers, "Subject").unwrap_or_else(|| "(无主题)".to_string());
                let from = extract_header(&headers, "From").unwrap_or_else(|| "unknown".to_string());
                let (sender, sender_name) = parse_from(&from);
                let date = extract_header(&headers, "Date")
                    .and_then(|d| parse_rfc2822_date(&d))
                    .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());
                
                let to_header = extract_header(&headers, "To").unwrap_or_default();
                let cc_header = extract_header(&headers, "Cc").unwrap_or_default();

                // Extract plain text body from multipart or singlepart
                let (body_text, body_html, has_attachments) = parse_email_body(&body);
                let snippet = body_text.as_ref()
                    .map(|t| t.chars().take(200).collect::<String>())
                    .or_else(|| body_html.as_ref().map(|h| strip_html_tags(h).chars().take(200).collect::<String>()));

                let id = uuid::Uuid::new_v4().to_string();
                let _ = repo.insert(CreateEmail {
                    id: &id,
                    email_account_id: &account_id,
                    message_id: &message_id,
                    folder: "INBOX",
                    subject: Some(&subject),
                    sender: &sender,
                    sender_name: sender_name.as_deref(),
                    recipients_to: Some(&to_header),
                    recipients_cc: Some(&cc_header),
                    recipients_bcc: None,
                    body_text: body_text.as_deref(),
                    body_html: body_html.as_deref(),
                    snippet: snippet.as_deref(),
                    received_at: &date,
                    is_read: false,
                    is_starred: false,
                    has_attachments,
                    raw_size: Some(body_bytes.len() as i64),
                });

                inserted += 1;
            }

            Ok::<u32, AppError>(inserted)
        })
        .await
        .map_err(|e| AppError::Internal(format!("spawn blocking: {e}")))??;

        Ok(inserted)
    }

    // ── Static verify ────────────────────────────────────────────────────

    /// Verify both SMTP and IMAP connectivity for the given config.
    /// Returns true only if both connections succeed.
    pub async fn verify_account(config: AccountConfig) -> AppResult<bool> {
        use std::time::Duration;
        const VERIFY_TIMEOUT: Duration = Duration::from_secs(10);

        // Cheap config validation first — no network needed.
        if config.imap_host.trim().is_empty()
            || config.smtp_host.trim().is_empty()
            || config.username.trim().is_empty()
            || config.password.is_empty()
        {
            return Err(AppError::EmailSmtpAuthFailed);
        }

        // ── Verify SMTP ─────────────────────────────────────────────
        let smtp_transport: AsyncSmtpTransport<Tokio1Executor> = match config.smtp_port {
            587 => AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&config.smtp_host)
                .map_err(|_| AppError::EmailSmtpAuthFailed)?
                .credentials(SmtpCredentials::new(config.username.clone(), config.password.clone()))
                .port(config.smtp_port)
                .timeout(Some(Duration::from_secs(8)))
                .build(),
            _ => AsyncSmtpTransport::<Tokio1Executor>::relay(&config.smtp_host)
                .map_err(|_| AppError::EmailSmtpAuthFailed)?
                .credentials(SmtpCredentials::new(config.username.clone(), config.password.clone()))
                .port(config.smtp_port)
                .timeout(Some(Duration::from_secs(8)))
                .build(),
        };
        let smtp_result = tokio::time::timeout(VERIFY_TIMEOUT, smtp_transport.test_connection()).await;
        match smtp_result {
            Ok(Ok(_)) => {},
            Ok(Err(_)) | Err(_) => return Err(AppError::EmailSmtpAuthFailed),
        }

        // ── Verify IMAP ─────────────────────────────────────────────
        let imap_host = config.imap_host.clone();
        let imap_port = config.imap_port;
        let username = config.username.clone();
        let password = config.password.clone();
        let imap_result = tokio::time::timeout(VERIFY_TIMEOUT, tokio::task::spawn_blocking(move || {
            let tls = native_tls::TlsConnector::new()
                .map_err(|e| AppError::Internal(format!("tls init: {e}")))?;
            let client = imap::connect((imap_host.as_str(), imap_port), imap_host.as_str(), &tls)
                .map_err(|_| AppError::EmailImapAuthFailed)?;
            let _session = client
                .login(&username, &password)
                .map_err(|(e, _)| {
                    tracing::warn!("imap verify login failed: {e}");
                    AppError::EmailImapAuthFailed
                })?;
            Ok::<(), AppError>(())
        })).await;
        match imap_result {
            Ok(Ok(_)) => Ok(true),
            Ok(Err(_)) | Err(_) => Err(AppError::EmailImapAuthFailed),
        }
    }
}

// ── Helpers ──────────────────────────────────────────────────────────

fn extract_header(headers: &str, name: &str) -> Option<String> {
    let pat = format!("{}:", name);
    for line in headers.lines() {
        if line.trim_start().starts_with(&pat) {
            let val = line.splitn(2, ':').nth(1)?.trim().to_string();
            return Some(val);
        }
    }
    None
}

fn parse_from(from: &str) -> (String, Option<String>) {
    // Handle "Name <email@example.com>" or just "email@example.com"
    if let Some(start) = from.rfind('<') {
        if let Some(end) = from.rfind('>') {
            let email = from[start + 1..end].trim().to_string();
            let name = from[..start].trim().trim_matches('"').to_string();
            let name = if name.is_empty() { None } else { Some(name) };
            return (email, name);
        }
    }
    (from.trim().to_string(), None)
}

fn parse_rfc2822_date(date_str: &str) -> Option<String> {
    // Try chrono's RFC2822 parser
    chrono::DateTime::parse_from_rfc2822(date_str)
        .ok()
        .map(|d| d.to_rfc3339())
}

/// Split RFC822 content into headers section and body section.
/// Headers and body are separated by a blank line.
fn split_headers_body(content: &str) -> (String, String) {
    let mut headers = String::new();
    let mut body = String::new();
    let mut in_body = false;
    let mut prev_empty = false;

    for line in content.lines() {
        if in_body {
            body.push_str(line);
            body.push('\n');
        } else if line.is_empty() {
            if prev_empty || !headers.is_empty() {
                in_body = true;
            }
            prev_empty = true;
        } else {
            headers.push_str(line);
            headers.push('\n');
            prev_empty = false;
        }
    }

    (headers, body)
}

/// Parse email body to extract plain text, HTML, and detect attachments.
/// Handles simple multipart boundaries and singlepart messages.
fn parse_email_body(body: &str) -> (Option<String>, Option<String>, bool) {
    let mut text = None;
    let mut html = None;
    let mut has_attachments = false;

    // Check for multipart boundary
    let boundary = body.lines()
        .find(|l| l.trim_start().to_lowercase().starts_with("content-type: multipart/"))
        .and_then(|l| l.split("boundary=").nth(1))
        .map(|b| b.trim().trim_matches('"').trim_matches('\''));

    if let Some(boundary) = boundary {
        let parts: Vec<&str> = body.split(&format!("--{}", boundary)).collect();
        for part in parts {
            let part_lower = part.to_lowercase();
            if part_lower.contains("content-type: text/plain") {
                if let Some(body_start) = part.find("\n\n").or_else(|| part.find("\r\n\r\n")) {
                    let content = part[body_start..].trim();
                    if !content.is_empty() && text.is_none() {
                        text = Some(content.to_string());
                    }
                }
            } else if part_lower.contains("content-type: text/html") {
                if let Some(body_start) = part.find("\n\n").or_else(|| part.find("\r\n\r\n")) {
                    let content = part[body_start..].trim();
                    if !content.is_empty() && html.is_none() {
                        html = Some(content.to_string());
                    }
                }
            } else if part_lower.contains("content-disposition: attachment")
                || (part_lower.contains("content-type:") && !part_lower.contains("text/") && !part_lower.contains("multipart/"))
            {
                has_attachments = true;
            }
        }
    }

    // Fallback: if no multipart or no text/html found, treat entire body as plain text
    if text.is_none() && html.is_none() {
        let trimmed = body.trim();
        if !trimmed.is_empty() {
            text = Some(trimmed.to_string());
        }
    }

    (text, html, has_attachments)
}

/// Strip HTML tags to produce plain text snippet.
fn strip_html_tags(html: &str) -> String {
    let mut result = String::new();
    let mut in_tag = false;
    for ch in html.chars() {
        if ch == '<' {
            in_tag = true;
        } else if ch == '>' {
            in_tag = false;
        } else if !in_tag {
            result.push(ch);
        }
    }
    result.trim().to_string()
}
