import { useEffect, useState } from "react";
import { usePrograms } from "../../plans/hooks/usePrograms";
import { getStudyPlans } from "../../plans/services/studyPlanService";
import { getCurriculumCourses } from "../../plans/services/curriculumCourseService";
import { getSections } from "../services/sectionService";
import { getAllSectionSchedules } from "../services/sectionScheduleService";
import WeekScheduleGrid from "../../../shared/ui/WeekScheduleGrid";

export default function GrillaHorariaTab() {
  const { programs } = usePrograms();

  const [programId, setProgramId] = useState("");
  const [studyPlans, setStudyPlans] = useState([]);
  const [studyPlanId, setStudyPlanId] = useState("");
  const [curriculumCourses, setCurriculumCourses] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    setLoading(true);
    Promise.all([getSections(), getAllSectionSchedules()])
      .then(([sections, schedules]) => {
        setAllSections(sections);
        setAllSchedules(schedules);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const curriculumCourseIds = new Set(curriculumCourses.map((cc) => cc.id));
  const sectionIds = new Set(allSections.filter((s) => curriculumCourseIds.has(s.curriculumCourseId)).map((s) => s.id));
  const schedulesForPlan = allSchedules.filter((sch) => sectionIds.has(sch.sectionId));

  return (
    <div>
      {error && <p className="users-form-error">{error}</p>}

      <div className="plans-selectors">
        <div className="users-form-field">
          <label className="users-form-label">Carrera</label>
          <select value={programId} onChange={(e) => setProgramId(e.target.value)} className="users-form-input">
            {programs.length === 0 && <option value="">No hay carreras cargadas</option>}
            {programs.length > 0 && <option value="">Seleccioná una carrera...</option>}
            {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="users-form-field">
          <label className="users-form-label">Plan de estudio</label>
          <select
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
      </div>

      <hr className="plans-divider" />

      {!studyPlanId && <p className="users-empty">Seleccioná un plan de estudio para ver su grilla horaria.</p>}

      {studyPlanId && loading && <p className="users-empty">Cargando...</p>}

      {studyPlanId && !loading && (
        <WeekScheduleGrid
          schedules={schedulesForPlan}
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
