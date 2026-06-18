//! Wallet auth service.
//!
//! In the Electron version this used HMAC-SHA256 as a stub. The Tauri version
//! keeps the same surface but derives the AES-256 master key via **Argon2id**
//! from the wallet signature + a per-wallet random salt. The salt is persisted
//! in `wallet.master_key_salt` so the same key is recovered on every unlock.

use crate::database::repositories::wallet::WalletRepo;
use crate::database::SharedPool;
use crate::error::{AppError, AppResult};
use crate::models::{AuthConnectRequest, AuthConnectResponse, AuthSignRequest, AuthSignResponse, Wallet};
use crate::services::crypto::{derive_master_key, generate_salt, KDF_SALT_LEN};
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

    /// Unlock the session by deriving the master key from the wallet
    /// signature + the wallet's persisted salt (creating a fresh salt on
    /// first use or when the wallet pre-dates the KDF migration).
    pub fn unlock(
        &self,
        state: &AppState,
        wallet_address: String,
        signature: String,
    ) -> AppResult<Wallet> {
        // The signature is the "password" input to the KDF. The empty-string
        // and "invalid" sentinels are legacy demo-mode paths from the
        // Electron client; substitute the wallet address so the KDF still
        // gets a non-empty, deterministic input.
        let kdf_input = if signature.is_empty() || signature == "invalid" {
            wallet_address.as_str()
        } else {
            signature.as_str()
        };

        let repo = WalletRepo::new(self.pool.clone());
        let existing = repo.find_by_address(&wallet_address)?;

        // Pick or create the salt. The salt is what makes each wallet's
        // master key unique even if two wallets happen to use the same
        // signature string.
        let salt: [u8; KDF_SALT_LEN] = match existing.as_ref().and_then(|w| w.master_key_salt.as_ref()) {
            Some(stored) if stored.len() == KDF_SALT_LEN => {
                let mut s = [0u8; KDF_SALT_LEN];
                s.copy_from_slice(stored);
                s
            }
            _ => {
                let new_salt = generate_salt();
                repo.upsert(
                    &wallet_address,
                    existing.as_ref().and_then(|w| w.ens_name.as_deref()),
                    existing.as_ref().and_then(|w| w.avatar_url.as_deref()),
                    Some(&new_salt),
                )?;
                new_salt
            }
        };

        let master_key = derive_master_key(kdf_input, &salt)?;

        let mut session = state.session.lock().unwrap();
        *session = Some(Session {
            wallet_address: wallet_address.clone(),
            master_key,
        });

        match existing {
            Some(w) => Ok(w),
            None => {
                // First time — create placeholder record (real ENS resolution later).
                let wallet = Wallet {
                    address: wallet_address.clone(),
                    ens_name: None,
                    avatar_url: None,
                    created_at: chrono::Utc::now().to_rfc3339(),
                    master_key_salt: Some(salt.to_vec()),
                };
                // The upsert above already wrote the salt; return the wallet
                // record we just constructed.
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
