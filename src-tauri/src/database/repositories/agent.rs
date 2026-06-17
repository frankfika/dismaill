use rusqlite::{params, OptionalExtension, Row, ToSql};

use crate::database::SharedPool;
use crate::error::AppResult;
use crate::models::ReplyAgent;

pub struct AgentRepo {
    pool: SharedPool,
}

#[derive(Debug, Clone)]
pub struct CreateAgent<'a> {
    pub id: &'a str,
    pub wallet_address: &'a str,
    pub name: &'a str,
    pub description: &'a str,
    pub icon: &'a str,
    pub system_prompt: &'a str,
    pub provider: Option<&'a str>,
    pub model: Option<&'a str>,
    pub temperature: f64,
    pub max_tokens: u32,
    pub default_skill_id: Option<&'a str>,
    pub trigger_categories_json: &'a str,
}

#[derive(Debug, Clone, Default)]
pub struct UpdateAgent<'a> {
    pub name: Option<&'a str>,
    pub description: Option<&'a str>,
    pub icon: Option<&'a str>,
    pub system_prompt: Option<&'a str>,
    pub provider: Option<Option<&'a str>>,
    pub model: Option<Option<&'a str>>,
    pub temperature: Option<f64>,
    pub max_tokens: Option<u32>,
    pub default_skill_id: Option<Option<&'a str>>,
    pub trigger_categories_json: Option<&'a str>,
}

impl AgentRepo {
    pub fn new(pool: SharedPool) -> Self { Self { pool } }

    pub fn create(&self, a: CreateAgent<'_>) -> AppResult<ReplyAgent> {
        let conn = self.pool.get()?;
        conn.execute(
            "INSERT INTO reply_agent (
                 id, wallet_address, name, description, icon,
                 system_prompt, provider, model, temperature, max_tokens,
                 default_skill_id, trigger_categories
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                a.id,
                a.wallet_address,
                a.name,
                a.description,
                a.icon,
                a.system_prompt,
                a.provider,
                a.model,
                a.temperature,
                a.max_tokens as i64,
                a.default_skill_id,
                a.trigger_categories_json,
            ],
        )?;
        Ok(self.find_by_id(a.id)?.expect("just inserted"))
    }

    pub fn find_by_id(&self, id: &str) -> AppResult<Option<ReplyAgent>> {
        let conn = self.pool.get()?;
        conn.query_row(AGENT_SELECT_BY_ID, params![id], map_agent)
            .optional()
            .map_err(Into::into)
    }

    pub fn list_by_wallet(&self, wallet: &str) -> AppResult<Vec<ReplyAgent>> {
        let conn = self.pool.get()?;
        let mut stmt = conn.prepare(
            "SELECT id, wallet_address, name, description, icon,
                    system_prompt, provider, model, temperature, max_tokens,
                    default_skill_id, trigger_categories,
                    use_count, sort_order, created_at, updated_at
             FROM reply_agent WHERE wallet_address = ?1
             ORDER BY sort_order ASC, created_at ASC",
        )?;
        let rows = stmt.query_map(params![wallet], map_agent)?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn update(&self, id: &str, u: UpdateAgent<'_>) -> AppResult<()> {
        let mut sets: Vec<&'static str> = Vec::new();
        let mut args: Vec<rusqlite::types::Value> = Vec::new();
        if let Some(v) = u.name { sets.push("name = ?"); args.push(v.to_string().into()); }
        if let Some(v) = u.description { sets.push("description = ?"); args.push(v.to_string().into()); }
        if let Some(v) = u.icon { sets.push("icon = ?"); args.push(v.to_string().into()); }
        if let Some(v) = u.system_prompt { sets.push("system_prompt = ?"); args.push(v.to_string().into()); }
        if let Some(v) = u.provider { sets.push("provider = ?"); args.push(v.map(|s| s.to_string()).into()); }
        if let Some(v) = u.model { sets.push("model = ?"); args.push(v.map(|s| s.to_string()).into()); }
        if let Some(v) = u.temperature { sets.push("temperature = ?"); args.push(v.into()); }
        if let Some(v) = u.max_tokens { sets.push("max_tokens = ?"); args.push((v as i64).into()); }
        if let Some(v) = u.default_skill_id { sets.push("default_skill_id = ?"); args.push(v.map(|s| s.to_string()).into()); }
        if let Some(v) = u.trigger_categories_json { sets.push("trigger_categories = ?"); args.push(v.to_string().into()); }
        if sets.is_empty() { return Ok(()); }
        sets.push("updated_at = datetime('now')");
        let sql = format!("UPDATE reply_agent SET {} WHERE id = ?", sets.join(", "));
        args.push(id.to_string().into());
        let conn = self.pool.get()?;
        let params_iter: Vec<&dyn ToSql> = args.iter().map(|v| v as &dyn ToSql).collect();
        conn.execute(&sql, params_iter.as_slice())?;
        Ok(())
    }

    pub fn delete(&self, id: &str) -> AppResult<()> {
        let conn = self.pool.get()?;
        conn.execute("DELETE FROM reply_agent WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn incr_use_count(&self, id: &str) -> AppResult<()> {
        let conn = self.pool.get()?;
        conn.execute(
            "UPDATE reply_agent SET use_count = use_count + 1, updated_at = datetime('now') WHERE id = ?1",
            params![id],
        )?;
        Ok(())
    }
}

const AGENT_SELECT_BY_ID: &str = "SELECT id, wallet_address, name, description, icon,
    system_prompt, provider, model, temperature, max_tokens,
    default_skill_id, trigger_categories,
    use_count, sort_order, created_at, updated_at
    FROM reply_agent WHERE id = ?1";

fn map_agent(r: &Row<'_>) -> rusqlite::Result<ReplyAgent> {
    let cats_json: String = r.get("trigger_categories")?;
    Ok(ReplyAgent {
        id: r.get("id")?,
        wallet_address: r.get("wallet_address")?,
        name: r.get("name")?,
        description: r.get("description")?,
        icon: r.get("icon")?,
        system_prompt: r.get("system_prompt")?,
        provider: r.get("provider")?,
        model: r.get("model")?,
        temperature: r.get("temperature")?,
        max_tokens: r.get::<_, i64>("max_tokens")? as u32,
        default_skill_id: r.get("default_skill_id")?,
        trigger_categories: serde_json::from_str(&cats_json).unwrap_or_default(),
        use_count: r.get::<_, i64>("use_count")? as u32,
        sort_order: r.get("sort_order")?,
        created_at: r.get("created_at")?,
        updated_at: r.get("updated_at")?,
    })
}
