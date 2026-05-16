use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Signature {
    pub id: String,
    pub email_account_id: String,
    pub name: String,
    pub content_html: String,
    pub content_text: Option<String>,
    pub is_default: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSignatureRequest {
    pub email_account_id: String,
    pub name: String,
    pub content_html: String,
    #[serde(default)]
    pub content_text: Option<String>,
    #[serde(default)]
    pub is_default: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSignatureRequest {
    pub id: String,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub content_html: Option<String>,
    #[serde(default)]
    pub content_text: Option<String>,
    #[serde(default)]
    pub is_default: Option<bool>,
}
