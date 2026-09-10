import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "../components/AdminLayout.jsx";
import { getLeads, listResource, getContentKey, setContent } from "../api.js";

// Overview: a few stat tiles (linking to their pages) + the latest leads.
export default function AdminHome() {
  const { t } = useTranslation();
  const [s, setS] = useState({ leads: null, courses: null, teachers: null, news: null });
  const [recent, setRecent] = useState(null);
  const [snow, setSnow] = useState(null); // null = loading; site-wide snow toggle
  const [snowErr, setSnowErr] = useState("");

  useEffect(() => {
    getLeads()
      .then((items) => { const l = items || []; setRecent(l.slice(0, 6)); setS((p) => ({ ...p, leads: l.length })); })
      .catch(() => setRecent([]));
    listResource("courses", true).then((i) => setS((p) => ({ ...p, courses: i.filter((x) => Number(x.is_published)).length }))).catch(() => {});
    listResource("teachers", true).then((i) => setS((p) => ({ ...p, teachers: i.length }))).catch(() => {});
    listResource("news", true).then((i) => setS((p) => ({ ...p, news: i.length }))).catch(() => {});
    getContentKey("site.snow").then((b) => setSnow((b?.ru ?? "on") !== "off")).catch(() => setSnow(false));
  }, []);

  const toggleSnow = async () => {
    const next = !snow;
    setSnow(next); setSnowErr("");
    try {
      await setContent("site.snow", next ? "on" : "off", next ? "on" : "off");
      // Confirm it actually persisted — a silent write failure here was why the
      // toggle "didn't stick". Trust the server's value, not the optimistic one.
      const b = await getContentKey("site.snow");
      const saved = (b?.ru ?? "on") !== "off";
      setSnow(saved);
      if (saved !== next) setSnowErr(t("admin.saveFailed"));
    } catch {
      setSnow(!next); setSnowErr(t("admin.saveFailed"));
    }
  };

  const tiles = [
    { to: "/admin-panel/leads", icon: "inbox", val: s.leads, lbl: t("admin.leads") },
    { to: "/admin-panel/content/courses", icon: "book", val: s.courses, lbl: t("admin.courses") },
    { to: "/admin-panel/content/teachers", icon: "users", val: s.teachers, lbl: t("admin.teachers") },
    { to: "/admin-panel/content/news", icon: "news", val: s.news, lbl: t("admin.news") },
  ];

  return (
    <div>
      <div className="panel adm-snow" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <span>{t("nav.snow")}</span>
        <button
          className={`btn${snow ? "" : " ghost"}`}
          onClick={toggleSnow} disabled={snow === null} aria-pressed={!!snow}
        >
          {snow === null ? "…" : snow ? t("nav.on") : t("nav.off")}
        </button>
        {snowErr && <span className="err" style={{ margin: 0 }}>{snowErr}</span>}
      </div>

      <div className="adm-stats">
        {tiles.map((x) => (
          <Link key={x.to} to={x.to} className="adm-stat">
            <div className="adm-stat-top">
              <span className="adm-stat-val">{x.val == null ? "—" : x.val}</span>
              <span className="adm-stat-ico"><Icon name={x.icon} /></span>
            </div>
            <span className="adm-stat-lbl">{x.lbl}</span>
          </Link>
        ))}
      </div>

      <h2 className="adm-section-title">{t("admin.recentLeads")}</h2>
      {recent === null ? (
        <p className="muted">{t("portal.loading")}</p>
      ) : recent.length === 0 ? (
        <div className="adm-empty">{t("admin.leadsEmpty")}</div>
      ) : (
        <table className="adm-responsive-table">
          <thead>
            <tr>
              <th>{t("admin.leadDate")}</th><th>{t("admin.leadName")}</th>
              <th>{t("admin.leadPhone")}</th><th>{t("admin.leadCourse")}</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((l) => (
              <tr key={l.id}>
                <td className="muted" data-label={t("admin.leadDate")}>{l.created_at}</td>
                <td data-label={t("admin.leadName")}>{l.name}</td>
                <td data-label={t("admin.leadPhone")}><a href={`tel:${l.phone}`}>{l.phone}</a></td>
                <td data-label={t("admin.leadCourse")}>{l.course}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
