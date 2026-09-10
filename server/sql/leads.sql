-- Standalone migration: the `leads` table (contact/consultation form storage).
-- Beta has no SSH, so apply this on the host via phpMyAdmin (import this file),
-- or paste it into the SQL tab. Idempotent (IF NOT EXISTS). Already in schema.sql
-- for fresh installs — this file is just for adding it to an existing beta DB.

CREATE TABLE IF NOT EXISTS leads (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(120) NOT NULL DEFAULT '',
  phone       VARCHAR(40)  NOT NULL,
  course      VARCHAR(190) NOT NULL DEFAULT '',
  form        VARCHAR(60)  NOT NULL DEFAULT '',
  source      VARCHAR(190) NOT NULL DEFAULT '',
  ip          VARCHAR(45)  NOT NULL DEFAULT '',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_leads_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
