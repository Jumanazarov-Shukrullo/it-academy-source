-- it-academy.uz CMS schema (MySQL 8 / MariaDB 10.5+)
-- All editable marketing content + the course schedule + admin users.
-- Student data is NOT here — it stays in HolliHop CRM, reached via /api proxy.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ---------------------------------------------------------------------------
-- Admin auth
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(64)  NOT NULL,
  email         VARCHAR(190) DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','editor') NOT NULL DEFAULT 'admin',
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_sessions (
  token       CHAR(64)     NOT NULL,           -- opaque random token (sha256 hex)
  user_id     INT UNSIGNED NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME     NOT NULL,
  user_agent  VARCHAR(255) DEFAULT NULL,
  ip          VARCHAR(45)  DEFAULT NULL,
  PRIMARY KEY (token),
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Generic localized key/value copy (hero text, about, contacts, footer, ...)
-- key like "home.hero.title"; value stored per locale.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_blocks (
  block_key   VARCHAR(190) NOT NULL,
  value_ru    MEDIUMTEXT   DEFAULT NULL,
  value_uz    MEDIUMTEXT   DEFAULT NULL,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (block_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Courses
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug            VARCHAR(120) NOT NULL,        -- e.g. "python", "datascience"
  title_ru        VARCHAR(255) NOT NULL,
  title_uz        VARCHAR(255) NOT NULL,
  summary_ru      TEXT         DEFAULT NULL,
  summary_uz      TEXT         DEFAULT NULL,
  description_ru  MEDIUMTEXT   DEFAULT NULL,
  description_uz  MEDIUMTEXT   DEFAULT NULL,
  price           DECIMAL(12,2) DEFAULT NULL,
  duration_months INT          DEFAULT NULL,
  duration_ru     VARCHAR(120) DEFAULT NULL,
  duration_uz     VARCHAR(120) DEFAULT NULL,
  lessons_ru      VARCHAR(120) DEFAULT NULL,
  lessons_uz      VARCHAR(120) DEFAULT NULL,
  format_ru       VARCHAR(120) DEFAULT NULL,
  format_uz       VARCHAR(120) DEFAULT NULL,
  lesson_duration_ru VARCHAR(120) DEFAULT NULL,
  lesson_duration_uz VARCHAR(120) DEFAULT NULL,
  button_ru       VARCHAR(120) DEFAULT NULL,
  button_uz       VARCHAR(120) DEFAULT NULL,
  button_url      VARCHAR(500) DEFAULT NULL,
  image           VARCHAR(255) DEFAULT NULL,    -- media filename
  sort_order      INT          NOT NULL DEFAULT 0,
  is_published    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_courses_slug (slug),
  KEY idx_courses_pub_sort (is_published, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- B2B courses  (/b2b/courses)
-- Corporate courses are listed on one page only (no detail pages).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS b2b_courses (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title_ru        VARCHAR(255) NOT NULL,
  title_uz        VARCHAR(255) NOT NULL,
  summary_ru      TEXT         DEFAULT NULL,
  summary_uz      TEXT         DEFAULT NULL,
  description_ru  MEDIUMTEXT   DEFAULT NULL,
  description_uz  MEDIUMTEXT   DEFAULT NULL,
  duration_ru     VARCHAR(120) DEFAULT NULL,
  duration_uz     VARCHAR(120) DEFAULT NULL,
  format_ru       VARCHAR(190) DEFAULT NULL,
  format_uz       VARCHAR(190) DEFAULT NULL,
  image           VARCHAR(255) DEFAULT NULL,    -- media filename or uploads/<file>
  sort_order      INT          NOT NULL DEFAULT 0,
  is_published    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_b2b_courses_pub_sort (is_published, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Teachers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teachers (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(190) NOT NULL,
  role_ru     VARCHAR(190) DEFAULT NULL,
  role_uz     VARCHAR(190) DEFAULT NULL,
  bio_ru      TEXT         DEFAULT NULL,
  bio_uz      TEXT         DEFAULT NULL,
  photo       VARCHAR(255) DEFAULT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  is_published TINYINT(1)  NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_teachers_pub_sort (is_published, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- News / stories  (/news_stories/:id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS news (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug         VARCHAR(160) DEFAULT NULL,
  title_ru     VARCHAR(255) NOT NULL,
  title_uz     VARCHAR(255) NOT NULL,
  excerpt_ru   TEXT         DEFAULT NULL,
  excerpt_uz   TEXT         DEFAULT NULL,
  body_ru      MEDIUMTEXT   DEFAULT NULL,
  body_uz      MEDIUMTEXT   DEFAULT NULL,
  cover_image  VARCHAR(255) DEFAULT NULL,
  is_published TINYINT(1)   NOT NULL DEFAULT 1,
  published_at DATETIME     DEFAULT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_news_pub (is_published, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Vacancies  (/vacancy)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vacancies (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title_ru      VARCHAR(255) NOT NULL,
  title_uz      VARCHAR(255) NOT NULL,
  description_ru MEDIUMTEXT  DEFAULT NULL,
  description_uz MEDIUMTEXT  DEFAULT NULL,
  location      VARCHAR(190) DEFAULT NULL,
  employment    VARCHAR(120) DEFAULT NULL,     -- full-time / part-time ...
  image         VARCHAR(255) DEFAULT NULL,
  sort_order    INT          NOT NULL DEFAULT 0,
  is_published  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_vac_pub_sort (is_published, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Course schedule  (replaces Firebase RTDB node "schedule")
-- Mirrors the fields the old editor used: branch, course, days, time, start,
-- duration, discount, RU/UZ descriptions.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedule_items (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  branch          VARCHAR(64)  NOT NULL,        -- online | sergeli | yunusabad
  course          VARCHAR(190) NOT NULL,
  days            VARCHAR(190) DEFAULT NULL,    -- e.g. "Mon,Wed,Fri"
  time_from       VARCHAR(16)  DEFAULT NULL,
  time_to         VARCHAR(16)  DEFAULT NULL,
  start_date      DATE         DEFAULT NULL,
  duration_months INT          DEFAULT NULL,
  discount        VARCHAR(64)  DEFAULT NULL,
  description_ru  TEXT         DEFAULT NULL,
  description_uz  TEXT         DEFAULT NULL,
  sort_order      INT          NOT NULL DEFAULT 0,
  is_published    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sched_branch (branch),
  KEY idx_sched_pub_sort (is_published, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- B2B schedule  (/b2b/schedule)
-- Published rows represent the current corporate training schedule.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS b2b_schedule_items (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_ru       VARCHAR(255) NOT NULL,
  course_uz       VARCHAR(255) NOT NULL,
  audience_ru     VARCHAR(255) DEFAULT NULL,
  audience_uz     VARCHAR(255) DEFAULT NULL,
  format_ru       VARCHAR(190) DEFAULT NULL,
  format_uz       VARCHAR(190) DEFAULT NULL,
  location_ru     VARCHAR(255) DEFAULT NULL,
  location_uz     VARCHAR(255) DEFAULT NULL,
  days_ru         VARCHAR(190) DEFAULT NULL,
  days_uz         VARCHAR(190) DEFAULT NULL,
  time_from       VARCHAR(16)  DEFAULT NULL,
  time_to         VARCHAR(16)  DEFAULT NULL,
  start_date      DATE         DEFAULT NULL,
  end_date        DATE         DEFAULT NULL,
  duration_ru     VARCHAR(120) DEFAULT NULL,
  duration_uz     VARCHAR(120) DEFAULT NULL,
  trainer_ru      VARCHAR(190) DEFAULT NULL,
  trainer_uz      VARCHAR(190) DEFAULT NULL,
  seats           INT          DEFAULT NULL,
  price_ru        VARCHAR(120) DEFAULT NULL,
  price_uz        VARCHAR(120) DEFAULT NULL,
  description_ru  TEXT         DEFAULT NULL,
  description_uz  TEXT         DEFAULT NULL,
  sort_order      INT          NOT NULL DEFAULT 0,
  is_published    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_b2b_sched_pub_start (is_published, start_date, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Media library (uploaded images managed from admin)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  filename    VARCHAR(255) NOT NULL,            -- stored name on disk
  original    VARCHAR(255) DEFAULT NULL,
  mime        VARCHAR(100) DEFAULT NULL,
  size_bytes  INT UNSIGNED DEFAULT NULL,
  width       INT UNSIGNED DEFAULT NULL,
  height      INT UNSIGNED DEFAULT NULL,
  uploaded_by INT UNSIGNED DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_media_filename (filename),
  KEY idx_media_uploader (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Leads (public contact/consultation form submissions; admin-only read/delete)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(120) NOT NULL DEFAULT '',
  phone       VARCHAR(40)  NOT NULL,
  course      VARCHAR(190) NOT NULL DEFAULT '',   -- course / chosen start slot
  form        VARCHAR(60)  NOT NULL DEFAULT '',   -- which form: home/openday/course-start/...
  source      VARCHAR(190) NOT NULL DEFAULT '',   -- page path it came from
  ip          VARCHAR(45)  NOT NULL DEFAULT '',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_leads_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
