use std::sync::Arc;

use tauri::State;

use crate::database::repositories::email::EmailRepo;
use crate::database::SharedPool;
use crate::error::AppResult;
use crate::models::{Email, EmailListRequest, EmailListResponse, EmailSendRequest, EmailSyncOptions, SendResult, SyncResult};
use crate::services::auth::AuthService;
use crate::services::email::EmailService;
use crate::state::AppState;

fn pool(state: &State<'_, Arc<AppState>>) -> SharedPool {
    crate::database::init(&state.db_path()).expect("db init")
}

/// All commands here use **flat top-level args** (camelCase via `rename_all`).

#[tauri::command(rename_all = "camelCase")]
pub async fn email_send(
    account_id: String,
    to: Vec<String>,
    cc: Option<Vec<String>>,
    bcc: Option<Vec<String>>,
    subject: String,
    body: String,
    body_html: Option<String>,
    signature_id: Option<String>,
    reply_to: Option<String>,
    attachments: Option<Vec<crate::models::EmailAttachment>>,
    state: State<'_, Arc<AppState>>,
) -> AppResult<SendResult> {
    let pool = pool(&state);
    let service = EmailService::new(pool);
    let request = EmailSendRequest {
        account_id,
        to,
        cc,
        bcc,
        subject,
        body,
        body_html,
        signature_id,
        reply_to,
        attachments,
    };
    service.send_email(&state, request).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn email_sync(
    account_id: Option<String>,
    full_sync: Option<bool>,
    state: State<'_, Arc<AppState>>,
) -> AppResult<SyncResult> {
    let pool = pool(&state);
    let service = EmailService::new(pool);
    let options = EmailSyncOptions { account_id, full_sync };
    service.sync_emails(&state, options).await
}

#[tauri::command(rename_all = "camelCase")]
pub fn email_list(
    account_id: Option<String>,
    folder: Option<String>,
    page: u32,
    page_size: u32,
    state: State<'_, Arc<AppState>>,
) -> AppResult<EmailListResponse> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = EmailRepo::new(pool);
    let req = EmailListRequest {
        account_id,
        folder,
        tag_id: None,
        query: None,
        page,
        page_size,
    };
    repo.list(&req)
}

#[tauri::command(rename_all = "camelCase")]
pub fn email_get(id: String, state: State<'_, Arc<AppState>>) -> AppResult<Option<Email>> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = EmailRepo::new(pool);
    repo.find_by_id(&id)
}

#[tauri::command(rename_all = "camelCase")]
pub fn email_get_folders(account_id: String, state: State<'_, Arc<AppState>>) -> AppResult<Vec<String>> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = EmailRepo::new(pool);
    let folders = repo.folders_for_account(&account_id)?;
    Ok(folders.into_iter().map(|f| f.name).collect())
}

#[tauri::command(rename_all = "camelCase")]
pub fn email_mark_read(
    ids: Vec<String>,
    is_read: bool,
    state: State<'_, Arc<AppState>>,
) -> AppResult<u32> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = EmailRepo::new(pool);
    let n = repo.mark_read(&ids, is_read)?;
    Ok(n as u32)
}

#[tauri::command(rename_all = "camelCase")]
pub fn email_delete(
    ids: Vec<String>,
    permanent: bool,
    state: State<'_, Arc<AppState>>,
) -> AppResult<(u32, u32)> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = EmailRepo::new(pool);
    if permanent {
        let n = repo.hard_delete(&ids)?;
        Ok((0, n as u32))
    } else {
        let n = repo.soft_delete(&ids)?;
        Ok((n as u32, 0))
    }
}
