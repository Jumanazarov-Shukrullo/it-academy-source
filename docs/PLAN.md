# it-academy.uz — Rebuild + CMS plan

## What the site actually is (reverse-engineered from the live build)

The live site is a **React + Vite SPA** deployed as static files in `httpdocs/`, with three
independent data sources:

| Area | Source today | Decision |
|---|---|---|
| Student portal (`/student/:id`, `/admin-panel/students`) — attendance, payments, balance, per-student schedule | **HolliHop CRM** `https://it-academy.t8s.ru` via 6 PHP proxy files in `/api/` | **Keep** the proxy; add auth |
| Course schedule table | **Firebase** RTDB `academy-db-cb020`, node `schedule`, editor at `/admin-panel` (login `admin`/`admin`, checked in-browser) | **Replace** with our own MySQL + admin |
| Everything else (landing pages, courses, teachers, news, vacancies, camp, about, prices, all copy) | **Hardcoded** in the JS bundle + static images | **Rebuild** as CMS-driven |

There is **no source repo**. We have a full local mirror of the compiled site in
`reference/live-site/` (every image, the compiled CSS, and the bundle whose embedded i18n
dictionary holds all RU/UZ copy) — enough to faithfully reproduce the UI.

Host: Plesk shared hosting, **PHP 8.2.31**, nginx, MySQL available (currently empty),
**no SSH** (FTP/FTPS port 21 only). Web root = `httpdocs`. SPA routing via `.htaccess`.

## Known problems to fix in the rebuild
- ✅ 🔴 `GET /api/students.php` returned **all students' PII with no auth** — FIXED: `server/api/` now requires admin auth.
- ✅ 🔴 Per-student endpoints had **no auth** (IDOR) — FIXED: same `require_auth()` gate.
- 🔴 **Telegram bot token leaked in the client bundle** (`7203935667:AAEYXsw…`); lead/contact forms POST directly to `api.telegram.org/bot<token>` from the browser. Anyone can extract it and control the bot / read all submitted leads. **Action: rotate the token via @BotFather (it's public in prod now), and route form submits through a server-side proxy (`/cms/lead.php`) that holds the token in `config.php`** — build alongside the contact/lead forms in the marketing pass.
- 🟠 Admin login is `admin`/`admin` validated client-side. Replace with real server auth (hashed password + session token). *(CMS side done; remove the old client check during cutover.)*
- 🟠 Site depends on a **Firebase project owned by the previous developer**. Remove that dependency. *(Schedule slice already replaces it.)*

## Target architecture (after rebuild)
```
httpdocs/
  index.html + /assets/*        ← new Vite build (React, react-router, react-i18next, axios)
  /api/                         ← student-portal proxy (kept, hardened with auth)
  /cms/                         ← NEW: PHP + MySQL CMS API (content + schedule CRUD + admin auth)
  <static images>               ← reused from reference/live-site
MySQL db (new)                  ← all editable content + schedule + admin users
```

## Stack decisions
- **Frontend**: React + Vite (matches original), react-router, react-i18next (RU/UZ), axios. Deployed as static build to `httpdocs`.
- **Backend**: PHP 8.2 + MySQL (PDO). No framework dependency — plain, auditable PHP matching the existing `/api` style. `password_hash`/`password_verify` for admin auth; opaque session tokens in a `admin_sessions` table.
- **Local dev**: Vite dev server for FE; PHP built-in server + local MySQL/MariaDB (or the host DB) for BE.
- **Deploy**: `npm run build` → upload `dist` + `/cms` via FTPS (lftp). Staging first, then cutover.

## Roadmap (vertical slices — deploy & verify each before moving on)
0. **Foundation** ✅ DONE (local, tested): workspace, MySQL schema, CMS API (auth + sessions,
   schedule CRUD, content blocks), admin-user CLI tool, **and the hardened `/api` proxy**
   (`server/api/` — every endpoint `require_auth()`; HolliHop key moved out of the bundle into
   `config.php`; CORS from the config allowlist incl. beta). 11/11 auth/CRUD/security checks pass
   against local MariaDB + PHP built-in server. Remaining: deploy to host (blocked on host MySQL db).
1. **Schedule slice** ✅ DONE (local, browser-verified): own MySQL schedule + admin CRUD UI +
   public schedule page reading from CMS, replacing Firebase. Verified FE→Vite-proxy→PHP→MySQL in
   Playwright (published rows show, unpublished hidden, branch filter, RU/UZ). Still needs the
   host deploy to be live on beta. Frontend foundation (`app/`: Vite+React+router+i18n+axios,
   layout, lang switch, stub routes for all marketing pages) is in place. Deploy tooling for
   **beta only** is ready: `server/deploy/` (htaccess, FTPS `deploy.sh`, no-SSH install README).
2. **Homepage**: reproduce `/` pixel-faithful from the reference; wire its editable blocks (courses, hero, teachers) to the CMS.
3. **Remaining marketing pages**: /about, /courses, /python, /datascience, /graphic, /web_programming, /camp, /dodo, /openday, /vacancy, /contacts, /news_stories/:id, /oferta.
4. **Student portal**: re-implement `/student/:id` + `/admin-panel/*` against the hardened `/api`.
   (FE pages exist and are wired: `AdminStudents`, `StudentPortal`. **Open decision**: `/api` is now
   fail-closed / admin-only, so public student self-service is disabled until a student-auth model
   is chosen — admin-only [current default], per-student PIN/token, or phone-verify against HolliHop.)
5. **Admin CMS UI**: full editing for all content types + media uploads; remove `admin`/`admin`.
6. **Cutover**: deploy to production `httpdocs`, retire Firebase.

## Content model (CMS scope = marketing + schedule)
Typed tables for repeating entities (courses, teachers, news, vacancies, schedule_items) +
a generic localized `content_blocks` key/value store for one-off page copy (hero, about,
contacts, footer, etc.). See `server/sql/schema.sql`.

## Open prerequisites (need from client/host)
1. Create a **MySQL database + user** in Plesk → return db name / user / password / host.
2. Pick the **admin login** (username/email); we set a strong password.
3. **Staging**: create `beta.it-academy.uz` subdomain (preferred) or allow deploy to `httpdocs/beta/`.
4. Confirm ownership/logins for **HolliHop CRM** (and that the API key stays valid).
