import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getSchedule } from "../api.js";

const BRANCHES = ["", "online", "sergeli", "yunusabad"];

export default function Schedule() {
  const { t } = useTranslation();
  const [branch, setBranch] = useState("");
  const [items, setItems] = useState(null);

  useEffect(() => {
    let alive = true;
    getSchedule(branch).then((d) => alive && setItems(d)).catch(() => alive && setItems([]));
    return () => { alive = false; };
  }, [branch]);

  const label = (b) => (b ? t(`schedule.${b}`) : t("schedule.all"));

  return (
    <div className="schedule-page">
      <h1 className="page-title">{t("schedule.title")}</h1>
      <div className="controls">
        <label className="muted">{t("schedule.branch")}:</label>
        <select value={branch} onChange={(e) => setBranch(e.target.value)}>
          {BRANCHES.map((b) => (
            <option key={b || "all"} value={b}>{label(b)}</option>
          ))}
        </select>
      </div>

      {items === null ? (
        <p className="muted">{t("portal.loading")}</p>
      ) : items.length === 0 ? (
        <p className="muted">{t("schedule.empty")}</p>
      ) : (
        <table aria-label={t("schedule.title")}>
          <thead>
            <tr>
              <th>{t("schedule.branch")}</th>
              <th>{t("schedule.course")}</th>
              <th>{t("schedule.days")}</th>
              <th>{t("schedule.time")}</th>
              <th>{t("schedule.start")}</th>
              <th>{t("schedule.duration")}</th>
              <th>{t("schedule.discount")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{t(`schedule.${it.branch}`, it.branch)}</td>
                <td>{it.course}</td>
                <td>{it.days || "—"}</td>
                <td>{it.time_from ? `${it.time_from}–${it.time_to || ""}` : "—"}</td>
                <td>{it.start_date || "—"}</td>
                <td>{it.duration_months ? `${it.duration_months} ${t("schedule.months")}` : "—"}</td>
                <td>{it.discount ? <span className="tag">{it.discount}</span> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
