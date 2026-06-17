//! Per-table CRUD modules. Each repository takes a pooled connection and
//! returns DTOs from `crate::models`.

pub mod agent;
pub mod email;
pub mod email_account;
pub mod outbox;
pub mod signature;
pub mod skill;
pub mod tag;
pub mod wallet;
