import { useEffect, useRef, useState } from "react";
import "./Combobox.css";

// Input de texto + lista desplegable de opciones filtradas. Reemplaza el
// patrón de "input de búsqueda separado + <select>" por un único control.
// options: [{ value, label, searchText? }]
export default function Combobox({ options, value, onChange, placeholder, emptyLabel = "Sin resultados" }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    setQuery(selected ? selected.label : "");
  }, [selected?.label]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery(selected ? selected.label : "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected]);

  const q = query.trim().toLowerCase();
  const filtered = options.filter((o) => {
    if (!q || (selected && q === selected.label.toLowerCase())) return true;
    return (o.searchText ?? o.label).toLowerCase().includes(q);
  });

  function pick(option) {
    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
  }

  return (
    <div className="combobox" ref={rootRef}>
      <input
        type="text"
        className="users-form-input"
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onChange("");
        }}
      />
      {open && (
        <ul className="combobox-list">
          {filtered.length === 0 && <li className="combobox-empty">{emptyLabel}</li>}
          {filtered.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                className={`combobox-option ${String(option.value) === String(value) ? "combobox-option--active" : ""}`}
                onClick={() => pick(option)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
