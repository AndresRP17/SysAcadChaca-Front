// Refleja la tabla `roles` de la DB (id, name, description).
// Cuando haya API, este archivo se reemplaza por un fetch a GET /roles.
export const roles = [
  { id: 1, name: "Administrador", description: "Administra carreras, materias, planes y usuarios." },
  { id: 2, name: "Docente", description: "Dicta materias y gestiona sus comisiones." },
  { id: 3, name: "Alumno", description: "Cursa materias según su plan de estudio." },
  {
    id: 4,
    name: "Bedel",
    description: "Gestiona comisiones, aulas, horarios y mesas de examen. No administra carreras, materias, planes ni usuarios.",
  },
];

export function getRoleByName(name) {
  return roles.find((r) => r.name === name);
}
