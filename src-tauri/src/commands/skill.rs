use std::sync::Arc;

use tauri::State;

use crate::database::repositories::skill::{CreateSkill, SkillRepo, UpdateSkill};
use crate::database::SharedPool;
use crate::error::AppResult;
use crate::models::{CreateReplySkillRequest, ReplySkill};
use crate::services::auth::AuthService;
use crate::state::AppState;

fn pool(state: &State<'_, Arc<AppState>>) -> SharedPool {
    crate::database::init(&state.db_path()).expect("db init")
}

/// Reply-skill CRUD. Uses **flat top-level args** (camelCase via
/// `rename_all`) so the renderer can pass a single object without
/// wrapping it in a `request` envelope.

#[tauri::command(rename_all = "camelCase")]
pub fn skill_create(
    name: String,
    description: Option<String>,
    trigger_categories: Option<Vec<String>>,
    tone: Option<String>,
    language: Option<String>,
    max_length: Option<u32>,
    include_signature: Option<bool>,
    system_prompt: Option<String>,
    examples: Option<Vec<crate::models::ReplySkillExample>>,
    reply_template: Option<String>,
    state: State<'_, Arc<AppState>>,
) -> AppResult<ReplySkill> {
    let req: CreateReplySkillRequest = CreateReplySkillRequest {
        name,
        description: description.unwrap_or_default(),
        trigger_categories: trigger_categories.unwrap_or_default(),
        tone: tone.unwrap_or_else(|| "formal".to_string()),
        language: language.unwrap_or_else(|| "auto".to_string()),
        max_length: max_length.unwrap_or(500),
        include_signature: include_signature.unwrap_or(false),
        system_prompt: system_prompt.unwrap_or_default(),
        examples: examples.unwrap_or_default(),
        reply_template: reply_template.unwrap_or_default(),
    };
    let (wallet, _key) = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = SkillRepo::new(pool);
    let id = uuid::Uuid::new_v4().to_string();
    let cats_json = serde_json::to_string(&req.trigger_categories).unwrap_or_else(|_| "[]".into());
    let examples_json = serde_json::to_string(&req.examples).unwrap_or_else(|_| "[]".into());
    let result = repo.create(CreateSkill {
        id: &id,
        wallet_address: &wallet,
        name: &req.name,
        description: &req.description,
        trigger_categories_json: &cats_json,
        tone: &req.tone,
        language: &req.language,
        max_length: req.max_length,
        include_signature: req.include_signature,
        system_prompt: &req.system_prompt,
        examples_json: &examples_json,
        reply_template: &req.reply_template,
    });
    drop(cats_json);
    drop(examples_json);
    result
}

#[tauri::command(rename_all = "camelCase")]
pub fn skill_list(state: State<'_, Arc<AppState>>) -> AppResult<Vec<ReplySkill>> {
    let (wallet, _key) = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = SkillRepo::new(pool);
    repo.list_by_wallet(&wallet)
}

#[tauri::command(rename_all = "camelCase")]
pub fn skill_get(id: String, state: State<'_, Arc<AppState>>) -> AppResult<Option<ReplySkill>> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = SkillRepo::new(pool);
    repo.find_by_id(&id)
}

#[tauri::command(rename_all = "camelCase")]
pub fn skill_update(
    id: String,
    name: Option<String>,
    description: Option<String>,
    trigger_categories: Option<Vec<String>>,
    tone: Option<String>,
    language: Option<String>,
    max_length: Option<u32>,
    include_signature: Option<bool>,
    system_prompt: Option<String>,
    examples: Option<Vec<crate::models::ReplySkillExample>>,
    reply_template: Option<String>,
    state: State<'_, Arc<AppState>>,
) -> AppResult<ReplySkill> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = SkillRepo::new(pool);
    let _existing = repo.find_by_id(&id)?
        .ok_or(crate::error::AppError::Internal("SKILL_NOT_FOUND".into()))?;

    let mut update = UpdateSkill::default();
    if let Some(ref n) = name { update.name = Some(n.as_str()); }
    if let Some(ref d) = description { update.description = Some(d.as_str()); }
    let cats_json: Option<String>;
    if let Some(ref cats) = trigger_categories {
        cats_json = Some(serde_json::to_string(cats).unwrap_or_else(|_| "[]".into()));
        if let Some(ref c) = cats_json { update.trigger_categories_json = Some(c.as_str()); }
    } else { cats_json = None; }
    if let Some(ref t) = tone { update.tone = Some(t.as_str()); }
    if let Some(ref l) = language { update.language = Some(l.as_str()); }
    if let Some(m) = max_length { update.max_length = Some(m); }
    if let Some(i) = include_signature { update.include_signature = Some(i); }
    if let Some(ref s) = system_prompt { update.system_prompt = Some(s.as_str()); }
    let examples_json: Option<String>;
    if let Some(ref ex) = examples {
        examples_json = Some(serde_json::to_string(ex).unwrap_or_else(|_| "[]".into()));
        if let Some(ref e) = examples_json { update.examples_json = Some(e.as_str()); }
    } else { examples_json = None; }
    if let Some(ref t) = reply_template { update.reply_template = Some(t.as_str()); }

    repo.update(&id, update)?;
    drop(cats_json);
    drop(examples_json);
    repo.find_by_id(&id)?.ok_or(crate::error::AppError::Internal("SKILL_NOT_FOUND".into()))
}

#[tauri::command(rename_all = "camelCase")]
pub fn skill_delete(id: String, state: State<'_, Arc<AppState>>) -> AppResult<()> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = SkillRepo::new(pool);
    repo.delete(&id)?;
    Ok(())
}

/// Increment the use counter for analytics. Called by the renderer after
/// a generated/refined reply is actually accepted by the user.
#[tauri::command(rename_all = "camelCase")]
pub fn skill_incr_use(id: String, state: State<'_, Arc<AppState>>) -> AppResult<()> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = SkillRepo::new(pool);
    repo.incr_use_count(&id)
}
