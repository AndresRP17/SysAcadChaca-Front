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
// Comisiones que el servidor ofrece al alumno con las mismas reglas que la inscripción (plan, correlativas,
// cupo, horarios, materia ya aprobada/regularizada, período). Sin studentId: el alumno logueado.
// includeBlocked (solo Bedel/Admin): también las bloqueadas, con blockedReasons. includeEnrolled: suma las
// comisiones donde el alumno ya está inscripto, con enrollmentId, para armar "Mis cursadas" en el mismo pedido.
export async function getEnrollableSections({ studentId, includeBlocked = false, includeEnrolled = false } = {}) {
  const qs = buildParams({
    include_blocked: includeBlocked ? 1 : undefined,
    include_enrolled: includeEnrolled ? 1 : undefined,
  });
  const base = studentId ? `/students/${studentId}/enrollable-sections` : "/students/me/enrollable-sections";
  const { data } = await api.get(qs ? `${base}?${qs}` : base);
  return data;
}

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
