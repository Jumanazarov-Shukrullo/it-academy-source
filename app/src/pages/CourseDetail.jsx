import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ContactForm from "../components/ContactForm.jsx";
import { BackToTop, CourseHero, WhyChoose } from "../components/CourseLanding.jsx";
import { getCourse } from "../api.js";
import "./CourseDetail.css";

function localized(course, field, lang) {
  return String(
    course?.[`${field}_${lang}`]
      || course?.[`${field}_ru`]
      || course?.[`${field}_uz`]
      || ""
  ).trim();
}

function assetSrc(value, version) {
  const source = String(value || "").trim();
  if (/^https?:\/\//i.test(source)) return source;
  const path = source.replace(/^\/+/, "");
  if (!path || path.includes("..") || !/^[\w][\w./-]*$/.test(path)) return "";
  return `/${path}${version ? `?v=${encodeURIComponent(version)}` : ""}`;
}

function paragraphList(value) {
  return String(value || "")
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function formatPrice(value, lang, t) {
  if (value === null || value === undefined || value === "") return "";
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return "";
  if (amount === 0) return t("courseDetail.free");
  const formatted = new Intl.NumberFormat(lang === "uz" ? "uz-UZ" : "ru-RU", {
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
  return `${formatted} ${t("courseDetail.currency")}`;
}

function CourseState({ status, onRetry }) {
  const { t } = useTranslation();
  const loading = status === "loading";
  const notFound = status === "not-found";

  return (
    <section className="managed-course-state" aria-live="polite" aria-busy={loading}>
      <div className="managed-course-state-card">
        <p>IT ACADEMY</p>
        <h1>
          {loading
            ? t("courseDetail.loading")
            : notFound
              ? t("courseDetail.notFound")
              : t("courseDetail.loadError")}
        </h1>
        {!loading && (
          <div className="managed-course-state-actions">
            {!notFound && <button type="button" onClick={onRetry}>{t("courseDetail.retry")}</button>}
            <Link to="/courses">{t("courseDetail.backToCourses")}</Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default function CourseDetail() {
  const { slug = "" } = useParams();
  const { t, i18n } = useTranslation();
  const [course, setCourse] = useState(null);
  const [status, setStatus] = useState("loading");
  const [requestVersion, setRequestVersion] = useState(0);
  const lang = i18n.language?.startsWith("uz") ? "uz" : "ru";

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    setCourse(null);
    getCourse(slug)
      .then((item) => {
        if (!alive) return;
        if (!item) {
          setStatus("not-found");
          return;
        }
        setCourse(item);
        setStatus("ready");
      })
      .catch((error) => {
        if (!alive) return;
        setStatus(error?.response?.status === 404 ? "not-found" : "error");
      });
    return () => { alive = false; };
  }, [slug, requestVersion]);

  const title = localized(course, "title", lang);
  useEffect(() => {
    if (!title) return undefined;
    const previousTitle = document.title;
    document.title = `${title} — IT Academy`;
    return () => { document.title = previousTitle; };
  }, [title]);

  const pageData = useMemo(() => {
    if (!course) return null;
    const summary = localized(course, "summary", lang);
    const description = localized(course, "description", lang) || summary;
    const duration = localized(course, "duration", lang)
      || (course.duration_months
        ? `${course.duration_months} ${lang === "uz" ? "oy" : "мес."}`
        : "");
    const facts = [
      ["duration", t("courseBanner.duration"), duration],
      ["lessons", t("courseBanner.lessons"), localized(course, "lessons", lang)],
      ["format", t("courseBanner.format"), localized(course, "format", lang)],
      ["lesson-duration", t("courseBanner.lessonDuration"), localized(course, "lesson_duration", lang)],
    ]
      .filter(([, , value]) => value)
      .map(([id, label, value]) => ({ id, title: label, text: value }));

    return {
      summary,
      description: paragraphList(description),
      facts,
      price: formatPrice(course.price, lang, t),
      image: assetSrc(course.image, course.updated_at) || "/courses_home.jpg",
      button: localized(course, "button", lang) || t("courseDetail.apply"),
    };
  }, [course, lang, t]);

  if (status !== "ready" || !course || !pageData) {
    return <CourseState status={status} onRetry={() => setRequestVersion((value) => value + 1)} />;
  }

  const hero = {
    top: {
      title: t("courseDetail.courseLabel"),
      extra: title || course.slug,
      text: pageData.summary,
    },
    link: pageData.button,
    info: pageData.facts,
  };
  const whyCards = t("aboutUs", { returnObjects: true });

  return (
    <div className="python-page course-page course-page--managed">
      <div className="python-stars" aria-hidden="true" />
      <CourseHero data={hero} image={pageData.image} />

      {pageData.description.length > 0 && (
        <section className="py-section managed-course-about" aria-labelledby="managed-course-about-title">
          <div className="py-wrap managed-course-about-grid">
            <header>
              <p className="managed-course-kicker">{t("courseDetail.aboutKicker")}</p>
              <h2 className="py-section-title" id="managed-course-about-title">
                {t("courseDetail.aboutTitle")}
              </h2>
            </header>
            <div className="managed-course-copy">
              {pageData.description.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>
          </div>
        </section>
      )}

      <WhyChoose title={t("whyWe")} cards={whyCards} />

      <section className="py-dark-section managed-course-cta" aria-labelledby="managed-course-cta-title">
        <div className="py-wrap managed-course-cta-grid">
          <div>
            <p className="managed-course-kicker">
              {pageData.price ? t("courseDetail.priceKicker") : t("courseDetail.courseLabel")}
            </p>
            <h2 id="managed-course-cta-title">
              {pageData.price || t("courseDetail.readyTitle")}
            </h2>
            <p className="managed-course-cta-text">{t("courseDetail.readyText")}</p>
          </div>
          <a className="py-lime-btn" href="#contact">{t("courseDetail.apply")}</a>
        </div>
      </section>

      <section className="py-section py-contact" id="contact">
        <div className="py-wrap">
          <ContactForm light courseContact title={t("contact.title")} form={course.slug} />
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
