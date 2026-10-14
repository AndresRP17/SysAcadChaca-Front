import { useState } from "react";
import { getErrorMessage, getFieldErrors } from "../../../shared/api/api";
import FieldError from "../../../shared/ui/FieldError";
import FormError from "../../../shared/ui/FormError";

const MIN_LENGTH = 8;
const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

export default function ChangePasswordForm({ onChange }) {
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    setError("");

    if (form.newPassword.length < MIN_LENGTH) {
      setFieldErrors({ new_password: `La contraseña nueva debe tener al menos ${MIN_LENGTH} caracteres.` });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setFieldErrors({ confirm_password: "Las contraseñas no coinciden." });
      return;
    }

    setSaving(true);
    try {
      await onChange({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm(EMPTY);
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err, "No se pudo cambiar la contraseña."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="profile-card" aria-labelledby="profile-password-title">
      <h2 id="profile-password-title" className="profile-card-title">Cambiar contraseña</h2>
      <p className="profile-hint">Al cambiarla se cierra tu sesión y tenés que ingresar de nuevo.</p>
      <form onSubmit={handleSubmit} className="users-form" noValidate>
        <div className="users-form-field">
          <label className="users-form-label" htmlFor="profile-current-password">Contraseña actual</label>
          <input
            id="profile-current-password"
            type="password"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={(e) => handleChange("currentPassword", e.target.value)}
            className="users-form-input"
          />
          <FieldError errors={fieldErrors} field="current_password" />
        </div>

        <div className="users-form-row profile-row">
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="profile-new-password">Contraseña nueva</label>
            <input
              id="profile-new-password"
              type="password"
              autoComplete="new-password"
              value={form.newPassword}
              onChange={(e) => handleChange("newPassword", e.target.value)}
              className="users-form-input"
            />
            <FieldError errors={fieldErrors} field="new_password" />
          </div>
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="profile-confirm-password">Repetir contraseña nueva</label>
            <input
              id="profile-confirm-password"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              className="users-form-input"
            />
            <FieldError errors={fieldErrors} field="confirm_password" />
          </div>
        </div>

        <FormError message={error} />

        <div className="users-form-actions">
          <button
            type="submit"
            className="users-btn users-btn--primary"
            disabled={saving || !form.currentPassword || !form.newPassword}
          >
            {saving ? "Cambiando..." : "Cambiar contraseña"}
          </button>
        </div>
      </form>
    </section>
  );
}
