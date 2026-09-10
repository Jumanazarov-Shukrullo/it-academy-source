import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getSchedule, submitLead } from "../api.js";
import { useSiteVideos, embedUrl } from "../siteVideos.js";
import Carousel from "./Carousel.jsx";
import GroupCard from "./GroupCard.jsx";
import {
  UZ_PHONE_EXAMPLE,
  UZ_PHONE_MAX_LENGTH,
  UZ_PHONE_PATTERN,
  UZ_PHONE_PLACEHOLDER,
  UZ_PHONE_PREFIX,
  formatUzPhone,
  isUzPhoneComplete,
} from "../phone.js";
import "./CourseBlocks.css";

// Shared section library for the 4 course pages (Web/Python/DataScience/GraphicDesign)
// so they stay visually identical. Each block is self-contained and reads i18n by key.

function splitBr(str) {
  return (str || "").split(/<br\s*\/?>/i);
}

// 1) Hero — full-bleed dark photo band matching the live course design:
//    big "КУРС" + course name (top-left), intro text (top-right), green CTA,
//    and a translucent stat strip pinned at the bottom. `bg` is the course photo.
//    Reads {top:{title,extra,text,link}} (webHome) OR {title,text,info,link} (python…).
export function CourseHero({ titleKey, bg }) {
  const { t, i18n } = useTranslation();
  const data = t(titleKey, { returnObjects: true });
  const block = data && typeof data === "object" ? data : {};
  const top = block.top && typeof block.top === "object" ? block.top : {};

  const title = top.title || block.title || "";
  const extra = top.extra || block.subtitle || "";
  const text = top.text || block.text || "";
  const cta = top.link || block.link || t("contact.link", "Узнать подробнее");
  const stats = Array.isArray(block.info) ? block.info : Array.isArray(block.bottom) ? block.bottom : [];

  // Two-tier title: a big localized "КУРС" word + the course name (any leading/
  // trailing "курс/kurs…" word in the source title is stripped so it isn't doubled).
  const kurs = i18n.language?.startsWith("uz") ? "KURS" : "КУРС";
  const name = (extra || title)
    .replace(/^\s*(курс|kurs\w*)\s+/i, "")
    .replace(/\s+kursi\s*$/i, "")
    .trim() || title;

  return (
    <section className="cb-hero" style={bg ? { backgroundImage: `url(${bg})` } : undefined}>
      <div className="wrap cb-hero-inner">
        <div className="cb-hero-top">
          <div className="cb-hero-head">
            <h1 className="cb-hero-title">
              <span className="cb-kurs">{kurs}</span>
              <span className="cb-name">{name}</span>
            </h1>
            <a href="#contact" className="cb-hero-cta">{cta}</a>
          </div>
          {text && <p className="cb-hero-text">{Array.isArray(text) ? text.join(" ") : text}</p>}
        </div>

        {stats.length > 0 && (
          <div className="cb-stats">
            {stats.map((s) => (
              <div className="cb-stat" key={s.id}>
                <span className="cb-stat-label">{s.title}</span>
                <span className="cb-stat-value">{s.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// 2) MoreCourse — {top:{title,text,subtitle,data}, bottom:[{title,text,price}]}.
//    salary=false (camp) hides the salary subtitle/cards; image renders a side graphic.
export function MoreCourse({ dataKey, image, salary = true }) {
  const { t } = useTranslation();
  const top = t(`${dataKey}.top`, { returnObjects: true }) || {};
  const bottom = t(`${dataKey}.bottom`, { returnObjects: true });
  const items = salary && Array.isArray(bottom) ? bottom : [];
  const paras = Array.isArray(top.text) ? top.text : top.text ? [top.text] : [];

  return (
    <section className="section">
      <div className="wrap">
        <h2 className="section-title">{top.title}</h2>
        <div className={image ? "cb-more-split" : ""}>
          <div>
            {paras.map((p, i) => (
              <p className="section-lead cb-lead" key={i}>
                {p}
              </p>
            ))}
          </div>
          {image && <img className="cb-more-img" src={image} alt="" loading="lazy" />}
        </div>
        {salary && top.subtitle && (
          <h3 className="cb-salary-title">
            {top.subtitle}
            {top.data && <span className="cb-salary-data"> {top.data}</span>}
          </h3>
        )}
        {items.length > 0 && (
          <div className="cards cb-salary">
            {items.map((it) => (
              <article className="card cb-salary-card" key={it.id}>
                <h3>{it.title}</h3>
                <p>{it.text}</p>
                {it.price && <div className="cb-price">{it.price}</div>}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// 3) GoodForIt — i18n 'goodForIt' { top:{title,text}, bottom:[{src,title,text}] }
export function GoodForIt() {
  const { t } = useTranslation();
  const top = t("goodForIt.top", { returnObjects: true }) || {};
  const bottom = t("goodForIt.bottom", { returnObjects: true });
  const items = Array.isArray(bottom) ? bottom : [];

  return (
    <section className="section band-dark">
      <div className="wrap">
        <h2 className="section-title">{top.title}</h2>
        {top.text && <p className="section-lead">{top.text}</p>}
        <div className="cards">
          {items.map((it) => (
            <article className="card" key={it.id}>
              {it.src && <img className="card-img" src={it.src} alt="" loading="lazy" />}
              <h3>{it.title}</h3>
              <p>{it.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// 4) CourseProgram — {title, modules:[{text}], plans:[{month,stage}], programs:{1:[{title,text}]…}}.
//    Live = module tabs (Модуль 1-4); active tab shows that module's detailed lessons.
export function CourseProgram({ dataKey }) {
  const { t } = useTranslation();
  const title = t(`${dataKey}.title`);
  const modules = t(`${dataKey}.modules`, { returnObjects: true });
  const plans = t(`${dataKey}.plans`, { returnObjects: true });
  const programs = t(`${dataKey}.programs`, { returnObjects: true });
  const mods = Array.isArray(modules) ? modules : [];
  const planList = Array.isArray(plans) ? plans : [];
  const [active, setActive] = useState(0);

  // programs is keyed by module number (1-based, string keys in JSON)
  const lessons = programs && typeof programs === "object" ? programs[String(active + 1)] || programs[active + 1] || [] : [];
  const lessonList = Array.isArray(lessons) ? lessons : [];
  const month = planList[active]?.month;

  if (mods.length === 0) {
    // fallback: flat monthly plan
    return (
      <section className="section">
        <div className="wrap">
          <h2 className="section-title">{title}</h2>
          <div className="why-list">
            {planList.map((p) => (
              <article className="why-card" key={p.id}>
                {p.month && <h3>{p.month}</h3>}
                <p>{p.stage}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="wrap">
        <h2 className="section-title">{title}</h2>
        <div className="cb-tabs" role="tablist">
          {mods.map((m, i) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={i === active}
              className={`cb-tab${i === active ? " active" : ""}`}
              onClick={() => setActive(i)}
            >
              {m.text}
            </button>
          ))}
        </div>
        <div className="cb-tab-panel" key={active}>
          {month && <h3 className="cb-tab-month">{month}</h3>}
          {planList[active]?.stage && <p className="section-lead cb-lead">{planList[active].stage}</p>}
          <div className="cb-lessons">
            {lessonList.map((l) => (
              <article className="card cb-lesson" key={l.id}>
                {l.title && <h4>{l.title}</h4>}
                <p>{l.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// 5) AlumniWorks — 'alumniWorks' { title, text, informations:[{bg,src,student,month}] }
export function AlumniWorks() {
  const { t } = useTranslation();
  const title = t("alumniWorks.title");
  const text = t("alumniWorks.text");
  const informations = t("alumniWorks.informations", { returnObjects: true });
  const items = Array.isArray(informations) ? informations : [];

  return (
    <section className="section band-darker">
      <div className="wrap">
        <h2 className="section-title">{title}</h2>
        {text && <p className="section-lead">{text}</p>}
        <div className="cards">
          {items.map((it) => (
            <article className="card" key={it.id}>
              {it.bg && <img className="card-img cb-alumni-img" src={it.bg} alt="" loading="lazy" />}
              <div className="cb-alumni-meta">
                {it.src && <img className="cb-alumni-avatar" src={it.src} alt="" loading="lazy" />}
                <div>
                  <h3>{it.student}</h3>
                  {it.month && <p className="cb-alumni-month">{it.month}</p>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// 6) WhyChoose — 'whyWe' heading + 'aboutUs' cards (same as homepage; live shows on python/datascience).
export function WhyChoose() {
  const { t } = useTranslation();
  const cards = t("aboutUs", { returnObjects: true });
  const list = Array.isArray(cards) ? cards : [];
  return (
    <section className="section">
      <div className="wrap">
        <h2 className="section-title">
          {t("whyWe")} <span className="lime">IT-ACADEMY</span>
        </h2>
        <div className="why-list">
          {list.map((w) => (
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
  );
}

// 7) VideoTestimonials — 'studentFeedback' (title/text + YouTube embeds). Live shows on python/datascience.
export function VideoTestimonials() {
  const { t } = useTranslation();
  const sv = useSiteVideos();
  const i18nVideos = t("studentFeedback.videos", { returnObjects: true });
  const list = sv?.feedback != null
    ? sv.feedback
    : (Array.isArray(i18nVideos) ? i18nVideos.map((v) => ({ url: v.src, title: v.title })) : []);
  if (list.length === 0) return null;
  return (
    <section className="section">
      <div className="wrap">
        <h2 className="section-title">{t("studentFeedback.title")}</h2>
        <p className="section-lead">{t("studentFeedback.text")}</p>
        <Carousel className="video-row" ariaLabel={t("studentFeedback.title")}>
          {list.map((v, i) => (
            <iframe key={i} src={embedUrl(v.url)} title={v.title} allowFullScreen loading="lazy" />
          ))}
        </Carousel>
      </div>
    </section>
  );
}

// "Старт курса" booking form — name + phone (+ start date/time picker) → /cms/lead.php.
function StartForm() {
  const { t } = useTranslation();
  const dates = t("nearbyGroups.dates", { returnObjects: true });
  const times = t("nearbyGroups.times", { returnObjects: true });
  const labText = t("nearbyGroups.labText", { returnObjects: true });
  const dateOpts = Array.isArray(dates) ? dates : [];
  const timeOpts = Array.isArray(times) ? times : [];
  const labels = Array.isArray(labText) ? labText : [];
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(UZ_PHONE_PREFIX);
  const [date, setDate] = useState(dateOpts[0]?.text || "");
  const [time, setTime] = useState(timeOpts[0]?.text || "");
  const [hp, setHp] = useState("");
  const [state, setState] = useState("idle");

  const submit = async (e) => {
    e.preventDefault();
    if (!isUzPhoneComplete(phone)) return;
    setState("sending");
    try {
      await submitLead({
        name,
        phone,
        form: "course-start",
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
    <div className="lead-card cb-start">
      <h3>{t("nearbyGroups.formTitle")}</h3>
      {t("nearbyGroups.formText") && <p className="lead-sub">{t("nearbyGroups.formText")}</p>}
      {state === "ok" ? (
        <p className="lead-ok">{t("contact.successTitle", "Заявка отправлена!")}</p>
      ) : (
        <form onSubmit={submit}>
          {state === "err" && <p className="lead-err">{t("sendMessage.error", "Ошибка отправки. Попробуйте позже.")}</p>}
          {dateOpts.length > 0 && (
            <label className="field">
              {labels[0] || "Дата"}
              <select value={date} onChange={(e) => setDate(e.target.value)}>
                {dateOpts.map((d) => (
                  <option key={d.id}>{d.text}</option>
                ))}
              </select>
            </label>
          )}
          {timeOpts.length > 0 && (
            <label className="field">
              {labels[1] || "Время"}
              <select value={time} onChange={(e) => setTime(e.target.value)}>
                {timeOpts.map((tm) => (
                  <option key={tm.id}>{tm.text}</option>
                ))}
              </select>
            </label>
          )}
          <label className="field">
            {t("nearbyGroups.inpName", "Ваше имя")}
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <label className="field">
            {t("nearbyGroups.inpNumber", "Номер телефона")}
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatUzPhone(e.target.value))}
              placeholder={UZ_PHONE_PLACEHOLDER}
              pattern={UZ_PHONE_PATTERN}
              maxLength={UZ_PHONE_MAX_LENGTH}
              title={`Введите номер телефона, напр. ${UZ_PHONE_EXAMPLE}`}
              inputMode="tel"
              autoComplete="tel"
              required
            />
          </label>
          <input className="hp" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} aria-hidden="true" />
          <button className="btn block" disabled={state === "sending"}>
            {state === "sending" ? "…" : t("header.link", "Получить консультацию")}
          </button>
        </form>
      )}
    </div>
  );
}

// 8) NearbyGroups — copy + CMS getSchedule() group cards, then the live
//    "Коротко о курсе / В цифрах" facts panel and the "Старт курса" booking form.
export function NearbyGroups() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    getSchedule()
      .then((items) => setGroups(Array.isArray(items) ? items : []))
      .catch(() => setGroups([]));
  }, []);

  const title = t("nearbyGroups.title");
  const text = t("nearbyGroups.text");
  const informations = t("nearbyGroups.informations", { returnObjects: true });
  const facts = Array.isArray(informations) ? informations : [];

  return (
    <section className="section">
      <div className="wrap">
        <h2 className="section-title">{title}</h2>
        {text && <p className="section-lead">{text}</p>}
        {groups.length > 0 && (
          <div className="groups">
            {groups.map((g) => <GroupCard g={g} key={g.id} />)}
          </div>
        )}

        {(facts.length > 0 || t("nearbyGroups.formTitle")) && (
          <div className="cb-nearby-grid">
            {facts.length > 0 && (
              <div className="cb-facts">
                <h3 className="cb-facts-title">{t("nearbyGroups.blockTitle")}</h3>
                {t("nearbyGroups.subtitle") && <p className="cb-facts-sub">{t("nearbyGroups.subtitle")}</p>}
                <ul className="cb-cost-list">
                  {facts.map((f) => (
                    <li key={f.id}>{f.text}</li>
                  ))}
                </ul>
              </div>
            )}
            <StartForm />
          </div>
        )}
      </div>
    </section>
  );
}

// 9) CostOfTraining — two-card pricing layout + CTA.
export function CostOfTraining() {
  const { t } = useTranslation();
  const block = t("costOfTraining", { returnObjects: true }) || {};
  const lists = Array.isArray(block.lists) ? block.lists : [];
  const oldPrice = Array.isArray(block.oldPrice) ? block.oldPrice : [];
  const rightTexts = [block.rightText_1, block.rightText_2, block.rightText_3].filter(Boolean);

  return (
    <section className="section band-grey">
      <div className="wrap">
        <h2 className="section-title">{block.title}</h2>
        {block.subtitle && <p className="section-lead">{block.subtitle}</p>}
        <div className="cards cb-cost">
          {/* Left — offline group price */}
          <article className="card cb-cost-left">
            <h3>{block.leftTitle}</h3>
            <div className="cb-cost-price">
              {block.leftSubtitle}
              {block.extra && <span className="cb-cost-unit"> {block.extra}</span>}
            </div>
            {oldPrice.length > 0 && (
              <p className="cb-cost-old">
                {oldPrice[0]}
                <s>{oldPrice[1]}</s>
                {oldPrice[2]}
              </p>
            )}
            <ul className="cb-cost-list">
              {lists.map((l) => (
                <li key={l.id}>{l.text}</li>
              ))}
            </ul>
            <a href="#contact" className="btn block">
              {block.link || t("contact.link", "Получить консультацию")}
            </a>
          </article>

          {/* Right — installment partner info */}
          <article className="card cb-cost-right">
            <h3>{block.rightTitle}</h3>
            {rightTexts.map((txt, i) => (
              <p key={i}>{txt}</p>
            ))}
            <a href="#contact" className="btn">
              {block.link || t("contact.link", "Получить консультацию")}
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
