//! Application-wide shared state held inside `tauri::State<Arc<AppState>>`.
//!
//! The session master key (derived from the wallet signature) lives here in
//! memory only; it is never persisted to disk. AES-GCM encrypted credentials
//! in SQLite are decrypted on demand using this key.

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

use tokio_util::sync::CancellationToken;
use zeroize::Zeroizing;

/// Process-wide state. Constructed once during `tauri::Builder::setup`.
pub struct AppState {
    /// Where to put `aura.db`, log files, etc. On macOS this matches the
    /// existing Electron `app.getPath('userData')` directory because the
    /// Tauri identifier is kept as `com.aura.email`.
    pub app_data_dir: PathBuf,

    /// Active wallet session. None until `auth_unlock` succeeds.
    pub session: Mutex<Option<Session>>,

    /// AI streaming cancellation tokens, keyed by client-supplied request_id.
    pub cancellation_tokens: Mutex<HashMap<String, CancellationToken>>,
}

impl AppState {
    pub fn new(app_data_dir: PathBuf) -> Self {
        Self {
            app_data_dir,
            session: Mutex::new(None),
            cancellation_tokens: Mutex::new(HashMap::new()),
        }
    }

    pub fn db_path(&self) -> PathBuf {
        self.app_data_dir.join("aura.db")
    }
}

/// An unlocked wallet session.
pub struct Session {
    pub wallet_address: String,
    /// 32-byte AES-256 key, zeroized on drop.
    pub master_key: Zeroizing<[u8; 32]>,
}
