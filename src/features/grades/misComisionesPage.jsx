import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../shared/api/api";
import { getMyTeacherProfile } from "../users/services/teacherService";
import { getMySections } from "../sections/services/sectionService";
import { getSectionSchedules } from "../sections/services/sectionScheduleService";
import { getEnrollmentsBySection } from "./services/enrollmentService";
import "../users/usersPage.css";
import "./misComisionesPage.css";

function periodKey(section) {
  return `${section.academicYear}-${section.term}`;
}

function periodLabel(key) {
  const [year, term] = key.split("-");
  return `${year} · ${term}º cuatrimestre`;
}

const WEEKDAY_LABEL = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
};

export default function MisComisionesPage() {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [schedulesBySection, setSchedulesBySection] = useState({});
  const [rosterBySection, setRosterBySection] = useState({});
  const [expandedSectionId, setExpandedSectionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const me = await getMyTeacherProfile();
        const mySections = await getMySections(me.id);
        setSections(mySections);

        const schedules = await Promise.all(mySections.map((s) => getSectionSchedules(s.id)));
        const map = {};
        mySections.forEach((s, i) => {
          map[s.id] = schedules[i];
        });
        setSchedulesBySection(map);

        // Por defecto se ve solo el cuatrimestre más reciente -- con varios
        // años de comisiones acumuladas (nunca se borran, ni las cerradas),
        // mostrarlas todas juntas y sin agrupar se vuelve ilegible.
        if (mySections.length > 0) {
          const [latest] = [...mySections].sort(
            (a, b) => b.academicYear - a.academicYear || b.term - a.term,
          );
          setSelectedPeriod(periodKey(latest));
        }
      } catch (err) {
        setError(getErrorMessage(err, "No se pudieron cargar tus comisiones."));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const periodOptions = useMemo(() => {
    const keys = new Set(sections.map(periodKey));
    return [...keys].sort().reverse();
  }, [sections]);

  const visibleSections = useMemo(
    () => sections.filter((s) => periodKey(s) === selectedPeriod),
    [sections, selectedPeriod],
  );

  async function toggleRoster(sectionId) {
    if (expandedSectionId === sectionId) {
      setExpandedSectionId(null);
      return;
    }

    setExpandedSectionId(sectionId);

    if (rosterBySection[sectionId]) return;

    try {
      const enrollments = await getEnrollmentsBySection(sectionId);
      setRosterBySection((prev) => ({ ...prev, [sectionId]: enrollments }));
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar los alumnos de la comision."));
    }
  }

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
          <h1 className="users-title">Mis comisiones</h1>
          <p className="users-subtitle">Materias y horarios que tenés asignados</p>
        </div>
      </div>

      {error && <p className="users-form-error">{error}</p>}

      {sections.length === 0 && !error && (
        <p className="users-empty">No tenés comisiones asignadas todavía.</p>
      )}

      {periodOptions.length > 0 && (
        <div className="users-form-field" style={{ maxWidth: 260 }}>
          <label className="users-form-label">Período</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="users-form-input"
          >
            {periodOptions.map((key) => (
              <option key={key} value={key}>{periodLabel(key)}</option>
            ))}
          </select>
        </div>
      )}

      {sections.length > 0 && visibleSections.length === 0 && (
        <p className="users-empty">No tenés comisiones en este período.</p>
      )}

      <div className="mis-comisiones-list">
        {visibleSections.map((section) => {
          const schedules = schedulesBySection[section.id] ?? [];
          const roster = rosterBySection[section.id];

          return (
            <div key={section.id} className="mis-comisiones-card">
              <div className="mis-comisiones-card-header">
                <h2 className="mis-comisiones-card-title">{section.courseName ?? "Materia"}</h2>
                <span className="mis-comisiones-card-subtitle">
                  {section.name} · {section.academicYear} · {section.shift}
                </span>
                <span className={`users-badge ${section.closed ? "users-badge--inactive" : "users-badge--active"}`}>
                  {section.closed ? "Cerrada" : "Abierta"}
                </span>
              </div>

              <div className="mis-comisiones-schedules">
                {schedules.length === 0 && (
                  <span className="mis-comisiones-schedule-line">Sin horario asignado todavía.</span>
                )}
                {schedules.map((sch) => (
                  <span key={sch.id} className="mis-comisiones-schedule-line">
                    {WEEKDAY_LABEL[sch.weekday] ?? sch.weekday} {sch.startTime?.slice(0, 5)}–{sch.endTime?.slice(0, 5)} · {sch.classroomName}
                  </span>
                ))}
              </div>

              <div className="mis-comisiones-actions">
                <button
                  type="button"
                  className="users-btn users-btn--ghost"
                  onClick={() => toggleRoster(section.id)}
                >
                  {expandedSectionId === section.id ? "Ocultar alumnos" : "Ver alumnos"}
                </button>
                <button
                  type="button"
                  className="users-btn users-btn--primary"
                  onClick={() => navigate(`/planilla?section=${section.id}`)}
                >
                  {section.closed ? "Ver resultado" : "Cargar planilla"}
                </button>
              </div>

              {expandedSectionId === section.id && (
                <div className="mis-comisiones-roster">
                  {roster === undefined && <p className="users-empty">Cargando alumnos...</p>}
                  {roster?.length === 0 && <p className="users-empty">No hay alumnos inscriptos.</p>}
                  {roster?.map((e) => (
                    <p key={e.id} className="mis-comisiones-roster-item">
                      {e.studentFirstName} {e.studentLastName}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
