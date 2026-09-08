export default function SearchBar({ value, onChange }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Buscar por nombre, apellido, legajo o email..."
      className="users-search-input"
    />
  );
}
