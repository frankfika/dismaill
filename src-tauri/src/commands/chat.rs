use crate::error::AppResult;

/// Chat commands are stubs for V2.0 XMTP integration.
/// They use **flat top-level args** (camelCase via `rename_all`).

#[tauri::command(rename_all = "camelCase")]
pub async fn chat_init(peer_address: Option<String>) -> AppResult<String> {
    // Real XMTP conversation bootstrap goes here in V2.0; for now the
    // renderer just needs a stable id keyed off the peer.
    let key = peer_address.unwrap_or_else(|| "default".to_string());
    Ok(format!("stub-conv-{}", key))
}

#[tauri::command(rename_all = "camelCase")]
pub async fn chat_send(
    conversation_id: Option<String>,
    peer_address: Option<String>,
    _content: String,
) -> AppResult<String> {
    let _ = conversation_id;
    let _ = peer_address;
    Ok(format!("stub-msg-{}", uuid::Uuid::new_v4()))
}

#[tauri::command(rename_all = "camelCase")]
pub async fn chat_get_messages(
    conversation_id: Option<String>,
    peer_address: Option<String>,
    _limit: Option<u32>,
) -> AppResult<Vec<serde_json::Value>> {
    let _ = conversation_id;
    let _ = peer_address;
    Ok(vec![])
}

#[tauri::command]
pub async fn chat_get_conversations() -> AppResult<Vec<serde_json::Value>> {
    Ok(vec![])
}
