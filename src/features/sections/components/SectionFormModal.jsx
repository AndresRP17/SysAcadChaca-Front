import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import FieldError from "../../../shared/ui/FieldError";
import { getErrorMessage, getFieldErrors } from "../../../shared/api/api";
import SearchCombobox from "../../../shared/ui/SearchCombobox";
import { teacherOption } from "../../../shared/ui/searchOptions";
import { getTeacher, searchTeachers } from "../../users/services/teacherService";

const SHIFTS = ["Mañana", "Tarde", "Noche"];
const EMPTY_FORM = { curriculum_course_id: "", teacher_id: "", name: "", academic_year: "", term: "", max_capacity: "", shift: SHIFTS[0] };

export default function SectionFormModal({ open, mode, initialData, curriculumCourseOptions, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(
        initialData
          ? {
              curriculum_course_id: String(initialData.curriculumCourseId),
              teacher_id: String(initialData.teacherId),
              name: initialData.name,
              academic_year: initialData.academicYear,
              term: String(initialData.term),
              max_capacity: initialData.maxCapacity,
              shift: initialData.shift,
            }
          : EMPTY_FORM,
      );
      setError("");
      setFieldErrors({});
    }
  }, [open, initialData, curriculumCourseOptions]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.curriculum_course_id || !form.teacher_id || !form.name.trim() || !form.academic_year || !form.term || !form.max_capacity) {
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
      <form onSubmit={handleSubmit} className="users-form" noValidate>
        <div className="users-form-field">
          <label className="users-form-label" htmlFor="sectionFormModal-1">Materia</label>
          <select id="sectionFormModal-1"
            value={form.curriculum_course_id}
            onChange={(e) => handleChange("curriculum_course_id", e.target.value)}
            className="users-form-input"
          >
            {curriculumCourseOptions.length === 0
              ? <option value="">No hay materias en este plan</option>
              : <option value="">Seleccioná una materia...</option>}
            {curriculumCourseOptions.map((cc) => (
              <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
            ))}
          </select>
          <FieldError errors={fieldErrors} field="curriculum_course_id" />
        </div>

        <div className="users-form-field">
          <label className="users-form-label" htmlFor="sectionFormModal-2">Docente</label>
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

        <div className="users-form-field">
          <label className="users-form-label" htmlFor="sectionFormModal-3">Nombre de la comisión</label>
          <input id="sectionFormModal-3"
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Comisión A"
            className="users-form-input"
          />
          <FieldError errors={fieldErrors} field="name" />
        </div>

        <div className="users-form-row">
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="sectionFormModal-4">Año lectivo</label>
            <input id="sectionFormModal-4"
              type="number"
              inputMode="numeric"
              min="2000"
              value={form.academic_year}
              onChange={(e) => handleChange("academic_year", e.target.value)}
              className="users-form-input"
            />
            <FieldError errors={fieldErrors} field="academic_year" />
          </div>
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="sectionFormModal-5">Cuatrimestre</label>
            <select id="sectionFormModal-5"
              value={form.term}
              onChange={(e) => handleChange("term", e.target.value)}
              className="users-form-input"
            >
              <option value="">Seleccioná...</option>
              <option value="1">1°</option>
              <option value="2">2°</option>
            </select>
            <FieldError errors={fieldErrors} field="term" />
          </div>
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="sectionFormModal-6">Cupo máximo</label>
            <input id="sectionFormModal-6"
              type="number"
              inputMode="numeric"
              min="1"
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

        {error && <p className="users-form-error">{error}</p>}

        <div className="users-form-actions">
          <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="users-btn users-btn--primary">
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}
