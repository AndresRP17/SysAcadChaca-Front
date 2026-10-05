import { weekdayLabel, formatTime } from "../../sections/components/SectionScheduleFormModal";

export default function ScheduleLines({ schedules, highlightIds = [] }) {
  if (schedules.length === 0) {
    return <p className="portal-schedule portal-schedule--empty">Sin horarios cargados</p>;
  }

  return (
    <ul className="portal-schedule-list">
      {schedules.map((sch) => (
        <li
          key={sch.id}
          className={`portal-schedule ${highlightIds.includes(sch.id) ? "portal-schedule--conflict" : ""}`}
        >
          {weekdayLabel(sch.weekday)} {formatTime(sch.startTime)}–{formatTime(sch.endTime)}
          {sch.classroomName ? ` · ${sch.classroomName}` : ""}
        </li>
      ))}
    </ul>
  );
}
