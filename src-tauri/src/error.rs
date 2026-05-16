//! Unified backend error type.
//!
//! Every #[tauri::command] returns AppResult<T>. AppError serializes to
//! `{ code: "EMAIL_IMAP_AUTH_FAILED", message: "..." }` which mirrors the
//! existing Electron IpcResponse error shape so the renderer doesn't have to
//! change error handling semantics.

use serde::{Serialize, Serializer};

pub type AppResult<T> = Result<T, AppError>;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    // ── Auth ──────────────────────────────────────────────
    #[error("AUTH_WALLET_REJECTED")]
    AuthWalletRejected,
    #[error("AUTH_SIGN_FAILED")]
    AuthSignFailed,
    #[error("AUTH_NOT_UNLOCKED")]
    AuthNotUnlocked,

    // ── Email ─────────────────────────────────────────────
    #[error("EMAIL_INVALID_RECIPIENT")]
    EmailInvalidRecipient,
    #[error("EMAIL_ACCOUNT_NOT_FOUND")]
    EmailAccountNotFound,
    #[error("EMAIL_IMAP_AUTH_FAILED")]
    EmailImapAuthFailed,
    #[error("EMAIL_SMTP_AUTH_FAILED")]
    EmailSmtpAuthFailed,
    #[error("EMAIL_SEND_FAILED")]
    EmailSendFailed,
    #[error("EMAIL_SYNC_FAILED")]
    EmailSyncFailed,
    #[error("EMAIL_FOLDER_NOT_FOUND")]
    EmailFolderNotFound,
    #[error("EMAIL_NOT_FOUND")]
    EmailNotFound,

    // ── AI ────────────────────────────────────────────────
    #[error("AI_PROVIDER_UNAVAILABLE")]
    AiProviderUnavailable,
    #[error("AI_RATE_LIMITED")]
    AiRateLimited,
    #[error("AI_CANCELLED")]
    AiCancelled,

    // ── Network ───────────────────────────────────────────
    #[error("NET_OFFLINE")]
    NetOffline,
    #[error("NET_TIMEOUT")]
    NetTimeout,

    // ── Generic / wrapped ─────────────────────────────────
    #[error("DB_ERROR: {0}")]
    Db(String),
    #[error("CRYPTO_ERROR: {0}")]
    Crypto(String),
    #[error("IO_ERROR: {0}")]
    Io(String),
    #[error("SERIALIZE_ERROR: {0}")]
    Serialize(String),
    #[error("INTERNAL: {0}")]
    Internal(String),
}

impl AppError {
    /// Stable error code surfaced to the renderer. Mirrors `ERROR_CODES` in
    /// `src/shared/constants/errors.ts`.
    pub fn code(&self) -> &'static str {
        match self {
            AppError::AuthWalletRejected => "AUTH_WALLET_REJECTED",
            AppError::AuthSignFailed => "AUTH_SIGN_FAILED",
            AppError::AuthNotUnlocked => "AUTH_NOT_UNLOCKED",
            AppError::EmailInvalidRecipient => "EMAIL_INVALID_RECIPIENT",
            AppError::EmailAccountNotFound => "EMAIL_ACCOUNT_NOT_FOUND",
            AppError::EmailImapAuthFailed => "EMAIL_IMAP_AUTH_FAILED",
            AppError::EmailSmtpAuthFailed => "EMAIL_SMTP_AUTH_FAILED",
            AppError::EmailSendFailed => "EMAIL_SEND_FAILED",
            AppError::EmailSyncFailed => "EMAIL_SYNC_FAILED",
            AppError::EmailFolderNotFound => "EMAIL_FOLDER_NOT_FOUND",
            AppError::EmailNotFound => "EMAIL_NOT_FOUND",
            AppError::AiProviderUnavailable => "AI_PROVIDER_UNAVAILABLE",
            AppError::AiRateLimited => "AI_RATE_LIMITED",
            AppError::AiCancelled => "AI_CANCELLED",
            AppError::NetOffline => "NET_OFFLINE",
            AppError::NetTimeout => "NET_TIMEOUT",
            AppError::Db(_) => "DB_ERROR",
            AppError::Crypto(_) => "CRYPTO_ERROR",
            AppError::Io(_) => "IO_ERROR",
            AppError::Serialize(_) => "SERIALIZE_ERROR",
            AppError::Internal(_) => "INTERNAL",
        }
    }
}

impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        use serde::ser::SerializeStruct;
        let mut st = s.serialize_struct("AppError", 2)?;
        st.serialize_field("code", self.code())?;
        st.serialize_field("message", &self.to_string())?;
        st.end()
    }
}

// ── From impls for common foreign errors ──────────────────
impl From<rusqlite::Error> for AppError {
    fn from(e: rusqlite::Error) -> Self {
        AppError::Db(e.to_string())
    }
}
impl From<r2d2::Error> for AppError {
    fn from(e: r2d2::Error) -> Self {
        AppError::Db(e.to_string())
    }
}
impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::Io(e.to_string())
    }
}
impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self {
        AppError::Serialize(e.to_string())
    }
}
impl From<anyhow::Error> for AppError {
    fn from(e: anyhow::Error) -> Self {
        AppError::Internal(e.to_string())
    }
}
