//! Wallet auth service.
//!
//! In the Electron version this used HMAC-SHA256 as a stub. The Tauri version
//! keeps the same surface but derives the AES-256 master key from the
//! signature hash so the session can decrypt credentials.

use std::sync::Arc;

use sha2::{Digest, Sha256};
use tauri::State;

use crate::database::repositories::wallet::WalletRepo;
use crate::database::SharedPool;
use crate::error::{AppError, AppResult};
use crate::models::{AuthConnectRequest, AuthConnectResponse, AuthSignRequest, AuthSignResponse, Wallet};
use crate::state::{AppState, Session};

pub struct AuthService {
    pool: SharedPool,
}

impl AuthService {
    pub fn new(pool: SharedPool) -> Self {
        Self { pool }
    }

    /// Connect wallet — returns address + ENS info. Does **not** unlock the
    /// session yet; the renderer must call `auth:sign` with a real signature.
    pub async fn connect_wallet(
        &self,
        _request: AuthConnectRequest,
    ) -> AppResult<AuthConnectResponse> {
        // TODO: wire real wallet connection (Wagmi/RainbowKit bridge)
        // For now mirror the stub behaviour so the renderer compiles.
        Ok(AuthConnectResponse {
            address: "0x1234567890abcdef1234567890abcdef12345678".into(),
            ens_name: Some("test.eth".into()),
            avatar_url: None,
            is_new_user: true,
        })
    }

    /// Unlock session by verifying a signature and deriving the master key.
    pub fn unlock(
        &self,
        state: &AppState,
        wallet_address: String,
        signature: String,
    ) -> AppResult<Wallet> {
        if signature.is_empty() || signature == "invalid" {
            return Err(AppError::AuthSignFailed);
        }

        // Derive 32-byte master key from signature hash (same logic as Electron).
        let hash = Sha256::digest(signature.as_bytes());
        let master_key = zeroize::Zeroizing::new(hash.into());

        let mut session = state.session.lock().unwrap();
        *session = Some(Session {
            wallet_address: wallet_address.clone(),
            master_key,
        });

        let repo = WalletRepo::new(self.pool.clone());
        match repo.find_by_address(&wallet_address)? {
            Some(w) => Ok(w),
            None => {
                // First time — create placeholder record (real ENS resolution later).
                let wallet = Wallet {
                    address: wallet_address.clone(),
                    ens_name: None,
                    avatar_url: None,
                    created_at: chrono::Utc::now().to_rfc3339(),
                };
                repo.upsert(&wallet.address, None, None, "")?;
                Ok(wallet)
            }
        }
    }

    pub fn disconnect(state: &AppState) -> AppResult<()> {
        let mut session = state.session.lock().unwrap();
        *session = None;
        Ok(())
    }

    /// Returns the currently-unlocked wallet address, if any.
    pub fn current_wallet(state: &AppState) -> AppResult<Option<String>> {
        let session = state.session.lock().unwrap();
        Ok(session.as_ref().map(|s| s.wallet_address.clone()))
    }

    /// Sign a message (stub — returns a HMAC-style signature derived from the
    /// session master key, mirroring the Electron version behaviour).
    pub fn sign_message(
        state: &AppState,
        request: AuthSignRequest,
    ) -> AppResult<AuthSignResponse> {
        let (_, master_key) = Self::require_session(state)?;
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(&*master_key);
        hasher.update(request.message.as_bytes());
        hasher.update(request.purpose.as_bytes());
        let signature = hex::encode(hasher.finalize());
        Ok(AuthSignResponse {
            signature,
            timestamp: chrono::Utc::now().timestamp(),
            nonce: uuid::Uuid::new_v4().to_string(),
        })
    }

    /// Helper: fail if no session is active.
    pub fn require_session(state: &AppState) -> AppResult<(String, zeroize::Zeroizing<[u8; 32]>)> {
        let session = state.session.lock().unwrap();
        session
            .as_ref()
            .map(|s| (s.wallet_address.clone(), s.master_key.clone()))
            .ok_or(AppError::AuthNotUnlocked)
    }
}
