//! Per-table CRUD modules. Each repository takes a pooled connection and
//! returns DTOs from `crate::models`.

pub mod email;
pub mod email_account;
pub mod outbox;
pub mod signature;
pub mod tag;
pub mod wallet;
