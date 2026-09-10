import { useEffect, useRef } from "react";

// ponytail: ~45-line canvas snow — matches the live site (≈140 flakes, #f0fff0)
// without pulling in react-snowfall. Upgrade path: swap for the lib only if we
// need wind gusts / 3D rotation, which the live site doesn't use.
export default function Snowfall() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, raf = 0;
    const flakes = [];
    const seed = (f) => {
      f.x = Math.random() * w;
      f.y = Math.random() * h;
      f.r = 1 + Math.random() * 2.4;
      f.vy = 0.4 + Math.random() * 1.0;
      f.vx = -0.4 + Math.random() * 0.8;
      f.o = 0.4 + Math.random() * 0.6;
      return f;
    };
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      const n = Math.min(140, Math.round((w * h) / 14000));
      flakes.length = 0;
      for (let i = 0; i < n; i++) flakes.push(seed({}));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#f0fff0";
      for (const f of flakes) {
        f.y += f.vy;
        f.x += f.vx;
        if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; }
        if (f.x > w + 4) f.x = -4; else if (f.x < -4) f.x = w + 4;
        ctx.globalAlpha = f.o;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="snowfall" aria-hidden="true" />;
}
