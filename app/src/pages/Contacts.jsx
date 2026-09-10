import { useTranslation } from "react-i18next";
import ContactForm from "../components/ContactForm.jsx";

const PinIcon = () => (
  <svg className="c-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const PhoneIcon = () => (
  <svg className="c-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

// The original /contacts was an empty div; contact info lives in the footer.
// Rebuilt from that data + the shared lead form.
export default function Contacts() {
  const { t } = useTranslation();
  const help = t("footer.footerHelp", { returnObjects: true }) || {};

  return (
    <>
      <section className="section">
        <div className="wrap">
          <h1 className="section-title">{help.title || t("nav.contacts", "Контакты")}</h1>
          <div className="cards">
            {Array.isArray(help.contentItems) && help.contentItems.map((c) => (
              <div className="card" key={c.id}>
                <PinIcon />
                <p>{c.text}</p>
              </div>
            ))}
            <div className="card">
              <PhoneIcon />
              {Array.isArray(help.contacts) && help.contacts.map((c) => (
                <p key={c.href}><a href={`tel:${c.href}`}>{c.title}</a></p>
              ))}
              {help.telegram && (
                <p>
                  <a href={`https://t.me/${help.telegram.handle}`} target="_blank" rel="noreferrer">
                    Telegram: @{help.telegram.handle}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section counsel" id="contact">
        <div className="wrap"><ContactForm title={t("contact.title")} form="contacts" /></div>
      </section>
    </>
  );
}
