import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="center panel">
      <h1 className="page">404</h1>
      <Link className="btn ghost" to="/">{t("stub.back")}</Link>
    </div>
  );
}
