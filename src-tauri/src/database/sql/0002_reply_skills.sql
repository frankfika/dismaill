-- Reply skills: user-trained reply templates the AI can apply when
-- composing or refining an email. Each skill is scoped to a wallet and
-- carries a tone, language, optional few-shot examples, and a counter
-- for analytics.

CREATE TABLE IF NOT EXISTS reply_skill (
    id                TEXT PRIMARY KEY,
    wallet_address    TEXT NOT NULL REFERENCES wallet(address) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    description       TEXT NOT NULL DEFAULT '',
    -- JSON-encoded Vec<String>; categories the user associates with the
    -- skill (e.g. ["催收", "投诉"]) — used by the renderer for filtering.
    trigger_categories TEXT NOT NULL DEFAULT '[]',
    -- Tone preset key: formal | casual | friendly | firm | apologetic |
    -- enthusiastic | concise. Free-form strings are accepted but the
    -- renderer only renders the known set.
    tone              TEXT NOT NULL DEFAULT 'formal',
    -- 'auto' | 'zh' | 'en' | any BCP-47 code.
    language          TEXT NOT NULL DEFAULT 'auto',
    max_length        INTEGER NOT NULL DEFAULT 500,
    include_signature INTEGER NOT NULL DEFAULT 0,
    system_prompt     TEXT NOT NULL DEFAULT '',
    -- JSON-encoded Vec<{ incoming, outgoing }>.
    examples          TEXT NOT NULL DEFAULT '[]',
    reply_template    TEXT NOT NULL DEFAULT '',
    use_count         INTEGER NOT NULL DEFAULT 0,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reply_skill_wallet ON reply_skill(wallet_address);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reply_skill_name ON reply_skill(wallet_address, name);
