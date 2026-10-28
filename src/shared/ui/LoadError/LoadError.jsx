import "./LoadError.css";

// Error de CARGA de una pantalla (no de un formulario): explica qué pasó en español
// y ofrece "Reintentar" para no obligar a recargar la página.
export default function LoadError({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="load-error" role="alert">
      <p className="load-error-text">{message}</p>
      {onRetry && (
        <button type="button" className="users-btn users-btn--ghost load-error-retry" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
