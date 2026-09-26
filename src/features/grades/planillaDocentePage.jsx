import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getErrorMessage } from "../../shared/api/api";
import { getMyTeacherProfile } from "../users/services/teacherService";
import { getMySections } from "../sections/services/sectionService";
import { getEnrollmentsBySection } from "./services/enrollmentService";
import AsistenciaTab from "./components/AsistenciaTab";
import NotasTab from "./components/NotasTab";
import "../users/usersPage.css";
import "../plans/plansPage.css";

const TABS = [
  { key: "asistencia", label: "Asistencia" },
  { key: "notas", label: "Notas" },
];

export default function PlanillaDocentePage() {
  const [searchParams] = useSearchParams();
  const preselectedSectionId = searchParams.get("section");

  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState("");
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMySections() {
      setLoading(true);
      setError("");
      try {
        const me = await getMyTeacherProfile();

        const mine = await getMySections(me.id);
        setSections(mine);

        if (preselectedSectionId && mine.some((s) => String(s.id) === preselectedSectionId)) {
          setSectionId(preselectedSectionId);
        } else if (mine.length > 0) {
          setSectionId(String(mine[0].id));
        }
      } catch (err) {
        setError(getErrorMessage(err, "No se pudieron cargar tus comisiones."));
      } finally {
        setLoading(false);
      }
    }

    loadMySections();
  }, [preselectedSectionId]);

  useEffect(() => {
    if (!sectionId) {
      setEnrollments([]);
      return;
    }

    getEnrollmentsBySection(sectionId)
      .then(setEnrollments)
      .catch((err) => setError(getErrorMessage(err, "No se pudieron cargar los alumnos de la comision.")));
  }, [sectionId]);

  const selectedSection = useMemo(
    () => sections.find((s) => String(s.id) === sectionId),
    [sections, sectionId],
  );

  if (loading) {
    return (
      <div className="users-page">
        <p className="users-empty">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">Planilla del docente</h1>
          <p className="users-subtitle">Asistencia y notas de tus comisiones</p>
        </div>
      </div>

      {error && <p className="users-form-error">{error}</p>}

      <div className="users-form-field" style={{ maxWidth: 400 }}>
        <label className="users-form-label">Comision</label>
        <select
          value={sectionId}
          onChange={(e) => setSectionId(e.target.value)}
          className="users-form-input"
        >
          <option value="">Seleccioná una comision...</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.courseName ?? "Materia"} — {s.name} ({s.shift})
            </option>
          ))}
        </select>
        {sections.length === 0 && !error && (
          <p className="users-empty">No tenes comisiones asignadas todavia.</p>
        )}
      </div>

      {selectedSection && (
        <>
          <div className="plans-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`plans-tab ${activeTab === tab.key ? "plans-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "asistencia" && (
            <AsistenciaTab sectionId={selectedSection.id} enrollments={enrollments} />
          )}
          {activeTab === "notas" && (
            <NotasTab sectionId={selectedSection.id} enrollments={enrollments} />
          )}
        </>
      )}
    </div>
  );
}
