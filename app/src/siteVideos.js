import { useEffect, useState } from "react";
import { getContentKey } from "./api.js";

// Site videos are YouTube embeds. The admin "Видео" page stores overrides in the
// content_blocks key "site.videos" = { hero, feedback:[{url,title}], camp:[...] }.
// Pages read it via useSiteVideos() and fall back to the bundled i18n lists.

const HERO_DEFAULT = "ou3YuUhLTqA";

// YouTube id from a watch / embed / youtu.be / shorts URL, or a bare id.
export function ytId(s) {
  if (!s) return "";
  s = String(s).trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m ? m[1] : "";
}
export const embedUrl = (s) => {
  const id = ytId(s);
  return id ? `https://www.youtube.com/embed/${id}` : "";
};
export const heroEmbed = (s) => {
  const id = ytId(s) || HERO_DEFAULT;
  return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&rel=0&showinfo=0&modestbranding=1&playsinline=1&loop=1&playlist=${id}`;
};
export const thumb = (s) => {
  const id = ytId(s);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : "";
};

// Fetch the override once and share it across consumers (one request per load).
// ponytail: session-cached promise; a fresh tab/reload re-fetches, which is how
// the public site is opened from the admin — no live invalidation needed.
let promise;
export function useSiteVideos() {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!promise) {
      promise = getContentKey("site.videos")
        .then((b) => { try { return b?.ru ? JSON.parse(b.ru) : null; } catch { return null; } })
        .catch(() => null);
    }
    let alive = true;
    promise.then((v) => { if (alive) setData(v); });
    return () => { alive = false; };
  }, []);
  return data;
}
