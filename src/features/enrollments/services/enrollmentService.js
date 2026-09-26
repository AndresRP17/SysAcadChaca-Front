import { api } from "../../../shared/api/api";
import { buildParams } from "../../../shared/utils/formatters";

// Estados de la columna enrollments.status. Si en el backend quedaron con otros
// nombres, alcanza con cambiarlos acá: el resto de la feature usa estas constantes.
export const ENROLLMENT_STATUS = {
  ENROLLED: "INSCRIPTO",
  REGULAR: "REGULAR",
  PASSED: "APROBADO",
  FAILED: "LIBRE",
};

export async function getEnrollments({ studentId, sectionId } = {}) {
  const qs = buildParams({ student_id: studentId, section_id: sectionId, size: 1000 });
  const { data } = await api.get(`/enrollments?${qs}`);
  return data;
}

export async function createEnrollment({ studentId, sectionId }) {
  const res = await api.post("/enrollments", {
    student_id: studentId,
    section_id: sectionId,
    status: ENROLLMENT_STATUS.ENROLLED,
  });
  return res.data;
}

export async function deleteEnrollment(id) {
  await api.delete(`/enrollments/${id}`);
}
