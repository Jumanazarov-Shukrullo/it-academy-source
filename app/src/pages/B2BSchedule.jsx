import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getB2BSchedule } from "../api.js";
import ContactForm from "../components/ContactForm.jsx";
import "./B2B.css";

function fmtDate(value) {
  return value ? value.split("-").reverse().join(".") : "";
}

function dateRange(item) {
  const from = fmtDate(item.start_date);
  const to = fmtDate(item.end_date);
  if (from && to) return `${from} - ${to}`;
  return from || to;
}

export default function B2BSchedule() {
  const { t, i18n } = useTranslation();
  const lng = i18n.language?.startsWith("uz") ? "uz" : "ru";
  const [items, setItems] = useState(null);

  useEffect(() => {
    let alive = true;
    const reload = () => getB2BSchedule().then((d) => alive && setItems(d)).catch(() => alive && setItems([]));
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") reload();
    };

    reload();
    window.addEventListener("focus", reload);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      alive = false;
      window.removeEventListener("focus", reload);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const local = (item, field) => item[`${field}_${lng}`] || item[`${field}_ru`];

  return (
    <div className="b2b-page">
      <section className="b2b-hero">
        <div className="wrap">
          <div className="b2b-hero-grid">
            <div className="b2b-hero-inner">
              <p className="b2b-kicker">{t("b2b.kicker")}</p>
              <h1>{t("b2b.scheduleTitle")}</h1>
              <p>{t("b2b.scheduleLead")}</p>
              <div className="b2b-hero-actions">
                <Link to="/b2b/courses" className="btn">{t("b2b.viewCourses")}</Link>
                <a href="#b2b-contact" className="btn ghost">{t("b2b.contactCta")}</a>
              </div>
            </div>
            <div className="b2b-hero-panel" aria-label={t("b2b.heroPanelLabel")}>
              <span>{t("b2b.heroPanelLabel")}</span>
              <ol>
                {["audit", "program", "delivery"].map((key) => (
                  <li key={key}>{t(`b2b.heroSteps.${key}`)}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="b2b-section">
        <div className="wrap">
          <div className="b2b-section-head">
            <h2>{t("b2b.currentSchedule")}</h2>
            <p>{t("b2b.currentScheduleText")}</p>
          </div>

          {items === null ? (
            <div className="b2b-timeline-list" aria-label={t("portal.loading")}>
              {[0, 1, 2].map((i) => <div className="b2b-skeleton-card b2b-skeleton-timeline" key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <p className="b2b-empty">{t("b2b.scheduleEmpty")}</p>
          ) : (
            <div className="b2b-timeline-list">
              {items.map((item) => {
                const title = local(item, "course");
                const audience = local(item, "audience");
                const format = local(item, "format");
                const location = local(item, "location");
                const days = local(item, "days");
                const duration = local(item, "duration");
                const trainer = local(item, "trainer");
                const price = local(item, "price");
                const description = local(item, "description");
                const dates = dateRange(item);
                const time = item.time_from ? `${item.time_from}${item.time_to ? ` - ${item.time_to}` : ""}` : "";
                const facts = [
                  [t("b2b.days"), days],
                  [t("b2b.location"), location],
                  [t("b2b.trainer"), trainer],
                  [t("b2b.seats"), item.seats],
                  [t("b2b.price"), price],
                ].filter(([, value]) => value !== null && value !== undefined && value !== "");

                return (
                  <article className="b2b-timeline-card" key={item.id}>
                    <div className="b2b-datebox">
                      <span>{t("b2b.dates")}</span>
                      <b>{dates || t("b2b.flexibleDates")}</b>
                      {time && <em>{time}</em>}
                    </div>
                    <div className="b2b-schedule-main">
                      <div className="b2b-schedule-top">
                        {format && <span className="b2b-pill">{format}</span>}
                        {duration && <span className="b2b-pill">{duration}</span>}
                        {audience && <span className="b2b-pill">{audience}</span>}
                      </div>
                      <h3>{title}</h3>
                      {description && <p>{description}</p>}
                    </div>
                    {facts.length > 0 && (
                      <div className="b2b-schedule-facts">
                        {facts.map(([label, value]) => (
                          <div className="b2b-fact" key={label}>
                            <span>{label}</span>
                            <b>{value}</b>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="b2b-contact-section" id="b2b-contact">
        <div className="wrap b2b-contact-grid">
          <div className="b2b-contact-copy">
            <p className="b2b-kicker">{t("b2b.contactKicker")}</p>
            <h2>{t("b2b.scheduleContactTitle")}</h2>
            <p>{t("b2b.scheduleContactText")}</p>
          </div>
          <ContactForm light title="" form="b2b-schedule" submitLabel={t("b2b.contactSubmit")} />
        </div>
      </section>
    </div>
  );
}
