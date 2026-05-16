use rusqlite::{params, OptionalExtension, Row, ToSql};

use crate::database::SharedPool;
use crate::error::AppResult;
use crate::models::Signature;

pub struct SignatureRepo {
    pool: SharedPool,
}

#[derive(Debug, Clone)]
pub struct CreateSignature<'a> {
    pub id: &'a str,
    pub email_account_id: &'a str,
    pub name: &'a str,
    pub content_html: &'a str,
    pub content_text: Option<&'a str>,
    pub is_default: bool,
}

#[derive(Debug, Clone, Default)]
pub struct UpdateSignature<'a> {
    pub name: Option<&'a str>,
    pub content_html: Option<&'a str>,
    pub content_text: Option<Option<&'a str>>,
    pub is_default: Option<bool>,
}

impl SignatureRepo {
    pub fn new(pool: SharedPool) -> Self {
        Self { pool }
    }

    pub fn create(&self, s: CreateSignature<'_>) -> AppResult<Signature> {
        let conn = self.pool.get()?;
        conn.execute(
            "INSERT INTO signature (id, email_account_id, name, content_html, content_text, is_default)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                s.id,
                s.email_account_id,
                s.name,
                s.content_html,
                s.content_text,
                s.is_default as i64,
            ],
        )?;
        if s.is_default {
            conn.execute(
                "UPDATE signature SET is_default = 0, updated_at = datetime('now')
                 WHERE email_account_id = ?1 AND id != ?2",
                params![s.email_account_id, s.id],
            )?;
        }
        Ok(self.find_by_id(s.id)?.expect("just inserted"))
    }

    pub fn find_by_id(&self, id: &str) -> AppResult<Option<Signature>> {
        let conn = self.pool.get()?;
        Ok(conn
            .query_row(SIG_SELECT_BY_ID, params![id], map_signature)
            .optional()?)
    }

    pub fn list_by_account(&self, account_id: &str) -> AppResult<Vec<Signature>> {
        let conn = self.pool.get()?;
        let mut stmt = conn.prepare(
            "SELECT id, email_account_id, name, content_html, content_text, is_default,
                    created_at, updated_at
             FROM signature WHERE email_account_id = ?1
             ORDER BY is_default DESC, created_at ASC",
        )?;
        let rows = stmt
            .query_map(params![account_id], map_signature)?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn find_default(&self, account_id: &str) -> AppResult<Option<Signature>> {
        let conn = self.pool.get()?;
        Ok(conn
            .query_row(
                "SELECT id, email_account_id, name, content_html, content_text, is_default,
                        created_at, updated_at
                 FROM signature WHERE email_account_id = ?1 AND is_default = 1 LIMIT 1",
                params![account_id],
                map_signature,
            )
            .optional()?)
    }

    pub fn update(&self, id: &str, u: UpdateSignature<'_>) -> AppResult<()> {
        let mut sets: Vec<&'static str> = Vec::new();
        let mut args: Vec<rusqlite::types::Value> = Vec::new();

        if let Some(v) = u.name {
            sets.push("name = ?");
            args.push(v.to_string().into());
        }
        if let Some(v) = u.content_html {
            sets.push("content_html = ?");
            args.push(v.to_string().into());
        }
        if let Some(v) = u.content_text {
            sets.push("content_text = ?");
            args.push(v.map(|s| s.to_string()).into());
        }
        if let Some(v) = u.is_default {
            sets.push("is_default = ?");
            args.push((v as i64).into());
        }
        if sets.is_empty() {
            return Ok(());
        }

        sets.push("updated_at = datetime('now')");
        let sql = format!("UPDATE signature SET {} WHERE id = ?", sets.join(", "));
        args.push(id.to_string().into());

        let conn = self.pool.get()?;
        {
            let params_iter: Vec<&dyn ToSql> =
                args.iter().map(|v| v as &dyn ToSql).collect();
            conn.execute(&sql, params_iter.as_slice())?;
        }

        if u.is_default == Some(true) {
            if let Some(sig) = self.find_by_id(id)? {
                conn.execute(
                    "UPDATE signature SET is_default = 0, updated_at = datetime('now')
                     WHERE email_account_id = ?1 AND id != ?2",
                    params![sig.email_account_id, id],
                )?;
            }
        }

        Ok(())
    }

    pub fn delete(&self, id: &str) -> AppResult<()> {
        let conn = self.pool.get()?;
        conn.execute("DELETE FROM signature WHERE id = ?1", params![id])?;
        Ok(())
    }
}

const SIG_SELECT_BY_ID: &str =
    "SELECT id, email_account_id, name, content_html, content_text, is_default,
            created_at, updated_at
     FROM signature WHERE id = ?1";

fn map_signature(row: &Row<'_>) -> rusqlite::Result<Signature> {
    Ok(Signature {
        id: row.get(0)?,
        email_account_id: row.get(1)?,
        name: row.get(2)?,
        content_html: row.get(3)?,
        content_text: row.get(4)?,
        is_default: row.get::<_, i64>(5)? == 1,
        created_at: row.get(6)?,
        updated_at: row.get(7)?,
    })
}
