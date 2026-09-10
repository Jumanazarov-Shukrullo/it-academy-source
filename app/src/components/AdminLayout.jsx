import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { logout, setToken } from "../api.js";

// Minimal inline icon set (no icon dependency). 24-grid, stroke = currentColor.
const ICONS = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>,
  book: <><path d="M6 4h11a1 1 0 0 1 1 1v15H7a3 3 0 0 0-3 3V6a2 2 0 0 1 2-2z" /><path d="M18 17H7a3 3 0 0 0-3 3" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  news: <><path d="M4 5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v15H6a2 2 0 0 1-2-2z" /><path d="M17 8h2a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2" /><line x1="7" y1="8" x2="14" y2="8" /><line x1="7" y1="12" x2="14" y2="12" /><line x1="7" y1="16" x2="11" y2="16" /></>,
  briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></>,
  type: <><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>,
  play: <><rect x="2" y="4" width="20" height="16" rx="2" /><polygon points="10 9 15 12 10 15 10 9" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>,
  cap: <><path d="M22 10 12 5 2 10l10 5 10-5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  external: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></>,
  menu: <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>,
  close: <><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></>,
};
export function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

const NAV = [
  { items: [["/admin-panel/dashboard", "dashboard", "grid"]] },
  { group: "grpContent", items: [
    ["/admin-panel/content/courses", "courses", "book"],
    ["/admin-panel/content/teachers", "teachers", "users"],
    ["/admin-panel/content/news", "news", "news"],
    ["/admin-panel/content/vacancies", "vacancies", "briefcase"],
    ["/admin-panel/texts", "texts", "type"],
    ["/admin-panel/media", "media", "image"],
    ["/admin-panel/videos", "videos", "play"],
  ] },
  { group: "grpB2B", items: [
    ["/admin-panel/content/b2b_courses", "b2bCourses", "briefcase"],
    ["/admin-panel/b2b-schedule", "b2bSchedule", "calendar"],
  ] },
  { group: "grpOps", items: [
    ["/admin-panel/schedule", "schedule", "calendar"],
    ["/admin-panel/leads", "leads", "inbox"],
    ["/admin-panel/students", "students", "cap"],
  ] },
];

// Path -> page-title i18n key (shown in the topbar).
function titleKey(pathname) {
  if (pathname.includes("/content/")) {
    const type = pathname.split("/content/")[1];
    if (type === "b2b_courses") return "admin.b2bCourses";
    return `admin.${type}`;
  }
  if (pathname.includes("/student/")) return "admin.students";
  const last = pathname.split("/").filter(Boolean).pop();
  return { dashboard: "admin.dashboard", schedule: "admin.schedule", texts: "admin.texts",
    media: "admin.media", videos: "admin.videos", students: "admin.students", leads: "admin.leads",
    "b2b-schedule": "admin.b2bSchedule" }[last] || "admin.dashboard";
}

export default function AdminLayout() {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const pathname = useLocation().pathname;
  const [navOpen, setNavOpen] = useState(false);
  const setLang = (l) => { i18n.changeLanguage(l); localStorage.setItem("ia_lang", l); };
  const signOut = async () => { await logout(); setToken(""); nav("/admin-panel"); };
  const closeNav = () => setNavOpen(false);

  useEffect(() => { setNavOpen(false); }, [pathname]);
  useEffect(() => {
    if (!navOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => { if (event.key === "Escape") setNavOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [navOpen]);

  return (
    <div className="adm">
      <aside className={`adm-side${navOpen ? " is-open" : ""}`} id="admin-navigation">
        <div className="adm-side-head">
          <NavLink to="/admin-panel/dashboard" className="adm-brand" onClick={closeNav}>
            <img src="/logo_2.svg" alt="IT Academy" />
            <span className="adm-badge">ADMIN</span>
          </NavLink>
          <button type="button" className="adm-nav-close" onClick={closeNav} aria-label={t("admin.closeMenu")}>
            <Icon name="close" />
          </button>
        </div>
        <nav className="adm-nav">
          {NAV.map((sec, i) => (
            <div key={i}>
              {sec.group && <div className="adm-grp">{t(`admin.${sec.group}`)}</div>}
              {sec.items.map(([to, key, icon]) => (
                <NavLink key={to} to={to} end
                  onClick={closeNav}
                  className={({ isActive }) => "adm-link" + (isActive ? " on" : "")}>
                  <Icon name={icon} /><span>{t(`admin.${key}`)}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="adm-side-foot">
          <a className="adm-link" href="/" target="_blank" rel="noreferrer" onClick={closeNav}>
            <Icon name="logout" /><span>{t("admin.viewSite")} ↗</span>
          </a>
        </div>
      </aside>
      <button
        type="button"
        className={`adm-nav-backdrop${navOpen ? " is-open" : ""}`}
        onClick={closeNav}
        aria-label={t("admin.closeMenu")}
        tabIndex={navOpen ? 0 : -1}
      />

      <div className="adm-main">
        <header className="adm-top">
          <button
            type="button"
            className="adm-nav-toggle"
            aria-label={t("admin.openMenu")}
            aria-controls="admin-navigation"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <h1>{t(titleKey(pathname))}</h1>
          <div className="adm-top-right">
            <div className="adm-lang">
              {["ru", "uz"].map((l) => (
                <button key={l} className={i18n.language === l ? "on" : ""} onClick={() => setLang(l)}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <details className="adm-menu">
              <summary className="adm-avatar" title={t("nav.admin")}>A</summary>
              <ul>
                <li>
                  <a href="/" target="_blank" rel="noreferrer"
                    onClick={(e) => { e.currentTarget.closest("details").open = false; }}>
                    <Icon name="external" />{t("admin.viewSite")}
                  </a>
                </li>
                <li>
                  <button className="adm-menu-danger" onClick={signOut}>
                    <Icon name="logout" />{t("admin.signOut")}
                  </button>
                </li>
              </ul>
            </details>
          </div>
        </header>
        <div className="adm-body"><Outlet /></div>
      </div>
    </div>
  );
}
