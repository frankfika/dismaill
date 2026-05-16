//! Dismail (Aura) - Tauri backend entry point.

mod commands;
mod database;
mod error;
mod models;
mod services;
mod state;

use std::sync::Arc;
use tauri::Manager;

pub use error::{AppError, AppResult};
pub use state::AppState;

/// Tauri entry point. Wires the Builder, plugins, state, and command handlers.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    init_tracing();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app_data_dir");
            std::fs::create_dir_all(&app_data_dir).ok();
            tracing::info!(?app_data_dir, "app_data_dir resolved");

            let state = AppState::new(app_data_dir);
            app.manage(Arc::new(state));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::ping::ping,
            commands::auth::auth_connect,
            commands::auth::auth_unlock,
            commands::auth::auth_disconnect,
            commands::auth::auth_current_wallet,
            commands::auth::auth_sign,
            commands::account::account_add,
            commands::account::account_list,
            commands::account::account_update,
            commands::account::account_delete,
            commands::account::account_verify,
            commands::email::email_send,
            commands::email::email_sync,
            commands::email::email_list,
            commands::email::email_get,
            commands::email::email_get_folders,
            commands::email::email_mark_read,
            commands::email::email_delete,
            commands::signature::signature_create,
            commands::signature::signature_list,
            commands::signature::signature_update,
            commands::signature::signature_delete,
            commands::ai::ai_generate,
            commands::ai::ai_refine,
            commands::ai::ai_classify_email,
            commands::ai::ai_providers,
            commands::ai::ai_configure_provider,
            commands::tag::tag_create,
            commands::tag::tag_list,
            commands::tag::tag_apply,
            commands::tag::tag_auto_apply,
            commands::tag::tag_smart_folders,
            commands::tag::tag_delete,
            commands::chat::chat_init,
            commands::chat::chat_send,
            commands::chat::chat_get_messages,
            commands::chat::chat_get_conversations,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn init_tracing() {
    use tracing_subscriber::{fmt, prelude::*, EnvFilter};
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,dismail_lib=debug"));
    tracing_subscriber::registry()
        .with(filter)
        .with(fmt::layer().with_target(false))
        .init();
}
