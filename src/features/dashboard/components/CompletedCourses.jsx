import { Link } from "react-router-dom";

const RESULT_LABELS = {
  PROMOCIONADO: "Promocionado",
  REGULAR: "Regular",
  LIBRE: "Libre",
};

const RESULT_BADGE_CLASS = {
  PROMOCIONADO: "users-badge users-badge--active",
  REGULAR: "users-badge users-badge--active",
  LIBRE: "users-badge users-badge--inactive",
};

const MAX_ITEMS = 5;

// Cursadas ya cerradas (Regular/Promocionado/Libre). GET /students/me/summary
// solo devuelve las activas, así que estas vienen de /students/me/history.
// Se muestran las más recientes y un link al historial completo.
export default function CompletedCourses({ courses }) {
  if (courses.length === 0) return null;

  const recent = [...courses]
    .sort((a, b) => b.academicYear - a.academicYear || b.term - a.term)
    .slice(0, MAX_ITEMS);

  return (
    <div className="dash-panel">
      <h3 className="dash-panel-title">Cursadas finalizadas</h3>
      <ul className="dash-list">
        {recent.map((c, i) => (
          <li key={`${c.courseName}-${c.sectionName}-${c.academicYear}-${c.term}-${i}`} className="dash-list-item">
            <div>
              <p className="dash-list-item-title">{c.courseName}</p>
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
      <p className="dash-list-item-sub">
        <Link to="/historial">Ver historial académico completo</Link>
      </p>
    </div>
  );
}
