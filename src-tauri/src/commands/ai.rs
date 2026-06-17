use std::sync::Arc;

use tauri::State;

use crate::database::repositories::agent::AgentRepo;
use crate::database::repositories::skill::SkillRepo;
use crate::database::SharedPool;
use crate::error::AppResult;
use crate::models::{
    AiClassifyRequest, AiClassifyResponse, AiGenerateRequest, AiGenerateResponse, AiProvider,
    AiRefineRequest, AiRefineResponse, ConfigureProviderRequest, ReplyAgent, ReplySkill,
};
use crate::services::ai::AiService;
use crate::state::AppState;

fn service() -> AiService {
    AiService::new()
}

fn pool(state: &State<'_, Arc<AppState>>) -> SharedPool {
    crate::database::init(&state.db_path()).expect("db init")
}

/// Resolve an agent (by id) and a skill (by id) from the database, then
/// call the AI service. This keeps the renderer's payload tiny and lets
/// us centralize the "agent default-skill fallback" logic in Rust.
async fn resolve_agent_and_skill(
    state: &State<'_, Arc<AppState>>,
    agent_id: Option<String>,
    skill: Option<ReplySkill>,
) -> AppResult<(Option<ReplyAgent>, Option<ReplySkill>)> {
    let pool = pool(state);
    let agent = if let Some(id) = agent_id.as_deref() {
        AgentRepo::new(SharedPool::clone(&pool)).find_by_id(id)?
    } else {
        None
    };
    let resolved_skill = if let Some(s) = skill {
        Some(s)
    } else if let Some(ref a) = agent {
        if let Some(sid) = a.default_skill_id.as_deref() {
            SkillRepo::new(SharedPool::clone(&pool)).find_by_id(sid)?
        } else {
            None
        }
    } else {
        None
    };
    Ok((agent, resolved_skill))
}

/// All commands here use **flat top-level args** (camelCase via `rename_all`).

#[tauri::command(rename_all = "camelCase")]
pub async fn ai_generate(
    prompt: String,
    agent_id: Option<String>,
    template_id: Option<String>,
    context: Option<serde_json::Value>,
    provider: Option<String>,
    model: Option<String>,
    max_tokens: Option<u32>,
    stream: Option<bool>,
    request_id: Option<String>,
    skill: Option<ReplySkill>,
    state: State<'_, Arc<AppState>>,
) -> AppResult<AiGenerateResponse> {
    let (agent, resolved_skill) = resolve_agent_and_skill(&state, agent_id, skill).await?;
    // Agent wins over per-call fields when the agent has a preference set.
    let (provider, model, max_tokens) = merge_agent_preference(
        &agent,
        provider,
        model,
        max_tokens,
    );
    let request = AiGenerateRequest {
        agent_id: None,
        agent: agent.clone(),
        template_id,
        prompt,
        context: context.and_then(|v| serde_json::from_value(v).ok()),
        provider,
        model,
        max_tokens,
        stream,
        request_id,
        skill: resolved_skill,
    };
    let result = service().generate(request).await;
    if let Ok(ref _r) = result {
        if let Some(a) = agent.as_ref() {
            let _ = AgentRepo::new(pool(&state)).incr_use_count(&a.id);
        }
    }
    result
}

#[tauri::command(rename_all = "camelCase")]
pub async fn ai_refine(
    content: String,
    action: String,
    target_language: Option<String>,
    instructions: Option<String>,
    provider: Option<String>,
    model: Option<String>,
    skill: Option<ReplySkill>,
    agent_id: Option<String>,
    state: State<'_, Arc<AppState>>,
) -> AppResult<AiRefineResponse> {
    let (agent, resolved_skill) = resolve_agent_and_skill(&state, agent_id, skill).await?;
    let (provider, model, _max_tokens) = merge_agent_preference(&agent, provider, model, None);
    let request = AiRefineRequest {
        content,
        action,
        target_language,
        instructions,
        provider,
        model,
        skill: resolved_skill,
        agent,
    };
    service().refine(request).await
}

fn merge_agent_preference(
    agent: &Option<ReplyAgent>,
    provider: Option<String>,
    model: Option<String>,
    max_tokens: Option<u32>,
) -> (Option<String>, Option<String>, Option<u32>) {
    if let Some(a) = agent {
        (
            provider.or_else(|| a.provider.clone()),
            model.or_else(|| a.model.clone()),
            max_tokens.or(Some(a.max_tokens)),
        )
    } else {
        (provider, model, max_tokens)
    }
}

#[tauri::command(rename_all = "camelCase")]
pub async fn ai_classify_email(
    email_id: String,
    email_content: Option<String>,
    available_tags: Vec<crate::models::AiClassifyTag>,
    provider: Option<String>,
    model: Option<String>,
) -> AppResult<AiClassifyResponse> {
    let request = AiClassifyRequest {
        email_id,
        email_content,
        available_tags,
        provider,
        model,
    };
    service().classify(request).await
}

#[tauri::command]
pub fn ai_providers() -> Vec<AiProvider> {
    service().get_providers()
}

#[tauri::command(rename_all = "camelCase")]
pub fn ai_configure_provider(
    provider_id: String,
    api_key: Option<String>,
    base_url: Option<String>,
) {
    let request = ConfigureProviderRequest { provider_id, api_key, base_url };
    service().configure_provider(&request.provider_id, request.api_key, request.base_url);
}
