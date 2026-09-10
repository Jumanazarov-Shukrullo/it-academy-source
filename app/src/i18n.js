import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "./i18n/ru.json";
import uz from "./i18n/uz.json";
import { getContent } from "./api.js";

// Shell + working-page copy. The full marketing dictionary extracted from the
// old bundle lands in docs/i18n-extracted.json and merges in during the
// pixel-faithful page pass.
i18n.use(initReactI18next).init({
  resources: { ru: { translation: ru }, uz: { translation: uz } },
  lng: localStorage.getItem("ia_lang") || "ru",
  fallbackLng: "ru",
  interpolation: { escapeValue: false },
  // re-render components when CMS overrides are merged in below
  react: { bindI18nStore: "added" },
});

// CMS content-block overrides: merge the content_blocks table OVER the bundled
// strings so ANY t(key) the pages already call is editable from the admin
// "Texts" editor — no page needs changing. CMS down/unconfigured -> bundled copy.
getContent()
  .then((blocks) => {
    const entries = Object.entries(blocks || {});
    if (!entries.length) return;
    for (const [key, v] of entries) {
      if (v && v.ru) i18n.addResource("ru", "translation", key, v.ru);
      if (v && v.uz) i18n.addResource("uz", "translation", key, v.uz);
    }
    // addResource lands after first paint; re-emit languageChanged so mounted
    // components re-render with the merged overrides.
    i18n.changeLanguage(i18n.language);
  })
  .catch(() => {});

export default i18n;
