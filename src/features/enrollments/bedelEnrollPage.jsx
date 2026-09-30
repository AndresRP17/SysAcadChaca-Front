import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../shared/api/api";
import Combobox from "../../shared/ui/Combobox";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import { getStudents } from "../users/services/studentService";
import { useStudentSections } from "./hooks/useStudentSections";
import { useStudentExamBoards } from "../exams/hooks/useStudentExamBoards";
import { findScheduleConflicts } from "./utils/scheduleConflicts";
import { getResultLabel, getResultStatus } from "../exams/services/examEnrollmentService";
import { isPast } from "../../shared/utils/formatters";
import AvailableSectionsList from "./components/AvailableSectionsList";
import EnrolledSectionsList from "./components/EnrolledSectionsList";
import ConflictModal from "./components/ConflictModal";
import ExamBoardCard from "../exams/components/ExamBoardCard";
import "../users/usersPage.css";
import "../plans/plansPage.css";
import "./portalCursadasPage.css";

function badgeForEnrollment(enrollment) {
  const result = getResultStatus(enrollment);
  if (result === "passed") return "active";
  if (result === "failed" || result === "absent") return "inactive";
  return "navy";
}

// Cursadas y finales del alumno elegido — mismos hooks y componentes que el
// portal del alumno, pero con studentId explícito (el Bedel inscribe "por" el
// alumno, no a sí mismo). El backend no aplica la ventana de inscripción para
// Administrador/Bedel (gestión administrativa presencial), así que acá no hay
// banner de período: solo se validan cupo, correlativas y choque de horario.
function StudentEnrollments({ studentId }) {
  const { showToast } = useToast();
  const sectionsHook = useStudentSections(studentId);
  const examBoardsHook = useStudentExamBoards(studentId);
  const [submitting, setSubmitting] = useState(false);
  const [shownConflicts, setShownConflicts] = useState(null);
  const [sectionToCancel, setSectionToCancel] = useState(null);
  const [examToCancel, setExamToCancel] = useState(null);

  const { available, enrolled, loading, error, setError, enroll, unenroll } = sectionsHook;
  const {
    available: availableBoards,
    enrolled: enrolledBoards,
    loading: loadingBoards,
    error: examError,
    setError: setExamError,
    enroll: enrollExam,
    unenroll: unenrollExam,
  } = examBoardsHook;

  const conflictsBySection = useMemo(() => {
    const map = new Map();
    available.forEach(({ section, schedules }) => {
      const conflicts = findScheduleConflicts(schedules, enrolled);
      if (conflicts.length > 0) map.set(section.id, conflicts);
    });
    return map;
  }, [available, enrolled]);

  async function doEnrollSection(sectionId) {
    setSubmitting(true);
    setError("");
    try {
      await enroll(sectionId);
      showToast("Inscripción a la cursada confirmada");
    } catch (e) {
      setError(getErrorMessage(e, "No pudimos completar la inscripción."));
    } finally {
      setSubmitting(false);
    }
  }

  function handleEnrollSection(sectionId) {
    const conflicts = conflictsBySection.get(sectionId) ?? [];
    if (conflicts.length > 0) {
      setShownConflicts(conflicts);
      return;
    }
    doEnrollSection(sectionId);
  }

  async function confirmUnenrollSection() {
    const enrollment = sectionToCancel;
    setSectionToCancel(null);
    setSubmitting(true);
    setError("");
    try {
      await unenroll(enrollment.id);
      showToast("Baja de la cursada confirmada");
    } catch (e) {
      setError(getErrorMessage(e, "No pudimos dar de baja la inscripción."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEnrollExam(examBoardId) {
    setSubmitting(true);
    setExamError("");
    try {
      await enrollExam(examBoardId);
      showToast("Inscripción a la mesa confirmada");
    } catch (e) {
      setExamError(getErrorMessage(e, "No pudimos inscribir al alumno a la mesa."));
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmUnenrollExam() {
    const enrollment = examToCancel;
    setExamToCancel(null);
    setSubmitting(true);
    setExamError("");
    try {
      await unenrollExam(enrollment.id);
      showToast("Baja de la mesa confirmada");
    } catch (e) {
      setExamError(getErrorMessage(e, "No pudimos dar de baja la inscripción."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="portal-section">
        <h2 className="portal-section-title">Cursadas</h2>
        {error && <p className="users-form-error">{error}</p>}
        {loading && <p className="users-empty">Cargando...</p>}

        {!loading && (
          <>
            <p className="users-subtitle">Oferta disponible</p>
            <AvailableSectionsList
              items={available}
              conflictsBySection={conflictsBySection}
              onEnroll={handleEnrollSection}
              submitting={submitting}
              actionLabel="Inscribir"
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
        {examError && <p className="users-form-error">{examError}</p>}
        {loadingBoards && <p className="users-empty">Cargando...</p>}

        {!loadingBoards && (
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

      <ConflictModal
        open={shownConflicts !== null}
        conflicts={shownConflicts ?? []}
        onClose={() => setShownConflicts(null)}
        title="No se puede inscribir a esta comisión"
        message="El horario se superpone con materias en las que el alumno ya está inscripto:"
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
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  useEffect(() => {
    getStudents()
      .then(setStudents)
      .catch((e) => setError(getErrorMessage(e, "No pudimos cargar la lista de alumnos.")))
      .finally(() => setLoadingStudents(false));
  }, []);

  const studentOptions = students.map((s) => ({
    value: s.id,
    label: `${s.lastName}, ${s.firstName} — legajo ${s.enrollmentNumber} (DNI ${s.nationalId})`,
    searchText: `${s.lastName} ${s.firstName} ${s.enrollmentNumber} ${s.nationalId}`,
  }));

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

      {error && <p className="users-form-error">{error}</p>}

      {loadingStudents && <p className="users-empty">Cargando...</p>}

      {!loadingStudents && (
        <div className="users-form-field" style={{ maxWidth: 480 }}>
          <label className="users-form-label">Alumno</label>
          <Combobox
            options={studentOptions}
            value={selectedStudentId}
            onChange={setSelectedStudentId}
            placeholder="Buscar por apellido, nombre, legajo o DNI..."
            emptyLabel="No se encontraron alumnos"
          />
        </div>
      )}

      {selectedStudentId && <StudentEnrollments key={selectedStudentId} studentId={Number(selectedStudentId)} />}
    </div>
  );
}
