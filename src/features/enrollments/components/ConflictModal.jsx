import Modal from "../../../shared/ui/Modal";
import { weekdayLabel, formatTime } from "../../sections/components/SectionScheduleFormModal";

// Aviso de superposición: mostramos con qué materia choca cada horario y
// dejamos que el alumno decida. Si la cátedra pide que sea un bloqueo duro,
// alcanza con sacar el botón "Inscribirme igual".
export default function ConflictModal({ open, conflicts, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <Modal open={open} title="Superposición de horarios" onClose={onCancel}>
      <p className="users-confirm-text">
        Esta comisión se superpone con materias en las que ya estás inscripto:
      </p>

      <ul className="portal-conflict-list">
        {conflicts.map((c, index) => (
          <li key={index} className="portal-conflict-item">
            {c.courseName} (comisión {c.sectionName}) — {weekdayLabel(c.enrolledSchedule.weekday)}{" "}
            {formatTime(c.enrolledSchedule.startTime)}–{formatTime(c.enrolledSchedule.endTime)} contra{" "}
            {formatTime(c.candidateSchedule.startTime)}–{formatTime(c.candidateSchedule.endTime)}
          </li>
        ))}
      </ul>

      <div className="users-form-actions">
        <button type="button" className="users-btn users-btn--ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="users-btn users-btn--primary" onClick={onConfirm}>
          Inscribirme igual
        </button>
      </div>
    </Modal>
  );
}
