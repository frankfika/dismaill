use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Wallet {
    pub address: String,
    pub ens_name: Option<String>,
    pub avatar_url: Option<String>,
    pub created_at: String,
    /// Random per-wallet salt for Argon2id master-key derivation.
    /// `None` for legacy wallets created before the KDF migration — those
    /// will receive a fresh salt on next unlock.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub master_key_salt: Option<Vec<u8>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthConnectRequest {
    pub wallet_type: String,
    pub address: String,
    #[serde(default)]
    pub ens_name: Option<String>,
    #[serde(default)]
    pub avatar_url: Option<String>,
    pub signature: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthConnectResponse {
    pub address: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ens_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    pub is_new_user: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthSignRequest {
    pub message: String,
    pub purpose: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthSignResponse {
    pub signature: String,
    pub timestamp: i64,
    pub nonce: String,
}
