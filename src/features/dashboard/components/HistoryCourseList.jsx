const RESULT_LABELS = {
  EN_CURSO: "Cursando",
  BAJA: "Baja",
  PROMOCIONADO: "Promocionado",
  REGULAR: "Regular",
  LIBRE: "Libre",
};

const RESULT_BADGE_CLASS = {
  EN_CURSO: "dash-badge dash-badge--navy",
  BAJA: "dash-badge dash-badge--gray",
  PROMOCIONADO: "users-badge users-badge--active",
  REGULAR: "users-badge users-badge--active",
  LIBRE: "users-badge users-badge--inactive",
};

export default function HistoryCourseList({ courses }) {
  return (
    <div className="dash-panel">
      <h3 className="dash-panel-title">Materias cursadas</h3>
      {courses.length === 0 ? (
        <p className="users-empty">Todavía no tenés cursadas registradas.</p>
      ) : (
        <ul className="dash-list">
          {courses.map((c, i) => (
            <li key={`${c.courseName}-${c.sectionName}-${c.academicYear}-${c.term}-${i}`} className="dash-list-item">
              <div>
                <p className="dash-list-item-title">
                  {c.courseName} — Comisión {c.sectionName}
                </p>
                <p className="dash-list-item-sub">
                  {c.academicYear} · {c.term}° cuatrimestre
                  {c.finalGrade != null ? ` · nota ${c.finalGrade}` : ""}
                </p>
              </div>
              <span className={RESULT_BADGE_CLASS[c.result] ?? "dash-badge dash-badge--gray"}>
                {RESULT_LABELS[c.result] ?? c.result}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
