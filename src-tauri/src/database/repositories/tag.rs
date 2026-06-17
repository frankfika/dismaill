#![allow(dead_code)]
use rusqlite::{params, OptionalExtension, Row, ToSql};

use crate::database::SharedPool;
use crate::error::AppResult;
use crate::models::{SmartFolder, Tag};

pub struct TagRepo {
    pool: SharedPool,
}

#[derive(Debug, Clone)]
pub struct CreateTag<'a> {
    pub id: &'a str,
    pub wallet_address: &'a str,
    pub name: &'a str,
    pub color: &'a str,
    pub description: Option<&'a str>,
    pub is_ai_enabled: bool,
}

#[derive(Debug, Clone, Default)]
pub struct UpdateTag<'a> {
    pub name: Option<&'a str>,
    pub color: Option<&'a str>,
    pub description: Option<Option<&'a str>>,
    pub is_ai_enabled: Option<bool>,
}

impl TagRepo {
    pub fn new(pool: SharedPool) -> Self {
        Self { pool }
    }

    pub fn create(&self, t: CreateTag<'_>) -> AppResult<Tag> {
        let conn = self.pool.get()?;
        conn.execute(
            "INSERT INTO tag (id, wallet_address, name, color, description, is_ai_enabled)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                t.id,
                t.wallet_address,
                t.name,
                t.color,
                t.description,
                t.is_ai_enabled as i64,
            ],
        )?;
        Ok(self.find_by_id(t.id)?.expect("just inserted"))
    }

    pub fn find_by_id(&self, id: &str) -> AppResult<Option<Tag>> {
        let conn = self.pool.get()?;
        Ok(conn
            .query_row(
                "SELECT id, wallet_address, name, color, description, is_ai_enabled,
                        created_at, updated_at
                 FROM tag WHERE id = ?1",
                params![id],
                |row| map_tag(row, 0),
            )
            .optional()?)
    }

    pub fn list_by_wallet(&self, wallet_address: &str) -> AppResult<Vec<Tag>> {
        let conn = self.pool.get()?;
        let mut stmt = conn.prepare(
            "SELECT t.id, t.wallet_address, t.name, t.color, t.description, t.is_ai_enabled,
                    t.created_at, t.updated_at,
                    COUNT(et.email_id) AS email_count
             FROM tag t
             LEFT JOIN email_tag et ON t.id = et.tag_id
             WHERE t.wallet_address = ?1
             GROUP BY t.id
             ORDER BY t.sort_order ASC, t.created_at ASC",
        )?;
        let rows = stmt
            .query_map(params![wallet_address], |row| {
                let count: i64 = row.get(8)?;
                map_tag(row, count as u32)
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn find_by_name(
        &self,
        wallet_address: &str,
        name: &str,
    ) -> AppResult<Option<Tag>> {
        let conn = self.pool.get()?;
        Ok(conn
            .query_row(
                "SELECT id, wallet_address, name, color, description, is_ai_enabled,
                        created_at, updated_at
                 FROM tag WHERE wallet_address = ?1 AND name = ?2",
                params![wallet_address, name],
                |row| map_tag(row, 0),
            )
            .optional()?)
    }

    pub fn update(&self, id: &str, u: UpdateTag<'_>) -> AppResult<()> {
        let mut sets: Vec<&'static str> = Vec::new();
        let mut args: Vec<rusqlite::types::Value> = Vec::new();

        if let Some(v) = u.name {
            sets.push("name = ?");
            args.push(v.to_string().into());
        }
        if let Some(v) = u.color {
            sets.push("color = ?");
            args.push(v.to_string().into());
        }
        if let Some(v) = u.description {
            sets.push("description = ?");
            args.push(v.map(|s| s.to_string()).into());
        }
        if let Some(v) = u.is_ai_enabled {
            sets.push("is_ai_enabled = ?");
            args.push((v as i64).into());
        }
        if sets.is_empty() {
            return Ok(());
        }
        sets.push("updated_at = datetime('now')");
        let sql = format!("UPDATE tag SET {} WHERE id = ?", sets.join(", "));
        args.push(id.to_string().into());

        let conn = self.pool.get()?;
        let params_iter: Vec<&dyn ToSql> = args.iter().map(|v| v as &dyn ToSql).collect();
        conn.execute(&sql, params_iter.as_slice())?;
        Ok(())
    }

    pub fn delete(&self, id: &str) -> AppResult<()> {
        let conn = self.pool.get()?;
        conn.execute("DELETE FROM tag WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn apply(
        &self,
        email_id: &str,
        tag_id: &str,
        is_ai_applied: bool,
        confidence: Option<f64>,
    ) -> AppResult<()> {
        let conn = self.pool.get()?;
        conn.execute(
            "INSERT INTO email_tag (email_id, tag_id, is_ai_applied, confidence_score)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(email_id, tag_id) DO UPDATE SET
                 is_ai_applied = excluded.is_ai_applied,
                 confidence_score = excluded.confidence_score",
            params![email_id, tag_id, is_ai_applied as i64, confidence],
        )?;
        Ok(())
    }

    pub fn remove(&self, email_id: &str, tag_id: &str) -> AppResult<()> {
        let conn = self.pool.get()?;
        conn.execute(
            "DELETE FROM email_tag WHERE email_id = ?1 AND tag_id = ?2",
            params![email_id, tag_id],
        )?;
        Ok(())
    }

    pub fn smart_folders(&self, wallet_address: &str) -> AppResult<Vec<SmartFolder>> {
        let conn = self.pool.get()?;
        let mut stmt = conn.prepare(
            "SELECT t.id, t.name, t.color,
                    COALESCE(SUM(CASE WHEN e.is_read = 0 THEN 1 ELSE 0 END), 0) AS unread,
                    COALESCE(COUNT(e.id), 0) AS total
             FROM tag t
             LEFT JOIN email_tag et ON t.id = et.tag_id
             LEFT JOIN email e ON et.email_id = e.id AND e.is_deleted = 0
             WHERE t.wallet_address = ?1
             GROUP BY t.id
             ORDER BY t.sort_order ASC",
        )?;
        let rows = stmt
            .query_map(params![wallet_address], |row| {
                Ok(SmartFolder {
                    tag_id: row.get(0)?,
                    tag_name: row.get(1)?,
                    tag_color: row.get(2)?,
                    unread_count: row.get::<_, i64>(3)? as u32,
                    total_count: row.get::<_, i64>(4)? as u32,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }
}

fn map_tag(row: &Row<'_>, email_count: u32) -> rusqlite::Result<Tag> {
    Ok(Tag {
        id: row.get(0)?,
        wallet_address: row.get(1)?,
        name: row.get(2)?,
        color: row.get(3)?,
        description: row.get(4)?,
        is_ai_enabled: row.get::<_, i64>(5)? == 1,
        email_count,
        created_at: row.get(6)?,
        updated_at: row.get(7)?,
    })
}
