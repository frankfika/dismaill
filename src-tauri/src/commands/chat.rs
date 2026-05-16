use crate::error::AppResult;

/// Chat commands are stubs for V2.0 XMTP integration.
#[tauri::command(rename_all = "camelCase")]
pub async fn chat_init(_peer_address: String) -> AppResult<String> {
    Ok("stub-conversation-id".into())
}

#[tauri::command(rename_all = "camelCase")]
pub async fn chat_send(
    _conversation_id: String,
    _content: String,
) -> AppResult<String> {
    Ok("stub-message-id".into())
}

#[tauri::command(rename_all = "camelCase")]
pub async fn chat_get_messages(
    _conversation_id: String,
    _limit: Option<u32>,
) -> AppResult<Vec<serde_json::Value>> {
    Ok(vec![])
}

#[tauri::command(rename_all = "camelCase")]
pub async fn chat_get_conversations() -> AppResult<Vec<serde_json::Value>> {
    Ok(vec![])
}
