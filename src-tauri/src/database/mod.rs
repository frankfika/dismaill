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
