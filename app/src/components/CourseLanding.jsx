import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ContactForm from "./ContactForm.jsx";
import { submitLead } from "../api.js";
import { embedUrl } from "../siteVideos.js";
import {
  UZ_PHONE_EXAMPLE,
  UZ_PHONE_MAX_LENGTH,
  UZ_PHONE_PATTERN,
  UZ_PHONE_PLACEHOLDER,
  UZ_PHONE_PREFIX,
  formatUzPhone,
  isUzPhoneComplete,
} from "../phone.js";
import "../pages/Python.css";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function heroData(data) {
  const block = asObject(data);
  const top = asObject(block.top);
  const stats = asArray(block.info || block.bottom);
  const rawName = (top.extra || block.title || top.title || "").replace(/<br\s*\/?>/gi, " ");
  const leadingCourse = rawName.match(/^\s*(курс|kurs\w*)\s+/i);
  const prefix = top.extra ? top.title || "КУРС" : leadingCourse?.[1] || "";
  const name = rawName
    .replace(/\s+/g, " ")
    .replace(/^\s*(курс|kurs\w*)\s+/i, "")
    .replace(/\s+kursi\s*$/i, "")
    .trim();

  return {
    prefix,
    name: name || rawName || "IT",
    text: top.text || block.text || "",
    cta: block.link || top.link_2 || top.link || "Узнать подробнее",
    stats,
  };
}

export function CourseHero({ data, image }) {
  const hero = heroData(data);
  const text = Array.isArray(hero.text) ? hero.text.join(" ") : hero.text;

  return (
    <section className="py-hero" id="top">
      <div
        className="py-hero-bg"
        style={image ? { backgroundImage: `url(${image})` } : undefined}
        aria-hidden="true"
      />
      <div className="py-wrap py-hero-inner">
        <h1 className="py-hero-title">
          {hero.prefix && <span className="py-hero-title-prefix">{hero.prefix.toUpperCase()} </span>}
          <span className="py-hero-title-name">{hero.name.toUpperCase()}</span>
        </h1>
        {text && <p className="py-hero-text">{text}</p>}
        <div className={`py-hero-bottom${hero.stats.length > 0 ? "" : " py-hero-bottom--cta-only"}`}>
          {hero.stats.length > 0 && (
            <div className="py-stats">
              {hero.stats.map((item) => (
                <div className="py-stat" key={item.id}>
                  <span className="py-stat-label">{item.title}</span>
                  <span className="py-stat-value">{String(item.text || "").toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
          <a className="py-lime-btn" href="#contact">{hero.cta}</a>
        </div>
      </div>
    </section>
  );
}

function MoreCourse({ block, image }) {
  const top = asObject(block.top);
  const salary = asArray(block.bottom);
  const paragraphs = asArray(top.text);

  return (
    <section className="py-section py-more">
      <div className={`py-wrap py-more-grid${image ? "" : " py-more-grid--no-image"}`}>
        <h2 className="py-section-title py-more-title">{top.title}</h2>
        <div className="py-more-copy">
          {paragraphs.map((text, index) => <p key={index}>{text}</p>)}
          <div className="py-salary-head">
            <h3>{top.subtitle}</h3>
            {top.data && <span>{top.data}</span>}
          </div>
          <div className="py-salary-cards">
            {salary.map((item) => (
              <article className="py-salary-card" style={{ "--salary-width": `${item.maxWidth || 760}px` }} key={item.id}>
                <h4>{item.title}</h4>
                <p>{item.text}</p>
                <strong>{item.price}</strong>
              </article>
            ))}
          </div>
        </div>
        {image && <img className="py-orb-hand" src={image} alt="" loading="lazy" />}
      </div>
    </section>
  );
}

function GoodForIt({ block }) {
  const top = asObject(block.top);
  const items = asArray(block.bottom);

  return (
    <section className="py-dark-section py-good">
      <div className="py-wrap">
        <div className="py-two-col-head py-on-dark">
          <h2>{top.title}</h2>
          {top.text && <p>{top.text}</p>}
        </div>
        <div className="py-good-grid">
          {items.map((item) => (
            <article className="py-good-card" key={item.id}>
              {item.src && <img src={item.src} alt="" loading="lazy" />}
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CourseProgram({ block }) {
  const modules = asArray(block.modules);
  const plans = asArray(block.plans);
  const programs = block.programs && typeof block.programs === "object" ? block.programs : {};
  const [active, setActive] = useState(0);
  const activeLessons = asArray(programs[String(active + 1)] || programs[active + 1]);
  const activePlan = plans[active] || {};

  return (
    <section className="py-section py-program">
      <div className="py-wrap">
        <h2 className="py-section-title py-centered">{block.title}</h2>
        <div className="py-module-tabs" role="tablist">
          {modules.map((module, index) => (
            <button
              className={index === active ? "is-active" : ""}
              type="button"
              role="tab"
              aria-selected={index === active}
              onClick={() => setActive(index)}
              key={module.id}
            >
              {module.text}
            </button>
          ))}
        </div>
        <div className="py-program-panel">
          {activePlan.month && <p className="py-program-month">{activePlan.month}</p>}
          {activePlan.stage && <h3>{activePlan.stage}</h3>}
          {activeLessons.map((lesson, index) => (
            <details className="py-lesson" open={index === 0} key={`${lesson.id}-${index}`}>
              <summary>{index + 1}. {lesson.title}</summary>
              <p>{lesson.text}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AlumniWorks({ block }) {
  const fallbackItems = [
    { id: 1, bg: "/byd.png", src: "/user.png", student: "Talaba", month: "5 oylik o‘qish" },
    { id: 2, bg: "/bmw.png", src: "/user.png", student: "Talaba", month: "4 oylik o‘qish" },
    { id: 3, bg: "/nft.png", src: "/user.png", student: "Talaba", month: "5 oylik o‘qish" },
    { id: 4, bg: "/nft2.png", src: "/user.png", student: "Talaba", month: "6 oylik o‘qish" },
    { id: 5, bg: "/hotel.png", src: "/user.png", student: "Talaba", month: "5 oylik o‘qish" },
    { id: 6, bg: "/hotel2.png", src: "/user.png", student: "Talaba", month: "4 oylik o‘qish" },
  ];
  const items = asArray(block.informations).length > 0 ? asArray(block.informations) : fallbackItems;
  const stageRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0 });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || stage.scrollWidth <= stage.clientWidth) return;
    stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) * 0.28;
  }, [items.length]);

  const stopDragging = () => {
    const stage = stageRef.current;
    dragRef.current.active = false;
    stage?.classList.remove("is-dragging");
  };

  const startDragging = (event) => {
    if (event.button !== 0) return;
    const stage = stageRef.current;
    if (!stage || stage.scrollWidth <= stage.clientWidth) return;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: stage.scrollLeft,
    };
    stage.classList.add("is-dragging");
    stage.setPointerCapture?.(event.pointerId);
  };

  const drag = (event) => {
    const stage = stageRef.current;
    const state = dragRef.current;
    if (!stage || !state.active) return;
    stage.scrollLeft = state.scrollLeft - (event.clientX - state.startX);
  };

  return (
    <section className="py-dark-section py-alumni">
      <div className="py-wrap">
        <header className="py-alumni-head py-on-dark">
          <h2>{block.title}</h2>
          {block.text && <p>{block.text}</p>}
        </header>
        <div
          className="py-work-stage"
          ref={stageRef}
          onPointerDown={startDragging}
          onPointerMove={drag}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onPointerLeave={stopDragging}
          role="region"
          aria-label={block.title}
          tabIndex={0}
        >
          {items.map((item, index) => (
            <article className={`py-work-card py-work-card-${index}`} key={item.id}>
              {item.bg && <img className="py-work-img" src={item.bg} alt="" loading="lazy" />}
              <div className="py-work-meta">
                {item.src && <img src={item.src} alt="" loading="lazy" />}
                <div>
                  <strong>{item.student}</strong>
                  {item.month && <span>{item.month}</span>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoBlock({ url }) {
  const src = embedUrl(url);
  if (!src) return null;

  return (
    <section className="py-dark-section py-video-section" aria-label="Видео о курсе">
      <div className="py-wrap">
        <div className="py-video-frame">
          <iframe
            src={src}
            title="IT Academy course video"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}

export function WhyChoose({ title, cards }) {
  return (
    <section className="py-section py-why">
      <div className="py-wrap">
        <header className="py-why-head">
          <h2>{title}</h2>
          <div className="py-logo-row">
            <img src="/academy-logo.png" alt="" loading="lazy" />
            <span>IT-ACADEMY</span>
          </div>
        </header>
        <div className="py-why-grid">
          {asArray(cards).map((item) => (
            <article className="py-why-card" key={item.id}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StartCourseForm({ nearby, formName }) {
  const dates = asArray(nearby.dates);
  const times = asArray(nearby.times);
  const labels = asArray(nearby.labText);
  const [date, setDate] = useState(dates[0]?.text || "");
  const [time, setTime] = useState(times[0]?.text || "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(UZ_PHONE_PREFIX);
  const [hp, setHp] = useState("");
  const [state, setState] = useState("idle");

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!isUzPhoneComplete(phone)) return;
    setState("sending");
    try {
      await submitLead({
        name,
        phone,
        form: `${formName}-start`,
        course: [date, time].filter(Boolean).join(" "),
        _hp: hp,
        source: window.location.pathname,
      });
      setState("ok");
    } catch {
      setState("err");
    }
  };

  return (
    <form className="py-start-form" onSubmit={onSubmit}>
      {state === "ok" ? (
        <p className="py-form-status">Заявка отправлена!</p>
      ) : (
        <>
          {dates.length > 0 && (
            <label className="py-inline-field">
              <span>{labels[0] || "Дата:"}</span>
              <select value={date} onChange={(event) => setDate(event.target.value)}>
                {dates.map((item) => <option key={item.id}>{item.text}</option>)}
              </select>
            </label>
          )}
          {times.length > 0 && (
            <label className="py-inline-field">
              <span>{labels[1] || "Время:"}</span>
              <select value={time} onChange={(event) => setTime(event.target.value)}>
                {times.map((item) => <option key={item.id}>{item.text}</option>)}
              </select>
            </label>
          )}
          <label className="py-line-field">
            <span>{nearby.inpName}</span>
            <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
          </label>
          <label className="py-line-field">
            <span>{nearby.inpNumber}</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(formatUzPhone(event.target.value))}
              placeholder={UZ_PHONE_PLACEHOLDER}
              pattern={UZ_PHONE_PATTERN}
              maxLength={UZ_PHONE_MAX_LENGTH}
              title={`Введите номер телефона, напр. ${UZ_PHONE_EXAMPLE}`}
              inputMode="tel"
              autoComplete="tel"
              required
            />
          </label>
          <input className="hp" tabIndex={-1} autoComplete="off" value={hp} onChange={(event) => setHp(event.target.value)} aria-hidden="true" />
          {nearby.offer && <a className="py-offer-link" href="/Публичная оферта 2025.pdf" target="_blank" rel="noreferrer">{nearby.offer}</a>}
          {state === "err" && <p className="py-form-error">Ошибка отправки. Попробуйте позже.</p>}
          <button className="py-outline-btn" disabled={state === "sending"}>{state === "sending" ? "..." : nearby.btn}</button>
        </>
      )}
    </form>
  );
}

function CourseSummary({ nearby, formName }) {
  const facts = asArray(nearby.informations);

  return (
    <section className="py-section py-nearby">
      <div className="py-wrap py-nearby-grid">
        <article className="py-info-card">
          <h2>{nearby.blockTitle}</h2>
          <p className="py-info-sub">{nearby.subtitle}</p>
          <ul>
            {facts.map((item) => <li key={item.id}>{item.text}</li>)}
          </ul>
        </article>
        <article className="py-info-card py-start-card">
          <h2>{nearby.formTitle}</h2>
          {nearby.formText && <p className="py-start-text">{nearby.formText}</p>}
          <StartCourseForm nearby={nearby} formName={formName} />
        </article>
      </div>
    </section>
  );
}

function CostOfTraining({ block }) {
  const list = asArray(block.lists);
  const oldPrice = asArray(block.oldPrice);
  const rightTexts = [block.rightText_1, block.rightText_2].filter(Boolean);

  return (
    <section className="py-section py-cost">
      <div className="py-wrap">
        <h2 className="py-section-title py-centered">{block.title}</h2>
        {block.subtitle && <p className="py-cost-sub">*{block.subtitle}</p>}
        <div className="py-cost-grid">
          <article className="py-price-card">
            <h3>{block.leftTitle}</h3>
            <p className="py-price">
              {block.leftSubtitle} <span>{block.extra}</span>
            </p>
            {oldPrice.length > 0 && (
              <p className="py-old-price">
                {oldPrice[0]}<s>{oldPrice[1]}</s>{oldPrice[2]}
              </p>
            )}
            <ul className="py-feature-list">
              {list.map((item) => (
                <li key={item.id}>
                  <img src="/green_check.svg" alt="" loading="lazy" />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="py-price-card py-installment-card">
            <img className="py-round-star" src="/round_star.svg" alt="" loading="lazy" />
            <h3>{block.rightTitle}</h3>
            {rightTexts.map((text, index) => <p key={index}>{text}</p>)}
            <div className="py-consult">
              <img src="/round_star.svg" alt="" loading="lazy" />
              <span>{block.rightText_3}</span>
              <a className="py-outline-btn" href="#contact">{block.link}</a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector(".py-hero");
    if (!hero || !("IntersectionObserver" in window)) {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      threshold: 0,
      rootMargin: "-55% 0px 0px 0px",
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return <a className={`py-top-link${visible ? " is-visible" : ""}`} href="#top">↑ НАВЕРХ</a>;
}

export default function CourseLanding({
  courseKey,
  moreKey,
  programKey,
  formName,
  heroImage,
  moreImage,
  goodKey = "goodForIt",
  videoUrl = "https://www.youtube.com/watch?v=ou3YuUhLTqA",
}) {
  const { t } = useTranslation();
  const course = asObject(t(courseKey, { returnObjects: true }));
  const more = asObject(t(moreKey, { returnObjects: true }));
  const good = asObject(t(goodKey, { returnObjects: true }));
  const program = asObject(t(programKey, { returnObjects: true }));
  const alumni = asObject(t("alumniWorks", { returnObjects: true }));
  const nearby = asObject(t("nearbyGroups", { returnObjects: true }));
  const cost = asObject(t("costOfTraining", { returnObjects: true }));
  const whyCards = t("aboutUs", { returnObjects: true });

  return (
    <div className={`python-page course-page course-page--${formName}`}>
      <div className="python-stars" aria-hidden="true" />
      <CourseHero data={course} image={heroImage} />
      <MoreCourse block={more} image={moreImage} />
      <GoodForIt block={good} />
      <CourseProgram block={program} />
      <AlumniWorks block={alumni} />
      <VideoBlock url={videoUrl} />
      <WhyChoose title={t("whyWe")} cards={whyCards} />
      <CourseSummary nearby={nearby} formName={formName} />
      <img className="py-students-strip" src="/students.jpg" alt="" loading="lazy" />
      <CostOfTraining block={cost} />

      <section className="py-section py-contact" id="contact">
        <div className="py-wrap">
          <ContactForm light courseContact title={t("contact.title")} form={formName} />
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
