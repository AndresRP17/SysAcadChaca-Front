import { api } from "../../../shared/api/api";
import { buildParams } from "../../../shared/utils/formatters";
import { cleanParams, toPage } from "../../users/services/pagedList";

export async function getEquivalences(filters = {}) {
  const qs = buildParams({ ...filters, size: 500 });
  const { data } = await api.get(`/equivalences?${qs}`);
  return data;
}

// Una página de equivalencias filtrada en el servidor: { items, total }.
// includeUnassigned: con evaluador, suma las que todavía no tienen (bandeja del docente).
export async function getEquivalencesPage({ q, status, type, studentId, evaluatorTeacherId, includeUnassigned, page = 1, size = 10 } = {}) {
  const response = await api.get("/equivalences", {
    params: cleanParams({
      q,
      status,
      type,
      student_id: studentId,
      evaluator_teacher_id: evaluatorTeacherId,
      include_unassigned: includeUnassigned ? "1" : "",
      page,
      size,
    }),
  });
  return toPage(response);
}

export async function createEquivalence(body) {
  const { data } = await api.post("/equivalences", body);
  return data;
}

export async function updateEquivalence(id, body) {
  const { data } = await api.put(`/equivalences/${id}`, body);
  return data;
}

export async function deleteEquivalence(id) {
  await api.delete(`/equivalences/${id}`);
}

export async function assignEvaluator(id, teacherId) {
  const { data } = await api.put(`/equivalences/${id}/evaluator`, { teacher_id: teacherId });
  return data;
}

export async function approveEquivalence(id, grade) {
  const { data } = await api.put(`/equivalences/${id}/approve`, grade ? { grade } : {});
  return data;
}

export async function rejectEquivalence(id) {
  const { data } = await api.put(`/equivalences/${id}/reject`);
  return data;
}

export async function getCoursesWithoutSections(academicYear) {
  const qs = buildParams({ academic_year: academicYear });
  const { data } = await api.get(`/curriculum-courses/without-sections?${qs}`);
  return data;
}
