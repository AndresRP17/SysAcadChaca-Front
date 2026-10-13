import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../shared/api/api";
import { getMyTeacherProfile } from "../users/services/teacherService";
import { getMySections } from "../sections/services/sectionService";
import LoadError from "../../shared/ui/LoadError";
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
  const [studentCountBySection, setStudentCountBySection] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const me = await getMyTeacherProfile();
      // Un solo pedido trae las comisiones con sus horarios y la cantidad de inscriptos.
      const mySections = await getMySections(me.id, { includeSchedules: true });
      setSections(mySections);

      const scheduleMap = {};
      const countMap = {};
      mySections.forEach((s) => {
        scheduleMap[s.id] = s.schedules ?? [];
        if (s.enrolledCount !== undefined) countMap[s.id] = s.enrolledCount;
      });
      setSchedulesBySection(scheduleMap);
      setStudentCountBySection(countMap);

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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const periodOptions = useMemo(() => {
    const keys = new Set(sections.map(periodKey));
    return [...keys].sort().reverse();
  }, [sections]);

  const visibleSections = useMemo(
    () => sections.filter((s) => periodKey(s) === selectedPeriod),
    [sections, selectedPeriod],
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
          <h1 className="users-title">Mis comisiones</h1>
          <p className="users-subtitle">Entrá a una comisión para ver alumnos, cargar notas o cerrarla.</p>
        </div>
      </div>

      <LoadError message={error} onRetry={load} />

      {sections.length === 0 && !error && (
        <p className="users-empty">No tenés comisiones asignadas todavía.</p>
      )}

      {periodOptions.length > 0 && (
        <div className="users-form-field mis-comisiones-period">
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
          const studentCount = studentCountBySection[section.id];

          return (
            <div key={section.id} className="mis-comisiones-card">
              <div className="mis-comisiones-card-header">
                <h2 className="mis-comisiones-card-title">{section.courseName ?? "Materia"}</h2>
                <span className={`users-badge ${section.closed ? "users-badge--inactive" : "users-badge--active"}`}>
                  {section.closed ? "Cerrada" : "Abierta"}
                </span>
              </div>
              <span className="mis-comisiones-card-subtitle">
                Comisión {section.name} · Turno {section.shift}
                {studentCount !== undefined && ` · ${studentCount} ${studentCount === 1 ? "alumno" : "alumnos"}`}
              </span>

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

              <button
                type="button"
                className="users-btn users-btn--primary mis-comisiones-open"
                onClick={() => navigate(`/comision/${section.id}`)}
              >
                Abrir comisión
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
