import { useEffect, useId, useRef } from 'react';
export default function Dialog({ title, onClose, children, busy = false }) {
  const ref = useRef(null); const titleId = useId();
  useEffect(() => { const previous = document.activeElement; ref.current.showModal(); return () => { ref.current?.close(); previous?.focus(); }; }, []);
  return <dialog ref={ref} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}><header className="dialog-header"><h2 id={titleId}>{title}</h2><button type="button" aria-label="닫기" disabled={busy} onClick={onClose} data-testid="dialog-close-button">×</button></header>{children}</dialog>;
}
