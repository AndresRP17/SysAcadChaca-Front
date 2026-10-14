import { useEffect, useState } from "react";

// Devuelve `value` recién después de `delay` ms sin cambios: sirve para no pedir al servidor en cada tecla del buscador.
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
