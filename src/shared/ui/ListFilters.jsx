import "./ListFilters.css";

// Barra de filtros de una lista: buscador + selects + "Limpiar filtros".
// selects: [{ id, label, value, onChange, options: [{ value, label }], allLabel }]
// Sin onSearchChange no se muestra el buscador (listas que solo filtran con selects).
// children: campos extra (p. ej. fechas) que se muestran antes de "Limpiar filtros".
// El estado (y la espera antes de pedir al servidor) lo maneja quien la usa.
export default function ListFilters({
  idPrefix,
  search,
  onSearchChange,
  searchLabel,
  searchPlaceholder,
  selects = [],
  hasFilters,
  onClear,
  children,
}) {
  return (
    <div className="list-filters">
      {onSearchChange && (
        <div className="users-form-field list-filters-search">
          <label className="users-form-label" htmlFor={`${idPrefix}-search`}>{searchLabel}</label>
          <input
            id={`${idPrefix}-search`}
            type="search"
            autoComplete="off"
            className="users-form-input"
            value={search}
            placeholder={searchPlaceholder}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}
      {selects.map((s) => (
        <div className="users-form-field" key={s.id}>
          <label className="users-form-label" htmlFor={`${idPrefix}-${s.id}`}>{s.label}</label>
          <select
            id={`${idPrefix}-${s.id}`}
            className="users-form-input"
            value={s.value}
            onChange={(e) => s.onChange(e.target.value)}
          >
            <option value="">{s.allLabel ?? "Todos"}</option>
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      ))}
      {children}
      <div className="list-filters-actions">
        <button type="button" className="users-btn users-btn--ghost" disabled={!hasFilters} onClick={onClear}>
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}
