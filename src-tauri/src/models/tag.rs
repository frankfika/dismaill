use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tag {
    pub id: String,
    pub wallet_address: String,
    pub name: String,
    pub color: String,
    pub description: Option<String>,
    pub is_ai_enabled: bool,
    pub email_count: u32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTagRequest {
    pub wallet_address: String,
    pub name: String,
    #[serde(default = "default_color")]
    pub color: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub is_ai_enabled: bool,
}

fn default_color() -> String {
    "#8B5CF6".to_string()
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyTagRequest {
    pub email_id: String,
    pub tag_id: String,
    #[serde(default)]
    pub is_ai_applied: bool,
    #[serde(default)]
    pub confidence_score: Option<f64>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SmartFolder {
    pub tag_id: String,
    pub tag_name: String,
    pub tag_color: String,
    pub unread_count: u32,
    pub total_count: u32,
}
