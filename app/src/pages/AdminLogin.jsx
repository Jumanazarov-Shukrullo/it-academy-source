import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { login, setToken, getToken } from "../api.js";

export default function AdminLogin() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (getToken()) return <Navigate to="/admin-panel/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const { token } = await login(u, p);
      setToken(token);
      nav("/admin-panel/dashboard");
    } catch {
      setErr(t("admin.loginFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-login">
      <form className="adm-login-card" onSubmit={submit}>
        <div className="adm-login-brand">
          <img src="/logo_2.svg" alt="IT Academy" />
          <span className="adm-badge">ADMIN</span>
        </div>
        <h1>{t("admin.login")}</h1>
        <p className="adm-login-sub">{t("admin.loginSub")}</p>
        <label>{t("admin.username")}
          <input value={u} onChange={(e) => setU(e.target.value)} autoFocus />
        </label>
        <label>{t("admin.password")}
          <input type="password" value={p} onChange={(e) => setP(e.target.value)} />
        </label>
        {err && <div className="err">{err}</div>}
        <button className="btn block" disabled={busy}>{busy ? "…" : t("admin.signIn")}</button>
      </form>
    </div>
  );
}
