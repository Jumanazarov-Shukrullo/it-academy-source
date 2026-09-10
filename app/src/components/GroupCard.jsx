import { useTranslation } from "react-i18next";
import { activeDays, DOW } from "./days.js";

const BRANCH_KEY = { online: "online", sergeli: "sergeli", yunusabad: "yunusabad" };

// Schedule "Ближайшие группы" card — shared by Home and the course pages so they
// stay visually identical. Faithful to live: badge + day-pill timetable on top,
// course text + enroll CTA below.
export default function GroupCard({ g }) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language?.startsWith("uz") ? "uz" : "ru";
  const active = activeDays(g.days);
  // Live shows the start date as a DD.MM.YYYY chip beside the branch (not "Старт: …").
  const date = g.start_date ? g.start_date.split("-").reverse().join(".") : null;

  return (
    <article className="group-card">
      <div className="group-head">
        <div className="group-badges">
          <span className="group-badge">{t(`schedule.${BRANCH_KEY[g.branch] || g.branch}`, g.branch)}</span>
          {date && <span className="group-date">{date}</span>}
          {g.discount && <span className="group-date discount">{g.discount}</span>}
        </div>
        <div className="timetable">
          {DOW.map((d, i) => (
            <span key={d.lbl} className={`day-chip${active[i] ? " active" : ""}`}>{d.lbl}</span>
          ))}
          {(g.time_from || g.time_to) && (
            <span className="tt-cell">{g.time_from}{g.time_to ? ` - ${g.time_to}` : ""}</span>
          )}
          {g.duration_months ? <span className="tt-cell">{g.duration_months} {t("schedule.months", "мес.")}</span> : null}
        </div>
      </div>
      <div className="group-body">
        <div className="group-main">
          <h3>{g.course}</h3>
          {g[`description_${lng}`] && <p className="group-desc">{g[`description_${lng}`]}</p>}
        </div>
        <a href="#contact" className="btn group-cta">{t("schedule.enroll", "Записаться на курс")}</a>
      </div>
    </article>
  );
}
