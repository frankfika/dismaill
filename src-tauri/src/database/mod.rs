//! r2d2 + rusqlite SQLite connection pool. Schema is migrated on first
//! checkout via the embedded SQL in `migrations.rs`.

use std::path::Path;
use std::sync::Arc;

use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::Connection;

use crate::error::{AppError, AppResult};

pub mod migrations;
pub mod repositories;

pub type DbPool = Pool<SqliteConnectionManager>;
pub type SharedPool = Arc<DbPool>;

/// Open the `aura.db` SQLite file, set pragmas, and run migrations once.
pub fn init(db_path: impl AsRef<Path>) -> AppResult<SharedPool> {
    let manager = SqliteConnectionManager::file(db_path.as_ref()).with_init(|c| {
        c.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA foreign_keys = ON;
             PRAGMA busy_timeout = 5000;
             PRAGMA synchronous = NORMAL;",
        )
    });

    let pool: DbPool = Pool::builder()
        .max_size(8)
        .build(manager)
        .map_err(|e| AppError::Db(format!("pool build: {e}")))?;

    {
        let mut conn = pool.get()?;
        migrations::run(&mut conn)?;
    }
    Ok(Arc::new(pool))
}

/// Open an in-memory pool seeded with the full schema. Useful for unit tests.
#[cfg(test)]
#[allow(dead_code)]
pub fn init_in_memory() -> AppResult<SharedPool> {
    let manager = SqliteConnectionManager::memory().with_init(|c| {
        c.execute_batch(
            "PRAGMA foreign_keys = ON;
             PRAGMA busy_timeout = 5000;",
        )
    });
    let pool: DbPool = Pool::builder()
        .max_size(1) // single shared connection so :memory: persists
        .build(manager)
        .map_err(|e| AppError::Db(format!("pool build: {e}")))?;
    let mut conn = pool.get()?;
    migrations::run(&mut conn)?;
    Ok(Arc::new(pool))
}

/// Convenience for executing arbitrary SQL on a fresh connection.
#[allow(dead_code)]
pub fn with_conn<R>(
    pool: &DbPool,
    f: impl FnOnce(&Connection) -> rusqlite::Result<R>,
) -> AppResult<R> {
    let conn = pool.get()?;
    let result = f(&conn)?;
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn migrations_apply_cleanly_on_empty_db() {
        let pool = init_in_memory().expect("init_in_memory");
        let conn = pool.get().expect("get conn");
        let version: i64 = conn
            .query_row("SELECT MAX(version) FROM _migrations", [], |r| r.get(0))
            .expect("query max version");
        assert!(version >= 4, "expected at least migration 0004, got {version}");
    }

    #[test]
    fn migration_0004_adds_master_key_salt_column() {
        let pool = init_in_memory().expect("init_in_memory");
        let conn = pool.get().expect("get conn");
        let mut stmt = conn
            .prepare("PRAGMA table_info(wallet)")
            .expect("prepare pragma");
        let cols: Vec<String> = stmt
            .query_map([], |r| r.get::<_, String>(1))
            .expect("query pragma")
            .filter_map(|r| r.ok())
            .collect();
        assert!(
            cols.iter().any(|c| c == "master_key_salt"),
            "wallet table should have master_key_salt column; got: {cols:?}"
        );
    }

    #[test]
    fn migration_0004_enforces_unique_message_id_per_account() {
        let pool = init_in_memory().expect("init_in_memory");
        let conn = pool.get().expect("get conn");

        // Set up a wallet + email_account to satisfy FKs.
        conn.execute_batch(
            "INSERT INTO wallet (address, ens_name, avatar_url, encrypted_key)
             VALUES ('0xtest', NULL, NULL, '');
             INSERT INTO email_account
                 (id, wallet_address, email_address, display_name, provider,
                  imap_host, imap_port, smtp_host, smtp_port, credentials)
             VALUES ('acct-1', '0xtest', 'a@example.com', NULL, 'custom',
                     'imap.example.com', 993, 'smtp.example.com', 465, '{}');",
        )
        .expect("seed");

        // First insert succeeds.
        conn.execute(
            "INSERT INTO email
                 (id, email_account_id, message_id, folder, subject, sender, received_at)
             VALUES ('e-1', 'acct-1', '<msg-1@host>', 'INBOX', 'hi', 'a@x', '2024-01-01T00:00:00Z')",
            [],
        )
        .expect("first insert");

        // Duplicate (account, message_id) must fail.
        let dup = conn.execute(
            "INSERT INTO email
                 (id, email_account_id, message_id, folder, subject, sender, received_at)
             VALUES ('e-2', 'acct-1', '<msg-1@host>', 'INBOX', 'dup', 'a@x', '2024-01-01T00:00:00Z')",
            [],
        );
        assert!(dup.is_err(), "duplicate message_id should be rejected");
    }
}
