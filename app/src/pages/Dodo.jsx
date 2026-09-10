import "./Dodo.css";

// /dodo — co-branded Dodo Pizza × IT-Academy promo page.
// Hardcoded RU (this page's copy is not in i18n), faithful to the original.

const RULES_RU = "/ПРАВИЛА_ПРОВЕДЕНИЯ_АКЦИИ_DODO_IT_PROMO_1.pdf";
const RULES_UZ = "/DODO%20IT%20PROMO%20AKSIYASI%20QOIDALARI.pdf";

export default function Dodo() {
  const scrollDown = () => {
    window.scrollTo({ top: window.scrollY + 400, behavior: "auto" });
  };

  return (
    <div className="dodo">
      {/* Decorative backdrop — CSS rings + bezier svg + sparkles, no images */}
      <div className="dodo-backdrop" aria-hidden="true">
        <span className="dodo-ring r1" />
        <span className="dodo-ring r2" />
        <span className="dodo-ring r3" />
        <svg className="dodo-curves" viewBox="0 0 1180 700" preserveAspectRatio="none">
          <path
            d="M-20 540 C 260 420, 520 660, 820 480 S 1180 360, 1220 460"
            fill="none"
            stroke="rgba(255,105,0,0.16)"
            strokeWidth="2"
          />
          <path
            d="M-20 180 C 200 80, 480 260, 760 120 S 1140 40, 1220 160"
            fill="none"
            stroke="rgba(175,255,66,0.12)"
            strokeWidth="2"
          />
        </svg>
        <span className="dodo-sparkle s1">✦</span>
        <span className="dodo-sparkle s2">✦</span>
        <span className="dodo-sparkle s3">✦</span>
      </div>

      {/* Hero */}
      <section className="section dodo-hero">
        <div className="wrap">
          <div className="dodo-cobrand">
            <img src="/dodo-logo.jpg" alt="Dodo Pizza" />
            <span className="dodo-x">×</span>
            <img src="/academy-logo.png" alt="IT-Academy" />
          </div>
          <p className="dodo-cobrand-text">DODO PIZZA × IT-ACADEMY</p>
          <h1 className="dodo-h1">
            КОМБО <span className="dodo-lime">TALABA</span>
          </h1>
          <p className="dodo-sub">Выиграй доступ к IT-обучению</p>
          <p className="dodo-lead">
            Закажи акционное комбо в Dodo Pizza и получи шанс обучаться в
            IT-Academy бесплатно
          </p>
          <button type="button" className="dodo-btn" onClick={scrollDown}>
            Принять участие
          </button>
        </div>
      </section>

      {/* How to participate */}
      <section className="section" id="how">
        <div className="wrap">
          <p className="dodo-eyebrow">КАК УЧАСТВОВАТЬ</p>
          <h2 className="section-title">Как участвовать</h2>
          <p className="section-lead">Три простых шага, чтобы принять участие в розыгрыше.</p>
          <div className="dodo-steps">
            <div className="dodo-step">
              <span className="dodo-step-num">1</span>
              <h3>Закажи Combo Talaba</h3>
              <p>
                Оформи акционное комбо «Combo Talaba» в Dodo Pizza — в ресторане,
                на сайте или в приложении.
              </p>
            </div>
            <div className="dodo-step">
              <span className="dodo-step-num">2</span>
              <h3>Укажи номер телефона</h3>
              <p>
                При заказе укажи свой номер телефона — он станет твоим билетом для
                участия в розыгрыше.
              </p>
            </div>
            <div className="dodo-step">
              <span className="dodo-step-num">3</span>
              <h3>Следи за результатами</h3>
              <p>
                Следи за результатами розыгрыша в Instagram{" "}
                <a
                  href="https://instagram.com/dodopizzauzb/"
                  target="_blank"
                  rel="noreferrer"
                >
                  @dodopizzauzb
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conditions / docs */}
      <section className="section" id="docs">
        <div className="wrap">
          <p className="dodo-eyebrow">УСЛОВИЯ</p>
          <h2 className="section-title">
            Условия <span className="lime">акции</span>
          </h2>
          <p className="section-lead">Официальные правила акции в PDF формате.</p>
          <div className="dodo-docs">
            <a className="dodo-doc" href={RULES_RU} target="_blank" rel="noreferrer">
              <span className="dodo-doc-ic">📄</span>
              Открыть правила (RU)
            </a>
            <a className="dodo-doc" href={RULES_UZ} target="_blank" rel="noreferrer">
              <span className="dodo-doc-ic">📄</span>
              Ochilish qoidalari (UZ)
            </a>
          </div>
        </div>
      </section>

      {/* Contacts */}
      <section className="section" id="contacts">
        <div className="wrap">
          <p className="dodo-eyebrow">КОНТАКТЫ</p>
          <h2 className="section-title">Dodo Pizza</h2>
          <p className="section-lead">Официальные контакты и ссылка на приложение.</p>
          <div className="dodo-contacts">
            <a className="dodo-contact" href="tel:1168">
              <span className="dodo-c-ic">📞</span>
              <span className="dodo-c-label">Телефон</span>
              <span className="dodo-c-val">1168</span>
            </a>
            <a
              className="dodo-contact"
              href="https://instagram.com/dodopizzauzb/"
              target="_blank"
              rel="noreferrer"
            >
              <span className="dodo-c-ic">📷</span>
              <span className="dodo-c-label">Instagram</span>
              <span className="dodo-c-val">@dodopizzauzb</span>
            </a>
            <a
              className="dodo-contact"
              href="https://dodopizza.uz/tashkent"
              target="_blank"
              rel="noreferrer"
            >
              <span className="dodo-c-ic">🌐</span>
              <span className="dodo-c-label">Сайт</span>
              <span className="dodo-c-val">dodopizza.uz/tashkent</span>
            </a>
            <a
              className="dodo-contact"
              href="https://dodopizza.onelink.me/YlkM/o5h9m8mo"
              target="_blank"
              rel="noreferrer"
            >
              <span className="dodo-c-ic">📱</span>
              <span className="dodo-c-label">Приложение</span>
              <span className="dodo-c-val">Скачать</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
