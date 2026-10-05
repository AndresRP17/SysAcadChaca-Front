import { formatDateTime } from "../../../shared/utils/formatters";

// Próximas mesas de final en las que el alumno está inscripto (ver
// useStudentExamBoards().enrolled), ordenadas por fecha ascendente y ya
// filtradas a futuro — SIU-Guaraní las muestra junto con las cursadas en una
// sola "Agenda", acá van en una lista aparte porque una mesa es una fecha
// puntual, no algo que entre en la grilla semanal.
export default function UpcomingExamBoards({ boards }) {
  return (
    <div className="dash-panel">
      <h3 className="dash-panel-title">Próximas mesas de final</h3>
      {boards.length === 0 ? (
        <p className="users-empty">No tenés mesas de final próximas.</p>
      ) : (
        <ul className="dash-list">
          {boards.map(({ enrollment, board }) => (
            <li key={enrollment.id} className="dash-list-item">
              <div>
                <p className="dash-list-item-title">{board.courseName}</p>
                {board.classroomName && (
                  <p className="dash-list-item-sub">Aula {board.classroomName}</p>
                )}
              </div>
              <span className="dash-event-date">{formatDateTime(board.scheduledAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
