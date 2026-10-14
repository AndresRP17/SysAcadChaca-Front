import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getErrorMessage } from "../api/api";
import { usePageSize } from "./usePageSize";

// Lista paginada en el servidor. Quien la usa pasa:
//  - params: los filtros ya listos para pedir (el buscador con su espera de 300 ms aplicada),
//  - fetchPage({ ...params, page, size }) -> { items, total }.
// El hook maneja la página, las filas por página, carga/error, el reintento y la recarga.
// Al cambiar cualquier filtro vuelve a la página 1 (sin pedir dos veces); si al borrar se vacía
// la última página retrocede a la anterior; reload() recarga la misma página con los mismos filtros.
export function usePagedList({ params, fetchPage, enabled = true, errorMessage = "No se pudo cargar la lista." }) {
  const [pageSize, setPageSizeValue] = usePageSize();
  // La página queda atada a los filtros con los que se eligió: si cambian, vale la 1.
  const filterKey = useMemo(() => JSON.stringify(params), [params]);
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const requestId = useRef(0);
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const setPage = useCallback((value) => setPageState({ key: filterKey, page: value }), [filterKey]);

  useEffect(() => {
    if (!enabled) return;
    const id = ++requestId.current;
    setLoading(true);
    setError("");

    fetchRef
      .current({ ...paramsRef.current, page, size: pageSize })
      .then(({ items: rows, total: count }) => {
        if (id !== requestId.current) return;
        if (rows.length === 0 && count > 0 && page > 1) {
          setPageState({ key: filterKey, page: Math.ceil(count / pageSize) });
          return;
        }
        setItems(rows);
        setTotal(count);
        setLoading(false);
      })
      .catch((e) => {
        if (id !== requestId.current) return;
        setError(getErrorMessage(e, errorMessage));
        setLoading(false);
      });
  }, [enabled, filterKey, page, pageSize, reloadKey, errorMessage]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const changePageSize = useCallback(
    (size) => {
      setPageState({ key: filterKey, page: 1 });
      setPageSizeValue(size);
    },
    [filterKey, setPageSizeValue],
  );

  // Mientras falta un dato previo (enabled=false) la lista figura cargando, no vacía.
  return { items, total, page, setPage, pageSize, changePageSize, loading: loading || !enabled, error, reload };
}
