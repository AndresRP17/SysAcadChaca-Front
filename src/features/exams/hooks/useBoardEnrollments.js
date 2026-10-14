import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../../../shared/api/api";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import { usePageSize } from "../../../shared/hooks/usePageSize";
import { EXAM_ENROLLMENT_STATUS, getExamEnrollmentsPage } from "../services/examEnrollmentService";

export const SEARCH_DELAY_MS = 300;

const DEFAULT_FILTERS = { search: "", status: "" };

// Inscriptos de UNA mesa, paginados y filtrados en el servidor. Además devuelve la cantidad de
// notas pendientes de toda la mesa (no solo de la página visible): decide si se puede cerrar el acta.
export function useBoardEnrollments(boardId) {
  const [enrollments, setEnrollments] = useState([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeValue] = usePageSize();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(Boolean(boardId));
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const requestId = useRef(0);

  const debouncedSearch = useDebouncedValue(filters.search.trim(), SEARCH_DELAY_MS);

  // Al elegir otra mesa se empieza de cero.
  useEffect(() => {
    setPage(1);
    setFilters(DEFAULT_FILTERS);
    setEnrollments([]);
    setTotal(0);
    setPendingCount(0);
    setError("");
  }, [boardId]);

  useEffect(() => {
    if (!boardId) return;
    const id = ++requestId.current;
    setLoading(true);
    setError("");

    getExamEnrollmentsPage({
      examBoardId: boardId,
      q: debouncedSearch,
      status: filters.status,
      page,
      size: pageSize,
    })
      .then(({ items, total: count }) => {
        if (id !== requestId.current) return;
        if (items.length === 0 && count > 0 && page > 1) {
          setPage(Math.ceil(count / pageSize));
          return;
        }
        setEnrollments(items);
        setTotal(count);
        setLoading(false);
      })
      .catch((e) => {
        if (id !== requestId.current) return;
        setError(getErrorMessage(e, "No pudimos cargar los inscriptos de la mesa."));
        setLoading(false);
      });
  }, [boardId, debouncedSearch, filters.status, page, pageSize, reloadKey]);

  // Notas pendientes de toda la mesa: una consulta de una fila, el total viene en el header.
  useEffect(() => {
    if (!boardId) return;
    let cancelled = false;
    getExamEnrollmentsPage({ examBoardId: boardId, status: EXAM_ENROLLMENT_STATUS.PENDING, page: 1, size: 1 })
      .then(({ total: count }) => {
        if (!cancelled) setPendingCount(count);
      })
      .catch(() => {
        if (!cancelled) setPendingCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [boardId, reloadKey]);

  // Recarga la misma página con los mismos filtros (después de cargar una nota).
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  function changeFilter(name, value) {
    setPage(1);
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function changePageSize(size) {
    setPage(1);
    setPageSizeValue(size);
  }

  function clearFilters() {
    setPage(1);
    setFilters(DEFAULT_FILTERS);
  }

  const hasFilters = Boolean(filters.search || filters.status);

  return {
    enrollments,
    total,
    pendingCount,
    page,
    setPage,
    pageSize,
    changePageSize,
    loading,
    error,
    reload,
    filters,
    changeFilter,
    clearFilters,
    hasFilters,
  };
}
