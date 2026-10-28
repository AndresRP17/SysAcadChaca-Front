import { useEffect, useId, useRef, useState } from "react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { createLatestGuard, SEARCH_DEBOUNCE_MS } from "./searchOptions";
import "./Combobox/Combobox.css";

// Combo con busqueda en el servidor: espera SEARCH_DEBOUNCE_MS sin teclear y llama a loadOptions(q), que
// devuelve { items: [{ value, label, data }], total } (o directamente el array de opciones). Asi no se baja
// toda la tabla al navegador.
//   value / onChange(value, option)  id elegido ("" si no hay) y la opcion completa (option.data = registro)
//   loadSelected(value)              resuelve la opcion de un id inicial (al editar); si no esta, se muestra el id
//   initialOption                    opcion ya conocida del valor inicial (evita el pedido)
//   browse                           true: con el campo vacio ya lista los primeros resultados
export default function SearchCombobox({
  value,
  onChange,
  loadOptions,
  loadSelected,
  initialOption,
  placeholder,
  id,
  ariaLabel,
  browse = false,
  hint = "Escribí para buscar...",
  emptyLabel = "Sin resultados",
  disabled = false,
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const guardRef = useRef(null);
  if (guardRef.current === null) guardRef.current = createLatestGuard();
  const guard = guardRef.current;
  const selectedGuardRef = useRef(null);
  if (selectedGuardRef.current === null) selectedGuardRef.current = createLatestGuard();
  const selectedGuard = selectedGuardRef.current;

  const [selected, setSelected] = useState(initialOption ?? null);
  const [query, setQuery] = useState(initialOption ? initialOption.label : "");
  const [dirty, setDirty] = useState(false); // el usuario tecleo desde la ultima seleccion
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const debounced = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const term = dirty ? debounced : "";
  // Mientras el usuario teclea y el debounce no llego, la lista todavia es de la busqueda anterior.
  const settling = dirty && query.trim() !== debounced;

  // Resuelve el valor que viene de afuera (id inicial al editar, o limpiado por la pantalla).
  useEffect(() => {
    if (value === "" || value === null || value === undefined) {
      setSelected(null);
      if (!dirty) setQuery("");
      return undefined;
    }
    if (selected && String(selected.value) === String(value)) return undefined;
    if (initialOption && String(initialOption.value) === String(value)) {
      setSelected(initialOption);
      setQuery(initialOption.label);
      return undefined;
    }
    if (!loadSelected) {
      setQuery(String(value));
      return undefined;
    }
    const ticket = selectedGuard.next();
    loadSelected(value)
      .then((option) => {
        if (!selectedGuard.isLatest(ticket) || !option) return;
        setSelected(option);
        setQuery(option.label);
        setDirty(false);
      })
      .catch(() => {
        if (selectedGuard.isLatest(ticket)) setQuery(String(value));
      });
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Busqueda en el servidor; solo la ultima respuesta pedida actualiza la lista.
  useEffect(() => {
    if (!open) return undefined;
    if (term === "" && !browse) {
      guard.invalidate();
      setOptions([]);
      setTotal(0);
      setLoading(false);
      setError(false);
      return undefined;
    }
    const ticket = guard.next();
    setLoading(true);
    setError(false);
    Promise.resolve(loadOptions(term))
      .then((result) => {
        if (!guard.isLatest(ticket)) return;
        const items = Array.isArray(result) ? result : result.items;
        setOptions(items);
        setTotal(Array.isArray(result) ? items.length : result.total ?? items.length);
        setHighlight(items.length > 0 ? 0 : -1);
        setLoading(false);
      })
      .catch(() => {
        if (!guard.isLatest(ticket)) return;
        setOptions([]);
        setTotal(0);
        setError(true);
        setLoading(false);
      });
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, term, browse]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) close();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  });

  function close() {
    setOpen(false);
    setDirty(false);
    setQuery(selected ? selected.label : "");
  }

  function pick(option) {
    setSelected(option);
    setQuery(option.label);
    setDirty(false);
    setOpen(false);
    onChange(option.value, option);
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (options.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setHighlight((h) => (h + step + options.length) % options.length);
    } else if (e.key === "Enter") {
      if (open) {
        e.preventDefault();
        if (highlight >= 0 && options[highlight] && !settling) pick(options[highlight]);
      }
    } else if (e.key === "Escape" && open) {
      e.stopPropagation();
      close();
    } else if (e.key === "Tab") {
      close();
    }
  }

  const showHint = !loading && !settling && !error && term === "" && !browse;
  const showEmpty = !loading && !settling && !error && !showHint && options.length === 0;
  const showTotal = !loading && !settling && !error && total > options.length;
  const activeId = open && highlight >= 0 && options[highlight] ? `${listId}-opt-${highlight}` : undefined;

  return (
    <div className="combobox" ref={rootRef}>
      <input
        id={id}
        type="text"
        className="users-form-input"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        aria-busy={loading || settling}
        aria-label={id ? undefined : ariaLabel ?? placeholder}
        autoComplete="off"
        disabled={disabled}
        value={query}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setDirty(true);
          setOpen(true);
          if (value) onChange("", null);
        }}
      />
      {open && (
        <ul className="combobox-list" id={listId} role="listbox">
          {(loading || settling) && <li className="combobox-empty" role="status">Buscando...</li>}
          {error && <li className="combobox-empty" role="status">No pudimos buscar. Probá de nuevo.</li>}
          {showHint && <li className="combobox-empty">{hint}</li>}
          {showEmpty && <li className="combobox-empty">{emptyLabel}</li>}
          {!loading && !settling && options.map((option, i) => (
            <li
              key={option.value}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={String(option.value) === String(value)}
              className={`combobox-option ${String(option.value) === String(value) ? "combobox-option--active" : ""} ${i === highlight ? "combobox-option--highlight" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(option);
              }}
              onMouseEnter={() => setHighlight(i)}
            >
              {option.label}
            </li>
          ))}
          {showTotal && (
            <li className="combobox-empty" role="status">Mostrando {options.length} de {total}. Afiná la búsqueda para ver otros.</li>
          )}
        </ul>
      )}
    </div>
  );
}
