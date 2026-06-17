use serde::{Deserialize, Serialize};

/// A named "persona" / scenario preset for the AI assistant. The user
/// picks an agent when composing an email and the AI uses the agent's
/// system prompt, provider/model preferences, and (optionally) a default
/// skill on top of that.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReplyAgent {
    pub id: String,
    pub wallet_address: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub system_prompt: String,
    pub provider: Option<String>,
    pub model: Option<String>,
    pub temperature: f64,
    pub max_tokens: u32,
    pub default_skill_id: Option<String>,
    pub trigger_categories: Vec<String>,
    pub use_count: u32,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateReplyAgentRequest {
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default = "default_icon")]
    pub icon: String,
    pub system_prompt: String,
    #[serde(default)]
    pub provider: Option<String>,
    #[serde(default)]
    pub model: Option<String>,
    #[serde(default = "default_temperature")]
    pub temperature: f64,
    #[serde(default = "default_max_tokens")]
    pub max_tokens: u32,
    #[serde(default)]
    pub default_skill_id: Option<String>,
    #[serde(default)]
    pub trigger_categories: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateReplyAgentRequest {
    pub id: String,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub icon: Option<String>,
    #[serde(default)]
    pub system_prompt: Option<String>,
    #[serde(default)]
    pub provider: Option<Option<String>>,
    #[serde(default)]
    pub model: Option<Option<String>>,
    #[serde(default)]
    pub temperature: Option<f64>,
    #[serde(default)]
    pub max_tokens: Option<u32>,
    #[serde(default)]
    pub default_skill_id: Option<Option<String>>,
    #[serde(default)]
    pub trigger_categories: Option<Vec<String>>,
}

fn default_icon() -> String { "wand".into() }
fn default_temperature() -> f64 { 0.7 }
fn default_max_tokens() -> u32 { 2000 }
