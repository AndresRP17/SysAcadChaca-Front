import { useState } from "react";
import { getErrorMessage, getFieldErrors } from "../../../shared/api/api";
import FieldError from "../../../shared/ui/FieldError";
import FormError from "../../../shared/ui/FormError";

const FIELDS = ["phone", "street", "streetNumber", "floor", "apartment", "city", "province", "postalCode"];

// El backend nombra los errores en snake_case (street_number); el formulario usa camelCase.
const SERVER_FIELD = { streetNumber: "street_number", postalCode: "postal_code" };

function toForm(profile) {
  return Object.fromEntries(FIELDS.map((field) => [field, profile[field] ?? ""]));
}

export default function ContactForm({ profile, onSave }) {
  const [form, setForm] = useState(() => toForm(profile));
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const key = SERVER_FIELD[field] ?? field;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    setError("");
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err, "No se pudieron guardar los cambios."));
    } finally {
      setSaving(false);
    }
  }

  function textField(field, label, props = {}) {
    const id = `profile-${field}`;
    return (
      <div className="users-form-field">
        <label className="users-form-label" htmlFor={id}>{label}</label>
        <input
          id={id}
          type="text"
          value={form[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          className="users-form-input"
          {...props}
        />
        <FieldError errors={fieldErrors} field={SERVER_FIELD[field] ?? field} />
      </div>
    );
  }

  return (
    <section className="profile-card" aria-labelledby="profile-contact-title">
      <h2 id="profile-contact-title" className="profile-card-title">Contacto y domicilio</h2>
      <form onSubmit={handleSubmit} className="users-form" noValidate>
        {textField("phone", "Teléfono", { type: "tel", inputMode: "tel", maxLength: 30, autoComplete: "tel" })}

        <div className="users-form-row profile-row">
          {textField("street", "Calle", { maxLength: 150, autoComplete: "address-line1" })}
          {textField("streetNumber", "Número", { maxLength: 10 })}
        </div>

        <div className="users-form-row profile-row">
          {textField("floor", "Piso", { maxLength: 10 })}
          {textField("apartment", "Departamento", { maxLength: 10 })}
        </div>

        <div className="users-form-row profile-row">
          {textField("city", "Ciudad", { maxLength: 100, autoComplete: "address-level2" })}
          {textField("province", "Provincia", { maxLength: 100, autoComplete: "address-level1" })}
          {textField("postalCode", "Código postal", { maxLength: 10, autoComplete: "postal-code" })}
        </div>

        <FormError message={error} />

        <div className="users-form-actions">
          <button type="submit" className="users-btn users-btn--primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </section>
  );
}
