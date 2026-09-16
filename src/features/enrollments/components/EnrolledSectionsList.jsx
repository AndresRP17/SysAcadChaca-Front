import ScheduleLines from "./ScheduleLines";

export default function EnrolledSectionsList({ items, onUnenroll, submitting }) {
  if (items.length === 0) {
    return <p className="users-empty">Todavía no te inscribiste en ninguna comisión.</p>;
  }

  return (
    <div className="portal-cards">
      {items.map(({ enrollment, section, schedules }) => (
        <article key={enrollment.id} className="portal-card portal-card--enrolled">
          <div className="portal-card-head">
            <div>
              <h3 className="portal-card-title">{section.courseName}</h3>
              <p className="portal-card-sub">
                Comisión {section.name} · {section.shift} · {section.academicYear}
              </p>
            </div>
            <span className="users-badge users-badge--active">{enrollment.status}</span>
          </div>

          <ScheduleLines schedules={schedules} />

          <div className="portal-card-actions">
            <button
              type="button"
              className="users-action-btn users-action-btn--danger"
              disabled={submitting}
              onClick={() => onUnenroll(enrollment)}
            >
              Darme de baja
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
