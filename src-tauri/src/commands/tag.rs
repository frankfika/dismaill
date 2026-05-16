use std::sync::Arc;

use tauri::State;

use crate::database::repositories::tag::{CreateTag, TagRepo};
use crate::database::SharedPool;
use crate::error::AppResult;
use crate::models::{SmartFolder, Tag};
use crate::services::auth::AuthService;
use crate::state::AppState;

fn pool(state: &State<'_, Arc<AppState>>) -> SharedPool {
    crate::database::init(&state.db_path()).expect("db init")
}

#[tauri::command(rename_all = "camelCase")]
pub fn tag_create(
    name: String,
    color: String,
    description: Option<String>,
    state: State<'_, Arc<AppState>>,
) -> AppResult<Tag> {
    let (wallet, _key) = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = TagRepo::new(pool);
    let id = uuid::Uuid::new_v4().to_string();
    repo.create(CreateTag {
        id: &id,
        wallet_address: &wallet,
        name: &name,
        color: &color,
        description: description.as_deref(),
        is_ai_enabled: false,
    })
}

#[tauri::command(rename_all = "camelCase")]
pub fn tag_list(state: State<'_, Arc<AppState>>) -> AppResult<Vec<Tag>> {
    let (wallet, _key) = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = TagRepo::new(pool);
    repo.list_by_wallet(&wallet)
}

#[tauri::command(rename_all = "camelCase")]
pub fn tag_apply(
    email_ids: Vec<String>,
    tag_id: String,
    state: State<'_, Arc<AppState>>,
) -> AppResult<()> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = TagRepo::new(pool);
    for id in &email_ids {
        repo.apply(id, &tag_id, false, None)?;
    }
    Ok(())
}

#[tauri::command(rename_all = "camelCase")]
pub fn tag_auto_apply(
    email_id: String,
    state: State<'_, Arc<AppState>>,
) -> AppResult<Vec<String>> {
    let (wallet, _key) = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = TagRepo::new(pool);
    let tags = repo.list_by_wallet(&wallet)?;
    let mut applied = Vec::new();
    for tag in tags.iter().take(3) {
        repo.apply(&email_id, &tag.id, false, None)?;
        applied.push(tag.id.clone());
    }
    Ok(applied)
}

#[tauri::command(rename_all = "camelCase")]
pub fn tag_smart_folders(state: State<'_, Arc<AppState>>) -> AppResult<Vec<SmartFolder>> {
    let (wallet, _key) = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = TagRepo::new(pool);
    repo.smart_folders(&wallet)
}

#[tauri::command(rename_all = "camelCase")]
pub fn tag_delete(id: String, state: State<'_, Arc<AppState>>) -> AppResult<()> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = TagRepo::new(pool);
    repo.delete(&id)?;
    Ok(())
}
