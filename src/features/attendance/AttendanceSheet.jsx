import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getErrorMessage } from "../../shared/api/api";
import { useToast } from "../../context/ToastContext";
import LoadError from "../../shared/ui/LoadError";
import FormError from "../../shared/ui/FormError";
import { getCalendar } from "../calendar/services/calendarService";
import { getEnrollmentsBySection, isByEquivalence } from "../grades/services/enrollmentService";
import {
  getAttendancesBySectionAndDate,
  createAttendance,
  updateAttendance,
  saveAttendanceBatch,
} from "../grades/services/attendanceService";
import {
  COMMENT_MAX,
  JUSTIFIED_COMMENT_MIN,
  STATUSES,
  justifiedCommentMissing,
} from "./attendanceStatus";
import "../users/usersPage.css";
import "./AttendanceSheet.css";

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

// Estado de un registro ya guardado (si el servidor no manda status, se deduce de present).
function savedStatus(record) {
  if (!record) return null;
  return record.status ?? (record.present ? "PRESENT" : "ABSENT");
}

function normalize(text) {
  return String(text).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

const COMMENT_PLACEHOLDER = {
  JUSTIFIED: "Motivo (obligatorio)",
  ABSENT: "Observación (opcional)",
  LATE: "Observación (opcional)",
  LEFT_EARLY: "Observación (opcional)",
};

function statusClass(value) {
  return value.toLowerCase().replace("_", "-");
}

const AttendanceRow = memo(function AttendanceRow({ row, showErrors, onChoose, onComment }) {
  const needsComment = !row.byEquivalence && row.status !== null && row.status !== "PRESENT";
  const missing = showErrors && justifiedCommentMissing(row.status, row.comment);
  const commentId = `attendance-comment-${row.enrollmentId}`;

  return (
    <li>
      <div className="attendance-row">
        <span className="attendance-row-name">
          {row.studentName}
          {row.byEquivalence && <span className="users-badge users-badge--navy">Por equivalencia</span>}
        </span>
        <div className="attendance-choices" role="group" aria-label={`Asistencia de ${row.studentName}`}>
          {STATUSES.map((st) => (
            <button
              key={st.value}
              type="button"
              aria-pressed={row.status === st.value}
              className={`attendance-choice attendance-choice--${statusClass(st.value)} ${row.status === st.value ? "is-selected" : ""}`}
              onClick={() => onChoose(row.enrollmentId, st.value)}
              disabled={row.byEquivalence}
            >
              {st.label}
            </button>
          ))}
        </div>
        {row.byEquivalence && (
          <p className="attendance-equivalence-note">
            Tiene la materia aprobada por equivalencia: el sistema lo marca presente en cada clase.
          </p>
        )}
        {needsComment && (
          <div className="attendance-comment">
            <input
              id={commentId}
              type="text"
              className="users-form-input"
              data-comment-for={row.enrollmentId}
              aria-label={`Comentario de ${row.studentName}`}
              aria-invalid={missing || undefined}
              aria-describedby={missing ? `${commentId}-error` : undefined}
              placeholder={COMMENT_PLACEHOLDER[row.status]}
              maxLength={COMMENT_MAX}
              value={row.comment}
              onChange={(e) => onComment(row.enrollmentId, e.target.value)}
            />
            <span className="attendance-comment-count" aria-hidden="true">
              {row.comment.length}/{COMMENT_MAX}
            </span>
            {missing && (
              <p className="attendance-comment-error" id={`${commentId}-error`} role="alert">
                Indicá el motivo de la ausencia justificada (mínimo {JUSTIFIED_COMMENT_MIN} caracteres).
              </p>
            )}
          </div>
        )}
      </div>
    </li>
  );
});

// Asistencia de UNA clase, con la comision y la fecha ya definidas: no hay nada que elegir,
// solo marcar y guardar. Lo usan el modal del calendario y la ruta /asistencia (pantalla completa).
//   onSaved(summary): se llama despues de guardar ({ counts } por estado).
//   onDirtyChange(bool): avisa si hay marcas distintas de lo guardado (para confirmar al cerrar).
//   HeadingTag: nivel del titulo segun donde se muestre (h1 en pagina, h2 en modal).
export default function AttendanceSheet({ sectionId: rawSectionId, date, onSaved, onDirtyChange, HeadingTag = "h1" }) {
  const { showToast } = useToast();
  const sectionId = String(rawSectionId ?? "");
  const validParams = /^\d+$/.test(sectionId ?? "") && /^\d{4}-\d{2}-\d{2}$/.test(date ?? "");

  const [loading, setLoading] = useState(validParams);
  const [loadError, setLoadError] = useState(validParams ? "" : "Falta indicar la clase. Elegila desde el calendario.");
  const [saveError, setSaveError] = useState("");
  const [classInfo, setClassInfo] = useState(null);
  const [rows, setRows] = useState([]); // { enrollmentId, studentName, attendanceId, status: PRESENT | ABSENT | JUSTIFIED | LATE | LEFT_EARLY | null (sin marcar), comment }
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null); // { done, total } mientras se guarda uno por uno
  const [search, setSearch] = useState("");
  const [onlyUnmarked, setOnlyUnmarked] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [reloadKey, setReloadKey] = useState(0);
  const [showErrors, setShowErrors] = useState(false); // se marcan los motivos faltantes tras intentar guardar
  const initialRef = useRef(new Map()); // enrollmentId -> { status, comment } guardado en el servidor, para detectar cambios

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

        // Cursada por equivalencia: el backend lo pone presente en cada clase y no deja
        // cambiarlo, asi que se muestra fijo en Presente (y no cuenta como cambio sin guardar).
        const initialStatus = (e, found) => (isByEquivalence(e) ? "PRESENT" : savedStatus(found));

        setClassInfo(lesson);
        setEditing(attendances.length > 0);
        initialRef.current = new Map(
          enrollments.map((e) => {
            const found = byEnrollment.get(e.id);
            return [e.id, { status: initialStatus(e, found), comment: found?.comment ?? "" }];
          }),
        );
        setRows(
          enrollments.map((e) => {
            const found = byEnrollment.get(e.id);
            return {
              enrollmentId: e.id,
              studentName: `${e.studentFirstName} ${e.studentLastName}`,
              attendanceId: found?.id ?? null,
              // Sin marcar a proposito: sin estado hasta que el docente lo decida.
              status: initialStatus(e, found),
              comment: found?.comment ?? "",
              byEquivalence: isByEquivalence(e),
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

  const counts = useMemo(() => {
    const c = Object.fromEntries(STATUSES.map((st) => [st.value, 0]));
    rows.forEach((r) => {
      if (r.status) c[r.status] += 1;
    });
    return c;
  }, [rows]);
  const unmarkedCount = rows.length - Object.values(counts).reduce((a, b) => a + b, 0);
  const dirty = useMemo(
    () =>
      rows.some((r) => {
        const initial = initialRef.current.get(r.enrollmentId) ?? { status: null, comment: "" };
        return r.status !== initial.status || (r.status !== "PRESENT" && r.comment.trim() !== initial.comment.trim());
      }),
    [rows],
  );
  const canTakeAttendance = classInfo?.status === "SCHEDULED";

  const filteredRows = useMemo(() => {
    const term = normalize(search.trim());
    return rows.filter(
      (r) => (!onlyUnmarked || r.status === null) && (!term || normalize(r.studentName).includes(term)),
    );
  }, [rows, search, onlyUnmarked]);

  // Cambiar el buscador o el filtro vuelve a la primera pagina.
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [search, onlyUnmarked]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  // Presente no lleva comentario: al elegirlo se descarta el que hubiera.
  const choose = useCallback((enrollmentId, status) => {
    setRows((prev) =>
      prev.map((r) =>
        r.enrollmentId === enrollmentId && !r.byEquivalence
          ? { ...r, status, comment: status === "PRESENT" ? "" : r.comment }
          : r,
      ),
    );
  }, []);

  const changeComment = useCallback((enrollmentId, comment) => {
    setRows((prev) => prev.map((r) => (r.enrollmentId === enrollmentId ? { ...r, comment } : r)));
  }, []);

  function markAllPresent() {
    setRows((prev) => prev.map((r) => ({ ...r, status: "PRESENT", comment: "" })));
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
  // Los de cursada por equivalencia no se mandan: el backend no deja cargarlos a mano (409).
  async function saveOneByOne() {
    const pending = rows.filter((r) => !r.byEquivalence).map((r) => ({ ...r }));
    let done = 0;
    setProgress({ done, total: pending.length });

    for (let i = 0; i < pending.length; i += FALLBACK_CONCURRENCY) {
      const chunk = pending.slice(i, i + FALLBACK_CONCURRENCY);
      // allSettled: si uno falla, los demas del grupo terminan igual antes de cortar, para que
      // despues se pueda sincronizar exactamente que quedo guardado.
      const outcomes = await Promise.allSettled(
        chunk.map(async (row) => {
          // El PUT reemplaza el comentario: se manda siempre el actual (null si no hay).
          const payload = {
            enrollment_id: row.enrollmentId,
            date,
            status: row.status,
            comment: row.status === "PRESENT" ? null : row.comment.trim() || null,
          };
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

  function summaryText() {
    const parts = STATUSES.filter((st) => counts[st.value] > 0).map((st) => `${counts[st.value]} ${st.short.toLowerCase()}`);
    return `Asistencia guardada: ${parts.join(", ")}.`;
  }

  async function handleSave() {
    // Una ausencia justificada sin motivo no se guarda: se marca el campo y se lleva el foco ahi.
    const invalid = rows.find((r) => justifiedCommentMissing(r.status, r.comment));
    if (invalid) {
      setShowErrors(true);
      setSearch("");
      setOnlyUnmarked(false);
      requestAnimationFrame(() => {
        const field = document.querySelector(`[data-comment-for="${invalid.enrollmentId}"]`);
        field?.scrollIntoView({ block: "center" });
        field?.focus({ preventScroll: true });
      });
      return;
    }

    setSaving(true);
    setSaveError("");
    setProgress(null);

    try {
      try {
        // Los de cursada por equivalencia van igual (como Presente): el backend los ignora y les
        // pone su presente automatico, y asi una comision donde todos cursan por equivalencia
        // tambien registra la clase.
        await saveAttendanceBatch({
          sectionId: Number(sectionId),
          date,
          records: rows.map((r) => ({
            enrollment_id: r.enrollmentId,
            status: r.status,
            ...(r.status !== "PRESENT" && r.comment.trim() ? { comment: r.comment.trim() } : {}),
          })),
        });
      } catch (err) {
        if (err?.response?.status !== 404) throw err;
        await saveOneByOne();
      }

      showToast(summaryText());
      onSaved?.({ counts });
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
    <div className="take-attendance">
      {loading && <p className="users-empty">Cargando...</p>}

      <LoadError message={loadError} onRetry={validParams ? () => setReloadKey((k) => k + 1) : undefined} />

      {classInfo && (
        <>
          <div className="take-attendance-header">
            <HeadingTag className="users-title">{classInfo.courseName}</HeadingTag>
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
                  {STATUSES.map((st) => (
                    <span
                      key={st.value}
                      className={`take-attendance-pill take-attendance-pill--${statusClass(st.value)}`}
                    >
                      {st.short} {counts[st.value]}
                    </span>
                  ))}
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
                    <AttendanceRow key={row.enrollmentId} row={row} showErrors={showErrors} onChoose={choose} onComment={changeComment} />
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
