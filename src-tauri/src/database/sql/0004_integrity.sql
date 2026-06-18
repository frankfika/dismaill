-- 0004_integrity.sql — data integrity + crypto salt
-- Adds:
--   * per-wallet master_key_salt (BLOB) for Argon2id KDF
--   * UNIQUE on email(email_account_id, message_id) to prevent dup imports
--   * updated_at triggers on entity tables that had a manual
--     datetime('now') on every UPDATE
--   * outbox partial index that covers 'failed' status (was full-scan)
--   * email partial index covering (email_account_id, is_deleted, is_read)
--     for the smart_folders 3-way join

-- Per-wallet Argon2id salt (random 16 bytes generated on first unlock).
ALTER TABLE wallet ADD COLUMN master_key_salt BLOB;

-- Deduplicate any existing duplicate message_ids per account before
-- applying the UNIQUE constraint. Keep the row with the lowest rowid
-- (first-seen) per (email_account_id, message_id) pair.
DELETE FROM email
WHERE rowid NOT IN (
    SELECT MIN(rowid) FROM email
    GROUP BY email_account_id, message_id
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_msgid_per_account
    ON email(email_account_id, message_id);

-- Add covering index for smart_folders query.
CREATE INDEX IF NOT EXISTS idx_email_account_deleted_read
    ON email(email_account_id, is_deleted, is_read);

-- Extend the outbox partial index to also cover 'failed' rows.
DROP INDEX IF EXISTS idx_outbox_status;
CREATE INDEX idx_outbox_status
    ON outbox(status) WHERE status IN ('pending', 'sending', 'failed');

-- updated_at triggers: any UPDATE that doesn't touch updated_at explicitly
-- still gets a fresh timestamp. Application code can pass datetime('now')
-- itself; the trigger only fires if the column was left untouched.
CREATE TRIGGER IF NOT EXISTS trg_email_account_updated_at
    AFTER UPDATE ON email_account
    BEGIN
        UPDATE email_account
           SET updated_at = datetime('now')
         WHERE id = NEW.id
           AND NEW.updated_at = OLD.updated_at;
    END;

CREATE TRIGGER IF NOT EXISTS trg_tag_updated_at
    AFTER UPDATE ON tag
    BEGIN
        UPDATE tag
           SET updated_at = datetime('now')
         WHERE id = NEW.id
           AND NEW.updated_at = OLD.updated_at;
    END;

CREATE TRIGGER IF NOT EXISTS trg_signature_updated_at
    AFTER UPDATE ON signature
    BEGIN
        UPDATE signature
           SET updated_at = datetime('now')
         WHERE id = NEW.id
           AND NEW.updated_at = OLD.updated_at;
    END;

CREATE TRIGGER IF NOT EXISTS trg_wallet_updated_at
    AFTER UPDATE ON wallet
    BEGIN
        UPDATE wallet
           SET updated_at = datetime('now')
         WHERE address = NEW.address
           AND NEW.updated_at = OLD.updated_at;
    END;

CREATE TRIGGER IF NOT EXISTS trg_outbox_updated_at
    AFTER UPDATE ON outbox
    BEGIN
        UPDATE outbox
           SET updated_at = datetime('now')
         WHERE id = NEW.id
           AND NEW.updated_at = OLD.updated_at;
    END;

CREATE TRIGGER IF NOT EXISTS trg_ai_config_updated_at
    AFTER UPDATE ON ai_config
    BEGIN
        UPDATE ai_config
           SET updated_at = datetime('now')
         WHERE id = NEW.id
           AND NEW.updated_at = OLD.updated_at;
    END;

CREATE TRIGGER IF NOT EXISTS trg_contact_updated_at
    AFTER UPDATE ON contact
    BEGIN
        UPDATE contact
           SET updated_at = datetime('now')
         WHERE id = NEW.id
           AND NEW.updated_at = OLD.updated_at;
    END;
