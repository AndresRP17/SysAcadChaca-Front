import { useEffect, useState } from "react";
import { getErrorMessage } from "../../../shared/api/api";
import { usePrograms } from "../../plans/hooks/usePrograms";
import { getStudyPlans } from "../../plans/services/studyPlanService";
import { getCurriculumCourses } from "../../plans/services/curriculumCourseService";
import { getSchedulesForGrid, GRID_SIZE } from "../services/sectionScheduleService";
import LoadError from "../../../shared/ui/LoadError";
import WeekScheduleGrid from "../../../shared/ui/WeekScheduleGrid";

const TERM_OPTIONS = [
  { value: "1", label: "1º cuatrimestre" },
  { value: "2", label: "2º cuatrimestre" },
  { value: "0", label: "Anual" },
];

// Años ofrecidos: del próximo al de hace 5.
function yearOptions() {
  const current = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, i) => String(current + 1 - i));
}

// La grilla es una vista de calendario de UN plan en UN período: necesita todos los bloques del filtro, así
// que no se pagina; el servidor filtra por plan, año y cuatrimestre y la pantalla avisa si el resultado se cortó.
export default function GrillaHorariaTab() {
  const { programs } = usePrograms();

  const [programId, setProgramId] = useState("");
  const [studyPlans, setStudyPlans] = useState([]);
  const [studyPlanId, setStudyPlanId] = useState("");
  const [curriculumCourses, setCurriculumCourses] = useState([]);
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear()));
  const [term, setTerm] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setStudyPlanId("");
    setStudyPlans([]);
    if (!programId) return;
    getStudyPlans(Number(programId)).then(setStudyPlans).catch((e) => setError(e.message));
  }, [programId]);

  useEffect(() => {
    setCurriculumCourses([]);
    if (!studyPlanId) return;
    getCurriculumCourses(Number(studyPlanId)).then(setCurriculumCourses).catch((e) => setError(e.message));
  }, [studyPlanId]);

  useEffect(() => {
    if (!studyPlanId) {
      setSchedules([]);
      setTotal(0);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    getSchedulesForGrid({ studyPlanId, academicYear, term })
      .then(({ items, total: count }) => {
        if (cancelled) return;
        setSchedules(items);
        setTotal(count);
      })
      .catch((e) => {
        if (!cancelled) setError(getErrorMessage(e, "No se pudo cargar la grilla horaria."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studyPlanId, academicYear, term, reloadKey]);

  return (
    <div>
      <LoadError message={error} onRetry={() => setReloadKey((k) => k + 1)} />

      <div className="plans-selectors">
        <div className="users-form-field">
          <label className="users-form-label" htmlFor="grillaHorariaTab-1">Carrera</label>
          <select id="grillaHorariaTab-1" value={programId} onChange={(e) => setProgramId(e.target.value)} className="users-form-input">
            {programs.length === 0 && <option value="">No hay carreras cargadas</option>}
            {programs.length > 0 && <option value="">Seleccioná una carrera...</option>}
            {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="users-form-field">
          <label className="users-form-label" htmlFor="grillaHorariaTab-2">Plan de estudio</label>
          <select id="grillaHorariaTab-2"
            value={studyPlanId}
            onChange={(e) => setStudyPlanId(e.target.value)}
            className="users-form-input"
            disabled={!programId}
          >
            <option value="">Seleccioná un plan...</option>
            {studyPlans.map((sp) => (
              <option key={sp.id} value={sp.id}>Res. {sp.resolutionYear} {sp.active ? "" : "(inactivo)"}</option>
            ))}
          </select>
        </div>

        <div className="users-form-field">
          <label className="users-form-label" htmlFor="grillaHorariaTab-3">Año</label>
          <select id="grillaHorariaTab-3" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="users-form-input">
            <option value="">Todos</option>
            {yearOptions().map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="users-form-field">
          <label className="users-form-label" htmlFor="grillaHorariaTab-4">Cuatrimestre</label>
          <select id="grillaHorariaTab-4" value={term} onChange={(e) => setTerm(e.target.value)} className="users-form-input">
            <option value="">Todos</option>
            {TERM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <hr className="plans-divider" />

      {!studyPlanId && <p className="users-empty">Seleccioná un plan de estudio para ver su grilla horaria.</p>}

      {studyPlanId && loading && <p className="users-empty">Cargando...</p>}

      {studyPlanId && !loading && !error && total > schedules.length && (
        <p className="users-empty">Se muestran {GRID_SIZE} de {total} horarios: filtrá por año o cuatrimestre para ver el resto.</p>
      )}

      {studyPlanId && !loading && !error && (
        <WeekScheduleGrid
          schedules={schedules}
          emptyMessage="Este plan todavía no tiene comisiones con horarios cargados."
          getKey={(sch) => sch.id}
          getBlockTitle={(sch) => `${sch.classroomName} — ${sch.teacherFirstName} ${sch.teacherLastName}`}
          renderBlock={(sch) => (
            <>
              <span className="grilla-horaria-block-course">{sch.courseName}</span>
              <span className="grilla-horaria-block-section">{sch.sectionName}</span>
              <span className="grilla-horaria-block-classroom">{sch.classroomName}</span>
              <span className="grilla-horaria-block-teacher">{sch.teacherFirstName} {sch.teacherLastName}</span>
            </>
          )}
        />
      )}
    </div>
  );
}
