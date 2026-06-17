use std::sync::Arc;

use tauri::State;

use crate::database::repositories::email_account::{CreateEmailAccount, EmailAccountRepo, UpdateEmailAccount};
use crate::database::SharedPool;
use crate::error::AppResult;
use crate::models::{AccountCredentials, EmailAccount};
use crate::services::auth::AuthService;
use crate::services::crypto::{encrypt_credentials, StoredCredentials};
use crate::services::email_providers::ProviderPreset;
use crate::services::email::EmailService;
use crate::state::AppState;

fn pool(state: &State<'_, Arc<AppState>>) -> SharedPool {
    crate::database::init(&state.db_path()).expect("db init")
}

/// All commands here use **flat top-level args** (camelCase via `rename_all`),
/// matching the shape the renderer sends. Struct DTOs in `models/` remain
/// available for documentation and internal use, but commands don't require
/// the renderer to wrap payload in a `request` envelope.

#[tauri::command(rename_all = "camelCase")]
pub fn account_add(
    email_address: String,
    display_name: Option<String>,
    provider: String,
    imap_host: String,
    imap_port: u16,
    smtp_host: String,
    smtp_port: u16,
    auth_type: String,
    password: Option<String>,
    oauth_token: Option<String>,
    state: State<'_, Arc<AppState>>,
) -> AppResult<EmailAccount> {
    let (wallet, master_key) = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = EmailAccountRepo::new(pool);

    let stored = StoredCredentials {
        password: password.clone(),
        oauth_token: oauth_token.clone(),
        token: None,
    };
    let encrypted = encrypt_credentials(&stored, &master_key)?;
    let id = uuid::Uuid::new_v4().to_string();

    let account = repo.create(CreateEmailAccount {
        id: &id,
        wallet_address: &wallet,
        email_address: &email_address,
        display_name: display_name.as_deref(),
        provider: &provider,
        imap_host: &imap_host,
        imap_port,
        smtp_host: &smtp_host,
        smtp_port,
        auth_type: &auth_type,
        credentials: &encrypted,
    })?;
    Ok(account)
}

#[tauri::command(rename_all = "camelCase")]
pub fn account_list(state: State<'_, Arc<AppState>>) -> AppResult<Vec<EmailAccount>> {
    let (wallet, _key) = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = EmailAccountRepo::new(pool);
    repo.list_by_wallet(&wallet)
}

#[tauri::command(rename_all = "camelCase")]
pub fn account_update(
    id: String,
    display_name: Option<String>,
    is_active: Option<bool>,
    password: Option<String>,
    oauth_token: Option<String>,
    state: State<'_, Arc<AppState>>,
) -> AppResult<EmailAccount> {
    let (_wallet, master_key) = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = EmailAccountRepo::new(pool);

    let _account = repo
        .find_by_id(&id)?
        .ok_or(crate::error::AppError::EmailAccountNotFound)?;

    let mut update = UpdateEmailAccount::default();
    if let Some(ref dn) = display_name {
        update.display_name = Some(Some(dn.as_str()));
    }
    if let Some(active) = is_active {
        update.is_active = Some(active);
    }
    let encrypted: Option<String>;
    if password.is_some() || oauth_token.is_some() {
        let stored = StoredCredentials {
            password,
            oauth_token,
            token: None,
        };
        encrypted = Some(encrypt_credentials(&stored, &master_key)?);
    } else {
        encrypted = None;
    }
    if let Some(ref enc) = encrypted {
        update.credentials = Some(enc.as_str());
    }

    repo.update(&id, update)?;
    drop(encrypted);
    repo.find_by_id(&id)?.ok_or(crate::error::AppError::EmailAccountNotFound)
}

#[tauri::command(rename_all = "camelCase")]
pub fn account_delete(id: String, state: State<'_, Arc<AppState>>) -> AppResult<()> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = EmailAccountRepo::new(pool);
    repo.delete(&id)?;
    Ok(())
}

#[tauri::command(rename_all = "camelCase")]
pub async fn account_verify(
    imap_host: String,
    imap_port: u16,
    smtp_host: String,
    smtp_port: u16,
    username: String,
    password: String,
) -> AppResult<bool> {
    let config = crate::models::AccountConfig {
        imap_host,
        imap_port,
        smtp_host,
        smtp_port,
        username,
        password,
    };
    EmailService::verify_account(config).await
}

/// Lightweight lookup so the renderer can show a preset picker without
/// hard-coding the provider catalog twice.
#[tauri::command]
pub fn account_list_providers() -> Vec<ProviderPreset> {
    crate::services::email_providers::all()
}

/// Resolve a provider preset from a bare email address (e.g. `foo@gmail.com`
/// → Gmail). Returns `None` if no preset matches.
#[tauri::command]
pub fn account_detect_provider(email: String) -> Option<ProviderPreset> {
    crate::services::email_providers::detect(&email)
}

// Re-export to avoid the unused-import warning for `AccountCredentials` if
// other modules stop referencing it.
#[allow(dead_code)]
fn _keep_creds_in_scope(c: AccountCredentials) -> AccountCredentials {
    c
}
