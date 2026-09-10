import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getContentKey, setContent } from "../api.js";
import { ytId, thumb } from "../siteVideos.js";

// Editable list of {url,title} rows with a YouTube thumbnail per row.
function VideoList({ items, onChange, t }) {
  const set = (i, k, v) => onChange(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const add = () => onChange([...items, { url: "", title: "" }]);
  const remove = (i) => onChange(items.filter((_, j) => j !== i));
  return (
    <div className="vid-list">
      {items.map((it, i) => (
        <div className="vid-row" key={i}>
          {thumb(it.url)
            ? <img className="vid-thumb" src={thumb(it.url)} alt="" />
            : <span className="vid-thumb vid-thumb--empty">▶</span>}
          <div className="vid-fields">
            <input value={it.url} onChange={(e) => set(i, "url", e.target.value)} placeholder="YouTube URL" />
            <input value={it.title} onChange={(e) => set(i, "title", e.target.value)} placeholder={t("admin.videoTitle")} />
          </div>
          <button className="linkbtn adm-del" title={t("admin.delete")} onClick={() => remove(i)}>🗑</button>
        </div>
      ))}
      <button type="button" className="btn ghost sm" onClick={add}>+ {t("admin.add")}</button>
    </div>
  );
}

export default function AdminVideos() {
  const { t } = useTranslation();
  const [hero, setHero] = useState("");
  const [feedback, setFeedback] = useState([]);
  const [camp, setCamp] = useState([]);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getContentKey("site.videos").then((b) => {
      let data = null;
      try { data = b?.ru ? JSON.parse(b.ru) : null; } catch { /* fall through to defaults */ }
      if (data) {
        setHero(data.hero || "");
        setFeedback(Array.isArray(data.feedback) ? data.feedback : []);
        setCamp(Array.isArray(data.camp) ? data.camp : []);
      } else {
        // No override yet — seed from the bundled lists so the current videos show.
        const fb = t("studentFeedback.videos", { returnObjects: true });
        const cv = t("campVideos.videos", { returnObjects: true });
        setHero("ou3YuUhLTqA");
        setFeedback(Array.isArray(fb) ? fb.map((v) => ({ url: v.src, title: v.title || "" })) : []);
        setCamp(Array.isArray(cv) ? cv.map((v) => ({ url: v.link, title: v.name || "" })) : []);
      }
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setErr(""); setSaved(false);
    const json = JSON.stringify({ hero: ytId(hero) || hero, feedback, camp });
    try {
      await setContent("site.videos", json, json);
      setSaved(true); setTimeout(() => setSaved(false), 1500);
    } catch (ex) {
      setErr(ex?.response?.data?.error || t("admin.saveFailed"));
    }
  };

  return (
    <div className="adm-vid">
      <p className="muted" style={{ marginBottom: 16 }}>{t("admin.videoHint")}</p>

      <section className="panel" style={{ marginBottom: 16 }}>
        <h3 className="adm-section-title">{t("admin.videoHero")}</h3>
        <div className="vid-row">
          {thumb(hero)
            ? <img className="vid-thumb" src={thumb(hero)} alt="" />
            : <span className="vid-thumb vid-thumb--empty">▶</span>}
          <input value={hero} onChange={(e) => setHero(e.target.value)} placeholder="YouTube URL / ID" />
        </div>
      </section>

      <section className="panel" style={{ marginBottom: 16 }}>
        <h3 className="adm-section-title">{t("admin.videoFeedback")}</h3>
        <VideoList items={feedback} onChange={setFeedback} t={t} />
      </section>

      <section className="panel" style={{ marginBottom: 16 }}>
        <h3 className="adm-section-title">{t("admin.videoCamp")}</h3>
        <VideoList items={camp} onChange={setCamp} t={t} />
      </section>

      <div className="row-actions">
        <button className="btn" onClick={save}>{t("admin.save")}</button>
        {saved && <span className="muted">✓</span>}
        {err && <span className="err" style={{ margin: 0 }}>{err}</span>}
      </div>
    </div>
  );
}
