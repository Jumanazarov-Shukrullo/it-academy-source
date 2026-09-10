import { useTranslation } from "react-i18next";

// The real public offer is the footer-linked PDF. This route just surfaces it.
const PDF = "/Публичная оферта 2025.pdf";

export default function Oferta() {
  const { t } = useTranslation();
  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 720 }}>
        <h1 className="section-title">{t("footer.footerRouter.3.text", "Оферта")}</h1>
        <p className="section-lead">
          {t("oferta.text", "Публичная оферта IT Academy (PDF).")}
        </p>
        <div className="center-cta">
          <a className="btn" href={PDF} target="_blank" rel="noreferrer">
            {t("oferta.open", "Открыть оферту (PDF)")}
          </a>
        </div>
      </div>
    </section>
  );
}
