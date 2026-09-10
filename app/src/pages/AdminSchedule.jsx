import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getScheduleAll, createSchedule, updateSchedule, deleteSchedule } from "../api.js";
import Modal from "../components/Modal.jsx";

const EMPTY = {
  branch: "online", course: "", days: "", time_from: "", time_to: "",
  start_date: "", duration_months: "", discount: "", description_ru: "",
  description_uz: "", sort_order: 0, is_published: 1,
};

export default function AdminSchedule() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);

  const reload = () => getScheduleAll().then(setItems).catch(() => setItems([]));
  useEffect(() => { reload(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const startAdd = () => { setEditId(null); setForm(EMPTY); setOpen(true); };
  const startEdit = (it) => { setEditId(it.id); setForm({ ...EMPTY, ...it }); setOpen(true); };
  const close = () => { setOpen(false); setEditId(null); setForm(EMPTY); };

  const save = async (e) => {
    e.preventDefault();
    if (editId) await updateSchedule(editId, form);
    else await createSchedule(form);
    close();
    reload();
  };
  const remove = async (id) => {
    if (!window.confirm(t("admin.confirmDelete"))) return;
    await deleteSchedule(id); reload();
  };

  return (
    <div>
      <div className="adm-toolbar">
        <button className="btn" onClick={startAdd}>+ {t("admin.add")}</button>
      </div>

      <Modal open={open} onClose={close} title={editId ? t("admin.edit") : t("admin.add")}>
      <form className="grid-form" onSubmit={save}>
        <label>{t("schedule.branch")}
          <select value={form.branch} onChange={set("branch")}>
            <option value="online">{t("schedule.online")}</option>
            <option value="sergeli">{t("schedule.sergeli")}</option>
            <option value="yunusabad">{t("schedule.yunusabad")}</option>
          </select>
        </label>
        <label>{t("schedule.course")}
          <input value={form.course} onChange={set("course")} required />
        </label>
        <label>{t("schedule.days")}
          <input value={form.days || ""} onChange={set("days")} placeholder="Mon,Wed,Fri" />
        </label>
        <label>{t("schedule.time")}
          <span style={{ display: "flex", gap: 6 }}>
            <input value={form.time_from || ""} onChange={set("time_from")} placeholder="18:00" />
            <input value={form.time_to || ""} onChange={set("time_to")} placeholder="19:30" />
          </span>
        </label>
        <label>{t("schedule.start")}
          <input type="date" value={form.start_date || ""} onChange={set("start_date")} />
        </label>
        <label>{t("schedule.duration")} ({t("schedule.months")})
          <input type="number" value={form.duration_months || ""} onChange={set("duration_months")} />
        </label>
        <label>{t("schedule.discount")}
          <input value={form.discount || ""} onChange={set("discount")} placeholder="-20%" />
        </label>
        <label>{t("admin.published")}
          <select value={form.is_published} onChange={set("is_published")}>
            <option value={1}>✓</option>
            <option value={0}>✗</option>
          </select>
        </label>
        <label className="full">RU
          <input value={form.description_ru || ""} onChange={set("description_ru")} />
        </label>
        <label className="full">UZ
          <input value={form.description_uz || ""} onChange={set("description_uz")} />
        </label>
        <div className="full row-actions">
          <button className="btn">{editId ? t("admin.save") : t("admin.add")}</button>
          <button type="button" className="btn ghost" onClick={close}>{t("admin.cancel")}</button>
        </div>
      </form>
      </Modal>

      <table className="adm-responsive-table">
        <thead>
          <tr>
            <th>{t("schedule.branch")}</th><th>{t("schedule.course")}</th>
            <th>{t("schedule.days")}</th><th>{t("schedule.time")}</th>
            <th>{t("admin.published")}</th><th></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr><td colSpan={6} className="muted">—</td></tr>
          )}
          {items.map((it) => (
            <tr key={it.id} className="adm-row" onDoubleClick={() => startEdit(it)}>
              <td data-label={t("schedule.branch")}>{t(`schedule.${it.branch}`, it.branch)}</td>
              <td data-label={t("schedule.course")}>{it.course}</td>
              <td data-label={t("schedule.days")}>{it.days || "—"}</td>
              <td data-label={t("schedule.time")}>{it.time_from ? `${it.time_from}–${it.time_to || ""}` : "—"}</td>
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
