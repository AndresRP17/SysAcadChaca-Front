import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import FieldError from "../../../shared/ui/FieldError";
import { getErrorMessage, getFieldErrors } from "../../../shared/api/api";
import { usePrograms } from "../../plans/hooks/usePrograms";
import { getStudyPlans } from "../../plans/services/studyPlanService";
import { getCurriculumCourses } from "../../plans/services/curriculumCourseService";
import { getTeachers } from "../../users/services/teacherService";
import { useClassrooms } from "../../sections/hooks/useClassrooms";

const EMPTY_FORM = {
  program_id: "",
  study_plan_id: "",
  curriculum_course_id: "",
  chair_teacher_id: "",
  member_teacher_id: "",
  classroom_id: "",
  scheduled_at: "",
};

// Alta de una mesa de examen. El acta (libro y folio) se completa después, al
// cerrarla; acá solo se programa la mesa.
export default function ExamBoardFormModal({ open, onClose, onSubmit }) {
  const { programs } = usePrograms();
  const { classrooms } = useClassrooms();
  const [teachers, setTeachers] = useState([]);
  const [studyPlans, setStudyPlans] = useState([]);
  const [curriculumCourses, setCurriculumCourses] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
    setError("");
    setFieldErrors({});
    getTeachers().then(setTeachers).catch((e) => setError(getErrorMessage(e)));
  }, [open]);

  useEffect(() => {
    setStudyPlans([]);
    if (!form.program_id) return;
    getStudyPlans(Number(form.program_id)).then(setStudyPlans).catch((e) => setError(getErrorMessage(e)));
  }, [form.program_id]);

  useEffect(() => {
    setCurriculumCourses([]);
    if (!form.study_plan_id) return;
    getCurriculumCourses(Number(form.study_plan_id)).then(setCurriculumCourses).catch((e) => setError(getErrorMessage(e)));
  }, [form.study_plan_id]);

  function handleChange(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "program_id") {
        next.study_plan_id = "";
        next.curriculum_course_id = "";
      }
      if (field === "study_plan_id") next.curriculum_course_id = "";
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (
      !form.curriculum_course_id || !form.chair_teacher_id || !form.member_teacher_id ||
      !form.classroom_id || !form.scheduled_at
    ) {
      setError("Completá todos los campos.");
      return;
    }
    if (form.chair_teacher_id === form.member_teacher_id) {
      setError("El docente presidente y el vocal no pueden ser la misma persona.");
      return;
    }
    if (new Date(form.scheduled_at).getTime() <= Date.now()) {
      setError("La fecha de la mesa debe ser futura.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        curriculum_course_id: Number(form.curriculum_course_id),
        chair_teacher_id: Number(form.chair_teacher_id),
        member_teacher_id: Number(form.member_teacher_id),
        classroom_id: Number(form.classroom_id),
        // <input type="datetime-local"> devuelve "YYYY-MM-DDTHH:mm"; el backend espera "YYYY-MM-DD HH:mm".
        scheduled_at: form.scheduled_at.replace("T", " "),
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Nueva mesa de examen" onClose={onClose}>
      <form onSubmit={handleSubmit} className="users-form">
        <div className="users-form-row">
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="xb-program">Carrera</label>
            <select
              id="xb-program"
              value={form.program_id}
              onChange={(e) => handleChange("program_id", e.target.value)}
              className="users-form-input"
            >
              <option value="">Seleccioná una carrera...</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="xb-plan">Plan de estudio</label>
            <select
              id="xb-plan"
              value={form.study_plan_id}
              onChange={(e) => handleChange("study_plan_id", e.target.value)}
              className="users-form-input"
              disabled={!form.program_id}
            >
              <option value="">Seleccioná un plan...</option>
              {studyPlans.map((sp) => <option key={sp.id} value={sp.id}>Res. {sp.resolutionYear}</option>)}
            </select>
          </div>
        </div>

        <div className="users-form-field">
          <label className="users-form-label" htmlFor="xb-course">Materia</label>
          <select
            id="xb-course"
            value={form.curriculum_course_id}
            onChange={(e) => handleChange("curriculum_course_id", e.target.value)}
            className="users-form-input"
            disabled={!form.study_plan_id}
          >
            <option value="">Seleccioná una materia...</option>
            {curriculumCourses.map((cc) => (
              <option key={cc.id} value={cc.id}>{cc.courseCode} - {cc.courseName}</option>
            ))}
          </select>
          <FieldError errors={fieldErrors} field="curriculum_course_id" />
        </div>

        <div className="users-form-row">
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="xb-chair">Docente presidente</label>
            <select
              id="xb-chair"
              value={form.chair_teacher_id}
              onChange={(e) => handleChange("chair_teacher_id", e.target.value)}
              className="users-form-input"
            >
              <option value="">Seleccioná un docente...</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.lastName}, {t.firstName}</option>)}
            </select>
            <FieldError errors={fieldErrors} field="chair_teacher_id" />
          </div>
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="xb-member">Docente vocal</label>
            <select
              id="xb-member"
              value={form.member_teacher_id}
              onChange={(e) => handleChange("member_teacher_id", e.target.value)}
              className="users-form-input"
            >
              <option value="">Seleccioná un docente...</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.lastName}, {t.firstName}</option>)}
            </select>
            <FieldError errors={fieldErrors} field="member_teacher_id" />
          </div>
        </div>

        <div className="users-form-row">
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="xb-classroom">Aula</label>
            <select
              id="xb-classroom"
              value={form.classroom_id}
              onChange={(e) => handleChange("classroom_id", e.target.value)}
              className="users-form-input"
            >
              <option value="">Seleccioná un aula...</option>
              {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.location})</option>)}
            </select>
            <FieldError errors={fieldErrors} field="classroom_id" />
          </div>
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="xb-date">Fecha y hora</label>
            <input
              id="xb-date"
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => handleChange("scheduled_at", e.target.value)}
              className="users-form-input"
            />
            <FieldError errors={fieldErrors} field="scheduled_at" />
          </div>
        </div>

        {error && <p className="users-form-error">{error}</p>}

        <div className="users-form-actions">
          <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="users-btn users-btn--primary" disabled={saving}>
            {saving ? "Guardando..." : "Crear mesa"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
