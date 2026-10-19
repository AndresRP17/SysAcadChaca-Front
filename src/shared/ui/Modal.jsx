import { useEffect, useId, useRef, useState } from "react";
import "./Modal.css";

// Pila de modales abiertos: Esc y el atrapado de foco solo actuan sobre el de arriba.
const stack = [];

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function visibleFocusables(root) {
  return [...root.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
}

// Dialogo accesible: role="dialog" + aria-modal + titulo asociado, foco atrapado,
// Esc / clic afuera / X piden confirmacion si el formulario tiene cambios sin guardar
// (cualquier input/change del usuario dentro del modal lo marca como "sucio"),
// y al cerrar el foco vuelve al elemento que lo abrio.
//
// `dirty` (opcional): si el contenido sabe por si mismo si hay cambios (p. ej. botones que no
// disparan input/change), lo informa asi y se ignora el rastreo automatico de campos.
// `size="wide"`: modal ancho para listas largas; en celular ocupa toda la pantalla.
export default function Modal({ open, title, onClose, children, dirty, size }) {
  const titleId = useId();
  const boxRef = useRef(null);
  const dirtyRef = useRef(false);
  const requestCloseRef = useRef(() => {});
  const externalDirtyRef = useRef(dirty);
  externalDirtyRef.current = dirty;
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  function requestClose() {
    const isDirty = externalDirtyRef.current ?? dirtyRef.current;
    if (isDirty) {
      setConfirmingDiscard(true);
      return;
    }
    onClose?.();
  }
  requestCloseRef.current = requestClose;

  useEffect(() => {
    if (!open) return undefined;
    const box = boxRef.current;
    const opener = document.activeElement;
    const token = {};
    stack.push(token);
    dirtyRef.current = false;
    setConfirmingDiscard(false);

    // Foco inicial: primer campo del formulario; si no hay, el primer boton del contenido.
    const first =
      box.querySelector(".modal-content input:not([type=hidden]):not([disabled]), .modal-content select:not([disabled]), .modal-content textarea:not([disabled])") ||
      box.querySelector(".modal-content button:not([disabled])") ||
      box;
    first.focus({ preventScroll: true });

    function onKeyDown(e) {
      if (stack[stack.length - 1] !== token) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        requestCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = visibleFocusables(box);
      if (items.length === 0) {
        e.preventDefault();
        box.focus();
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === firstEl || document.activeElement === box)) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      } else if (!box.contains(document.activeElement)) {
        e.preventDefault();
        firstEl.focus();
      }
    }
    function markDirty(e) {
      if (e.isTrusted) dirtyRef.current = true;
    }
    document.addEventListener("keydown", onKeyDown, true);
    box.addEventListener("input", markDirty);
    box.addEventListener("change", markDirty);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      box.removeEventListener("input", markDirty);
      box.removeEventListener("change", markDirty);
      const i = stack.indexOf(token);
      if (i >= 0) stack.splice(i, 1);
      if (opener && opener.isConnected && typeof opener.focus === "function") opener.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={`modal-overlay ${size === "wide" ? "modal-overlay--wide" : ""}`} onClick={requestClose}>
      <div
        className={`modal-box ${size === "wide" ? "modal-box--wide" : ""}`}
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title" id={titleId}>{title}</h3>
          <button type="button" className="modal-close-btn" onClick={requestClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        {confirmingDiscard && (
          <div className="modal-discard" role="alertdialog" aria-label="Cambios sin guardar">
            <p className="modal-discard-text">Hay cambios sin guardar. ¿Descartar?</p>
            <div className="modal-discard-actions">
              <button
                type="button"
                className="users-btn users-btn--ghost"
                autoFocus
                onClick={() => setConfirmingDiscard(false)}
              >
                Seguir editando
              </button>
              <button
                type="button"
                className="users-btn users-btn--danger"
                onClick={() => {
                  dirtyRef.current = false;
                  setConfirmingDiscard(false);
                  onClose?.();
                }}
              >
                Descartar
              </button>
            </div>
          </div>
        )}
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}
