#![allow(dead_code)]

use rusqlite::{params, OptionalExtension, Row, ToSql};

use crate::database::SharedPool;
use crate::error::AppResult;
use crate::models::{Email, EmailListRequest, EmailListResponse, EmailSummary, FolderInfo, TagSummary};

pub struct EmailRepo {
    pool: SharedPool,
}

#[derive(Debug, Clone)]
pub struct CreateEmail<'a> {
    pub id: &'a str,
    pub email_account_id: &'a str,
    pub message_id: &'a str,
    pub folder: &'a str,
    pub subject: Option<&'a str>,
    pub sender: &'a str,
    pub sender_name: Option<&'a str>,
    pub recipients_to: Option<&'a str>,
    pub recipients_cc: Option<&'a str>,
    pub recipients_bcc: Option<&'a str>,
    pub body_text: Option<&'a str>,
    pub body_html: Option<&'a str>,
    pub snippet: Option<&'a str>,
    pub received_at: &'a str,
    pub is_read: bool,
    pub is_starred: bool,
    pub has_attachments: bool,
    pub raw_size: Option<i64>,
}

#[derive(Debug, Clone, Default)]
pub struct UpdateEmail<'a> {
    pub is_read: Option<bool>,
    pub is_starred: Option<bool>,
    pub is_deleted: Option<bool>,
    pub folder: Option<&'a str>,
}

impl EmailRepo {
    pub fn new(pool: SharedPool) -> Self {
        Self { pool }
    }

    pub fn insert(&self, e: CreateEmail<'_>) -> AppResult<()> {
        let conn = self.pool.get()?;
        conn.execute(
            "INSERT OR IGNORE INTO email (
                 id, email_account_id, message_id, folder, subject, sender, sender_name,
                 recipients_to, recipients_cc, recipients_bcc,
                 body_text, body_html, snippet, received_at,
                 is_read, is_starred, is_deleted, has_attachments, raw_size
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14,
                       ?15, ?16, 0, ?17, ?18)",
            params![
                e.id,
                e.email_account_id,
                e.message_id,
                e.folder,
                e.subject,
                e.sender,
                e.sender_name,
                e.recipients_to,
                e.recipients_cc,
                e.recipients_bcc,
                e.body_text,
                e.body_html,
                e.snippet,
                e.received_at,
                e.is_read as i64,
                e.is_starred as i64,
                e.has_attachments as i64,
                e.raw_size,
            ],
        )?;
        Ok(())
    }

    pub fn find_by_id(&self, id: &str) -> AppResult<Option<Email>> {
        let conn = self.pool.get()?;
        Ok(conn
            .query_row(EMAIL_SELECT_BY_ID, params![id], map_email)
            .optional()?)
    }

    pub fn find_by_message_id(
        &self,
        account_id: &str,
        message_id: &str,
    ) -> AppResult<Option<Email>> {
        let conn = self.pool.get()?;
        Ok(conn
            .query_row(
                "SELECT id, email_account_id, message_id, folder, subject, sender, sender_name,
                        recipients_to, recipients_cc, recipients_bcc,
                        body_text, body_html, snippet, received_at,
                        is_read, is_starred, is_deleted, has_attachments
                 FROM email WHERE email_account_id = ?1 AND message_id = ?2",
                params![account_id, message_id],
                map_email,
            )
            .optional()?)
    }

    pub fn list(&self, req: &EmailListRequest) -> AppResult<EmailListResponse> {
        let page = req.page.max(1);
        let page_size = req.page_size.clamp(1, 200);
        let offset = ((page - 1) * page_size) as i64;

        let mut where_clauses: Vec<&'static str> = vec!["e.is_deleted = 0"];
        let mut args: Vec<rusqlite::types::Value> = Vec::new();

        if let Some(account_id) = req.account_id.as_ref() {
            where_clauses.push("e.email_account_id = ?");
            args.push(account_id.clone().into());
        }
        if let Some(folder) = req.folder.as_ref() {
            where_clauses.push("e.folder = ?");
            args.push(folder.clone().into());
        }
        if let Some(tag_id) = req.tag_id.as_ref() {
            where_clauses
                .push("e.id IN (SELECT email_id FROM email_tag WHERE tag_id = ?)");
            args.push(tag_id.clone().into());
        }
        if let Some(q) = req.query.as_ref().filter(|s| !s.trim().is_empty()) {
            let fts = q
                .split_whitespace()
                .map(|w| format!("{}*", w))
                .collect::<Vec<_>>()
                .join(" ");
            where_clauses
                .push("e.rowid IN (SELECT rowid FROM email_fts WHERE email_fts MATCH ?)");
            args.push(fts.into());
        }

        let where_sql = where_clauses.join(" AND ");

        // Total count.
        let count_sql = format!("SELECT COUNT(*) FROM email e WHERE {}", where_sql);
        let conn = self.pool.get()?;
        let total: i64 = {
            let params_iter: Vec<&dyn ToSql> =
                args.iter().map(|v| v as &dyn ToSql).collect();
            conn.query_row(&count_sql, params_iter.as_slice(), |r| r.get(0))?
        };

        // Page query.
        let list_sql = format!(
            "SELECT e.id, e.email_account_id, e.message_id, e.subject, e.sender, e.sender_name,
                    e.snippet, e.received_at, e.is_read, e.is_starred,
                    GROUP_CONCAT(t.id || '|' || t.name || '|' || t.color, char(31)) AS tags
             FROM email e
             LEFT JOIN email_tag et ON e.id = et.email_id
             LEFT JOIN tag t ON et.tag_id = t.id
             WHERE {}
             GROUP BY e.id
             ORDER BY e.received_at DESC
             LIMIT ? OFFSET ?",
            where_sql
        );

        let mut list_args = args.clone();
        list_args.push((page_size as i64).into());
        list_args.push(offset.into());

        let mut stmt = conn.prepare(&list_sql)?;
        let params_iter: Vec<&dyn ToSql> =
            list_args.iter().map(|v| v as &dyn ToSql).collect();

        let rows = stmt
            .query_map(params_iter.as_slice(), map_summary)?
            .collect::<Result<Vec<_>, _>>()?;

        let returned = rows.len() as i64;
        Ok(EmailListResponse {
            emails: rows,
            total: total as u32,
            has_more: offset + returned < total,
        })
    }

    pub fn folders_for_account(&self, account_id: &str) -> AppResult<Vec<FolderInfo>> {
        let conn = self.pool.get()?;
        let mut stmt = conn.prepare(
            "SELECT folder,
                    SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) AS unread,
                    COUNT(*) AS total
             FROM email
             WHERE email_account_id = ?1 AND is_deleted = 0
             GROUP BY folder
             ORDER BY folder",
        )?;
        let rows = stmt
            .query_map(params![account_id], |row| {
                let name: String = row.get(0)?;
                Ok(FolderInfo {
                    path: name.clone(),
                    name,
                    unread_count: row.get::<_, i64>(1)? as u32,
                    total_count: row.get::<_, i64>(2)? as u32,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn mark_read(&self, ids: &[String], is_read: bool) -> AppResult<usize> {
        if ids.is_empty() {
            return Ok(0);
        }
        let placeholders = std::iter::repeat("?")
            .take(ids.len())
            .collect::<Vec<_>>()
            .join(",");
        let sql = format!("UPDATE email SET is_read = ? WHERE id IN ({})", placeholders);
        let conn = self.pool.get()?;
        let mut args: Vec<rusqlite::types::Value> = Vec::with_capacity(ids.len() + 1);
        args.push((is_read as i64).into());
        for id in ids {
            args.push(id.clone().into());
        }
        let params_iter: Vec<&dyn ToSql> = args.iter().map(|v| v as &dyn ToSql).collect();
        let n = conn.execute(&sql, params_iter.as_slice())?;
        Ok(n)
    }

    pub fn soft_delete(&self, ids: &[String]) -> AppResult<usize> {
        if ids.is_empty() {
            return Ok(0);
        }
        let placeholders = std::iter::repeat("?")
            .take(ids.len())
            .collect::<Vec<_>>()
            .join(",");
        let sql = format!(
            "UPDATE email SET is_deleted = 1, folder = 'TRASH' WHERE id IN ({})",
            placeholders
        );
        let conn = self.pool.get()?;
        let args: Vec<rusqlite::types::Value> =
            ids.iter().map(|s| s.clone().into()).collect();
        let params_iter: Vec<&dyn ToSql> = args.iter().map(|v| v as &dyn ToSql).collect();
        let n = conn.execute(&sql, params_iter.as_slice())?;
        Ok(n)
    }

    pub fn hard_delete(&self, ids: &[String]) -> AppResult<usize> {
        if ids.is_empty() {
            return Ok(0);
        }
        let placeholders = std::iter::repeat("?")
            .take(ids.len())
            .collect::<Vec<_>>()
            .join(",");
        let sql = format!("DELETE FROM email WHERE id IN ({})", placeholders);
        let conn = self.pool.get()?;
        let args: Vec<rusqlite::types::Value> =
            ids.iter().map(|s| s.clone().into()).collect();
        let params_iter: Vec<&dyn ToSql> = args.iter().map(|v| v as &dyn ToSql).collect();
        let n = conn.execute(&sql, params_iter.as_slice())?;
        Ok(n)
    }

    pub fn update(&self, id: &str, u: UpdateEmail<'_>) -> AppResult<()> {
        let mut sets: Vec<&'static str> = Vec::new();
        let mut args: Vec<rusqlite::types::Value> = Vec::new();

        if let Some(v) = u.is_read {
            sets.push("is_read = ?");
            args.push((v as i64).into());
        }
        if let Some(v) = u.is_starred {
            sets.push("is_starred = ?");
            args.push((v as i64).into());
        }
        if let Some(v) = u.is_deleted {
            sets.push("is_deleted = ?");
            args.push((v as i64).into());
        }
        if let Some(v) = u.folder {
            sets.push("folder = ?");
            args.push(v.to_string().into());
        }
        if sets.is_empty() {
            return Ok(());
        }

        let sql = format!("UPDATE email SET {} WHERE id = ?", sets.join(", "));
        args.push(id.to_string().into());
        let conn = self.pool.get()?;
        let params_iter: Vec<&dyn ToSql> = args.iter().map(|v| v as &dyn ToSql).collect();
        conn.execute(&sql, params_iter.as_slice())?;
        Ok(())
    }

    pub fn unread_count(&self, account_id: Option<&str>) -> AppResult<u32> {
        let conn = self.pool.get()?;
        let count: i64 = match account_id {
            Some(id) => conn.query_row(
                "SELECT COUNT(*) FROM email
                 WHERE is_read = 0 AND is_deleted = 0 AND email_account_id = ?1",
                params![id],
                |r| r.get(0),
            )?,
            None => conn.query_row(
                "SELECT COUNT(*) FROM email WHERE is_read = 0 AND is_deleted = 0",
                [],
                |r| r.get(0),
            )?,
        };
        Ok(count as u32)
    }
}

const EMAIL_SELECT_BY_ID: &str =
    "SELECT id, email_account_id, message_id, folder, subject, sender, sender_name,
            recipients_to, recipients_cc, recipients_bcc,
            body_text, body_html, snippet, received_at,
            is_read, is_starred, is_deleted, has_attachments
     FROM email WHERE id = ?1";

fn map_email(row: &Row<'_>) -> rusqlite::Result<Email> {
    Ok(Email {
        id: row.get(0)?,
        email_account_id: row.get(1)?,
        message_id: row.get(2)?,
        folder: row.get(3)?,
        subject: row.get(4)?,
        sender: row.get(5)?,
        sender_name: row.get(6)?,
        recipients_to: row.get(7)?,
        recipients_cc: row.get(8)?,
        recipients_bcc: row.get(9)?,
        body_text: row.get(10)?,
        body_html: row.get(11)?,
        snippet: row.get(12)?,
        received_at: row.get(13)?,
        is_read: row.get::<_, i64>(14)? == 1,
        is_starred: row.get::<_, i64>(15)? == 1,
        is_deleted: row.get::<_, i64>(16)? == 1,
        has_attachments: row.get::<_, i64>(17)? == 1,
    })
}

fn map_summary(row: &Row<'_>) -> rusqlite::Result<EmailSummary> {
    let tag_blob: Option<String> = row.get(10)?;
    let tags = tag_blob
        .map(|s| {
            s.split('\x1f')
                .filter_map(|t| {
                    let mut parts = t.splitn(3, '|');
                    let id = parts.next()?.to_string();
                    let name = parts.next()?.to_string();
                    let color = parts.next().unwrap_or("#8B5CF6").to_string();
                    Some(TagSummary { id, name, color })
                })
                .collect()
        })
        .unwrap_or_default();

    Ok(EmailSummary {
        id: row.get(0)?,
        account_id: row.get(1)?,
        message_id: row.get(2)?,
        subject: row.get::<_, Option<String>>(3)?.unwrap_or_else(|| "(无主题)".into()),
        sender: row.get(4)?,
        sender_name: row.get(5)?,
        snippet: row.get::<_, Option<String>>(6)?.unwrap_or_default(),
        received_at: row.get(7)?,
        is_read: row.get::<_, i64>(8)? == 1,
        is_starred: row.get::<_, i64>(9)? == 1,
        tags,
    })
}
