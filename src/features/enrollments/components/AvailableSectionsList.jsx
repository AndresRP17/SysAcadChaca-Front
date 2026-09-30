import ScheduleLines from "./ScheduleLines";

export default function AvailableSectionsList({
  items,
  conflictsBySection,
  onEnroll,
  submitting,
  actionLabel = "Inscribirme",
  emptyLabel = "No hay comisiones abiertas para inscribirte en este momento.",
}) {
  if (items.length === 0) {
    return <p className="users-empty">{emptyLabel}</p>;
  }

  return (
    <div className="portal-cards">
      {items.map(({ section, schedules }) => {
        const conflicts = conflictsBySection.get(section.id) ?? [];
        const conflictIds = conflicts.map((c) => c.candidateSchedule.id);
        const seats = section.availableSeats;
        const noSchedule = seats === null || seats === undefined;
        const full = seats === 0;

        return (
          <article key={section.id} className="portal-card">
            <div className="portal-card-head">
              <div>
                <h3 className="portal-card-title">{section.courseName}</h3>
                <p className="portal-card-sub">
                  Comisión {section.name} · {section.shift} · {section.academicYear}
                </p>
                {(section.teacherFirstName || section.teacherLastName) && (
                  <p className="portal-card-sub">
                    {section.teacherFirstName} {section.teacherLastName}
                  </p>
                )}
              </div>
              <span className={`users-badge ${full || noSchedule ? "users-badge--inactive" : "users-badge--navy"}`}>
                {noSchedule ? "Sin horario asignado" : full ? "Sin cupo" : `${seats} ${seats === 1 ? "lugar disponible" : "lugares disponibles"}`}
              </span>
            </div>

            <ScheduleLines schedules={schedules} highlightIds={conflictIds} />

            {conflicts.length > 0 && (
              <p className="portal-conflict-note">
                Se superpone con {conflicts[0].courseName} (comisión {conflicts[0].sectionName})
              </p>
            )}

            <div className="portal-card-actions">
              <button
                type="button"
                className="users-btn users-btn--primary"
                disabled={full || noSchedule || submitting}
                onClick={() => onEnroll(section.id)}
              >
                {actionLabel}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
