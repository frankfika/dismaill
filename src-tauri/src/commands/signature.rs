use std::sync::Arc;

use tauri::State;

use crate::database::repositories::signature::{CreateSignature, SignatureRepo, UpdateSignature};
use crate::database::SharedPool;
use crate::error::AppResult;
use crate::models::Signature;
use crate::services::auth::AuthService;
use crate::state::AppState;

fn pool(state: &State<'_, Arc<AppState>>) -> SharedPool {
    crate::database::init(&state.db_path()).expect("db init")
}

#[tauri::command(rename_all = "camelCase")]
pub fn signature_create(
    email_account_id: String,
    name: String,
    content_html: String,
    content_text: Option<String>,
    state: State<'_, Arc<AppState>>,
) -> AppResult<Signature> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = SignatureRepo::new(pool);
    let id = uuid::Uuid::new_v4().to_string();
    repo.create(CreateSignature {
        id: &id,
        email_account_id: &email_account_id,
        name: &name,
        content_html: &content_html,
        content_text: content_text.as_deref(),
        is_default: false,
    })
}

#[tauri::command(rename_all = "camelCase")]
pub fn signature_list(
    email_account_id: Option<String>,
    state: State<'_, Arc<AppState>>,
) -> AppResult<Vec<Signature>> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = SignatureRepo::new(pool);
    match email_account_id {
        Some(id) => repo.list_by_account(&id),
        None => Ok(vec![]),
    }
}

#[tauri::command(rename_all = "camelCase")]
pub fn signature_update(
    id: String,
    name: Option<String>,
    content_html: Option<String>,
    content_text: Option<String>,
    is_default: Option<bool>,
    state: State<'_, Arc<AppState>>,
) -> AppResult<Signature> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = SignatureRepo::new(pool);
    let mut update = UpdateSignature::default();
    if let Some(n) = &name { update.name = Some(n); }
    if let Some(h) = &content_html { update.content_html = Some(h); }
    update.content_text = Some(content_text.as_deref());
    if let Some(d) = is_default { update.is_default = Some(d); }
    repo.update(&id, update)?;
    repo.find_by_id(&id)?.ok_or(crate::error::AppError::Internal("SIGNATURE_NOT_FOUND".into()))
}

#[tauri::command(rename_all = "camelCase")]
pub fn signature_delete(id: String, state: State<'_, Arc<AppState>>) -> AppResult<()> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = SignatureRepo::new(pool);
    repo.delete(&id)?;
    Ok(())
}
