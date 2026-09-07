import { useId, useLayoutEffect, useRef } from 'react';
export default function Dialog({ title, onClose, children, busy = false }) {
  const ref = useRef(null); const titleId = useId();
  // useLayoutEffect so the cleanup runs synchronously *before* React removes the
  // <dialog> from the DOM: closing it while still attached lets the browser
  // restore focus to the trigger (a passive-effect close runs after removal, when
  // focus has already fallen to <body>). Restore explicitly too, as a fallback.
  useLayoutEffect(() => {
    const el = ref.current;
    const previous = document.activeElement;
    el.showModal();
    return () => { el.close(); previous?.focus?.(); };
  }, []);
  return <dialog ref={ref} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}><header className="dialog-header"><h2 id={titleId}>{title}</h2><button type="button" aria-label="닫기" disabled={busy} onClick={onClose} data-testid="dialog-close-button">×</button></header>{children}</dialog>;
}
