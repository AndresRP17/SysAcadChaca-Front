import LoadError from "../../../shared/ui/LoadError";
import { useEffect, useRef, useState } from "react";
import { useToast } from "../../../context/ToastContext";
import { usePrograms } from "../../plans/hooks/usePrograms";
import { getStudyPlans } from "../../plans/services/studyPlanService";
import { getCurriculumCourses } from "../../plans/services/curriculumCourseService";
import { getTeachers } from "../../users/services/teacherService";
import { useClassrooms } from "../hooks/useClassrooms";
import { getSection, createSection, updateSection, deleteSection } from "../services/sectionService";
import { getSectionSchedules, createSectionSchedule, updateSectionSchedule, deleteSectionSchedule } from "../services/sectionScheduleService";
import { useSectionsPage } from "../hooks/useSectionsPage";
import SectionFormModal from "./SectionFormModal";
import SectionRoster from "./SectionRoster";
import SectionScheduleFormModal, { weekdayLabel, formatTime } from "./SectionScheduleFormModal";
import ConfirmModal, { DELETE_NOTE } from "../../../shared/ui/ConfirmModal";
import ListFilters from "../../../shared/ui/ListFilters";
import Pagination from "../../../shared/ui/Pagination";

const TERM_OPTIONS = [
  { value: "1", label: "1º cuatrimestre" },
  { value: "2", label: "2º cuatrimestre" },
  { value: "0", label: "Anual" },
];

const STATE_OPTIONS = [
  { value: "active", label: "Activa" },
  { value: "inactive", label: "Inactiva" },
  { value: "closed", label: "Cerrada" },
];

// Años ofrecidos en el filtro: del próximo al de hace 5, más el que venga de un enlace directo.
function yearOptions(extraYear) {
  const current = new Date().getFullYear();
  const years = new Set();
  for (let y = current + 1; y >= current - 5; y--) years.add(y);
  if (extraYear) years.add(Number(extraYear));
  return [...years].sort((x, y) => y - x).map((y) => ({ value: String(y), label: String(y) }));
}

export default function ComisionesTab({ deepLink = null }) {
  const { showToast } = useToast();
  const { programs } = usePrograms();
  const { classrooms } = useClassrooms();

  // Si llegamos desde el Calendario, se preselecciona carrera, plan y comision una sola vez.
  const pendingDeepLink = useRef(deepLink);
  const [programId, setProgramId] = useState(deepLink?.programId ?? "");
  const [studyPlans, setStudyPlans] = useState([]);
  const [studyPlanId, setStudyPlanId] = useState(deepLink?.studyPlanId ?? "");
  const [curriculumCourses, setCurriculumCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState("");

  const [selectedSectionId, setSelectedSectionId] = useState(deepLink?.sectionId ?? null);
  const [selectedSection, setSelectedSection] = useState(null);
  // Con enlace directo se espera a conocer el período de la comisión pedida antes de listar.
  const [selectedKey, setSelectedKey] = useState(0);
  const [deepLinkReady, setDeepLinkReady] = useState(!deepLink?.sectionId);
  const [schedules, setSchedules] = useState([]);

  const [sectionFormOpen, setSectionFormOpen] = useState(false);
  const [sectionFormMode, setSectionFormMode] = useState("create");
  const [editingSection, setEditingSection] = useState(null);
  const [sectionToDelete, setSectionToDelete] = useState(null);
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [scheduleFormMode, setScheduleFormMode] = useState("create");
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);

  const [rosterOpen, setRosterOpen] = useState(false);

  const {
    sections: visibleSections,
    total,
    page,
    setPage,
    pageSize,
    changePageSize,
    loading: loadingSections,
    error: listError,
    reload,
    filters,
    changeFilter,
    clearFilters,
    hasFilters,
  } = useSectionsPage({ studyPlanId, enabled: deepLinkReady });

  useEffect(() => {
    getTeachers().then(setTeachers).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setStudyPlans([]);
    if (!programId) return;
    getStudyPlans(Number(programId)).then(setStudyPlans).catch((e) => setError(e.message));
  }, [programId]);

  useEffect(() => {
    setCurriculumCourses([]);
    if (!studyPlanId) return;
    getCurriculumCourses(Number(studyPlanId)).then(setCurriculumCourses).catch((e) => setError(e.message));
  }, [studyPlanId]);

  // Recarga la misma página con los mismos filtros y refresca la comisión elegida.
  function refreshSections() {
    reload();
    setSelectedKey((k) => k + 1);
  }

  // Con enlace directo, el filtro de período arranca en el de la comisión pedida.
  useEffect(() => {
    const pending = pendingDeepLink.current;
    pendingDeepLink.current = null;
    if (!pending?.sectionId) return;
    getSection(pending.sectionId)
      .then((target) => {
        changeFilter("year", String(target.academicYear));
        changeFilter("term", String(target.term));
      })
      .catch(() => {})
      .finally(() => setDeepLinkReady(true));
  }, []);

  // La comisión elegida se pide por id: puede no estar en la página que se ve (enlace directo, otro filtro).
  useEffect(() => {
    if (!selectedSectionId) {
      setSelectedSection(null);
      return;
    }
    getSection(selectedSectionId).then(setSelectedSection).catch(() => setSelectedSection(null));
  }, [selectedSectionId, selectedKey]);

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
    // Cambió la comisión seleccionada: la lista de alumnos que se ve, si había una
    // abierta, es de otra comisión. Se vuelve a pedir si la abren de nuevo.
    setRosterOpen(false);
  }, [selectedSectionId]);

  function toggleRoster() {
    setRosterOpen((open) => !open);
  }

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
      showToast("Comisión actualizada.");
    } else {
      await createSection(data);
      showToast("Comisión creada.");
    }
    setSectionFormOpen(false);
    refreshSections();
  }

  async function handleConfirmDeleteSection() {
    await deleteSection(sectionToDelete.id);
    showToast("Comisión eliminada.");
    if (sectionToDelete.id === selectedSectionId) setSelectedSectionId(null);
    setSectionToDelete(null);
    refreshSections();
  }

  async function handleToggleSectionActive(section) {
    try {
      await updateSection(section.id, {
        curriculum_course_id: section.curriculumCourseId,
        teacher_id: section.teacherId,
        name: section.name,
        academic_year: section.academicYear,
        term: section.term,
        max_capacity: section.maxCapacity,
        shift: section.shift,
        active: !section.active,
      });
      showToast(section.active ? "Comisión desactivada." : "Comisión activada.");
      refreshSections();
    } catch (e) {
      setError(e.message);
    }
  }

  function openCreateSchedule() {
    setScheduleFormMode("create");
    setEditingSchedule(null);
    setScheduleFormOpen(true);
  }

  function openEditSchedule(schedule) {
    setScheduleFormMode("edit");
    setEditingSchedule(schedule);
    setScheduleFormOpen(true);
  }

  async function handleScheduleFormSubmit(data) {
    if (scheduleFormMode === "edit" && editingSchedule) {
      await updateSectionSchedule(editingSchedule.id, { ...data, section_id: editingSchedule.sectionId });
      showToast("Horario actualizado.");
    } else {
      await createSectionSchedule({ ...data, section_id: selectedSectionId });
      showToast("Horario agregado.");
    }
    setScheduleFormOpen(false);
    await reloadSchedules(selectedSectionId);
  }

  async function handleConfirmDeleteSchedule() {
    await deleteSectionSchedule(scheduleToDelete.id);
    showToast("Horario eliminado.");
    setScheduleToDelete(null);
    await reloadSchedules(selectedSectionId);
  }

  return (
    <div>
      <LoadError message={error} onRetry={() => setError("")} />
      <LoadError message={listError} onRetry={reload} />

      <div className="plans-selectors">
        <div className="users-form-field">
          <label className="users-form-label" htmlFor="comisionesTab-1">Carrera</label>
          <select id="comisionesTab-1" value={programId} onChange={(e) => {
              setProgramId(e.target.value);
              setStudyPlanId("");
            }} className="users-form-input">
            {programs.length === 0 && <option value="">No hay carreras cargadas</option>}
            {programs.length > 0 && <option value="">Seleccioná una carrera...</option>}
            {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="users-form-field">
          <label className="users-form-label" htmlFor="comisionesTab-2">Plan de estudio</label>
          <select id="comisionesTab-2"
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

      {studyPlanId && (
        <>
          <div className="plans-toolbar">
            <p className="users-subtitle">{total} {total !== 1 ? "comisiones" : "comisión"}</p>
            <button
              type="button"
              className="users-btn users-btn--primary"
              disabled={curriculumCourses.length === 0}
              title={curriculumCourses.length === 0 ? "Este plan no tiene materias asignadas todavía" : undefined}
              onClick={openCreateSection}
            >
              + Nueva comisión
            </button>
          </div>

          <div className="comisiones-filters">
            <ListFilters
              idPrefix="comisiones"
              search={filters.search}
              onSearchChange={(value) => changeFilter("search", value)}
              searchLabel="Buscar"
              searchPlaceholder="Materia, comisión o docente"
              selects={[
                { id: "year", label: "Año", value: filters.year, onChange: (value) => changeFilter("year", value), options: yearOptions(filters.year), allLabel: "Todos" },
                { id: "term", label: "Cuatrimestre", value: filters.term, onChange: (value) => changeFilter("term", value), options: TERM_OPTIONS, allLabel: "Todos" },
                { id: "state", label: "Estado", value: filters.state, onChange: (value) => changeFilter("state", value), options: STATE_OPTIONS, allLabel: "Todos" },
              ]}
              hasFilters={hasFilters}
              onClear={clearFilters}
            />
          </div>

          {curriculumCourses.length === 0 && (
            <p className="users-empty">
              Este plan todavía no tiene materias asignadas — andá a "Estructura curricular" y asigná al
              menos una antes de crear una comisión.
            </p>
          )}

          {loadingSections && visibleSections.length === 0 && !listError && <p className="users-empty">Cargando...</p>}

          {curriculumCourses.length > 0 && !loadingSections && !listError && visibleSections.length === 0 && (
            <p className="users-empty">
              {hasFilters ? "No hay comisiones con esos filtros." : "Este plan todavía no tiene comisiones abiertas."}
            </p>
          )}

          {visibleSections.length > 0 && (
            <div className="correlatives-layout">
              <div className={loadingSections ? "users-list--loading" : undefined} aria-busy={loadingSections}>
                <div className="correlatives-list">
                  {visibleSections.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`correlatives-course-btn ${s.id === selectedSectionId ? "correlatives-course-btn--active" : ""}`}
                      onClick={() => setSelectedSectionId(s.id)}
                    >
                      <span className="correlatives-course-code">{s.name}</span>
                      <span>{s.courseName}</span>
                      <span className="correlatives-course-year">
                        {s.academicYear} · {s.term === 0 ? "Anual" : `${s.term}º cuat.`} - {s.shift}
                        {!s.active && <span className="users-badge users-badge--inactive">Inactiva</span>}
                        {s.closed && <span className="users-badge users-badge--inactive">Cerrada</span>}
                      </span>
                    </button>
                  ))}
                </div>
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={setPage}
                  onPageSizeChange={changePageSize}
                  noun={["comisión", "comisiones"]}
                />
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
                        {" "}
                        <span className={`users-badge ${selectedSection.active ? "users-badge--active" : "users-badge--inactive"}`}>
                          {selectedSection.active ? "Activa" : "Inactiva"}
                        </span>
                      </p>
                      <div>
                        <button type="button" className="users-action-btn" onClick={toggleRoster}>
                          {rosterOpen ? "Ocultar alumnos inscriptos" : "Ver alumnos inscriptos"}
                        </button>
                        <button type="button" className="users-action-btn" onClick={() => openEditSection(selectedSection)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="users-action-btn"
                          onClick={() => handleToggleSectionActive(selectedSection)}
                        >
                          {selectedSection.active ? "Desactivar" : "Activar"}
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

                    {rosterOpen && <SectionRoster sectionId={selectedSection.id} />}

                    <div className="plans-toolbar">
                      <p className="users-subtitle">Horarios</p>
                      <button
                        type="button"
                        className="users-btn users-btn--primary"
                        disabled={classrooms.length === 0}
                        onClick={openCreateSchedule}
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
                            <span>
                              <button
                                type="button"
                                className="users-action-btn"
                                onClick={() => openEditSchedule(sch)}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="users-action-btn users-action-btn--danger"
                                onClick={() => setScheduleToDelete(sch)}
                              >
                                Quitar
                              </button>
                            </span>
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
        mode={scheduleFormMode}
        initialData={editingSchedule}
        classroomOptions={classrooms}
        teacherId={selectedSection?.teacherId}
        sectionCapacity={selectedSection?.maxCapacity}
        onClose={() => setScheduleFormOpen(false)}
        onSubmit={handleScheduleFormSubmit}
      />

      <ConfirmModal
        open={!!sectionToDelete}
        title="Eliminar comisión"
        note={DELETE_NOTE}
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
