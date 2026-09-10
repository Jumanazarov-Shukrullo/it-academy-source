import { useTranslation } from "react-i18next";
import ContactForm from "../components/ContactForm.jsx";
import { MoreCourse, CostOfTraining } from "../components/CourseBlocks.jsx";
import { AlumniWorks as CourseAlumniWorks } from "../components/CourseLanding.jsx";
import { useSiteVideos, embedUrl } from "../siteVideos.js";
import "./Camp.css";

function splitBr(str) {
  return (str || "").split(/<br\s*\/?>/i);
}

export default function Camp() {
  const { t } = useTranslation();

  const top = t("campHome.top", { returnObjects: true }) || {};
  const bottom = t("campHome.bottom", { returnObjects: true });
  const infos = Array.isArray(bottom) ? bottom : [];

  const campFor = t("campFor", { returnObjects: true }) || {};
  const forGroups = Array.isArray(campFor.groups) ? campFor.groups : [];

  const why = t("aboutUs", { returnObjects: true });
  const whyItems = Array.isArray(why) ? why : [];
  const alumni = t("alumniWorks", { returnObjects: true }) || {};

  const sv = useSiteVideos();
  const videosBlock = t("campVideos", { returnObjects: true }) || {};
  const i18nVideos = Array.isArray(videosBlock.videos) ? videosBlock.videos : [];
  const videos = sv?.camp != null
    ? sv.camp
    : i18nVideos.map((v) => ({ url: v.link, title: v.name }));

  const heroTitle = splitBr(top.title || top.title_2 || "");

  return (
    <>
      {/* CampHome hero */}
      <section className="hero camp-hero" style={{ backgroundImage: "url(/camp-bg.jpg)" }}>
        <div className="wrap">
          <div className="hero-card camp-hero-card">
            <img className="wordmark" src="/logo_2.svg" alt="IT Academy" />
            <h1>
              {heroTitle.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < heroTitle.length - 1 && <br />}
                </span>
              ))}
            </h1>
            {top.extra && <p className="camp-hero-extra">{top.extra}</p>}
            <div className="camp-hero-cta">
              <a href="#contact" className="btn">{top.link || t("header.link")}</a>
              {top.link_2 && <a href="#camp-more" className="btn ghost">{top.link_2}</a>}
            </div>
            {infos.length > 0 && (
              <div className="camp-facts">
                {infos.map((it) => (
                  <div className="camp-fact" key={it.id}>
                    <span className="camp-fact-title">{it.title}</span>
                    <span className="camp-fact-text">{it.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Decorative IT-direction icon band (matches the live camp landing) */}
      <section className="section camp-icons-band">
        <div className="wrap">
          <img className="camp-icons" src="/camp-home-page-icons.svg" alt="" loading="lazy" />
        </div>
      </section>

      {/* CampMoreCourse — camp omits the salary table (salary=false) */}
      <div id="camp-more">
        <MoreCourse dataKey="campMoreСourse" salary={false} />
      </div>

      {/* CampFor */}
      <section className="section band-dark">
        <div className="wrap">
          <h2 className="section-title">{campFor.title}</h2>
          <div className="cards camp-for">
            {forGroups.map((g) => (
              <article className="card camp-for-card" key={g.id}>
                {g.image && <img className="card-img camp-for-img" src={g.image} alt="" loading="lazy" />}
                <h3>{g.ageRange}</h3>
                <p>{g.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* AlumniWorks */}
      <CourseAlumniWorks block={alumni} />

      {/* WhyWe */}
      <section className="section band-dark">
        <div className="wrap">
          <h2 className="section-title">{t("whyWe")} <span className="lime">IT-ACADEMY</span></h2>
          <div className="why-list">
            {whyItems.map((w) => (
              <article className="why-card" key={w.id}>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CampVideos */}
      {videos.length > 0 && (
        <section className="section band-dark">
          <div className="wrap">
            <h2 className="section-title">{videosBlock.title}</h2>
            {videosBlock.subtitle && <p className="section-lead">{videosBlock.subtitle}</p>}
            <div className="video-row">
              {videos.map((v, i) => (
                <iframe key={i} src={embedUrl(v.url)} title={v.title} allowFullScreen loading="lazy" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CostOfTraining */}
      <CostOfTraining />

      {/* Contact */}
      <section className="section counsel" id="contact">
        <div className="wrap">
          <ContactForm title={t("contact.title")} form="camp" />
        </div>
      </section>
    </>
  );
}
