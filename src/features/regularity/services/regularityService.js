import { api } from "../../../shared/api/api";
import { buildParams } from "../../../shared/utils/formatters";

export const REGULARITY_LOST = "REGULARITY_LOST";
export const COURSE_ALREADY_REGULAR = "COURSE_ALREADY_REGULAR";

// Reglas institucionales: las lee cualquier usuario autenticado y las edita el Administrador.
export async function getRegularityRules() {
  const { data } = await api.get("/regularity-rules");
  return data;
}

// payload: los seis campos en snake_case (ver formToPayload en regularityRules.js).
export async function updateRegularityRules(payload) {
  const { data } = await api.put("/regularity-rules", payload);
  return data;
}

// Regularidad por materia. Sin studentId: el alumno logueado. status: LOST | REGULAR | APPROVED.
export async function getStudentRegularity({ studentId, status } = {}) {
  const qs = buildParams({ status });
  const base = studentId ? `/students/${studentId}/regularity` : "/students/me/regularity";
  const { data } = await api.get(qs ? `${base}?${qs}` : base);
  return data;
}

export async function revalidateRegularity({ studentId, courseId, reason }) {
  const { data } = await api.post(`/students/${studentId}/courses/${courseId}/regularity/revalidate`, { reason });
  return data;
}
