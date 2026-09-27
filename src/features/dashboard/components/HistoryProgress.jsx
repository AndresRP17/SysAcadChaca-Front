export default function HistoryProgress({ progress }) {
  const { approvedCourses, totalCourses, percentage } = progress;

  return (
    <div className="dash-panel">
      <h3 className="dash-panel-title">Avance de la carrera</h3>
      {percentage === null ? (
        <p className="users-empty">El plan de estudio todavía no tiene materias cargadas.</p>
      ) : (
        <>
          <p className="dash-list-item-sub">
            {approvedCourses} de {totalCourses} materias aprobadas
          </p>
          <div className="history-progress-bar">
            <div className="history-progress-bar-fill" style={{ width: `${percentage}%` }} />
          </div>
          <p className="dash-list-item-sub">{percentage}%</p>
        </>
      )}
    </div>
  );
}
