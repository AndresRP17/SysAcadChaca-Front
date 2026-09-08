export default function MateriaCard({ subject, info, expanded, onToggle }) {
  const { habilitada, missing } = info;

  return (
    <div
      className={
        "correlativas-card" + (habilitada ? " correlativas-card--ok" : " correlativas-card--blocked")
      }
    >
      <button
        type="button"
        className="correlativas-card-header"
        onClick={onToggle}
        aria-expanded={expanded}
        disabled={habilitada}
      >
        <div className="correlativas-card-info">
          <span className="correlativas-card-name">{subject.name}</span>
          <span className="correlativas-card-quarter">{subject.quarter}</span>
        </div>

        <span
          className={
            "correlativas-status" + (habilitada ? " correlativas-status--ok" : " correlativas-status--blocked")
          }
        >
          {habilitada ? "Habilitada" : `Faltan ${missing.length}`}
        </span>
      </button>

      {!habilitada && expanded && (
        <ul className="correlativas-missing-list">
          {missing.map((item, i) => (
            <li key={i} className="correlativas-missing-item">
              <span>{item.subjectName}</span>
              <span className="correlativas-ordinance">Ord. {item.ordinance}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
