import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Snowfall from "./Snowfall.jsx";
import { getContentKey } from "../api.js";

function ScrollRestoration() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: "auto", block: "start" });
      });
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
}

function LangSwitch() {
  const { t, i18n } = useTranslation();
  const set = (l, e) => {
    i18n.changeLanguage(l);
    localStorage.setItem("ia_lang", l);
    e.currentTarget.closest("details").open = false;
  };
  return (
    <details className="lang">
      <summary>{t("nav.language")}</summary>
      <ul>
        {[["ru", "Русский"], ["uz", "O‘zbekcha"]].map(([l, label]) => (
          <li key={l}><button onClick={(e) => set(l, e)}>{label}</button></li>
        ))}
      </ul>
    </details>
  );
}

function B2BDropdown({ active, onNavigate }) {
  const { t } = useTranslation();
  const close = (e) => {
    e.currentTarget.closest("details").open = false;
    onNavigate();
  };

  return (
    <details className={`nav-dd${active ? " active" : ""}`}>
      <summary>{t("nav.b2b", "B2B")}</summary>
      <ul>
        <li><NavLink to="/b2b/courses" onClick={close}>{t("b2b.navCourses")}</NavLink></li>
        <li><NavLink to="/b2b/schedule" onClick={close}>{t("b2b.navSchedule")}</NavLink></li>
      </ul>
    </details>
  );
}

export default function Layout() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  // Snow is an admin-managed setting (content key "site.snow" = on|off).
  // ponytail: start off, flip on only once the setting loads — so a disabled
  // setting never flashes snow, and an unreachable CMS fails safe (no snow).
  const [snow, setSnow] = useState(true);
  useEffect(() => {
    getContentKey("site.snow").then((b) => setSnow((b?.ru ?? "on") !== "off")).catch(() => {});
  }, []);
  const help = t("footer.footerHelp", { returnObjects: true }) || {};
  const router = t("footer.footerRouter", { returnObjects: true }) || [];
  const close = () => setMenuOpen(false);
  const pathname = useLocation().pathname;
  // Admin panel keeps the original dark theme (internal tooling, no light-page parity).
  const isAdmin = pathname.startsWith("/admin-panel");
  return (
    <div className={`app${isAdmin ? " admin" : ""}`}>
      <ScrollRestoration />
      {snow && !isAdmin && <Snowfall />}
      <header className="site-header">
        <div className="wrap">
          <Link to="/" className="brand" onClick={close}><img src="/logo_2.svg" alt="IT Academy" /></Link>
          <button
            type="button"
            className={`nav-toggle${menuOpen ? " open" : ""}`}
            aria-label="Меню"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span /><span /><span />
          </button>
          <nav className={`nav${menuOpen ? " open" : ""}`}>
            <NavLink to="/about" onClick={close}>{t("nav.about")}</NavLink>
            <NavLink to="/courses" onClick={close}>{t("nav.courses")}</NavLink>
            <B2BDropdown active={pathname.startsWith("/b2b")} onNavigate={close} />
            <a href="/#contact" className="free" onClick={close}>{t("nav.freeLesson")}</a>
            <LangSwitch />
          </nav>
        </div>
      </header>

      <main className="site-main"><Outlet /></main>

      <footer className="site-footer">
        <div className="wrap footer-grid">
          <div className="footer-sub">
            <img className="wordmark" src="/logo_2.svg" alt="IT Academy" />
            <div className="footer-social">
              {[
                ["instagram", "https://instagram.com/it_academy.uz"],
                ["facebook", "https://facebook.com/itacademy.uz"],
                ["youtube", "https://youtube.com/@it-academy"],
                ["telegram", "https://t.me/it_academy_manager"],
              ].map(([n, href]) => (
                <a key={n} href={href} target="_blank" rel="noreferrer" aria-label={n}>
                  <img src={`/${n}.svg`} alt={n} />
                </a>
              ))}
            </div>
            <p>{t("footer.footerNews.text")}</p>
            <form className="footer-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder={t("footer.footerNews.email", "Ваша электронная почта")} aria-label={t("footer.footerNews.email", "E-mail")} />
              <button type="submit">{t("footer.footerNews.link", "Подтвердить")}</button>
            </form>
          </div>
          <nav className="footer-nav">
            {Array.isArray(router) && router.map((r) => (
              r.to?.endsWith(".pdf")
                ? <a key={r.id} href={r.to} target="_blank" rel="noreferrer">{r.text}</a>
                : <Link key={r.id} to={r.to}>{r.text}</Link>
            ))}
          </nav>
          <div className="footer-help">
            <h4>{help.title}</h4>
            {help.subtitle && <a className="footer-phone" href={`tel:${help.subtitle}`}>{help.subtitle}</a>}
            {Array.isArray(help.contentItems) && help.contentItems.map((c) => <p key={c.id}>{c.text}</p>)}
            {Array.isArray(help.contacts) && help.contacts.map((c) => (
              <a key={c.href} className="footer-num" href={`tel:${c.href}`}>{c.title}</a>
            ))}
            {help.telegram && (
              <a className="footer-tg" href={`https://t.me/${help.telegram.handle}`} target="_blank" rel="noreferrer">
                <img src="/telegram.svg" alt="" />@{help.telegram.handle}
              </a>
            )}
          </div>
        </div>
        <div className="wrap footer-bottom">© {new Date().getFullYear()} {t("footer.rights")}</div>
      </footer>
    </div>
  );
}
