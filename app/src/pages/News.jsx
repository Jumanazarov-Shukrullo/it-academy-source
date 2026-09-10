import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getNews } from "../api.js";

const assetSrc = (value) => {
  if (!value) return "";
  return String(value).startsWith("/") ? value : `/${value}`;
};

export default function News() {
  const { t, i18n } = useTranslation();
  const lng = i18n.language?.startsWith("uz") ? "uz" : "ru";
  const [news, setNews] = useState([]);

  useEffect(() => {
    getNews().then(setNews).catch(() => {});
  }, []);

  const fallbackNews = t("news.newsData", { returnObjects: true });
  const rows = news.length > 0
    ? news
    : (Array.isArray(fallbackNews)
      ? fallbackNews.map((n) => ({
        id: n.id,
        cover_image: n.src,
        title_ru: n.title,
        title_uz: n.title,
        excerpt_ru: n.text,
        excerpt_uz: n.text,
      }))
      : []);

  return (
    <section className="section news-list-page">
      <div className="wrap">
        <h1 className="section-title">{t("news.title", "Новости IT-Academy")}</h1>
        <div className="news-grid">
          {rows.map((n) => (
            <Link className="news-card" key={n.id} to={`/news_stories/${n.id}`}>
              {n.cover_image && <img src={assetSrc(n.cover_image)} alt="" loading="lazy" />}
              <div className="news-body">
                <h3>{n[`title_${lng}`] || n.title_ru}</h3>
                {n[`excerpt_${lng}`] && <p>{n[`excerpt_${lng}`]}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
