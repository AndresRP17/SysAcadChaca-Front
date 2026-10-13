export default function SearchBar({ value, onChange }) {
  return (
    <input
      type="search"
      aria-label="Buscar por nombre, apellido, legajo, DNI o email"
      autoComplete="off"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Buscar por nombre, apellido, legajo, DNI o email..."
      className="users-search-input"
    />
  );
}
