import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getStudent, getAttendance, getPayments, getToken } from "../api.js";

// Reads the hardened /api. Since /api is now admin-gated (fail-closed), the
// portal requires an admin token — public student self-service needs a
// student-auth design (see PLAN Phase 4 / the open question).
export default function StudentPortal() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [data, setData] = useState({ student: null, attendance: null, payments: null });
  const [err, setErr] = useState("");
  const hasToken = !!getToken();

  useEffect(() => {
    if (!hasToken) return;
    let alive = true;
    Promise.allSettled([getStudent(id), getAttendance(id), getPayments(id)])
      .then(([s, a, p]) => {
        if (!alive) return;
        setData({
          student: s.status === "fulfilled" ? s.value : null,
          attendance: a.status === "fulfilled" ? (a.value.EdUnitStudentReports || []) : [],
          payments: p.status === "fulfilled" ? (p.value.Payments || []) : [],
        });
      })
      .catch(() => alive && setErr(t("portal.error")));
    return () => { alive = false; };
  }, [id, hasToken, t]);

  if (!hasToken) {
    return (
      <div className="center panel portal-page portal-page--auth">
        <h1 className="page">{t("portal.title")}</h1>
        <p className="muted">{t("portal.needAuth")}</p>
        <Link className="btn" to="/admin-panel">{t("admin.signIn")}</Link>
      </div>
    );
  }

  const s = data.student;
  const studentName = s
    ? (s.FullName || [s.LastName, s.FirstName].filter(Boolean).join(" ") || `#${id}`)
    : null;

  return (
    <div className="portal-page">
      <h1 className="page">{t("portal.title")}</h1>
      {err && <div className="err">{err}</div>}
      {s === null ? (
        <p className="muted">{t("portal.loading")}</p>
      ) : (
        <>
          <div className="panel" style={{ marginBottom: 24 }}>
            <strong>{studentName}</strong>
            <div className="muted">ID: {id}</div>
          </div>

          <h2>{t("portal.attendance")}</h2>
          <p className="muted">{(data.attendance || []).length} records</p>

          <h2>{t("portal.payments")}</h2>
          <table className="adm-responsive-table">
            <thead><tr><th>#</th><th>Date</th><th>Sum</th></tr></thead>
            <tbody>
              {(data.payments || []).map((p, i) => (
                <tr key={i}>
                  <td className="muted" data-label="ID">{p.Id ?? i}</td>
                  <td data-label={t("admin.paymentDate")}>{p.Date || p.PaymentDate || "—"}</td>
                  <td data-label={t("admin.paymentSum")}>{p.Sum ?? p.Value ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
