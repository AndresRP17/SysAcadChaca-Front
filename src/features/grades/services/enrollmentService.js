import { api } from "../../../shared/api/api";

// Endpoint local de referencia (todavia no existe en el backend real: es la
// tarea de Santiago, "Backend Inscripcion Cursadas", en curso). La forma que
// asumimos aca es la que ya probamos en la rama local del backend.
export async function getEnrollmentsBySection(sectionId) {
  const { data } = await api.get(`/enrollments?section_id=${sectionId}&size=1000`);
  return data;
}
