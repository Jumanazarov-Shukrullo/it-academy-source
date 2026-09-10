import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getStudents } from "../api.js";

// HolliHop returns { Students: [...] } with PascalCase fields; render defensively.
export default function AdminStudents() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");

  const load = (s) => {
    setRows(null); setErr("");
    getStudents(s)
      .then((d) => setRows(d.Students || d.students || []))
      .catch(() => setErr(t("portal.error")));
  };
  useEffect(() => { load(""); }, []);

  const id = (s) => s.ClientId ?? s.Id ?? s.id;
  const name = (s) =>
    s.FullName || [s.LastName, s.FirstName, s.MiddleName].filter(Boolean).join(" ") || `#${id(s)}`;

  return (
    <div>
      <form className="controls" onSubmit={(e) => { e.preventDefault(); load(search); }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="…" />
        <button className="btn">🔍</button>
      </form>

      {err && <div className="err">{err}</div>}
      {rows === null && !err ? (
        <p className="muted">{t("portal.loading")}</p>
      ) : rows && (
        <table className="adm-responsive-table">
          <thead><tr><th>ID</th><th>{t("admin.students")}</th><th></th></tr></thead>
          <tbody>
            {rows.map((s) => (
              <tr key={id(s)}>
                <td className="muted" data-label="ID">{id(s)}</td>
                <td data-label={t("admin.students")}>{name(s)}</td>
                <td className="row-actions" data-label={t("admin.actions")}><Link className="linkbtn" to={`/admin-panel/student/${id(s)}`}>→</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
