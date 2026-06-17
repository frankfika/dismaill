#![allow(dead_code)]
use rusqlite::{params, OptionalExtension, Row};

use crate::database::SharedPool;
use crate::error::AppResult;
use crate::models::Wallet;

pub struct WalletRepo {
    pool: SharedPool,
}

impl WalletRepo {
    pub fn new(pool: SharedPool) -> Self {
        Self { pool }
    }

    pub fn upsert(
        &self,
        address: &str,
        ens_name: Option<&str>,
        avatar_url: Option<&str>,
        encrypted_key: &str,
    ) -> AppResult<Wallet> {
        let conn = self.pool.get()?;
        conn.execute(
            "INSERT INTO wallet (address, ens_name, avatar_url, encrypted_key)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(address) DO UPDATE SET
                 ens_name = excluded.ens_name,
                 avatar_url = excluded.avatar_url,
                 updated_at = datetime('now')",
            params![address, ens_name, avatar_url, encrypted_key],
        )?;
        self.find_by_address(address).map(|w| w.expect("just upserted"))
    }

    pub fn find_by_address(&self, address: &str) -> AppResult<Option<Wallet>> {
        let conn = self.pool.get()?;
        let row = conn
            .query_row(
                "SELECT address, ens_name, avatar_url, created_at
                 FROM wallet WHERE address = ?1",
                params![address],
                map_wallet,
            )
            .optional()?;
        Ok(row)
    }

    pub fn exists(&self, address: &str) -> AppResult<bool> {
        let conn = self.pool.get()?;
        let exists: Option<i64> = conn
            .query_row(
                "SELECT 1 FROM wallet WHERE address = ?1",
                params![address],
                |r| r.get(0),
            )
            .optional()?;
        Ok(exists.is_some())
    }

    pub fn update_ens(
        &self,
        address: &str,
        ens_name: Option<&str>,
        avatar_url: Option<&str>,
    ) -> AppResult<()> {
        let conn = self.pool.get()?;
        conn.execute(
            "UPDATE wallet SET ens_name = ?2, avatar_url = ?3, updated_at = datetime('now')
             WHERE address = ?1",
            params![address, ens_name, avatar_url],
        )?;
        Ok(())
    }

    #[allow(dead_code)]
    pub fn delete(&self, address: &str) -> AppResult<()> {
        let conn = self.pool.get()?;
        conn.execute("DELETE FROM wallet WHERE address = ?1", params![address])?;
        Ok(())
    }
}

fn map_wallet(row: &Row<'_>) -> rusqlite::Result<Wallet> {
    Ok(Wallet {
        address: row.get(0)?,
        ens_name: row.get(1)?,
        avatar_url: row.get(2)?,
        created_at: row.get(3)?,
    })
}
