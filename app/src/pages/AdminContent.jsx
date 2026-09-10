import { Fragment, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ruBundle from "../i18n/ru.json";
import uzBundle from "../i18n/uz.json";
import { getContent, setContent, deleteContent } from "../api.js";

// Card categories — each card is a logical area of the site. Clicking one opens
// just that area's RU/UZ fields. First match wins (so a key lands in exactly one
// card); anything unmatched falls into a generated "Не отсортировано" card so
// nothing ever disappears.
const CATEGORIES = [
  { id: "home",    label: "Главная",             icon: "🏠", prefixes: ["home", "whyWe", "aboutUs", "studentFeedback", "feedback", "ticker", "counseling", "courseSelection"] },
  { id: "menu",    label: "Меню и подвал",        icon: "🧭", prefixes: ["nav", "header", "footer"] },
  { id: "courses", label: "Курсы — общие блоки",  icon: "📚", prefixes: ["courses", "goodForIt", "alumniWorks", "nearbyGroups", "costOfTraining"] },
  { id: "web",     label: "Веб-программирование",  icon: "🌐", prefixes: ["webHome", "moreСourse", "courseProgram", "frontEnd", "backend", "nodeJS", "coursesNodsJS"] },
  { id: "python",  label: "Python",               icon: "🐍", prefixes: ["coursesPython", "moreСoursePhyton", "courseProgramPhyton"] },
  { id: "ds",      label: "Data Science",         icon: "📊", prefixes: ["coursesDataScience", "moreСourseDatascience", "moreСourseDataScience", "courseProgramDataScience", "dataScience", "goodForItDatascience"] },
  { id: "graphic", label: "Графический дизайн",   icon: "🎨", prefixes: ["coursesGraphicDesign", "moreСourseGraphic", "courseProgramGraphic", "graphicDesign"] },
  { id: "others",  label: "Другие курсы",         icon: "🧩", prefixes: ["unity", "coursesUnity", "scratch", "coursesScratch", "compLiteracy", "coursesComputerLiteracy"] },
  { id: "schedule",label: "Расписание",           icon: "🗓", prefixes: ["schedule", "adminSchedule"] },
  { id: "news",    label: "Новости",              icon: "📰", prefixes: ["news", "newsStories"] },
  { id: "contact", label: "Контакты и формы",     icon: "✉️", prefixes: ["contact", "location", "validForm", "sendMessage", "discountPopup"] },
  { id: "camp",    label: "Лагерь",               icon: "⛺", prefixes: ["campHome", "campMoreСourse", "campFor", "campVideos"] },
  { id: "bf",      label: "Black Friday",         icon: "🏷", prefixes: ["blackFriday", "blackFridayPage"] },
  { id: "misc",    label: "Прочее и системное",   icon: "⚙️", prefixes: ["admin", "portal", "stub", "notFound", "oferta"] },
];

const startsCat = (k, p) => k === p || k.startsWith(p + ".");
const catOf = (k) => CATEGORIES.find((c) => c.prefixes.some((p) => startsCat(k, p)))?.id || "other";

// Friendlier label for the trailing key segment; full key still shown below it.
const LEAF_RU = {
  title: "Заголовок", text: "Текст", subtitle: "Подзаголовок", desc: "Описание", description: "Описание",
  btn: "Кнопка", button: "Кнопка", label: "Метка", name: "Имя", value: "Значение", caption: "Подпись",
  placeholder: "Подсказка", price: "Цена", note: "Примечание", link: "Ссылка", url: "Ссылка",
};
const humanLeaf = (seg) => LEAF_RU[seg] || seg;
// Parent path as a header, numeric segments shown as #1, #2…
const groupLabel = (parent) =>
  parent.split(".").map((s) => (/^\d+$/.test(s) ? "#" + (+s + 1) : s)).join(" / ");

// Flatten a nested i18n bundle to dotted leaf keys: { "home.title": "...", "nav.0": "..." }.
function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") flatten(v, key, out);
    else out[key] = v == null ? "" : String(v);
  }
  return out;
}

const ORIG_RU = flatten(ruBundle);
const ORIG_UZ = flatten(uzBundle);

const LIMIT = 300; // cap on the global-search result list — internal tool, refine with search

// One editable key as a card. Local state so typing doesn't re-render the list.
function Field({ k, ru0, uz0, overridden, onSaved, onReverted, t }) {
  const [ru, setRu] = useState(ru0);
  const [uz, setUz] = useState(uz0);
  const dirty = ru !== ru0 || uz !== uz0;
  return (
    <div className={"cms-field" + (dirty ? " dirty" : "")}>
      <div className="cms-field-head">
        <span className="cms-field-name">
          {humanLeaf(k.split(".").pop())}
          {overridden && <span className="cms-badge" title="изменено">●</span>}
        </span>
        <code className="cms-field-key">{k}</code>
      </div>
      <div className="cms-field-cols">
        <label><span>RU</span><textarea value={ru} onChange={(e) => setRu(e.target.value)} /></label>
        <label><span>UZ</span><textarea value={uz} onChange={(e) => setUz(e.target.value)} /></label>
      </div>
      {(dirty || overridden) && (
        <div className="cms-field-foot">
          {overridden && <button className="linkbtn" onClick={() => onReverted(k)}>{t("admin.revert")}</button>}
          {dirty && <button className="btn sm" onClick={() => onSaved(k, ru, uz)}>{t("admin.save")}</button>}
        </div>
      )}
    </div>
  );
}

export default function AdminContent() {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState("");
  const [section, setSection] = useState(null); // null = card grid; else category id
  const [overrides, setOverrides] = useState({}); // block_key -> {ru,uz}, from content.php
  const [eff, setEff] = useState({ ru: {}, uz: {} }); // effective (merged) values, mutated in place

  const reloadOverrides = () => getContent().then((b) => setOverrides(b || {})).catch(() => setOverrides({}));
  const rebuild = () =>
    setEff({
      ru: flatten(i18n.getResourceBundle("ru", "translation") || {}),
      uz: flatten(i18n.getResourceBundle("uz", "translation") || {}),
    });
  useEffect(() => { rebuild(); reloadOverrides(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const keys = useMemo(
    () => [...new Set([...Object.keys(eff.ru), ...Object.keys(eff.uz)])]
      .filter((k) => !k.endsWith(".id")) // structural array plumbing, not copy
      .sort(),
    [eff]
  );

  // card list with per-category counts; append a catch-all card if anything is unmatched
  const cards = useMemo(() => {
    const n = {};
    for (const k of keys) n[catOf(k)] = (n[catOf(k)] || 0) + 1;
    const list = CATEGORIES.map((c) => ({ ...c, count: n[c.id] || 0 })).filter((c) => c.count);
    if (n.other) list.push({ id: "other", label: "Не отсортировано", icon: "❓", count: n.other });
    return list;
  }, [keys]);

  const needle = q.trim().toLowerCase();
  const matches = (k) =>
    !needle ||
    k.toLowerCase().includes(needle) ||
    (eff.ru[k] || "").toLowerCase().includes(needle) ||
    (eff.uz[k] || "").toLowerCase().includes(needle);

  const showGrid = !section && !needle;

  // keys to render in list mode: within the open section, or global when searching from the grid
  const listKeys = keys.filter((k) => matches(k) && (section ? catOf(k) === section : true));
  const capped = !section && listKeys.length > LIMIT;
  const shown = capped ? listKeys.slice(0, LIMIT) : listKeys;

  // group consecutive keys by parent path (keys are sorted, so same-parent keys are adjacent)
  const groups = [];
  for (const k of shown) {
    const parent = k.split(".").slice(0, -1).join(".") || "(root)";
    if (!groups.length || groups[groups.length - 1].parent !== parent) groups.push({ parent, keys: [] });
    groups[groups.length - 1].keys.push(k);
  }

  const onSaved = async (k, ru, uz) => {
    await setContent(k, ru, uz);
    i18n.addResource("ru", "translation", k, ru);
    i18n.addResource("uz", "translation", k, uz);
    eff.ru[k] = ru; eff.uz[k] = uz;
    setOverrides((o) => ({ ...o, [k]: { ru, uz } })); // flips key -> Field remounts with saved value
  };
  const onReverted = async (k) => {
    await deleteContent(k);
    const ru = ORIG_RU[k] ?? ""; const uz = ORIG_UZ[k] ?? "";
    i18n.addResource("ru", "translation", k, ru);
    i18n.addResource("uz", "translation", k, uz);
    eff.ru[k] = ru; eff.uz[k] = uz;
    setOverrides((o) => { const n = { ...o }; delete n[k]; return n; });
  };

  const activeLabel = cards.find((c) => c.id === section)?.label;

  return (
    <div>
      <p className="muted" style={{ marginTop: 0, marginBottom: 16 }}>{t("admin.textsHint")}</p>

      <div className="cms-controls">
        {section && (
          <button className="btn ghost" onClick={() => { setSection(null); setQ(""); }}>← Все разделы</button>
        )}
        <input
          className="cms-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={section ? `${t("admin.search")} — ${activeLabel}` : t("admin.search")}
        />
      </div>

      {showGrid ? (
        <div className="cms-cards">
          {cards.map((c) => (
            <button key={c.id} className="cms-card" onClick={() => setSection(c.id)}>
              <span className="cms-card-ico">{c.icon}</span>
              <span className="cms-card-label">{c.label}</span>
              <span className="cms-card-count">{c.count} текстов</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          {(section || needle) && (
            <p style={{ margin: "2px 0 14px" }}>
              <span className="cms-count">
                {section ? activeLabel + " · " : "Найдено: "}{listKeys.length}
                {capped ? ` (показано ${LIMIT} — уточните поиск)` : ""}
              </span>
            </p>
          )}
          {!shown.length && <p className="muted">Ничего не найдено.</p>}
          {groups.map((g) => (
            <Fragment key={g.parent}>
              <div className="cms-group-h">{groupLabel(g.parent)}</div>
              <div className="cms-fields">
                {g.keys.map((k) => (
                  <Field
                    key={`${k}|${overrides[k] ? 1 : 0}`}
                    k={k}
                    ru0={eff.ru[k] || ""}
                    uz0={eff.uz[k] || ""}
                    overridden={!!overrides[k]}
                    onSaved={onSaved}
                    onReverted={onReverted}
                    t={t}
                  />
                ))}
              </div>
            </Fragment>
          ))}
        </>
      )}
    </div>
  );
}
