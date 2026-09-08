import { useEffect, useState } from "react";
import { useCourses } from "../hooks/useCourses";
import { useStudyPlanSelector } from "../hooks/useStudyPlanSelector";
import { createStudyPlan, updateStudyPlan, deleteStudyPlan } from "../services/studyPlanService";
import { getCurriculumCourses, assignCourse, unassignCourse } from "../services/curriculumCourseService";
import StudyPlanSelector from "./StudyPlanSelector";
import StudyPlanFormModal from "./StudyPlanFormModal";
import AssignCourseModal from "./AssignCourseModal";
import ConfirmModal from "../../../shared/ui/ConfirmModal";

export default function CurriculumTab() {
  const { courses } = useCourses();
  const {
    programs, programId, setProgramId,
    studyPlans, studyPlanId, setStudyPlanId,
    error: selectorError, reloadStudyPlans,
  } = useStudyPlanSelector();

  const [curriculumCourses, setCurriculumCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [error, setError] = useState("");

  const [planFormOpen, setPlanFormOpen] = useState(false);
  const [planFormMode, setPlanFormMode] = useState("create");
  const [editingPlan, setEditingPlan] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);

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
    reloadCurriculumCourses(studyPlanId);
  }, [studyPlanId]);

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

  async function handleAssignCourse(data) {
    await assignCourse({ ...data, study_plan_id: Number(studyPlanId) });
    setAssignOpen(false);
    await reloadCurriculumCourses(studyPlanId);
  }

  async function handleConfirmUnassign() {
    await unassignCourse(assignmentToDelete.id);
    setAssignmentToDelete(null);
    await reloadCurriculumCourses(studyPlanId);
  }

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

      {!studyPlanId && <p className="users-empty">Seleccioná un plan de estudio para ver su estructura curricular.</p>}

      {studyPlanId && (
        <>
          <div className="plans-toolbar">
            <p className="users-subtitle">
              {curriculumCourses.length} materia{curriculumCourses.length !== 1 ? "s" : ""} en el plan
            </p>
            <button type="button" className="users-btn users-btn--primary" onClick={() => setAssignOpen(true)}>
              + Asignar materia
            </button>
          </div>

          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th className="users-th">Materia</th>
                  <th className="users-th">Código</th>
                  <th className="users-th">Año</th>
                  <th className="users-th">Cuatrimestre</th>
                  <th className="users-th users-th--actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingCourses && (
                  <tr><td className="users-empty" colSpan={5}>Cargando...</td></tr>
                )}
                {!loadingCourses && curriculumCourses.length === 0 && (
                  <tr><td className="users-empty" colSpan={5}>Todavía no hay materias asignadas a este plan.</td></tr>
                )}
                {!loadingCourses && curriculumCourses.map((cc) => (
                  <tr key={cc.id} className="users-row">
                    <td className="users-td" data-label="Materia">{cc.courseName}</td>
                    <td className="users-td" data-label="Código">{cc.courseCode}</td>
                    <td className="users-td" data-label="Año">{cc.yearNumber}°</td>
                    <td className="users-td" data-label="Cuatrimestre">{cc.term}°</td>
                    <td className="users-td users-td--actions" data-label="Acciones">
                      <button
                        type="button"
                        className="users-action-btn users-action-btn--danger"
                        onClick={() => setAssignmentToDelete(cc)}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      <AssignCourseModal
        open={assignOpen}
        courses={courses}
        onClose={() => setAssignOpen(false)}
        onSubmit={handleAssignCourse}
      />

      <ConfirmModal
        open={!!planToDelete}
        title="Eliminar plan de estudio"
        message={planToDelete ? `¿Seguro que querés eliminar el plan Res. ${planToDelete.resolutionYear}? Esta acción no se puede deshacer.` : ""}
        onCancel={() => setPlanToDelete(null)}
        onConfirm={handleConfirmDeletePlan}
      />

      <ConfirmModal
        open={!!assignmentToDelete}
        title="Quitar materia del plan"
        message={assignmentToDelete ? `¿Quitar "${assignmentToDelete.courseName}" de este plan de estudio?` : ""}
        onCancel={() => setAssignmentToDelete(null)}
        onConfirm={handleConfirmUnassign}
      />
    </div>
  );
}
