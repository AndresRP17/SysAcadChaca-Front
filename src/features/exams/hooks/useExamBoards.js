import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../../../shared/api/api";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import { usePageSize } from "../../../shared/hooks/usePageSize";
import { getExamBoardsPage } from "../services/examBoardService";

export const SEARCH_DELAY_MS = 300;

// Por defecto se ven las actas abiertas (las que requieren trabajo), como antes.
const DEFAULT_FILTERS = { search: "", status: "open", from: "", to: "" };

// Lista paginada en el servidor de las mesas de examen de la pantalla Actas.
// mine: el Docente solo ve las mesas donde es presidente o vocal (lo resuelve el servidor).
export function useExamBoards({ mine = false } = {}) {
  const [boards, setBoards] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeValue] = usePageSize();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const requestId = useRef(0);

  const debouncedSearch = useDebouncedValue(filters.search.trim(), SEARCH_DELAY_MS);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");

    getExamBoardsPage({
      q: debouncedSearch,
      status: filters.status,
      from: filters.from,
      to: filters.to,
      mine,
      page,
      size: pageSize,
    })
      .then(({ items, total: count }) => {
        if (id !== requestId.current) return;
        // Si al cancelar/borrar quedó vacía la última página, se vuelve a la anterior.
        if (items.length === 0 && count > 0 && page > 1) {
          setPage(Math.ceil(count / pageSize));
          return;
        }
        setBoards(items);
        setTotal(count);
        setLoading(false);
      })
      .catch((e) => {
        if (id !== requestId.current) return;
        setError(getErrorMessage(e, "No pudimos cargar las mesas de examen."));
        setLoading(false);
      });
  }, [debouncedSearch, filters.status, filters.from, filters.to, mine, page, pageSize, reloadKey]);

  // Recarga la misma página con los mismos filtros (después de crear, cerrar, cancelar o borrar).
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

  // Para mostrar la mesa recién creada: vuelve al filtro por defecto desde la primera página.
  function showDefaultView() {
    clearFilters();
  }

  const hasFilters = Boolean(
    filters.search || filters.from || filters.to || filters.status !== DEFAULT_FILTERS.status
  );

  return {
    boards,
    total,
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
    showDefaultView,
    hasFilters,
  };
}
