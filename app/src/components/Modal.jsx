import { useEffect, useRef } from "react";

// Native <dialog> wrapper — backdrop, Esc-to-close and focus-trap for free.
// open/onClose are owned by the parent; we just sync the <dialog> to them.
export default function Modal({ open, onClose, title, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="adm-modal"
      onCancel={onClose}                                  // Esc
      onClick={(e) => { if (e.target === ref.current) onClose(); }} // backdrop
    >
      <div className="adm-modal-head">
        <h3>{title}</h3>
        <button type="button" className="adm-modal-x" onClick={onClose} aria-label="Close">✕</button>
      </div>
      {open && children}
    </dialog>
  );
}
