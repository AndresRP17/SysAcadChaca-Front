const STATUS_LABELS = { active: "Cursando" };

export default function CourseList({ courses }) {
  return (
    <div className="dash-panel">
      <h3 className="dash-panel-title">Materias en curso</h3>
      {courses.length === 0 ? (
        <p className="users-empty">Todavía no estás cursando materias.</p>
      ) : (
        <ul className="dash-list">
          {courses.map((c) => (
            <li key={`${c.courseName}-${c.sectionName}`} className="dash-list-item">
              <div>
                <p className="dash-list-item-title">
                  {c.courseName} — Comisión {c.sectionName}
                </p>
                <p className="dash-list-item-sub">{c.teacherName}</p>
              </div>
              <span className="dash-badge dash-badge--navy">{STATUS_LABELS[c.status] ?? c.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
