import "./Pagination.css";

// Paginación de listas del servidor: "Página X de Y · N <sustantivo>" + Anterior/Siguiente.
// noun: [singular, plural].
export default function Pagination({ page, pageSize, total, onPageChange, noun = ["registro", "registros"] }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="pagination">
      <span className="pagination-info">
        Página {page} de {totalPages} · {total} {total === 1 ? noun[0] : noun[1]}
      </span>
      <div className="pagination-buttons">
        <button
          type="button"
          className="users-btn users-btn--ghost"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>
        <button
          type="button"
          className="users-btn users-btn--ghost"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
