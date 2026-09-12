import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import { getErrorMessage } from "../../../shared/api/api";
import { getAvailability } from "../services/sectionScheduleService";

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

export default function SectionScheduleFormModal({ open, classroomOptions, teacherId, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_FORM, classroom_id: classroomOptions[0]?.id ?? "" });
      setError("");
      setAvailability(null);
    }
  }, [open, classroomOptions]);

  useEffect(() => {
    if (!open || !teacherId || !form.classroom_id || !form.weekday || !form.start_time || !form.end_time) {
      setAvailability(null);
      return;
    }

    let cancelled = false;
    setCheckingAvailability(true);

    const timeoutId = setTimeout(async () => {
      try {
        const result = await getAvailability({
          classroomId: Number(form.classroom_id),
          teacherId,
          weekday: form.weekday,
          startTime: form.start_time,
          endTime: form.end_time,
        });
        if (!cancelled) setAvailability(result);
      } catch {
        if (!cancelled) setAvailability(null);
      } finally {
        if (!cancelled) setCheckingAvailability(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [open, teacherId, form.classroom_id, form.weekday, form.start_time, form.end_time]);

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

        {checkingAvailability && <p className="users-subtitle">Verificando disponibilidad...</p>}

        {!checkingAvailability && availability && !availability.available && (
          <div className="users-form-error">
            {availability.conflicts.map((conflict, i) => <p key={i}>{conflict}</p>)}
          </div>
        )}

        {!checkingAvailability && availability?.available && (
          <p className="users-subtitle">Sin conflictos para ese horario.</p>
        )}

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
