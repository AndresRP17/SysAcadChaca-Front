import ScheduleLines from "./ScheduleLines";

export default function AvailableSectionsList({ items, conflictsBySection, onEnroll, submitting }) {
  if (items.length === 0) {
    return <p className="users-empty">No hay comisiones abiertas para inscribirte en este momento.</p>;
  }

  return (
    <div className="portal-cards">
      {items.map(({ section, schedules, taken, remaining }) => {
        const conflicts = conflictsBySection.get(section.id) ?? [];
        const conflictIds = conflicts.map((c) => c.candidateSchedule.id);
        const full = remaining === 0;

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
              <span className={`users-badge ${full ? "users-badge--inactive" : "users-badge--navy"}`}>
                {full ? "Sin cupo" : `${remaining} de ${section.maxCapacity} lugares`}
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
                disabled={full || submitting || taken === undefined}
                onClick={() => onEnroll(section.id)}
              >
                Inscribirme
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
