const STATUS_LABELS = { pending: "Pendiente", present: "Presente", absent: "Ausente" };

function outcomeLabel(exam) {
  if (exam.status !== "present") return STATUS_LABELS[exam.status] ?? exam.status;
  if (exam.finalGrade == null) return "Presente";
  return exam.finalGrade >= 6 ? `Aprobado · ${exam.finalGrade}` : `Desaprobado · ${exam.finalGrade}`;
}

export default function HistoryExamList({ exams }) {
  return (
    <div className="dash-panel">
      <h3 className="dash-panel-title">Finales rendidos</h3>
      {exams.length === 0 ? (
        <p className="users-empty">Todavía no rendiste ningún final.</p>
      ) : (
        <ul className="dash-list">
          {exams.map((e, i) => (
            <li key={`${e.courseName}-${e.scheduledAt}-${i}`} className="dash-list-item">
              <div>
                <p className="dash-list-item-title">{e.courseName}</p>
                <p className="dash-list-item-sub">{e.scheduledAt}</p>
              </div>
              <span className="dash-badge dash-badge--navy">{outcomeLabel(e)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
