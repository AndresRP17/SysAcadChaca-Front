import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getErrorMessage } from "../../shared/api/api";
import { useToast } from "../../context/ToastContext";
import LoadError from "../../shared/ui/LoadError";
import FormError from "../../shared/ui/FormError";
import { getCalendar } from "../calendar/services/calendarService";
import { getEnrollmentsBySection } from "../grades/services/enrollmentService";
import {
  getAttendancesBySectionAndDate,
  createAttendance,
  updateAttendance,
  saveAttendanceBatch,
} from "../grades/services/attendanceService";
import "../users/usersPage.css";
import "./takeAttendancePage.css";

// Con cientos de alumnos no se dibujan todos a la vez: se muestran de a PAGE_SIZE y el buscador
// (o "Mostrar más") lleva al resto.
const PAGE_SIZE = 60;
// Si el servidor no tiene el guardado por lote (404), se guarda de a pocos pedidos en paralelo.
const FALLBACK_CONCURRENCY = 5;

function formatLongDate(isoDate) {
  const text = new Date(`${isoDate}T00:00:00`).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function normalize(text) {
  return String(text).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

const AttendanceRow = memo(function AttendanceRow({ row, onChoose }) {
  return (
    <li>
      <div className="attendance-row">
        <span className="attendance-row-name">{row.studentName}</span>
        <div className="attendance-choices" role="group" aria-label={`Asistencia de ${row.studentName}`}>
          <button
            type="button"
            aria-pressed={row.present === true}
            className={`attendance-choice attendance-choice--present ${row.present === true ? "is-selected" : ""}`}
            onClick={() => onChoose(row.enrollmentId, true)}
          >
            Presente
          </button>
          <button
            type="button"
            aria-pressed={row.present === false}
            className={`attendance-choice attendance-choice--absent ${row.present === false ? "is-selected" : ""}`}
            onClick={() => onChoose(row.enrollmentId, false)}
          >
            Ausente
          </button>
        </div>
      </div>
    </li>
  );
});

// Asistencia de UNA clase: se llega desde el calendario (o la tarjeta "Hoy") con la
// comision y la fecha ya definidas, asi que no hay nada que elegir -- solo marcar y guardar.
export default function TakeAttendancePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const sectionId = searchParams.get("section");
  const date = searchParams.get("date");
  const validParams = /^\d+$/.test(sectionId ?? "") && /^\d{4}-\d{2}-\d{2}$/.test(date ?? "");

  const [loading, setLoading] = useState(validParams);
  const [loadError, setLoadError] = useState(validParams ? "" : "Falta indicar la clase. Elegila desde el calendario.");
  const [saveError, setSaveError] = useState("");
  const [classInfo, setClassInfo] = useState(null);
  const [rows, setRows] = useState([]); // { enrollmentId, studentName, attendanceId, present: true | false | null (sin marcar) }
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null); // { done, total } mientras se guarda uno por uno
  const [search, setSearch] = useState("");
  const [onlyUnmarked, setOnlyUnmarked] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!validParams) return undefined;

    let cancelled = false;
    setLoading(true);
    setLoadError("");

    Promise.all([
      getCalendar(date, date),
      getEnrollmentsBySection(sectionId),
      getAttendancesBySectionAndDate(sectionId, date),
    ])
      .then(([calendar, enrollments, attendances]) => {
        if (cancelled) return;

        const lesson = calendar.events.find((e) => String(e.sectionId) === sectionId);

        if (!lesson) {
          setLoadError("No tenés una clase de esa comisión ese día.");
          return;
        }

        const byEnrollment = new Map(attendances.map((a) => [a.enrollmentId, a]));

        setClassInfo(lesson);
        setEditing(attendances.length > 0);
        setRows(
          enrollments.map((e) => {
            const found = byEnrollment.get(e.id);
            return {
              enrollmentId: e.id,
              studentName: `${e.studentFirstName} ${e.studentLastName}`,
              attendanceId: found?.id ?? null,
              // Sin marcar a proposito: ni presente ni ausente hasta que el docente lo decida.
              present: found ? found.present : null,
            };
          }),
        );
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getErrorMessage(err, "No se pudo cargar la clase."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [validParams, sectionId, date, reloadKey]);

  const presentCount = useMemo(() => rows.filter((r) => r.present === true).length, [rows]);
  const absentCount = useMemo(() => rows.filter((r) => r.present === false).length, [rows]);
  const unmarkedCount = rows.length - presentCount - absentCount;
  const canTakeAttendance = classInfo?.status === "SCHEDULED";

  const filteredRows = useMemo(() => {
    const term = normalize(search.trim());
    return rows.filter(
      (r) => (!onlyUnmarked || r.present === null) && (!term || normalize(r.studentName).includes(term)),
    );
  }, [rows, search, onlyUnmarked]);

  // Cambiar el buscador o el filtro vuelve a la primera pagina.
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [search, onlyUnmarked]);

  const choose = useCallback((enrollmentId, present) => {
    setRows((prev) => prev.map((r) => (r.enrollmentId === enrollmentId ? { ...r, present } : r)));
  }, []);

  function markAllPresent() {
    setRows((prev) => prev.map((r) => ({ ...r, present: true })));
  }

  // Trae del servidor lo que ya quedo guardado y actualiza los ids, sin tocar lo que el docente marco.
  // Asi, si un guardado se corto a la mitad, reintentar actualiza lo guardado en vez de chocar (409).
  async function syncAttendanceIds() {
    try {
      const attendances = await getAttendancesBySectionAndDate(sectionId, date);
      const byEnrollment = new Map(attendances.map((a) => [a.enrollmentId, a.id]));
      setRows((prev) => prev.map((r) => ({ ...r, attendanceId: byEnrollment.get(r.enrollmentId) ?? r.attendanceId })));
    } catch {
      // si tampoco se puede leer, el docente reintenta y se vuelve a intentar sincronizar
    }
  }

  // Plan B (servidor sin /attendances/batch): un pedido por alumno, de a FALLBACK_CONCURRENCY.
  async function saveOneByOne() {
    const pending = rows.map((r) => ({ ...r }));
    let done = 0;
    setProgress({ done, total: pending.length });

    for (let i = 0; i < pending.length; i += FALLBACK_CONCURRENCY) {
      const chunk = pending.slice(i, i + FALLBACK_CONCURRENCY);
      // allSettled: si uno falla, los demas del grupo terminan igual antes de cortar, para que
      // despues se pueda sincronizar exactamente que quedo guardado.
      const outcomes = await Promise.allSettled(
        chunk.map(async (row) => {
          const payload = { enrollment_id: row.enrollmentId, date, present: row.present === true ? 1 : 0 };
          if (row.attendanceId) {
            await updateAttendance(row.attendanceId, payload);
          } else {
            const created = await createAttendance(payload);
            row.attendanceId = created?.id ?? null;
          }
          done += 1;
          setProgress({ done, total: pending.length });
        }),
      );
      const failed = outcomes.find((o) => o.status === "rejected");
      if (failed) throw failed.reason;
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    setProgress(null);

    try {
      try {
        await saveAttendanceBatch({
          sectionId: Number(sectionId),
          date,
          records: rows.map((r) => ({ enrollment_id: r.enrollmentId, present: r.present === true })),
        });
      } catch (err) {
        if (err?.response?.status !== 404) throw err;
        await saveOneByOne();
      }

      showToast(`Asistencia guardada: ${presentCount} presentes y ${absentCount} ausentes.`);
      navigate("/calendario");
    } catch (err) {
      await syncAttendanceIds();
      const reason = getErrorMessage(err, "No se pudo guardar la asistencia.").replace(/[.\s]*$/, ".");
      setSaveError(
        `${reason} Lo que marcaste sigue acá: podés volver a tocar "Guardar asistencia" sin perder nada.`,
      );
      setSaving(false);
      setProgress(null);
    }
  }

  const shownRows = filteredRows.slice(0, visible);
  const hiddenCount = filteredRows.length - shownRows.length;

  return (
    <div className="users-page take-attendance">
      <Link to="/calendario" className="take-attendance-back">
        ← Calendario
      </Link>

      {loading && <p className="users-empty">Cargando...</p>}

      <LoadError message={loadError} onRetry={validParams ? () => setReloadKey((k) => k + 1) : undefined} />

      {classInfo && (
        <>
          <div className="take-attendance-header">
            <h1 className="users-title">{classInfo.courseName}</h1>
            <p className="users-subtitle">
              Comisión {classInfo.sectionName} · {formatLongDate(date)} · {classInfo.startTime}–{classInfo.endTime}
              {classInfo.classroomName ? ` · ${classInfo.classroomName}` : ""}
            </p>
            {editing && canTakeAttendance && (
              <p className="take-attendance-editing">Ya hay asistencia cargada: estás editándola.</p>
            )}
          </div>

          {!canTakeAttendance && (
            <p className="users-form-error">
              {classInfo.status === "HOLIDAY" ? "Feriado" : "Clase cancelada"}: {classInfo.reason}. No se toma asistencia.
            </p>
          )}

          {canTakeAttendance && rows.length === 0 && !loading && (
            <p className="users-empty">No hay alumnos inscriptos en esta comisión.</p>
          )}

          {canTakeAttendance && rows.length > 0 && (
            <>
              <div className="take-attendance-toolbar">
                <p className="take-attendance-count" aria-live="polite">
                  <span className="take-attendance-pill take-attendance-pill--present">Presentes {presentCount}</span>
                  <span className="take-attendance-pill take-attendance-pill--absent">Ausentes {absentCount}</span>
                  <span className="take-attendance-pill">Sin marcar {unmarkedCount}</span>
                  <span className="take-attendance-pill">Total {rows.length}</span>
                </p>
                <button type="button" className="users-btn users-btn--ghost" onClick={markAllPresent}>
                  Marcar todos presentes
                </button>
              </div>

              {rows.length > 8 && (
                <div className="take-attendance-search">
                  <input
                    type="search"
                    className="users-form-input"
                    placeholder="Buscar alumno por nombre"
                    aria-label="Buscar alumno por nombre"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <label className="take-attendance-unmarked">
                    <input type="checkbox" checked={onlyUnmarked} onChange={(e) => setOnlyUnmarked(e.target.checked)} />
                    Solo sin marcar
                  </label>
                </div>
              )}

              {filteredRows.length === 0 ? (
                <p className="users-empty">Ningún alumno coincide con la búsqueda.</p>
              ) : (
                <ul className="attendance-list">
                  {shownRows.map((row) => (
                    <AttendanceRow key={row.enrollmentId} row={row} onChoose={choose} />
                  ))}
                </ul>
              )}

              {hiddenCount > 0 && (
                <button
                  type="button"
                  className="users-btn users-btn--ghost take-attendance-more"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                >
                  Mostrar {Math.min(hiddenCount, PAGE_SIZE)} más ({hiddenCount} sin mostrar)
                </button>
              )}

              <div className="take-attendance-footer">
                {unmarkedCount > 0 && (
                  <p className="take-attendance-hint">
                    Falta marcar a {unmarkedCount} {unmarkedCount === 1 ? "alumno" : "alumnos"} para poder guardar.
                  </p>
                )}
                <button
                  type="button"
                  className="users-btn users-btn--primary"
                  onClick={handleSave}
                  disabled={saving || unmarkedCount > 0}
                >
                  {saving
                    ? progress
                      ? `Guardando ${progress.done} de ${progress.total}...`
                      : "Guardando..."
                    : "Guardar asistencia"}
                </button>
                <FormError message={saveError} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
