use rusqlite::{params, OptionalExtension, Row};

use crate::database::SharedPool;
use crate::error::AppResult;
use crate::models::OutboxItem;

pub struct OutboxRepo {
    pool: SharedPool,
}

#[derive(Debug, Clone)]
pub struct CreateOutbox<'a> {
    pub id: &'a str,
    pub email_account_id: &'a str,
    pub payload: &'a str,
    pub max_retries: u32,
    pub scheduled_at: Option<&'a str>,
}

impl OutboxRepo {
    pub fn new(pool: SharedPool) -> Self {
        Self { pool }
    }

    pub fn create(&self, o: CreateOutbox<'_>) -> AppResult<OutboxItem> {
        let conn = self.pool.get()?;
        conn.execute(
            "INSERT INTO outbox (id, email_account_id, payload, status, retry_count,
                                 max_retries, scheduled_at)
             VALUES (?1, ?2, ?3, 'pending', 0, ?4, ?5)",
            params![
                o.id,
                o.email_account_id,
                o.payload,
                o.max_retries as i64,
                o.scheduled_at,
            ],
        )?;
        Ok(self.find_by_id(o.id)?.expect("just inserted"))
    }

    pub fn find_by_id(&self, id: &str) -> AppResult<Option<OutboxItem>> {
        let conn = self.pool.get()?;
        Ok(conn
            .query_row(SELECT_BY_ID, params![id], map_outbox)
            .optional()?)
    }

    pub fn pending(&self, limit: u32) -> AppResult<Vec<OutboxItem>> {
        let conn = self.pool.get()?;
        let mut stmt = conn.prepare(
            "SELECT id, email_account_id, payload, status, retry_count, max_retries,
                    error_message, scheduled_at, created_at, updated_at
             FROM outbox
             WHERE status IN ('pending', 'failed')
               AND retry_count < max_retries
               AND (scheduled_at IS NULL OR scheduled_at <= datetime('now'))
             ORDER BY created_at ASC
             LIMIT ?1",
        )?;
        let rows = stmt
            .query_map(params![limit as i64], map_outbox)?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn mark_sending(&self, id: &str) -> AppResult<()> {
        self.update_status(id, "sending", None, false)
    }

    pub fn mark_sent(&self, id: &str) -> AppResult<()> {
        self.update_status(id, "sent", None, false)
    }

    pub fn mark_failed(&self, id: &str, error: &str, increment_retry: bool) -> AppResult<()> {
        self.update_status(id, "failed", Some(error), increment_retry)
    }

    fn update_status(
        &self,
        id: &str,
        status: &str,
        error: Option<&str>,
        increment_retry: bool,
    ) -> AppResult<()> {
        let conn = self.pool.get()?;
        let retry_clause = if increment_retry {
            ", retry_count = retry_count + 1"
        } else {
            ""
        };
        let sql = format!(
            "UPDATE outbox SET status = ?1, error_message = ?2, updated_at = datetime('now'){}
             WHERE id = ?3",
            retry_clause
        );
        conn.execute(&sql, params![status, error, id])?;
        Ok(())
    }

    #[allow(dead_code)]
    pub fn delete(&self, id: &str) -> AppResult<()> {
        let conn = self.pool.get()?;
        conn.execute("DELETE FROM outbox WHERE id = ?1", params![id])?;
        Ok(())
    }
}

const SELECT_BY_ID: &str =
    "SELECT id, email_account_id, payload, status, retry_count, max_retries,
            error_message, scheduled_at, created_at, updated_at
     FROM outbox WHERE id = ?1";

fn map_outbox(row: &Row<'_>) -> rusqlite::Result<OutboxItem> {
    Ok(OutboxItem {
        id: row.get(0)?,
        email_account_id: row.get(1)?,
        payload: row.get(2)?,
        status: row.get(3)?,
        retry_count: row.get::<_, i64>(4)? as u32,
        max_retries: row.get::<_, i64>(5)? as u32,
        error_message: row.get(6)?,
        scheduled_at: row.get(7)?,
        created_at: row.get(8)?,
        updated_at: row.get(9)?,
    })
}
