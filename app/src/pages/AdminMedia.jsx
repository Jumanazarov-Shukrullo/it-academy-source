import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { listMedia, uploadMedia, replaceMedia, deleteMedia, deleteAsset } from "../api.js";

const isVideo = (m) =>
  /(\.mp4|\.webm|\.mov)$/i.test(m.filename) || (m.mime || "").startsWith("video");

// Filename-based categories keep the media library understandable without a DB
// migration. First rule wins; unmatched files stay visible under "other".
const GROUPS = [
  { key: "courses", re: /^courses[_-]|^more_course/i },
  { key: "teachers", re: /teacher/i },
  { key: "camp", re: /^camp|^child|^hotel/i },
  { key: "vacancies", re: /^vacancy|^job[_-]/i },
  { key: "news", re: /^news/i },
  { key: "branches", re: /sergeli|yunusabad|filial/i },
  { key: "about", re: /^good_for_it|^students|^web_home|^about/i },
  { key: "logos", re: /logo|^academy|^user\.|^left-arrow|^uzbekistan|dodo/i },
];
const groupOf = (name) => (GROUPS.find(({ re }) => re.test(name)) || { key: "other" }).key;
const ORDER = [...GROUPS.map(({ key }) => key), "other"];

const formatBytes = (size) => {
  const n = Number(size);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const safeInfo = (value) => (value && typeof value === "object" && !Array.isArray(value) ? value : {});

export default function AdminMedia() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(null);
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
  const [bust, setBust] = useState(0); // cache-bust src after in-place replace

  const reload = () =>
    listMedia()
      .then((i) => { setItems(Array.isArray(i) ? i : []); setBust((b) => b + 1); })
      .catch(() => setItems([]));
  useEffect(() => { reload(); }, []);

  const run = async (fn) => {
    setErr(""); setBusy(true);
    try { await fn(); await reload(); }
    catch (ex) { setErr(ex?.response?.data?.error || "Failed"); }
    finally { setBusy(false); }
  };

  const onPick = (e) => {
    const files = [...e.target.files];
    e.target.value = "";
    run(async () => { for (const f of files) await uploadMedia(f); });
  };
  const onReplace = (m) => (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (file) run(() => replaceMedia(m.filename, file));
  };
  const remove = (m) => {
    if (!window.confirm(m.id != null ? t("admin.confirmDelete") : t("admin.confirmDeleteFile"))) return;
    run(() => (m.id != null ? deleteMedia(m.id) : deleteAsset(m.filename)));
  };
  const copy = (name) => {
    navigator.clipboard?.writeText(name);
    setCopied(name); setTimeout(() => setCopied(null), 1200);
  };

  const info = safeInfo(t("admin.mediaGroupInfo", { returnObjects: true }));
  const groupInfo = (key) => safeInfo(info[key]);

  const counts = useMemo(() => {
    const next = Object.fromEntries(ORDER.map((k) => [k, 0]));
    for (const m of items) next[groupOf(m.filename)] += 1;
    return next;
  }, [items]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const by = {};
    for (const m of items) {
      const key = groupOf(m.filename);
      const haystack = `${m.filename} ${m.original || ""} ${m.mime || ""}`.toLowerCase();
      if (activeGroup !== "all" && key !== activeGroup) continue;
      if (q && !haystack.includes(q)) continue;
      (by[key] ||= []).push(m);
    }
    return ORDER.filter((k) => by[k]?.length).map((k) => [k, by[k]]);
  }, [items, query, activeGroup]);

  const cell = (m) => {
    const key = groupOf(m.filename);
    const meta = groupInfo(key);
    const size = formatBytes(m.size_bytes);
    const dims = m.width && m.height ? `${m.width}x${m.height}` : "";
    return (
    <figure key={m.id ?? m.filename} className="media-cell">
      <div className="media-preview">
        {isVideo(m)
          ? <video src={`${m.url}?v=${bust}`} muted loop playsInline preload="metadata" />
          : <img src={`${m.url}?v=${bust}`} alt={m.original || m.filename} loading="lazy" />}
      </div>
      <figcaption>
        <div className="media-name-row">
          <code title={m.filename}>{m.filename}</code>
          <span className="media-pill">{meta.short || t(`admin.mediaGroups.${key}`)}</span>
        </div>
        <div className="media-meta">
          <span>{isVideo(m) ? t("admin.mediaKindVideo") : t("admin.mediaKindImage")}</span>
          {dims && <span>{dims}</span>}
          {size && <span>{size}</span>}
          <span>{m.asset ? t("admin.mediaSourceAsset") : t("admin.mediaSourceUpload")}</span>
        </div>
        <div className="row-actions">
          <button className="linkbtn" onClick={() => copy(m.filename)}>
            {copied === m.filename ? t("admin.copied") : t("admin.copy")}
          </button>
          {/* Replace works for both DB uploads and site assets (in place). */}
          <label className="linkbtn" style={{ cursor: "pointer" }}>
            {t("admin.replace")}
            <input type="file" accept="image/*,video/*" hidden onChange={onReplace(m)} disabled={busy} />
          </label>
          <button className="linkbtn adm-del" onClick={() => remove(m)} disabled={busy}>
            {t("admin.delete")}
          </button>
        </div>
      </figcaption>
    </figure>
    );
  };

  return (
    <div>
      <div className="panel media-bar" style={{ marginBottom: 24 }}>
        <label className="btn" style={{ cursor: "pointer" }}>
          {busy ? "…" : t("admin.upload")}
          <input type="file" accept="image/*" multiple hidden onChange={onPick} disabled={busy} />
        </label>
        <input
          className="media-search"
          type="search"
          placeholder={t("admin.mediaSearch")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {err && <div className="err" style={{ flexBasis: "100%" }}>{err}</div>}
      </div>

      <div className="media-cats" aria-label={t("admin.media")}>
        <button
          type="button"
          className={`media-cat${activeGroup === "all" ? " on" : ""}`}
          onClick={() => setActiveGroup("all")}
        >
          <span>{t("admin.mediaAll")}</span>
          <b>{items.length}</b>
        </button>
        {ORDER.map((key) => (
          <button
            type="button"
            className={`media-cat${activeGroup === key ? " on" : ""}`}
            key={key}
            onClick={() => setActiveGroup(key)}
          >
            <span>{t(`admin.mediaGroups.${key}`)}</span>
            <b>{counts[key] || 0}</b>
          </button>
        ))}
      </div>

      {groups.map(([key, list]) => (
        <section key={key} className="media-group">
          <header className="media-group-head">
            <div>
              <h3>{t(`admin.mediaGroups.${key}`)} <span className="muted">{list.length}</span></h3>
              <p>{groupInfo(key).hint || ""}</p>
            </div>
            {groupInfo(key).pattern && <code>{groupInfo(key).pattern}</code>}
          </header>
          <div className="media-grid">{list.map(cell)}</div>
        </section>
      ))}
      {!groups.length && <p className="adm-empty">{t("admin.mediaEmpty")}</p>}
    </div>
  );
}
