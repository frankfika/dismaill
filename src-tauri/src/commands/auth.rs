use std::sync::Arc;

use tauri::State;

use crate::database::SharedPool;
use crate::error::AppResult;
use crate::models::{AuthConnectResponse, Wallet};
use crate::services::auth::AuthService;
use crate::state::AppState;

fn pool(state: &State<'_, Arc<AppState>>) -> SharedPool {
    crate::database::init(&state.db_path()).expect("db init")
}

/// All commands here use **flat top-level args** (camelCase via `rename_all`).

#[tauri::command(rename_all = "camelCase")]
pub async fn auth_connect(
    wallet_type: String,
    address: String,
    signature: String,
    message: String,
    ens_name: Option<String>,
    avatar_url: Option<String>,
    state: State<'_, Arc<AppState>>,
) -> AppResult<AuthConnectResponse> {
    let service = AuthService::new(pool(&state));
    let request = crate::models::AuthConnectRequest {
        wallet_type,
        address,
        ens_name,
        avatar_url,
        signature,
        message,
    };
    let resp = service.connect_wallet(request).await?;
    // Auto-unlock session so the renderer doesn't need a separate unlock step.
    let _ = service.unlock(&state, resp.address.clone(), String::new());
    Ok(resp)
}

#[tauri::command(rename_all = "camelCase")]
pub fn auth_unlock(
    wallet_address: String,
    signature: String,
    state: State<'_, Arc<AppState>>,
) -> AppResult<Wallet> {
    let service = AuthService::new(pool(&state));
    service.unlock(&state, wallet_address, signature)
}

#[tauri::command(rename_all = "camelCase")]
pub fn auth_disconnect(state: State<'_, Arc<AppState>>) -> AppResult<()> {
    AuthService::disconnect(&state)
}

#[tauri::command(rename_all = "camelCase")]
pub fn auth_current_wallet(state: State<'_, Arc<AppState>>) -> AppResult<Option<String>> {
    AuthService::current_wallet(&state)
}

#[tauri::command(rename_all = "camelCase")]
pub fn auth_sign(
    message: String,
    purpose: String,
    state: State<'_, Arc<AppState>>,
) -> AppResult<crate::models::AuthSignResponse> {
    let request = crate::models::AuthSignRequest { message, purpose };
    AuthService::sign_message(&state, request)
}
