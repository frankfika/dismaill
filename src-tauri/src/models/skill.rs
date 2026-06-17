use serde::{Deserialize, Serialize};

/// A user-trained reply template. The AI service composes a system prompt
/// from `system_prompt` + `examples` + style controls and uses it when
/// generating or refining an email reply.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReplySkill {
    pub id: String,
    pub wallet_address: String,
    pub name: String,
    pub description: String,
    pub trigger_categories: Vec<String>,
    pub tone: String,
    pub language: String,
    pub max_length: u32,
    pub include_signature: bool,
    pub system_prompt: String,
    pub examples: Vec<ReplySkillExample>,
    pub reply_template: String,
    pub use_count: u32,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReplySkillExample {
    pub incoming: String,
    pub outgoing: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateReplySkillRequest {
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub trigger_categories: Vec<String>,
    #[serde(default = "default_tone")]
    pub tone: String,
    #[serde(default = "default_language")]
    pub language: String,
    #[serde(default = "default_max_length")]
    pub max_length: u32,
    #[serde(default)]
    pub include_signature: bool,
    #[serde(default)]
    pub system_prompt: String,
    #[serde(default)]
    pub examples: Vec<ReplySkillExample>,
    #[serde(default)]
    pub reply_template: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateReplySkillRequest {
    pub id: String,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub trigger_categories: Option<Vec<String>>,
    #[serde(default)]
    pub tone: Option<String>,
    #[serde(default)]
    pub language: Option<String>,
    #[serde(default)]
    pub max_length: Option<u32>,
    #[serde(default)]
    pub include_signature: Option<bool>,
    #[serde(default)]
    pub system_prompt: Option<String>,
    #[serde(default)]
    pub examples: Option<Vec<ReplySkillExample>>,
    #[serde(default)]
    pub reply_template: Option<String>,
}

fn default_tone() -> String { "formal".into() }
fn default_language() -> String { "auto".into() }
fn default_max_length() -> u32 { 500 }
