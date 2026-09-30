import { formatDateTime, isPast } from "../../../shared/utils/formatters";
import { getResultStatus, getResultLabel } from "../services/examEnrollmentService";

function statusBadgeClass(enrollment) {
  const result = getResultStatus(enrollment);
  if (result === "passed") return "users-badge users-badge--active";
  if (result === "failed" || result === "absent") return "users-badge users-badge--inactive";
  return "users-badge users-badge--gray";
}

export default function ActaDetail({ board, enrollments, loading, closed, canGrade, onGrade, onCloseActa, onDeleteBoard }) {
  const pending = enrollments.filter((e) => getResultStatus(e) === "pending").length;
  const held = isPast(board.scheduledAt);
  const canClose = !closed && held && enrollments.length > 0 && pending === 0;
  const canDelete = !closed && !!onDeleteBoard && board.enrolledCount === 0;

  return (
    <div className="portal-acta-detail">
      <div className="plans-toolbar">
        <div>
          <h2 className="portal-section-title">{board.courseName}</h2>
          <p className="users-subtitle">
            {formatDateTime(board.scheduledAt)}
            {board.classroomName ? ` · Aula ${board.classroomName}` : ""}
          </p>
          {closed && (
            <p className="users-subtitle">
              Acta cerrada — libro {board.recordBook}, folio {board.recordFolio}
            </p>
          )}
        </div>

        <div className="users-header-actions">
          {canDelete && (
            <button type="button" className="users-btn users-btn--ghost" onClick={onDeleteBoard}>
              Eliminar mesa
            </button>
          )}
          <button
            type="button"
            className="users-btn users-btn--primary"
            disabled={!canClose}
            onClick={onCloseActa}
          >
            Cerrar acta
          </button>
        </div>
      </div>

      {!closed && !held && (
        <p className="users-subtitle">El acta se puede cerrar recién después de la fecha del examen.</p>
      )}
      {!closed && held && enrollments.length === 0 && (
        <p className="users-subtitle">No se puede cerrar el acta: no hay ningún alumno inscripto.</p>
      )}
      {!closed && held && enrollments.length > 0 && pending > 0 && (
        <p className="users-subtitle">
          Falta cargar {pending} nota{pending !== 1 ? "s" : ""} para poder cerrar el acta.
        </p>
      )}
      {!closed && !canGrade && (
        <p className="users-subtitle">Las notas las carga el docente presidente o vocal de la mesa, o el Administrador.</p>
      )}

      {loading && <p className="users-empty">Cargando inscriptos...</p>}

      {!loading && enrollments.length === 0 && (
        <p className="users-empty">Esta mesa todavía no tiene alumnos inscriptos.</p>
      )}

      {!loading && enrollments.length > 0 && (
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
                      disabled={closed || !canGrade}
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
      )}
    </div>
  );
}
