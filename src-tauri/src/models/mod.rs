//! Serde DTOs that mirror `src/shared/types/*.ts`. All field names use
//! `camelCase` so JSON serialization matches the renderer's TypeScript types.

pub mod ai;
pub mod auth;
pub mod email;
pub mod outbox;
pub mod signature;
pub mod tag;
pub mod wallet;

pub use ai::*;
pub use auth::*;
pub use email::*;
pub use outbox::*;
pub use signature::*;
pub use tag::*;
pub use wallet::*;
