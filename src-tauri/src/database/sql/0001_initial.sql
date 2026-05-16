-- Mirror of the original Electron migration. Schema must stay byte-compatible
-- so existing aura.db files keep working after the Tauri rewrite.

CREATE TABLE IF NOT EXISTS wallet (
    address         TEXT PRIMARY KEY,
    ens_name        TEXT,
    avatar_url      TEXT,
    encrypted_key   TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_account (
    id              TEXT PRIMARY KEY,
    wallet_address  TEXT NOT NULL REFERENCES wallet(address) ON DELETE CASCADE,
    email_address   TEXT NOT NULL,
    display_name    TEXT,
    provider        TEXT NOT NULL,
    imap_host       TEXT NOT NULL,
    imap_port       INTEGER NOT NULL DEFAULT 993,
    smtp_host       TEXT NOT NULL,
    smtp_port       INTEGER NOT NULL DEFAULT 465,
    auth_type       TEXT NOT NULL DEFAULT 'password',
    credentials     TEXT NOT NULL,
    is_active       INTEGER NOT NULL DEFAULT 1,
    last_sync_at    TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_email_account_wallet ON email_account(wallet_address);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_account_address
    ON email_account(wallet_address, email_address);

CREATE TABLE IF NOT EXISTS email (
    id                TEXT PRIMARY KEY,
    email_account_id  TEXT NOT NULL REFERENCES email_account(id) ON DELETE CASCADE,
    message_id        TEXT NOT NULL,
    folder            TEXT NOT NULL DEFAULT 'INBOX',
    subject           TEXT,
    sender            TEXT NOT NULL,
    sender_name       TEXT,
    recipients_to     TEXT,
    recipients_cc     TEXT,
    recipients_bcc    TEXT,
    body_text         TEXT,
    body_html         TEXT,
    snippet           TEXT,
    received_at       TEXT NOT NULL,
    is_read           INTEGER NOT NULL DEFAULT 0,
    is_starred        INTEGER NOT NULL DEFAULT 0,
    is_deleted        INTEGER NOT NULL DEFAULT 0,
    has_attachments   INTEGER NOT NULL DEFAULT 0,
    raw_size          INTEGER,
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_email_account ON email(email_account_id);
CREATE INDEX IF NOT EXISTS idx_email_folder ON email(email_account_id, folder);
CREATE INDEX IF NOT EXISTS idx_email_received ON email(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_message_id ON email(message_id);
CREATE INDEX IF NOT EXISTS idx_email_sender ON email(sender);
CREATE INDEX IF NOT EXISTS idx_email_read ON email(email_account_id, is_read) WHERE is_read = 0;
CREATE INDEX IF NOT EXISTS idx_email_deleted ON email(is_deleted) WHERE is_deleted = 0;

CREATE VIRTUAL TABLE IF NOT EXISTS email_fts USING fts5(
    subject, sender, sender_name, body_text, snippet,
    content='email',
    content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS email_fts_insert AFTER INSERT ON email BEGIN
    INSERT INTO email_fts(rowid, subject, sender, sender_name, body_text, snippet)
    VALUES (new.rowid, new.subject, new.sender, new.sender_name, new.body_text, new.snippet);
END;

CREATE TRIGGER IF NOT EXISTS email_fts_delete AFTER DELETE ON email BEGIN
    INSERT INTO email_fts(email_fts, rowid, subject, sender, sender_name, body_text, snippet)
    VALUES ('delete', old.rowid, old.subject, old.sender, old.sender_name, old.body_text, old.snippet);
END;

CREATE TRIGGER IF NOT EXISTS email_fts_update AFTER UPDATE ON email BEGIN
    INSERT INTO email_fts(email_fts, rowid, subject, sender, sender_name, body_text, snippet)
    VALUES ('delete', old.rowid, old.subject, old.sender, old.sender_name, old.body_text, old.snippet);
    INSERT INTO email_fts(rowid, subject, sender, sender_name, body_text, snippet)
    VALUES (new.rowid, new.subject, new.sender, new.sender_name, new.body_text, new.snippet);
END;

CREATE TABLE IF NOT EXISTS email_attachment (
    id              TEXT PRIMARY KEY,
    email_id        TEXT NOT NULL REFERENCES email(id) ON DELETE CASCADE,
    filename        TEXT NOT NULL,
    content_type    TEXT NOT NULL,
    size            INTEGER NOT NULL,
    local_path      TEXT,
    is_downloaded   INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_attachment_email ON email_attachment(email_id);

CREATE TABLE IF NOT EXISTS signature (
    id                TEXT PRIMARY KEY,
    email_account_id  TEXT NOT NULL REFERENCES email_account(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    content_html      TEXT NOT NULL,
    content_text      TEXT,
    is_default        INTEGER NOT NULL DEFAULT 0,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_signature_account ON signature(email_account_id);

CREATE TABLE IF NOT EXISTS tag (
    id              TEXT PRIMARY KEY,
    wallet_address  TEXT NOT NULL REFERENCES wallet(address) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    color           TEXT NOT NULL DEFAULT '#8B5CF6',
    description     TEXT,
    is_ai_enabled   INTEGER NOT NULL DEFAULT 0,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tag_wallet ON tag(wallet_address);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tag_name ON tag(wallet_address, name);

CREATE TABLE IF NOT EXISTS email_tag (
    email_id          TEXT NOT NULL REFERENCES email(id) ON DELETE CASCADE,
    tag_id            TEXT NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
    is_ai_applied     INTEGER NOT NULL DEFAULT 0,
    confidence_score  REAL,
    applied_at        TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (email_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_email_tag_tag ON email_tag(tag_id);

CREATE TABLE IF NOT EXISTS outbox (
    id              TEXT PRIMARY KEY,
    email_account_id TEXT NOT NULL REFERENCES email_account(id) ON DELETE CASCADE,
    payload         TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    retry_count     INTEGER NOT NULL DEFAULT 0,
    max_retries     INTEGER NOT NULL DEFAULT 3,
    error_message   TEXT,
    scheduled_at    TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_outbox_status
    ON outbox(status) WHERE status IN ('pending', 'sending');
CREATE INDEX IF NOT EXISTS idx_outbox_account ON outbox(email_account_id);

CREATE TABLE IF NOT EXISTS ai_config (
    id                TEXT PRIMARY KEY,
    wallet_address    TEXT NOT NULL REFERENCES wallet(address) ON DELETE CASCADE,
    provider_type     TEXT NOT NULL,
    api_key_encrypted TEXT,
    base_url          TEXT,
    default_model     TEXT,
    use_local_llm     INTEGER NOT NULL DEFAULT 0,
    local_model_name  TEXT,
    max_tokens        INTEGER NOT NULL DEFAULT 4096,
    temperature       REAL NOT NULL DEFAULT 0.7,
    is_active         INTEGER NOT NULL DEFAULT 1,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_config_wallet ON ai_config(wallet_address);

CREATE TABLE IF NOT EXISTS contact (
    id              TEXT PRIMARY KEY,
    wallet_address  TEXT NOT NULL REFERENCES wallet(address) ON DELETE CASCADE,
    contact_address TEXT,
    email_address   TEXT,
    display_name    TEXT,
    ens_name        TEXT,
    avatar_url      TEXT,
    notes           TEXT,
    is_favorite     INTEGER NOT NULL DEFAULT 0,
    last_contact_at TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contact_wallet ON contact(wallet_address);
CREATE INDEX IF NOT EXISTS idx_contact_email ON contact(email_address);
