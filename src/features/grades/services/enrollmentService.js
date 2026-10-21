import { api } from "../../../shared/api/api";

export async function getEnrollmentsBySection(sectionId) {
  const { data } = await api.get(`/enrollments?section_id=${sectionId}&status=active&size=1000`);
  return data;
}

// Cursada por equivalencia aprobada: el backend le completa asistencia y notas solo
// (y no deja cargarlas a mano), asi que las pantallas la muestran fija.
export function isByEquivalence(enrollment) {
  return enrollment?.equivalenceId != null;
}
