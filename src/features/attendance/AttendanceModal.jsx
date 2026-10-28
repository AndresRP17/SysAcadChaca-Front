import { useState } from "react";
import Modal from "../../shared/ui/Modal";
import AttendanceSheet from "./AttendanceSheet/AttendanceSheet";

// Toma de asistencia como modal sobre el calendario: el docente no pierde de vista la agenda.
// `target` = { sectionId, date } de la clase tocada (null = cerrado).
export default function AttendanceModal({ target, onClose, onSaved }) {
  const [dirty, setDirty] = useState(false);

  return (
    <Modal open={target !== null} title="Asistencia" size="wide" dirty={dirty} onClose={onClose}>
      {target && (
        <AttendanceSheet
          key={`${target.sectionId}-${target.date}`}
          sectionId={target.sectionId}
          date={target.date}
          HeadingTag="h2"
          onDirtyChange={setDirty}
          onSaved={(summary) => {
            setDirty(false);
            onSaved?.(target, summary);
          }}
        />
      )}
    </Modal>
  );
}
