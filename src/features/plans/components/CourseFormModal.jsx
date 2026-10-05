import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import FieldError from "../../../shared/ui/FieldError";
import { getErrorMessage, getFieldErrors } from "../../../shared/api/api";

const EMPTY_FORM = { name: "", code: "" };

const STOPWORDS = new Set(["de", "del", "la", "el", "los", "las", "en", "y", "a", "con", "para"]);

function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
}

// Sugiere un código a partir del nombre (inicial de hasta 4 palabras significativas,
// con fallback a las primeras letras del nombre); nunca se autoasigna en silencio,
// el campo Código sigue siendo editable siempre (a diferencia del legajo docente,
// en SIU-Guaraní el código de materia siempre lo confirma una persona a mano).
export function suggestCourseCode(name, existingCodes = []) {
  const words = normalize(name)
    .split(/[^A-Z0-9]+/)
    .filter((w) => w.length > 0 && !STOPWORDS.has(w.toLowerCase()));

  let base = words.slice(0, 4).map((w) => w[0]).join("");
  if (!base) base = normalize(name).replace(/[^A-Z0-9]/g, "").slice(0, 3);
  if (!base) return "";

  const taken = new Set(existingCodes.map((c) => normalize(c ?? "")));
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}${suffix}`)) suffix += 1;
  return `${base}${suffix}`;
}

export default function CourseFormModal({ open, mode, initialData, existingCodes = [], onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        initialData
          ? { name: initialData.name, code: initialData.code }
          : EMPTY_FORM,
      );
      setCodeManuallyEdited(mode === "edit");
      setError("");
      setFieldErrors({});
    }
  }, [open, initialData, mode]);

  function handleChange(field, value) {
    if (field === "code") {
      setCodeManuallyEdited(true);
      setForm((prev) => ({ ...prev, code: value }));
      return;
    }
    if (field === "name" && !codeManuallyEdited) {
      const codesToAvoid = existingCodes.filter((c) => c !== initialData?.code);
      setForm((prev) => ({ ...prev, name: value, code: suggestCourseCode(value, codesToAvoid) }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      setError("Completá todos los campos.");
      return;
    }
    try {
      await onSubmit(form);
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    }
  }

  const title = mode === "edit" ? "Editar materia" : "Nueva materia";

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="users-form" noValidate>
        <div className="users-form-field">
          <label className="users-form-label">Nombre</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="users-form-input"
          />
          <FieldError errors={fieldErrors} field="name" />
        </div>

        <div className="users-form-field">
          <label className="users-form-label">Código</label>
          <input
            type="text"
            value={form.code}
            onChange={(e) => handleChange("code", e.target.value)}
            className="users-form-input"
          />
          <FieldError errors={fieldErrors} field="code" />
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
