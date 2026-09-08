export default function CourseList({ materias }) {
  return (
    <div className="dash-panel">
      <h3 className="dash-panel-title">Materias en curso</h3>
      <ul className="dash-list">
        {materias.map((m) => (
          <li key={m.id} className="dash-list-item">
            <div>
              <p className="dash-list-item-title">{m.nombre}</p>
              <p className="dash-list-item-sub">{m.docente}</p>
            </div>
            <span
              className={
                "dash-badge " +
                (m.estado === "Cursando" ? "dash-badge--navy" : "dash-badge--gray")
              }
            >
              {m.estado}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
