import "./Vacancy.css";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getVacancies } from "../api.js";
import ContactForm from "../components/ContactForm.jsx";

// /vacancy — hardcoded RU per docs/site-map.md "## /vacancy".
// Hero (LG) + CMS-driven team/vacancy cards (VG) + contact (Nl).
// Cards come from getVacancies(); if the CMS is empty/unreachable we fall
// back to the 6 original listings so the page is never blank.
const FALLBACK = [
  { id: "f1", title_ru: "Администратор", location: "ул.Шахрисабз 7", image: "vacancy-admin.png" },
  { id: "f2", title_ru: "Менеджер по продажам", location: "ул.Шахрисабз 7", image: "vacancy-card-1.jpg" },
  { id: "f3", title_ru: "Преподаватель Ai", location: "ул.Шахрисабз 7", image: "vacancy-card-2.jpg" },
  { id: "f4", title_ru: "Преподаватель по графическому дизайну", location: "ул.Шахрисабз 7", image: "vacancy-card-3.jpg" },
  { id: "f5", title_ru: "Преподаватель английского языка", location: "Сергели, Массив 6А", image: "vacancy-card-4.jpg" },
  { id: "f6", title_ru: "Преподаватель Back-end", location: "ул.Шахрисабз 7 и Сергели, Массив 6А", image: "vacancy-card-5.jpg" },
];

export default function Vacancy() {
  const { t, i18n } = useTranslation();
  const lng = i18n.language?.startsWith("uz") ? "uz" : "ru";
  const [items, setItems] = useState(null);

  useEffect(() => {
    let alive = true;
    getVacancies()
      .then((d) => alive && setItems(Array.isArray(d) && d.length ? d : FALLBACK))
      .catch(() => alive && setItems(FALLBACK));
    return () => { alive = false; };
  }, []);

  const list = items === null ? FALLBACK : items;

  return (
    <>
      {/* Hero (LG) — hardcoded RU */}
      <section className="vac-hero">
        <div className="wrap">
          <div className="vac-hero-inner">
            <h1>ВАКАНСИИ</h1>
            <p>Стань частью команды, которая строит будущее в IT-образовании</p>
            <div className="vac-hero-cta">
              <a className="btn" href="#vacancyTeam">Смотреть вакансии</a>
              <a className="btn ghost" href="#contact">Откликнуться</a>
            </div>
          </div>
        </div>
      </section>

      {/* Team / vacancy cards (VG) */}
      <section className="section" id="vacancyTeam">
        <div className="wrap">
          <div className="vac-team-title">
            <span className="vac-pill">СТАНЬ ЧАСТЬЮ</span>
            <span className="vac-pill lime-pill">НАШЕЙ КОМАНДЫ</span>
          </div>

          {list.length === 0 ? (
            <p className="section-lead">Сейчас открытых вакансий нет. Оставьте заявку — мы свяжемся с вами.</p>
          ) : (
            <div className="cards">
              {list.map((v) => (
                <article key={v.id} className="card vac-card">
                  {v.image && (
                    <img className="card-img" src={`/${v.image}`} alt="" loading="lazy" />
                  )}
                  <h3>{v[`title_${lng}`] || v.title_ru}</h3>
                  <p className="vac-loc">{v[`location_${lng}`] || v.location || v.location_ru || ""}</p>
                  {v.apply_url ? (
                    <a className="btn sm" href={v.apply_url} target="_blank" rel="noreferrer">Откликнуться</a>
                  ) : (
                    <a className="btn sm" href="#contact">Откликнуться</a>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact (Nl) */}
      <section className="section counsel" id="contact">
        <div className="wrap">
          <ContactForm title={t("contact.title")} form="vacancy" submitLabel={t("contact.link")} />
        </div>
      </section>
    </>
  );
}
