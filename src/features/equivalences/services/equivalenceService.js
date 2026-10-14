import { api } from "../../../shared/api/api";
import { buildParams } from "../../../shared/utils/formatters";

export async function getEquivalences(filters = {}) {
  const qs = buildParams({ ...filters, size: 500 });
  const { data } = await api.get(`/equivalences?${qs}`);
  return data;
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
