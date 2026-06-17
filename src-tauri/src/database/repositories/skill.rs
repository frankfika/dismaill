use rusqlite::{params, OptionalExtension, Row, ToSql};

use crate::database::SharedPool;
use crate::error::AppResult;
use crate::models::{ReplySkill, ReplySkillExample};

pub struct SkillRepo {
    pool: SharedPool,
}

#[derive(Debug, Clone)]
pub struct CreateSkill<'a> {
    pub id: &'a str,
    pub wallet_address: &'a str,
    pub name: &'a str,
    pub description: &'a str,
    pub trigger_categories_json: &'a str,
    pub tone: &'a str,
    pub language: &'a str,
    pub max_length: u32,
    pub include_signature: bool,
    pub system_prompt: &'a str,
    pub examples_json: &'a str,
    pub reply_template: &'a str,
}

#[derive(Debug, Clone, Default)]
pub struct UpdateSkill<'a> {
    pub name: Option<&'a str>,
    pub description: Option<&'a str>,
    pub trigger_categories_json: Option<&'a str>,
    pub tone: Option<&'a str>,
    pub language: Option<&'a str>,
    pub max_length: Option<u32>,
    pub include_signature: Option<bool>,
    pub system_prompt: Option<&'a str>,
    pub examples_json: Option<&'a str>,
    pub reply_template: Option<&'a str>,
}

impl SkillRepo {
    pub fn new(pool: SharedPool) -> Self { Self { pool } }

    pub fn create(&self, s: CreateSkill<'_>) -> AppResult<ReplySkill> {
        let conn = self.pool.get()?;
        conn.execute(
            "INSERT INTO reply_skill (
                 id, wallet_address, name, description, trigger_categories,
                 tone, language, max_length, include_signature,
                 system_prompt, examples, reply_template
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                s.id,
                s.wallet_address,
                s.name,
                s.description,
                s.trigger_categories_json,
                s.tone,
                s.language,
                s.max_length,
                s.include_signature as i64,
                s.system_prompt,
                s.examples_json,
                s.reply_template,
            ],
        )?;
        Ok(self.find_by_id(s.id)?.expect("just inserted"))
    }

    pub fn find_by_id(&self, id: &str) -> AppResult<Option<ReplySkill>> {
        let conn = self.pool.get()?;
        conn.query_row(SKILL_SELECT_BY_ID, params![id], map_skill).optional()
            .map_err(Into::into)
    }

    pub fn list_by_wallet(&self, wallet: &str) -> AppResult<Vec<ReplySkill>> {
        let conn = self.pool.get()?;
        let mut stmt = conn.prepare(
            "SELECT id, wallet_address, name, description, trigger_categories,
                    tone, language, max_length, include_signature,
                    system_prompt, examples, reply_template,
                    use_count, sort_order, created_at, updated_at
             FROM reply_skill WHERE wallet_address = ?1
             ORDER BY sort_order ASC, created_at ASC",
        )?;
        let rows = stmt.query_map(params![wallet], map_skill)?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn update(&self, id: &str, u: UpdateSkill<'_>) -> AppResult<()> {
        let mut sets: Vec<&'static str> = Vec::new();
        let mut args: Vec<rusqlite::types::Value> = Vec::new();
        if let Some(v) = u.name { sets.push("name = ?"); args.push(v.to_string().into()); }
        if let Some(v) = u.description { sets.push("description = ?"); args.push(v.to_string().into()); }
        if let Some(v) = u.trigger_categories_json { sets.push("trigger_categories = ?"); args.push(v.to_string().into()); }
        if let Some(v) = u.tone { sets.push("tone = ?"); args.push(v.to_string().into()); }
        if let Some(v) = u.language { sets.push("language = ?"); args.push(v.to_string().into()); }
        if let Some(v) = u.max_length { sets.push("max_length = ?"); args.push((v as i64).into()); }
        if let Some(v) = u.include_signature { sets.push("include_signature = ?"); args.push((v as i64).into()); }
        if let Some(v) = u.system_prompt { sets.push("system_prompt = ?"); args.push(v.to_string().into()); }
        if let Some(v) = u.examples_json { sets.push("examples = ?"); args.push(v.to_string().into()); }
        if let Some(v) = u.reply_template { sets.push("reply_template = ?"); args.push(v.to_string().into()); }
        if sets.is_empty() { return Ok(()); }
        sets.push("updated_at = datetime('now')");
        let sql = format!("UPDATE reply_skill SET {} WHERE id = ?", sets.join(", "));
        args.push(id.to_string().into());
        let conn = self.pool.get()?;
        let params_iter: Vec<&dyn ToSql> = args.iter().map(|v| v as &dyn ToSql).collect();
        conn.execute(&sql, params_iter.as_slice())?;
        Ok(())
    }

    pub fn delete(&self, id: &str) -> AppResult<()> {
        let conn = self.pool.get()?;
        conn.execute("DELETE FROM reply_skill WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn incr_use_count(&self, id: &str) -> AppResult<()> {
        let conn = self.pool.get()?;
        conn.execute(
            "UPDATE reply_skill SET use_count = use_count + 1, updated_at = datetime('now') WHERE id = ?1",
            params![id],
        )?;
        Ok(())
    }
}

const SKILL_SELECT_BY_ID: &str = "SELECT id, wallet_address, name, description, trigger_categories,
    tone, language, max_length, include_signature,
    system_prompt, examples, reply_template,
    use_count, sort_order, created_at, updated_at
    FROM reply_skill WHERE id = ?1";

fn map_skill(r: &Row<'_>) -> rusqlite::Result<ReplySkill> {
    let cats_json: String = r.get("trigger_categories")?;
    let examples_json: String = r.get("examples")?;
    Ok(ReplySkill {
        id: r.get("id")?,
        wallet_address: r.get("wallet_address")?,
        name: r.get("name")?,
        description: r.get("description")?,
        trigger_categories: serde_json::from_str(&cats_json).unwrap_or_default(),
        tone: r.get("tone")?,
        language: r.get("language")?,
        max_length: r.get::<_, i64>("max_length")? as u32,
        include_signature: r.get::<_, i64>("include_signature")? != 0,
        system_prompt: r.get("system_prompt")?,
        examples: serde_json::from_str::<Vec<ReplySkillExample>>(&examples_json).unwrap_or_default(),
        reply_template: r.get("reply_template")?,
        use_count: r.get::<_, i64>("use_count")? as u32,
        sort_order: r.get("sort_order")?,
        created_at: r.get("created_at")?,
        updated_at: r.get("updated_at")?,
    })
}
