// Map a free-text schedule `days` string (CMS stores e.g. "Mon,Wed,Fri" or "Вт, Сб")
// to the 7 weekday pills, flagging which are active. Tolerant of EN/RU, abbrev/full.
// ponytail: substring match — good enough for the handful of day tokens the CMS emits.
export const DOW = [
  { lbl: "Пн", keys: ["mon", "пн", "пон"] },
  { lbl: "Вт", keys: ["tue", "вт", "втор"] },
  { lbl: "Ср", keys: ["wed", "ср", "сре"] },
  { lbl: "Чт", keys: ["thu", "чт", "чет"] },
  { lbl: "Пт", keys: ["fri", "пт", "пят"] },
  { lbl: "Сб", keys: ["sat", "сб", "суб"] },
  { lbl: "Вс", keys: ["sun", "вс", "вос"] },
];

export function activeDays(days = "") {
  const s = (days || "").toLowerCase();
  return DOW.map((d) => d.keys.some((k) => s.includes(k)));
}
