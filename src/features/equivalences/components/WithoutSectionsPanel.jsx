import { useEffect, useState } from "react";
import { getErrorMessage } from "../../../shared/api/api";
import { getCoursesWithoutSections } from "../services/equivalenceService";

// Reporte de Bedelia: materias de planes vigentes sin comision este año.
export default function WithoutSectionsPanel({ reloadKey }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    getCoursesWithoutSections()
      .then(setRows)
      .catch((e) => setError(getErrorMessage(e, "No pudimos cargar el reporte.")));
  }, [open, reloadKey]);

  return (
    <div className="dash-panel equiv-panel">
      <button type="button" className="users-btn users-btn--ghost equiv-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? "Ocultar" : "Ver"} materias sin comisión este año
      </button>
      <p className="equiv-sub">
        Candidatas a equivalencia interna: los alumnos no pueden cursarlas porque no se dictan.
      </p>
      {open && error && <p className="users-form-error" role="alert">{error}</p>}
      {open && !error && rows === null && <p className="users-empty">Cargando...</p>}
      {open && rows && rows.length === 0 && <p className="users-empty">Todas las materias de los planes vigentes tienen comisión.</p>}
      {open && rows && rows.length > 0 && (
        <ul className="equiv-report">
          {rows.map((r) => (
            <li key={r.id} className="equiv-report-item" data-testid="without-section">
              <div>
                <strong>{r.courseName}</strong> ({r.courseCode})
                <span className="equiv-sub">
                  {r.programName} · plan {r.resolutionYear} · {r.yearNumber}º año
                </span>
              </div>
              <span className={r.pendingInternalEquivalences > 0 ? "users-badge users-badge--inactive" : "dash-badge dash-badge--gray"}>
                {r.pendingInternalEquivalences} pendiente{r.pendingInternalEquivalences === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
