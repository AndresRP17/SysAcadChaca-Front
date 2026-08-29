const ROLES = ["Todos", "Alumno", "Docente"];

export default function FilterBar({ value, onChange }) {
  return (
    <div className="users-filter-bar">
      {ROLES.map((rol) => (
        <button
          key={rol}
          type="button"
          className={
            "users-filter-btn" + (value === rol ? " users-filter-btn--active" : "")
          }
          onClick={() => onChange(rol)}
        >
          {rol}
        </button>
      ))}
    </div>
  );
}
