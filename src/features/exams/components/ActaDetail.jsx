import { classroomLabel, formatDateTime, isPast } from "../../../shared/utils/formatters";
import ListFilters from "../../../shared/ui/ListFilters/ListFilters";
import LoadError from "../../../shared/ui/LoadError/LoadError";
import Pagination from "../../../shared/ui/Pagination/Pagination";
import { getResultStatus, getResultLabel } from "../services/examEnrollmentService";

const RESULT_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "present", label: "Presente (con nota)" },
  { value: "absent", label: "Ausente" },
  { value: "cancelled", label: "Cancelada" },
];

function statusBadgeClass(enrollment) {
  const result = getResultStatus(enrollment);
  if (result === "passed") return "users-badge users-badge--active";
  if (result === "failed" || result === "absent") return "users-badge users-badge--inactive";
  return "users-badge users-badge--gray";
}

// list: estado de los inscriptos paginados en el servidor (ver useBoardEnrollments).
// pending y board.enrolledCount son de TODA la mesa, no solo de la página visible.
export default function ActaDetail({ board, list, closed, canGrade, onGrade, onCloseActa, onDeleteBoard, onCancelBoard }) {
  const { enrollments, loading, error, pendingCount: pending } = list;
  const enrolledCount = board.enrolledCount ?? 0;
  const held = isPast(board.scheduledAt);
  const cancelled = board.cancelled;
  const canClose = !closed && !cancelled && held && enrolledCount > 0 && pending === 0;
  const canDelete = !closed && !cancelled && !!onDeleteBoard && board.enrolledCount === 0;
  // "Cancelar mesa" rechaza en bloque las inscripciones (si hay) con un motivo
  // y marca la mesa como cancelada sin borrarla (queda como registro histórico,
  // visible para el alumno con el motivo). A diferencia de "Eliminar", funciona
  // tenga o no inscriptos: es la única acción que deja un motivo registrado.
  const canCancel = !closed && !cancelled && !!onCancelBoard;

  return (
    <div className="portal-acta-detail">
      <div className="plans-toolbar">
        <div>
          <h2 className="portal-section-title">{board.courseName}</h2>
          <p className="users-subtitle">
            {formatDateTime(board.scheduledAt)}
            {board.classroomName ? ` · ${classroomLabel(board.classroomName)}` : ""}
          </p>
          {closed && (
            <p className="users-subtitle">
              Acta cerrada — libro {board.recordBook}, folio {board.recordFolio}
            </p>
          )}
          {cancelled && (
            <p className="users-subtitle">Mesa cancelada — motivo: {board.cancellationReason}</p>
          )}
        </div>

        <div className="users-header-actions">
          {canDelete && (
            <button type="button" className="users-btn users-btn--ghost" onClick={onDeleteBoard}>
              Eliminar mesa
            </button>
          )}
          {canCancel && (
            <button type="button" className="users-btn users-btn--ghost" onClick={onCancelBoard}>
              Cancelar mesa
            </button>
          )}
          {!cancelled && (
            <button
              type="button"
              className="users-btn users-btn--primary"
              disabled={!canClose}
              onClick={onCloseActa}
            >
              Cerrar acta
            </button>
          )}
        </div>
      </div>

      {!closed && !cancelled && (
        <p className="users-subtitle">
          <strong>Eliminar</strong>: solo si no hay inscriptos, borra la mesa sin dejar rastro.{" "}
          <strong>Cancelar</strong>: rechaza a los inscriptos (si hay) con un motivo; la mesa queda como
          registro histórico, visible para el alumno. <strong>Cerrar acta</strong>: recién después de la
          fecha del examen, con todas las notas cargadas.
        </p>
      )}

      {!closed && !cancelled && !held && (
        <p className="users-subtitle">El acta se puede cerrar recién después de la fecha del examen.</p>
      )}
      {!closed && !cancelled && held && enrolledCount === 0 && (
        <p className="users-subtitle">No se puede cerrar el acta: no hay ningún alumno inscripto.</p>
      )}
      {!closed && !cancelled && held && enrolledCount > 0 && pending > 0 && (
        <p className="users-subtitle">
          Falta cargar {pending} nota{pending !== 1 ? "s" : ""} para poder cerrar el acta.
        </p>
      )}
      {!closed && !cancelled && !canGrade && (
        <p className="users-subtitle">Las notas las carga el docente presidente o vocal de la mesa, o el Administrador.</p>
      )}

      {enrolledCount > 0 && (
        <ListFilters
          idPrefix="acta-enrollments"
          search={list.filters.search}
          onSearchChange={(value) => list.changeFilter("search", value)}
          searchLabel="Buscar alumno"
          searchPlaceholder="Nombre, apellido o legajo"
          selects={[
            {
              id: "status",
              label: "Resultado",
              value: list.filters.status,
              onChange: (value) => list.changeFilter("status", value),
              options: RESULT_OPTIONS,
              allLabel: "Todos",
            },
          ]}
          hasFilters={list.hasFilters}
          onClear={list.clearFilters}
        />
      )}

      <LoadError message={error} onRetry={list.reload} />

      {loading && enrollments.length === 0 && !error && <p className="users-empty">Cargando inscriptos...</p>}

      {!loading && !error && enrollments.length === 0 && (
        <p className="users-empty">
          {enrolledCount === 0 ? "Esta mesa todavía no tiene alumnos inscriptos." : "No hay inscriptos con esos filtros."}
        </p>
      )}

      {!error && enrollments.length > 0 && (
        <div className={"users-list" + (loading ? " users-list--loading" : "")} aria-busy={loading}>
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th className="users-th">Legajo</th>
                <th className="users-th">Alumno</th>
                <th className="users-th">Estado</th>
                <th className="users-th">Nota</th>
                <th className="users-th users-th--actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e.id} className="users-row">
                  <td className="users-td users-td--mono">{e.enrollmentNumber}</td>
                  <td className="users-td">
                    {e.studentLastName}, {e.studentFirstName}
                  </td>
                  <td className="users-td">
                    <span className={statusBadgeClass(e)}>{getResultLabel(e)}</span>
                  </td>
                  <td className="users-td users-td--mono">
                    {e.finalGrade === null || e.finalGrade === undefined ? "—" : e.finalGrade}
                  </td>
                  <td className="users-td users-td--actions">
                    <button
                      type="button"
                      className="users-action-btn"
                      disabled={closed || cancelled || !canGrade}
                      onClick={() => onGrade(e)}
                    >
                      {e.finalGrade === null || e.finalGrade === undefined ? "Cargar nota" : "Editar nota"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          onPageChange={list.setPage}
          onPageSizeChange={list.changePageSize}
          noun={["inscripto", "inscriptos"]}
        />
        </div>
      )}
    </div>
  );
}
