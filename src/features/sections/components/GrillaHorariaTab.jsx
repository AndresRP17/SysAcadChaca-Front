import { useEffect, useState } from "react";
import { usePrograms } from "../../plans/hooks/usePrograms";
import { getStudyPlans } from "../../plans/services/studyPlanService";
import { getCurriculumCourses } from "../../plans/services/curriculumCourseService";
import { getSections } from "../services/sectionService";
import { getAllSectionSchedules } from "../services/sectionScheduleService";
import { weekdayLabel, formatTime } from "./SectionScheduleFormModal";

const WEEKDAYS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

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
    if (programs.length > 0 && !programId) setProgramId(String(programs[0].id));
  }, [programs, programId]);

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
  const scheduleByDay = WEEKDAYS.reduce((acc, day) => {
    acc[day] = allSchedules
      .filter((sch) => sectionIds.has(sch.sectionId) && sch.weekday === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {});
  const hasAnySchedule = Object.values(scheduleByDay).some((list) => list.length > 0);

  return (
    <div>
      {error && <p className="users-form-error">{error}</p>}

      <div className="plans-selectors">
        <div className="users-form-field">
          <label className="users-form-label">Carrera</label>
          <select value={programId} onChange={(e) => setProgramId(e.target.value)} className="users-form-input">
            {programs.length === 0 && <option value="">No hay carreras cargadas</option>}
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

      {studyPlanId && !loading && !hasAnySchedule && (
        <p className="users-empty">Este plan todavía no tiene comisiones con horarios cargados.</p>
      )}

      {studyPlanId && !loading && hasAnySchedule && (
        <div className="grilla-horaria">
          {WEEKDAYS.map((day) => (
            <div key={day} className="grilla-horaria-col">
              <div className="grilla-horaria-col-header">{weekdayLabel(day)}</div>
              {scheduleByDay[day].length === 0 && <p className="grilla-horaria-empty">—</p>}
              {scheduleByDay[day].map((sch) => (
                <div key={sch.id} className="grilla-horaria-block" title={`${sch.classroomName} — ${sch.teacherFirstName} ${sch.teacherLastName}`}>
                  <span className="grilla-horaria-block-time">{formatTime(sch.startTime)}–{formatTime(sch.endTime)}</span>
                  <span className="grilla-horaria-block-course">{sch.courseName}</span>
                  <span className="grilla-horaria-block-section">{sch.sectionName}</span>
                  <span className="grilla-horaria-block-classroom">{sch.classroomName}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
