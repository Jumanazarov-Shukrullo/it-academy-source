import "./NewsStories.css";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getNewsById } from "../api.js";

// /news_stories/:id — single article rendered from the CMS `news` row (DB).
// body_* is plain text from the admin textarea: blank-line-separated blocks.
// A block that is a lone image path becomes an inline <img>; a block starting
// with "## " becomes a section heading — matching the live article layout.
// ponytail: tiny markup over a rich-text editor; admins type plain text.
const IMG_RE = /^\/?[\w./-]+\.(?:jpe?g|png|webp|gif|svg)$/i;

function LegacyStory({ story }) {
  return (
    <>
      <section className="ns-legacy ns-legacy-1">
        <h2 className="ns-legacy-title">{story.title_1}</h2>
        <div className="ns-legacy-block">
          <p className="ns-legacy-text">{story.text_1}</p>
          <img className="ns-legacy-img" src={story.img_1} alt="" loading="lazy" />
        </div>
        <p className="ns-legacy-text">{story.text_2}</p>
      </section>

      <section className="ns-legacy ns-legacy-2">
        <h2 className="ns-legacy-title">{story.title_2}</h2>
        <div className="ns-legacy-block">
          <p className="ns-legacy-text">{story.text_3}</p>
          <p className="ns-legacy-text">{story.text_4}</p>
          <p className="ns-legacy-text">{story.text_5}</p>
        </div>
      </section>

      <section
        className="ns-legacy ns-legacy-3"
        style={{ background: "url(/news_stories_2.jpg) no-repeat center 30% / contain" }}
      >
        <h2 className="ns-legacy-title">{story.title_3}</h2>
        <div className="ns-legacy-block">
          <p className="ns-legacy-text">{story.text_6}</p>
          <p className="ns-legacy-text">{story.text_7}</p>
          <p className="ns-legacy-text">{story.text_8}</p>
        </div>
      </section>

      <section className="ns-legacy ns-legacy-4">
        <p className="ns-legacy-text">{story.text_9}</p>
        <p className="ns-legacy-text">{story.text_10}</p>
        <p className="ns-legacy-text">{story.text_11}</p>
      </section>

      <section className="ns-legacy ns-legacy-5">
        <div className="ns-legacy-block">
          <div className="ns-legacy-box">
            <p className="ns-legacy-text">{story.text_12}</p>
            <p className="ns-legacy-text">{story.text_13}</p>
          </div>
          <img className="ns-legacy-img" src={story.img_3} alt="" loading="lazy" />
        </div>
        <p className="ns-legacy-text">{story.text_14}</p>
      </section>
    </>
  );
}

export default function NewsStories() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const lng = i18n.language?.startsWith("uz") ? "uz" : "ru";
  const [item, setItem] = useState(undefined); // undefined = loading, null = not found
  const legacy = t("newsStories", { returnObjects: true });
  const legacyStory = Array.isArray(legacy) ? legacy.find((story) => story.id === Number(id)) : null;
  const shouldRenderLegacy = Number(id) === 2 && !!legacyStory;

  useEffect(() => {
    if (shouldRenderLegacy) return;
    setItem(undefined);
    getNewsById(id).then((n) => setItem(n || null)).catch(() => setItem(null));
  }, [id, shouldRenderLegacy]);

  if (shouldRenderLegacy) {
    return <LegacyStory story={legacyStory} />;
  }

  if (item === undefined) return null; // brief load; layout shell is already shown

  if (!item) {
    return (
      <section className="section">
        <div className="wrap">
          <div className="ns-404">
            <h1>404</h1>
            <p>{t("notFound.text")}</p>
            <Link className="btn ghost" to="/">{t("notFound.link")}</Link>
          </div>
        </div>
      </section>
    );
  }

  const title = item[`title_${lng}`] || item.title_ru;
  const excerpt = item[`excerpt_${lng}`] || item.excerpt_ru;
  const body = (item[`body_${lng}`] || item.body_ru || "").trim();
  const blocks = body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  return (
    <section className="section">
      <div className="wrap">
        <article className="ns-article">
          <h1 className="ns-title">{title}</h1>

          {/* No body yet (e.g. the live site's "под разработкой" posts): show the
              cover + excerpt so the page reads as a short post, not a blank shell. */}
          {blocks.length === 0 && item.cover_image && (
            <img className="ns-cover" src={`/${item.cover_image}`} alt="" />
          )}
          {blocks.length === 0 && excerpt && <p>{excerpt}</p>}

          {blocks.map((b, i) => {
            if (IMG_RE.test(b))
              return <img className="ns-img" key={i} src={b.startsWith("/") ? b : `/${b}`} alt="" loading="lazy" />;
            if (b.startsWith("## "))
              return <h2 className="ns-h2" key={i}>{b.slice(3)}</h2>;
            return <p key={i}>{b}</p>;
          })}
        </article>
      </div>
    </section>
  );
}
