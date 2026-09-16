import { formatDateTime } from "../../../shared/utils/formatters";

// Tarjeta de una mesa de examen. Sirve tanto para la oferta como para las
// inscripciones del alumno; lo único que cambia es el botón de acción.
export default function ExamBoardCard({ board, badge, badgeVariant = "navy", actionLabel, actionVariant = "primary", onAction, disabled }) {
  return (
    <article className="portal-card">
      <div className="portal-card-head">
        <div>
          <h3 className="portal-card-title">{board.courseName}</h3>
          <p className="portal-card-sub">{formatDateTime(board.scheduledAt)}</p>
          {board.classroomName && <p className="portal-card-sub">Aula {board.classroomName}</p>}
          {(board.chairTeacherLastName || board.memberTeacherLastName) && (
            <p className="portal-card-sub">
              Presidente: {board.chairTeacherFirstName} {board.chairTeacherLastName}
              {board.memberTeacherLastName ? ` · Vocal: ${board.memberTeacherFirstName} ${board.memberTeacherLastName}` : ""}
            </p>
          )}
        </div>
        {badge && <span className={`users-badge users-badge--${badgeVariant}`}>{badge}</span>}
      </div>

      {(board.recordBook || board.recordFolio) && (
        <p className="portal-card-sub">
          Acta cerrada — libro {board.recordBook}, folio {board.recordFolio}
        </p>
      )}

      {actionLabel && (
        <div className="portal-card-actions">
          <button
            type="button"
            className={actionVariant === "danger" ? "users-action-btn users-action-btn--danger" : "users-btn users-btn--primary"}
            disabled={disabled}
            onClick={onAction}
          >
            {actionLabel}
          </button>
        </div>
      )}
    </article>
  );
}
