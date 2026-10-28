import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal/Modal";
import FieldError from "../../../shared/ui/FieldError";
import { getErrorMessage, getFieldErrors } from "../../../shared/api/api";
import { getStudyPlans } from "../../plans/services/studyPlanService";
import { useSubmitLock } from "../../../shared/hooks/useSubmitLock";

const EMPTY_FORM = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  national_id: "",
  rol: "Alumno",
  study_plan_id: "",
  enrollment_number: "",
  enrollment_date: "",
  employee_number: "",
  degree: "",
  active: true,
  manual_employee_number: false,
};

export default function UserFormModal({ open, mode, initialData, onClose, onSubmit, studentsOnly = false }) {
  const { lock, pending } = useSubmitLock();
  const [form, setForm] = useState(EMPTY_FORM);
  const [studyPlans, setStudyPlans] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  useEffect(() => {
    if (!open) return;

    getStudyPlans().then(setStudyPlans).catch(() => setStudyPlans([]));

    if (mode === "edit" && initialData) {
      const r = initialData.raw;
      setForm({
        email: r.email,
        password: "",
        first_name: r.firstName,
        last_name: r.lastName,
        national_id: r.nationalId,
        rol: initialData.rol,
        study_plan_id: r.studyPlanId ?? "",
        enrollment_number: r.enrollmentNumber ?? "",
        enrollment_date: r.enrollmentDate ?? "",
        employee_number: r.employeeNumber ?? "",
        degree: r.degree ?? "",
        active: r.active ?? true,
        manual_employee_number: false,
      });
    } else {
      // En Usuarios no se crean alumnos (eso se hace desde la vista Alumnos).
      setForm({ ...EMPTY_FORM, rol: studentsOnly ? "Alumno" : "Docente" });
    }

    setFieldErrors({});
    setGeneralError("");
  }, [open, mode, initialData, studentsOnly]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Limpiar errores previos
    setFieldErrors({});
    setGeneralError("");

    const base = {
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      national_id: form.national_id,
      password: form.password || (mode === "create" ? "" : null),
      active: form.active,
    };

    let payload = base;
    if (form.rol === "Alumno") {
      payload = {
        ...base,
        study_plan_id: Number(form.study_plan_id),
        enrollment_date: form.enrollment_date,
      };
    } else if (form.rol === "Docente") {
      payload = {
        ...base,
        ...(mode === "edit" || form.manual_employee_number
          ? { employee_number: form.employee_number }
          : {}),
        degree: form.degree,
      };
    }

    try {
      await onSubmit({ rol: form.rol, payload });
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setGeneralError(getErrorMessage(err, "Error inesperado"));
    }
  }

  const noun = studentsOnly ? "alumno" : "usuario";
  const title = mode === "edit" ? `Editar ${noun}` : `Nuevo ${noun}`;

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={lock(handleSubmit)} className="users-form" noValidate>
        {!studentsOnly && (
        <div className="users-form-field">
          <label className="users-form-label" htmlFor="userFormModal-1">Rol</label>
          <select id="userFormModal-1"
            value={form.rol}
            onChange={(e) => handleChange("rol", e.target.value)}
            className="users-form-input"
            disabled={mode === "edit"}
          >
            <option value="Docente">Docente</option>
            <option value="Bedel">Bedel</option>
            {form.rol === "Administrador" && <option value="Administrador">Administrador</option>}
          </select>
        </div>
        )}

        <div className="users-form-row">
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="userFormModal-2">Nombre</label>
            <input id="userFormModal-2"
              type="text"
              value={form.first_name}
              onChange={(e) => handleChange("first_name", e.target.value)}
              className="users-form-input"
            />
            <FieldError errors={fieldErrors} field="first_name" />
          </div>
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="userFormModal-3">Apellido</label>
            <input id="userFormModal-3"
              type="text"
              value={form.last_name}
              onChange={(e) => handleChange("last_name", e.target.value)}
              className="users-form-input"
            />
            <FieldError errors={fieldErrors} field="last_name" />
          </div>
        </div>

        <div className="users-form-row">
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="userFormModal-4">Email</label>
            <input id="userFormModal-4"
              type="email"
              inputMode="email"
              autoComplete="off"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="users-form-input"
            />
            <FieldError errors={fieldErrors} field="email" />
          </div>
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="userFormModal-5">DNI</label>
            <input id="userFormModal-5"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={form.national_id}
              onChange={(e) => handleChange("national_id", e.target.value)}
              className="users-form-input"
            />
            <FieldError errors={fieldErrors} field="national_id" />
          </div>
        </div>

        <div className="users-form-field">
          <label className="users-form-label" htmlFor="userFormModal-6">
            Contraseña {mode === "edit" && "(dejar vacío para no cambiarla)"}
          </label>
          <input id="userFormModal-6"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            className="users-form-input"
          />
          <FieldError errors={fieldErrors} field="password" />
        </div>

        {form.rol === "Alumno" ? (
          <>
            <div className="users-form-field">
              <label className="users-form-label" htmlFor="userFormModal-7">Plan de estudio</label>
              <select id="userFormModal-7"
                value={form.study_plan_id}
                onChange={(e) => handleChange("study_plan_id", e.target.value)}
                className="users-form-input"
              >
                <option value="">Seleccioná un plan...</option>
                {studyPlans.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.programName} - Res. {sp.resolutionYear}
                  </option>
                ))}
              </select>
              <FieldError errors={fieldErrors} field="study_plan_id" />
            </div>

            <div className="users-form-row">
              {mode === "edit" && (
                <div className="users-form-field">
                  <label className="users-form-label" htmlFor="userFormModal-8">Legajo</label>
                  <input id="userFormModal-8" type="text" value={form.enrollment_number} disabled className="users-form-input" />
                </div>
              )}
              <div className="users-form-field">
                <label className="users-form-label" htmlFor="userFormModal-9">Fecha de ingreso</label>
                <input id="userFormModal-9"
                  type="date"
                  value={form.enrollment_date}
                  onChange={(e) => handleChange("enrollment_date", e.target.value)}
                  className="users-form-input"
                />
                <FieldError errors={fieldErrors} field="enrollment_date" />
              </div>
            </div>
          </>
        ) : form.rol === "Docente" ? (
          <>
            {mode === "create" && (
              <div className="users-form-field">
                <label className="users-form-label">
                  <input
                    type="checkbox"
                    checked={form.manual_employee_number}
                    onChange={(e) => handleChange("manual_employee_number", e.target.checked)}
                  />{" "}
                  Cargar legajo manual
                </label>
              </div>
            )}
            <div className="users-form-row">
              {(mode === "edit" || form.manual_employee_number) && (
                <div className="users-form-field">
                  <label className="users-form-label" htmlFor="userFormModal-10">Legajo</label>
                  <input id="userFormModal-10"
                    type="text"
                    value={form.employee_number}
                    onChange={(e) => handleChange("employee_number", e.target.value)}
                    disabled={mode === "edit"}
                    className="users-form-input"
                  />
                  <FieldError errors={fieldErrors} field="employee_number" />
                </div>
              )}
              <div className="users-form-field">
                <label className="users-form-label" htmlFor="userFormModal-11">Título</label>
                <input id="userFormModal-11"
                  type="text"
                  value={form.degree}
                  onChange={(e) => handleChange("degree", e.target.value)}
                  className="users-form-input"
                />
                <FieldError errors={fieldErrors} field="degree" />
              </div>
            </div>
          </>
        ) : null}

        {mode === "edit" && (
          <div className="users-form-field">
            <label className="users-form-label">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => handleChange("active", e.target.checked)}
              />{" "}
              Activo
            </label>
          </div>
        )}

        {generalError && <p className="users-form-error">{generalError}</p>}

        <div className="users-form-actions">
          <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="users-btn users-btn--primary" disabled={pending} aria-busy={pending}>
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}