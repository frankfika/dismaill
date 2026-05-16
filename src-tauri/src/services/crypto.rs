//! AES-256-GCM compatible with the Electron CryptoService.
//!
//! Wire format (base64 of):  IV(16) || AUTH_TAG(16) || CIPHERTEXT
//!
//! Note on the IV length: Node's `crypto.createCipheriv('aes-256-gcm', key, iv)`
//! accepts an arbitrary IV length and the original Electron client used 16
//! bytes. Standard AES-GCM is 12 bytes. We honor the existing on-disk format
//! (16-byte IV) via `aes_gcm::AesGcm<Aes256, U16>` so previously-stored
//! credentials decrypt unchanged.

use aes_gcm::aead::{Aead, KeyInit, Payload};
use aes_gcm::aes::Aes256;
use aes_gcm::AesGcm;
use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use typenum::U16;
use zeroize::Zeroizing;

use crate::error::{AppError, AppResult};

const IV_LEN: usize = 16;
const TAG_LEN: usize = 16;

type Aes256Gcm16 = AesGcm<Aes256, U16>;

/// SHA-256(signature) -> 32-byte AES key. Matches `deriveKeyFromSignature` in
/// the Electron CryptoService.
pub fn derive_key_from_signature(signature: &str) -> AppResult<Zeroizing<[u8; 32]>> {
    if signature.len() < 10 {
        return Err(AppError::Crypto("signature too short".into()));
    }
    let mut hasher = Sha256::new();
    hasher.update(signature.as_bytes());
    let digest = hasher.finalize();
    let mut key = Zeroizing::new([0u8; 32]);
    key.copy_from_slice(&digest);
    Ok(key)
}

pub fn encrypt(plaintext: &str, key: &[u8; 32]) -> AppResult<String> {
    let cipher = Aes256Gcm16::new_from_slice(key)
        .map_err(|e| AppError::Crypto(format!("key init: {e}")))?;

    let mut iv = [0u8; IV_LEN];
    rand::thread_rng().fill_bytes(&mut iv);

    let ct_with_tag = cipher
        .encrypt(
            (&iv).into(),
            Payload {
                msg: plaintext.as_bytes(),
                aad: &[],
            },
        )
        .map_err(|e| AppError::Crypto(format!("encrypt: {e}")))?;

    // aes-gcm appends the tag at the end of ciphertext. Node's format puts the
    // tag *between* IV and ciphertext, so we re-arrange.
    if ct_with_tag.len() < TAG_LEN {
        return Err(AppError::Crypto("ciphertext shorter than tag".into()));
    }
    let split = ct_with_tag.len() - TAG_LEN;
    let (ciphertext, tag) = ct_with_tag.split_at(split);

    let mut out = Vec::with_capacity(IV_LEN + TAG_LEN + ciphertext.len());
    out.extend_from_slice(&iv);
    out.extend_from_slice(tag);
    out.extend_from_slice(ciphertext);
    Ok(B64.encode(out))
}

pub fn decrypt(encrypted_b64: &str, key: &[u8; 32]) -> AppResult<String> {
    let buf = B64
        .decode(encrypted_b64)
        .map_err(|e| AppError::Crypto(format!("base64 decode: {e}")))?;
    if buf.len() < IV_LEN + TAG_LEN {
        return Err(AppError::Crypto("payload too short".into()));
    }

    let (iv, rest) = buf.split_at(IV_LEN);
    let (tag, ciphertext) = rest.split_at(TAG_LEN);

    // aes-gcm wants ciphertext || tag.
    let mut ct_with_tag = Vec::with_capacity(ciphertext.len() + TAG_LEN);
    ct_with_tag.extend_from_slice(ciphertext);
    ct_with_tag.extend_from_slice(tag);

    let cipher = Aes256Gcm16::new_from_slice(key)
        .map_err(|e| AppError::Crypto(format!("key init: {e}")))?;

    let plaintext = cipher
        .decrypt(
            iv.into(),
            Payload {
                msg: &ct_with_tag,
                aad: &[],
            },
        )
        .map_err(|_| AppError::Crypto("decryption failed".into()))?;

    String::from_utf8(plaintext).map_err(|e| AppError::Crypto(format!("utf8: {e}")))
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct StoredCredentials {
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub password: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub oauth_token: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub token: Option<String>,
}

pub fn encrypt_credentials(
    creds: &StoredCredentials,
    key: &[u8; 32],
) -> AppResult<String> {
    let json = serde_json::to_string(creds)?;
    encrypt(&json, key)
}

pub fn decrypt_credentials(
    encrypted_b64: &str,
    key: &[u8; 32],
) -> AppResult<StoredCredentials> {
    let json = decrypt(encrypted_b64, key)?;
    let creds = serde_json::from_str(&json)?;
    Ok(creds)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn key_from_signature_is_sha256() {
        let key = derive_key_from_signature("0xabcdef1234567890aabb").unwrap();
        // Same signature must yield the same key deterministically.
        let key2 = derive_key_from_signature("0xabcdef1234567890aabb").unwrap();
        assert_eq!(*key, *key2);
    }

    #[test]
    fn round_trip_plaintext() {
        let key = derive_key_from_signature("0xdeadbeef00000000ff").unwrap();
        let plain = "hello aura";
        let encrypted = encrypt(plain, &key).unwrap();
        let decrypted = decrypt(&encrypted, &key).unwrap();
        assert_eq!(decrypted, plain);
    }

    #[test]
    fn round_trip_credentials() {
        let key = derive_key_from_signature("0xfeedfacedeadbeef00").unwrap();
        let creds = StoredCredentials {
            password: Some("hunter2".into()),
            ..Default::default()
        };
        let enc = encrypt_credentials(&creds, &key).unwrap();
        let dec = decrypt_credentials(&enc, &key).unwrap();
        assert_eq!(dec.password.as_deref(), Some("hunter2"));
    }

    #[test]
    fn wrong_key_fails() {
        let key1 = derive_key_from_signature("0x111111111111111111").unwrap();
        let key2 = derive_key_from_signature("0x222222222222222222").unwrap();
        let enc = encrypt("secret", &key1).unwrap();
        assert!(decrypt(&enc, &key2).is_err());
    }

    #[test]
    fn rejects_short_signature() {
        assert!(derive_key_from_signature("short").is_err());
    }
}
