use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OutboxItem {
    pub id: String,
    pub email_account_id: String,
    pub payload: String,
    pub status: String,
    pub retry_count: u32,
    pub max_retries: u32,
    pub error_message: Option<String>,
    pub scheduled_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
