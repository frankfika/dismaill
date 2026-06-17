-- Reply agents: a named "persona" / scenario preset for the AI. Each agent
-- has its own system prompt, preferred provider / model, and may declare
-- a default skill that the AI will apply on top of its instructions.

CREATE TABLE IF NOT EXISTS reply_agent (
    id                TEXT PRIMARY KEY,
    wallet_address    TEXT NOT NULL REFERENCES wallet(address) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    description       TEXT NOT NULL DEFAULT '',
    icon              TEXT NOT NULL DEFAULT 'wand',
    system_prompt     TEXT NOT NULL,
    -- 'openai' | 'claude' | 'ollama' | null (use default)
    provider          TEXT,
    -- 'gpt-4o' | 'claude-3-sonnet-20240229' | null
    model             TEXT,
    temperature       REAL NOT NULL DEFAULT 0.7,
    max_tokens        INTEGER NOT NULL DEFAULT 2000,
    -- Optional default skill id; the renderer may override per-message.
    default_skill_id  TEXT REFERENCES reply_skill(id) ON DELETE SET NULL,
    trigger_categories TEXT NOT NULL DEFAULT '[]',
    use_count         INTEGER NOT NULL DEFAULT 0,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reply_agent_wallet ON reply_agent(wallet_address);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reply_agent_name ON reply_agent(wallet_address, name);
