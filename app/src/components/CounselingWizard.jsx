import { useState } from "react";
import { useTranslation } from "react-i18next";
import { submitLead } from "../api.js";
import { embedUrl } from "../siteVideos.js";
import {
  UZ_PHONE_EXAMPLE,
  UZ_PHONE_MAX_LENGTH,
  UZ_PHONE_PATTERN,
  UZ_PHONE_PLACEHOLDER,
  UZ_PHONE_PREFIX,
  formatUzPhone,
  isUzPhoneComplete,
} from "../phone.js";
import "./CounselingWizard.css";

// Home "Консультация" — faithful 5-step lead wizard (intro → branch → name →
// phone → confirm), wrapped in the live decorative-illustration green band.
// Final step posts the lead to the server-side proxy (/cms/lead.php).
const DECOR = [
  { src: "/woman.png", cls: "cw-d-woman" },
  { src: "/balloon_hand.png", cls: "cw-d-balloon" },
  { src: "/child.png", cls: "cw-d-child" },
  { src: "/child_2.png", cls: "cw-d-child2" },
  { src: "/child_3.png", cls: "cw-d-child3" },
  { src: "/brain.png", cls: "cw-d-brain" },
  { src: "/laptop.png", cls: "cw-d-laptop" },
  { src: "/hand_2.png", cls: "cw-d-hand" },
];

export default function CounselingWizard() {
  const { t } = useTranslation();
  const steps = t("counseling.counselingData", { returnObjects: true });
  const btns = t("counseling.btns", { returnObjects: true });
  const list = Array.isArray(steps) ? steps : [];
  const nextLabel = (Array.isArray(btns) && btns[1]?.text) || "Далее";
  const confirmLabel = (Array.isArray(btns) && btns[0]?.text) || "Подтвердить";

  const [step, setStep] = useState(0);
  const [branch, setBranch] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(UZ_PHONE_PREFIX);
  const [hp, setHp] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | ok | err

  if (list.length === 0) return null;
  const cur = list[step] || {};
  const last = step === list.length - 1;
  const videoSrc = embedUrl("https://www.youtube.com/watch?v=qWn1f6YJYsU");

  const canAdvance =
    step === 0 ? true :
    step === 1 ? !!branch :
    step === 2 ? name.trim().length > 0 :
    step === 3 ? isUzPhoneComplete(phone) :
    true;

  const next = () => canAdvance && setStep((s) => Math.min(s + 1, list.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!isUzPhoneComplete(phone)) return;
    setState("sending");
    try {
      await submitLead({ name, phone, form: "counseling", course: branch, _hp: hp, source: window.location.pathname });
      setState("ok");
    } catch {
      setState("err");
    }
  };

  return (
    <section className="section cw-band">
      <div className="cw-decor" aria-hidden="true">
        {DECOR.map((d) => (
          <img key={d.cls} className={`cw-decor-img ${d.cls}`} src={d.src} alt="" loading="lazy" />
        ))}
      </div>

      <div className="wrap cw-wrap">
        <div className="cw-card">
          {/* numbered step circles (live uses 1–5, not dots) */}
          <div className="cw-steps">
            {list.map((s, i) => (
              <span key={s.id} className={`cw-step${i < step ? " done" : ""}${i === step ? " on" : ""}`}>{i + 1}</span>
            ))}
          </div>

          {state === "ok" ? (
            <p className="lead-ok">{t("contact.successTitle", "Заявка отправлена!")}</p>
          ) : (
            <>
              <h2 className="cw-title">{cur.title}</h2>
              {cur.text && <p className="cw-text">{cur.text}</p>}

              {/* step 1 — branch choice */}
              {step === 1 && (
                <div className="cw-branches">
                  {(Array.isArray(cur.branches) ? cur.branches : []).map((b) => (
                    <button
                      key={b}
                      type="button"
                      className={`cw-branch${branch === b ? " active" : ""}`}
                      onClick={() => setBranch(b)}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}

              {/* step 2 — name */}
              {step === 2 && (
                <input
                  className="cw-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={cur.userName || "Ваше имя"}
                  autoComplete="name"
                  autoFocus
                />
              )}

              {/* step 3 — phone */}
              {step === 3 && (
                <input
                  className="cw-input"
                  value={phone}
                  onChange={(e) => setPhone(formatUzPhone(e.target.value))}
                  placeholder={UZ_PHONE_PLACEHOLDER}
                  pattern={UZ_PHONE_PATTERN}
                  maxLength={UZ_PHONE_MAX_LENGTH}
                  title={`Введите номер телефона, напр. ${UZ_PHONE_EXAMPLE}`}
                  inputMode="tel"
                  autoComplete="tel"
                  autoFocus
                />
              )}

              {/* step 4 — confirm summary */}
              {last && (
                <ul className="cw-summary">
                  {branch && <li>{list[1]?.title}: <b>{branch}</b></li>}
                  {name && <li>{list[2]?.title}: <b>{name}</b></li>}
                  {phone && <li>{list[3]?.title}: <b>{phone}</b></li>}
                </ul>
              )}

              {state === "err" && <p className="lead-err">{t("sendMessage.error", "Ошибка отправки. Попробуйте позже.")}</p>}

              {/* honeypot */}
              <input className="hp" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} aria-hidden="true" />

              <div className="cw-nav">
                {step > 0 && (
                  <button type="button" className="btn ghost sm" onClick={back} disabled={state === "sending"}>
                    ←
                  </button>
                )}
                {last ? (
                  <button type="button" className="btn block" onClick={submit} disabled={state === "sending"}>
                    {state === "sending" ? "…" : confirmLabel}
                  </button>
                ) : (
                  <button type="button" className="btn block" onClick={next} disabled={!canAdvance}>
                    {nextLabel}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        {videoSrc && (
          <div className="cw-video">
            <iframe
              src={videoSrc}
              title="Коротко о нас"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        )}
      </div>
    </section>
  );
}
