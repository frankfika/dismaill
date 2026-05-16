use std::sync::Arc;

use tauri::State;

use crate::database::repositories::email::EmailRepo;
use crate::database::SharedPool;
use crate::error::AppResult;
use crate::models::{Email, EmailListRequest, EmailSendRequest, EmailSyncOptions, SendResult, SyncResult};
use crate::services::auth::AuthService;
use crate::services::email::EmailService;
use crate::state::AppState;

fn pool(state: &State<'_, Arc<AppState>>) -> SharedPool {
    crate::database::init(&state.db_path()).expect("db init")
}

#[tauri::command(rename_all = "camelCase")]
pub async fn email_send(
    request: EmailSendRequest,
    state: State<'_, Arc<AppState>>,
) -> AppResult<SendResult> {
    let pool = pool(&state);
    let service = EmailService::new(pool);
    service.send_email(&state, request).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn email_sync(
    options: EmailSyncOptions,
    state: State<'_, Arc<AppState>>,
) -> AppResult<SyncResult> {
    let pool = pool(&state);
    let service = EmailService::new(pool);
    service.sync_emails(&state, options).await
}

#[tauri::command(rename_all = "camelCase")]
pub fn email_list(
    account_id: Option<String>,
    folder: Option<String>,
    page: u32,
    page_size: u32,
    state: State<'_, Arc<AppState>>,
) -> AppResult<Vec<Email>> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = EmailRepo::new(pool);
    let req = EmailListRequest {
        account_id,
        folder: folder.clone(),
        tag_id: None,
        query: None,
        page,
        page_size,
    };
    Ok(repo.list(&req)?.emails.into_iter().map(|s| Email {
        id: s.id,
        email_account_id: s.account_id,
        message_id: s.message_id,
        folder: folder.clone().unwrap_or_else(|| "INBOX".into()),
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
