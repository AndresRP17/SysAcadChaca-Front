import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getErrorMessage } from "../../shared/api/api";
import { formatDateTime } from "../../shared/utils/formatters";
import { getMyTeacherProfile } from "../users/services/teacherService";
import { getMySections, closeSection } from "../sections/services/sectionService";
import { getEnrollmentsBySection, isByEquivalence } from "./services/enrollmentService";
import NotasTab from "./components/NotasTab";
import CloseSectionModal from "./components/CloseSectionModal";
import LoadError from "../../shared/ui/LoadError";
import "../users/usersPage.css";
import "./sectionDetailPage.css";

export default function SectionDetailPage() {
  const { sectionId } = useParams();

  const [section, setSection] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [closeModalOpen, setCloseModalOpen] = useState(false);

  // silent=true: recarga en segundo plano (ej. después de cerrar la comisión)
  // sin pasar por el "Cargando..." de página completa -- si no, se desmonta
  // el modal de cierre justo cuando está mostrando el resultado por alumno.
  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const me = await getMyTeacherProfile();
      const mine = await getMySections(me.id);
      const found = mine.find((s) => String(s.id) === sectionId);

      if (!found) {
        setNotFound(true);
        return;
      }

      setNotFound(false);
      setSection(found);
      setEnrollments(await getEnrollmentsBySection(found.id));
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cargar la comisión."));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="users-page">
        <p className="users-empty">Cargando...</p>
      </div>
    );
  }

  if (notFound || !section) {
    return (
      <div className="users-page">
        <LoadError message={error} onRetry={() => load()} />
        {notFound && <p className="users-empty">No encontramos esa comisión entre las tuyas.</p>}
        <Link to="/mis-comisiones" className="users-btn users-btn--ghost">Volver a mis comisiones</Link>
      </div>
    );
  }

  return (
    <div className="users-page section-detail">
      <Link to="/mis-comisiones" className="section-detail-back">← Mis comisiones</Link>

      <div className="section-detail-head">
        <div>
          <h1 className="users-title">{section.courseName ?? "Materia"}</h1>
          <p className="users-subtitle">
            Comisión {section.name} · {section.academicYear} · {section.term}º cuatrimestre · Turno {section.shift}
          </p>
        </div>
        <span className={`users-badge ${section.closed ? "users-badge--inactive" : "users-badge--active"}`}>
          {section.closed ? "Cerrada" : "Abierta"}
        </span>
      </div>

      <LoadError message={error} onRetry={() => load({ silent: true })} />

      <Link to="/calendario" className="users-btn users-btn--ghost section-detail-calendar">
        Ver calendario / tomar asistencia
      </Link>

      <section className="section-detail-block">
        <h2 className="section-detail-title">Alumnos ({enrollments.length})</h2>
        {enrollments.length === 0 ? (
          <p className="users-empty">No hay alumnos inscriptos.</p>
        ) : (
          <ul className="section-detail-students">
            {enrollments.map((e) => (
              <li key={e.id}>
                {e.studentLastName}, {e.studentFirstName}
                {isByEquivalence(e) && <span className="users-badge users-badge--navy">Por equivalencia</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section-detail-block">
        <h2 className="section-detail-title">Evaluaciones y notas</h2>
        {section.closed ? (
          <p className="users-empty">
            Esta comisión está cerrada desde el {formatDateTime(section.closedAt)}. Ya no se pueden cargar notas.
          </p>
        ) : (
          <NotasTab sectionId={section.id} enrollments={enrollments} />
        )}
      </section>

      <section className="section-detail-block">
        <h2 className="section-detail-title">Cierre de la comisión</h2>
        {section.closed ? (
          <p className="users-empty">La comisión ya fue cerrada y el resultado de cada alumno quedó registrado.</p>
        ) : (
          <>
            <p className="section-detail-help">
              Al cerrar la comisión se define el resultado final de cada alumno (regular, libre o promocionado)
              según sus notas. No se puede deshacer.
            </p>
            <button
              type="button"
              className="users-btn users-btn--danger section-detail-close"
              onClick={() => setCloseModalOpen(true)}
            >
              Cerrar comisión
            </button>
          </>
        )}
      </section>

      <CloseSectionModal
        open={closeModalOpen}
        section={section}
        onClose={() => setCloseModalOpen(false)}
        onSubmit={() => closeSection(section.id)}
        onClosed={() => load({ silent: true })}
      />
    </div>
  );
}
