export default function UpcomingEvents({ eventos }) {
  return (
    <div className="dash-panel">
      <h3 className="dash-panel-title">Próximos eventos</h3>
      <ul className="dash-list">
        {eventos.map((e) => (
          <li key={e.id} className="dash-list-item">
            <div>
              <p className="dash-list-item-title">{e.detalle}</p>
              <p className="dash-list-item-sub">{e.tipo}</p>
            </div>
            <span className="dash-event-date">{e.fecha}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
