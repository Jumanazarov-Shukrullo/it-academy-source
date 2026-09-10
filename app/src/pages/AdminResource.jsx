import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { listResource, createResource, updateResource, deleteResource, uploadMedia } from "../api.js";
import Modal from "../components/Modal.jsx";

// Image fields store a docroot-relative path; the public pages render them as
// `/${value}` (e.g. "courses_home.jpg" -> /courses_home.jpg, an upload ->
// "uploads/x.jpg" -> /uploads/x.jpg). Resolve the same way for the preview.
function imgSrc(v) {
  if (!v) return "";
  if (/^https?:\/\//.test(v)) return v;
  const p = v.replace(/^\/+/, "");
  if (p.includes("..") || !/^[\w][\w./-]*$/.test(p)) return "";
  return "/" + p;
}

// One editor for the marketing resource tables — mirrors server/cms/resource.php's
// RESOURCES map. `fields` = same order as the backend; `cols` = the columns shown
// in the list; `required` = matches the backend's required[] (avoids a 422 round-trip).
const SPECS = {
  courses: {
    fields: ["slug", "title_ru", "title_uz", "summary_ru", "summary_uz",
      "description_ru", "description_uz", "price", "duration_months",
      "duration_ru", "duration_uz", "lessons_ru", "lessons_uz",
      "format_ru", "format_uz", "lesson_duration_ru", "lesson_duration_uz",
      "button_ru", "button_uz", "button_url", "image", "sort_order", "is_published"],
    cols: ["title_ru", "slug"], required: ["slug", "title_ru", "title_uz", "image"],
    labels: "admin.courseFields",
  },
  b2b_courses: {
    fields: ["title_ru", "title_uz", "summary_ru", "summary_uz",
      "description_ru", "description_uz", "duration_ru", "duration_uz",
      "format_ru", "format_uz", "image", "sort_order", "is_published"],
    cols: ["title_ru", "format_ru"], required: ["title_ru", "title_uz"],
    labels: "admin.b2bCourseFields",
  },
  teachers: {
    fields: ["name", "role_ru", "role_uz", "bio_ru", "bio_uz",
      "photo", "sort_order", "is_published"],
    cols: ["name", "role_ru"], required: ["name"],
  },
  news: {
    fields: ["slug", "title_ru", "title_uz", "excerpt_ru", "excerpt_uz",
      "body_ru", "body_uz", "cover_image", "is_published", "published_at"],
    cols: ["title_ru", "published_at"], required: ["title_ru", "title_uz"],
  },
  vacancies: {
    fields: ["title_ru", "title_uz", "description_ru", "description_uz",
      "location", "employment", "image", "sort_order", "is_published"],
    cols: ["title_ru", "location"], required: ["title_ru", "title_uz"],
  },
};

const NUM = new Set(["price", "duration_months", "sort_order"]);
const BIG = ["summary", "description", "bio", "body", "excerpt"]; // -> textarea, full width
const isBig = (f) => BIG.some((p) => f.startsWith(p));
const isImg = (f) => f === "image" || f === "photo" || f === "cover_image";

// "title_ru" -> "Title · RU", "published_at" -> "Published at".
// ponytail: derived labels for the internal editor beat ~40 hand-written i18n keys.
function fieldLabel(f) {
  const lang = f.endsWith("_ru") ? " · RU" : f.endsWith("_uz") ? " · UZ" : "";
  const base = f.replace(/_(ru|uz)$/, "").replace(/_/g, " ");
  return base.charAt(0).toUpperCase() + base.slice(1) + lang;
}

export default function AdminResource() {
  const { type } = useParams();
  const { t } = useTranslation();
  const spec = SPECS[type];

  const EMPTY = useMemo(() => {
    const o = {};
    for (const f of spec?.fields || []) o[f] = f === "is_published" ? 1 : "";
    return o;
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [previewVersion, setPreviewVersion] = useState(0);

  const reload = () => listResource(type, true).then(setItems).catch(() => setItems([]));
  useEffect(() => { setOpen(false); setForm(EMPTY); setEditId(null); setErr(""); reload(); }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!spec) return <p className="err">Unknown type: {type}</p>;

  const labelFor = (f) => spec.labels ? t(`${spec.labels}.${f}`, fieldLabel(f)) : fieldLabel(f);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const uploadFor = (f) => async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setErr("");
    setBusy("upload");
    try {
      const item = await uploadMedia(file);          // -> /uploads/<name>
      setForm((prev) => ({ ...prev, [f]: `uploads/${item.filename}` }));
      setPreviewVersion(Date.now());
    } catch (ex) {
      setErr(ex?.response?.data?.error || "Upload failed");
    } finally {
      setBusy("");
    }
  };
  const startAdd = () => {
    const nextOrder = type === "courses"
      ? Math.max(0, ...items.map((item) => Number(item.sort_order || 0))) + 1
      : EMPTY.sort_order;
    setEditId(null);
    setForm({ ...EMPTY, ...(type === "courses" ? { sort_order: nextOrder, button_url: "" } : {}) });
    setPreviewVersion(0); setErr(""); setOpen(true);
  };
  const startEdit = (it) => { setEditId(it.id); setForm({ ...EMPTY, ...it }); setPreviewVersion(0); setErr(""); setOpen(true); };
  const close = () => { setOpen(false); setEditId(null); setForm(EMPTY); setErr(""); };

  const save = async (e) => {
    e.preventDefault(); setErr("");
    try {
      if (editId) await updateResource(type, editId, form);
      else await createResource(type, form);
      close(); reload();
    } catch (ex) {
      setErr(ex?.response?.data?.error || "Error");
    }
  };
  const remove = async (id) => {
    if (!window.confirm(t("admin.confirmDelete"))) return;
    setBusy(`delete-${id}`); setErr("");
    try { await deleteResource(type, id); await reload(); }
    catch (ex) { if (ex?.response?.status !== 401) setErr(ex?.response?.data?.error || "Error"); }
    finally { setBusy(""); }
  };

  const orderedCourses = type === "courses"
    ? items.slice().sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || Number(a.id) - Number(b.id))
    : [];

  const moveCourse = async (index, delta) => {
    const next = index + delta;
    if (next < 0 || next >= orderedCourses.length) return;
    const reordered = orderedCourses.slice();
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    setBusy(`move-${orderedCourses[index].id}`); setErr("");
    try {
      await Promise.all(reordered.map((item, position) => {
        const sortOrder = position + 1;
        return Number(item.sort_order) === sortOrder
          ? Promise.resolve()
          : updateResource("courses", item.id, { sort_order: sortOrder });
      }));
      await reload();
    } catch (ex) {
      setErr(ex?.response?.data?.error || t("admin.saveFailed"));
    } finally {
      setBusy("");
    }
  };

  const toggleCourse = async (item) => {
    setBusy(`publish-${item.id}`); setErr("");
    try {
      await updateResource("courses", item.id, { is_published: Number(item.is_published) ? 0 : 1 });
      await reload();
    } catch (ex) {
      setErr(ex?.response?.data?.error || t("admin.saveFailed"));
    } finally {
      setBusy("");
    }
  };

  return (
    <div>
      <div className="adm-toolbar">
        <button className="btn" onClick={startAdd}>+ {t("admin.add")}</button>
      </div>

      {err && !open && <div className="err adm-resource-err">{err}</div>}

      {type === "courses" ? (
        <div className="adm-course-list">
          {orderedCourses.length === 0 && <div className="adm-empty">—</div>}
          {orderedCourses.map((item, index) => (
            <article className={`adm-course-item${Number(item.is_published) ? "" : " is-hidden"}`} key={item.id}>
              <div className="adm-course-thumb">
                {item.image
                  ? <img src={`${imgSrc(item.image)}${item.updated_at ? `?v=${encodeURIComponent(item.updated_at)}` : ""}`} alt="" />
                  : <span aria-hidden="true">▧</span>}
              </div>
              <div className="adm-course-copy">
                <div className="adm-course-heading">
                  <div>
                    <h3>{item.title_ru || item.title_uz || item.slug}</h3>
                    <p>{item.slug}</p>
                  </div>
                  <span className={`adm-publish-state${Number(item.is_published) ? " is-on" : ""}`}>
                    {Number(item.is_published) ? t("admin.published") : t("admin.hide")}
                  </span>
                </div>
                {item.summary_ru && <p className="adm-course-summary">{item.summary_ru}</p>}
                <div className="adm-course-foot">
                  <div className="adm-order-controls" aria-label={t("admin.order")}>
                    <span>#{index + 1}</span>
                    <button type="button" disabled={index === 0 || !!busy} onClick={() => moveCourse(index, -1)} title={t("admin.moveUp")} aria-label={t("admin.moveUp")}>↑</button>
                    <button type="button" disabled={index === orderedCourses.length - 1 || !!busy} onClick={() => moveCourse(index, 1)} title={t("admin.moveDown")} aria-label={t("admin.moveDown")}>↓</button>
                  </div>
                  <div className="adm-course-actions">
                    <button type="button" className="btn ghost sm" disabled={!!busy} onClick={() => toggleCourse(item)}>
                      {Number(item.is_published) ? t("admin.hide") : t("admin.show")}
                    </button>
                    <button type="button" className="btn ghost sm" disabled={!!busy} onClick={() => startEdit(item)}>{t("admin.edit")}</button>
                    <button type="button" className="btn danger sm" disabled={!!busy} onClick={() => remove(item.id)}>{t("admin.delete")}</button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
      <table className="adm-responsive-table">
        <thead>
          <tr>
            {spec.cols.map((c) => <th key={c}>{labelFor(c)}</th>)}
            <th>{t("admin.published")}</th><th></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr><td colSpan={spec.cols.length + 2} className="muted">—</td></tr>
          )}
          {items.map((it) => (
            <tr key={it.id} className="adm-row" onDoubleClick={() => startEdit(it)}>
              {spec.cols.map((c) => <td data-label={labelFor(c)} key={c}>{it[c] == null || it[c] === "" ? "—" : String(it[c])}</td>)}
              <td data-label={t("admin.published")}>{Number(it.is_published) ? "✓" : <span className="muted">✗</span>}</td>
              <td className="row-actions" data-label={t("admin.actions")}>
                <button className="linkbtn" title={t("admin.edit")} onClick={() => startEdit(it)}>✎</button>
                <button className="linkbtn adm-del" title={t("admin.delete")} onClick={() => remove(it.id)}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}

      <Modal open={open} onClose={close} title={editId ? t("admin.edit") : t("admin.add")}>
        <form className="grid-form" onSubmit={save}>
          {spec.fields.map((f) => {
            if (f === "is_published") {
              return (
                <label key={f}>{t("admin.published")}
                  <select value={form[f]} onChange={set(f)}>
                    <option value={1}>{t("admin.show")}</option><option value={0}>{t("admin.hide")}</option>
                  </select>
                </label>
              );
            }
            const full = isBig(f);
            return (
              <label key={f} className={full ? "full" : ""}>{labelFor(f)}
                {full
                  ? <textarea rows={3} value={form[f] ?? ""} onChange={set(f)} />
                  : <input
                      type={NUM.has(f) ? "number" : f === "published_at" ? "date" : "text"}
                      value={form[f] ?? ""} onChange={set(f)}
                      required={spec.required.includes(f)}
                    />}
                {isImg(f) && (
                  <span className="img-field">
                    <label className="btn ghost sm" style={{ cursor: "pointer" }}>
                      {busy === "upload" ? "…" : form[f] ? t("admin.replace") : t("admin.upload")}
                      <input type="file" accept="image/*" hidden disabled={busy === "upload"} onChange={uploadFor(f)} />
                    </label>
                    {imgSrc(form[f]) && <img className="thumb-sm" src={`${imgSrc(form[f])}${previewVersion ? `?v=${previewVersion}` : ""}`} alt="" />}
                  </span>
                )}
                {type === "courses" && f === "image" && <small className="adm-field-help">{t("admin.imageReplaceHint")}</small>}
                {type === "courses" && f === "button_url" && <small className="adm-field-help">{t("admin.courseLinkHint")}</small>}
              </label>
            );
          })}
          {err && <div className="full err">{err}</div>}
          <div className="full row-actions">
            <button className="btn">{editId ? t("admin.save") : t("admin.add")}</button>
            <button type="button" className="btn ghost" onClick={close}>{t("admin.cancel")}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
