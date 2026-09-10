import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getSchedule } from "../api.js";
import ContactForm from "../components/ContactForm.jsx";
import CounselingWizard from "../components/CounselingWizard.jsx";
import Carousel from "../components/Carousel.jsx";
import CoursePosters from "../components/CoursePosters.jsx";
import GroupCard from "../components/GroupCard.jsx";
import { useSiteVideos, heroEmbed, embedUrl } from "../siteVideos.js";

const FALLBACK_GROUPS = [
  {
    id: "fallback-graphic",
    branch: "yunusabad",
    days: "Вт, Сб",
    time_from: "17:00",
    time_to: "19:00",
    duration_months: 4,
    course: "Графический Дизайн",
    description_ru: "На курсе вы освоите сразу 3 направления: графический дизайн, моушн-дизайн и веб-дизайн. Инструменты: Photoshop, Figma, Illustrator, Canva, After Effects Обучение проходит с упором на практику - уже во время занятий вы начнете создавать собственные дизайны и формировать портфолио.",
    description_uz: "На курсе вы освоите сразу 3 направления: графический дизайн, моушн-дизайн и веб-дизайн. Инструменты: Photoshop, Figma, Illustrator, Canva, After Effects Обучение проходит с упором на практику - уже во время занятий вы начнете создавать собственные дизайны и формировать портфолио.",
  },
  {
    id: "fallback-python",
    branch: "yunusabad",
    days: "Вт, Чт",
    time_from: "17:00",
    time_to: "19:00",
    duration_months: 8,
    course: "Python (Backend)",
    description_ru: "На курсе вы изучите SQL, Django, API и серверы, Git, Telegram-ботов и, главное, язык Python Звучит сложно? Нет! Если проходить всё постепенно, то за 8 месяцев вы полноценно освоите направление backend-разработки и будете разбираться в одном из самых сложных направлений. Делайте уверенные шаги, а IT Academy вас поддержит!",
    description_uz: "На курсе вы изучите SQL, Django, API и серверы, Git, Telegram-ботов и, главное, язык Python Звучит сложно? Нет! Если проходить всё постепенно, то за 8 месяцев вы полноценно освоите направление backend-разработки и будете разбираться в одном из самых сложных направлений. Делайте уверенные шаги, а IT Academy вас поддержит!",
  },
  {
    id: "fallback-computer",
    branch: "yunusabad",
    days: "Пн, Ср, Пт",
    time_from: "17:00",
    time_to: "19:00",
    duration_months: 3,
    course: "Компьютерная грамотность (Word, Excel)",
    description_ru: "Курс подойдет тем, кто хочет уверенно пользоваться компьютером в учебе и работе. Вы научитесь работать с документами в Word, создавать и оформлять таблицы в Excel, а также освоите основные функции и инструменты, которые ежедневно используются в офисной и учебной среде.",
    description_uz: "Курс подойдет тем, кто хочет уверенно пользоваться компьютером в учебе и работе. Вы научитесь работать с документами в Word, создавать и оформлять таблицы в Excel, а также освоите основные функции и инструменты, которые ежедневно используются в офисной и учебной среде.",
  },
  {
    id: "fallback-kids",
    branch: "yunusabad",
    days: "Сб, Вс",
    time_from: "11:00",
    time_to: "13:00",
    duration_months: 6,
    course: "Детские курсы (Unity, Roblox, программирование)",
    description_ru: "На курсе дети в увлекательной форме изучают Unity, Roblox и основы программирования. Ребёнок не просто играет, а учится создавать собственные игры, развивает логическое мышление, креативность и умение решать задачи. Занятия проходят с упором на практику и адаптированы под возраст, чтобы обучение было понятным и интересным.",
    description_uz: "На курсе дети в увлекательной форме изучают Unity, Roblox и основы программирования. Ребёнок не просто играет, а учится создавать собственные игры, развивает логическое мышление, креативность и умение решать задачи. Занятия проходят с упором на практику и адаптированы под возраст, чтобы обучение было понятным и интересным.",
  },
];

const assetSrc = (value) => {
  if (!value) return "";
  return String(value).startsWith("/") ? value : `/${value}`;
};

export default function Home() {
  const { t, i18n } = useTranslation();
  const lng = i18n.language?.startsWith("uz") ? "uz" : "ru";
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    getSchedule().then(setGroups).catch(() => {});
  }, []);

  const sv = useSiteVideos();
  const why = t("aboutUs", { returnObjects: true }) || [];
  const i18nVideos = t("studentFeedback.videos", { returnObjects: true });
  // admin override (incl. an explicit empty list) wins; else the bundled list.
  const videos = sv?.feedback != null
    ? sv.feedback
    : (Array.isArray(i18nVideos) ? i18nVideos.map((v) => ({ url: v.src, title: v.title })) : []);
  // Keep every valid admin entry. The carousel controls how many cards are
  // visible at once, so limiting the data here would make later additions
  // impossible to reach.
  const feedbackVideos = Array.isArray(videos)
    ? videos.filter((video) => embedUrl(video?.url))
    : [];
  const fallbackNews = t("news.newsData", { returnObjects: true });
  const newsRows = (Array.isArray(fallbackNews)
      ? fallbackNews.map((n) => ({
        id: n.id,
        cover_image: n.src,
        title_ru: n.title,
        title_uz: n.title,
        excerpt_ru: n.text,
        excerpt_uz: n.text,
      }))
      : []);
  const scheduleGroups = groups.length > 0 ? groups : FALLBACK_GROUPS;
  const heroTitle = (t("header.title") || "").split(/<br\s*\/?>/i);

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero home-hero">
        <div className="hero-video" aria-hidden="true">
          <iframe
            src={heroEmbed(sv?.hero)}
            title="IT Academy Background"
            allow="autoplay; encrypted-media"
            frameBorder="0"
            tabIndex={-1}
          />
        </div>
        <div className="wrap">
          <div className="hero-card">
            <img className="wordmark" src="/logo_2.svg" alt="IT Academy" />
            <h1>{heroTitle.map((line, i) => <span key={i}>{line}{i < heroTitle.length - 1 && <br />}</span>)}</h1>
            <a href="#contact" className="btn block">{t("header.link")}</a>
          </div>
          <img className="hero-down" src="/arrow_down.svg" alt="" />
        </div>
      </section>

      {/* Upcoming groups — CMS schedule */}
      <section className="section schedule-section">
        <div className="wrap">
          <h2 className="section-title">{t("schedule.title")}</h2>
          <div className="groups">
            {scheduleGroups.map((g) => <GroupCard g={g} key={g.id} />)}
          </div>
        </div>
      </section>

      {/* Course selection — bespoke poster swiper (faithful to live, not CMS-driven) */}
      <section className="section courses-section">
        <div className="wrap">
          <CoursePosters />
          <Link to="/courses" className="cp-select">{t("courseSelection.btn", "Выбрать курс")}</Link>
          <hr className="cp-line" />
        </div>
      </section>

      {/* Why choose */}
      <section className="section why-section">
        <div className="wrap">
          <h2 className="section-title why-title">{t("whyWe")}<img src="/logo-black.svg" alt="IT-ACADEMY" /></h2>
          <div className="why-list">
            {Array.isArray(why) && why.map((w) => (
              <article className="why-card" key={w.id}>
                <div>
                  <h3>{w.title}</h3>
                  <p>{w.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Student feedback */}
      {feedbackVideos.length > 0 && (
        <section className="section band-dark feedback-section">
          <div className="wrap">
            <h2 className="section-title">{t("studentFeedback.title")}</h2>
            <p className="section-lead">{t("studentFeedback.text")}</p>
            <Carousel className="video-row" ariaLabel={t("studentFeedback.title")}>
              {feedbackVideos.map((v, i) => (
                <iframe
                  key={`${v.url}-${i}`}
                  src={embedUrl(v.url)}
                  title={v.title || `${t("studentFeedback.title")} ${i + 1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              ))}
            </Carousel>
          </div>
        </section>
      )}

      {/* Counseling — faithful 5-step wizard on the decorative green band */}
      <CounselingWizard />

      {/* News — CMS news */}
      {newsRows.length > 0 && (
        <section className="section news-section">
          <div className="wrap">
            <h2 className="section-title">{t("news.title", "Новости IT-Academy")}</h2>
            <div className="news-grid">
              {newsRows.slice(0, 3).map((n) => (
                <Link className="news-card" key={n.id} to={`/news_stories/${n.id}`}>
                  {n.cover_image && <img src={assetSrc(n.cover_image)} alt="" loading="lazy" />}
                  <div className="news-body">
                    <h3>{n[`title_${lng}`] || n.title_ru}</h3>
                    {n[`excerpt_${lng}`] && <p>{n[`excerpt_${lng}`]}</p>}
                  </div>
                </Link>
              ))}
            </div>
            <Link to="/news" className="news-more">{t("news.link", "Больше новостей")}</Link>
          </div>
        </section>
      )}

      {/* Branches / location — map links per the live "Филиалы" section */}
      <section className="section branches-section">
        <div className="wrap">
          <div className="branch-head">
            <h2 className="section-title">{t("location.title", "Филиалы")}</h2>
            {t("location.text") && <p className="section-lead">{t("location.text")}</p>}
          </div>
          <div className="branch-grid">
            {(t("location.maps", { returnObjects: true }) || []).map((m, i) => (
              <div className="branch" key={m.id} style={{ backgroundImage: `url(${["/yunusabad.jpg", "/sergeli.jpg"][i]})` }}>
                <div className="branch-inner">
                  <h3>{m.title}</h3>
                  <div className="branch-btns">
                    <a href={m.src} target="_blank" rel="noreferrer" className="btn">{t("location.link", "Подробнее о филиале")}</a>
                    <a href={m.src} target="_blank" rel="noreferrer" className="btn ghost">{m.locationText || "Локация"}</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom contact form */}
      <section className="section counsel" id="contact">
        <div className="wrap">
          <ContactForm title={t("contact.title")} form="home" submitLabel={t("contact.submit", "Оставить заявку")} />
        </div>
      </section>
    </div>
  );
}
