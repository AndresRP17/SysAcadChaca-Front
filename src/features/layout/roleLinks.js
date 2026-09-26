// Qué ve cada rol en la barra de navegación y a dónde lo mandamos después
// del login. Administrador tiene acceso total (según roles.description en
// el backend); Bedel gestiona comisiones/aulas/horarios/mesas de examen
// (IsAdministradorValidatorService/assertHasAnyRole en Classroom/Section/
// SectionSchedule ya lo permite en el backend) pero no administra
// carreras/materias/planes/usuarios; Docente ahora tiene la Planilla
// (asistencia/notas) — ver planillaDocentePage.
export const LINKS_BY_ROLE = {
  Administrador: ["usuarios", "planes", "cursadas", "actas"],
  Alumno: ["alumno", "mis-cursadas", "finales"],
  Docente: ["mis-comisiones", "planilla"],
  Bedel: ["cursadas", "actas"],
};

export function getDefaultRouteForRole(role) {
  const keys = LINKS_BY_ROLE[role] ?? [];
  if (keys.includes("usuarios")) return "/usuarios";
  if (keys.includes("planes")) return "/planes";
  if (keys.includes("cursadas")) return "/cursadas";
  if (keys.includes("actas")) return "/actas";
  if (keys.includes("alumno")) return "/alumno";
  if (keys.includes("mis-cursadas")) return "/mis-cursadas";
  if (keys.includes("mis-comisiones")) return "/mis-comisiones";
  if (keys.includes("planilla")) return "/planilla";
  return "/sin-acceso";
}

// A qué roles les corresponde ver una ruta dada, derivado de LINKS_BY_ROLE
// (misma fuente de verdad que usa el Sidebar) para que nunca queden
// desincronizados el menú y el guard de rutas.
export function getRolesAllowedForLink(key) {
  return Object.entries(LINKS_BY_ROLE)
    .filter(([, keys]) => keys.includes(key))
    .map(([role]) => role);
}
