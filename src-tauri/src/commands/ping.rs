use crate::AppResult;

/// Trivial sanity-check command exposed during Phase 0 scaffold so the
/// renderer can confirm the IPC bridge is alive before any real backend
/// services exist.
#[tauri::command(rename_all = "camelCase")]
pub async fn ping() -> AppResult<String> {
    Ok("pong".to_string())
}
