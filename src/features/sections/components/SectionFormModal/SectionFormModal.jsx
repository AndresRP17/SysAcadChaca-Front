import { useEffect, useMemo, useState } from "react";
import Modal from "../../../../shared/ui/Modal/Modal";
import FieldError from "../../../../shared/ui/FieldError";
import { getErrorMessage, getFieldErrors } from "../../../../shared/api/api";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";
import SearchCombobox from "../../../../shared/ui/SearchCombobox";
import { teacherOption } from "../../../../shared/ui/searchOptions";
import { getTeacher, searchTeachers } from "../../../users/services/teacherService";
import { suggestSectionName } from "../../sectionNames";
import "./SectionFormModal.css";

const SHIFTS = ["Mañana", "Tarde", "Noche"];
const ANNUAL = 0;

const emptyForm = () => ({
  curriculum_course_id: "",
  teacher_id: "",
  name: "",
  academic_year: String(new Date().getFullYear()),
  term: "",
  max_capacity: "",
  shift: SHIFTS[0],
});

function termLabel(term) {
  return term === ANNUAL ? "anual" : `${term}° cuatrimestre`;
}

// Alta y edición de una comisión. Al elegir la materia se completan el cuatrimestre (una materia anual solo tiene
// comisiones anuales) y el nombre sugerido; el año arranca en el actual. Los horarios se cargan a continuación.
export default function SectionFormModal({ open, mode, initialData, curriculumCourseOptions, existingSections = [], onClose, onSubmit }) {
  const { lock, pending } = useSubmitLock();
  const [form, setForm] = useState(emptyForm);
  const [nameTouched, setNameTouched] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm(
      initialData
        ? {
            curriculum_course_id: String(initialData.curriculumCourseId),
            teacher_id: String(initialData.teacherId),
            name: initialData.name,
            academic_year: String(initialData.academicYear),
            term: String(initialData.term),
            max_capacity: String(initialData.maxCapacity),
            shift: initialData.shift,
          }
        : emptyForm(),
    );
    setNameTouched(Boolean(initialData));
    setError("");
    setFieldErrors({});
  }, [open, initialData]);

  const course = useMemo(
    () => curriculumCourseOptions.find((cc) => String(cc.id) === form.curriculum_course_id),
    [curriculumCourseOptions, form.curriculum_course_id],
  );
  const isAnnual = course?.term === ANNUAL;

  // El nombre se sugiere mientras nadie lo haya escrito a mano.
  const suggestion = useMemo(
    () => (course && form.term !== "" ? suggestSectionName(existingSections, form.curriculum_course_id, form.academic_year, form.term) : ""),
    [course, existingSections, form.curriculum_course_id, form.academic_year, form.term],
  );

  useEffect(() => {
    if (open && mode !== "edit" && !nameTouched) {
      setForm((prev) => (prev.name === suggestion ? prev : { ...prev, name: suggestion }));
    }
  }, [open, mode, nameTouched, suggestion]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleCourseChange(value) {
    const next = curriculumCourseOptions.find((cc) => String(cc.id) === value);
    setForm((prev) => {
      // Anual: el cuatrimestre queda fijo. Cuatrimestral: se propone el del plan, salvo que ya se haya elegido 1 o 2.
      let term = prev.term;
      if (!next) term = "";
      else if (next.term === ANNUAL) term = String(ANNUAL);
      else if (prev.term === "" || prev.term === String(ANNUAL)) term = String(next.term);
      return { ...prev, curriculum_course_id: value, term };
    });
    setError("");
    setFieldErrors((prev) => ({ ...prev, curriculum_course_id: undefined, term: undefined }));
  }

  async function handleSubmit() {
    if (!form.curriculum_course_id || !form.teacher_id || !form.name.trim() || !form.academic_year || form.term === "" || !form.max_capacity) {
      setError("Completá todos los campos.");
      return;
    }
    try {
      await onSubmit({
        curriculum_course_id: Number(form.curriculum_course_id),
        teacher_id: Number(form.teacher_id),
        name: form.name,
        academic_year: Number(form.academic_year),
        term: Number(form.term),
        max_capacity: Number(form.max_capacity),
        shift: form.shift,
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    }
  }

  const title = mode === "edit" ? "Editar comisión" : "Nueva comisión";

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={lock(handleSubmit)} className="users-form" noValidate>
        <fieldset className="section-form-group">
          <legend>Qué se dicta y cuándo</legend>

          <div className="users-form-field">
            <label className="users-form-label" htmlFor="sectionFormModal-1">Materia</label>
            <select id="sectionFormModal-1"
              value={form.curriculum_course_id}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="users-form-input"
            >
              {curriculumCourseOptions.length === 0
                ? <option value="">No hay materias en este plan</option>
                : <option value="">Seleccioná una materia...</option>}
              {curriculumCourseOptions.map((cc) => (
                <option key={cc.id} value={cc.id}>
                  {cc.code} - {cc.name} ({cc.yearNumber}° año, {cc.term === ANNUAL ? "anual" : `${cc.term}° cuat.`})
                </option>
              ))}
            </select>
            <FieldError errors={fieldErrors} field="curriculum_course_id" />
          </div>

          <div className="users-form-row">
            <div className="users-form-field">
              <label className="users-form-label" htmlFor="sectionFormModal-4">Año lectivo</label>
              <input id="sectionFormModal-4"
                type="number"
                inputMode="numeric"
                min="2000"
                max="2100"
                value={form.academic_year}
                onChange={(e) => handleChange("academic_year", e.target.value)}
                className="users-form-input"
              />
              <FieldError errors={fieldErrors} field="academic_year" />
            </div>
            <div className="users-form-field">
              <label className="users-form-label" htmlFor="sectionFormModal-5">Período</label>
              <select id="sectionFormModal-5"
                value={form.term}
                onChange={(e) => handleChange("term", e.target.value)}
                className="users-form-input"
                disabled={!course || isAnnual}
              >
                {!course && <option value="">Elegí primero la materia</option>}
                {isAnnual && <option value={String(ANNUAL)}>Anual (todo el año)</option>}
                {course && !isAnnual && (
                  <>
                    <option value="1">1° cuatrimestre</option>
                    <option value="2">2° cuatrimestre</option>
                  </>
                )}
              </select>
              <FieldError errors={fieldErrors} field="term" />
            </div>
          </div>
          {course && (
            <p className="section-form-hint">
              {isAnnual
                ? "Es una materia anual: solo puede tener comisiones anuales."
                : `En el plan se cursa en el ${termLabel(course.term)}; podés abrir la comisión en el otro cuatrimestre si hace falta.`}
            </p>
          )}
        </fieldset>

        <fieldset className="section-form-group">
          <legend>Quién la dicta y cuántos alumnos entran</legend>

          <div className="users-form-field">
            <label className="users-form-label" htmlFor="sectionFormModal-2">Docente titular</label>
            <SearchCombobox id="sectionFormModal-2"
              value={form.teacher_id}
              onChange={(v) => handleChange("teacher_id", String(v))}
              loadOptions={async (q) => {
                const page = await searchTeachers({ q });
                return { items: page.items.map(teacherOption), total: page.total };
              }}
              loadSelected={async (id) => teacherOption(await getTeacher(id))}
              browse
              placeholder="Buscar docente..."
              emptyLabel="No se encontraron docentes"
            />
            <FieldError errors={fieldErrors} field="teacher_id" />
          </div>

          <div className="users-form-row">
            <div className="users-form-field">
              <label className="users-form-label" htmlFor="sectionFormModal-3">Nombre de la comisión</label>
              <input id="sectionFormModal-3"
                type="text"
                maxLength={50}
                value={form.name}
                onChange={(e) => { setNameTouched(true); handleChange("name", e.target.value); }}
                placeholder="Ej: A"
                className="users-form-input"
              />
              <FieldError errors={fieldErrors} field="name" />
            </div>
            <div className="users-form-field">
              <label className="users-form-label" htmlFor="sectionFormModal-6">Cupo máximo</label>
              <input id="sectionFormModal-6"
                type="number"
                inputMode="numeric"
                min="1"
                max="500"
                value={form.max_capacity}
                onChange={(e) => handleChange("max_capacity", e.target.value)}
                className="users-form-input"
              />
              <FieldError errors={fieldErrors} field="max_capacity" />
            </div>
            <div className="users-form-field">
              <label className="users-form-label" htmlFor="sectionFormModal-7">Turno</label>
              <select id="sectionFormModal-7"
                value={form.shift}
                onChange={(e) => handleChange("shift", e.target.value)}
                className="users-form-input"
              >
                {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <FieldError errors={fieldErrors} field="shift" />
            </div>
          </div>
          <p className="section-form-hint">
            El cupo no puede superar la capacidad de las aulas de sus horarios. Los horarios se cargan al guardar.
          </p>
        </fieldset>

        {error && <p className="users-form-error">{error}</p>}

        <div className="users-form-actions">
          <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="users-btn users-btn--primary" disabled={pending} aria-busy={pending}>
            {mode === "edit" ? "Guardar" : "Crear y cargar horarios"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
