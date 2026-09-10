import { useEffect, useState } from "react";
import ContactForm from "../components/ContactForm.jsx";
import "./OpenDay.css";

// /openday — hardcoded RU lead-gen page (emoji-only, no images), matching the
// original `wne()`. Hero + registration form (shared proxy ContactForm) + a
// floating gift popup that appears after ~2s and scrolls to the form.
export default function OpenDay() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowPopup(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const scrollToForm = () => {
    setShowPopup(false);
    document.getElementById("contact")?.scrollIntoView({ behavior: "auto" });
  };

  return (
    <>
      <section className="section od-hero">
        <div className="wrap">
          <span className="od-emoji">🎁</span>
          <h1>Запишись на OpenDay</h1>
          <p>
            День открытых дверей в IT Academy — твой шанс познакомиться с нами,
            узнать о программах обучения и выиграть подарки.
          </p>
        </div>
      </section>

      <section className="section od-form-section" id="contact">
        <div className="wrap">
          <ContactForm form="openday" submitLabel="🚀 Отправить заявку" agree title="" />
          <p className="od-note">
            Места ограничены. Номерок для участия в лотерее выдаётся при
            регистрации на входе.
          </p>
        </div>
      </section>

      {showPopup && (
        <div className="od-popup" role="dialog" aria-label="Open Day">
          <button
            className="od-close"
            type="button"
            aria-label="Закрыть"
            onClick={() => setShowPopup(false)}
          >
            ×
          </button>
          <div className="od-gift">🎁</div>
          <h3>Open Day 🎉</h3>
          <p>Прими участие и получи шанс выиграть бесплатный курс!</p>
          <ul className="od-tracks">
            <li>Frontend</li>
            <li>Backend</li>
            <li>Unity</li>
          </ul>
          <button className="btn block sm" type="button" onClick={scrollToForm}>
            🚀 Участвовать
          </button>
        </div>
      )}
    </>
  );
}
