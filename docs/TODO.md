# What's left — it-academy.uz rebuild

_Snapshot: 2026-06-17. **Beta is LIVE: https://beta.it-academy.uz** (deployed, DB seeded, browser+API verified, 0 broken images, 0 JS errors). Done so far: full content layer + all marketing pages (faithful UI), admin CMS, content-override editor, the fidelity pass (avg ~67% → high), the 5-step counseling wizard, and the beta deploy. Everything below is what remains._

### ✅ Shipped 2026-06-17 (this session — code, no host changes; adversarially reviewed + runtime-verified)
- **Security**: brute-force throttle on `cms/auth/login.php` (5 fails / 15 min per IP, `flock`-atomic — verified 5×401→429 even under 12 concurrent requests); security headers in `cms/_bootstrap.php` (nosniff, X-Frame-Options, Referrer-Policy, HSTS-on-TLS) + the same set + `X-Robots-Tag: noindex` in the beta `deploy/htaccess` (noindex kept out of `index.html` so the build stays prod-safe).
- **Admin UX**: axios 401-response interceptor in `app/src/api.js` — an expired token drops + bounces to `/admin-panel` (skips `/auth/` so public users + sign-out aren't affected).
- **Pixel fidelity (no new deps — CSS, not swiper/framer-motion)**: counseling illustrations now float (`cw-float`); CourseProgram module panel fades in on tab change; student-feedback `.video-row` is now a horizontal scroll-snap carousel (matches the existing `.course-row`). All motion guarded by `prefers-reduced-motion`.
- `vite build` clean (154 modules). First git commit made.

---

## 0. Quick blockers (need YOU)

- [x] ~~Rotate the Telegram bot token~~ **DROPPED — Telegram is no longer used** (you said you don't need the bot). Lead forms + the counseling wizard now store submissions in the `leads` DB table, viewable in the admin panel under **Заявки / Arizalar** (`/admin-panel/leads`). No 503, no token, no host config. _Optional hygiene:_ delete the old leaked bot via @BotFather so no one can abuse the leaked token — but it's no longer a site dependency.
  - **Beta deploy step:** the `leads` table must exist on the beta DB. Apply `server/sql/leads.sql` via phpMyAdmin (one import), then re-deploy code with `bash server/deploy/deploy.sh`.
- [ ] **Change the beta admin password** from the shared `4OpBruTLi3IQA1!` (it was sent in chat). And optionally **regenerate the beta DB password** (visible in a screenshot; it's `localhost`-only so low risk).
- [ ] **Decide the student-portal auth model** (Phase 4): (a) admin-only [current default], (b) per-student PIN/token, (c) phone-verify vs HolliHop.

---

## 1. Pixel-fidelity gaps vs live it-academy.uz (it is faithful, NOT 100% identical)

The rebuild reproduces the design system, copy, images, sections and order — but these visual/interaction details still differ from the live site. Most are deliberate simplifications; confirm which actually matter.

### Interactions / animations (the biggest visible differences)
- [x] **Carousels** — DONE without the `swiper` dep (consistent with the no-dep direction): new `components/Carousel.jsx` wraps the homepage course row + the feedback video rows (home + python/datascience) with prev/next arrows + pointer-drag over the existing scroll-snap track. Browser-verified desktop (arrows) + mobile (native swipe, arrows hidden). Still no autoplay/momentum/dot-pagination — add real `swiper` only if those exact behaviors are wanted.
- [x] **Student-feedback carousel** — DONE: now has arrow buttons via `Carousel`. Custom YouTube poster thumbnails still deferred (minor).
- [x] **CourseProgram tab animation** — DONE via CSS (panel fades/slides in on tab change, `key={active}` remount + `cb-fade`). Used CSS over `framer-motion` (no dep); not a true accordion but the active panel now animates.
- [x] **Counseling decor** — DONE: subtle CSS `cw-float` keyframe on `.cw-decor-img` (reduced-motion guarded).
- [ ] **Snow-effect toggle** (`СНЕГ: ВКЛ/ВЫКЛ` in the header, localStorage `snowEnabled`) — not implemented (seasonal gimmick). → add only if wanted.
- [ ] **Floating gift popup (OpenDay)** — live appears at a random position after ~2s; ours pins it bottom-right. Minor.

### Layout / styling deltas
- [x] **Why-us cards** — DONE: inline-SVG icon per card (`components/whyIcons.jsx`, mapped by index), used on the homepage + course-page `WhyChoose`. No icon dep / no extra asset files. Browser-verified.
- [ ] **Home "Ближайшие группы"** — live shows more course rows with a richer weekday-picker chip layout; ours shows the 3 seeded DB rows. → seed more schedule rows + (optional) a weekday-picker style on `.group-card`.
- [ ] **Course hero** — live foregrounds the course photo prominently; ours shows the wordmark + the stat strip. Different emphasis.
- [ ] **Home hero** — close now (photo behind the card), but live's green-banner framing + exact proportions differ slightly.
- [ ] **Fine deltas** — exact section paddings, font weights/line-heights, card shadows, border-radii vs live. A computed-style diff pass per page would close these.
- [~] **Responsive/mobile parity** — PARTIAL: added the missing **mobile nav** (the `.nav` was `display:none` on ≤820px with no way to navigate). New hamburger in `Layout.jsx` toggles a full-width dropdown; also tightened section/hero padding and hide carousel arrows on touch. Browser-verified at 390px. Per-page fine breakpoint tuning vs live still open.

### How to get to true pixel-parity (if desired)
Run a dedicated per-page polish pass: serve the live mirror + our app side-by-side, diff computed styles element-by-element, reintroduce `swiper` + `framer-motion`, add the card icons, and tune spacing tokens. Scope it page-by-page (home + the 4 course pages are the high-value ones).

---

## 2. Functional / feature gaps

- [ ] **Course-detail pages → `courses` table binding** (optional). `/python` etc. read i18n keys (editable via the Texts editor); the `courses` table only drives the `/courses` listing. Deliberately one-source-per-string — wire to the DB row only if you'd rather edit course-page copy as structured fields.
- [~] **Admin polish** — DONE: 401-redirect interceptor (expired token → `/admin-panel`). Still TODO: media-picker modal for image fields (vs pasting a filename), per-type loading spinners.
- [ ] **Verify media upload end-to-end on beta** — BLOCKED locally (no `server/deploy/.env.deploy` FTPS creds present). USER check after logging into beta admin: upload an image on `/admin-panel/media`, then `curl -I https://beta.it-academy.uz/uploads/<returned-filename>` → expect `200` + `Content-Type: image/*`. If 403/404, the `/uploads` dir isn't writable/served.
- [ ] **Seed initial `content_blocks` overrides** (optional) — the override editor works against an empty table (pages fall back to bundled copy); only seed if you want day-one overrides.

---

## 3. Deploy / ops

- [x] **Optimize `app/public`** — DONE: **44 MB → 19 MB (−25 MB)**, build clean, zero reference changes. The win turned out to be mostly *dead weight + oversized resolution*, not format: (1) deleted 5 confirmed-unused files (`courses_python-2.JPG` 6000×4000/5.5 MB, `courses_python.png`, `About1/2.png`, `camp-bg-img.svg`) = −19 MB — refs existed only in `docs/site-map.md`; (2) resized the rest in place at the **same filename + format** so nothing needed re-wiring (alumni card thumbs 1920px→800px, heroes→1600px). Kept PNG/JPG (no rename): `vacancy-admin.png` is referenced by the **beta DB seed** by name, so a `.jpg` rename would orphan the live row. _Remaining:_ `camp-home-page-icons.svg` (6.2 MB, the biggest file left) — magick can't rasterize its embedded base64 PNGs; needs browser-rasterization to WebP (separate task, only on `/camp`, lazy-loaded). The literal PNG→JPG rename of the opaque alumni renders would save ~1 MB more — say the word.
- [x] **`noindex` on beta** — DONE via `X-Robots-Tag: noindex, nofollow` in the beta `deploy/htaccess` (NOT a meta tag in `index.html`, so the build artifact stays production-safe). Plesk password-protect still optional.
- [x] **First git commit** — DONE this session.
- [ ] **Re-deploy is one command:** `bash server/deploy/deploy.sh` (FTPS scheme fixed; the docroot mirror `--delete` excludes `api`/`cms`/`uploads`, host `config.php` preserved). ✅ ready.

---

## 4. Security hardening backlog (pre-existing architecture — not regressions)

Decide before opening beta to untrusted admins. Detail in `security-findings`.

- [x] **Login rate-limit / lockout** on `cms/auth/login.php` — DONE (flock-atomic per-IP throttle, 5 fails / 15 min → 429, cleared on success; runtime-verified incl. concurrency).
- [x] **CSRF tokens** on CMS POST/PUT/DELETE — CONFIRMED N/A by design (verified in code this session): the token lives in `localStorage` and is sent as `Authorization: Bearer` (`app/src/api.js:21`); the server reads only `HTTP_AUTHORIZATION` (`cms/_bootstrap.php`), with zero `setcookie`/`$_COOKIE`. A header token is never auto-attached on cross-site requests, so classic CSRF can't occur. Becomes necessary only if the token ever moves to a cookie (next item) — pair them then.
- [ ] **Admin token in `localStorage`** → HttpOnly cookie (XSS-exfil risk by design) — DEFERRED: architectural change that would then *require* the CSRF item above. Pair them.
- [x] **Security headers** in `server/cms/_bootstrap.php` — DONE (nosniff, X-Frame-Options DENY, Referrer-Policy, HSTS-on-TLS) + the SPA-level set + noindex in `deploy/htaccess`. CSP deliberately not added on JSON endpoints (nosniff covers it); a SPA CSP can go in htaccess later.
- [ ] **Strip the legacy `admin`/`admin` client check** — lives only in the OLD prod bundle (`reference/live-site`), not our app; remove at production cutover.

---

## 5. Out of scope (firm)

- **Production cutover to `it-academy.uz`** — beta only; production untouched.
