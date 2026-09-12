import { useEffect, useState } from "react";
import { usePrograms } from "../../plans/hooks/usePrograms";
import { getStudyPlans } from "../../plans/services/studyPlanService";
import { getCurriculumCourses } from "../../plans/services/curriculumCourseService";
import { getTeachers } from "../../users/services/teacherService";
import { useClassrooms } from "../hooks/useClassrooms";
import { getSections, createSection, updateSection, deleteSection } from "../services/sectionService";
import { getSectionSchedules, createSectionSchedule, deleteSectionSchedule } from "../services/sectionScheduleService";
import SectionFormModal from "./SectionFormModal";
import SectionScheduleFormModal, { weekdayLabel, formatTime } from "./SectionScheduleFormModal";
import ConfirmModal from "../../../shared/ui/ConfirmModal";

export default function ComisionesTab() {
  const { programs } = usePrograms();
  const { classrooms } = useClassrooms();

  const [programId, setProgramId] = useState("");
  const [studyPlans, setStudyPlans] = useState([]);
  const [studyPlanId, setStudyPlanId] = useState("");
  const [curriculumCourses, setCurriculumCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [error, setError] = useState("");

  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [schedules, setSchedules] = useState([]);

  const [sectionFormOpen, setSectionFormOpen] = useState(false);
  const [sectionFormMode, setSectionFormMode] = useState("create");
  const [editingSection, setEditingSection] = useState(null);
  const [sectionToDelete, setSectionToDelete] = useState(null);
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);

  useEffect(() => {
    getTeachers().then(setTeachers).catch((e) => setError(e.message));
  }, []);

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

  async function reloadSections() {
    setLoadingSections(true);
    try {
      setAllSections(await getSections());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingSections(false);
    }
  }

  useEffect(() => {
    reloadSections();
  }, []);

  const curriculumCourseIds = new Set(curriculumCourses.map((cc) => cc.id));
  const sections = allSections.filter((s) => curriculumCourseIds.has(s.curriculumCourseId));

  async function reloadSchedules(sectionId) {
    if (!sectionId) {
      setSchedules([]);
      return;
    }
    try {
      setSchedules(await getSectionSchedules(sectionId));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    reloadSchedules(selectedSectionId);
  }, [selectedSectionId]);

  function openCreateSection() {
    setSectionFormMode("create");
    setEditingSection(null);
    setSectionFormOpen(true);
  }

  function openEditSection(section) {
    setSectionFormMode("edit");
    setEditingSection(section);
    setSectionFormOpen(true);
  }

  async function handleSectionFormSubmit(data) {
    if (sectionFormMode === "edit" && editingSection) {
      await updateSection(editingSection.id, data);
    } else {
      await createSection(data);
    }
    setSectionFormOpen(false);
    await reloadSections();
  }

  async function handleConfirmDeleteSection() {
    await deleteSection(sectionToDelete.id);
    if (sectionToDelete.id === selectedSectionId) setSelectedSectionId(null);
    setSectionToDelete(null);
    await reloadSections();
  }

  async function handleAddSchedule(data) {
    await createSectionSchedule({ ...data, section_id: selectedSectionId });
    setScheduleFormOpen(false);
    await reloadSchedules(selectedSectionId);
  }

  async function handleConfirmDeleteSchedule() {
    await deleteSectionSchedule(scheduleToDelete.id);
    setScheduleToDelete(null);
    await reloadSchedules(selectedSectionId);
  }

  const selectedSection = sections.find((s) => s.id === selectedSectionId);

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

      {!studyPlanId && <p className="users-empty">Seleccioná un plan de estudio para ver sus comisiones.</p>}

      {studyPlanId && loadingSections && <p className="users-empty">Cargando...</p>}

      {studyPlanId && !loadingSections && (
        <>
          <div className="plans-toolbar">
            <p className="users-subtitle">{sections.length} comisión{sections.length !== 1 ? "es" : ""}</p>
            <button
              type="button"
              className="users-btn users-btn--primary"
              disabled={curriculumCourses.length === 0}
              onClick={openCreateSection}
            >
              + Nueva comisión
            </button>
          </div>

          {sections.length === 0 && (
            <p className="users-empty">Este plan todavía no tiene comisiones abiertas.</p>
          )}

          {sections.length > 0 && (
            <div className="correlatives-layout">
              <div className="correlatives-list">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`correlatives-course-btn ${s.id === selectedSectionId ? "correlatives-course-btn--active" : ""}`}
                    onClick={() => setSelectedSectionId(s.id)}
                  >
                    <span className="correlatives-course-code">{s.name}</span>
                    <span>{s.courseName}</span>
                    <span className="correlatives-course-year">{s.academicYear} - {s.shift}</span>
                  </button>
                ))}
              </div>

              <div className="correlatives-detail">
                {!selectedSection && (
                  <p className="users-empty">Elegí una comisión de la izquierda para ver o cargar sus horarios.</p>
                )}

                {selectedSection && (
                  <>
                    <div className="plans-toolbar">
                      <p className="users-subtitle">
                        <strong>{selectedSection.name}</strong> — {selectedSection.courseName} — {selectedSection.teacherFirstName} {selectedSection.teacherLastName} — cupo {selectedSection.maxCapacity}
                      </p>
                      <div>
                        <button type="button" className="users-action-btn" onClick={() => openEditSection(selectedSection)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="users-action-btn users-action-btn--danger"
                          onClick={() => setSectionToDelete(selectedSection)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    <div className="plans-toolbar">
                      <p className="users-subtitle">Horarios</p>
                      <button
                        type="button"
                        className="users-btn users-btn--primary"
                        disabled={classrooms.length === 0}
                        onClick={() => setScheduleFormOpen(true)}
                      >
                        + Agregar horario
                      </button>
                    </div>

                    {schedules.length === 0 && (
                      <p className="users-empty">Esta comisión todavía no tiene horarios cargados.</p>
                    )}

                    {schedules.length > 0 && (
                      <ul className="correlatives-prereq-list">
                        {schedules.map((sch) => (
                          <li key={sch.id} className="correlatives-prereq-item">
                            <span>
                              <strong>{weekdayLabel(sch.weekday)}</strong> {formatTime(sch.startTime)}–{formatTime(sch.endTime)} — {sch.classroomName}
                            </span>
                            <button
                              type="button"
                              className="users-action-btn users-action-btn--danger"
                              onClick={() => setScheduleToDelete(sch)}
                            >
                              Quitar
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <SectionFormModal
        open={sectionFormOpen}
        mode={sectionFormMode}
        initialData={editingSection}
        curriculumCourseOptions={curriculumCourses.map((cc) => ({ id: cc.id, code: cc.courseCode, name: cc.courseName }))}
        teacherOptions={teachers}
        onClose={() => setSectionFormOpen(false)}
        onSubmit={handleSectionFormSubmit}
      />

      <SectionScheduleFormModal
        open={scheduleFormOpen}
        classroomOptions={classrooms}
        teacherId={selectedSection?.teacherId}
        onClose={() => setScheduleFormOpen(false)}
        onSubmit={handleAddSchedule}
      />

      <ConfirmModal
        open={!!sectionToDelete}
        title="Eliminar comisión"
        message={sectionToDelete ? `¿Seguro que querés eliminar "${sectionToDelete.name}"? Esta acción no se puede deshacer.` : ""}
        onCancel={() => setSectionToDelete(null)}
        onConfirm={handleConfirmDeleteSection}
      />

      <ConfirmModal
        open={!!scheduleToDelete}
        title="Quitar horario"
        message={scheduleToDelete ? `¿Quitar el horario del ${weekdayLabel(scheduleToDelete.weekday)} ${formatTime(scheduleToDelete.startTime)}–${formatTime(scheduleToDelete.endTime)}?` : ""}
        onCancel={() => setScheduleToDelete(null)}
        onConfirm={handleConfirmDeleteSchedule}
      />
    </div>
  );
}
