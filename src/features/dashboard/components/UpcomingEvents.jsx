import { formatDateTime } from "../../../shared/utils/formatters";

// Las inscripciones vienen con fecha sola ("YYYY-MM-DD"); las mesas, con hora.
function formatEventDate(value) {
  return value.length === 10 ? formatDateTime(value).slice(0, 10) : formatDateTime(value);
}

export default function UpcomingEvents({ events }) {
  return (
    <div className="dash-panel">
      <h3 className="dash-panel-title">Próximos eventos</h3>
      {events.length === 0 ? (
        <p className="users-empty">No tenés eventos próximos.</p>
      ) : (
        <ul className="dash-list">
          {events.map((e) => (
            <li key={`${e.type}-${e.detail}-${e.date}`} className="dash-list-item">
              <div>
                <p className="dash-list-item-title">{e.detail}</p>
                <p className="dash-list-item-sub">{e.type}</p>
              </div>
              <span className="dash-event-date">{formatEventDate(e.date)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
