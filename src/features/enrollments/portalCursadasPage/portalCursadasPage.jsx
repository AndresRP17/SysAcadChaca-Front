import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getCurrentStudent } from "../../../shared/api/currentStudent";
import { useToast } from "../../../context/ToastContext";
import { useStudentSections } from "../hooks/useStudentSections";
import { getErrorMessage } from "../../../shared/api/api";
import AvailableSectionsList from "../components/AvailableSectionsList";
import EnrolledSectionsList from "../components/EnrolledSectionsList";
import EnrollmentPeriodBanner from "../components/EnrollmentPeriodBanner";
import { useOpenEnrollmentPeriods } from "../hooks/useOpenEnrollmentPeriods";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import LoadError from "../../../shared/ui/LoadError/LoadError";
import "../../users/usersPage/usersPage.css";
import "../../plans/plansPage/plansPage.css";
import "./portalCursadasPage.css";

export default function PortalCursadasPage() {
  const { user } = useAuth();
  const { available, enrolled, loading, loadError, reload, enroll, unenroll } = useStudentSections();
  // Solo para el subtítulo (legajo y nombre); no frena la carga de la oferta.
  const [student, setStudent] = useState(null);
  useEffect(() => {
    getCurrentStudent(user).then(setStudent).catch(() => setStudent(null));
  }, [user]);
  const { showToast } = useToast();

  const { periods, loading: loadingPeriods, isOpen: enrollmentOpen } = useOpenEnrollmentPeriods("CURSADA");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [enrollmentToCancel, setEnrollmentToCancel] = useState(null);

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
    try {
      await enroll(sectionId);
      showToast("Inscripción confirmada");
    } catch (e) {
      showToast(getErrorMessage(e, "No pudimos completar la inscripción."), "error");
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
      showToast("Baja de la cursada confirmada");
    } catch (e) {
      showToast(getErrorMessage(e, "No pudimos dar de baja la inscripción."), "error");
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

      <EnrollmentPeriodBanner periods={periods} loading={loadingPeriods} label="cursadas" />

      <LoadError message={loadError} onRetry={reload} />

      {loading && <p className="users-empty">Cargando...</p>}

      {!loading && !loadError && (
        <>
          <section className="portal-section">
            <div className="plans-toolbar">
              <h2 className="portal-section-title">Oferta disponible</h2>
              <input
                type="search"
                aria-label="Buscar materia, comisión o docente"
                className="users-search-input"
                placeholder="Buscar materia, comisión o docente"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <AvailableSectionsList
              items={filteredAvailable}
              onEnroll={doEnroll}
              submitting={submitting || !enrollmentOpen}
            />
          </section>

          <hr className="plans-divider" />

          <section className="portal-section">
            <div className="plans-toolbar">
              <h2 className="portal-section-title">Mis cursadas</h2>
              <p className="users-subtitle">
                {enrolled.length} {enrolled.length !== 1 ? "inscripciones" : "inscripción"}
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
