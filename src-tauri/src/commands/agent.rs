use std::sync::Arc;

use tauri::State;

use crate::database::repositories::agent::{AgentRepo, CreateAgent, UpdateAgent};
use crate::database::SharedPool;
use crate::error::AppResult;
use crate::models::{CreateReplyAgentRequest, ReplyAgent};
use crate::services::auth::AuthService;
use crate::state::AppState;

fn pool(state: &State<'_, Arc<AppState>>) -> SharedPool {
    crate::database::init(&state.db_path()).expect("db init")
}

#[tauri::command(rename_all = "camelCase")]
pub fn agent_create(
    name: String,
    description: Option<String>,
    icon: Option<String>,
    system_prompt: String,
    provider: Option<String>,
    model: Option<String>,
    temperature: Option<f64>,
    max_tokens: Option<u32>,
    default_skill_id: Option<String>,
    trigger_categories: Option<Vec<String>>,
    state: State<'_, Arc<AppState>>,
) -> AppResult<ReplyAgent> {
    let req = CreateReplyAgentRequest {
        name,
        description: description.unwrap_or_default(),
        icon: icon.unwrap_or_else(|| "wand".into()),
        system_prompt,
        provider,
        model,
        temperature: temperature.unwrap_or(0.7),
        max_tokens: max_tokens.unwrap_or(2000),
        default_skill_id,
        trigger_categories: trigger_categories.unwrap_or_default(),
    };
    let (wallet, _key) = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = AgentRepo::new(pool);
    let id = uuid::Uuid::new_v4().to_string();
    let cats_json = serde_json::to_string(&req.trigger_categories).unwrap_or_else(|_| "[]".into());
    let result = repo.create(CreateAgent {
        id: &id,
        wallet_address: &wallet,
        name: &req.name,
        description: &req.description,
        icon: &req.icon,
        system_prompt: &req.system_prompt,
        provider: req.provider.as_deref(),
        model: req.model.as_deref(),
        temperature: req.temperature,
        max_tokens: req.max_tokens,
        default_skill_id: req.default_skill_id.as_deref(),
        trigger_categories_json: &cats_json,
    });
    drop(cats_json);
    result
}

#[tauri::command(rename_all = "camelCase")]
pub fn agent_list(state: State<'_, Arc<AppState>>) -> AppResult<Vec<ReplyAgent>> {
    let (wallet, _key) = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = AgentRepo::new(pool);
    repo.list_by_wallet(&wallet)
}

#[tauri::command(rename_all = "camelCase")]
pub fn agent_get(id: String, state: State<'_, Arc<AppState>>) -> AppResult<Option<ReplyAgent>> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = AgentRepo::new(pool);
    repo.find_by_id(&id)
}

#[tauri::command(rename_all = "camelCase")]
pub fn agent_update(
    id: String,
    name: Option<String>,
    description: Option<String>,
    icon: Option<String>,
    system_prompt: Option<String>,
    provider: Option<Option<String>>,
    model: Option<Option<String>>,
    temperature: Option<f64>,
    max_tokens: Option<u32>,
    default_skill_id: Option<Option<String>>,
    trigger_categories: Option<Vec<String>>,
    state: State<'_, Arc<AppState>>,
) -> AppResult<ReplyAgent> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = AgentRepo::new(pool);
    repo.find_by_id(&id)?
        .ok_or(crate::error::AppError::Internal("AGENT_NOT_FOUND".into()))?;

    let mut update = UpdateAgent::default();
    if let Some(ref n) = name { update.name = Some(n.as_str()); }
    if let Some(ref d) = description { update.description = Some(d.as_str()); }
    if let Some(ref i) = icon { update.icon = Some(i.as_str()); }
    if let Some(ref s) = system_prompt { update.system_prompt = Some(s.as_str()); }
    let provider_owned: Option<Option<String>> = provider;
    let model_owned: Option<Option<String>> = model;
    let default_skill_owned: Option<Option<String>> = default_skill_id;
    if let Some(ref p) = provider_owned { update.provider = Some(p.as_deref()); }
    if let Some(ref m) = model_owned { update.model = Some(m.as_deref()); }
    if let Some(t) = temperature { update.temperature = Some(t); }
    if let Some(mt) = max_tokens { update.max_tokens = Some(mt); }
    if let Some(ref ds) = default_skill_owned { update.default_skill_id = Some(ds.as_deref()); }
    let cats_json: Option<String>;
    if let Some(ref cats) = trigger_categories {
        cats_json = Some(serde_json::to_string(cats).unwrap_or_else(|_| "[]".into()));
        if let Some(ref c) = cats_json { update.trigger_categories_json = Some(c.as_str()); }
    } else { cats_json = None; }

    repo.update(&id, update)?;
    drop(cats_json);
    repo.find_by_id(&id)?.ok_or(crate::error::AppError::Internal("AGENT_NOT_FOUND".into()))
}

#[tauri::command(rename_all = "camelCase")]
pub fn agent_delete(id: String, state: State<'_, Arc<AppState>>) -> AppResult<()> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = AgentRepo::new(pool);
    repo.delete(&id)?;
    Ok(())
}

#[tauri::command(rename_all = "camelCase")]
pub fn agent_incr_use(id: String, state: State<'_, Arc<AppState>>) -> AppResult<()> {
    let _ = AuthService::require_session(&state)?;
    let pool = pool(&state);
    let repo = AgentRepo::new(pool);
    repo.incr_use_count(&id)
}
