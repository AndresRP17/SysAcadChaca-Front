import { useState } from "react";
import { useStudentExamBoards } from "./hooks/useStudentExamBoards";
import { getResultStatus, getResultLabel } from "./services/examEnrollmentService";
import { getErrorMessage } from "../../shared/api/api";
import { isPast } from "../../shared/utils/formatters";
import ExamBoardCard from "./components/ExamBoardCard";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import "../users/usersPage.css";
import "../plans/plansPage.css";
import "../enrollments/portalCursadasPage.css";

function badgeForEnrollment(enrollment) {
  const result = getResultStatus(enrollment);
  if (result === "passed") return "active";
  if (result === "failed" || result === "absent") return "inactive";
  return "navy";
}

export default function PortalFinalesPage() {
  const { student, available, enrolled, loading, error, setError, enroll, unenroll } = useStudentExamBoards();

  const [submitting, setSubmitting] = useState(false);
  const [enrollmentToCancel, setEnrollmentToCancel] = useState(null);

  async function handleEnroll(examBoardId) {
    setSubmitting(true);
    setError("");
    try {
      await enroll(examBoardId);
    } catch (e) {
      setError(getErrorMessage(e, "No pudimos inscribirte a la mesa."));
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmUnenroll() {
    const enrollment = enrollmentToCancel;
    setEnrollmentToCancel(null);
    setSubmitting(true);
    setError("");
    try {
      await unenroll(enrollment.id);
    } catch (e) {
      setError(getErrorMessage(e, "No pudimos dar de baja tu inscripción."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">Inscripción a finales</h1>
          <p className="users-subtitle">
            {student
              ? `Legajo ${student.enrollmentNumber} — ${student.firstName} ${student.lastName}`
              : "Mesas de examen de tu plan de estudio"}
          </p>
        </div>
      </div>

      {error && <p className="users-form-error">{error}</p>}

      {loading && <p className="users-empty">Cargando...</p>}

      {!loading && (
        <>
          <section className="portal-section">
            <div className="plans-toolbar">
              <h2 className="portal-section-title">Mesas disponibles</h2>
              <p className="users-subtitle">
                {available.length} mesa{available.length !== 1 ? "s" : ""} abierta{available.length !== 1 ? "s" : ""}
              </p>
            </div>

            {available.length === 0 && (
              <p className="users-empty">No hay mesas abiertas para tus materias en este momento.</p>
            )}

            <div className="portal-cards">
              {available.map((board) => (
                <ExamBoardCard
                  key={board.id}
                  board={board}
                  actionLabel="Inscribirme"
                  disabled={submitting}
                  onAction={() => handleEnroll(board.id)}
                />
              ))}
            </div>
          </section>

          <hr className="plans-divider" />

          <section className="portal-section">
            <div className="plans-toolbar">
              <h2 className="portal-section-title">Mis finales</h2>
              <p className="users-subtitle">
                {enrolled.length} inscripción{enrolled.length !== 1 ? "es" : ""}
              </p>
            </div>

            {enrolled.length === 0 && (
              <p className="users-empty">Todavía no te inscribiste a ninguna mesa.</p>
            )}

            <div className="portal-cards">
              {enrolled.map(({ enrollment, board }) => {
                // Una vez que pasó la fecha (o que ya tiene nota) la baja deja
                // de tener sentido: el acta la cierra Bedelía.
                const closed = isPast(board.scheduledAt) || enrollment.finalGrade !== null;

                return (
                  <ExamBoardCard
                    key={enrollment.id}
                    board={board}
                    badge={
                      enrollment.finalGrade !== null && enrollment.finalGrade !== undefined
                        ? `${getResultLabel(enrollment)} · ${enrollment.finalGrade}`
                        : getResultLabel(enrollment)
                    }
                    badgeVariant={badgeForEnrollment(enrollment)}
                    actionLabel={closed ? null : "Darme de baja"}
                    actionVariant="danger"
                    disabled={submitting}
                    onAction={() => setEnrollmentToCancel(enrollment)}
                  />
                );
              })}
            </div>
          </section>
        </>
      )}

      <ConfirmModal
        open={!!enrollmentToCancel}
        title="Darte de baja"
        message="¿Seguro que querés darte de baja de esta mesa? Vas a poder volver a inscribirte hasta la fecha del examen."
        onCancel={() => setEnrollmentToCancel(null)}
        onConfirm={confirmUnenroll}
      />
    </div>
  );
}
