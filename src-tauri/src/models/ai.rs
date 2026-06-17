use serde::{Deserialize, Serialize};

use super::agent::ReplyAgent;
use super::skill::ReplySkill;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiGenerateRequest {
    #[serde(default)]
    pub agent_id: Option<String>,
    /// Resolved agent object (loaded by the command before calling the
    /// service). The system prompt and provider preference come from
    /// this when present.
    #[serde(default)]
    pub agent: Option<ReplyAgent>,
    #[serde(default)]
    pub template_id: Option<String>,
    pub prompt: String,
    #[serde(default)]
    pub context: Option<AiContext>,
    #[serde(default)]
    pub provider: Option<String>,
    #[serde(default)]
    pub model: Option<String>,
    #[serde(default)]
    pub max_tokens: Option<u32>,
    #[serde(default)]
    pub stream: Option<bool>,
    #[serde(default)]
    pub request_id: Option<String>,
    /// Optional reply-skill object the renderer has already resolved. When
    /// present, the skill is folded into the system prompt.
    #[serde(default)]
    pub skill: Option<ReplySkill>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiContext {
    #[serde(default)]
    pub reply_to: Option<String>,
    #[serde(default)]
    pub thread_history: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiGenerateResponse {
    pub content: String,
    pub tokens_used: u32,
    pub provider: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiRefineRequest {
    pub content: String,
    pub action: String,
    #[serde(default)]
    pub target_language: Option<String>,
    #[serde(default)]
    pub instructions: Option<String>,
    #[serde(default)]
    pub provider: Option<String>,
    #[serde(default)]
    pub model: Option<String>,
    #[serde(default)]
    pub skill: Option<ReplySkill>,
    #[serde(default)]
    pub agent: Option<ReplyAgent>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiRefineResponse {
    pub content: String,
    pub diff: String,
    pub tokens_used: u32,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiClassifyRequest {
    pub email_id: String,
    #[serde(default)]
    pub email_content: Option<String>,
    pub available_tags: Vec<AiClassifyTag>,
    #[serde(default)]
    pub provider: Option<String>,
    #[serde(default)]
    pub model: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiClassifyTag {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiClassifyResponse {
    pub suggestions: Vec<AiClassifySuggestion>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiClassifySuggestion {
    pub tag_id: String,
    pub tag_name: String,
    pub confidence: f64,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiProvider {
    pub id: String,
    pub name: String,
    pub is_configured: bool,
    pub is_local: bool,
    pub models: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigureProviderRequest {
    pub provider_id: String,
    #[serde(default)]
    pub api_key: Option<String>,
    #[serde(default)]
    pub base_url: Option<String>,
}
