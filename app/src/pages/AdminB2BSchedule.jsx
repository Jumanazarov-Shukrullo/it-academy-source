import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getB2BScheduleAll,
  createB2BSchedule,
  updateB2BSchedule,
  deleteB2BSchedule,
} from "../api.js";
import Modal from "../components/Modal.jsx";

const EMPTY = {
  course_ru: "",
  course_uz: "",
  audience_ru: "",
  audience_uz: "",
  format_ru: "",
  format_uz: "",
  location_ru: "",
  location_uz: "",
  days_ru: "",
  days_uz: "",
  time_from: "",
  time_to: "",
  start_date: "",
  end_date: "",
  duration_ru: "",
  duration_uz: "",
  trainer_ru: "",
  trainer_uz: "",
  seats: "",
  price_ru: "",
  price_uz: "",
  description_ru: "",
  description_uz: "",
  sort_order: 0,
  is_published: 1,
};

const FIELDS = [
  "course_ru", "course_uz", "audience_ru", "audience_uz",
  "format_ru", "format_uz", "location_ru", "location_uz",
  "days_ru", "days_uz", "time_from", "time_to", "start_date", "end_date",
  "duration_ru", "duration_uz", "trainer_ru", "trainer_uz",
  "seats", "price_ru", "price_uz", "description_ru", "description_uz",
  "sort_order", "is_published",
];

const BIG = new Set(["description_ru", "description_uz"]);
const NUM = new Set(["seats", "sort_order"]);
const DATE = new Set(["start_date", "end_date"]);
const REQUIRED = new Set(["course_ru", "course_uz"]);

function fmtDate(value) {
  return value ? value.split("-").reverse().join(".") : "";
}

function fmtRange(item) {
  const start = fmtDate(item.start_date);
  const end = fmtDate(item.end_date);
  if (start && end) return `${start} - ${end}`;
  return start || end || "—";
}

export default function AdminB2BSchedule() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");

  const reload = () => getB2BScheduleAll().then(setItems).catch(() => setItems([]));
  useEffect(() => { reload(); }, []);

  const label = (f) => t(`admin.b2bFields.${f}`, f);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const startAdd = () => { setEditId(null); setForm(EMPTY); setErr(""); setOpen(true); };
  const startEdit = (it) => { setEditId(it.id); setForm({ ...EMPTY, ...it }); setErr(""); setOpen(true); };
  const close = () => { setOpen(false); setEditId(null); setForm(EMPTY); setErr(""); };

  const save = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (editId) await updateB2BSchedule(editId, form);
      else await createB2BSchedule(form);
      close();
      reload();
    } catch (ex) {
      setErr(ex?.response?.data?.error || t("admin.saveFailed"));
    }
  };

  const remove = async (id) => {
    if (!window.confirm(t("admin.confirmDelete"))) return;
    try {
      await deleteB2BSchedule(id);
      reload();
    } catch (ex) {
      if (ex?.response?.status !== 401) window.alert(ex?.response?.data?.error || "Error");
    }
  };

  return (
    <div>
      <div className="adm-toolbar">
        <button className="btn" onClick={startAdd}>+ {t("admin.add")}</button>
      </div>

      <Modal open={open} onClose={close} title={editId ? t("admin.edit") : t("admin.add")}>
        <form className="grid-form" onSubmit={save}>
          {FIELDS.map((f) => {
            if (f === "is_published") {
              return (
                <label key={f}>{label(f)}
                  <select value={form[f]} onChange={set(f)}>
                    <option value={1}>✓</option>
                    <option value={0}>✗</option>
                  </select>
                </label>
              );
            }
            return (
              <label key={f} className={BIG.has(f) ? "full" : ""}>{label(f)}
                {BIG.has(f) ? (
                  <textarea rows={3} value={form[f] ?? ""} onChange={set(f)} />
                ) : (
                  <input
                    type={DATE.has(f) ? "date" : NUM.has(f) ? "number" : "text"}
                    value={form[f] ?? ""}
                    onChange={set(f)}
                    required={REQUIRED.has(f)}
                  />
                )}
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

      <table className="adm-responsive-table">
        <thead>
          <tr>
            <th>{label("course_ru")}</th>
            <th>{label("start_date")}</th>
            <th>{label("time_from")}</th>
            <th>{label("format_ru")}</th>
            <th>{t("admin.published")}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr><td colSpan={6} className="muted">—</td></tr>
          )}
          {items.map((it) => (
            <tr key={it.id} className="adm-row" onDoubleClick={() => startEdit(it)}>
              <td data-label={label("course_ru")}>{it.course_ru || "—"}</td>
              <td data-label={label("start_date")}>{fmtRange(it)}</td>
              <td data-label={label("time_from")}>{it.time_from ? `${it.time_from}${it.time_to ? ` - ${it.time_to}` : ""}` : "—"}</td>
              <td data-label={label("format_ru")}>{it.format_ru || "—"}</td>
              <td data-label={t("admin.published")}>{Number(it.is_published) ? "✓" : <span className="muted">✗</span>}</td>
              <td className="row-actions" data-label={t("admin.actions")}>
                <button className="linkbtn" title={t("admin.edit")} onClick={() => startEdit(it)}>✎</button>
                <button className="linkbtn adm-del" title={t("admin.delete")} onClick={() => remove(it.id)}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
