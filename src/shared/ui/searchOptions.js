// Opciones de los combos con busqueda en el servidor: { value, label, data }.
// `data` conserva el registro completo para que la pantalla use mas campos del elegido (plan, nombre, etc.).

export const SEARCH_DEBOUNCE_MS = 300;
export const SEARCH_PAGE_SIZE = 20;

export function studentOption(s) {
  const label = `${s.lastName}, ${s.firstName} — legajo ${s.enrollmentNumber} (DNI ${s.nationalId})`;
  return { value: s.id, label: s.programName ? `${label} · ${s.programName}` : label, data: s };
}

export function teacherOption(t) {
  return { value: t.id, label: `${t.lastName}, ${t.firstName} — legajo ${t.employeeNumber}`, data: t };
}

// Descarta las respuestas de busquedas viejas: solo la ultima pedida puede actualizar la lista.
export function createLatestGuard() {
  let current = 0;
  return {
    next: () => ++current,
    isLatest: (ticket) => ticket === current,
    invalidate: () => {
      current += 1;
    },
  };
}
