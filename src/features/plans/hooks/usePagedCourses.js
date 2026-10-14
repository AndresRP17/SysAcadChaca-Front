import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../../../shared/api/api";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import { usePageSize } from "../../../shared/hooks/usePageSize";
import { getCoursesPage, createCourse, updateCourse, deleteCourse } from "../services/courseService";

export const SEARCH_DELAY_MS = 300;

// Catálogo de materias paginado en el servidor (la pestaña Materias). El resto de las pantallas
// que necesitan todas las materias para un combo siguen usando useCourses.
export function usePagedCourses() {
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeValue] = usePageSize();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const requestId = useRef(0);

  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");

    getCoursesPage({ q: debouncedSearch, page, size: pageSize })
      .then(({ items, total: count }) => {
        if (id !== requestId.current) return;
        // Si al borrar quedó vacía la última página, se vuelve a la anterior.
        if (items.length === 0 && count > 0 && page > 1) {
          setPage(Math.ceil(count / pageSize));
          return;
        }
        setCourses(items);
        setTotal(count);
        setLoading(false);
      })
      .catch((e) => {
        if (id !== requestId.current) return;
        setError(getErrorMessage(e, "No se pudo cargar la lista de materias."));
        setLoading(false);
      });
  }, [debouncedSearch, page, pageSize, reloadKey]);

  // Recarga la misma página con el mismo filtro (después de crear, editar o borrar).
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  function changeSearch(value) {
    setPage(1);
    setSearch(value);
  }

  function clearFilters() {
    setPage(1);
    setSearch("");
  }

  function changePageSize(size) {
    setPage(1);
    setPageSizeValue(size);
  }

  async function addCourse(data) {
    await createCourse(data);
    reload();
  }

  async function editCourse(id, data) {
    await updateCourse(id, data);
    reload();
  }

  async function removeCourse(id) {
    await deleteCourse(id);
    reload();
  }

  return {
    courses,
    total,
    page,
    setPage,
    pageSize,
    changePageSize,
    search,
    changeSearch,
    clearFilters,
    hasFilters: Boolean(search),
    loading,
    error,
    reload,
    addCourse,
    editCourse,
    removeCourse,
  };
}
