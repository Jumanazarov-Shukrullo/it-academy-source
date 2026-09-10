import { useEffect, useRef, useState } from "react";

// ponytail: native scroll-snap track + arrows + pointer-drag — the live Swiper behavior,
// no swiper dep. Wrap any existing horizontal track (.course-row / .video-row).
export default function Carousel({ className = "", children, ariaLabel }) {
  const track = useRef(null);
  const drag = useRef({ down: false, x: 0, left: 0, moved: false });
  const [controls, setControls] = useState({ overflow: false, prev: false, next: false });

  const updateControls = () => {
    const el = track.current;
    if (!el) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    setControls({
      overflow: max > 2,
      prev: el.scrollLeft > 2,
      next: el.scrollLeft < max - 2,
    });
  };

  useEffect(() => {
    const el = track.current;
    if (!el) return undefined;
    updateControls();
    el.addEventListener("scroll", updateControls, { passive: true });
    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(updateControls)
      : null;
    observer?.observe(el);
    return () => {
      el.removeEventListener("scroll", updateControls);
      observer?.disconnect();
    };
  }, [children]);

  const by = (dir) => {
    const el = track.current;
    if (!el) return;
    const first = el.firstElementChild;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
    const distance = first ? first.getBoundingClientRect().width + gap : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * distance, behavior: "smooth" });
  };
  const onDown = (e) => {
    const el = track.current;
    drag.current = { down: true, x: e.clientX, left: el.scrollLeft, moved: false };
    el.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d.down) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    track.current.scrollLeft = d.left - dx;
  };
  const onUp = () => { drag.current.down = false; };
  // swallow the click that ends a drag so dragging a linked card doesn't navigate
  const onClickCapture = (e) => { if (drag.current.moved) { e.preventDefault(); e.stopPropagation(); } };

  return (
    <div className="carousel">
      {controls.overflow && (
        <button
          type="button"
          className="carousel-arrow prev"
          aria-label="Назад"
          disabled={!controls.prev}
          onClick={() => by(-1)}
        >‹</button>
      )}
      <div
        ref={track}
        className={`carousel-track ${className}`}
        aria-label={ariaLabel}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClickCapture={onClickCapture}
      >
        {children}
      </div>
      {controls.overflow && (
        <button
          type="button"
          className="carousel-arrow next"
          aria-label="Вперёд"
          disabled={!controls.next}
          onClick={() => by(1)}
        >›</button>
      )}
    </div>
  );
}
