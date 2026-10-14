import { STATUS_BADGE_CLASS, STATUS_LABELS, TYPE_LABELS } from "../equivalenceLabels";

// Tarjetas apiladas en celular y tabla en escritorio (mismo patron que users-table).
// renderActions(item) devuelve los botones de cada fila.
export default function EquivalenceList({ items, showStudent, renderActions }) {
  return (
    <div className="users-table-wrapper">
      <table className="users-table">
        <thead>
          <tr>
            {showStudent && <th className="users-th">Alumno</th>}
            <th className="users-th">Materia a reconocer</th>
            <th className="users-th">Tipo</th>
            <th className="users-th">Origen / motivo</th>
            <th className="users-th users-th--center">Nota</th>
            <th className="users-th users-th--center">Estado</th>
            <th className="users-th">Evaluador</th>
            <th className="users-th users-th--actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((e) => (
            <tr key={e.id} className="users-row" data-testid="equiv-row">
              {showStudent && (
                <td className="users-td" data-label="Alumno">
                  {e.studentLastName}, {e.studentFirstName}
                  <span className="equiv-sub">legajo {e.enrollmentNumber}</span>
                </td>
              )}
              <td className="users-td" data-label="Materia a reconocer">
                {e.courseName}
                <span className="equiv-sub">{e.courseCode}</span>
              </td>
              <td className="users-td" data-label="Tipo">{TYPE_LABELS[e.type] ?? e.type}</td>
              <td className="users-td" data-label="Origen / motivo">
                {e.type === "INTERNAL" ? (
                  e.reason || "—"
                ) : (
                  <>
                    {e.originCourse}
                    <span className="equiv-sub">{e.originInstitution}</span>
                  </>
                )}
              </td>
              <td className="users-td users-td--center" data-label="Nota">
                {e.originGrade != null ? Number(e.originGrade).toString() : "—"}
              </td>
              <td className="users-td users-td--center" data-label="Estado">
                <span className={STATUS_BADGE_CLASS[e.status]}>{STATUS_LABELS[e.status] ?? e.status}</span>
                {e.resolutionDate && <span className="equiv-sub">{e.resolutionDate}</span>}
              </td>
              <td className="users-td" data-label="Evaluador">{e.evaluatorTeacherName || "Sin asignar"}</td>
              <td className="users-td users-td--actions equiv-actions">{renderActions(e)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
