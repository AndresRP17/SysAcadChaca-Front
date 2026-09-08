import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import { getStudyPlans } from "../../plans/services/studyPlanService";

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
};

export default function UserFormModal({ open, mode, initialData, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [studyPlans, setStudyPlans] = useState([]);
  const [error, setError] = useState("");

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
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError("");
  }, [open, mode, initialData]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.email.trim() || !form.first_name.trim() || !form.last_name.trim() || !form.national_id.trim()) {
      setError("Completá email, nombre, apellido y DNI.");
      return;
    }
    if (mode === "create" && form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    const base = {
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      national_id: form.national_id,
      // en edición, si no se toca la contraseña se manda vacía y el backend la deja como está
      password: form.password || (mode === "create" ? "" : null),
    };

    const payload =
      form.rol === "Alumno"
        ? { ...base, study_plan_id: Number(form.study_plan_id), enrollment_number: form.enrollment_number, enrollment_date: form.enrollment_date }
        : { ...base, employee_number: form.employee_number, degree: form.degree };

    try {
      await onSubmit({ rol: form.rol, payload });
    } catch (err) {
      setError(err.message);
    }
  }

  const title = mode === "edit" ? "Editar usuario" : "Nuevo usuario";

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="users-form">
        <div className="users-form-field">
          <label className="users-form-label">Rol</label>
          <select
            value={form.rol}
            onChange={(e) => handleChange("rol", e.target.value)}
            className="users-form-input"
            disabled={mode === "edit"}
          >
            <option value="Alumno">Alumno</option>
            <option value="Docente">Docente</option>
          </select>
        </div>

        <div className="users-form-row">
          <div className="users-form-field">
            <label className="users-form-label">Nombre</label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => handleChange("first_name", e.target.value)}
              className="users-form-input"
            />
          </div>
          <div className="users-form-field">
            <label className="users-form-label">Apellido</label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => handleChange("last_name", e.target.value)}
              className="users-form-input"
            />
          </div>
        </div>

        <div className="users-form-row">
          <div className="users-form-field">
            <label className="users-form-label">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="users-form-input"
            />
          </div>
          <div className="users-form-field">
            <label className="users-form-label">DNI</label>
            <input
              type="text"
              value={form.national_id}
              onChange={(e) => handleChange("national_id", e.target.value)}
              className="users-form-input"
            />
          </div>
        </div>

        <div className="users-form-field">
          <label className="users-form-label">
            Contraseña {mode === "edit" && "(dejar vacío para no cambiarla)"}
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            className="users-form-input"
          />
        </div>

        {form.rol === "Alumno" ? (
          <>
            <div className="users-form-field">
              <label className="users-form-label">Plan de estudio</label>
              <select
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
            </div>
            <div className="users-form-row">
              <div className="users-form-field">
                <label className="users-form-label">Legajo</label>
                <input
                  type="text"
                  value={form.enrollment_number}
                  onChange={(e) => handleChange("enrollment_number", e.target.value)}
                  className="users-form-input"
                />
              </div>
              <div className="users-form-field">
                <label className="users-form-label">Fecha de ingreso</label>
                <input
                  type="date"
                  value={form.enrollment_date}
                  onChange={(e) => handleChange("enrollment_date", e.target.value)}
                  className="users-form-input"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="users-form-row">
            <div className="users-form-field">
              <label className="users-form-label">Legajo</label>
              <input
                type="text"
                value={form.employee_number}
                onChange={(e) => handleChange("employee_number", e.target.value)}
                className="users-form-input"
              />
            </div>
            <div className="users-form-field">
              <label className="users-form-label">Título</label>
              <input
                type="text"
                value={form.degree}
                onChange={(e) => handleChange("degree", e.target.value)}
                className="users-form-input"
              />
            </div>
          </div>
        )}

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
