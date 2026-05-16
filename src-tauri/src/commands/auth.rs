use std::sync::Arc;

use tauri::State;

use crate::database::SharedPool;
use crate::error::AppResult;
use crate::models::{AuthConnectRequest, AuthConnectResponse};
use crate::services::auth::AuthService;
use crate::state::AppState;

fn pool(state: &State<'_, Arc<AppState>>) -> SharedPool {
    crate::database::init(&state.db_path()).expect("db init")
}

#[tauri::command(rename_all = "camelCase")]
pub async fn auth_connect(
    request: AuthConnectRequest,
    state: State<'_, Arc<AppState>>,
) -> AppResult<AuthConnectResponse> {
    let service = AuthService::new(pool(&state));
    service.connect_wallet(request).await
}

#[tauri::command(rename_all = "camelCase")]
pub fn auth_unlock(
    wallet_address: String,
    signature: String,
    state: State<'_, Arc<AppState>>,
) -> AppResult<crate::models::Wallet> {
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
    request: crate::models::AuthSignRequest,
    state: State<'_, Arc<AppState>>,
) -> AppResult<crate::models::AuthSignResponse> {
    AuthService::sign_message(&state, request)
}
