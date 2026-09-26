import { useMemo, useState } from "react";
import { useStudentSections } from "./hooks/useStudentSections";
import { findScheduleConflicts } from "./utils/scheduleConflicts";
import { getErrorMessage } from "../../shared/api/api";
import AvailableSectionsList from "./components/AvailableSectionsList";
import EnrolledSectionsList from "./components/EnrolledSectionsList";
import ConflictModal from "./components/ConflictModal";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import "../users/usersPage.css";
import "../plans/plansPage.css";
import "./portalCursadasPage.css";

export default function PortalCursadasPage() {
  const { student, available, enrolled, loading, error, setError, enroll, unenroll } = useStudentSections();

  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingSectionId, setPendingSectionId] = useState(null);
  const [pendingConflicts, setPendingConflicts] = useState([]);
  const [enrollmentToCancel, setEnrollmentToCancel] = useState(null);

  // Para cada comisión de la oferta, contra qué horarios ya inscriptos choca.
  const conflictsBySection = useMemo(() => {
    const map = new Map();
    available.forEach(({ section, schedules }) => {
      const conflicts = findScheduleConflicts(schedules, enrolled);
      if (conflicts.length > 0) map.set(section.id, conflicts);
    });
    return map;
  }, [available, enrolled]);

  const filteredAvailable = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return available;
    return available.filter(({ section }) =>
      [section.courseName, section.name, section.shift, section.teacherLastName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [available, search]);

  async function doEnroll(sectionId) {
    setSubmitting(true);
    setError("");
    try {
      await enroll(sectionId);
    } catch (e) {
      setError(getErrorMessage(e, "No pudimos completar la inscripción."));
    } finally {
      setSubmitting(false);
    }
  }

  function handleEnroll(sectionId) {
    const conflicts = conflictsBySection.get(sectionId) ?? [];
    if (conflicts.length > 0) {
      setPendingSectionId(sectionId);
      setPendingConflicts(conflicts);
      return;
    }
    doEnroll(sectionId);
  }

  function closeConflictModal() {
    setPendingSectionId(null);
    setPendingConflicts([]);
  }

  async function confirmConflictEnroll() {
    const sectionId = pendingSectionId;
    closeConflictModal();
    await doEnroll(sectionId);
  }

  async function confirmUnenroll() {
    const enrollment = enrollmentToCancel;
    setEnrollmentToCancel(null);
    setSubmitting(true);
    setError("");
    try {
      await unenroll(enrollment.id);
    } catch (e) {
      setError(getErrorMessage(e, "No pudimos dar de baja la inscripción."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">Inscripción a cursadas</h1>
          <p className="users-subtitle">
            {student
              ? `Legajo ${student.enrollmentNumber} — ${student.firstName} ${student.lastName}`
              : "Oferta de comisiones de tu plan de estudio"}
          </p>
        </div>
      </div>

      {error && <p className="users-form-error">{error}</p>}

      {loading && <p className="users-empty">Cargando...</p>}

      {!loading && (
        <>
          <section className="portal-section">
            <div className="plans-toolbar">
              <h2 className="portal-section-title">Oferta disponible</h2>
              <input
                type="search"
                className="users-search-input"
                placeholder="Buscar materia, comisión o docente"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <AvailableSectionsList
              items={filteredAvailable}
              conflictsBySection={conflictsBySection}
              onEnroll={handleEnroll}
              submitting={submitting}
            />
          </section>

          <hr className="plans-divider" />

          <section className="portal-section">
            <div className="plans-toolbar">
              <h2 className="portal-section-title">Mis cursadas</h2>
              <p className="users-subtitle">
                {enrolled.length} inscripción{enrolled.length !== 1 ? "es" : ""}
              </p>
            </div>

            <EnrolledSectionsList
              items={enrolled}
              onUnenroll={setEnrollmentToCancel}
              submitting={submitting}
            />
          </section>
        </>
      )}

      <ConflictModal
        open={pendingSectionId !== null}
        conflicts={pendingConflicts}
        onCancel={closeConflictModal}
        onConfirm={confirmConflictEnroll}
      />

      <ConfirmModal
        open={!!enrollmentToCancel}
        title="Darte de baja"
        message="¿Seguro que querés darte de baja de esta comisión? Vas a poder volver a inscribirte mientras siga habiendo cupo."
        onCancel={() => setEnrollmentToCancel(null)}
        onConfirm={confirmUnenroll}
      />
    </div>
  );
}
