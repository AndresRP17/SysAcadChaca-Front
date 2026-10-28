import { useState } from "react";
import { useToast } from "../../context/ToastContext";
import { ENROLLMENT_PERIOD_CLOSED, getErrorCode, getErrorMessage } from "../../shared/api/api";
import SearchCombobox from "../../shared/ui/SearchCombobox";
import { studentOption } from "../../shared/ui/searchOptions";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import LoadError from "../../shared/ui/LoadError/LoadError";
import { getStudent, searchStudents } from "../users/services/studentService";
import { useStudentSections } from "./hooks/useStudentSections";
import { useStudentExamBoards } from "../exams/hooks/useStudentExamBoards";
import { getResultLabel, getResultStatus } from "../exams/services/examEnrollmentService";
import { isPast } from "../../shared/utils/formatters";
import AvailableSectionsList from "./components/AvailableSectionsList";
import EnrolledSectionsList from "./components/EnrolledSectionsList";
import OutOfTermModal from "./components/OutOfTermModal";
import RetakeModal from "../regularity/RetakeModal";
import StudentRegularityPanel from "../regularity/StudentRegularityPanel";
import { sectionOverrides } from "../regularity/regularityStatus";
import ExamBoardCard from "../exams/components/ExamBoardCard";
import "../users/usersPage/usersPage.css";
import "../plans/plansPage/plansPage.css";
import "./portalCursadasPage/portalCursadasPage.css";

function badgeForEnrollment(enrollment) {
  const result = getResultStatus(enrollment);
  if (result === "passed") return "active";
  if (result === "failed" || result === "absent") return "inactive";
  return "navy";
}

// Cursadas y finales del alumno elegido — mismos hooks y componentes que el
// portal del alumno, pero con studentId explícito (el Bedel inscribe "por" el
// alumno, no a sí mismo). Fuera del período de inscripción el servidor responde
// ENROLLMENT_PERIOD_CLOSED: se avisa y, si el Bedel confirma con un motivo, se
// inscribe fuera de término (queda registrado). Además se validan cupo,
// correlativas y choque de horario.
function StudentEnrollments({ studentId }) {
  const { showToast } = useToast();
  const sectionsHook = useStudentSections(studentId);
  const examBoardsHook = useStudentExamBoards(studentId);
  const [submitting, setSubmitting] = useState(false);
  const [sectionToCancel, setSectionToCancel] = useState(null);
  const [examToCancel, setExamToCancel] = useState(null);
  // Inscripción rechazada por período cerrado, a la espera de que el Bedel confirme: { kind, id }
  const [outOfTermTarget, setOutOfTermTarget] = useState(null);
  // Comisión con la regularidad vigente (recursar), a la espera de motivo: { id, courseName, outOfTerm }
  const [retakeTarget, setRetakeTarget] = useState(null);

  const { available, enrolled, loading, loadError, reload, enroll, unenroll } = sectionsHook;
  const {
    available: availableBoards,
    enrolled: enrolledBoards,
    loading: loadingBoards,
    loadError: examLoadError,
    reload: reloadExams,
    enroll: enrollExam,
    unenroll: unenrollExam,
  } = examBoardsHook;

  async function doEnrollSection(sectionId) {
    setSubmitting(true);
    try {
      await enroll(sectionId);
      showToast("Inscripción a la cursada confirmada");
    } catch (e) {
      if (getErrorCode(e) === ENROLLMENT_PERIOD_CLOSED) {
        setOutOfTermTarget({ kind: "section", id: sectionId });
        return;
      }
      showToast(getErrorMessage(e, "No pudimos completar la inscripción."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEnrollSection(sectionId) {
    // El servidor ya avisa si el período está cerrado: se pide directo la confirmación y el motivo.
    const section = available.find((item) => item.section.id === sectionId)?.section;
    const { outOfTerm, retake } = sectionOverrides(section?.blockedReasons);
    if (retake) {
      // Recursar (con o sin período cerrado): un solo modal que pide los motivos que haga falta.
      setRetakeTarget({ id: sectionId, courseName: section.courseName, outOfTerm });
      return;
    }
    if (outOfTerm) {
      setOutOfTermTarget({ kind: "section", id: sectionId });
      return;
    }
    doEnrollSection(sectionId);
  }

  async function confirmUnenrollSection() {
    const enrollment = sectionToCancel;
    setSectionToCancel(null);
    setSubmitting(true);
    try {
      await unenroll(enrollment.id);
      showToast("Baja de la cursada confirmada");
    } catch (e) {
      showToast(getErrorMessage(e, "No pudimos dar de baja la inscripción."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEnrollExam(examBoardId) {
    setSubmitting(true);
    try {
      await enrollExam(examBoardId);
      showToast("Inscripción a la mesa confirmada");
    } catch (e) {
      if (getErrorCode(e) === ENROLLMENT_PERIOD_CLOSED) {
        setOutOfTermTarget({ kind: "exam", id: examBoardId });
        return;
      }
      showToast(getErrorMessage(e, "No pudimos inscribir al alumno a la mesa."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Si el servidor rechaza de nuevo, el error queda en el modal (lo muestra OutOfTermModal).
  async function confirmOutOfTerm(reason) {
    const { kind, id } = outOfTermTarget;
    if (kind === "section") {
      await enroll(id, { outOfTerm: { reason } });
      showToast("Inscripción a la cursada confirmada (fuera de término)");
    } else {
      await enrollExam(id, { reason });
      showToast("Inscripción a la mesa confirmada (fuera de término)");
    }
    setOutOfTermTarget(null);
  }

  // Si el servidor rechaza de nuevo, el error queda en el modal (lo muestra RetakeModal).
  async function confirmRetake({ retakeReason, outOfTermReason }) {
    await enroll(retakeTarget.id, {
      retake: { reason: retakeReason },
      outOfTerm: outOfTermReason ? { reason: outOfTermReason } : null,
    });
    showToast(
      retakeTarget.outOfTerm
        ? "Cursada recursada y confirmada (fuera de término)"
        : "Cursada recursada y confirmada",
    );
    setRetakeTarget(null);
  }

  async function reloadAfterRevalidation() {
    await Promise.all([reload(), reloadExams()]);
  }

  async function confirmUnenrollExam() {
    const enrollment = examToCancel;
    setExamToCancel(null);
    setSubmitting(true);
    try {
      await unenrollExam(enrollment.id);
      showToast("Baja de la mesa confirmada");
    } catch (e) {
      showToast(getErrorMessage(e, "No pudimos dar de baja la inscripción."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <StudentRegularityPanel studentId={studentId} onChanged={reloadAfterRevalidation} />

      <hr className="plans-divider" />

      <section className="portal-section">
        <h2 className="portal-section-title">Cursadas</h2>
        <LoadError message={loadError} onRetry={reload} />
        {loading && <p className="users-empty">Cargando...</p>}

        {!loading && !loadError && (
          <>
            <p className="users-subtitle">Oferta disponible</p>
            <AvailableSectionsList
              items={available}
              onEnroll={handleEnrollSection}
              submitting={submitting}
              actionLabel="Inscribir"
              retakeLabel="Recursar"
              emptyLabel="No hay comisiones abiertas para este alumno en este momento."
            />

            <p className="users-subtitle" style={{ marginTop: 16 }}>
              Cursadas activas ({enrolled.length})
            </p>
            <EnrolledSectionsList
              items={enrolled}
              onUnenroll={setSectionToCancel}
              submitting={submitting}
              actionLabel="Dar de baja"
              emptyLabel="Este alumno no tiene cursadas activas."
            />
          </>
        )}
      </section>

      <hr className="plans-divider" />

      <section className="portal-section">
        <h2 className="portal-section-title">Finales</h2>
        <LoadError message={examLoadError} onRetry={reloadExams} />
        {loadingBoards && <p className="users-empty">Cargando...</p>}

        {!loadingBoards && !examLoadError && (
          <>
            <p className="users-subtitle">Mesas disponibles</p>
            {availableBoards.length === 0 && (
              <p className="users-empty">No hay mesas abiertas para las materias de este alumno.</p>
            )}
            <div className="portal-cards">
              {availableBoards.map((board) => (
                <ExamBoardCard
                  key={board.id}
                  board={board}
                  actionLabel="Inscribir"
                  disabled={submitting}
                  onAction={() => handleEnrollExam(board.id)}
                />
              ))}
            </div>

            <p className="users-subtitle" style={{ marginTop: 16 }}>
              Inscripciones a finales ({enrolledBoards.length})
            </p>
            {enrolledBoards.length === 0 && (
              <p className="users-empty">Este alumno no está inscripto a ninguna mesa.</p>
            )}
            <div className="portal-cards">
              {enrolledBoards.map(({ enrollment, board }) => {
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
                    actionLabel={closed ? null : "Dar de baja"}
                    actionVariant="danger"
                    disabled={submitting}
                    onAction={() => setExamToCancel(enrollment)}
                  />
                );
              })}
            </div>
          </>
        )}
      </section>

      <OutOfTermModal
        open={outOfTermTarget !== null}
        what={outOfTermTarget?.kind === "exam" ? "mesas de examen" : "cursadas"}
        onClose={() => setOutOfTermTarget(null)}
        onConfirm={confirmOutOfTerm}
      />

      <RetakeModal
        open={retakeTarget !== null}
        courseName={retakeTarget?.courseName}
        outOfTerm={Boolean(retakeTarget?.outOfTerm)}
        onClose={() => setRetakeTarget(null)}
        onConfirm={confirmRetake}
      />

      <ConfirmModal
        open={!!sectionToCancel}
        title="Dar de baja"
        message="¿Seguro que querés dar de baja al alumno de esta comisión?"
        onCancel={() => setSectionToCancel(null)}
        onConfirm={confirmUnenrollSection}
      />

      <ConfirmModal
        open={!!examToCancel}
        title="Dar de baja"
        message="¿Seguro que querés dar de baja al alumno de esta mesa?"
        onCancel={() => setExamToCancel(null)}
        onConfirm={confirmUnenrollExam}
      />
    </>
  );
}

export default function BedelEnrollPage() {
  const [selectedStudentId, setSelectedStudentId] = useState("");

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">Inscribir alumno</h1>
          <p className="users-subtitle">
            Buscá un alumno para inscribirlo a una cursada o a un final, si cumple los requisitos.
          </p>
        </div>
      </div>

      <div className="users-form-field" style={{ maxWidth: 480 }}>
        <label className="users-form-label" htmlFor="bedelEnrollPage-1">Alumno</label>
        <SearchCombobox id="bedelEnrollPage-1"
          value={selectedStudentId}
          onChange={setSelectedStudentId}
          loadOptions={async (q) => {
            const page = await searchStudents({ q });
            return { items: page.items.map(studentOption), total: page.total };
          }}
          loadSelected={async (id) => studentOption(await getStudent(id))}
          placeholder="Buscar por apellido, nombre, legajo o DNI..."
          emptyLabel="No se encontraron alumnos"
        />
      </div>

      {selectedStudentId && <StudentEnrollments key={selectedStudentId} studentId={Number(selectedStudentId)} />}
    </div>
  );
}
