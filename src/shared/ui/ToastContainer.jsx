import "./Toast.css";

// La región aria-live se renderiza SIEMPRE (vacía): los lectores de pantalla solo anuncian
// cambios dentro de una región que ya existía. Los errores usan role="alert" (asertivo).
export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-container" role="region" aria-label="Avisos" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`} role={t.type === "error" ? "alert" : "status"}>
          <span className="toast-message">{t.message}</span>
          <button type="button" className="toast-close-btn" onClick={() => onDismiss(t.id)} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
