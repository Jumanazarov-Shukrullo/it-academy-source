import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./CoursePosters.css";

// Home "course selection" — faithful rebuild of the live bespoke poster swiper.
// The live cards are a fixed hand-designed set (NOT CMS-driven): each course has
// its own background (spider_web on black, or grass.svg), decorative art, and
// title treatment. Data + per-card CSS mirror the production build 1:1.
// Live layout: a centered "coverflow" track (middle card biggest), with the two
// round nav arrows BELOW the track — replicated here without a swiper dep.
const POSTERS = [
  { key: "unity", layout: "sub", title: "Unity", arrow: true, img: "/child.png",
    subLeft: "Курс по созданию игр", subRight: "для детей", info: "6 месяцев", to: "/courses" },
  { key: "nodejs", layout: "dark", title: "Node.JS", img: "/brain.png",
    text: "Расширь границы фронтенда с курсом Full stack на JavaScript: серверная разработка на Node.js.", info: "8 месяцев", to: "/web_programming" },
  { key: "scratch", layout: "sub", title: "Scratch", img: "/child_2.png",
    subLeft: "Первые шаги в IT", subRight: "для самых юных", info: "3 месяца", to: "/courses" },
  { key: "datascience", layout: "dark", title: "Data Science", img: "/hand_2.png",
    text: "Научись анализировать данные и строить модели машинного обучения", info: "8 месяцев", to: "/datascience" },
  { key: "graphic", layout: "logo", title: "Графический дизайн", img: "/child_3.png",
    text: "учись создавать крутые проекты", chip: "Дизайн для соцсетей, брендов и веба", info: "8 месяцев", to: "/graphic" },
  { key: "frontend", layout: "dark", title: "Front end", img: "/laptop.png",
    text: "Научись создавать сайты на одном из самых популярных языков программирования", info: "8 месяцев", to: "/web_programming" },
  { key: "comp", layout: "logo", title: "Компьютерная грамотность", img: "/woman.png",
    text: "Стань уверенным пользователем компьютера", info: "3 месяца", to: "/courses" },
  { key: "backend", layout: "dark", title: "Back-end", img: "/balloon_hand.png",
    text: "Научись создавать серверную логику и работать с данными при помощи языка программирования Python", info: "8 месяцев", to: "/python" },
];

export default function CoursePosters() {
  const { t } = useTranslation();
  const more = t("courseSelection.more", "Подробнее");
  const track = useRef(null);
  const drag = useRef({ down: false, x: 0, left: 0, moved: false });

  // coverflow: scale each card down by its distance from the track's centre so
  // whatever sits in the middle is biggest — the live swiper's centred look,
  // done with a rAF scroll handler (max scale 1 ⇒ never overflows vertically).
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = el.scrollLeft + el.clientWidth / 2;
      for (const card of el.children) {
        const c = card.offsetLeft + card.offsetWidth / 2;
        const d = Math.min(1, Math.abs(c - mid) / (el.clientWidth / 2));
        card.style.setProperty("--s", (1 - d * 0.2).toFixed(3));
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const by = (dir) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * 316, behavior: "smooth" });
  };
  const onDown = (e) => {
    const el = track.current;
    drag.current = { down: true, x: e.clientX, left: el.scrollLeft, moved: false };
    el.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d.down) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    track.current.scrollLeft = d.left - dx;
  };
  const onUp = () => { drag.current.down = false; };
  const onClickCapture = (e) => {
    if (!drag.current.moved) return;
    e.preventDefault();
    e.stopPropagation();
    drag.current.moved = false;
  };

  return (
    <div className="cp">
      <div
        ref={track}
        className="cp-track"
        aria-label={t("nav.courses")}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClickCapture={onClickCapture}
      >
        {POSTERS.map((p) => (
          <article
            className={`cp-card cp-${p.key} cp-${p.layout}`}
            key={p.key}
            aria-label={`${p.title} - ${more}`}
          >
            {p.layout === "dark" ? (
              <>
                <img className="cp-art" src={p.img} alt="" loading="lazy" />
                <h3 className="cp-title">{p.title}</h3>
                <p className="cp-text">{p.text}</p>
                <div className="cp-foot">
                  <span className="cp-info">{p.info}</span>
                  <Link className="cp-more" to={p.to}>{more}</Link>
                </div>
              </>
            ) : p.layout === "logo" ? (
              <>
                <img className="cp-art" src={p.img} alt="" loading="lazy" />
                <div className="cp-top">
                  <img className="cp-brand" src="/logo.svg" alt="IT-Academy" />
                  <h3 className="cp-title">{p.title}</h3>
                </div>
                <p className="cp-text">{p.text} {p.chip && <span className="cp-chip">{p.chip}</span>}</p>
                <div className="cp-foot">
                  <span className="cp-info">{p.info}</span>
                  <Link className="cp-more" to={p.to}>{more}</Link>
                </div>
              </>
            ) : (
              <>
                <img className="cp-art" src={p.img} alt="" loading="lazy" />
                <div className="cp-top">
                  <h3 className="cp-title">{p.title}{p.arrow && <img className="cp-arrow" src="/arrows.svg" alt="" />}</h3>
                  <div className="cp-subs">
                    <span className="cp-chip">{p.subLeft}</span>
                    <span className="cp-subr">{p.subRight}</span>
                  </div>
                </div>
                <div className="cp-foot">
                  <span className="cp-info">{p.info}</span>
                  <Link className="cp-more" to={p.to}>{more}</Link>
                </div>
              </>
            )}
          </article>
        ))}
      </div>

      <div className="cp-nav">
        <button type="button" aria-label="Назад" onClick={() => by(-1)}>
          <img src="/left-arrow.png" alt="" width="16" height="16" />
        </button>
        <button type="button" aria-label="Вперёд" onClick={() => by(1)}>
          <img src="/left-arrow.png" alt="" width="16" height="16" style={{ rotate: "180deg" }} />
        </button>
      </div>
    </div>
  );
}
