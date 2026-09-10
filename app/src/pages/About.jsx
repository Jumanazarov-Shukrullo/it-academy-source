import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getTeachers } from "../api.js";
import "./About.css";

// /about — standalone, hardcoded RU copy from the production bundle.

const GOALS = [
  { img: "/aziz_teacher.png", alt: "Учеба", title: "Обучение", text: "Актуальные IT-профессии и навыки на русском и узбекском." },
  { img: "/brain.png", alt: "Тесты", title: "Тесты и практика", text: "Проекты, домашние задания, дипломные работы." },
  { img: "/woman.png", alt: "Стажировка", title: "Стажировка", text: "Опыт в реальных компаниях и стартапах." },
  { img: "/About3.png", alt: "Работа", title: "Трудоустройство", text: "Помощь с CV, подготовка к собеседованию и выход на рынок." },
];

const DEMAND = [
  { tone: "dark", title: "💰 Высокооплачиваемо", text: "Средняя зарплата начинающего специалиста от 6 млн сум, через 2–3 года — от 12–15 млн." },
  { tone: "light", title: "📈 Востребовано", text: "IT-компании Узбекистана открывают сотни вакансий ежемесячно." },
  { tone: "light", title: "🌍 Перспективно", text: "IT — глобальная сфера: навыки востребованы в любой стране." },
];

const WHY = [
  { img: "/camp-for-1.jpg", alt: "Практика", title: "Практика с первого дня", text: "Каждый студент работает над реальными проектами и пополняет портфолио уже в процессе обучения." },
  { img: "/aziz_teacher.png", alt: "Преподаватели", title: "Преподаватели-практики", text: "Наши менторы — специалисты из индустрии с опытом в международных проектах." },
  { img: "/good_for_it_3.jpg", alt: "Комьюнити", title: "Комьюнити и атмосфера", text: "Общайся, работай и учись в коворкинге вместе с единомышленниками." },
];

const CAMPUSES = [
  { img: "/yunusabad.jpg", name: "Филиал Юнусабад", addr: "ул. Шахрисабз, 7" },
  { img: "/sergeli.jpg", name: "Филиал Сергели", addr: "Сергели-6, 110B" },
];

function assetSrc(value) {
  if (!value) return "";
  if (/^https?:\/\//.test(value)) return value;
  const path = String(value).replace(/^\/+/, "");
  if (path.includes("..") || !/^[\w][\w./-]*$/.test(path)) return "";
  return `/${path}`;
}

export default function About() {
  const { t, i18n } = useTranslation();
  const [teachers, setTeachers] = useState(null);
  const lang = i18n.language?.startsWith("uz") ? "uz" : "ru";

  useEffect(() => {
    let alive = true;
    getTeachers().then((items) => alive && setTeachers(items)).catch(() => alive && setTeachers([]));
    return () => { alive = false; };
  }, []);

  const local = (teacher, field) => teacher[`${field}_${lang}`] || teacher[`${field}_ru`] || "";

  return (
    <section className="ab-about">
      <div className="ab-container">
          <div className="ab-hero">
            <h1><span>IT Academy</span> в Ташкенте</h1>
            <p>
              Образовательная IT-платформа, где каждый может освоить востребованную
              профессию с нуля: Frontend, Backend, Python, Unity, Data Science и
              графический дизайн. <br />
              Более <strong>13 000 выпускников</strong> уже доверились нам.
            </p>
            <Link to="/#contact" className="btn">🚀 Записаться на бесплатный урок</Link>
          </div>

          <div className="ab-goals">
          <h2>Наша цель — твоя карьера</h2>
          <div className="ab-grid">
            {GOALS.map((g) => (
              <article className="ab-card" key={g.title}>
                <img src={g.img} alt={g.alt} loading="lazy" />
                <h3>{g.title}</h3>
                <p>{g.text}</p>
              </article>
            ))}
          </div>
          </div>

          <div className="ab-demand">
          <h2>Почему IT — это перспективно?</h2>
          <div className="ab-demand-grid">
            {DEMAND.map((d) => (
              <article className={`ab-demand-card ${d.tone}`} key={d.title}>
                <h3>{d.title}</h3>
                <p>{d.text}</p>
              </article>
            ))}
          </div>
          </div>

          <div className="ab-why">
          <h2>Почему выбирают IT Academy?</h2>
          <div className="ab-why-grid">
            {WHY.map((w) => (
              <article className="ab-card" key={w.title}>
                <img src={w.img} alt={w.alt} loading="lazy" />
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </article>
            ))}
          </div>
          </div>

          {teachers?.length > 0 && (
            <div className="ab-teachers" id="teachers">
              <div className="ab-teachers-head">
                <p>{t("teachers.kicker")}</p>
                <h2>{t("teachers.title")}</h2>
              </div>
              <div className="ab-teacher-grid">
                {teachers.map((teacher) => {
                  const photo = assetSrc(teacher.photo);
                  const role = local(teacher, "role");
                  const bio = local(teacher, "bio");
                  return (
                    <article className="ab-teacher-card" key={teacher.id}>
                      {photo ? <img src={photo} alt={teacher.name} loading="lazy" /> : <div className="ab-teacher-placeholder" aria-hidden="true">{teacher.name.slice(0, 1)}</div>}
                      <div>
                        <h3>{teacher.name}</h3>
                        {role && <p className="ab-teacher-role">{role}</p>}
                        {bio && <p className="ab-teacher-bio">{bio}</p>}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          <div className="ab-campuses">
          <h2>Наши филиалы</h2>
          <div className="ab-campus-grid">
            {CAMPUSES.map((c) => (
              <div className="ab-campus-card" key={c.img}>
                <div className="ab-campus-img">
                  <img src={c.img} alt={c.name.replace("Филиал ", "")} loading="lazy" />
                </div>
                <h4>{c.name}</h4>
                <p>{c.addr}</p>
              </div>
            ))}
          </div>
          </div>

          <div className="ab-final">
            <h2>Сделай первый шаг в IT уже сегодня!</h2>
            <Link to="/#contact" className="btn">🚀 Начать обучение</Link>
          </div>
        </div>
      </section>
  );
}
