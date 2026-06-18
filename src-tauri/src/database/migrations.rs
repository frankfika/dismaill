//! Schema migrations. Stored as embedded SQL strings, applied in order, with
//! the applied versions tracked in `_migrations`.

use rusqlite::Connection;

use crate::error::{AppError, AppResult};

struct Migration {
    version: i64,
    name: &'static str,
    sql: &'static str,
}

const MIGRATIONS: &[Migration] = &[
    Migration {
        version: 1,
        name: "initial_schema",
        sql: include_str!("./sql/0001_initial.sql"),
    },
    Migration {
        version: 2,
        name: "reply_skills",
        sql: include_str!("./sql/0002_reply_skills.sql"),
    },
    Migration {
        version: 3,
        name: "reply_agents",
        sql: include_str!("./sql/0003_reply_agents.sql"),
    },
    Migration {
        version: 4,
        name: "integrity",
        sql: include_str!("./sql/0004_integrity.sql"),
    },
];

pub fn run(conn: &mut Connection) -> AppResult<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS _migrations (
             version INTEGER PRIMARY KEY,
             name TEXT NOT NULL,
             applied_at TEXT NOT NULL DEFAULT (datetime('now'))
         );",
    )?;

    let current: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM _migrations",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);
    tracing::info!(current_version = current, total_migrations = MIGRATIONS.len(), "checking migrations");

    for m in MIGRATIONS {
        if m.version <= current {
            continue;
        }
        let tx = conn.transaction()?;
        tracing::info!(version = m.version, name = m.name, "applying migration");
        tx.execute_batch(m.sql).map_err(|e| {
            AppError::Db(format!(
                "migration {} ({}) failed: {e}",
                m.version, m.name
            ))
        })?;
        tx.execute(
            "INSERT INTO _migrations (version, name) VALUES (?1, ?2)",
            (m.version, m.name),
        )?;
        tx.commit()?;
    }

    Ok(())
}
