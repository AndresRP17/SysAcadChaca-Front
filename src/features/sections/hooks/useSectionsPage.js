import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../../../shared/api/api";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import { usePageSize } from "../../../shared/hooks/usePageSize";
import { getSectionsPage } from "../services/sectionService";

export const SEARCH_DELAY_MS = 300;

const EMPTY_FILTERS = { search: "", year: "", term: "", state: "" };

// Comisiones de un plan de estudio paginadas en el servidor. `enabled` en false espera (p. ej. a resolver
// el período de un enlace directo) antes de hacer el primer pedido.
export function useSectionsPage({ studyPlanId, enabled = true, initialFilters = {} }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeValue] = usePageSize();
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, ...initialFilters });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const requestId = useRef(0);

  const debouncedSearch = useDebouncedValue(filters.search.trim(), SEARCH_DELAY_MS);

  useEffect(() => {
    const id = ++requestId.current;
    if (!studyPlanId || !enabled) {
      setRows([]);
      setTotal(0);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    getSectionsPage({
      studyPlanId,
      q: debouncedSearch,
      academicYear: filters.year,
      term: filters.term,
      state: filters.state,
      page,
      size: pageSize,
    })
      .then(({ items, total: count }) => {
        if (id !== requestId.current) return;
        // Si al borrar quedó vacía la última página, se vuelve a la anterior.
        if (items.length === 0 && count > 0 && page > 1) {
          setPage(Math.ceil(count / pageSize));
          return;
        }
        setRows(items);
        setTotal(count);
        setLoading(false);
      })
      .catch((e) => {
        if (id !== requestId.current) return;
        setError(getErrorMessage(e, "No se pudieron cargar las comisiones."));
        setLoading(false);
      });
  }, [studyPlanId, enabled, debouncedSearch, filters.year, filters.term, filters.state, page, pageSize, reloadKey]);

  // Recarga la misma página con los mismos filtros (después de crear, editar o borrar).
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // Al cambiar de plan se vuelve a la primera página.
  useEffect(() => {
    setPage(1);
  }, [studyPlanId]);

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
    setFilters(EMPTY_FILTERS);
  }

  const hasFilters = Boolean(filters.search || filters.year || filters.term || filters.state);

  return {
    sections: rows,
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
    hasFilters,
  };
}
