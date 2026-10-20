import { REGULARITY_BADGE, regularityLabel, studentRegularityLines } from "../../regularity/regularityStatus";

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

// Si la cursada quedó en "Regular" el estado que vale es el de la regularidad vigente de la materia
// (Regular / Perdida / Aprobada), con sus detalles: vencimiento, aplazos que quedan o motivo de la pérdida.
export default function HistoryCourseList({ courses, regularities = [] }) {
  const byName = new Map(regularities.map((r) => [r.courseName, r]));
  return (
    <div className="dash-panel">
      <h3 className="dash-panel-title">Materias cursadas</h3>
      {courses.length === 0 ? (
        <p className="users-empty">Todavía no tenés cursadas registradas.</p>
      ) : (
        <ul className="dash-list">
          {courses.map((c, i) => {
            const showRegularity = c.result === "REGULAR" && c.regularityStatus;
            const lines = showRegularity ? studentRegularityLines(byName.get(c.courseName) ?? { status: c.regularityStatus }) : [];
            return (
            <li key={`${c.courseName}-${c.sectionName}-${c.academicYear}-${c.term}-${i}`} className="dash-list-item">
              <div>
                <p className="dash-list-item-title">
                  {c.courseName} — Comisión {c.sectionName}
                </p>
                <p className="dash-list-item-sub">
                  {c.academicYear} · {c.term}° cuatrimestre
                  {c.finalGrade != null ? ` · nota ${c.finalGrade}` : ""}
                </p>
                {lines.map((line) => (
                  <p key={line} className="dash-list-item-sub">{line}</p>
                ))}
              </div>
              {showRegularity ? (
                <span className={`users-badge users-badge--${REGULARITY_BADGE[c.regularityStatus] ?? "navy"}`}>
                  {regularityLabel(c.regularityStatus)}
                </span>
              ) : (
                <span className={RESULT_BADGE_CLASS[c.result] ?? "dash-badge dash-badge--gray"}>
                  {RESULT_LABELS[c.result] ?? c.result}
                </span>
              )}
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
