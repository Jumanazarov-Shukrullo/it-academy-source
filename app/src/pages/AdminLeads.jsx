import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLeads, deleteLead } from "../api.js";

// Contact/consultation form submissions (stored in the `leads` table).
export default function AdminLeads() {
  const { t } = useTranslation();
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");

  const load = () => {
    setRows(null); setErr("");
    getLeads().then((items) => setRows(items || [])).catch(() => setErr(t("portal.error")));
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm(t("admin.confirmDelete"))) return;
    await deleteLead(id);
    setRows((r) => r.filter((x) => x.id !== id));
  };

  return (
    <div>
      {err && <div className="err">{err}</div>}
      {rows === null && !err ? (
        <p className="muted">{t("portal.loading")}</p>
      ) : rows && rows.length === 0 ? (
        <p className="muted">{t("admin.leadsEmpty")}</p>
      ) : rows && (
        <table className="adm-responsive-table">
          <thead>
            <tr>
              <th>{t("admin.leadDate")}</th>
              <th>{t("admin.leadName")}</th>
              <th>{t("admin.leadPhone")}</th>
              <th>{t("admin.leadCourse")}</th>
              <th>{t("admin.leadForm")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id}>
                <td className="muted" data-label={t("admin.leadDate")}>{l.created_at}</td>
                <td data-label={t("admin.leadName")}>{l.name}</td>
                <td data-label={t("admin.leadPhone")}><a href={`tel:${l.phone}`}>{l.phone}</a></td>
                <td data-label={t("admin.leadCourse")}>{l.course}</td>
                <td className="muted" data-label={t("admin.leadForm")}>{l.form}{l.source ? ` · ${l.source}` : ""}</td>
                <td className="row-actions" data-label={t("admin.actions")}>
                  <button className="linkbtn adm-del" title={t("admin.delete")} onClick={() => remove(l.id)}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
