use std::sync::Arc;

use tauri::State;

use crate::database::repositories::email_account::{CreateEmailAccount, EmailAccountRepo, UpdateEmailAccount};
use crate::database::SharedPool;
use crate::error::AppResult;
use crate::models::{AddAccountRequest, EmailAccount, UpdateAccountRequest, VerifyAccountRequest};
use crate::services::auth::AuthService;
use crate::services::crypto::{encrypt_credentials, StoredCredentials};
use crate::services::email::EmailService;
use crate::state::AppState;

fn pool(state: &State<'_, Arc<AppState>>) -> SharedPool {
    crate::database::init(&state.db_path()).expect("db init")
}

#[tauri::command(rename_all = "camelCase")]
pub fn account_add(
    request: AddAccountRequest,
    state: State<'_, Arc<AppState>>,
) -> AppResult<EmailAccount> {
    let (wallet, master_key) = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = EmailAccountRepo::new(pool);

    let id = uuid::Uuid::new_v4().to_string();
    let stored = StoredCredentials {
        password: request.credentials.password,
        oauth_token: request.credentials.oauth_token,
        token: None,
    };
    let encrypted = encrypt_credentials(
        &stored,
        &master_key,
    )?;

    let account = repo.create(CreateEmailAccount {
        id: &id,
        wallet_address: &wallet,
        email_address: &request.email_address,
        display_name: request.display_name.as_deref(),
        provider: &request.provider,
        imap_host: &request.imap_host,
        imap_port: request.imap_port,
        smtp_host: &request.smtp_host,
        smtp_port: request.smtp_port,
        auth_type: &request.auth_type,
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
    request: UpdateAccountRequest,
    state: State<'_, Arc<AppState>>,
) -> AppResult<EmailAccount> {
    let (_wallet, master_key) = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = EmailAccountRepo::new(pool);

    let account = repo
        .find_by_id(&request.id)?
        .ok_or(crate::error::AppError::EmailAccountNotFound)?;

    let _dn = request.display_name.clone();
    let _encrypted = request.credentials.as_ref().map(|creds| {
        let stored = StoredCredentials {
            password: creds.password.clone(),
            oauth_token: creds.oauth_token.clone(),
            token: None,
        };
        encrypt_credentials(&stored, &master_key)
    }).transpose()?;

    let mut update = UpdateEmailAccount::default();
    if let Some(ref dn) = _dn {
        update.display_name = Some(Some(dn));
    }
    if let Some(active) = request.is_active {
        update.is_active = Some(active);
    }
    if let Some(ref encrypted) = _encrypted {
        update.credentials = Some(encrypted);
    }

    repo.update(&request.id, update)?;
    repo.find_by_id(&request.id)?.ok_or(crate::error::AppError::EmailAccountNotFound)
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
pub async fn account_verify(request: VerifyAccountRequest) -> AppResult<bool> {
    let config = crate::models::AccountConfig {
        imap_host: request.imap_host,
        imap_port: request.imap_port,
        smtp_host: request.smtp_host,
        smtp_port: request.smtp_port,
        username: request.username,
        password: request.password,
    };
    EmailService::verify_account(config).await
}
