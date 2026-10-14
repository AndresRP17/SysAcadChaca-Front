import { useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../../../shared/api/api";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import { usePageSize } from "../../../shared/hooks/usePageSize";
import ListFilters from "../../../shared/ui/ListFilters";
import LoadError from "../../../shared/ui/LoadError";
import Pagination from "../../../shared/ui/Pagination";
import { getEnrollmentsPage } from "../../enrollments/services/enrollmentService";

const SEARCH_DELAY_MS = 300;

// Alumnos con inscripción activa en una comisión, paginados y con buscador en el servidor.
export default function SectionRoster({ sectionId }) {
  const [rows, setRows] = useState([]);
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

    getEnrollmentsPage({ sectionId, status: "active", q: debouncedSearch, page, size: pageSize })
      .then(({ items, total: count }) => {
        if (id !== requestId.current) return;
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
        setError(getErrorMessage(e, "No se pudo cargar la lista de alumnos."));
        setLoading(false);
      });
  }, [sectionId, debouncedSearch, page, pageSize, reloadKey]);

  function changeSearch(value) {
    setPage(1);
    setSearch(value);
  }

  function changePageSize(size) {
    setPage(1);
    setPageSizeValue(size);
  }

  const hasFilters = search.trim() !== "";

  return (
    <div className="plans-toolbar" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <p className="users-subtitle">Alumnos inscriptos {!loading || rows.length > 0 ? `(${total})` : ""}</p>

      <ListFilters
        idPrefix={`roster-${sectionId}`}
        search={search}
        onSearchChange={changeSearch}
        searchLabel="Buscar alumno"
        searchPlaceholder="Nombre, legajo o DNI"
        hasFilters={hasFilters}
        onClear={() => changeSearch("")}
      />

      <LoadError message={error} onRetry={() => setReloadKey((k) => k + 1)} />

      {loading && rows.length === 0 && !error && <p className="users-empty">Cargando...</p>}

      {!error && !(loading && rows.length === 0) && (
        rows.length === 0 ? (
          <p className="users-empty">
            {hasFilters ? "No hay alumnos con esa búsqueda." : "No hay alumnos inscriptos en esta comisión."}
          </p>
        ) : (
          <div className={"users-list" + (loading ? " users-list--loading" : "")} aria-busy={loading}>
            <ul className="correlatives-prereq-list">
              {rows.map((e) => (
                <li key={e.id} className="correlatives-prereq-item">
                  <span>{e.studentFirstName} {e.studentLastName}</span>
                </li>
              ))}
            </ul>
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={changePageSize}
              noun={["alumno", "alumnos"]}
            />
          </div>
        )
      )}
    </div>
  );
}
