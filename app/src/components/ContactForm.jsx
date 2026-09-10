import { useState } from "react";
import { useTranslation } from "react-i18next";
import { submitLead } from "../api.js";
import {
  UZ_PHONE_EXAMPLE,
  UZ_PHONE_MAX_LENGTH,
  UZ_PHONE_PATTERN,
  UZ_PHONE_PLACEHOLDER,
  UZ_PHONE_PREFIX,
  formatUzPhone,
  isUzPhoneComplete,
} from "../phone.js";

// Lead form -> /cms/lead.php, which stores the submission in the `leads` table
// (read in the admin panel). Reused on the homepage (light + dark) and course pages.
export default function ContactForm({ light = false, title, form = "", submitLabel, agree = false, courseContact = false }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(courseContact ? "" : UZ_PHONE_PREFIX);
  const [telegram, setTelegram] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [hp, setHp] = useState("");          // honeypot
  const [state, setState] = useState("idle"); // idle | sending | ok | err

  const submit = async (e) => {
    e.preventDefault();
    if (agree && !agreed) return;
    if (!isUzPhoneComplete(phone)) return;
    setState("sending");
    try {
      await submitLead({
        name,
        phone,
        form,
        course: telegram ? `Telegram: ${telegram}` : "",
        _hp: hp,
        source: window.location.pathname,
      });
      setState("ok");
    } catch {
      setState("err");
    }
  };

  return (
    <div className={`lead-card${light ? " light" : ""}`}>
      {title !== "" && (
        <>
          <h2>{title || t("contact.title")}</h2>
          <p className="lead-sub">{t("contact.text")}</p>
        </>
      )}

      {state === "ok" ? (
        <p className="lead-ok">{t("contact.successTitle", "Заявка отправлена!")}</p>
      ) : courseContact ? (
        <form className="course-contact-form" onSubmit={submit}>
          {state === "err" && <p className="lead-err">{t("sendMessage.error", "Ошибка отправки. Попробуйте позже.")}</p>}
          <div className="course-contact-fields">
            <input
              className="course-contact-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("contact.userName", "Ваше Имя")}
              autoComplete="name"
            />
            <div className="course-contact-phone">
              <span className="course-contact-flag" aria-hidden="true">
                <img src="/uzbekistan-flag.svg" alt="" />
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatUzPhone(e.target.value))}
                placeholder={UZ_PHONE_EXAMPLE.replaceAll("-", " ")}
                pattern={UZ_PHONE_PATTERN}
                maxLength={UZ_PHONE_MAX_LENGTH}
                title={`Введите номер телефона, напр. ${UZ_PHONE_EXAMPLE}`}
                inputMode="tel"
                autoComplete="tel"
                required
              />
            </div>
            <input
              className="course-contact-input"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="@telegram"
              autoComplete="off"
            />
          </div>
          <input className="hp" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} aria-hidden="true" />
          <button className="course-contact-submit" disabled={state === "sending"}>
            {state === "sending" ? "…" : submitLabel || t("contact.submit", t("contact.link", "Оставить заявку"))}
          </button>
        </form>
      ) : (
        <form onSubmit={submit}>
          {state === "err" && <p className="lead-err">{t("sendMessage.error", "Ошибка отправки. Попробуйте позже.")}</p>}
          <label className="field">
            {t("contact.userName", "Ваше имя")}
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <label className="field">
            {t("contact.phone", "Телефон")}
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatUzPhone(e.target.value))}
              placeholder={UZ_PHONE_PLACEHOLDER}
              pattern={UZ_PHONE_PATTERN}
              maxLength={UZ_PHONE_MAX_LENGTH}
              title={`Введите номер телефона, напр. ${UZ_PHONE_EXAMPLE}`}
              inputMode="tel"
              autoComplete="tel"
              required
            />
          </label>
          {/* honeypot — hidden from users, bots fill it */}
          <input className="hp" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} aria-hidden="true" />
          {agree && (
            <label className="field-check">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required />
              <span>{t("contact.agree", "Согласен на обработку персональных данных")}</span>
            </label>
          )}
          <button className="btn block" disabled={state === "sending" || (agree && !agreed)}>
            {state === "sending" ? "…" : submitLabel || t("contact.submit", t("contact.link", "Оставить заявку"))}
          </button>
        </form>
      )}
    </div>
  );
}
