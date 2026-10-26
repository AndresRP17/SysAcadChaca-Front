import { useEffect, useState } from "react";
import { useStudyPlanSelector } from "../hooks/useStudyPlanSelector";
import { getCurriculumCourses } from "../services/curriculumCourseService";
import { getPrerequisites, createPrerequisite, updatePrerequisite, deletePrerequisite } from "../services/prerequisiteService";
import StudyPlanSelector from "./StudyPlanSelector";
import StudyPlanFormModal from "./StudyPlanFormModal";
import PrerequisiteFormModal from "./PrerequisiteFormModal";
import CorrelativesPlanMap, { isStrictlyBefore } from "./CorrelativesPlanMap";
import ConfirmModal, { DELETE_NOTE } from "../../../shared/ui/ConfirmModal";
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
  const [prereqsByCourse, setPrereqsByCourse] = useState({});
  const [loadingPrereqs, setLoadingPrereqs] = useState(false);
  const [error, setError] = useState("");

  const [planFormOpen, setPlanFormOpen] = useState(false);
  const [planFormMode, setPlanFormMode] = useState("create");
  const [editingPlan, setEditingPlan] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [prereqFormMode, setPrereqFormMode] = useState("create");
  const [editingPrereq, setEditingPrereq] = useState(null);
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

  // Una sola carga para todo el plan: el mapa necesita saber quién requiere a quién en todas las materias.
  async function reloadPrerequisites(courses = curriculumCourses) {
    setLoadingPrereqs(true);
    try {
      const results = await Promise.all(
        courses.map((cc) => getPrerequisites(cc.id).then((list) => [cc.courseId, list])),
      );
      setPrereqsByCourse(Object.fromEntries(results));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingPrereqs(false);
    }
  }

  useEffect(() => {
    if (curriculumCourses.length === 0) {
      setPrereqsByCourse({});
      return;
    }
    reloadPrerequisites(curriculumCourses);
  }, [curriculumCourses]);

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

  function openAddPrerequisite() {
    setPrereqFormMode("create");
    setEditingPrereq(null);
    setAddOpen(true);
  }

  function openEditPrerequisite(prerequisite) {
    setPrereqFormMode("edit");
    setEditingPrereq(prerequisite);
    setAddOpen(true);
  }

  async function handleAddPrerequisite(data) {
    if (prereqFormMode === "edit" && editingPrereq) {
      await updatePrerequisite(editingPrereq.id, { ...data, curriculum_course_id: selectedCurriculumCourseId });
    } else {
      await createPrerequisite({ ...data, curriculum_course_id: selectedCurriculumCourseId });
    }
    setAddOpen(false);
    await reloadPrerequisites();
  }

  async function handleConfirmDeletePrereq() {
    await deletePrerequisite(prereqToDelete.id);
    setPrereqToDelete(null);
    await reloadPrerequisites();
  }

  const selectedCourse = curriculumCourses.find((cc) => cc.id === selectedCurriculumCourseId);
  const prerequisites = selectedCourse ? prereqsByCourse[selectedCourse.courseId] ?? [] : [];
  const enabledCourses = selectedCourse
    ? curriculumCourses.filter((cc) =>
        (prereqsByCourse[cc.courseId] ?? []).some((p) => p.requiredCourseId === selectedCourse.courseId))
    : [];
  // Solo se ofrecen materias de un cuatrimestre anterior (la misma regla que valida el backend) y que todavia no esten cargadas.
  const editingId = addOpen && prereqFormMode === "edit" ? editingPrereq?.id : null;
  const availableCourses = selectedCourse
    ? curriculumCourses
        .filter((cc) => isStrictlyBefore(cc, selectedCourse))
        .filter((cc) => !prerequisites.some((p) => p.requiredCourseId === cc.courseId && p.id !== editingId))
        .map((cc) => ({ id: cc.courseId, code: cc.courseCode, name: cc.courseName, yearNumber: cc.yearNumber, term: cc.term }))
    : [];

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
          <p className="corr-hint">
            Elegí una materia para ver qué necesita para cursarla y qué materias habilita.
          </p>
          <div className="corr-layout" aria-busy={loadingPrereqs}>
            <CorrelativesPlanMap
              curriculumCourses={curriculumCourses}
              prereqsByCourse={prereqsByCourse}
              selectedId={selectedCurriculumCourseId}
              onSelect={setSelectedCurriculumCourseId}
            />

            <aside className="corr-panel" aria-live="polite">
              {loadingPrereqs && <p className="users-empty">Cargando correlativas...</p>}
              {!loadingPrereqs && !selectedCourse && <p className="users-empty">Ninguna materia elegida.</p>}

              {!loadingPrereqs && selectedCourse && (
                <>
                  <h3 className="corr-panel-title">{selectedCourse.courseName}</h3>
                  <p className="corr-panel-sub">
                    {selectedCourse.courseCode} · {selectedCourse.yearNumber}° año ·{" "}
                    {selectedCourse.term === 0 ? "anual" : `${selectedCourse.term}° cuatrimestre`}
                  </p>

                  <h4 className="corr-panel-heading">Para cursarla necesitás</h4>
                  {prerequisites.length === 0 && <p className="corr-panel-empty">Sin correlativas: se puede cursar desde el inicio.</p>}
                  <ul className="corr-prereq-list">
                    {prerequisites.map((pr) => (
                      <li key={pr.id} className="corr-prereq-item corr-prereq-item--editable">
                        <span className="corr-prereq-name">
                          <strong>{pr.requiredCourseName}</strong>
                          <span className={`corr-pill corr-pill--${pr.conditionType === "APROBADA" ? "hard" : "soft"}`}>
                            {pr.conditionType === "APROBADA" ? "Aprobada" : "Cursada"}
                          </span>
                        </span>
                        <span className="correlatives-prereq-actions">
                          <button type="button" className="users-action-btn" onClick={() => openEditPrerequisite(pr)}>Editar</button>
                          <button type="button" className="users-action-btn users-action-btn--danger" onClick={() => setPrereqToDelete(pr)}>Quitar</button>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="users-btn users-btn--primary"
                    disabled={availableCourses.length === 0}
                    onClick={openAddPrerequisite}
                  >
                    + Agregar correlativa
                  </button>
                  {availableCourses.length === 0 && (
                    <p className="corr-panel-empty">No hay más materias anteriores a esta para agregar.</p>
                  )}

                  <h4 className="corr-panel-heading">Habilita</h4>
                  {enabledCourses.length === 0 && <p className="corr-panel-empty">Ninguna materia la exige.</p>}
                  <ul className="corr-prereq-list">
                    {enabledCourses.map((cc) => {
                      const cond = prereqsByCourse[cc.courseId].find((p) => p.requiredCourseId === selectedCourse.courseId).conditionType;
                      return (
                        <li key={cc.id} className="corr-prereq-item">
                          <button type="button" className="corr-link" onClick={() => setSelectedCurriculumCourseId(cc.id)}>
                            {cc.courseName}
                          </button>
                          <span className={`corr-pill corr-pill--${cond === "APROBADA" ? "hard" : "soft"}`}>
                            {cond === "APROBADA" ? "pide aprobada" : "pide cursada"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </aside>
          </div>

          <p className="corr-legend">
            <span className="corr-pill corr-pill--soft">Cursada</span> alcanza con regularizar la materia ·{" "}
            <span className="corr-pill corr-pill--hard">Aprobada</span> hay que tener el final rendido.
          </p>
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
        mode={prereqFormMode}
        initialData={editingPrereq}
        courseOptions={availableCourses}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddPrerequisite}
      />

      <ConfirmModal
        open={!!planToDelete}
        title="Eliminar plan de estudio"
        note={DELETE_NOTE}
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
