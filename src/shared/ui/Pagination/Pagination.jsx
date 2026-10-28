import { PAGE_SIZE_OPTIONS } from "../../hooks/usePageSize";
import "./Pagination.css";

// Paginación de listas del servidor: "Página X de Y · N <sustantivo>" + Anterior/Siguiente.
// noun: [singular, plural]. Con onPageSizeChange muestra el selector de filas por página.
export default function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange, noun = ["registro", "registros"] }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="pagination">
      <span className="pagination-info">
        Página {page} de {totalPages} · {total} {total === 1 ? noun[0] : noun[1]}
      </span>
      {onPageSizeChange && (
        <label className="pagination-size">
          Filas por página
          <select
            className="users-form-input"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      )}
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
