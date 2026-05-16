use rusqlite::{params, OptionalExtension, Row};

use crate::database::SharedPool;
use crate::error::AppResult;
use crate::models::EmailAccount;

pub struct EmailAccountRepo {
    pool: SharedPool,
}

#[derive(Debug, Clone)]
pub struct CreateEmailAccount<'a> {
    pub id: &'a str,
    pub wallet_address: &'a str,
    pub email_address: &'a str,
    pub display_name: Option<&'a str>,
    pub provider: &'a str,
    pub imap_host: &'a str,
    pub imap_port: u16,
    pub smtp_host: &'a str,
    pub smtp_port: u16,
    pub auth_type: &'a str,
    pub credentials: &'a str,
}

#[derive(Debug, Clone, Default)]
pub struct UpdateEmailAccount<'a> {
    pub display_name: Option<Option<&'a str>>,
    pub imap_host: Option<&'a str>,
    pub imap_port: Option<u16>,
    pub smtp_host: Option<&'a str>,
    pub smtp_port: Option<u16>,
    pub credentials: Option<&'a str>,
    pub is_active: Option<bool>,
    pub last_sync_at: Option<Option<&'a str>>,
}

impl EmailAccountRepo {
    pub fn new(pool: SharedPool) -> Self {
        Self { pool }
    }

    pub fn create(&self, req: CreateEmailAccount<'_>) -> AppResult<EmailAccount> {
        let conn = self.pool.get()?;
        conn.execute(
            "INSERT INTO email_account (
                 id, wallet_address, email_address, display_name, provider,
                 imap_host, imap_port, smtp_host, smtp_port,
                 auth_type, credentials, is_active, last_sync_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 1, NULL)",
            params![
                req.id,
                req.wallet_address,
                req.email_address,
                req.display_name,
                req.provider,
                req.imap_host,
                req.imap_port,
                req.smtp_host,
                req.smtp_port,
                req.auth_type,
                req.credentials,
            ],
        )?;
        Ok(self.find_by_id(req.id)?.expect("just inserted"))
    }

    pub fn find_by_id(&self, id: &str) -> AppResult<Option<EmailAccount>> {
        let conn = self.pool.get()?;
        Ok(conn
            .query_row(
                ACCOUNT_SELECT,
                params![id],
                map_account,
            )
            .optional()?)
    }

    pub fn find_by_email(
        &self,
        wallet_address: &str,
        email_address: &str,
    ) -> AppResult<Option<EmailAccount>> {
        let conn = self.pool.get()?;
        Ok(conn
            .query_row(
                "SELECT id, wallet_address, email_address, display_name, provider,
                        imap_host, imap_port, smtp_host, smtp_port,
                        auth_type, is_active, last_sync_at
                 FROM email_account WHERE wallet_address = ?1 AND email_address = ?2",
                params![wallet_address, email_address],
                map_account,
            )
            .optional()?)
    }

    pub fn list_by_wallet(&self, wallet_address: &str) -> AppResult<Vec<EmailAccount>> {
        let conn = self.pool.get()?;
        let mut stmt = conn.prepare(
            "SELECT id, wallet_address, email_address, display_name, provider,
                    imap_host, imap_port, smtp_host, smtp_port,
                    auth_type, is_active, last_sync_at
             FROM email_account WHERE wallet_address = ?1 AND is_active = 1
             ORDER BY created_at ASC",
        )?;
        let rows = stmt
            .query_map(params![wallet_address], map_account)?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn list_all(&self) -> AppResult<Vec<EmailAccount>> {
        let conn = self.pool.get()?;
        let mut stmt = conn.prepare(
            "SELECT id, wallet_address, email_address, display_name, provider,
                    imap_host, imap_port, smtp_host, smtp_port,
                    auth_type, is_active, last_sync_at
             FROM email_account WHERE is_active = 1 ORDER BY created_at ASC",
        )?;
        let rows = stmt
            .query_map([], map_account)?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn get_credentials(&self, id: &str) -> AppResult<Option<String>> {
        let conn = self.pool.get()?;
        Ok(conn
            .query_row(
                "SELECT credentials FROM email_account WHERE id = ?1",
                params![id],
                |r| r.get::<_, String>(0),
            )
            .optional()?)
    }

    pub fn update(&self, id: &str, u: UpdateEmailAccount<'_>) -> AppResult<()> {
        let mut sets: Vec<&'static str> = Vec::new();
        let mut args: Vec<rusqlite::types::Value> = Vec::new();

        if let Some(v) = u.display_name {
            sets.push("display_name = ?");
            args.push(v.map(|s| s.to_string()).into());
        }
        if let Some(v) = u.imap_host {
            sets.push("imap_host = ?");
            args.push(v.to_string().into());
        }
        if let Some(v) = u.imap_port {
            sets.push("imap_port = ?");
            args.push((v as i64).into());
        }
        if let Some(v) = u.smtp_host {
            sets.push("smtp_host = ?");
            args.push(v.to_string().into());
        }
        if let Some(v) = u.smtp_port {
            sets.push("smtp_port = ?");
            args.push((v as i64).into());
        }
        if let Some(v) = u.credentials {
            sets.push("credentials = ?");
            args.push(v.to_string().into());
        }
        if let Some(v) = u.is_active {
            sets.push("is_active = ?");
            args.push((v as i64).into());
        }
        if let Some(v) = u.last_sync_at {
            sets.push("last_sync_at = ?");
            args.push(v.map(|s| s.to_string()).into());
        }

        if sets.is_empty() {
            return Ok(());
        }

        sets.push("updated_at = datetime('now')");
        let sql = format!(
            "UPDATE email_account SET {} WHERE id = ?",
            sets.join(", ")
        );
        args.push(id.to_string().into());

        let conn = self.pool.get()?;
        let params_iter: Vec<&dyn rusqlite::ToSql> =
            args.iter().map(|v| v as &dyn rusqlite::ToSql).collect();
        conn.execute(&sql, params_iter.as_slice())?;
        Ok(())
    }

    pub fn delete(&self, id: &str) -> AppResult<()> {
        let conn = self.pool.get()?;
        conn.execute("DELETE FROM email_account WHERE id = ?1", params![id])?;
        Ok(())
    }
}

const ACCOUNT_SELECT: &str = "SELECT id, wallet_address, email_address, display_name, provider,
        imap_host, imap_port, smtp_host, smtp_port,
        auth_type, is_active, last_sync_at
 FROM email_account WHERE id = ?1";

fn map_account(row: &Row<'_>) -> rusqlite::Result<EmailAccount> {
    Ok(EmailAccount {
        id: row.get(0)?,
        wallet_address: row.get(1)?,
        email_address: row.get(2)?,
        display_name: row.get(3)?,
        provider: row.get(4)?,
        imap_host: row.get(5)?,
        imap_port: row.get::<_, i64>(6)? as u16,
        smtp_host: row.get(7)?,
        smtp_port: row.get::<_, i64>(8)? as u16,
        auth_type: row.get(9)?,
        is_active: row.get::<_, i64>(10)? == 1,
        last_sync_at: row.get(11)?,
    })
}
