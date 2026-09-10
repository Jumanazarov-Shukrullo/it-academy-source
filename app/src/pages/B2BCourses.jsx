import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getB2BCourses } from "../api.js";
import ContactForm from "../components/ContactForm.jsx";
import "./B2B.css";

function assetSrc(value) {
  if (!value) return "";
  if (/^https?:\/\//.test(value)) return value;
  const p = String(value).replace(/^\/+/, "");
  if (p.includes("..") || !/^[\w][\w./-]*$/.test(p)) return "";
  return "/" + p;
}

export default function B2BCourses() {
  const { t, i18n } = useTranslation();
  const lng = i18n.language?.startsWith("uz") ? "uz" : "ru";
  const [items, setItems] = useState(null);

  useEffect(() => {
    let alive = true;
    getB2BCourses().then((d) => alive && setItems(d)).catch(() => alive && setItems([]));
    return () => { alive = false; };
  }, []);

  return (
    <div className="b2b-page">
      <section className="b2b-hero">
        <div className="wrap">
          <div className="b2b-hero-grid">
            <div className="b2b-hero-inner">
              <p className="b2b-kicker">{t("b2b.kicker")}</p>
              <h1>{t("b2b.coursesTitle")}</h1>
              <p>{t("b2b.coursesLead")}</p>
              <div className="b2b-hero-actions">
                <Link to="/b2b/schedule" className="btn">{t("b2b.viewSchedule")}</Link>
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
            <h2>{t("b2b.allCourses")}</h2>
          </div>

          {items === null ? (
            <div className="b2b-course-grid b2b-skeleton-grid" aria-label={t("portal.loading")}>
              {[0, 1, 2, 3].map((i) => <div className="b2b-skeleton-card" key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <p className="b2b-empty">{t("b2b.coursesEmpty")}</p>
          ) : (
            <div className="b2b-course-grid">
              {items.map((course) => {
                const title = course[`title_${lng}`] || course.title_ru;
                const summary = course[`summary_${lng}`] || course.summary_ru;
                const description = course[`description_${lng}`] || course.description_ru;
                const duration = course[`duration_${lng}`] || course.duration_ru;
                const format = course[`format_${lng}`] || course.format_ru;
                const img = assetSrc(course.image);
                return (
                  <article className="b2b-course-card" key={course.id}>
                    {img && <img className="b2b-course-image" src={img} alt="" loading="lazy" />}
                    <div className="b2b-course-body">
                      <div className="b2b-meta">
                        {duration && <span className="b2b-pill">{duration}</span>}
                        {format && <span className="b2b-pill">{format}</span>}
                      </div>
                      <h3>{title}</h3>
                      {summary && <p>{summary}</p>}
                      {description && <p className="b2b-course-desc">{description}</p>}
                    </div>
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
            <h2>{t("b2b.contactTitle")}</h2>
            <p>{t("b2b.contactText")}</p>
          </div>
          <ContactForm light title="" form="b2b-courses" submitLabel={t("b2b.contactSubmit")} />
        </div>
      </section>
    </div>
  );
}
