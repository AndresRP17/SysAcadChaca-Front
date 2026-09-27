import Modal from "../../../shared/ui/Modal";
import { weekdayLabel, formatTime } from "../../sections/components/SectionScheduleFormModal";

// La superposición de horarios es un bloqueo duro: el backend rechaza la
// inscripción (409), así que acá solo se informa con qué materia choca.
export default function ConflictModal({ open, conflicts, onClose }) {
  if (!open) return null;

  return (
    <Modal open={open} title="No podés inscribirte a esta comisión" onClose={onClose}>
      <p className="users-confirm-text">
        Su horario se superpone con materias en las que ya estás inscripto:
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
        <button type="button" className="users-btn users-btn--primary" onClick={onClose}>
          Entendido
        </button>
      </div>
    </Modal>
  );
}
