# it-academy.uz — Reverse-Engineered Site Map

Canonical rebuild guide, reconstructed from the compiled React+Vite bundle at
`reference/live-site/assets/`. Companion file: `docs/i18n-extracted.json`
(`{ru, uz}`, same nested key structure the bundle uses).

## Conventions / shared facts

- **Stack:** React + React Router + Vite, react-i18next (RU default, UZ). State via
  zustand stores (language, step). Forms via react-hook-form + zod.
- **i18n access:** components call `t("key")` or `t("key", {returnObjects:true})`.
  Keys below refer to `i18n-extracted.json`. Pages marked *(hardcoded RU)* have copy
  baked into JSX, NOT in the dictionary — read the listed byte range / use the quoted copy.
- **Images:** all root-relative (served from `/public`); files live at
  `reference/live-site/*.{jpg,png,svg,webp}`. Some image paths are stored *inside*
  i18n data (e.g. `news`, `goodForIt`, `alumniWorks`), not in JSX.
- **App shell** (renders on every route, around `<Routes>`):
  - **Navbar** (`LL`): logo, nav links + courses dropdown (i18n `nav`), RU/UZ language
    switcher (`РУССКИЙ` / `O‘ZBEKCHA`), snow-effect toggle (localStorage `snowEnabled`),
    mobile burger menu (`DL`). Images: `/logo.svg`, `/logo_2.svg`, `/uzbekistan-flag.svg`.
  - **Footer** (`aP`): newsletter (i18n `footer.footerNews`), router links
    (`footer.footerRouter` — incl. **Oferta → `/Публичная оферта 2025.pdf`**, a PDF, not a route),
    help/contacts block (addresses, phones, Telegram `it_academy_manager`).
  - `#contact` hash → smooth-scrolls to the contact form section.
- **Lead/contact forms** post to a **Telegram bot** (`api.telegram.org/bot.../sendMessage`),
  client-side, with honeypot + 10s rate-limit (`$U`). Course pre-selection passed via
  `localStorage` (`selectedCourseName` / `selectedCourseDetail`). The OpenDay form posts
  to a *different* hardcoded bot token + group chat. **Move tokens server-side in the rebuild.**
- **Backend API** (`api-MQpMoIPj.js`, axios `baseURL:"/api"`, used only by Student/Admin pages):
  `GET /api/students.php` (`?search=`), `student.php?id=`, `payments.php?id=`,
  `schedule.php?id=`, `attendance.php?id=`. Data shape = Alfa-CRM
  (`Students[]`, `Agents`, `Disciplines`, `EdUnits`, `Payments`, `EdUnitStudentReports`).
- **Admin auth is fake/client-side:** hardcoded `admin`/`admin`, gated by a localStorage
  boolean; admin sub-pages redirect to `/admin-panel` if not set.

### Route → component / chunk table

| Route | Element var | Source | Type |
|---|---|---|---|
| `/` | `ane` | index (inline) | Home, composed of sections |
| `/about` | `KP`→`YP` | index (inline) | Standalone, hardcoded RU |
| `/courses` | `Tne` | `Courses-ksPxBrsj.js` (lazy) | Course landing + `<Outlet/>` |
| `/web_programming` | `Cne` | `WebProgramming-CoCHsrf_.js` (lazy) | Full course page |
| `/python` | `B9` | index (inline) | Course page |
| `/datascience` | `i9` | index (inline) | Course page |
| `/graphic` | `yH` | index (inline) | Course page |
| `/camp` | `AG` | index (inline) | Camp landing |
| `/dodo` | `HY` | index (inline) | Promo page, hardcoded RU |
| `/openday` | `wne` | index (inline) | Lead-gen page + Telegram form |
| `/vacancy` | `UG` | index (inline) | Jobs page, hardcoded RU |
| `/contacts` | `WP` | index (inline) | **Empty `<div>` — NOT implemented** |
| `/oferta` | `XP` | index (inline) | **Placeholder `<div>OfertaPage</div>` — NOT implemented** (real oferta = footer PDF) |
| `/news_stories/:id` | `Ene` | `NewsStories-C3usWEsL.js` (lazy) | Article (only id=2 exists) |
| `/student/:id` | `One` | `StudentPublic-VTfRU2Ha.js` (lazy) | Public student cabinet |
| `/admin-panel` | `kne` | `AdminSchedule-BAvHrAmx.js` (lazy) | Admin login + schedule editor |
| `/admin-panel/students` | `Nne` | `AdminStudents-Ddl5YWtj.js` (lazy) | Students table |
| `/admin-panel/student/:id` | `Ane` | `AdminStudentProfile-BozQmaHg.js` (lazy) | Student detail |
| `*` | `Rne` | `NotFound-BRspfL1x.js` (lazy) | 404 |

---

## `/` — Home (`ane`)

Composition (in render order): `eK · Xte · QW · Zh · sne · OK · xX · uX · Nl`

- **Hero** (`eK`) — i18n `header` (`title` with `<br/>`, `link`). Images: `/logo_2.svg`,
  `/arrow_down.svg`, `/uzbekistan-flag.svg`. CTA → `#contact`.
- **Schedule ticker / upcoming groups** (`Xte`) — i18n `schedule` (`title`, `ScheduleData`),
  `adminSchedule.branches.{sergeli,yunusabad,online}`, `adminSchedule.editor.empty`,
  `contact.link`, `studentFeedback.videos`. (Merges the admin-edited schedule list.)
- **Course selection swiper** (`QW`) — i18n `courseSelection` (`btn`, swiper items),
  `location`, `news`. Image: `/left-arrow.png`. Links: `/courses`.
- **Why us** (`Zh`) — i18n `whyWe`, `aboutUs` (array of `{title,text}` cards). Image: `/logo-black.svg`.
- **Student feedback** (`sne`) — i18n `studentFeedback` (`title`, `text`, `videos`). Video carousel.
- **Counseling / "Коротко о нас" illustration** (`OK`, sub-comps `TK`+`kK`) — i18n `counseling`
  (`counselingData`, `btns`). Decorative animated images: `/logo.svg`, `/woman.png`,
  `/balloon_hand.png`, `/arrows.svg`, `/child.png`, `/brain.png`, `/child_2.png`,
  `/child_3.png`, `/laptop.png`, `/hand_2.png`.
- **News** (`xX`) — i18n `news` (`title`, `newsData[]`, `link`). Images (from i18n data):
  `/news_1.jpg`, `/news_2.webp`, `/filial_sergeli.jpeg`. Link → `/news`.
- **Location / map** (`uX`) — i18n `location` (`title`, `text`, `maps`, `link`). Links to `/news_stories/:id`.
- **Contact form** (`Nl`, `id="contact"`) — i18n `contact` (`title`, `text`, `userName`,
  `course`, `successTitle`, `successText`) + `sendMessage` (toasts). Lead form (name, phone,
  course-tag from localStorage) → Telegram. Reused at the bottom of all course pages.

---

## `/about` — About (`KP` → `YP`) — *(hardcoded RU)*

Single `<section>`, byte range `427696–432624` in `index-Cueo3Iyj.js`.
Sections in order:

- **Hero** — `IT Academy в Ташкенте`, intro (Frontend/Backend/Python/Unity/Data Science/graphic),
  `Более 13 000 выпускников`, CTA `🚀 Записаться на бесплатный урок` → `/#contact`.
- **Goals grid** ("Наша цель — твоя карьера", 4 cards): Обучение `/aziz_teacher.png`,
  Тесты и практика `/brain.png`, Стажировка `/woman.png`, Трудоустройство `/About3.png`.
- **Demand** ("Почему IT — это перспективно?") — dark/light cards (`💰 Высокооплачиваемо`, …).
- **Why us** (`whyGrid`, cards Практика / Преподаватели / Комьюнити) — images
  `/camp-for-1.jpg`, `/good_for_it_3.jpg`.
- **Campuses** (`campusGrid`, 2 cards) — `/yunusabad.jpg`, `/sergeli.jpg`.
- **Final CTA** — CTA button → `/#contact`.

> Note: also references `/About1.png`, `/About2.png` in the asset set (likely background/hero art).

---

## Course pages — shared section library

Course pages are Fragments composing intro/program/shared blocks. Shared blocks reused across them:

- `Yv` **GoodForIt** — i18n `goodForIt`; images `/good_for_it_1.jpg`, `_2.jpg`, `_3.jpg`.
- `M_` **AlumniWorks** — i18n `alumniWorks`; images `/byd.png`, `/bmw.png`, `/nft.png`,
  `/nft2.png`, `/hotel.png`, `/hotel2.png`, `/user.png`.
- `BN` **VideoBlock** (YouTube embeds, `aboutUsBlock` cards) — i18n via parent.
- `Zh` **WhyWe** — i18n `whyWe`, `aboutUs` (same as Home).
- `G_` **NearbyGroups form** — i18n `nearbyGroups`, `validForm`; lead form (name+phone, min 9).
- `Y_` **CostOfTraining** — i18n `costOfTraining`; images `/round_star.svg`, `/stars.svg`; CTA `#contact`.
- `Nl` **Contact form** — see Home.
- All course pages also render a static `<img src="/students.jpg">` near the bottom.

### `/courses` (`Tne`, chunk)
Order: CoursesHome header → `coursesGraphicDesign` block (`l4`) → `coursesPython` block (`d9`)
→ CoursesNodeJS section → `<Outlet/>`.
- i18n: `webHome` (`top`/`bottom`), `coursesNodsJS`, `coursesGraphicDesign`, `coursesPython`.
- Internal links: `/web_programming`, `/nodejs`. No own images.

### `/web_programming` (`Cne`, chunk) — most complete course page
Order: WebHome header → MoreCourse → GoodForIt (`Yv`) → CourseProgram (tabbed accordion,
framer-motion, zustand `useStep`) → AlumniWorks (`M_`) → NearbyGroups form (`G_`) →
`<img /students.jpg>` → CostOfTraining (`Y_`) → Contact (`Nl`).
- i18n: `webHome`, `moreСourse`, `goodForIt`, `courseProgram`, `alumniWorks`,
  `nearbyGroups`, `validForm`, `costOfTraining`, `contact`. Image: `/students.jpg` + shared.
- Hero anchor → `#contact`.

### `/python` (`B9`, inline)
Children: `d9 · T9 · Yv · $9 · M_ · BN · Zh · G_ · <img/students.jpg> · Y_ · Nl`.
- i18n: `coursesPython` (`d9`), `moreСoursePhyton` (`T9`), `courseProgramPhyton` (`$9`),
  `goodForIt`, `alumniWorks`, `whyWe`/`aboutUs`, `nearbyGroups`/`validForm`, `costOfTraining`, `contact`.
- Images: `/students.jpg` (intro + program), `/courses_python*.{jpg,png,JPG}`, `/more_course_python.png`, shared.

### `/datascience` (`i9`, inline)
Children: `CH · qH · Yv · n9 · M_ · BN · Zh · G_ · <img/students.jpg> · Y_ · Nl`.
- i18n: `coursesDataScience` (`CH`), `moreСourseDatascience` (`qH`), `moreСourseDataScience` (`n9`),
  plus shared (`goodForIt`, `alumniWorks`, `nearbyGroups`, `costOfTraining`, `contact`).
- Images: `/courses_data_science.png`, `/more_course_data_science.png`, `/students.jpg`, shared.

### `/graphic` (`yH`, inline)
Children: `l4 · gH · Yv · c$ · M_ · G_ · <img/students.jpg> · Y_ · Nl`.
- i18n: `coursesGraphicDesign` (`l4`), `moreСourseGraphic` (`gH`), `courseProgramGraphic` (`c$`),
  plus shared.
- Images: `/courses_graphic_design.jpg`, `/more_course_graphic.png`, `/students.jpg`, shared.

> Other courses exist only as i18n data (no dedicated route): `coursesScratch`, `coursesUnity`,
> `coursesNodsJS`, `coursesComputerLiteracy` — surface via `/courses` and the courses dropdown.
> Related assets: `/courses_scratch.jpg`, `/courses_unity.jpg`, `/courses_nodejs.jpg`, `/courses_computer_literacy.png`.

---

## `/camp` — Camp landing (`AG`)

Children: `J9 · aG · uG · Zh · pG · NG · Nl`.

- **CampHome hero** (`J9`) — i18n `campHome` (`top`/`bottom`). CTA → `#contact`.
- **CampMoreCourse** (`aG`) — i18n `campMoreСourse`.
- **CampFor** (`uG`) — i18n `campFor`; images `/camp-for-1.jpg`, `/camp-for-2.jpg`.
- **WhyWe** (`Zh`) — i18n `whyWe`/`aboutUs`.
- **CampVideos** (`pG`) — i18n `campVideos`.
- **CostOfTraining** (`NG`) — i18n `costOfTraining`.
- **Contact** (`Nl`).
- Background art assets available: `/camp-bg.jpg`, `/camp-bg-img.svg`, `/camp-home-page-icons.svg`,
  `/grass.svg`, `/spider_web.svg`.

---

## `/dodo` — Dodo Pizza promo (`HY`) — *(hardcoded RU)*

`<main>`, byte range `834441–839617`. Sections in order:

- **Decorative backdrop** — CSS rings + inline `<svg>` bezier curves + sparkle (no images).
- **Hero** (`UY`) — co-brand row `Dodo Pizza × IT-Academy` (`/dodo-logo.jpg`, `/academy-logo.png`);
  H1 `КОМБО TALABA`; `Выиграй доступ к IT-обучению`;
  `Закажи акционное комбо в Dodo Pizza и получи шанс обучаться в IT-Academy бесплатно`;
  button `Принять участие` (scrolls down 400px).
- **How to participate** (`#how`) — eyebrow `КАК УЧАСТВОВАТЬ`, 3 numbered steps
  (Закажи Combo Talaba / Укажи номер телефона / Следи за результатами → Instagram `@dodopizzauzb`).
- **Conditions / docs** (`#docs`) — 2 PDF links: `Открыть правила (RU)` →
  `/ПРАВИЛА_ПРОВЕДЕНИЯ_АКЦИИ_DODO_IT_PROMO_1.pdf`; `Ochilish qoidalari (UZ)` →
  `/DODO%20IT%20PROMO%20AKSIYASI%20QOIDALARI.pdf`.
- **Contacts** (`#contacts`) — Телефон `tel:1168`, Instagram `@dodopizzauzb`
  (`https://instagram.com/dodopizzauzb/`), Сайт `https://dodopizza.uz/tashkent`,
  Приложение `https://dodopizza.onelink.me/YlkM/o5h9m8mo`.
- Related asset: `/promo-dodo.jpg`.

---

## `/openday` — OpenDay lead-gen (`wne`) — *(hardcoded RU, no images, emoji-only)*

`function wne()`, byte range `1090041–~1094000`. CSS objects `Bi` (page/form), `Go` (gift popup).

- **Floating gift popup** (`Sne`) — appears after ~2s at random position; opens overlay:
  `Open Day 🎉`, `…получи шанс выиграть бесплатный курс`, list Frontend/Backend/Unity,
  button `🚀 Участвовать`.
- **Hero** — H1 `Запишись на OpenDay`, subtitle about open-doors day + prizes.
- **Registration form** — fields: `name` (placeholder `Ваше имя`), `phone`
  (`Телефон (+998 XX XXX XX XX)`, live-formatted, required), `agree` checkbox
  (`Согласен на обработку персональных данных`), submit `🚀 Отправить заявку`.
  Errors: `Укажите телефон и согласие.` / `Ошибка отправки. Попробуйте позже.`
  Success: `✅ Заявка успешно отправлена!`
- **Note** — `Места ограничены. Номерок для участия в лотерее…`
- **Submit** → POSTs a formatted message (name, phone, txn id, block/form id, source URL, UTM params)
  to a hardcoded Telegram bot/group. **Relocate token to backend in rebuild.**

---

## `/vacancy` — Jobs (`UG` = `LG` + `VG` + `Nl`) — *(hardcoded RU)*

Byte ranges: hero `LG` `826781–827600`, cards `VG` `827600–834441`.

- **Hero** (`LG`) — H1 `ВАКАНСИИ`, subtitle
  `Стань частью команды, которая строит будущее в IT-образовании`; buttons
  `Смотреть вакансии` / `Откликнуться` → `#vacancyTeam`. Hero art `/vacancy-hero.png` (CSS bg).
- **Team / vacancy cards** (`VG`, `#vacancyTeam`) — heading `СТАНЬ ЧАСТЬЮ / НАШЕЙ КОМАНДЫ`,
  6 cards (title + location + `Подробнее` → Google Form, `target=_blank`):
  1. Администратор — ул.Шахрисабз 7 — `/vacancy-admin.png`
  2. Менеджер по продажам — ул.Шахрисабз 7 — `/vacancy-card-1.jpg`
  3. Преподаватель Ai — ул.Шахрисабз 7 — `/vacancy-card-2.jpg`
  4. Преподаватель по графическому дизайну — ул.Шахрисабз 7 — `/vacancy-card-3.jpg`
  5. Преподаватель английского языка — Сергели, Массив 6А — `/vacancy-card-4.jpg`
  6. Преподаватель Back-end — ул.Шахрисабз 7 и Сергели — `/vacancy-card-5.jpg`
- **Contact** (`Nl`).

---

## `/contacts` (`WP`) — **NOT implemented**

Renders an empty `<div>`. Contact info lives in the footer + the `#contact` form. Rebuild from scratch
(use footer addresses/phones: ул.Шахрисабз 7 / Сергели-6 110b, +998 90 610 05 12, Telegram it_academy_manager).

## `/oferta` (`XP`) — **NOT implemented**

Renders `<div>OfertaPage</div>` placeholder. The real public offer is the PDF
`/Публичная оферта 2025.pdf`, linked from the footer router.

---

## `/news_stories/:id` (`Ene`, `NewsStories-C3usWEsL.js`)

Reads `:id`, looks up i18n `newsStories` array by id. **Only `id===2` has content**; any other id
renders `NotFound`. Sections: title_1 + text_1/2 (`img_1`=`/news_stories_1.jpg`), title_2 (text_3–5),
title_3 (bg `/news_stories_2.jpg`, text_6–8), text_9–11, box text_12–14 (`img_3`=`/news_stories_3.jpg`).
- i18n: `newsStories` (per-item `title_1..3`, `text_1..14`, `img_1`, `img_3`).

## `*` — 404 (`Rne`, `NotFound-BRspfL1x.js`)

`<h1>404</h1>` + `notFound.text` + `<Link to="/">` `notFound.link`. i18n `notFound`.

---

## `/student/:id` (`One`, `StudentPublic-VTfRU2Ha.js`) — *(hardcoded RU, API-backed)*

Public student cabinet. Reads `:id` + `?token`. On mount fetches `student.php`, `attendance.php`,
`payments.php`, `schedule.php` (fallback `students.php`). No auth gate. Sections:
- Header: eyebrow `Личный кабинет`, `<h1>` fullName, subtitle. Loading `Загружаем данные...` / error.
- **Profile card**: ID, Группа, Статус.
- **Payments card**: `Оплачено всего` total (`сум`) + rows (date, amount, status) / `Нет платежей`.
- **Upcoming lessons**: `Ближайшие занятия` (up to 4: date, name, time, room) / `Нет ближайших занятий`.

## `/admin-panel` (`kne`, `AdminSchedule-BAvHrAmx.js`) — *(API/i18n mixed)*

Admin login (`admin`/`admin`, localStorage flag) + schedule editor (persisted via index store, not /api).
- **Logged-out:** login form — i18n `adminSchedule.title`, `adminSchedule.login.*`.
- **Logged-in:** editor — header (`Добавить набор`, `Обновить`, logout), empty state, cards;
  add/edit modal with fields course, branch (sergeli/yunusabad/online), days, timeFrom/timeTo,
  startDate, discount, durationMonths, descriptionRu, descriptionUz.
- i18n: `adminSchedule.{editor.*, form.*, actions.*, branches.*, saveError, login.*}`
  (plus hardcoded RU strings: `Добавить набор`, `Сохраняем...`, `Отмена`).

## `/admin-panel/students` (`Nne`, `AdminStudents-Ddl5YWtj.js`) — *(hardcoded RU, API)*

Auth-gated. Fetches `students.php`. Header `Студенты` + search (`Имя или фамилия`) + status select
(Активные/Все/Закончили). Summary cards (Всего, Активные, Закончили, Группы). Table columns:
**ID, ФИО, Телефон, Группа, Статус**; row → `/admin-panel/student/:id`; empty `Ничего не найдено`.

## `/admin-panel/student/:id` (`Ane`, `AdminStudentProfile-BozQmaHg.js`) — *(hardcoded RU, API)*

Auth-gated. Fetches `student.php`, `payments.php`, `schedule.php` (fallback `students.php`).
- Back button `← НАЗАД`; header eyebrow `Профиль студента`, fullName, badges (group, status).
- **Left — profile `<dl>`:** ID, Телефон, Группа, Дата рождения, Дата регистрации, Статус.
- **Main — "Занятия и платежи":** tabs Актуальные / Завершённые; per-group accordion
  (discipline · teacher · classroom · `Ближайшее: date` · n занятий); legend
  (прошло/ближайшее/запланировано/отсутствовал/есть долг); calendar-chip grid; `Платежи` toggle
  (Оплачено total, Задолженность, rows: date/amount/status/method/author/comment) / `Нет платежей`.

---

## Asset inventory quick-reference (by page)

- **Global:** logo.svg, logo_2.svg, logo-black.svg, academy-logo.png, uzbekistan-flag.svg,
  social SVGs (telegram, instagram, facebook, youtube), arrow_*.svg.
- **Home hero/counseling:** woman.png, balloon_hand.png, brain.png, child*.png, laptop.png,
  hand_2.png, arrows.svg, left-arrow.png, robot_hand.jpg, header_bg.jpg.
- **About:** aziz_teacher.png, brain.png, woman.png, About1/2/3.png, camp-for-1.jpg,
  good_for_it_3.jpg, yunusabad.jpg, sergeli.jpg.
- **Courses/teachers:** courses_*.{jpg,png,JPG}, more_course_*.png, students.jpg,
  aziz-teacher-back.jpg, laziz-teacher.jpg, abdokadir_teacher.png, aziz_teacher.png.
- **GoodForIt/Alumni:** good_for_it_1/2/3.jpg, byd.png, bmw.png, nft.png, nft2.png, hotel.png, hotel2.png, user.png.
- **News:** news_1.jpg, news_2.webp, news_stories_1/2/3.jpg, filial_sergeli.jpeg.
- **Camp:** camp-bg.jpg, camp-bg-img.svg, camp-home-page-icons.svg, camp-for-1/2.jpg, grass.svg, spider_web.svg.
- **Vacancy:** vacancy-hero.png, vacancy-admin.png, vacancy-card-1..5.jpg.
- **Dodo:** dodo-logo.jpg, promo-dodo.jpg, + 2 promo-rules PDFs.
- **Misc/decor:** round_star.svg, stars.svg, why_we.svg, green_check.svg, balloon/child art.
- **PDFs:** `Публичная оферта 2025.pdf` (oferta), 2 DODO promo-rules PDFs.
- **Fonts (`assets/`):** Inter, Roboto, RobotoFlex (variable TTF), Soyuz Grotesk Bold (woff).
