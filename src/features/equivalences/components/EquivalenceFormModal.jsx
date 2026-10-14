import { useEffect, useMemo, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import Combobox from "../../../shared/ui/Combobox";
import SearchCombobox from "../../../shared/ui/SearchCombobox";
import { studentOption } from "../../../shared/ui/searchOptions";
import { searchStudents } from "../../users/services/studentService";
import { getErrorMessage, getFieldErrors } from "../../../shared/api/api";
import { getCurriculumCourses } from "../../plans/services/curriculumCourseService";
import { createEquivalence, updateEquivalence } from "../services/equivalenceService";
import { TYPE_HELP, TYPE_LABELS } from "../equivalenceLabels";

// Alta y edicion (solo PENDING). Alumno: pide para si mismo (planId = el de su legajo).
// Bedel/Administrador: eligen alumno (busqueda en el servidor) y la materia sale del plan de ese alumno.
export default function EquivalenceFormModal({ open, editing, isStaff = false, studentPlanId, blockedCourseIds = [], onClose, onSaved }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const studentId = selectedStudent ? selectedStudent.id : editing ? editing.studentId : "";
  const [type, setType] = useState("EXTERNAL");
  const [courseId, setCourseId] = useState("");
  const [institution, setInstitution] = useState("");
  const [originCourse, setOriginCourse] = useState("");
  const [grade, setGrade] = useState("");
  const [reason, setReason] = useState("");
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setFieldErrors({});
    setBusy(false);
    setSelectedStudent(null);
    if (editing) {
      setType(editing.type);
      setCourseId(editing.curriculumCourseId);
      setInstitution(editing.originInstitution ?? "");
      setOriginCourse(editing.originCourse ?? "");
      setGrade(editing.originGrade != null ? String(editing.originGrade) : "");
      setReason(editing.type === "INTERNAL" ? editing.reason ?? "" : "");
    } else {
      setType("EXTERNAL");
      setCourseId("");
      setInstitution("");
      setOriginCourse("");
      setGrade("");
      setReason("");
    }
  }, [open, editing]);

  const planId = editing ? editing.studyPlanId : isStaff ? selectedStudent?.studyPlanId : studentPlanId;

  useEffect(() => {
    if (!open || !planId) {
      setCourses([]);
      return;
    }
    let cancelled = false;
    setLoadingCourses(true);
    getCurriculumCourses(planId)
      .then((data) => !cancelled && setCourses(data))
      .catch((e) => !cancelled && setError(getErrorMessage(e, "No pudimos cargar las materias del plan.")))
      .finally(() => !cancelled && setLoadingCourses(false));
    return () => {
      cancelled = true;
    };
  }, [open, planId]);

  const courseOptions = useMemo(
    () =>
      courses
        .filter((c) => String(c.id) === String(courseId) || !blockedCourseIds.includes(c.id))
        .map((c) => ({
          value: c.id,
          label: `${c.courseName} (${c.courseCode}) · ${c.yearNumber}º año`,
          searchText: `${c.courseName} ${c.courseCode}`,
        })),
    [courses, courseId, blockedCourseIds],
  );

  function validate() {
    const errs = {};
    if (isStaff && !studentId) errs.student_id = "Elegí el alumno.";
    if (!courseId) errs.curriculum_course_id = "Elegí la materia de tu plan.";
    if (type === "EXTERNAL") {
      if (!institution.trim()) errs.origin_institution = "La institución de origen es obligatoria.";
      if (!originCourse.trim()) errs.origin_course = "La materia de origen es obligatoria.";
    }
    if (grade !== "") {
      const n = Number(grade.replace(",", "."));
      if (Number.isNaN(n) || n < 1 || n > 10) errs.origin_grade = "La nota debe estar entre 1 y 10.";
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setFieldErrors(errs);
    setError("");
    if (Object.keys(errs).length) return;

    const body = { type, curriculum_course_id: Number(courseId) };
    if (isStaff && !editing) body.student_id = Number(studentId);
    if (type === "EXTERNAL") {
      body.origin_institution = institution.trim();
      body.origin_course = originCourse.trim();
    } else if (reason.trim()) {
      body.reason = reason.trim();
    }
    if (grade !== "") body.origin_grade = Number(grade.replace(",", "."));

    setBusy(true);
    try {
      if (editing) await updateEquivalence(editing.id, body);
      else await createEquivalence(body);
      onSaved(editing ? "Solicitud actualizada." : "Solicitud enviada.");
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err, "No pudimos guardar la solicitud."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title={editing ? "Editar solicitud" : "Nueva solicitud de equivalencia"} onClose={onClose}>
      <form className="users-form" onSubmit={handleSubmit} noValidate>
        {isStaff && (
          <div className="users-form-field">
            <label className="users-form-label">Alumno</label>
            {editing ? (
              <p className="users-confirm-text">{editing.studentLastName}, {editing.studentFirstName}</p>
            ) : (
              <SearchCombobox
                value={studentId}
                loadOptions={async (q) => {
                  const page = await searchStudents({ q });
                  return { items: page.items.map(studentOption), total: page.total };
                }}
                onChange={(_, option) => {
                  setSelectedStudent(option ? option.data : null);
                  setCourseId("");
                }}
                placeholder="Buscar por apellido, nombre, legajo o DNI..."
                emptyLabel="No se encontraron alumnos"
              />
            )}
            {fieldErrors.student_id && <p className="users-form-error">{fieldErrors.student_id}</p>}
          </div>
        )}

        <fieldset className="equiv-type">
          <legend className="users-form-label">Tipo de equivalencia</legend>
          {Object.keys(TYPE_LABELS).map((t) => (
            <label key={t} className={`equiv-type-option ${type === t ? "equiv-type-option--active" : ""}`}>
              <input type="radio" name="equiv-type" value={t} checked={type === t} disabled={!!editing} onChange={() => setType(t)} />
              <span>
                <strong>{TYPE_LABELS[t]}</strong>
                <span className="equiv-sub">{TYPE_HELP[t]}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="users-form-field">
          <label className="users-form-label">Materia de tu plan a reconocer</label>
          {isStaff && !editing && !studentId ? (
            <p className="equiv-sub">Primero elegí el alumno.</p>
          ) : loadingCourses ? (
            <p className="equiv-sub">Cargando materias...</p>
          ) : (
            <Combobox
              options={courseOptions}
              value={courseId}
              onChange={setCourseId}
              placeholder="Buscar materia por nombre o código..."
              emptyLabel="No hay materias disponibles para pedir"
            />
          )}
          {fieldErrors.curriculum_course_id && <p className="users-form-error">{fieldErrors.curriculum_course_id}</p>}
        </div>

        {type === "EXTERNAL" ? (
          <>
            <div className="users-form-field">
              <label className="users-form-label" htmlFor="eq-inst">Institución de origen</label>
              <input id="eq-inst" className="users-form-input" maxLength={150} value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Ej.: UNNE - FaCENA" />
              {fieldErrors.origin_institution && <p className="users-form-error">{fieldErrors.origin_institution}</p>}
            </div>
            <div className="users-form-field">
              <label className="users-form-label" htmlFor="eq-course">Materia de origen</label>
              <input id="eq-course" className="users-form-input" maxLength={150} value={originCourse} onChange={(e) => setOriginCourse(e.target.value)} placeholder="Ej.: Química General" />
              {fieldErrors.origin_course && <p className="users-form-error">{fieldErrors.origin_course}</p>}
            </div>
          </>
        ) : (
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="eq-reason">Motivo (opcional)</label>
            <textarea id="eq-reason" className="users-form-input" rows={3} maxLength={255} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej.: la materia no abre comisión en mi año" />
            {fieldErrors.reason && <p className="users-form-error">{fieldErrors.reason}</p>}
          </div>
        )}

        <div className="users-form-field">
          <label className="users-form-label" htmlFor="eq-grade">
            {type === "EXTERNAL" ? "Nota de origen (opcional, 1 a 10)" : "Nota (opcional, 1 a 10)"}
          </label>
          <input id="eq-grade" className="users-form-input" inputMode="decimal" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Ej.: 8,5" />
          {fieldErrors.origin_grade && <p className="users-form-error">{fieldErrors.origin_grade}</p>}
        </div>

        {error && <p className="users-form-error" role="alert">{error}</p>}
        <div className="users-form-actions">
          <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="users-btn users-btn--primary" disabled={busy}>
            {editing ? "Guardar cambios" : "Enviar solicitud"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
