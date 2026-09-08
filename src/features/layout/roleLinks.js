// Qué ve cada rol en la barra de navegación y a dónde lo mandamos después
// del login. Administrador tiene acceso total (según roles.description en
// el backend); Bedel no administra carreras/materias/planes/usuarios, así
// que no ve esas pantallas; Docente y Bedel todavía no tienen vistas
// propias construidas, por eso su lista queda vacía por ahora.
export const LINKS_BY_ROLE = {
  Administrador: ["usuarios", "planes"],
  Alumno: ["alumno"],
  Docente: [],
  Bedel: [],
};

export function getDefaultRouteForRole(role) {
  const keys = LINKS_BY_ROLE[role] ?? [];
  if (keys.includes("usuarios")) return "/usuarios";
  if (keys.includes("planes")) return "/planes";
  if (keys.includes("alumno")) return "/alumno";
  // Docente y Bedel todavía no tienen ninguna vista propia — mandarlos a
  // /usuarios (o cualquier ruta con guard) generaría un loop de redirects.
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
