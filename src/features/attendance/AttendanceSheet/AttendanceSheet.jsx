import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getErrorMessage } from "../../../shared/api/api";
import { useToast } from "../../../context/ToastContext";
import LoadError from "../../../shared/ui/LoadError/LoadError";
import FormError from "../../../shared/ui/FormError";
import { getCalendar } from "../../calendar/services/calendarService";
import { getEnrollmentsBySection, isByEquivalence } from "../../grades/services/enrollmentService";
import {
  getAttendancesBySectionAndDate,
  createAttendance,
  updateAttendance,
  saveAttendanceBatch,
} from "../../grades/services/attendanceService";
import {
  COMMENT_MAX,
  JUSTIFIED_COMMENT_MIN,
  STATUSES,
  STATUS_LABELS,
  justifiedCommentMissing,
} from "../attendanceStatus";
import "../../users/usersPage.css";
import "./AttendanceSheet.css";

// Con cientos de alumnos no se dibujan todos a la vez: se muestran de a PAGE_SIZE y el buscador
// (o "Mostrar más") lleva al resto.
const PAGE_SIZE = 60;
// Si el servidor no tiene el guardado por lote (404), se guarda de a pocos pedidos en paralelo.
const FALLBACK_CONCURRENCY = 5;
// El contador del comentario solo aparece cuando ya se acerca al límite.
const COMMENT_COUNTER_FROM = Math.floor(COMMENT_MAX * 0.8);

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

function initials(name) {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

function statusClass(value) {
  return value.toLowerCase().replace("_", "-");
}

// Nombres cortos para que los cinco botones entren en una fila en el celular. El nombre completo
// queda en el tooltip y en la etiqueta accesible.
const SHORT_LABEL = {
  PRESENT: "Presente",
  ABSENT: "Ausente",
  JUSTIFIED: "Justif.",
  LATE: "Tarde",
  LEFT_EARLY: "Se retiró",
};

// Atajos de teclado con la fila enfocada: la letra marca el estado y pasa al alumno siguiente.
const SHORTCUTS = { p: "PRESENT", a: "ABSENT", j: "JUSTIFIED", t: "LATE", r: "LEFT_EARLY" };

const COMMENT_LABEL = {
  JUSTIFIED: "Motivo de la justificación (obligatorio)",
  ABSENT: "Nota sobre la ausencia (opcional)",
  LATE: "Nota sobre la llegada tarde (opcional)",
  LEFT_EARLY: "Nota sobre el retiro (opcional)",
};

const ICON_PATHS = {
  PRESENT: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  ABSENT: <path d="M6 6l12 12M18 6L6 18" />,
  JUSTIFIED: <path d="M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h5M9.5 16h5" />,
  LATE: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  LEFT_EARLY: <path d="M10 5H6v14h4M14 8l4 4-4 4M18 12H9" />,
};

function StatusIcon({ status }) {
  return (
    <svg
      className="attendance-icon"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[status]}
    </svg>
  );
}

function focusRow(listItem) {
  listItem?.querySelector(".attendance-row")?.focus();
}

const AttendanceRow = memo(function AttendanceRow({ row, showErrors, onChoose, onComment }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const status = row.status;
  const isException = !row.byEquivalence && status !== null && status !== "PRESENT";
  const commentRequired = status === "JUSTIFIED";
  const showComment = isException && (commentRequired || noteOpen || row.comment.length > 0);
  const missing = showErrors && justifiedCommentMissing(status, row.comment);
  const commentId = `attendance-comment-${row.enrollmentId}`;

  function handleKeyDown(event) {
    // Solo cuando el foco está en la fila misma, no en un botón ni en el campo de comentario.
    if (event.target !== event.currentTarget || event.ctrlKey || event.metaKey || event.altKey) return;
    const item = event.currentTarget.closest("li");

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      focusRow(event.key === "ArrowDown" ? item?.nextElementSibling : item?.previousElementSibling);
      return;
    }

    const target = SHORTCUTS[event.key.toLowerCase()];
    if (!target || row.byEquivalence) return;
    event.preventDefault();
    onChoose(row.enrollmentId, target);

    if (target === "JUSTIFIED") {
      // El motivo es obligatorio: el foco va directo al campo.
      requestAnimationFrame(() => {
        document.querySelector(`[data-comment-for="${row.enrollmentId}"]`)?.focus();
      });
    } else {
      focusRow(item?.nextElementSibling);
    }
  }

  return (
    <li>
      <div
        className={`attendance-row attendance-row--${status ? statusClass(status) : "unmarked"}`}
        tabIndex={0}
        data-row-id={row.enrollmentId}
        data-unmarked={status === null && !row.byEquivalence ? "true" : undefined}
        onKeyDown={handleKeyDown}
      >
        <div className="attendance-person">
          <span className="attendance-avatar" aria-hidden="true">
            {initials(row.studentName)}
          </span>
          <span className="attendance-person-text">
            <span className="attendance-row-name">{row.studentName}</span>
            <span className={`attendance-row-state attendance-row-state--${status ? statusClass(status) : "unmarked"}`}>
              {row.byEquivalence ? "Presente automático" : status ? STATUS_LABELS[status] : "Sin marcar"}
            </span>
          </span>
          {row.byEquivalence && <span className="users-badge users-badge--navy">Por equivalencia</span>}
        </div>

        {row.byEquivalence ? (
          <p className="attendance-equivalence-note">
            Tiene la materia aprobada por equivalencia: el sistema lo marca presente en cada clase.
          </p>
        ) : (
          <div className="attendance-choices" role="radiogroup" aria-label={`Asistencia de ${row.studentName}`}>
            {STATUSES.map((st) => (
              <button
                key={st.value}
                type="button"
                role="radio"
                aria-checked={status === st.value}
                title={st.label}
                aria-label={st.label}
                className={`attendance-choice attendance-choice--${statusClass(st.value)} ${status === st.value ? "is-selected" : ""}`}
                onClick={() => onChoose(row.enrollmentId, st.value)}
              >
                <StatusIcon status={st.value} />
                <span className="attendance-choice-label">{SHORT_LABEL[st.value]}</span>
              </button>
            ))}
          </div>
        )}

        {isException && !showComment && (
          <button type="button" className="attendance-note-link" onClick={() => setNoteOpen(true)}>
            + Agregar nota
          </button>
        )}

        {showComment && (
          <div className="attendance-comment">
            <label className="attendance-comment-label" htmlFor={commentId}>
              {COMMENT_LABEL[status]}
            </label>
            <div className="attendance-comment-field">
              <input
                id={commentId}
                type="text"
                className="users-form-input"
                data-comment-for={row.enrollmentId}
                aria-invalid={missing || undefined}
                aria-describedby={missing ? `${commentId}-error` : undefined}
                maxLength={COMMENT_MAX}
                value={row.comment}
                onChange={(e) => onComment(row.enrollmentId, e.target.value)}
                autoFocus={noteOpen}
              />
              {row.comment.length >= COMMENT_COUNTER_FROM && (
                <span className="attendance-comment-count" aria-hidden="true">
                  {row.comment.length}/{COMMENT_MAX}
                </span>
              )}
            </div>
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

function SkeletonRows() {
  return (
    <ul className="attendance-list attendance-list--skeleton" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <li key={i}>
          <div className="attendance-skeleton-row">
            <div className="attendance-person">
              <span className="attendance-avatar attendance-skeleton" />
              <span className="attendance-skeleton attendance-skeleton--name" />
            </div>
            <div className="attendance-skeleton attendance-skeleton--choices" />
          </div>
        </li>
      ))}
    </ul>
  );
}

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
  const [filter, setFilter] = useState("all"); // all | unmarked | un estado
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

        // La planilla va en orden alfabético por apellido y nombre (el servidor las manda por orden de inscripción).
        const roster = [...enrollments].sort(
          (a, b) =>
            String(a.studentLastName).localeCompare(String(b.studentLastName), "es") ||
            String(a.studentFirstName).localeCompare(String(b.studentFirstName), "es"),
        );

        // Cursada por equivalencia: el backend lo pone presente en cada clase y no deja
        // cambiarlo, asi que se muestra fijo en Presente (y no cuenta como cambio sin guardar).
        const initialStatus = (e, found) => (isByEquivalence(e) ? "PRESENT" : savedStatus(found));

        setClassInfo(lesson);
        setEditing(attendances.length > 0);
        initialRef.current = new Map(
          roster.map((e) => {
            const found = byEnrollment.get(e.id);
            return [e.id, { status: initialStatus(e, found), comment: found?.comment ?? "" }];
          }),
        );
        setRows(
          roster.map((e) => {
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
  const markedCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const unmarkedCount = rows.length - markedCount;
  const dirty = useMemo(
    () =>
      rows.some((r) => {
        const initial = initialRef.current.get(r.enrollmentId) ?? { status: null, comment: "" };
        return r.status !== initial.status || (r.status !== "PRESENT" && r.comment.trim() !== initial.comment.trim());
      }),
    [rows],
  );
  const canTakeAttendance = classInfo?.status === "SCHEDULED";

  // Si el filtro elegido se queda sin alumnos (por ejemplo, se cambió al único ausente), se muestra "Todos".
  const filterEmpty = filter === "unmarked" ? unmarkedCount === 0 : filter !== "all" && counts[filter] === 0;
  const activeFilter = filterEmpty ? "all" : filter;

  const filteredRows = useMemo(() => {
    const term = normalize(search.trim());
    return rows.filter((r) => {
      if (activeFilter === "unmarked" && r.status !== null) return false;
      if (activeFilter !== "all" && activeFilter !== "unmarked" && r.status !== activeFilter) return false;
      return !term || normalize(r.studentName).includes(term);
    });
  }, [rows, search, activeFilter]);

  // Cambiar el buscador o el filtro vuelve a la primera pagina.
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [search, filter]);

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

  // Solo a los que todavía no tienen estado: lo que el docente ya marcó (un ausente, un tarde) no se pisa.
  function markRemainingPresent() {
    setRows((prev) => prev.map((r) => (r.status === null ? { ...r, status: "PRESENT", comment: "" } : r)));
  }

  function goToFirstUnmarked() {
    const target = rows.find((r) => r.status === null && !r.byEquivalence);
    if (!target) return;
    setSearch("");
    setFilter("all");
    setVisible(rows.length);
    requestAnimationFrame(() => {
      const row = document.querySelector(`[data-row-id="${target.enrollmentId}"]`);
      row?.scrollIntoView({ block: "center", behavior: "smooth" });
      row?.focus({ preventScroll: true });
    });
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
      setFilter("all");
      setVisible(rows.length);
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
  const filterChips = [
    { value: "all", label: "Todos", count: rows.length },
    { value: "unmarked", label: "Sin marcar", count: unmarkedCount },
    ...STATUSES.filter((st) => counts[st.value] > 0).map((st) => ({ value: st.value, label: st.short, count: counts[st.value] })),
  ];

  return (
    <div className="take-attendance">
      {loading && <SkeletonRows />}

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
              <section className="attendance-summary" aria-label="Resumen de la asistencia">
                <div className="attendance-summary-head">
                  <p className="attendance-progress-text" aria-live="polite">
                    <strong>{markedCount}</strong> de {rows.length} marcados
                  </p>
                  {unmarkedCount > 0 && (
                    <button type="button" className="attendance-link-btn" onClick={markRemainingPresent}>
                      Marcar {unmarkedCount === 1 ? "el restante" : `los ${unmarkedCount} restantes`} como {unmarkedCount === 1 ? "presente" : "presentes"}
                    </button>
                  )}
                </div>

                <div
                  className="attendance-bar"
                  role="img"
                  aria-label={`${markedCount} de ${rows.length} alumnos marcados`}
                >
                  {STATUSES.filter((st) => counts[st.value] > 0).map((st) => (
                    <span
                      key={st.value}
                      className={`attendance-bar-seg attendance-bar-seg--${statusClass(st.value)}`}
                      style={{ flexGrow: counts[st.value] }}
                    />
                  ))}
                  {unmarkedCount > 0 && <span className="attendance-bar-seg" style={{ flexGrow: unmarkedCount }} />}
                </div>

                <div className="attendance-filters" role="group" aria-label="Filtrar la lista">
                  {filterChips.map((chip) => (
                    <button
                      key={chip.value}
                      type="button"
                      aria-pressed={activeFilter === chip.value}
                      className={`attendance-chip ${chip.value !== "all" && chip.value !== "unmarked" ? `attendance-chip--${statusClass(chip.value)}` : ""} ${activeFilter === chip.value ? "is-active" : ""}`}
                      onClick={() => setFilter(chip.value)}
                    >
                      {chip.label}
                      <span className="attendance-chip-count">{chip.count}</span>
                    </button>
                  ))}
                </div>
              </section>

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

              <p className="attendance-shortcuts">
                Con una fila enfocada: <kbd>P</kbd> presente · <kbd>A</kbd> ausente · <kbd>J</kbd> justificado ·{" "}
                <kbd>T</kbd> tarde · <kbd>R</kbd> se retiró · <kbd>↑</kbd> <kbd>↓</kbd> para moverte.
              </p>

              <div className="take-attendance-footer">
                <div className="take-attendance-footer-info">
                  {unmarkedCount > 0 ? (
                    <p className="take-attendance-hint">
                      Falta marcar a {unmarkedCount} {unmarkedCount === 1 ? "alumno" : "alumnos"} para poder guardar.{" "}
                      <button type="button" className="attendance-link-btn" onClick={goToFirstUnmarked}>
                        Ir al primero
                      </button>
                    </p>
                  ) : (
                    <p className="take-attendance-ready">Todos marcados. Revisá y guardá.</p>
                  )}
                </div>
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
