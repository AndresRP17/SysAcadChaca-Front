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

export async function getEnrollments({ studentId, sectionId, status } = {}) {
  const qs = buildParams({ student_id: studentId, section_id: sectionId, status, size: 1000 });
  const { data } = await api.get(`/enrollments?${qs}`);
  return data;
}

// outOfTerm: { reason } cuando el Bedel/Administrador confirma inscribir fuera del periodo.
export async function createEnrollment({ studentId, sectionId, outOfTerm = null }) {
  const res = await api.post("/enrollments", {
    student_id: studentId,
    section_id: sectionId,
    status: ENROLLMENT_STATUS.ENROLLED,
    ...(outOfTerm ? { out_of_term: true, out_of_term_reason: outOfTerm.reason } : {}),
  });
  return res.data;
}

export async function deleteEnrollment(id) {
  await api.delete(`/enrollments/${id}`);
}
