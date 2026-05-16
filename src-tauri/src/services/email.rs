//! Email service — SMTP send + IMAP sync.

use std::sync::Arc;

use lettre::message::{Mailbox, MessageBuilder};
use lettre::transport::smtp::authentication::Credentials as SmtpCredentials;
use lettre::{AsyncSmtpTransport, AsyncTransport, Tokio1Executor};

use crate::database::repositories::email::EmailRepo;
use crate::database::repositories::email_account::EmailAccountRepo;
use crate::database::SharedPool;
use crate::error::{AppError, AppResult};
use crate::models::{
    AccountConfig, Email, EmailAccount, EmailSendRequest, EmailSyncOptions, OutboxItem, SendResult,
    SyncResult,
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

        let creds = SmtpCredentials::new(username, password);
        let builder = AsyncSmtpTransport::<Tokio1Executor>::relay(&account.smtp_host)
            .map_err(|_| AppError::EmailSmtpAuthFailed)?
            .credentials(creds)
            .port(account.smtp_port as u16);
        let transport: AsyncSmtpTransport<Tokio1Executor> = builder.build();

        let from_mb: Mailbox = format!("{} <{}>", account.display_name.as_deref().unwrap_or(&account.email_address), account.email_address)
            .parse()
            .map_err(|e: lettre::address::AddressError| AppError::EmailInvalidRecipient)?;

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

        let resp = transport
            .send(msg)
            .await
            .map_err(|_| AppError::EmailSendFailed)?;

        Ok(SendResult {
            message_id: Some(format!("<{}@aura.local>", chrono::Utc::now().timestamp_millis())),
            status: "sent".into(),
        })
    }

    // ── IMAP Sync (stub — full impl needs async-imap or similar) ─────────

    pub async fn sync_emails(
        &self,
        _state: &AppState,
        options: EmailSyncOptions,
    ) -> AppResult<SyncResult> {
        // TODO: replace with real IMAP sync (async-imap / imap-flow Rust crate).
        // For now return empty success so the UI compiles.
        Ok(SyncResult {
            new_count: 0,
            updated_count: 0,
            errors: vec![],
        })
    }

    // ── List / Get ───────────────────────────────────────────────────────

    pub fn list_emails(
        &self,
        state: &AppState,
        account_id: Option<String>,
        folder: Option<String>,
        page: u32,
        page_size: u32,
    ) -> AppResult<Vec<Email>> {
        let _ = super::auth::AuthService::require_session(state)?;
        let repo = self.email_repo();
        let req = crate::models::EmailListRequest {
            account_id,
            folder,
            tag_id: None,
            query: None,
            page,
            page_size,
        };
        // list() returns EmailSummary; map to Email for compatibility
        Ok(repo.list(&req)?.emails.into_iter().map(|s| Email {
            id: s.id,
            email_account_id: s.account_id,
            message_id: s.message_id,
            folder: req.folder.clone().unwrap_or_else(|| "INBOX".into()),
            subject: Some(s.subject.clone()),
            sender: s.sender.clone(),
            sender_name: s.sender_name.clone(),
            recipients_to: None,
            recipients_cc: None,
            recipients_bcc: None,
            body_text: Some(s.snippet.clone()),
            body_html: None,
            snippet: Some(s.snippet),
            received_at: s.received_at,
            is_read: s.is_read,
            is_starred: s.is_starred,
            is_deleted: false,
            has_attachments: false,
        }).collect())
    }

    pub fn get_email(&self, email_id: &str) -> AppResult<Option<Email>> {
        self.email_repo().find_by_id(email_id)
    }

    pub fn mark_read(&self, email_ids: &[String], is_read: bool) -> AppResult<u32> {
        let repo = self.email_repo();
        let n = repo.mark_read(email_ids, is_read)?;
        Ok(n as u32)
    }

    pub fn delete_emails(&self, email_ids: &[String], permanent: bool) -> AppResult<(u32, u32)> {
        let repo = self.email_repo();
        if permanent {
            let n = repo.hard_delete(email_ids)?;
            Ok((0, n as u32))
        } else {
            let n = repo.soft_delete(email_ids)?;
            Ok((n as u32, 0))
        }
    }

    pub fn get_folders(&self, account_id: &str) -> AppResult<Vec<String>> {
        let repo = self.email_repo();
        let folders = repo.folders_for_account(account_id)?;
        Ok(folders.into_iter().map(|f| f.name).collect())
    }

    // ── Static verify ────────────────────────────────────────────────────

    pub async fn verify_account(config: AccountConfig) -> AppResult<bool> {
        let creds = SmtpCredentials::new(config.username.clone(), config.password.clone());
        let transport: AsyncSmtpTransport<Tokio1Executor> = AsyncSmtpTransport::<Tokio1Executor>::relay(&config.smtp_host)
            .map_err(|_| AppError::EmailSmtpAuthFailed)?
            .credentials(creds)
            .port(config.smtp_port as u16)
            .build();
        transport
            .test_connection()
            .await
            .map_err(|_| AppError::EmailSmtpAuthFailed)?;
        Ok(true)
    }
}
