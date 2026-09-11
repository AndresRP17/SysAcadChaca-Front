import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import { getErrorMessage } from "../../../shared/api/api";

const WEEKDAYS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
const WEEKDAY_LABELS = { LUNES: "Lunes", MARTES: "Martes", MIERCOLES: "Miércoles", JUEVES: "Jueves", VIERNES: "Viernes", SABADO: "Sábado" };
const EMPTY_FORM = { classroom_id: "", weekday: WEEKDAYS[0], start_time: "", end_time: "" };

export function weekdayLabel(weekday) {
  return WEEKDAY_LABELS[weekday] ?? weekday;
}

// El backend devuelve las horas como "HH:MM:SS"; para mostrar alcanza con "HH:MM".
export function formatTime(time) {
  return time?.slice(0, 5) ?? "";
}

export default function SectionScheduleFormModal({ open, classroomOptions, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_FORM, classroom_id: classroomOptions[0]?.id ?? "" });
      setError("");
    }
  }, [open, classroomOptions]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.classroom_id || !form.start_time || !form.end_time) {
      setError("Completá todos los campos.");
      return;
    }
    try {
      await onSubmit({
        classroom_id: Number(form.classroom_id),
        weekday: form.weekday,
        start_time: form.start_time,
        end_time: form.end_time,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <Modal open={open} title="Agregar horario" onClose={onClose}>
      <form onSubmit={handleSubmit} className="users-form">
        <div className="users-form-field">
          <label className="users-form-label">Aula</label>
          <select
            value={form.classroom_id}
            onChange={(e) => handleChange("classroom_id", e.target.value)}
            className="users-form-input"
          >
            {classroomOptions.length === 0 && <option value="">No hay aulas cargadas</option>}
            {classroomOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.location})</option>
            ))}
          </select>
        </div>

        <div className="users-form-field">
          <label className="users-form-label">Día</label>
          <select
            value={form.weekday}
            onChange={(e) => handleChange("weekday", e.target.value)}
            className="users-form-input"
          >
            {WEEKDAYS.map((w) => <option key={w} value={w}>{weekdayLabel(w)}</option>)}
          </select>
        </div>

        <div className="users-form-row">
          <div className="users-form-field">
            <label className="users-form-label">Hora inicio</label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => handleChange("start_time", e.target.value)}
              className="users-form-input"
            />
          </div>
          <div className="users-form-field">
            <label className="users-form-label">Hora fin</label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => handleChange("end_time", e.target.value)}
              className="users-form-input"
            />
          </div>
        </div>

        {error && <p className="users-form-error">{error}</p>}

        <div className="users-form-actions">
          <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="users-btn users-btn--primary">
            Agregar
          </button>
        </div>
      </form>
    </Modal>
  );
}
