import { useState } from "react";
import { useToast } from "../../context/ToastContext";
import { useStudentExamBoards } from "./hooks/useStudentExamBoards";
import { getResultStatus, getResultLabel } from "./services/examEnrollmentService";
import { getErrorCode, getErrorMessage } from "../../shared/api/api";
import { isPast } from "../../shared/utils/formatters";
import EnrollmentPeriodBanner from "../enrollments/components/EnrollmentPeriodBanner";
import { useOpenEnrollmentPeriods } from "../enrollments/hooks/useOpenEnrollmentPeriods";
import ExamBoardCard from "./components/ExamBoardCard";
import { useLostRegularity } from "../regularity/useLostRegularity";
import { lostReasonText } from "../regularity/regularityStatus";
import { REGULARITY_LOST } from "../regularity/services/regularityService";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import LoadError from "../../shared/ui/LoadError/LoadError";
import "../users/usersPage/usersPage.css";
import "../plans/plansPage/plansPage.css";
import "../enrollments/portalCursadasPage/portalCursadasPage.css";

function badgeForEnrollment(enrollment) {
  const result = getResultStatus(enrollment);
  if (result === "passed") return "active";
  if (result === "failed" || result === "absent" || result === "cancelled") return "inactive";
  return "navy";
}

export default function PortalFinalesPage() {
  const { student, available, enrolled, loading, loadError, reload, enroll, unenroll } = useStudentExamBoards();
  const { showToast } = useToast();
  const { blockedFor, reload: reloadLost } = useLostRegularity();

  const { periods, loading: loadingPeriods, isOpen: enrollmentOpen } = useOpenEnrollmentPeriods("FINAL");
  const [submitting, setSubmitting] = useState(false);
  const [enrollmentToCancel, setEnrollmentToCancel] = useState(null);

  async function handleEnroll(examBoardId) {
    setSubmitting(true);
    try {
      await enroll(examBoardId);
      showToast("Inscripción a la mesa confirmada.");
    } catch (e) {
      if (getErrorCode(e) === REGULARITY_LOST) reloadLost();
      showToast(getErrorMessage(e, "No pudimos inscribirte a la mesa."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmUnenroll() {
    const enrollment = enrollmentToCancel;
    setEnrollmentToCancel(null);
    setSubmitting(true);
    try {
      await unenroll(enrollment.id);
      showToast("Baja de la mesa confirmada.");
    } catch (e) {
      showToast(getErrorMessage(e, "No pudimos dar de baja tu inscripción."), "error");
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

      <EnrollmentPeriodBanner periods={periods} loading={loadingPeriods} label="mesas de examen" />

      <LoadError message={loadError} onRetry={reload} />

      {loading && <p className="users-empty">Cargando...</p>}

      {!loading && !loadError && (
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
              {available.map((board) => {
                // Con la regularidad perdida no se ofrece el botón; si igual llegara un pedido, el servidor responde REGULARITY_LOST.
                const lostItem = blockedFor(board.courseId);
                return (
                  <ExamBoardCard
                    key={board.id}
                    board={board}
                    badge={lostItem ? "Regularidad perdida" : undefined}
                    badgeVariant="inactive"
                    note={
                      lostItem
                        ? `Perdiste la regularidad de esta materia ${lostReasonText(lostItem)}. Para rendir el final tenés que recuperarla: consultá en Bedelía.`
                        : undefined
                    }
                    actionLabel={lostItem ? null : "Inscribirme"}
                    disabled={submitting || !enrollmentOpen}
                    onAction={() => handleEnroll(board.id)}
                  />
                );
              })}
            </div>
          </section>

          <hr className="plans-divider" />

          <section className="portal-section">
            <div className="plans-toolbar">
              <h2 className="portal-section-title">Mis finales</h2>
              <p className="users-subtitle">
                {enrolled.length} {enrolled.length !== 1 ? "inscripciones" : "inscripción"}
              </p>
            </div>

            {enrolled.length === 0 && (
              <p className="users-empty">Todavía no te inscribiste a ninguna mesa.</p>
            )}

            <div className="portal-cards">
              {enrolled.map(({ enrollment, board }) => {
                // Una vez que pasó la fecha (o que ya tiene nota) la baja deja
                // de tener sentido: el acta la cierra Bedelía. Si la mesa fue
                // cancelada tampoco hay baja (ya está rechazada).
                const closed = isPast(board.scheduledAt) || enrollment.finalGrade !== null || board.cancelled;

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
