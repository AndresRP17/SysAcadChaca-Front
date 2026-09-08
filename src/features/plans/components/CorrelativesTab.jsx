import { useEffect, useState } from "react";
import { useStudyPlanSelector } from "../hooks/useStudyPlanSelector";
import { getCurriculumCourses } from "../services/curriculumCourseService";
import { getPrerequisites, createPrerequisite, deletePrerequisite } from "../services/prerequisiteService";
import StudyPlanSelector from "./StudyPlanSelector";
import StudyPlanFormModal from "./StudyPlanFormModal";
import PrerequisiteFormModal from "./PrerequisiteFormModal";
import CorrelativesMatrix from "./CorrelativesMatrix";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { createStudyPlan, updateStudyPlan, deleteStudyPlan } from "../services/studyPlanService";

export default function CorrelativesTab() {
  const {
    programs, programId, setProgramId,
    studyPlans, studyPlanId, setStudyPlanId,
    error: selectorError, reloadStudyPlans,
  } = useStudyPlanSelector();

  const [curriculumCourses, setCurriculumCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedCurriculumCourseId, setSelectedCurriculumCourseId] = useState(null);
  const [prerequisites, setPrerequisites] = useState([]);
  const [error, setError] = useState("");
  const [view, setView] = useState("list"); // "list" | "matrix"

  const [planFormOpen, setPlanFormOpen] = useState(false);
  const [planFormMode, setPlanFormMode] = useState("create");
  const [editingPlan, setEditingPlan] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [prereqToDelete, setPrereqToDelete] = useState(null);

  async function reloadCurriculumCourses(forStudyPlanId) {
    if (!forStudyPlanId) {
      setCurriculumCourses([]);
      return;
    }
    setLoadingCourses(true);
    try {
      setCurriculumCourses(await getCurriculumCourses(Number(forStudyPlanId)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingCourses(false);
    }
  }

  useEffect(() => {
    setSelectedCurriculumCourseId(null);
    reloadCurriculumCourses(studyPlanId);
  }, [studyPlanId]);

  async function reloadPrerequisites(forCurriculumCourseId) {
    if (!forCurriculumCourseId) {
      setPrerequisites([]);
      return;
    }
    try {
      setPrerequisites(await getPrerequisites(forCurriculumCourseId));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    reloadPrerequisites(selectedCurriculumCourseId);
  }, [selectedCurriculumCourseId]);

  function openCreatePlan() {
    setPlanFormMode("create");
    setEditingPlan(null);
    setPlanFormOpen(true);
  }

  function openEditPlan(plan) {
    setPlanFormMode("edit");
    setEditingPlan(plan);
    setPlanFormOpen(true);
  }

  async function handlePlanFormSubmit(data) {
    if (planFormMode === "edit" && editingPlan) {
      await updateStudyPlan(editingPlan.id, data);
    } else {
      await createStudyPlan(data);
    }
    setPlanFormOpen(false);
    await reloadStudyPlans();
  }

  async function handleConfirmDeletePlan() {
    await deleteStudyPlan(planToDelete.id);
    setPlanToDelete(null);
    if (String(planToDelete.id) === studyPlanId) setStudyPlanId("");
    await reloadStudyPlans();
  }

  async function handleAddPrerequisite(data) {
    await createPrerequisite({ ...data, curriculum_course_id: selectedCurriculumCourseId });
    setAddOpen(false);
    await reloadPrerequisites(selectedCurriculumCourseId);
  }

  async function handleConfirmDeletePrereq() {
    await deletePrerequisite(prereqToDelete.id);
    setPrereqToDelete(null);
    await reloadPrerequisites(selectedCurriculumCourseId);
  }

  const selectedCourse = curriculumCourses.find((cc) => cc.id === selectedCurriculumCourseId);
  // Una materia no puede ser correlativa de si misma, y ya la sacamos por curriculum_course_id de la lista de la izquierda.
  const availableCourses = curriculumCourses
    .filter((cc) => cc.id !== selectedCurriculumCourseId)
    .map((cc) => ({ id: cc.courseId, code: cc.courseCode, name: cc.courseName }));

  return (
    <div>
      {(error || selectorError) && <p className="users-form-error">{error || selectorError}</p>}

      <StudyPlanSelector
        programs={programs}
        programId={programId}
        onProgramChange={setProgramId}
        studyPlans={studyPlans}
        studyPlanId={studyPlanId}
        onStudyPlanChange={setStudyPlanId}
        onNewPlanClick={openCreatePlan}
        onEditPlanClick={openEditPlan}
        onDeletePlanClick={setPlanToDelete}
      />

      {!studyPlanId && <p className="users-empty">Seleccioná un plan de estudio para ver sus correlatividades.</p>}

      {studyPlanId && loadingCourses && <p className="users-empty">Cargando...</p>}

      {studyPlanId && !loadingCourses && curriculumCourses.length === 0 && (
        <p className="users-empty">Este plan todavía no tiene materias asignadas — agregalas en "Estructura curricular" primero.</p>
      )}

      {studyPlanId && !loadingCourses && curriculumCourses.length > 0 && (
        <>
          <div className="plans-tabs plans-tabs--secondary">
            <button
              type="button"
              className={`plans-tab ${view === "list" ? "plans-tab--active" : ""}`}
              onClick={() => setView("list")}
            >
              Configurar
            </button>
            <button
              type="button"
              className={`plans-tab ${view === "matrix" ? "plans-tab--active" : ""}`}
              onClick={() => setView("matrix")}
            >
              Ver matriz
            </button>
          </div>

          {view === "matrix" && <CorrelativesMatrix curriculumCourses={curriculumCourses} />}

          {view === "list" && (
            <div className="correlatives-layout">
              <div className="correlatives-list">
                {curriculumCourses.map((cc) => (
                  <button
                    key={cc.id}
                    type="button"
                    className={`correlatives-course-btn ${cc.id === selectedCurriculumCourseId ? "correlatives-course-btn--active" : ""}`}
                    onClick={() => setSelectedCurriculumCourseId(cc.id)}
                  >
                    <span className="correlatives-course-code">{cc.courseCode}</span>
                    <span>{cc.courseName}</span>
                    <span className="correlatives-course-year">{cc.yearNumber}° año</span>
                  </button>
                ))}
              </div>

              <div className="correlatives-detail">
                {!selectedCurriculumCourseId && (
                  <p className="users-empty">Elegí una materia de la izquierda para ver o cargar sus correlativas.</p>
                )}

                {selectedCurriculumCourseId && (
                  <>
                    <div className="plans-toolbar">
                      <p className="users-subtitle">
                        Correlativas de <strong>{selectedCourse?.courseName}</strong>
                      </p>
                      <button
                        type="button"
                        className="users-btn users-btn--primary"
                        disabled={availableCourses.length === 0}
                        onClick={() => setAddOpen(true)}
                      >
                        + Agregar correlativa
                      </button>
                    </div>

                    {prerequisites.length === 0 && (
                      <p className="users-empty">Esta materia todavía no tiene correlativas cargadas.</p>
                    )}

                    {prerequisites.length > 0 && (
                      <ul className="correlatives-prereq-list">
                        {prerequisites.map((pr) => (
                          <li key={pr.id} className="correlatives-prereq-item">
                            <span>
                              <strong>{pr.requiredCourseName}</strong> ({pr.requiredCourseCode}) —{" "}
                              <span className={`users-badge ${pr.conditionType === "APROBADA" ? "users-badge--navy" : "users-badge--gray"}`}>
                                {pr.conditionType === "APROBADA" ? "Aprobada" : "Cursada"}
                              </span>
                            </span>
                            <button
                              type="button"
                              className="users-action-btn users-action-btn--danger"
                              onClick={() => setPrereqToDelete(pr)}
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

      <StudyPlanFormModal
        open={planFormOpen}
        mode={planFormMode}
        initialData={editingPlan}
        programId={Number(programId)}
        onClose={() => setPlanFormOpen(false)}
        onSubmit={handlePlanFormSubmit}
      />

      <PrerequisiteFormModal
        open={addOpen}
        courseOptions={availableCourses}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddPrerequisite}
      />

      <ConfirmModal
        open={!!planToDelete}
        title="Eliminar plan de estudio"
        message={planToDelete ? `¿Seguro que querés eliminar el plan Res. ${planToDelete.resolutionYear}? Esta acción no se puede deshacer.` : ""}
        onCancel={() => setPlanToDelete(null)}
        onConfirm={handleConfirmDeletePlan}
      />

      <ConfirmModal
        open={!!prereqToDelete}
        title="Quitar correlativa"
        message={prereqToDelete ? `¿Quitar "${prereqToDelete.requiredCourseName}" como correlativa de "${selectedCourse?.courseName}"?` : ""}
        onCancel={() => setPrereqToDelete(null)}
        onConfirm={handleConfirmDeletePrereq}
      />
    </div>
  );
}
