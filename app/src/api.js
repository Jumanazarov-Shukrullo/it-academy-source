import axios from "axios";

// Same-origin by default (beta serves /api + /cms under the docroot).
const baseURL = import.meta.env.VITE_API_BASE || "";

export const api = axios.create({ baseURL });

const TOKEN_KEY = "ia_admin_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

// Attach the admin bearer token to every request when present.
api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Expired/invalid admin token -> drop it and bounce to login.
// Skip the auth endpoints (login/logout/me handle their own 401s).
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = err.config?.url || "";
    if (err.response?.status === 401 && getToken() && !url.includes("/auth/")) {
      setToken("");
      if (location.pathname !== "/admin-panel") location.assign("/admin-panel");
    }
    return Promise.reject(err);
  }
);

// CMS
export const getSchedule = (branch) =>
  api.get("/cms/schedule.php", { params: branch ? { branch } : {} }).then((r) => r.data.items);
export const getScheduleAll = () =>
  api.get("/cms/schedule.php", { params: { all: 1 } }).then((r) => r.data.items);
export const createSchedule = (body) => api.post("/cms/schedule.php", body).then((r) => r.data.item);
export const updateSchedule = (id, body) =>
  api.put("/cms/schedule.php", body, { params: { id } }).then((r) => r.data.item);
export const deleteSchedule = (id) => api.delete("/cms/schedule.php", { params: { id } });
export const getContent = () => api.get("/cms/content.php").then((r) => r.data.blocks);
export const getContentKey = (key) =>
  api.get("/cms/content.php", { params: { key } }).then((r) => r.data.block);
export const setContent = (key, value_ru, value_uz) =>
  api.put("/cms/content.php", { value_ru, value_uz }, { params: { key } }).then((r) => r.data);
export const deleteContent = (key) => api.delete("/cms/content.php", { params: { key } });

// Marketing content (courses | teachers | news | vacancies) — one generic endpoint.
export const listResource = (type, all) =>
  api.get("/cms/resource.php", { params: { type, ...(all ? { all: 1 } : {}), _: Date.now() } }).then((r) => r.data.items);
export const getResource = (type, key) =>
  api.get("/cms/resource.php", { params: { type, ...key, _: Date.now() } }).then((r) => r.data.item);
export const createResource = (type, body) =>
  api.post("/cms/resource.php", body, { params: { type } }).then((r) => r.data.item);
export const updateResource = (type, id, body) =>
  api.put("/cms/resource.php", body, { params: { type, id } }).then((r) => r.data.item);
export const deleteResource = (type, id) =>
  api.delete("/cms/resource.php", { params: { type, id } });

export const getCourses = () => listResource("courses");
export const getCourse = (slug) => getResource("courses", { slug });
export const getB2BCourses = () => listResource("b2b_courses");
export const getNews = () => listResource("news");
export const getNewsItem = (slug) => getResource("news", { slug });
export const getNewsById = (id) => getResource("news", { id });
export const getVacancies = () => listResource("vacancies");
export const getTeachers = () => listResource("teachers");

// B2B schedule (corporate training).
export const getB2BSchedule = () =>
  api.get("/cms/b2b_schedule.php", { params: { _: Date.now() } }).then((r) => r.data.items);
export const getB2BScheduleAll = () =>
  api.get("/cms/b2b_schedule.php", { params: { all: 1, _: Date.now() } }).then((r) => r.data.items);
export const createB2BSchedule = (body) =>
  api.post("/cms/b2b_schedule.php", body).then((r) => r.data.item);
export const updateB2BSchedule = (id, body) =>
  api.put("/cms/b2b_schedule.php", body, { params: { id } }).then((r) => r.data.item);
export const deleteB2BSchedule = (id) =>
  api.delete("/cms/b2b_schedule.php", { params: { id } });

// Lead/contact form — public submit stores to the `leads` table; admin reads/deletes.
export const submitLead = (body) => api.post("/cms/lead.php", body).then((r) => r.data);
export const getLeads = () => api.get("/cms/lead.php").then((r) => r.data.items);
export const deleteLead = (id) => api.delete("/cms/lead.php", { params: { id } });

// Media library (admin).
export const listMedia = () => api.get("/cms/media.php").then((r) => r.data.items);
export const uploadMedia = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/cms/media.php", fd).then((r) => r.data.item);
};
// Overwrite an existing file (DB upload or site asset) in place — keeps its name.
export const replaceMedia = (name, file) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("name", name);
  return api.post("/cms/media.php", fd).then((r) => r.data);
};
export const deleteMedia = (id) => api.delete("/cms/media.php", { params: { id } });
export const deleteAsset = (name) => api.delete("/cms/media.php", { params: { name } });

// Auth
export const login = (username, password) =>
  api.post("/cms/auth/login.php", { username, password }).then((r) => r.data);
export const logout = () => api.post("/cms/auth/logout.php").catch(() => {});
export const me = () => api.get("/cms/auth/me.php").then((r) => r.data.user);

// Student portal (hardened /api — admin token required)
export const getStudents = (search) =>
  api.get("/api/students.php", { params: search ? { search } : {} }).then((r) => r.data);
export const getStudent = (id) => api.get("/api/student.php", { params: { id } }).then((r) => r.data);
export const getAttendance = (id) =>
  api.get("/api/attendance.php", { params: { id } }).then((r) => r.data);
export const getPayments = (id) => api.get("/api/payments.php", { params: { id } }).then((r) => r.data);
