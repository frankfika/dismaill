//! Serde DTOs that mirror `src/shared/types/*.ts`. All field names use
//! `camelCase` so JSON serialization matches the renderer's TypeScript types.
//!
//! Many structs/fields are intentionally kept to mirror the frontend contract
//! even when not all backend commands consume them yet.
#![allow(dead_code)]

pub mod agent;
pub mod ai;
pub mod auth;
pub mod email;
pub mod outbox;
pub mod signature;
pub mod skill;
pub mod tag;
pub mod wallet;

pub use agent::*;
pub use ai::*;
// pub use auth::*; // AuthUnlockRequest/Response are reserved for future use
pub use email::*;
pub use outbox::*;
pub use signature::*;
pub use skill::*;
pub use tag::*;
pub use wallet::*;
