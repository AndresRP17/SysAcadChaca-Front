import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";

// Cerrar el acta = guardar libro y folio en la mesa (exam_boards.record_book /
// record_folio). A partir de ahí la vista queda de solo lectura.
export default function CloseActaModal({ open, board, onClose, onSubmit }) {
  const [form, setForm] = useState({ record_book: "", record_folio: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        record_book: board?.recordBook ?? "",
        record_folio: board?.recordFolio ?? "",
      });
      setError("");
    }
  }, [open, board]);

  if (!open) return null;

  async function handleSubmit() {
    if (!form.record_book.toString().trim() || !form.record_folio.toString().trim()) {
      setError("Completá libro y folio para cerrar el acta.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSubmit(form);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Cerrar acta" onClose={onClose}>
      <p className="users-confirm-text">
        {board?.courseName} — una vez cerrada, el acta queda de solo lectura.
      </p>

      {error && <p className="users-form-error">{error}</p>}

      <div className="users-form-row">
        <div className="users-form-field">
          <label className="users-form-label" htmlFor="acta-book">
            Libro
          </label>
          <input
            id="acta-book"
            className="users-form-input"
            value={form.record_book}
            onChange={(e) => setForm({ ...form, record_book: e.target.value })}
          />
        </div>

        <div className="users-form-field">
          <label className="users-form-label" htmlFor="acta-folio">
            Folio
          </label>
          <input
            id="acta-folio"
            className="users-form-input"
            value={form.record_folio}
            onChange={(e) => setForm({ ...form, record_folio: e.target.value })}
          />
        </div>
      </div>

      <div className="users-form-actions">
        <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="users-btn users-btn--primary" disabled={saving} onClick={handleSubmit}>
          Cerrar acta
        </button>
      </div>
    </Modal>
  );
}
